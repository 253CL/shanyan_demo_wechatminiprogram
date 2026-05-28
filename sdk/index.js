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

const { SDK_VERSION } = require('./config');
const config = require('./config');
const crypto = require('./crypto');
const {
  SUCCESS_INIT, SUCCESS_TOKEN, SUCCESS_CONFIG,
  ERR_SERVER_EMPTY_RESPONSE, ERR_SERVER_REQUEST_FAILED,
  ERR_NOT_INITIALIZED, ERR_MOBILE_APPID_NOT_INIT,
  ERR_INVALID_PARAMS, ERR_TOKEN_REQUIRED,
  ERR_APPID_REQUIRED,
  ERR_SDK_INIT_ERR, ERR_SDK_RESPONSE_PROCESS_ERR,
  ERR_CONFIG_SET_ERR, ERR_TOKEN_SIGN_CALC_ERR, ERR_TOKEN_UUID_GEN_ERR,
  ERR_TOKEN_PROCESS_ERR, ERR_TOKEN_PLUGIN_CALL_ERR,
  ERR_NETWORK_PROCESS_ERR, ERR_NETWORK_CALL_ERR,
  ERR_NETWORK_TYPE_FAILED,
  makeDynamicError,
} = require('./errors');
const { reportLog } = require('./log');

// 引入微信一键登录插件
// app.json 中配置： "plugins": { "auth-plugin": { "version": "2.2.0", "provider": "wx35678fec06d475b4" } }
// requirePlugin 返回的是一个包含插件命名空间的对象，需要解构拿到真正的插件实例
const { oneKeyLogin } = requirePlugin('auth-plugin');

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
  authPageType: config.DEFAULT_AUTH_PAGE_TYPE,  // 授权页类型：'4'=底部弹窗，'5'=自定义弹窗
  businessType: config.BUSINESS_TYPE,           // 业务类型，固定为 '8'
  version: config.VERSION,                      // 接口版本号，固定为 '1.0'
  uiConfig: {},         // 自定义 UI 配置（authPageType=5 时使用）
  networkType: '',      // 当前网络类型（wifi/4g/5g/none）
  telcom: 'Unknown_Operator',  // 运营商标识
  initialized: false,   // SDK 是否已初始化
  logEnabled: false,    // 日志输出开关：true=输出 SDK 内部 console 日志，false=静默（默认关闭）
  detailLogEnabled: true, // 日志详情输出开关：true=输出接口地址/入参/响应等敏感日志，false=不输出（默认关闭）
  reportEnabled: true,  // 日志上报开关：true=上报到创蓝日志服务器（默认开启），false=不上报
};

// ============================ 工具函数 ============================

/**
 * SDK 内部日志输出封装，受 setLog 开关控制
 */
function log() {
  if (state.logEnabled) {
    console.log.apply(console, arguments);
  }
}

function error() {
  if (state.logEnabled) {
    console.error.apply(console, arguments);
  }
}

/**
 * SDK 内部日志详情输出封装，受 setDetailLog 开关控制
 * 用于输出接口地址、入参、响应等敏感信息
 */
function logDetail() {
  if (state.logEnabled && state.detailLogEnabled) {
    console.log.apply(console, arguments);
  }
}

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
 * - 入参：appId=开发者应用ID&data=
 * - 出参：{ retCode: "0", data: { cmccAppId, cmccSign, cmccTimestamp, cmccValidateSign, traceId, ... } }
 *
 * @param {Object} params - 初始化参数
 * @param {string} params.appId - 创蓝平台分配的应用 ID（必填）
 * @param {Function} callback - 回调函数
 * @param {string} callback.code - 结果码，'000000'=成功
 * @param {string} callback.message - 结果描述
 * @param {string} callback.traceId - 请求追踪 ID
 *
 * @example
 * // stable 环境
 * SDK.setEnvironment('stable');
 * SDK.init({ appId: 'xxx' }, (res) => {
 *   if (res.code === '000000') {
 *     console.log('初始化成功');
 *   }
 * });
 *
 * // release 环境（默认）
 * SDK.init({ appId: 'xxx' }, (res) => {
 *   if (res.code === '000000') {
 *     console.log('初始化成功');
 *   }
 * });
 */
