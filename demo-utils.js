/**
 * Demo 工具模块
 *
 * 提供 Demo 页面所需的加密和配置功能，避免直接引用 SDK 内部子模块
 * （微信小程序真机不支持 npm 子路径导入，如 require('shanyan-miniprogram-sdk/crypto')）。
 *
 * 包含：
 * - CryptoJS 封装：hmacSHA256Sign、aesDecrypt、md5
 * - 环境配置映射：getMobileQueryUrl
 */

const CryptoJS = require('crypto-js');

// ============================ 加密工具 ============================

/**
 * MD5 哈希
 * @param {string} str - 待加密字符串
 * @returns {string} 32位小写 MD5 值
 */
function md5(str) {
  if (!str) return '';
  return CryptoJS.MD5(str).toString();
}

/**
 * HMAC-SHA256 签名（按 key 排序后拼接内容再签名）
 * 用于 getMobile 接口签名
 *
 * @param {Object} obj - 待签名参数对象
 * @param {string} secretKey - 密钥（appKey）
 * @returns {string} Hex 编码的 HMAC-SHA256 签名
 */
function hmacSHA256Sign(obj, secretKey) {
  const sortedProperties = Object.keys(obj).sort();
  const concatenatedProperties = sortedProperties.map((key) => `${key}${obj[key]}`).join('');
  const hash = CryptoJS.HmacSHA256(concatenatedProperties, secretKey);
  return hash.toString(CryptoJS.enc.Hex);
}

/**
 * AES-CBC 解密（解密服务端返回的加密手机号）
 *
 * 原理：
 * 1. 对 seed（appKey）做 MD5，得到 32 位 hex 字符串
 * 2. 前 16 位作为 AES key，后 16 位作为 AES iv
 * 3. 使用 CBC 模式 + PKCS7 填充进行解密
 *
 * @param {string} content - 加密内容（Base64 编码的 hex 字符串）
 * @param {string} seed - 密钥种子（appKey）
 * @returns {string} 解密后的明文手机号，失败时返回空字符串
 */
function aesDecrypt(content, seed) {
  try {
    const md5Key = md5(seed);
    const keyStr = md5Key.substring(0, 16);
    const ivStr = md5Key.substring(16);
    const key = CryptoJS.enc.Utf8.parse(keyStr);
    const iv = CryptoJS.enc.Utf8.parse(ivStr);
    const encryptedHexStr = CryptoJS.enc.Hex.parse(content);
    const srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
    const decrypt = CryptoJS.AES.decrypt(srcs, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return decrypt.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('aesDecrypt error:', error.message);
    return '';
  }
}

// ============================ 环境配置 ============================

/**
 * 手机号查询接口地址映射
 * 与 app.js 中 ENV_MAP 的 sdkEnv 对应
 */
const MOBILE_QUERY_URL = {
  stable: 'https://110.cm253.com:8445/open/web/wxprog-mobile-query',
  release: 'https://api.253.com/open/web/wxprog-mobile-query',
};

/**
 * 根据环境标识获取手机号查询接口地址
 * @param {string} envLabel - 环境标识，如 'stable环境' 或 'release环境'
 * @returns {string} 接口 URL
 */
function getMobileQueryUrl(envLabel) {
  if (envLabel && envLabel.indexOf('stable') !== -1) {
    return MOBILE_QUERY_URL.stable;
  }
  return MOBILE_QUERY_URL.release;
}

module.exports = {
  md5,
  hmacSHA256Sign,
  aesDecrypt,
  getMobileQueryUrl,
};
