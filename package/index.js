/**
 * 闪验小程序 SDK 入口
 *
 * 【整体架构说明】
 * 小程序开发者接入本 SDK 后，调用流程如下：
 *
 *   开发者小程序 ──init(appId)──▶ 闪验SDK ──请求创蓝服务端──▶ 获取各运营商取号参数
 *                                             │
 *                                             ├── 移动：cmccAppId, cmccAppKey,cmccSign, cmccTimestamp
 *                                             ├── 联通：cuccAppId, cuccSign, cuccTimestamp
 *                                             └── 电信：ctccAppId, ctccSign
 *                                                       │
 *   开发者小程序 ◀──openLoginAuth 回调── 闪验SDK ◀──微信插件 ──使用下发参数取号
 *                                             │
 *                                             └── 拉起运营商授权页，用户授权后返回 token
 *                                                       │
 *   开发者服务端 ◀──getMobile(appkey)── 业务服务端 ──请求创蓝服务端──▶ 获取加密手机号
 *                                                       │
 *   开发者服务端 ──用 appkey AES 解密──▶ 明文手机号
 *
 * 【重要说明】
 * - init 传入 appId 初始化 SDK
 * - appkey 用于 getMobile 接口签名及手机号解密，建议在业务服务端调用，小程序端不封装此方法
 * - openLoginAuth 使用的 appId：服务端下发的移动专用 appId（cmccAppId），用于调用微信取号插件
 *   两者不同，不可混用！
 */

const config = require('./config');
const crypto = require('./crypto');
const {
  SUCCESS_INIT, SUCCESS_TOKEN,
  ERR_SERVER_EMPTY_RESPONSE, ERR_SERVER_REQUEST_FAILED,
  ERR_INIT_TIMEOUT,
  ERR_NOT_INITIALIZED, ERR_MOBILE_APPID_NOT_INIT,
  ERR_APPID_REQUIRED,
  ERR_SDK_INIT_ERR, ERR_SDK_RESPONSE_PROCESS_ERR,
  ERR_TOKEN_SIGN_CALC_ERR, ERR_TOKEN_UUID_GEN_ERR,
  ERR_TOKEN_PROCESS_ERR, ERR_TOKEN_PLUGIN_CALL_ERR,
  ERR_NETWORK_PROCESS_ERR, ERR_NETWORK_CALL_ERR,
  ERR_NETWORK_TYPE_FAILED,
  makeDynamicError,
} = require('./errors');
const { reportLog, setLog: setLogInternal, log, error, logDetail } = require('./log');

// 引入微信一键登录插件（安全加载，插件未配置时不崩溃）
// app.json 中配置： "plugins": { "auth-plugin": { "version": "2.2.0", "provider": "wx35678fec06d475b4" } }
// requirePlugin 返回插件命名空间对象，解构 oneKeyLogin 作为插件实例
let oneKeyLogin;
try {
  const plugin = requirePlugin('auth-plugin');
  oneKeyLogin = plugin && plugin.oneKeyLogin ? plugin.oneKeyLogin : null;
} catch (e) {
  error('[ShanYan] 加载 auth-plugin 插件失败:', e.message);
  oneKeyLogin = null;
}

/**
 * 格式化时间戳为 yyyyMMddHHmmssSSS（17位）
 * 例：20260521180001165
 * 注意：插件和服务端要求的是可读日期格式，而非 Unix epoch 毫秒数
 */
function formatTimestamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const HH = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const SSS = String(now.getMilliseconds()).padStart(3, '0');
  return `${yyyy}${MM}${dd}${HH}${mm}${ss}${SSS}`;
}

/**
 * 分隔线工具，用于日志输出中对齐
 */
const SEPARATOR = '=========================================';

// ============================ 枚举常量 ============================

// 日志上报状态：0=失败，1=成功
const REPORT_STATUS = {
  FAIL: 0,
  SUCCESS: 1,
};

// 日志上报阶段标识
const PROCESS_NAME = {
  INIT: '1',      // 初始化阶段
  TOKEN_OK: '4',  // openLoginAuth 正常完成（成功或用户取消）
  TOKEN_ERR: '3', // openLoginAuth 异常（非用户主动取消）
};

// ============================ 缓存键 ============================

const CACHE_KEY = 'shanyan_init_cache';

// ============================ SDK 内部状态 ============================

const state = {
  // === 用户传入的参数 ===
  appId: '',          // 开发者在创蓝平台注册的应用 ID（必填）

  // === 服务端接口下发的参数 ===
  traceId: '',        // 请求追踪 ID（服务端返回或本地生成）
  timestamp: '',      // 服务端下发的时间戳（openLoginAuth 时使用）

  // === 移动运营商取号参数（由服务端 init 接口下发，openLoginAuth 时必须使用） ===
  cmccAppId: '',          // 移动专用 appId（不同于用户传入的 appId）
  cmccAppKey: '',          // 移动专用 cmccAppKey
  cmccSign: '',           // 移动签名
  cmccTimestamp: '',      // 移动时间戳
  cmccValidateSign: '',   // 移动校验签名（优先使用此字段）

  // === 其他状态 ===
  businessType: config.BUSINESS_TYPE,           // 业务类型，固定为 '8'
  version: config.VERSION,                      // 接口版本号，固定为 '1.0'
  did: '',            // 浏览器加密指纹（取号成功后从 JSSDK 响应中获取）
  networkType: '',      // 当前网络类型（wifi/4g/5g/none）
  telcom: 'Unknown_Operator',  // 运营商标识（init时未知，取号后根据token前缀自动识别）
  initialized: false,   // SDK 是否已初始化（向后兼容，与 initState 联动）
  initState: 'none',    // 初始化状态机：'none' | 'pending' | 'success' | 'failed'
  initPendingCallbacks: [], // openLoginAuth 等待 init 完成的队列 [{cfg, callback}]
  sid: '',              // 会话ID：从init生成，贯穿初始化到获取token的完整流程
  logEnabled: false,    // 日志输出开关：true=输出 SDK 内部 console 日志，false=静默（默认关闭）
  reportEnabled: true,  // 日志上报开关：true=上报到创蓝日志服务器（默认开启），false=不上报
  fullReportEnabled: true, // 完整日志上报开关：true=获取device/deviceName/osVersion/netType字段（默认开启），false=不获取

  // === 超时配置 ===
  initTimeoutMs: 6000,       // init 默认超时时间 6 秒
};

// ============================ 工具函数 ============================

/**
 * 检查是否为 Object 类型
 */
function isObj(value) {
  return Object.prototype.toString.call(value).slice(8, -1) === 'Object';
}

/**
 * 检查是否为 Function 类型
 */
function isFunction(value) {
  return Object.prototype.toString.call(value).slice(8, -1) === 'Function';
}

/**
 * 刷新网络类型到 state.networkType
 * 异步获取，回调中更新 state，后续 reportLog 可拿到最新值
 */
function _refreshNetworkType() {
  try {
    wx.getNetworkType({
      success: (res) => {
        state.networkType = res.networkType || '';
        log('[ShanYan Network] 当前网络类型:', state.networkType);
      }
    });
  } catch (e) {
    // 获取失败不影响主流程
  }
}

