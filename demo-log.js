/**
 * Demo 层日志工具
 *
 * 统一受 app.globalData.demoLogEnabled 开关控制，默认关闭。
 * SDK 层不使用此工具，不受影响。
 *
 * 使用方式：
 *   const dlog = require('../../demo-log');
 *   dlog.log('[Page-XXX] some message');
 *   dlog.warn('[Page-XXX] warning');
 *   dlog.error('[Page-XXX] error');
 */

function isEnabled() {
  try {
    return getApp().globalData.demoLogEnabled === true;
  } catch {
    return false;
  }
}

module.exports = {
  log: (...args) => { if (isEnabled()) console.log(...args); },
  warn: (...args) => { if (isEnabled()) console.warn(...args); },
  error: (...args) => { if (isEnabled()) console.error(...args); },
};