function init(params, callback) {
  log(SEPARATOR);
  log('[ShanYan Init] 开始初始化');

  if (isFunction(callback) === false) {
    callback = (res) => log('[ShanYan Init]', res);
  }

  // 参数校验
  if (!params || isObj(params) === false || !params.appId) {
    error('[ShanYan Init] appId 必传');
    callback({ ...ERR_APPID_REQUIRED });
    return;
  }

  const useAppId = params.appId;

  // 保存参数
  state.appId = useAppId;

  let uuid;
  let requestData;
  try {
    uuid = crypto.guid();
    requestData = `appId=${encodeURIComponent(useAppId)}&data=`;
  } catch (e) {
    error('[ShanYan Init] 初始化异常:', e.message);
    try {
      const initUuid = crypto.guid();
      if (state.reportEnabled) {
        reportLog({
          appId: state.appId,
          status: REPORT_STATUS.FAIL,
          telcom: 'Unknown_Operator',
          processName: PROCESS_NAME.INIT,
          resCode: ERR_SDK_INIT_ERR.code,
          resDesc: makeDynamicError(ERR_SDK_INIT_ERR, e.message).message,
        }, initUuid);
      }
    } catch (logError) {
      error('[ShanYan Init] 日志上报异常:', logError.message);
    }
    callback(makeDynamicError(ERR_SDK_INIT_ERR, e.message));
    return;
  }

  // 根据当前环境选择对应接口地址
  const initUrl = config.ENV[config.currentEnv].initUrl;

  logDetail('[ShanYan Init] 请求 URL:', initUrl);
  logDetail('[ShanYan Init] 请求入参:', requestData);

  // 请求创蓝服务端获取配置信息
  wx.request({
    url: initUrl,
    method: 'POST',
    data: requestData,
    header: { 'Content-Type': 'application/x-www-form-urlencoded' },
    success: (res) => {
      try {
        logDetail('[ShanYan Init] HTTP 状态码:', res.statusCode);
        logDetail('[ShanYan Init] 服务端响应:', JSON.stringify(res.data));

        if (!res.data) {
          error('[ShanYan Init] 响应数据为空');
          try {
            const initUuid = uuid;
            if (state.reportEnabled) {
              reportLog({
                appId: state.appId,
                status: REPORT_STATUS.FAIL,
                telcom: 'Unknown_Operator',
                processName: PROCESS_NAME.INIT,
                resCode: ERR_SERVER_EMPTY_RESPONSE.code,
                resDesc: ERR_SERVER_EMPTY_RESPONSE.message,
              }, initUuid);
            }
          } catch (logError) {
            error('[ShanYan Init] 日志上报异常:', logError.message);
          }
          callback({ ...ERR_SERVER_EMPTY_RESPONSE });
          return;
        }

        // 成功时返回 retCode === '0'
        if (res.data.retCode === '0') {
          const data = res.data.data;
          log('[ShanYan Init] retCode 校验通过');

          // 保存服务端下发的移动参数
          state.cmccAppId = data.cmccAppId;
          state.cmccAppKey = data.cmccAppKey;
          state.cmccSign = data.cmccSign;
          state.cmccTimestamp = data.cmccTimestamp;
          state.cmccValidateSign = data.cmccValidateSign;
          state.traceId = data.traceId || crypto.guid();
          state.timestamp = data.cmccTimestamp || formatTimestamp();
          state.initialized = true;

          log('[ShanYan Init] 初始化完成:', state.traceId);
          log(SEPARATOR);

          // 日志上报
          try {
            if (state.reportEnabled) {
              reportLog({
                appId: state.appId,
                status: REPORT_STATUS.SUCCESS,
                telcom: 'Unknown_Operator',
                processName: PROCESS_NAME.INIT,
                resCode: SUCCESS_INIT.code,
                resDesc: SUCCESS_INIT.message,
              }, uuid);
            }
          } catch (e) {
            error('[ShanYan Init] 日志上报异常:', e.message);
          }

          callback({ ...SUCCESS_INIT, traceId: state.traceId });
        } else {
          // 服务端返回错误
          const retCode = res.data.retCode || 'unknown';
          const retMsg = res.data.retMsg || '初始化失败';
          error('[ShanYan Init] retCode:', retCode, 'retMsg:', retMsg);
          logDetail('[ShanYan Init] 完整响应:', JSON.stringify(res.data));
          log(SEPARATOR);

          try {
            const initUuid = uuid;
            if (state.reportEnabled) {
              reportLog({
                appId: state.appId,
                status: REPORT_STATUS.FAIL,
                telcom: 'Unknown_Operator',
                processName: PROCESS_NAME.INIT,
                resCode: retCode,
                resDesc: retMsg,
              }, initUuid);
            }
          } catch (logError) {
            error('[ShanYan Init] 日志上报异常:', logError.message);
          }

          callback({ code: retCode, message: retMsg });
        }
      } catch (e) {
        error('[ShanYan Init] 响应处理异常:', e.message);
        try {
          const initUuid = uuid;
          if (state.reportEnabled) {
            reportLog({
              appId: state.appId,
              status: REPORT_STATUS.FAIL,
              telcom: 'Unknown_Operator',
              processName: PROCESS_NAME.INIT,
              resCode: ERR_SDK_RESPONSE_PROCESS_ERR.code,
              resDesc: makeDynamicError(ERR_SDK_RESPONSE_PROCESS_ERR, e.message).message,
            }, initUuid);
          }
        } catch (logError) {
          error('[ShanYan Init] 日志上报异常:', logError.message);
        }
        callback(makeDynamicError(ERR_SDK_RESPONSE_PROCESS_ERR, e.message));
      }
    },
    fail: (err) => {
      error('[ShanYan Init] wx.request 失败');
      error('[ShanYan Init] 错误信息:', JSON.stringify(err));
      log(SEPARATOR);

      try {
        const initUuid = uuid;
        if (state.reportEnabled) {
          reportLog({
            appId: state.appId,
            status: REPORT_STATUS.FAIL,
            telcom: 'Unknown_Operator',
            processName: PROCESS_NAME.INIT,
            resCode: ERR_SERVER_REQUEST_FAILED.code,
            resDesc: makeDynamicError(ERR_SERVER_REQUEST_FAILED, err.errMsg || '').message,
          }, initUuid);
        }
      } catch (logError) {
        error('[ShanYan Init] 日志上报异常:', logError.message);
      }

      callback(makeDynamicError(ERR_SERVER_REQUEST_FAILED, err.errMsg || ''));
    }
  });
}