// ============================ 公开 API ============================

/**
 * 初始化 SDK
 *
 * 【流程说明】
 * 1. 校验入参（appId 必填）
 * 2. 请求闪验服务端接口，获取各运营商（移动/联通/电信）的取号参数
 * 3. 保存服务端下发的参数，后续 openLoginAuth 时使用
 *
 * 【服务端接口】
 * - URL：调用当前环境初始化接口
 * - Method：POST
 * - Content-Type：application/x-www-form-urlencoded (form-data)
 * - 入参：appId=开发者应用ID&appPlatform=平台类型&data=&random=UUID&sdkVersion=SDK版本&sign=HMAC-SHA1签名
 * - 签名算法：hmacSHA1Encrypt(按字母顺序拼接字段值, md5(appId))
 *   签名原文：appId{appId}appPlatform{appPlatform}data{data}random{random}sdkVersion{sdkVersion}
 * - 出参：{ retCode: "0", data: { cmccAppId, cmccAppKey, cmccSign, cmccTimestamp, cmccValidateSign, traceId, ... } }
 *
 * @param {Object} params - 初始化参数
 * @param {string} params.appId - 创蓝平台分配的应用 ID（必填）
 * @param {Function} callback - 回调函数
 * @param {string} callback.code - 结果码，'200000'=成功
 * @param {string} callback.message - 结果描述
 * @param {string} callback.traceId - 请求追踪 ID
 *
 * @example
 * // stable 环境
 * SDK.setEnvironment('stable');
 * SDK.init({ appId: 'xxx' }, (res) => {
 *   if (res.code === '200000') {
 *     console.log('初始化成功');
 *   }
 * });
 *
 * // release 环境（默认）
 * SDK.init({ appId: 'xxx' }, (res) => {
 *   if (res.code === '200000') {
 *     console.log('初始化成功');
 *   }
 * });
 */
/**
 * 内部函数：执行初始化网络请求
 * @param {string} url - 请求地址
 * @param {string} requestData - 请求数据
 * @param {string} uuid - 日志追踪 ID
 * @param {string} sid - 会话 ID
 * @param {Function} onResult - 结果回调 (success, data, errorInfo)
 */
function _doInitRequest(url, requestData, uuid, sid, onResult) {
  wx.request({
    url: url,
    method: 'POST',
    data: requestData,
    header: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: state.initTimeoutMs,
    success: (res) => {
      try {
        logDetail('[ShanYan Init] HTTP 状态码:', res.statusCode);
        logDetail('[ShanYan Init] 服务端响应:', JSON.stringify(res.data));

        if (!res.data) {
          error('[ShanYan Init] 响应数据为空');
          onResult(false, null, {
            code: ERR_SERVER_EMPTY_RESPONSE.code,
            message: ERR_SERVER_EMPTY_RESPONSE.message,
            innerCode: ERR_SERVER_EMPTY_RESPONSE.code,
            innerDesc: ERR_SERVER_EMPTY_RESPONSE.message,
          });
          return;
        }

        if (res.data.retCode === '0') {
          const data = res.data.data;
          if (!data || typeof data !== 'object') {
            error('[ShanYan Init] 服务端返回数据格式异常');
            onResult(false, null, {
              code: ERR_SERVER_EMPTY_RESPONSE.code,
              message: '服务端返回数据格式异常',
              innerCode: ERR_SERVER_EMPTY_RESPONSE.code,
              innerDesc: '服务端返回数据为空或格式异常',
            });
            return;
          }

          log('[ShanYan Init] retCode 校验通过');
          onResult(true, data, null);
        } else {
          let retCode = res.data.retCode || 'unknown';
          let retMsg = res.data.retMsg || '初始化失败';
          let innerDesc = retMsg;

          if (retCode === 'unknown' && typeof res.data === 'string') {
            retCode = String(res.statusCode || 500);
            innerDesc = res.data;
            retMsg = '初始化失败';
          }
          error('[ShanYan Init] retCode:', retCode, 'retMsg:', retMsg);
          logDetail('[ShanYan Init] 完整响应:', JSON.stringify(res.data));
          onResult(false, null, { code: retCode, message: retMsg, innerCode: retCode, innerDesc: innerDesc });
        }
      } catch (e) {
        error('[ShanYan Init] 响应处理异常:', e.message);
        onResult(false, null, {
          code: ERR_SDK_RESPONSE_PROCESS_ERR.code,
          message: makeDynamicError(ERR_SDK_RESPONSE_PROCESS_ERR, e.message).message,
          innerCode: ERR_SDK_RESPONSE_PROCESS_ERR.code,
          innerDesc: makeDynamicError(ERR_SDK_RESPONSE_PROCESS_ERR, e.message).message,
        });
      }
    },
    fail: (err) => {
      error('[ShanYan Init] wx.request 失败');
      error('[ShanYan Init] 错误信息:', JSON.stringify(err));
      if (err && err.errMsg && err.errMsg.indexOf('timeout') !== -1) {
        return;
      }
      onResult(false, null, {
        code: ERR_SERVER_REQUEST_FAILED.code,
        message: makeDynamicError(ERR_SERVER_REQUEST_FAILED, err.errMsg || '').message,
        innerCode: ERR_SERVER_REQUEST_FAILED.code,
        innerDesc: makeDynamicError(ERR_SERVER_REQUEST_FAILED, err.errMsg || '').message,
      });
    }
  });
}

/**
 * 内部函数：完成初始化（设置状态、上报日志、回调、处理队列）
 * @param {boolean} success - 是否成功
 * @param {Object} data - 成功时的数据
 * @param {Object} errorInfo - 失败时的错误信息
 * @param {Function} callback - 用户回调
 * @param {string} uuid - 日志追踪 ID
 * @param {boolean} isRetry - 是否为重试结果
 */
