/**
 * 日志上报模块
 *
 * 功能：
 * SDK 运行过程中发生的关键事件（初始化成功/失败、取号成功/失败等）
 * 会上报到创蓝日志服务器，用于问题排查和数据分析。
 *
 * 上报地址：https://h5.253.com/web/report
 *
 * 签名方式：HMAC-SHA1(加密文本, MD5(appId))
 */

const config = require('./config');
const { hmacSHA1Encrypt, md5 } = require('./crypto');

/**
 * 获取当前小程序 appId（wxId）
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
 * 获取设备信息
 */
function getDeviceInfo() {
  try {
    const systemInfo = wx.getSystemInfoSync();
    return {
      device: systemInfo.model || '',
      deviceName: systemInfo.brand || '',
    };
  } catch (e) {
    return { device: '', deviceName: '' };
  }
}

/**
 * 日志上报
 *
 * @param {Object} params - 日志参数
 * @param {string} params.appId - 应用 ID
 * @param {number} params.status - 状态：1=成功，0=失败
 * @param {string} params.telcom - 运营商标识
 * @param {string} params.processName - 阶段标识：'1'=初始化，'3'=拉起授权页，'4'=获取token
 * @param {string} params.resCode - 结果码
 * @param {string} params.resDesc - 结果描述
 * @param {string} params.sid - 会话ID（从init生成，贯穿完整流程）
 * @param {string} uuid - 本次上报的唯一标识
 */
function reportLog(params, uuid) {
  // 获取设备信息和 wxId
  const wxId = getWxId();
  const { device, deviceName } = getDeviceInfo();

  // 构建上报字段
  const sdkLog = {
    appId: params.appId,
    sign: '', // 先占位，签名计算后填入
    random: uuid,
    appPlatform: config.APP_PLATFORM,
    sdkVersion: config.SDK_VERSION,
    status: params.status,
    telcom: params.telcom || 'Unknown_Operator',
    processName: params.processName,
    resCode: params.resCode,
    resDesc: params.resDesc,
    method: params.processName,      // 值同 processName
    wxId: wxId,                      // 当前微信小程序 ID
    device: device,                  // 设备型号
    deviceName: deviceName,          // 设备厂商
    netType: params.netType || '',   // 网络类型
    sid: params.sid || '',           // 会话ID
  };

  // 构建加密文本（用于签名校验）
  const encryptText = `appId${sdkLog.appId}appPlatform${sdkLog.appPlatform}device${sdkLog.device}deviceName${sdkLog.deviceName}method${sdkLog.method}netType${sdkLog.netType}processName${sdkLog.processName}random${sdkLog.random}sdkVersion${sdkLog.sdkVersion}sid${sdkLog.sid}status${sdkLog.status}telcom${sdkLog.telcom}wxId${sdkLog.wxId}`;
  const encryptKey = md5(params.appId);
  sdkLog.sign = hmacSHA1Encrypt(encryptText, encryptKey);

  // 转换为 URL-encoded 表单数据（application/x-www-form-urlencoded）
  const formData = Object.keys(sdkLog)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(sdkLog[key])}`)
    .join('&');

  // 打印日志上报请求信息
  console.log('[ShanYan Log] 上报 URL:', config.ENV[config.currentEnv].logUrl);
  console.log('[ShanYan Log] 上报入参:', JSON.stringify(sdkLog));

  wx.request({
    url: config.ENV[config.currentEnv].logUrl,
    method: 'POST',
    data: formData,
    header: { 'Content-Type': 'application/x-www-form-urlencoded' },
    success: (res) => {
      console.log('[ShanYan Log] 上报响应:', JSON.stringify(res.data));
    },
    fail: (err) => {
      console.error('[ShanYan Log] 上报请求失败:', err);
    }
  });
}

module.exports = { reportLog };