/**
 * 设置 UI 配置（用于 authPageType=5 自定义授权弹窗样式）
 *
 * 支持自定义的元素包括：logo、小程序名称、授权栏、号码栏、
 * 取消按钮、登录按钮、协议栏、协议勾选、弹窗样式、蒙层等
 *
 * @param {Object} cfg - UI 配置对象
 * @param {string} cfg.authPageType - 授权页类型，'5'=自定义弹窗
 * @param {Object} cfg.option - 详细 UI 配置（参考接入文档 7.5 节）
 * @param {Function} callback - 回调函数
 *
 * @example
 * SDK.setConfig({
 *   authPageType: '5',
 *   option: {
 *     logo: { logoStyle: { width: '200rpx', height: '200rpx' } },
 *     sureBtnStyle: { text: '一键登录', bgColor: '#2b7de0' },
 *   }
 * }, (res) => console.log(res));
 */
function setConfig(cfg, callback) {
  try {
    if (!state.initialized) {
      if (isFunction(callback)) {
        callback({ ...ERR_NOT_INITIALIZED });
      }
      return;
    }

    if (isObj(cfg)) {
      if (cfg.authPageType) {
        state.authPageType = cfg.authPageType;
      }
      if (cfg.option) {
        state.uiConfig = cfg.option;
      }
    }

    if (isFunction(callback)) {
      callback({ ...SUCCESS_CONFIG });
    }
  } catch (e) {
    error('[ShanYan Config] setConfig 异常:', e.message);
    if (isFunction(callback)) {
      callback(makeDynamicError(ERR_CONFIG_SET_ERR, e.message));
    }
  }
}

/**
 * 获取当前网络类型
 *
 * 使用移动一键登录插件的 getConnection 方法获取当前网络状态。
 * 注意：一键登录需要在蜂窝网络（4G/5G）下才能取号，WiFi 环境下无法获取手机号。
 *
 * @param {Function} callback - 回调函数
 * @param {string} callback.networkType - 网络类型（wifi/4g/5g/none）
 */