function _completeInit(success, data, errorInfo, callback, uuid, isRetry) {
  if (success) {
    state.cmccAppId = data.cmccAppId;
    state.cmccAppKey = data.cmccAppKey;
    state.cmccSign = data.cmccSign;
    state.cmccTimestamp = data.cmccTimestamp;
    state.cmccValidateSign = data.cmccValidateSign;
    state.traceId = data.traceId || crypto.guid();
    state.timestamp = data.cmccTimestamp || formatTimestamp();
    state.initialized = true;
    state.initState = 'success';

    try {
      wx.setStorageSync(CACHE_KEY, {
        appId: state.appId,
        env: config.currentEnv,
        cmccAppId: state.cmccAppId,
        cmccAppKey: state.cmccAppKey,
        cmccSign: state.cmccSign,
        cmccTimestamp: state.cmccTimestamp,
        cmccValidateSign: state.cmccValidateSign,
        traceId: state.traceId,
        timestamp: state.timestamp,
      });
      log('[ShanYan Init] 本地初始化完成');
    } catch (e) {
      // 缓存写入失败不影响主流程
    }

    log('[ShanYan Init] 初始化完成:', state.traceId);
    log(SEPARATOR);

    try {
      if (state.reportEnabled) {
        reportLog({
          appId: state.appId,
          status: REPORT_STATUS.SUCCESS,
          telcom: 'Unknown_Operator',
          processName: PROCESS_NAME.INIT,
          resCode: SUCCESS_INIT.code,
          resDesc: SUCCESS_INIT.message,
          innerCode: isRetry ? 'retry_success' : SUCCESS_INIT.code,
          innerDesc: isRetry ? 'retry_success' : SUCCESS_INIT.message,
          netType: state.networkType,
          did: '',
          fullReport: state.fullReportEnabled,
          sid: state.sid,
        }, uuid);
      }
    } catch (e) {
      error('[ShanYan Init] 日志上报异常:', e.message);
    }

    const result = { ...SUCCESS_INIT, traceId: state.traceId };
    log('[ShanYan Init] 回调:', JSON.stringify(result));
    callback(result);
  } else {
    state.initState = 'failed';
    log(SEPARATOR);

    try {
      if (state.reportEnabled) {
        reportLog({
          appId: state.appId,
          status: REPORT_STATUS.FAIL,
          telcom: 'Unknown_Operator',
          processName: PROCESS_NAME.INIT,
          resCode: errorInfo.code,
          resDesc: errorInfo.message,
          innerCode: isRetry ? 'retry_fail' : errorInfo.innerCode,
          innerDesc: isRetry ? 'retry_fail' : errorInfo.innerDesc,
          netType: state.networkType,
          did: '',
          fullReport: state.fullReportEnabled,
          sid: state.sid,
        }, uuid);
      }
    } catch (logError) {
      error('[ShanYan Init] 日志上报异常:', logError.message);
    }

    const result = { code: errorInfo.code, message: errorInfo.message };
    log('[ShanYan Init] 回调:', JSON.stringify(result));
    callback(result);
  }

  _processInitQueue();
}

/**
 * 内部函数：处理等待初始化完成的 openLoginAuth 队列
 */
function _processInitQueue() {
  const queue = state.initPendingCallbacks;
  state.initPendingCallbacks = [];

  queue.forEach(item => {
    if (state.initState === 'success') {
      _executeOpenLoginAuth(item.cfg, item.callback);
    } else {
      const result = { code: ERR_NOT_INITIALIZED.code, message: '初始化失败' };
      log('[ShanYan Token] 回调:', JSON.stringify(result));
      item.callback(result);
    }
  });
}

/**
 * 初始化 SDK
 *
 * 调用流程：
 * 1. 参数校验 → 2. 缓存检查 → 3. 网络请求（失败自动重试一次） → 4. 回调结果
 *
 * 超时机制：
 * - 总超时时间由 setInitTimeout 设置（默认 6000ms）
 * - 超时后立即回调，但不取消网络请求
 * - 超时后不再二次回调
 *
 * 重试机制：
 * - 首次请求失败（网络错误、业务错误、响应异常）→ 自动切换备用域名重试一次
 * - 首次失败不上报日志、不回调
 * - 最终结果统一回调 + 上报日志
 *
 * @param {Object} params - 初始化参数
 * @param {string} params.appId - 应用 ID（必填）
 * @param {Function} callback - 初始化结果回调
 * @param {string} callback.code - 结果码
 * @param {string} callback.message - 结果描述
 * @param {string} [callback.traceId] - 追踪 ID（成功时返回）
 */
function init(params, callback) {
  log(SEPARATOR);
  log('[ShanYan Init] 开始初始化', params);

  if (isFunction(callback) === false) {
    callback = (res) => log('[ShanYan Init]', res);
  }

  if (!params || isObj(params) === false || !params.appId) {
    error('[ShanYan Init] appId 必传');
    log('[ShanYan Init] 回调:', JSON.stringify(ERR_APPID_REQUIRED));
    callback({ ...ERR_APPID_REQUIRED });
    return;
  }

  const useAppId = params.appId;
  state.appId = useAppId;

  try {
    const cached = wx.getStorageSync(CACHE_KEY);
    if (cached && cached.appId === useAppId && cached.env === config.currentEnv && cached.cmccAppId) {
      log('[ShanYan Init] 使用本地初始化');
      state.cmccAppId = cached.cmccAppId;
      state.cmccAppKey = cached.cmccAppKey;
      state.cmccSign = cached.cmccSign;
      state.cmccTimestamp = cached.cmccTimestamp;
      state.cmccValidateSign = cached.cmccValidateSign;
      state.traceId = cached.traceId;
      state.timestamp = cached.timestamp;
      state.initialized = true;
      state.initState = 'success';

      log('[ShanYan Init] 本地初始化完成:', state.traceId);
      log(SEPARATOR);

      try {
        const cacheUuid = crypto.guid();
        if (state.reportEnabled) {
          reportLog({
            appId: state.appId,
            status: REPORT_STATUS.SUCCESS,
            telcom: 'Unknown_Operator',
            processName: PROCESS_NAME.INIT,
            resCode: SUCCESS_INIT.code,
            resDesc: SUCCESS_INIT.message,
            innerCode: '0',
            innerDesc: 'cache',
            netType: state.networkType,
            did: '',
            fullReport: state.fullReportEnabled,
            sid: state.sid,
          }, cacheUuid);
        }
      } catch (e) {
        error('[ShanYan Init] 本地初始化日志上报异常:', e.message);
      }

      callback({ ...SUCCESS_INIT, traceId: state.traceId });
      _processInitQueue();
      return;
    }
  } catch (e) {
    // 缓存读取失败不影响主流程
  }

  if (state.fullReportEnabled) {
    _refreshNetworkType();

    if (!state._networkListenerRegistered) {
      state._networkListenerRegistered = true;
      try {
        wx.onNetworkStatusChange((res) => {
          state.networkType = res.networkType || '';
          log('[ShanYan Network] 网络变化:', state.networkType);
        });
      } catch (e) {
        // 监听失败不影响主流程
      }
    }
  }

  let uuid;
  let sid;
  let requestData;
  try {
    uuid = crypto.guid();
    sid = crypto.guid();
    state.sid = sid;

    const useData = '';
    const signText = `appId${useAppId}appPlatform${config.APP_PLATFORM}data${useData}random${uuid}sdkVersion${config.SDK_VERSION}`;
    logDetail('[ShanYan Init] 初始化签名字段:', signText);

    const signKey = crypto.md5(useAppId);
    const sign = crypto.hmacSHA1Encrypt(signText, signKey);

    requestData = `appId=${encodeURIComponent(useAppId)}&appPlatform=${encodeURIComponent(config.APP_PLATFORM)}&data=${encodeURIComponent(useData)}&random=${encodeURIComponent(uuid)}&sdkVersion=${encodeURIComponent(config.SDK_VERSION)}&sign=${encodeURIComponent(sign)}`;
  } catch (e) {
    error('[ShanYan Init] 初始化异常:', e.message);
    try {
      const initUuid = crypto.guid();
      const initSid = crypto.guid();
      if (state.reportEnabled) {
        reportLog({
          appId: state.appId,
          status: REPORT_STATUS.FAIL,
          telcom: 'Unknown_Operator',
          processName: PROCESS_NAME.INIT,
          resCode: ERR_SDK_INIT_ERR.code,
          resDesc: makeDynamicError(ERR_SDK_INIT_ERR, e.message).message,
          innerCode: ERR_SDK_INIT_ERR.code,
          innerDesc: makeDynamicError(ERR_SDK_INIT_ERR, e.message).message,
          netType: state.networkType,
          did: '',
          fullReport: state.fullReportEnabled,
          sid: initSid,
        }, initUuid);
      }
    } catch (logError) {
      error('[ShanYan Init] 日志上报异常:', logError.message);
    }
    const result = makeDynamicError(ERR_SDK_INIT_ERR, e.message);
    log('[ShanYan Init] 回调:', JSON.stringify(result));
    callback(result);
    return;
  }

  const initUrl = config.ENV[config.currentEnv].initUrl;
  state.initState = 'pending';
  let initDone = false;

  logDetail('[ShanYan Init] 请求 URL:', initUrl);
  logDetail('[ShanYan Init] 请求入参:', requestData);

  const timeoutId = setTimeout(() => {
    if (initDone) return;
    initDone = true;
    error('[ShanYan Init] 超时（', state.initTimeoutMs, 'ms）');
    log(SEPARATOR);
    try {
      if (state.reportEnabled) {
        reportLog({
          appId: state.appId,
          status: REPORT_STATUS.FAIL,
          telcom: 'Unknown_Operator',
          processName: PROCESS_NAME.INIT,
          resCode: ERR_INIT_TIMEOUT.code,
          resDesc: ERR_INIT_TIMEOUT.message,
          innerCode: ERR_INIT_TIMEOUT.code,
          innerDesc: '超时',
          netType: state.networkType,
          did: '',
          fullReport: state.fullReportEnabled,
          sid: state.sid,
        }, uuid || crypto.guid());
      }
    } catch (logError) {
      error('[ShanYan Init] 超时日志上报异常:', logError.message);
    }
    log('[ShanYan Init] 回调:', JSON.stringify(ERR_INIT_TIMEOUT));
    callback({ ...ERR_INIT_TIMEOUT });
    _processInitQueue();
  }, state.initTimeoutMs);

  _doInitRequest(initUrl, requestData, uuid, sid, (success, data, errorInfo) => {
    if (initDone) return;

    if (success) {
      clearTimeout(timeoutId);
      initDone = true;
      _completeInit(true, data, null, callback, uuid, false);
    } else {
      log('[ShanYan Init] 首次请求失败，尝试备用域名重试');
      if (initDone) return;

      const backupUrl = config.BACKUP_INIT_URL;
      logDetail('[ShanYan Init] 备用域名 URL:', backupUrl);

      _doInitRequest(backupUrl, requestData, uuid, sid, (retrySuccess, retryData, retryErrorInfo) => {
        if (initDone) return;
        clearTimeout(timeoutId);
        initDone = true;
        _completeInit(retrySuccess, retryData, retryErrorInfo, callback, uuid, true);
      });
    }
  });
}

