/**
 * 加密工具模块
 *
 * 基于 crypto-js 库提供 SDK 所需的加密/解密能力。
 *
 * 主要用途：
 * 1. MD5：生成请求签名（取号时的 sign 参数）
 * 2. HMAC-SHA1：日志上报签名
 * 3. AES-CBC：解密服务端返回的加密手机号
 * 4. UUID：生成请求追踪 ID（traceId）
 */

const CryptoJS = require('crypto-js');

/**
 * MD5 哈希
 * 用于取号请求时的 sign 签名计算
 *
 * @param {string} str - 待加密字符串
 * @returns {string} 32位小写 MD5 值
 *
 * @example
 * md5('hello') // '5d41402abc4b2a76b9719d911017c592'
 */
function md5(str) {
  if (!str) return '';
  return CryptoJS.MD5(str).toString();
}

/**
 * HMAC-SHA1 加密 + Base64 编码
 * 用于日志上报签名
 *
 * @param {string} encryptText - 待加密文本
 * @param {string} encryptKey - 密钥（MD5(appId)）
 * @returns {string} Base64 编码的 HMAC-SHA1 值
 */
function hmacSHA1Encrypt(encryptText, encryptKey) {
  try {
    const key = CryptoJS.enc.Utf8.parse(encryptKey);
    const hash = CryptoJS.HmacSHA1(encryptText, key);
    return CryptoJS.enc.Base64.stringify(hash);
  } catch (error) {
    console.error('hmacSHA1Encrypt error:', error.message);
    return null;
  }
}

/**
 * AES-CBC 解密（用于解密手机号）
 *
 * 原理：
 * 1. 对 seed（appkey）做 MD5，得到 32 位 hex 字符串
 * 2. 前 16 位作为 AES key，后 16 位作为 AES iv
 * 3. 使用 CBC 模式 + PKCS7 填充进行解密
 *
 * @param {string} content - 加密内容（Base64 编码的 hex 字符串）
 * @param {string} seed - 密钥种子（appkey）
 * @returns {string} 解密后的明文（手机号）
 */
function aesDecrypt(content, seed) {
  const md5Key = md5(seed);
  const keyStr = md5Key.substring(0, 16);  // AES key：MD5 前 16 位
  const ivStr = md5Key.substring(16);       // AES iv：MD5 后 16 位
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
}

/**
 * AES-CBC 加密 JSON 对象为 Base64 字符串
 * 用于生成 cryptographicToken 中的加密 payload
 */
function aesEncryptObject(str, obj) {
  const md5Key = md5(str);
  const keyStr = md5Key.substring(0, 16);
  const ivStr = md5Key.substring(16);
  const key = CryptoJS.enc.Utf8.parse(keyStr);
  const iv = CryptoJS.enc.Utf8.parse(ivStr);
  try {
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(obj), key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
  } catch (error) {
    console.error('aesEncryptObject error:', error);
    return null;
  }
}

/**
 * HMAC-SHA256 签名（按 key 排序后拼接内容再签名）
 * 用于调试模式页面的 getMobile 接口签名
 */
function hmacSHA256Sign(obj, secretKey) {
  const sortedProperties = Object.keys(obj).sort();
  const concatenatedProperties = sortedProperties.map((key) => `${key}${obj[key]}`).join('');
  const hash = CryptoJS.HmacSHA256(concatenatedProperties, secretKey);
  return hash.toString(CryptoJS.enc.Hex);
}

/**
 * 生成 UUID v4
 * 用于生成 traceId（请求追踪 ID）
 *
 * @returns {string} UUID 字符串，如 'a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7'
 */
function guid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * URL-safe Base64 转换
 * 将标准 Base64 中的 +/= 替换为 -_，用于 URL 传输
 */
function convertSign(sign) {
  return sign.replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '');
}

/**
 * 生成指定长度的随机数字串
 */
function generateRandomBitNumber(length) {
  let result = '';
  const characters = '0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

module.exports = {
  md5,
  hmacSHA1Encrypt,
  aesDecrypt,
  aesEncryptObject,
  hmacSHA256Sign,
  guid,
  convertSign,
  generateRandomBitNumber
};
