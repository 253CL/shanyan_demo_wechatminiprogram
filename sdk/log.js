/**
 * 日志工具模块
 *
 * 统一管理 SDK 内部日志输出（console.log/error）和日志上报功能。
 * 所有日志输出受 setLog 外部开关控制，logDetail 同时受外部 setLog 和内部 _detailLogEnabled 双开关控制。
 *
 * 对外导出：log, error, logDetail, reportLog, setLog
 */

const config = require('./config');
const { hmacSHA1Encrypt, md5 } = require('./crypto');

// 日志输出开关（由 index.js 的 setLog 同步设置，受外部开关控制）
let _logEnabled = false;
// 日志详情内部开关：仅 SDK 内部控制，不对外暴露
let _detailLogEnabled = true;

/**
 * SDK 内部日志输出封装，受外部 setLog 开关控制
 */
function log() {
  if (_logEnabled) {
    console.log.apply(console, arguments);
  }
}

/**
 * SDK 内部错误日志输出封装，受外部 setLog 开关控制
 */
function error() {
  if (_logEnabled) {
    console.error.apply(console, arguments);
  }
}

/**
 * 日志详情输出封装，需同时满足外部 setLog 和内部 _detailLogEnabled 双开关
 * 用于输出接口地址、入参、响应等敏感信息，默认开启
 */
function logDetail() {
  if (_logEnabled && _detailLogEnabled) {
    console.log.apply(console, arguments);
  }
}

/**
 * 设置日志输出开关（由 index.js 的 setLog 同步调用）
 * @param {boolean} flag - true=开启日志输出，false=关闭（默认）
 */
function setLog(flag) {
  _logEnabled = !!flag;
}

/**
 * 获取当前小程序 appId（wxId），失败时返回空字符串
 * @returns {string} 小程序 appId
 */
function getWxId() {
  try {
    const accountInfo = wx.getAccountInfoSync();
    return accountInfo.miniProgram.appId || '';
  } catch (e) {
    return '';
  }
}

/**
 * 获取设备信息（型号、厂商、系统版本），失败时返回全空字符串对象
 * @returns {{device: string, deviceName: string, osVersion: string}}
 */
function getDeviceInfo() {
  try {
    const systemInfo = wx.getSystemInfoSync();
    return {
      device: systemInfo.model || '',
      deviceName: systemInfo.brand || '',
      osVersion: systemInfo.system || '',
    };
  } catch (e) {
    return { device: '', deviceName: '', osVersion: '' };
  }
}

/**
 * 日志上报
 *
 * 流程：收集设备信息 → 构建上报字段 → HMAC-SHA1 签名 → URL-encoded POST
 *
 * @param {Object} params - 日志参数
 * @param {string} params.appId - 应用 ID（必填）
 * @param {number} params.status - 状态：1=成功，0=失败
 * @param {string} params.telcom - 运营商标识：CMCC/CUCC/CTCC/Unknown_Operator
 * @param {string} params.processName - 阶段标识：'1'=初始化，'3'=openLoginAuth异常，'4'=openLoginAuth正常完成
 * @param {string} params.resCode - 结果码（SDK 内部结果码）
 * @param {string} params.resDesc - 结果描述（SDK 内部描述）
 * @param {string} params.innerCode - 内部结果码（初始化=resCode，获取token=运营商原始code）
 * @param {string} params.innerDesc - 内部结果描述（初始化=resDesc，获取token=msgId）
 * @param {string} params.sid - 会话ID（从init生成，贯穿完整流程）
 * @param {string} params.did - 浏览器加密指纹（取号后从JSSDK响应中获取）
 * @param {string} params.netType - 网络类型（wifi/4g/5g/none）
 * @param {boolean} params.fullReport - 完整日志上报开关：true=获取device/deviceName/osVersion/netType字段，false=不获取
 * @param {string} uuid - 本次上报的唯一标识（random 字段）
 */