/**
 * 获取当前网络类型
 *
 * 【用途】
 * 这是一个公开 API，供开发者在需要时查询当前网络状态。
 * 注意：demo 中未使用此方法，日志上报时的网络类型由 SDK 内部自动采集。
 *
 * 优先使用移动一键登录插件的 getConnection 方法获取。
 * 若插件未加载或未初始化，降级使用微信原生 wx.getNetworkType API。
 * 注意：一键登录需要在蜂窝网络（4G/5G）下才能取号，WiFi 环境下无法获取手机号。
 *
 * @param {Function} [callback] - 回调函数（可选），不传时默认输出到日志
 * @param {string} callback.networkType - 网络类型（wifi/4g/5g/none）
 */
  if (isFunction(callback) === false) {
    callback = (res) => log('[ShanYan Network]', res);
  }

  try {
    log('[ShanYan Network] 开始获取网络类型');
    // 从初始化下发的 cmccAppId 获取
    const pluginAppId = state.cmccAppId;
    if (!pluginAppId) {
      log('[ShanYan Network] 初始化之前调用');
      // 降级方案：未初始化时使用微信原生 API
      _getNetworkTypeByWx(callback);
      return;
    }

    log('[ShanYan Network] 使用插件获取网络状态:', pluginAppId);

    if (!oneKeyLogin) {
      log('[ShanYan Network] 插件未加载，降级使用 wx');
      _getNetworkTypeByWx(callback);
      return;
    }

    oneKeyLogin.getConnection({
      appId: pluginAppId,
      success: (res) => {
        try {
          const networkType = res.netType || 'unknown';
          state.networkType = networkType;
          log('[ShanYan Network] 插件返回网络类型:', networkType);
          log('[ShanYan Network] 回调:', JSON.stringify({ networkType: networkType }));
          callback({ networkType: networkType });
        } catch (e) {
          error('[ShanYan Network] 插件响应处理异常:', e.message);
          const result = makeDynamicError(ERR_NETWORK_PROCESS_ERR, e.message);
          log('[ShanYan Network] 回调:', JSON.stringify(result));
          callback(result);
        }
      },
      fail: (err) => {
        error('[ShanYan Network] 插件 getConnection 失败:', JSON.stringify(err));
        // 插件调用失败，降级使用微信原生 API
        log('[ShanYan Network] 降级使用 wx');
        _getNetworkTypeByWx(callback);
      }
    });
  } catch (e) {
    error('[ShanYan Network] 调用异常:', e.message);
    _getNetworkTypeByWx(callback);
  }
}

/**
 * 降级方案：使用微信原生 API 获取网络类型
 * 当插件未初始化或未下发 cmccAppId 时使用
 */
function _getNetworkTypeByWx(callback) {
  try {
    wx.getNetworkType({
      success: (res) => {
        const networkType = res.networkType;
        state.networkType = networkType;
        log('[ShanYan Network] wx 返回:', networkType);

        log('[ShanYan Network] 回调:', JSON.stringify({ networkType: networkType }));
        callback({ networkType: networkType });
      },
      fail: (err) => {
        error('[ShanYan Network] wx 失败:', JSON.stringify(err));
        log('[ShanYan Network] 回调:', JSON.stringify({ ...ERR_NETWORK_TYPE_FAILED }));
        callback({ ...ERR_NETWORK_TYPE_FAILED, error: err });
      }
    });
  } catch (e) {
    error('[ShanYan Network] wx 调用异常:', e.message);
    const result = makeDynamicError(ERR_NETWORK_CALL_ERR, e.message);
    log('[ShanYan Network] 回调:', JSON.stringify(result));
    callback(result);
  }
}

/**
 * 生成加密 Token（二次封装）
 *
 * 参考 shanyanh5 项目的 cryptographicToken 函数，
 * 将运营商返回的原始 token/gwAuth/userInformation 封装为 SDK 自己的 token。
 *
 * 运营商识别：根据移动插件返回的 token 前缀判断实际运营商
 *   - 'H5' 开头 → 移动
 *   - 'CTH5' 开头 → 电信
 *   - 'CUH5' 开头 → 联通
 *
 * tk 字段前缀：根据运营商拼接
 *   - 移动 → 'm,' + token
 *   - 电信 → 't,' + token
 *   - 联通 → 'u,' + token
 *
 * 加密流程：
 * 1. 生成 32 位随机数字串（dd）
 * 2. 组装参数对象 { ap, tk, au, dd, vs, fp }
 * 3. 用 appId 作为密钥 AES-CBC 加密
 * 4. 对密文做 URL-safe Base64 转换
 * 5. 拼接 type 前缀（A1=移动, A2=联通, A3=电信）
 *
 * @param {Object} res - 运营商插件返回的原始响应
 * @param {string} appId - 创蓝平台分配的应用 ID
 * @returns {string} 加密后的 token（格式: A1/A2/A3-{base64密文}）
 */
