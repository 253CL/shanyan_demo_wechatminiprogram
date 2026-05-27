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
 * 日志上报
 *
 * @param {Object} params - 日志参数
 * @param {string} params.appId - 应用 ID
 * @param {number} params.status - 状态：1=成功，0=失败
 * @param {string} params.telcom - 运营商标识
 * @param {string} params.processName - 阶段标识：'1'=初始化，'3'=拉起授权页，'4'=获取token
 * @param {string} params.resCode - 结果码
 * @param {string} params.resDesc - 结果描述
 * @param {string} uuid - 本次上报的唯一标识
 */
function reportLog(params, uuid) {
  // 构建加密文本（用于签名校验）
  const encryptText = `appId${params.appId}appPlatform${config.APP_PLATFORM}processName${params.processName}random${uuid}sdkVersion${config.SDK_VERSION}status${params.status}telcom${params.telcom}`;
  const encryptKey = md5(params.appId);
  const sign = hmacSHA1Encrypt(encryptText, encryptKey);

  const sdkLog = {
    appId: params.appId,
    sign: sign,
    random: uuid,
    appPlatform: config.APP_PLATFORM,
    sdkVersion: config.SDK_VERSION,
    status: params.status,
    telcom: params.telcom,
    processName: params.processName,
    resCode: params.resCode,
    resDesc: params.resDesc,
  };

  // 转换为 URL-encoded 表单数据（application/x-www-form-urlencoded）
  const formData = Object.keys(sdkLog)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(sdkLog[key])}`)
    .join('&');

  wx.request({
    url: config.LOG_URL,
    method: 'POST',
    data: formData,
    header: { 'Content-Type': 'application/x-www-form-urlencoded' },
    success: () => {
      console.log('[ShanYan Log] 日志上报成功', params.resDesc);
    },
    fail: (err) => {
      // 日志上报失败不影响主流程，仅打印错误
      console.error('[ShanYan Log] 日志上报失败', err);
    }
  });
}

module.exports = { reportLog };
