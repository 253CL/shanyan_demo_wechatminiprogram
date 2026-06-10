/**
 * Demo 层日志工具
 *
 * 【用途】
 * 独立于 SDK 日志，供页面层（demo 层）使用。
 * 不影响 SDK 层日志输出（SDK 层有自己的 SDK.setLog 开关）。
 *
 * 【开关】
 * 受 app.globalData.demoLogEnabled 控制，默认关闭。
 * 可在 app.js 中修改或在运行时动态调整：
 * getApp().globalData.demoLogEnabled = true;
 *
 * 【级别】
 * - log()：普通日志（对应 console.log）
 * - warn()：警告日志（对应 console.warn）
 * - error()：错误日志（对应 console.error）
 *
 * 【使用示例】
 * const dlog = require('../../demo-log');
 *
 * // 页面代码中使用
 * dlog.log('[Page-Debug] 开始初始化...');
 * dlog.warn('[Page-Debug] 警告信息');
 * dlog.error('[Page-Debug] 异常信息', e.message);
 */

/**
 * 检查 demo 日志是否开启
 *
 * @returns {boolean} true=开启, false=关闭
 *
 * 【安全】
 * 采用 try-catch 包裹，避免 getApp() 异常导致 crash
 */
function isEnabled() {
  try {
    return getApp().globalData.demoLogEnabled === true;
  } catch {
    return false;
  }
}

module.exports = {
  /**
   * 普通日志输出
   * @param {...*} args - 任意参数，会传递给 console.log
   */
  log: (...args) => { if (isEnabled()) console.log(...args); },
  /**
   * 警告日志输出
   * @param {...*} args - 任意参数，会传递给 console.warn
   */
  warn: (...args) => { if (isEnabled()) console.warn(...args); },
  /**
   * 错误日志输出
   * @param {...*} args - 任意参数，会传递给 console.error
   */
  error: (...args) => { if (isEnabled()) console.error(...args); },
};