function cryptographicToken(res, appId) {
  try {
    if (!res || typeof res !== 'object') {
      error('[cryptographicToken] 运营商返回数据为空或格式异常');
      return '';
    }

    logDetail('[cryptographicToken] 开始生成加密 token');
    logDetail('[cryptographicToken] appId:', appId);

    let resStr;
    try {
      resStr = JSON.stringify(res);
    } catch (e) {
      resStr = '无法序列化';
    }
    logDetail('[cryptographicToken] 运营商原始响应:', resStr);
    const rawToken = res.token || res.accessCode || '';
    logDetail('[cryptographicToken] tk(原始token):', rawToken);
    logDetail('[cryptographicToken] au(gwAuth):', res.gwAuth || '');
    logDetail('[cryptographicToken] fp(userInformation):', res.userInformation || '');

    // 根据 token 前缀判断实际运营商
    let tkPrefix = 'm,';  // 默认移动
    let typePrefix = 'A1'; // 默认移动
    let telcomName = 'CMCC';

    if (rawToken.startsWith('CT')) {
      tkPrefix = 't,';
      typePrefix = 'A3';
      telcomName = 'CTCC';
    } else if (rawToken.startsWith('CU')) {
      tkPrefix = 'u,';
      typePrefix = 'A2';
      telcomName = 'CUCC';
    }

    // 更新全局 telcom 标识，供日志上报使用
    state.telcom = telcomName;
    logDetail('[cryptographicToken] 运营商识别结果:', telcomName);

    const randomNumber = crypto.generateRandomBitNumber(32);
    const params = {
      ap: appId,
      tk: tkPrefix + rawToken,
      au: res.gwAuth || '',
      dd: randomNumber,
      vs: config.SDK_VERSION,
      fp: res.userInformation || '',
    };
    logDetail('[cryptographicToken] AES 加密入参:', JSON.stringify(params));

    const encrypted = crypto.aesEncryptObject(appId, params);
    if (!encrypted) {
      error('[cryptographicToken] AES 加密失败');
      return '';
    }
    logDetail('[cryptographicToken] AES 加密结果:', encrypted);

    const converted = crypto.convertSign(encrypted);
    logDetail('[cryptographicToken] URL-safe 转换后:', converted);

    const finalToken = `${typePrefix}-` + converted;
    logDetail('[cryptographicToken] 最终 token:', finalToken);
    return finalToken;
  } catch (e) {
    error('[cryptographicToken] 异常:', e.message);
    return '';
  }
}

/**
 * 打开运营商一键登录授权页（调用微信插件拉起运营商授权页）
 *
 * 【重要：参数来源】
 * - appId：使用服务端下发的 cmccAppId（不是用户传入的 appId）
 * - sign：使用服务端下发的 cmccValidateSign 或 cmccSign
 * - timestamp：使用服务端下发的 cmccTimestamp
 * - traceId：使用服务端下发的 traceId
 *
 * 原因：移动取号需要验证 appId 和签名是否已在服务端注册，
 * 本地自签无法通过校验。
 *
 * 【交互流程】
 * 1. 插件自动判断当前网络环境
 * 2. WiFi/无网络：直接返回网络异常
 * 3. 4G/5G：向移动服务端发起取号请求
 * 4. 取号成功后拉起授权页
 * 5. 用户点击"授权登录"后通过 success 回调返回 token
 * 6. 用户点击"取消"后通过 error 回调返回 code=501
 *
 * @param {Object} [cfg] - 可选的授权页配置
 * @param {Object} [cfg.option] - 自定义 UI 配置（参考接入文档 7.5 节）
 * @param {Function} callback - 回调函数
 * @param {string} callback.code - 结果码，'200000'=取号成功，'501'=用户取消
 * @param {string} callback.message - 结果描述
 * @param {string} callback.token - 取号凭证（用于服务端校验换取手机号）
 * @param {string} callback.msgId - 消息ID
 *
 * @example
 * // 不传配置：使用默认 logo
 * SDK.openLoginAuth((res) => {
 *   if (res.code === '200000') {
 *     console.log('token:', res.token);
 *   }
 * });
 *
 * // 传入自定义 UI 配置
 * SDK.openLoginAuth({
 *   option: {
 *     logo: { logoStyle: { width: '200rpx', height: '200rpx' } },
 *     sureBtnStyle: { text: '一键登录', bgColor: '#2b7de0' },
 *   }
 * }, (res) => { ... });
 */
/**
 * 内部函数：执行 openLoginAuth 的核心逻辑（UI 配置、签名、插件调用）
 * 仅在 initState === 'success' 时调用
 */
