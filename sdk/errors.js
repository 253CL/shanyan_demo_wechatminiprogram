/**
 * SDK 错误码常量
 *
 * 所有错误码使用 UPPERCASE_WITH_UNDERSCORES 命名，按功能域分组。
 *
 * 使用方式：
 *   const { ERR_INVALID_PARAMS, makeDynamicError } = require('./errors');
 *
 *   // 静态错误
 *   callback({ ...ERR_INVALID_PARAMS });
 *
 *   // 动态错误（拼接 e.message）
 *   callback(makeDynamicError(ERR_SDK_INIT_ERR, e.message));
 *   // => { code: '000600', message: 'SDK 初始化异常: actual error' }
 *
 * 注意：服务端返回的错误码（retCode/retMsg）不在本模块预定义，直接透传。
 *
 * 成功码说明：
 * - SUCCESS_INIT.code = '200000'（初始化成功）
 * - SUCCESS_TOKEN.code = '200000'（获取 token 成功）
 * - SUCCESS_MOBILE.code = '200000'（获取手机号成功）
 */

// ============================ 成功码 ============================

const SUCCESS_INIT = { code: '200000', message: '初始化成功' };
const SUCCESS_TOKEN = { code: '200000', message: '获取token成功' };
const SUCCESS_MOBILE = { code: '200000', message: '获取手机号成功' };

// ============================ 0004xx - 服务端通信错误 ============================

const ERR_SERVER_EMPTY_RESPONSE = { code: '000400', message: '服务端响应为空' };
const ERR_SERVER_REQUEST_FAILED = { code: '000401', message: '请求服务端失败' };
const ERR_INIT_TIMEOUT = { code: '001023', message: '超时' };

// ============================ 0005xx - 参数与前置条件错误 ============================

const ERR_NOT_INITIALIZED = { code: '000500', message: '请先调用 init 初始化' };
const ERR_MOBILE_APPID_NOT_INIT = { code: '000501', message: '移动 appId 未初始化，请检查 init 是否成功' };
const ERR_APPID_REQUIRED = { code: '000520', message: 'appId 必传' };

// ============================ 0006xx - SDK 内部异常 ============================
// 注：这些错误配合 makeDynamicError 使用，会在 message 后拼接动态错误详情

const ERR_SDK_INIT_ERR = { code: '000600', message: 'SDK 初始化异常' };
const ERR_SDK_RESPONSE_PROCESS_ERR = { code: '000601', message: 'SDK 响应处理异常' };
const ERR_TOKEN_SIGN_CALC_ERR = { code: '000602', message: 'Token 签名计算异常' };
const ERR_TOKEN_UUID_GEN_ERR = { code: '000603', message: 'Token UUID 生成异常' };
const ERR_TOKEN_PROCESS_ERR = { code: '000604', message: 'Token 处理异常' };
const ERR_TOKEN_PLUGIN_CALL_ERR = { code: '000605', message: 'Token 插件调用异常' };
const ERR_NETWORK_PROCESS_ERR = { code: '000606', message: '网络类型处理异常' };
const ERR_NETWORK_CALL_ERR = { code: '000607', message: '网络类型调用异常' };

// ============================ 其他业务码 ============================

const ERR_NETWORK_TYPE_FAILED = { code: '000001', message: '获取网络类型失败' };

// ============================ 辅助函数 ============================

function makeDynamicError(prefixObj, detail) {
  return {
    code: prefixObj.code,
    message: prefixObj.message + ': ' + (detail || ''),
  };
}

// ============================ 导出 ============================

module.exports = {
  // 成功码
  SUCCESS_INIT,
  SUCCESS_TOKEN,
  SUCCESS_MOBILE,

  // 服务端通信错误
  ERR_SERVER_EMPTY_RESPONSE,
  ERR_SERVER_REQUEST_FAILED,
  ERR_INIT_TIMEOUT,

  // 参数与前置条件错误
  ERR_NOT_INITIALIZED,
  ERR_MOBILE_APPID_NOT_INIT,
  ERR_APPID_REQUIRED,

  // SDK 内部异常（配合 makeDynamicError 使用）
  ERR_SDK_INIT_ERR,
  ERR_SDK_RESPONSE_PROCESS_ERR,
  ERR_TOKEN_SIGN_CALC_ERR,
  ERR_TOKEN_UUID_GEN_ERR,
  ERR_TOKEN_PROCESS_ERR,
  ERR_TOKEN_PLUGIN_CALL_ERR,
  ERR_NETWORK_PROCESS_ERR,
  ERR_NETWORK_CALL_ERR,

  // 其他
  ERR_NETWORK_TYPE_FAILED,

  // 辅助函数
  makeDynamicError,
};