function reportLog(params, uuid) {
  log('[ShanYan Log] 日志状态：', params.status,params.processName);
  // 获取设备信息和 wxId（仅完整模式）
  const wxId = getWxId();
  let device = '';
  let deviceName = '';
  let osVersion = '';
  let netType = '';

  if (params.fullReport !== false) {
    const info = getDeviceInfo();
    device = info.device;
    deviceName = info.deviceName;
    osVersion = info.osVersion;
    netType = params.netType || '';
  }

  // 构建上报字段
  const sdkLog = {
    appId: params.appId,            // 应用 ID
    sign: '',                       // 先占位，签名计算后填入
    random: uuid,                   // 随机标识（UUID）
    appPlatform: config.APP_PLATFORM, // 平台类型，微信小程序：5
    sdkVersion: config.SDK_VERSION, // SDK 版本号
    status: params.status,          // 方法状态，成功：1；失败：0
    telcom: params.telcom || 'Unknown_Operator', // 运营商：CMCC/CUCC/CTCC
    processName: params.processName, // 阶段标识：'1'=初始化，'3'=异常，'4'=正常完成
    resCode: params.resCode,        // 返回状态码
    resDesc: params.resDesc,        // 返回描述内容
    innerCode: params.innerCode || '', // 内部结果码（初始化=resCode，获取token=运营商原始code）
    innerDesc: params.innerDesc || '', // 内部结果描述（初始化=resDesc，获取token=msgId）
    method: params.processName,     // 值同 processName
    wxId: wxId,                     // 当前小程序 appId
    device: device,                 // 设备型号
    deviceName: deviceName,         // 设备厂商
    osVersion: osVersion,           // 设备系统版本
    netType: netType,               // 网络类型
    did: params.did || '',          // 浏览器加密指纹
    sid: params.sid || '',          // 会话 ID
  };

  // 构建加密文本（用于签名校验）：按字母顺序拼接所有上报字段
  const encryptText = `appId${sdkLog.appId}appPlatform${sdkLog.appPlatform}device${sdkLog.device}deviceName${sdkLog.deviceName}did${sdkLog.did}innerCode${sdkLog.innerCode}innerDesc${sdkLog.innerDesc}method${sdkLog.method}netType${sdkLog.netType}osVersion${sdkLog.osVersion}processName${sdkLog.processName}random${sdkLog.random}resCode${sdkLog.resCode}resDesc${sdkLog.resDesc}sdkVersion${sdkLog.sdkVersion}sid${sdkLog.sid}status${sdkLog.status}telcom${sdkLog.telcom}wxId${sdkLog.wxId}`;

  const encryptKey = md5(params.appId);
  sdkLog.sign = hmacSHA1Encrypt(encryptText, encryptKey);

  // 转换为 URL-encoded 表单数据（application/x-www-form-urlencoded）
  // 所有字段确保为字符串，避免 null/undefined 被编码为 "null"/"undefined"
  const formData = Object.keys(sdkLog)
    .map((key) => {
      const val = sdkLog[key] != null ? String(sdkLog[key]) : '';
      return `${encodeURIComponent(key)}=${encodeURIComponent(val)}`;
    })
    .join('&');

  // 打印日志上报请求信息
  logDetail('[ShanYan Log] 上报 URL:', config.ENV[config.currentEnv].logUrl);
  logDetail('[ShanYan Log] 上报入参:', JSON.stringify(sdkLog));

  wx.request({
    url: config.ENV[config.currentEnv].logUrl,
    method: 'POST',
    data: formData,
    header: { 'Content-Type': 'application/x-www-form-urlencoded' },
    success: (res) => {
      try {
        logDetail('[ShanYan Log] 上报响应:', JSON.stringify(res.data));
        if (res.data && typeof res.data === 'object' && res.data.retCode === '0') {
          log('[ShanYan Log] 日志结果1');
        } else {
          log('[ShanYan Log] 日志结果0', res.data);
        }
      } catch (e) {
        error('[ShanYan Log] 上报响应处理异常:', e.message);
      }
    },
    fail: (err) => {
      log('[ShanYan Log] 日志结果0', err);
    }
  });
}

module.exports = { reportLog, setLog, log, error, logDetail };