function _executeOpenLoginAuth(cfg, callback) {
  // 处理 UI 配置：单次独立生效，不传配置时使用默认 logo
  const DEFAULT_LOGO_STYLE = {
    src: 'https://static2.253.com/mini/wang_img/login_demo_cl.jpg',
  };
  let useOption;
  if (cfg && isObj(cfg.option)) {
    const userLogo = cfg.option.logoStyle || {};
    // 用户未传 logoStyle 或未设置 src → 兜底使用默认 logo 路径
    const logoStyle = userLogo.src ? userLogo : { ...DEFAULT_LOGO_STYLE, ...userLogo };
    // 用户未传 customControlStyle 时兜底 [{ ifShow: false }]，传了则合并每个 item 的 ifShow
    const userCustom = cfg.option.customControlStyle || [];
    const customControlStyle = userCustom.length === 0
      ? [{ ifShow: false }]
      : userCustom.map(item => item.ifShow !== undefined ? item : { ...item, ifShow: false });
    // 用户未传 layerStyle 或未设置 height → 兜底使用默认 height
    const userLayer = cfg.option.layerStyle || {};
    const layerStyle = userLayer.height ? userLayer : { height: '800rpx', ...userLayer };
    // 用户未传 checkBtnStyle 或未设置字段 → 兜底使用默认宽高
    const userCheck = cfg.option.checkBtnStyle || {};
    const checkBtnStyle = {
      width: '30rpx',
      height: '30rpx',
      ...userCheck,
    };
    useOption = {
      ...cfg.option,
      logoStyle: logoStyle,
      bussinessNameStyle: { text: '创蓝闪验提供认证服务', ...cfg.option.bussinessNameStyle },
      customControlStyle: customControlStyle,
      layerStyle: layerStyle,
      checkBtnStyle: checkBtnStyle,
    };
  } else {
    useOption = {
      logoStyle: { ...DEFAULT_LOGO_STYLE },
      bussinessNameStyle: { text: '创蓝闪验提供认证服务' },
      customControlStyle: [{ ifShow: false }],
      layerStyle: { height: '800rpx' },
      checkBtnStyle: {
        width: '30rpx',
        height: '30rpx',
      },
    };
  }
  log('[ShanYan Token] option:', cfg && isObj(cfg.option) ? '用户自定义' : 'SDK默认');

  // 使用初始化下发的移动 appId
  const useAppId = state.cmccAppId;
  const useTraceId = state.traceId;
  const timestamp = state.cmccTimestamp;

  if (!useAppId) {
    try {
      const tokenUuid = crypto.guid();
      if (state.reportEnabled) {
        reportLog({
          appId: state.appId,
          status: REPORT_STATUS.FAIL,
          telcom: state.telcom,
          processName: PROCESS_NAME.TOKEN_ERR,
          resCode: ERR_MOBILE_APPID_NOT_INIT.code,
          resDesc: ERR_MOBILE_APPID_NOT_INIT.message,
          innerCode: '',
          innerDesc: '',
          netType: state.networkType,
          did: state.did,
          fullReport: state.fullReportEnabled,
          sid: state.sid,
        }, tokenUuid);
      }
    } catch (logError) {
      error('[ShanYan Token] 日志上报异常:', logError.message);
    }
    log('[ShanYan Token] 回调2:', JSON.stringify(ERR_MOBILE_APPID_NOT_INIT));
    callback({ ...ERR_MOBILE_APPID_NOT_INIT });
    return;
  }

  // msgId 必须与 traceId 保持一致（接入文档要求）
  const msgId = useTraceId;

  let useSign;
  try {
    // 按文档规则计算 sign：MD5(appId + businessType + msgId + timestamp + traceId + version + appkey)
    const signAppKey = state.cmccAppKey;  // 使用初始化下发的 cmccAppKey
    const signStr = useAppId + state.businessType + msgId + timestamp + useTraceId + state.version + signAppKey;
    useSign = crypto.md5(signStr).toUpperCase();

    log(SEPARATOR);
    log('[ShanYan Token] 开始取号', useAppId);
    logDetail('[ShanYan Token] cmccId):', useAppId);
    logDetail('[ShanYan Token] businessType:', state.businessType);
    logDetail('[ShanYan Token] msgId:', msgId);
    logDetail('[ShanYan Token] timestamp:', timestamp);
    logDetail('[ShanYan Token] traceId:', useTraceId);
    logDetail('[ShanYan Token] version:', state.version);
    logDetail('[ShanYan Token] signKey:', signAppKey ? '***' + signAppKey.slice(-4) : 'undefined');
    logDetail('[ShanYan Token] 签名原文(signStr):', useAppId + state.businessType + msgId + timestamp + useTraceId + state.version + '***');
    logDetail('[ShanYan Token] 计算 sign:', useSign);
    log('[ShanYan Token] option:', JSON.stringify(useOption));
  } catch (e) {
    error('[ShanYan Token] 签名计算异常:', e.message);
    try {
      const tokenUuid = crypto.guid();
      if (state.reportEnabled) {
        reportLog({
          appId: state.appId,
          status: REPORT_STATUS.FAIL,
          telcom: state.telcom,
          processName: PROCESS_NAME.TOKEN_ERR,
          resCode: ERR_TOKEN_SIGN_CALC_ERR.code,
          resDesc: makeDynamicError(ERR_TOKEN_SIGN_CALC_ERR, e.message).message,
          innerCode: '',
          innerDesc: '',
          netType: state.networkType,
          did: state.did,
          fullReport: state.fullReportEnabled,
          sid: state.sid,
        }, tokenUuid);
      }
    } catch (logError) {
      error('[ShanYan Token] 日志上报异常:', logError.message);
    }
    const result = makeDynamicError(ERR_TOKEN_SIGN_CALC_ERR, e.message);
    log('[ShanYan Token] 回调3:', JSON.stringify(result));
    callback(result);
    return;
  }

  // 构建插件请求数据
  const requestData = {
    appId: useAppId,
    sign: useSign,
    traceId: useTraceId,
    timestamp: timestamp,
    authPageType: '5',  // SDK 内部固定传值 5
    version: state.version,
    option: useOption,
  };
  logDetail('[ShanYan Token] 完整 data:', JSON.stringify(requestData));
  log(SEPARATOR);

  let uuid;
  try {
    uuid = crypto.guid();
  } catch (e) {
    error('[ShanYan Token] UUID 生成异常:', e.message);
    try {
      if (state.reportEnabled) {
        reportLog({
          appId: state.appId,
          status: REPORT_STATUS.FAIL,
          telcom: state.telcom,
          processName: PROCESS_NAME.TOKEN_ERR,
          resCode: ERR_TOKEN_UUID_GEN_ERR.code,
          resDesc: makeDynamicError(ERR_TOKEN_UUID_GEN_ERR, e.message).message,
          innerCode: '',
          innerDesc: '',
          netType: state.networkType,
          did: state.did,
          fullReport: state.fullReportEnabled,
          sid: state.sid,
        }, '');
      }
    } catch (logError) {
      error('[ShanYan Token] 日志上报异常:', logError.message);
    }
    const result = makeDynamicError(ERR_TOKEN_UUID_GEN_ERR, e.message);
    log('[ShanYan Token] 回调4:', JSON.stringify(result));
    callback(result);
    return;
  }

  // 调用微信插件的 getTokenInfo 方法
  if (!oneKeyLogin) {
    try {
      const tokenUuid = crypto.guid();
      if (state.reportEnabled) {
        reportLog({
          appId: state.appId,
          status: REPORT_STATUS.FAIL,
          telcom: state.telcom,
          processName: PROCESS_NAME.TOKEN_ERR,
          resCode: ERR_TOKEN_PLUGIN_CALL_ERR.code,
          resDesc: 'auth-plugin 插件未加载',
          innerCode: '',
          innerDesc: '',
          netType: state.networkType,
          did: state.did,
          fullReport: state.fullReportEnabled,
          sid: state.sid,
        }, tokenUuid);
      }
    } catch (logError) {
      error('[ShanYan Token] 日志上报异常:', logError.message);
    }
    const result = { code: ERR_TOKEN_PLUGIN_CALL_ERR.code, message: 'auth-plugin 插件未加载' };
    log('[ShanYan Token] 回调5:', JSON.stringify(result));
    callback(result);
    return;
  }

  try {
    logDetail('[ShanYan Token] netType:', state.networkType);

    oneKeyLogin.getTokenInfo({
      data: requestData,
      success: res => {
        try {
          logDetail('[ShanYan Token] success 回调:', JSON.stringify(res));

          // 生成二次封装的加密 token（根据 token 前缀自动识别运营商）
          const encryptedToken = cryptographicToken(res, state.appId);

          // 保存浏览器加密指纹
          state.did = res.userInformation || '';

          // 日志上报（code=103000/501 时 processName='4'，其他 processName='3'）
          const tokenProcessName = (res.code === '103000' || res.code === '501') ? PROCESS_NAME.TOKEN_OK : PROCESS_NAME.TOKEN_ERR;
          try {
            if (state.reportEnabled) {
              reportLog({
                appId: state.appId,
                status: REPORT_STATUS.SUCCESS,
                telcom: state.telcom,
                processName: tokenProcessName,
                resCode: SUCCESS_TOKEN.code,
                resDesc: res.message || SUCCESS_TOKEN.message,
                innerCode: res.code || '',
                innerDesc: res.msgId || '',
                netType: state.networkType,
                did: state.did,
                fullReport: state.fullReportEnabled,
                sid: state.sid,
              }, uuid);
            }
          } catch (e) {
            error('[ShanYan Token] 日志上报异常:', e.message);
          }

          const cbResult = {
            ...SUCCESS_TOKEN,
            message: res.message || 'success',
            token: encryptedToken,
            msgId: res.msgId,
          };
          log('[ShanYan Token] 回调6:', JSON.stringify(cbResult));
          callback(cbResult);
        } catch (e) {
          error('[ShanYan Token] success 处理异常:', e.message);
          try {
            if (state.reportEnabled) {
              reportLog({
                appId: state.appId,
                status: REPORT_STATUS.FAIL,
                telcom: state.telcom,
                processName: PROCESS_NAME.TOKEN_ERR,
                resCode: ERR_TOKEN_PROCESS_ERR.code,
                resDesc: makeDynamicError(ERR_TOKEN_PROCESS_ERR, e.message).message,
                innerCode: '',
                innerDesc: '',
                netType: state.networkType,
                did: state.did,
                fullReport: state.fullReportEnabled,
                sid: state.sid,
              }, uuid);
            }
          } catch (logError) {
            error('[ShanYan Token] 日志上报异常:', logError.message);
          }
          const result = makeDynamicError(ERR_TOKEN_PROCESS_ERR, e.message);
          log('[ShanYan Token] 回调7:', JSON.stringify(result));
          callback(result);
        }
      },
      error: res => {
        try {
          log('[ShanYan Token] error 回调:', JSON.stringify(res));

          // 用户取消授权/选择其他登录方式视为正常流程，status=1（非异常）
          const isUserCancel = res.code === '501' || res.code === '502' || (res.message && res.message.includes('取消'));
          const status = isUserCancel ? 1 : 0;

          // 日志上报（code=103000/501/502 时 processName='4'，其他 processName='3'）
          const errorProcessName = (res.code === '103000' || res.code === '501' || res.code === '502') ? PROCESS_NAME.TOKEN_OK : PROCESS_NAME.TOKEN_ERR;

          // 日志上报
          try {
            if (state.reportEnabled) {
              reportLog({
                appId: state.appId,
                status: status,
                telcom: state.telcom,
                processName: errorProcessName,
                resCode: res.code || ERR_NETWORK_TYPE_FAILED.code,
                resDesc: res.message || ERR_NETWORK_TYPE_FAILED.message,
                innerCode: res.code || '',
                innerDesc: res.msgId || '',
                netType: state.networkType,
                did: state.did,
                fullReport: state.fullReportEnabled,
                sid: state.sid,
              }, uuid);
            }
          } catch (e) {
            error('[ShanYan Token] 日志上报异常:', e.message);
          }

          const cbResult = {
            code: res.code || ERR_NETWORK_TYPE_FAILED.code,
            message: res.message || ERR_NETWORK_TYPE_FAILED.message,
            msgId: res.msgId,
          };
          log('[ShanYan Token] 回调8:', JSON.stringify(cbResult));
          callback(cbResult);
        } catch (e) {
          error('[ShanYan Token] error 处理异常:', e.message);
          try {
            if (state.reportEnabled) {
              reportLog({
                appId: state.appId,
                status: REPORT_STATUS.FAIL,
                telcom: state.telcom,
                processName: PROCESS_NAME.TOKEN_ERR,
                resCode: ERR_TOKEN_PROCESS_ERR.code,
                resDesc: makeDynamicError(ERR_TOKEN_PROCESS_ERR, e.message).message,
                innerCode: '',
                innerDesc: '',
                netType: state.networkType,
                did: state.did,
                fullReport: state.fullReportEnabled,
                sid: state.sid,
              }, uuid);
            }
          } catch (logError) {
            error('[ShanYan Token] 日志上报异常:', logError.message);
          }
          const result = makeDynamicError(ERR_TOKEN_PROCESS_ERR, e.message);
          log('[ShanYan Token] 回调9:', JSON.stringify(result));
          callback(result);
        }
      }
    });
  } catch (e) {
    error('[ShanYan Token] 插件调用异常:', e.message);
    try {
      if (state.reportEnabled) {
        reportLog({
          appId: state.appId,
          status: REPORT_STATUS.FAIL,
          telcom: state.telcom,
          processName: PROCESS_NAME.TOKEN_ERR,
          resCode: ERR_TOKEN_PLUGIN_CALL_ERR.code,
          resDesc: makeDynamicError(ERR_TOKEN_PLUGIN_CALL_ERR, e.message).message,
          innerCode: '',
          innerDesc: '',
          netType: state.networkType,
          did: state.did,
          fullReport: state.fullReportEnabled,
          sid: state.sid,
        }, uuid);
      }
    } catch (logError) {
      error('[ShanYan Token] 日志上报异常:', logError.message);
    }
    const result = makeDynamicError(ERR_TOKEN_PLUGIN_CALL_ERR, e.message);
    log('[ShanYan Token] 回调10:', JSON.stringify(result));
    callback(result);
  }
}