function getNetworkType(callback) {
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

    oneKeyLogin.getConnection({
      appId: pluginAppId,
      success: (res) => {
        try {
          const networkType = res.netType || 'unknown';
          state.networkType = networkType;
          log('[ShanYan Network] 插件返回网络类型:', networkType);
          logDetail('[ShanYan Network] getConnection 完整返回:', JSON.stringify(res));

          callback({ networkType: networkType });
        } catch (e) {
          error('[ShanYan Network] 插件响应处理异常:', e.message);
          callback(makeDynamicError(ERR_NETWORK_PROCESS_ERR, e.message));
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

        callback({ networkType: networkType });
      },
      fail: (err) => {
        error('[ShanYan Network] wx 失败:', JSON.stringify(err));
        callback({ ...ERR_NETWORK_TYPE_FAILED, error: err });
      }
    });
  } catch (e) {
    error('[ShanYan Network] wx 调用异常:', e.message);
    callback(makeDynamicError(ERR_NETWORK_CALL_ERR, e.message));
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

    if (rawToken.startsWith('CT')) {
      tkPrefix = 't,';
    } else if (rawToken.startsWith('CU')) {
      tkPrefix = 'u,';
    }

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
    logDetail('[cryptographicToken] 运营商识别结果:', typePrefix === 'A1' ? '移动' : typePrefix === 'A2' ? '联通' : '电信');

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
 * @param {Function} callback - 回调函数
 * @param {string} callback.code - 结果码，'103000'=取号成功，'501'=用户取消
 * @param {string} callback.message - 结果描述
 * @param {string} callback.token - 取号凭证（用于服务端校验换取手机号）
 * @param {string} callback.userInformation - 浏览器加密指纹
 *
 * @example
 * SDK.openLoginAuth((res) => {
 *   if (res.code === '200000') {
 *     // 将 token 发送到业务服务端进行校验
 *     // 服务端调用 tokenValidate 接口换取手机号
 *     console.log('token:', res.token);
 *   } else if (res.code === '501') {
 *     console.log('用户取消授权');
 *   }
 * });
 */
function openLoginAuth(callback) {
  if (!state.initialized) {
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
        }, tokenUuid);
      }
    } catch (logError) {
      error('[ShanYan Token] 日志上报异常:', logError.message);
    }
    if (isFunction(callback)) {
      callback({ ...ERR_NOT_INITIALIZED });
    }
    return;
  }

  if (isFunction(callback) === false) {
    callback = (res) => log('[ShanYan Token]', res);
  }

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
        }, tokenUuid);
      }
    } catch (logError) {
      error('[ShanYan Token] 日志上报异常:', logError.message);
    }
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
    logDetail('[ShanYan Token] authPageType:', state.authPageType);
    logDetail('[ShanYan Token] option:', JSON.stringify(state.uiConfig));
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
        }, tokenUuid);
      }
    } catch (logError) {
      error('[ShanYan Token] 日志上报异常:', logError.message);
    }
    callback(makeDynamicError(ERR_TOKEN_SIGN_CALC_ERR, e.message));
    return;
  }

  // 构建插件请求数据
  const requestData = {
    appId: useAppId,
    sign: useSign,
    traceId: useTraceId,
    timestamp: timestamp,
    authPageType: state.authPageType,
    version: state.version,
    option: state.uiConfig,
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
        }, '');
      }
    } catch (logError) {
      error('[ShanYan Token] 日志上报异常:', logError.message);
    }
    callback(makeDynamicError(ERR_TOKEN_UUID_GEN_ERR, e.message));
    return;
  }

  // 调用微信插件的 getTokenInfo 方法
  // 插件内部会：1) 判断网络  2) 向移动服务端取号  3) 拉起授权页
  try {
    oneKeyLogin.getTokenInfo({
      data: requestData,
      success: res => {
        try {
          logDetail('[ShanYan Token] success 回调:', JSON.stringify(res));

          // 生成二次封装的加密 token（根据 token 前缀自动识别运营商）
          const encryptedToken = cryptographicToken(res, state.appId);

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
              }, uuid);
            }
          } catch (e) {
            error('[ShanYan Token] 日志上报异常:', e.message);
          }

          callback({
            ...SUCCESS_TOKEN,
            message: res.message || 'success',
            token: encryptedToken,
            userInformation: res.userInformation,
            msgId: res.msgId,
          });
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
              }, uuid);
            }
          } catch (logError) {
            error('[ShanYan Token] 日志上报异常:', logError.message);
          }
          callback(makeDynamicError(ERR_TOKEN_PROCESS_ERR, e.message));
        }
      },
      error: res => {
        try {
          logDetail('[ShanYan Token] error 回调:', JSON.stringify(res));

          // 用户取消授权视为正常流程，status=1（非异常）
          const isUserCancel = res.code === '501' || (res.message && res.message.includes('取消'));
          const status = isUserCancel ? 1 : 0;

          // 日志上报（code=103000/501 时 processName='4'，其他 processName='3'）
          const errorProcessName = (res.code === '103000' || res.code === '501') ? PROCESS_NAME.TOKEN_OK : PROCESS_NAME.TOKEN_ERR;

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
              }, uuid);
            }
          } catch (e) {
            error('[ShanYan Token] 日志上报异常:', e.message);
          }

          callback({
            code: res.code || ERR_NETWORK_TYPE_FAILED.code,
            message: res.message || ERR_NETWORK_TYPE_FAILED.message,
            msgId: res.msgId,
          });
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
              }, uuid);
            }
          } catch (logError) {
            error('[ShanYan Token] 日志上报异常:', logError.message);
          }
          callback(makeDynamicError(ERR_TOKEN_PROCESS_ERR, e.message));
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
        }, uuid);
      }
    } catch (logError) {
      error('[ShanYan Token] 日志上报异常:', logError.message);
    }
    callback(makeDynamicError(ERR_TOKEN_PLUGIN_CALL_ERR, e.message));
  }
}