/**
 * 启动一键登录授权页
 *
 * 必须先完成初始化才能调用。根据初始化状态自动处理：
 * - 从未调用过初始化 → 立即返回失败
 * - 初始化进行中 → 等待初始化结果，成功后自动执行授权页
 * - 初始化已失败 → 内部自动重试一次初始化，等待结果
 * - 初始化已成功 → 直接执行授权页
 *
 * @param {Object} [cfg] - 授权页配置（UI 样式等）
 * @param {Function} callback - 结果回调
 */
function openLoginAuth(cfg, callback) {
  // cfg 可选，若第一个参数是函数则省略 cfg
  if (isFunction(cfg)) {
    callback = cfg;
    cfg = {};
  }
  if (isFunction(callback) === false) {
    callback = (res) => log('[ShanYan Token]', res);
  }

  switch (state.initState) {
    case 'none':
      // 从未调用过 init → 立即返回失败
      try {
        const tokenUuid = crypto.guid();
        if (state.reportEnabled) {
          reportLog({
            appId: state.appId,
            status: REPORT_STATUS.FAIL,
            telcom: state.telcom,
            processName: PROCESS_NAME.TOKEN_ERR,
            resCode: ERR_NOT_INITIALIZED.code,
            resDesc: ERR_NOT_INITIALIZED.message,
            innerCode: '',
            innerDesc: '',
            netType: state.networkType,
            did: state.did,
            fullReport: state.fullReportEnabled,
            sid: state.sid,
          }, tokenUuid);
        }
      } catch (logError) {
        error('[ShanYan Token] 日志上报异常:', logError.message);
      }
      log('[ShanYan Token] 回调:', JSON.stringify(ERR_NOT_INITIALIZED));
      callback({ ...ERR_NOT_INITIALIZED });
      return;

    case 'pending':
      // 初始化进行中 → 入队等待结果
      log('[ShanYan Token] 初始化进行中，等待结果...');
      state.initPendingCallbacks.push({ cfg, callback });
      return;

    case 'failed':
      // 初始化已失败 → 内部自动重试一次
      log('[ShanYan Token] 初始化已失败，内部自动重试...');
      state.initState = 'pending';
      state.initPendingCallbacks.push({ cfg, callback });
      _retryInit();
      return;

    case 'success':
    default:
      // 初始化已成功 → 直接执行
      _executeOpenLoginAuth(cfg, callback);
      return;
  }
}

/**
 * 内部函数：openLoginAuth 触发的 init 重试
 * 复用 init 的网络请求逻辑，但跳过缓存检查和参数校验
 */
function _retryInit() {
  let uuid;
  let sid;
  let requestData;
  try {
    uuid = crypto.guid();
    sid = crypto.guid();
    state.sid = sid;

    const useData = '';
    const signText = `appId${state.appId}appPlatform${config.APP_PLATFORM}data${useData}random${uuid}sdkVersion${config.SDK_VERSION}`;
    const signKey = crypto.md5(state.appId);
    const sign = crypto.hmacSHA1Encrypt(signText, signKey);
    requestData = `appId=${encodeURIComponent(state.appId)}&appPlatform=${encodeURIComponent(config.APP_PLATFORM)}&data=${encodeURIComponent(useData)}&random=${encodeURIComponent(uuid)}&sdkVersion=${encodeURIComponent(config.SDK_VERSION)}&sign=${encodeURIComponent(sign)}`;
  } catch (e) {
    error('[ShanYan Init] 重试初始化签名异常:', e.message);
    state.initState = 'failed';
    _processInitQueue();
    return;
  }

  const initUrl = config.ENV[config.currentEnv].initUrl;
  let initDone = false;

  const timeoutId = setTimeout(() => {
    if (initDone) return;
    initDone = true;
    state.initState = 'failed';
    error('[ShanYan Init] 重试超时（', state.initTimeoutMs, 'ms）');
    _processInitQueue();
  }, state.initTimeoutMs);

  _doInitRequest(initUrl, requestData, uuid, sid, (success, data, errorInfo) => {
    if (initDone) return;

    if (success) {
      clearTimeout(timeoutId);
      initDone = true;
      _completeInit(true, data, null, () => {}, uuid, false);
    } else {
      log('[ShanYan Init] 重试首次请求失败，尝试备用域名');
      if (initDone) return;

      _doInitRequest(config.BACKUP_INIT_URL, requestData, uuid, sid, (retrySuccess, retryData, retryErrorInfo) => {
        if (initDone) return;
        clearTimeout(timeoutId);
        initDone = true;
        _completeInit(retrySuccess, retryData, retryErrorInfo, () => {}, uuid, true);
      });
    }
  });
}

/**
 * 获取插件实例（高级用法）
 *
 * 【用途】
 * 这是一个公开 API，供需要直接调用微信一键登录插件其他方法的开发者使用。
 * SDK 内部已对插件进行了封装，一般场景下不需要调用此方法。
 * demo 中未使用此方法。
 *
 * 当开发者需要直接调用插件的其他方法时使用。
 * 一般场景下不需要调用此方法
 *
 * @returns {Object} 插件实例对象，未加载时返回 null
 *
 * @example
 * const plugin = SDK.getPlugin();
 * if (plugin) {
 *   plugin.someMethod();  // 直接调用插件方法
 * }
 */
function getPlugin() {
  if (!oneKeyLogin) {
    error('[ShanYan] getPlugin: auth-plugin 插件未加载');
  }
  return oneKeyLogin;
}

/**
 * 设置 SDK 内部日志输出开关
 *
 * @param {Boolean} flag - true=开启 SDK 内部 console 日志输出，false=关闭（默认）
 */
function setLog(flag) {
  state.logEnabled = !!flag;
  setLogInternal(flag);
}

/**
 * 设置日志上报开关（可选）
 *
 * 【用途】
 * 这是一个公开 API，供开发者控制是否将日志上报到创蓝服务器。
 * 默认开启上报（state.reportEnabled = true），demo 未使用此方法。
 *
 * @param {Boolean} flag - true=开启上报（默认），false=关闭上报
 *
 * @example
 * SDK.setReport(false);  // 关闭日志上报
 */
function setReport(flag) {
  state.reportEnabled = !!flag;
}

/**
 * 设置日志上报是否获取设备信息字段（可选）
 *
 * 【用途】
 * 这是一个公开 API，供开发者控制是否在日志上报时采集设备信息。
 * 默认开启采集（state.fullReportEnabled = true）。
 * 关闭后可减少系统 API 调用。demo 未使用此方法。
 *
 * 关闭后不再获取这几个字段，减少系统 API 调用。
 * 默认开启（获取）。
 *
 * @param {Boolean} flag - true=获取上述字段（默认），false=不获取
 *
 * @example
 * SDK.setDetailReport(false);  // 不采集设备信息
 */
function setDetailReport(flag) {
  state.fullReportEnabled = !!flag;
}

/**
 * 清理初始化接口缓存
 *
 * 调用后下次 init 将重新请求服务端获取参数。
 */
function clearScripCache() {
  try {
    wx.removeStorageSync(CACHE_KEY);
    log('[ShanYan Cache] 已清理本地初始化');
  } catch (e) {
    error('[ShanYan Cache] 清理本地初始化失败:', e.message);
  }
}

/**
 * 设置 SDK 运行环境
 *
 * 说明：
 * - 需在 init() 之前调用，否则默认为 release 环境
 * - stable 用于开发调试，release 用于正式上线
 *
 * @param {string} env - 环境标识：'stable'=测试环境，'release'=生产环境（默认）
 */
function setEnvironment(env) {
  if (env !== 'stable' && env !== 'release') {
    throw new Error('[ShanYan] setEnvironment: env must be "stable" or "release"');
  }
  config.currentEnv = env;
}

/**
 * 设置 init 接口超时时间（可选）
 *
 * 【用途】
 * 这是一个公开 API，供开发者在需要时自定义超时时间。
 * 默认 6 秒。超时后返回 code='001023', message='超时'，并上报日志。
 * demo 未使用此方法。
 *
 * @param {number} ms - 超时时间（毫秒），默认 6000
 *
 * @example
 * SDK.setInitTimeout(10000);  // 设置超时为 10 秒
 */
function setInitTimeout(ms) {
  if (typeof ms === 'number' && ms > 0) {
    state.initTimeoutMs = ms;
  }
}

// ============================ 导出 ============================

module.exports = {
  init,           // 初始化 SDK（请求服务端获取运营商参数）
  openLoginAuth,  // 打开一键登录授权页（拉起运营商授权页，可传可选配置参数）
  getNetworkType, // 获取当前网络类型
  getPlugin,      // 获取插件实例（高级用法）
  setEnvironment, // 设置 SDK 运行环境（stable=稳定环境，release=生产环境，默认 release）
  setLog,         // 设置 SDK 内部日志输出开关（默认关闭）
  setReport,      // 设置日志上报开关（默认开启）
  setDetailReport,  // 设置日志上报是否获取设备/网络信息字段（默认开启）
  clearScripCache,  // 清理初始化缓存
  setInitTimeout,   // 设置 init 接口超时时间（默认 6000ms）
};