/**
 * 获取插件实例（高级用法）
 *
 * 当开发者需要直接调用插件的其他方法时使用，
 * 一般场景下不需要调用此方法
 *
 * @returns {Object} 插件实例对象
 */
function getPlugin() {
  return oneKeyLogin;
}

/**
 * 获取 SDK 当前内部状态
 *
 * 用于调试，可查看当前保存的所有参数
 *
 * @returns {Object} SDK 内部状态对象
 */
function getState() {
  return { ...state };
}

/**
 * 设置 SDK 内部日志输出开关
 *
 * @param {Boolean} flag - true=开启 SDK 内部 console 日志输出，false=关闭（默认）
 */
function setLog(flag) {
  state.logEnabled = !!flag;
}

/**
 * 设置日志上报开关
 *
 * @param {Boolean} flag - true=开启上报（默认），false=关闭上报
 */
function setReport(flag) {
  state.reportEnabled = !!flag;
}

/**
 * 设置 SDK 日志详情输出开关
 *
 * 控制接口地址、入参、响应等敏感日志是否输出。
 * 需同时开启 setLog(true) 且 setDetailLog(true) 时才会输出详情日志。
 *
 * @param {Boolean} flag - true=输出详情日志，false=不输出（默认）
 */
function setDetailLog(flag) {
  state.detailLogEnabled = !!flag;
}

/**
 * 设置 SDK 运行环境
 *
 * 说明：
 * - 需在 init() 之前调用，否则默认为 production 环境
 * - 稳定环境用于开发调试，生产环境用于正式使用
 *
 * @param {string} env - 环境标识：'stable'=稳定环境，'release'=生产环境（默认）
 */
function setEnvironment(env) {
  if (env !== 'stable' && env !== 'release') {
    throw new Error('[ShanYan] setEnvironment: env must be "stable" or "release"');
  }
  config.currentEnv = env;
}

// ============================ 导出 ============================

module.exports = {
  init,           // 初始化 SDK（请求服务端获取运营商参数）
  setConfig,      // 设置授权页 UI 样式
  openLoginAuth,  // 打开一键登录授权页（拉起运营商授权页）
  getNetworkType, // 获取当前网络类型
  getPlugin,      // 获取插件实例（高级用法）
  getState,       // 获取 SDK 状态（调试用）
  setEnvironment, // 设置 SDK 运行环境（stable=稳定环境，release=生产环境，默认 release）
  setLog,         // 设置 SDK 内部日志输出开关（默认关闭）
  setReport,      // 设置日志上报开关（默认开启）
  setDetailLog,   // 设置日志详情输出开关（默认关闭）
};
