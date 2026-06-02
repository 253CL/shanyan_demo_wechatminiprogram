const SDK = require('../../sdk/index');
const crypto = require('../../sdk/crypto');
const config = require('../../sdk/config');
const app = getApp();

const appId = app.globalData.appId;
const appKey = app.globalData.appKey;

/**
 * 调试模式页
 *
 * 按顺序分步测试 SDK 完整流程：
 * 1. 初始化（SDK.init）：请求服务端获取运营商取号参数，返回 traceId
 * 2. 获取 token（SDK.openLoginAuth）：拉起运营商授权页，返回加密 token
 * 3. 置换手机号（getMobile）：用 token 请求服务端换取加密手机号并 AES 解密
 *
 * 每一步完成后显示结果标记，后续步骤自动解锁。
 * token 一次有效，第三步完成后不可重复点击，需重新执行第二步。
 *
 * 安全处理：所有 wx.* API 调用、加密解密、服务端响应均包裹 try-catch，
 * 确保异常时不会导致小程序崩溃。
 */
Page({
  data: {
    statusBarHeight: 20,
    appId: app.globalData.appId,
    envLabel: app.globalData.envLabel,
    logs: [],
    stepResults: {
      init: null,
      token: null,
      mobile: null,
    },
    currentStep: 0,
    hasResults: false,
  },

  onLoad() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight || 20,
      });
    } catch (e) {
      this.setData({
        statusBarHeight: 20,
      });
    }
  },

  /** 第一步：初始化 SDK */
  onStep1Init() {
    this.appendToLog('调用 SDK.init()，请求服务端获取配置信息...');
    SDK.setLog(true);
    SDK.init({ appId }, (res) => {
      this.appendToLog(`Init 回调: ${JSON.stringify(res)}`);
      if (res.code === '200000') {
        this.setData({ 'stepResults.init': res, currentStep: 1, hasResults: true });
      } else {
        this.appendToLog(`Init 失败: ${res.message}`, true);
      }
    });
  },

  /** 第二步：拉起运营商授权页，获取加密 token（token 一次有效） */
  onStep2Token() {
    this.appendToLog('调用 SDK.openLoginAuth()，等待拉起授权页...');
    SDK.openLoginAuth((res) => {
      this.appendToLog(`openLoginAuth 回调: ${JSON.stringify(res)}`);
      if (res.code === '200000') {
        // token 一次有效，拿到新 token 后清除第三步结果
        this.setData({ 'stepResults.token': res, 'stepResults.mobile': null, currentStep: 2, hasResults: true });
      } else if (res.code === '501') {
        this.appendToLog('用户取消授权（非异常）');
      } else {
        this.appendToLog(`获取 Token 失败: ${res.message}`, true);
      }
    });
  },

  /**
   * 第三步：用 token 请求服务端换取手机号
   *
   * 请求参数：
   * - URL：config.ENV[currentEnv].mobileQueryUrl
   * - Method：POST（application/x-www-form-urlencoded）
   * - 入参：appId + sign(HMAC-SHA256) + token
   *
   * 响应处理：
   * - code='200000'：data.data.mobile 为 AES 加密手机号，用 appKey 解密
   * - 其他：显示错误信息
   *
   * 日志打印：包含请求 URL、入参、HTTP 状态码、响应数据、解密手机号
   * token 一次有效，第三步已完成后不可重复点击。
   */
  onStep3Mobile() {
    const tokenResult = this.data.stepResults.token;
    if (!tokenResult || !tokenResult.token) {
      this.appendToLog('请先完成第二步获取 token', true);
      return;
    }
    // token 一次有效，第三步已完成后不可重复点击
    if (this.data.stepResults.mobile) {
      this.appendToLog('token 已失效（一次有效），请重试第二步', true);
      return;
    }
    this.appendToLog('调用 getMobile()，请求服务端换取手机号...');

    const token = tokenResult.token;
    let sign;
    try {
      sign = crypto.hmacSHA256Sign({ appId, token }, appKey);
    } catch (e) {
      this.appendToLog(`签名计算异常: ${e.message}`, true);
      return;
    }
    const formData = `appId=${encodeURIComponent(appId)}&sign=${encodeURIComponent(sign)}&token=${encodeURIComponent(token)}`;
    const mobileUrl = config.ENV[config.currentEnv].mobileQueryUrl;

    // 打印请求信息
    console.log('[page-debug getMobile] 请求 URL:', mobileUrl);
    console.log('[page-debug getMobile] 请求入参:', formData);

    wx.request({
      url: mobileUrl,
      method: 'POST',
      data: formData,
      header: { 'Content-Type': 'application/x-www-form-urlencoded' },
      success: (res) => {
        try {
          // 打印响应信息
          console.log('[page-debug getMobile] HTTP 状态码:', res.statusCode);
          console.log('[page-debug getMobile] 响应数据:', JSON.stringify(res.data));

          if (!res.data) {
            this.appendToLog('服务端返回为空', true);
            return;
          }
          if (res.data.code === '200000') {
            try {
              const encryptedMobile = res.data.data && res.data.data.mobile;
              if (!encryptedMobile) {
                this.appendToLog('服务端返回的手机号为空', true);
                return;
              }
              const phone = crypto.aesDecrypt(encryptedMobile, appKey);
              if (!phone) {
                this.appendToLog('手机号解密返回为空', true);
                return;
              }
              console.log('[page-debug getMobile] 解密手机号:', phone);
              this.setData({ 'stepResults.mobile': { code: '200000', message: '获取成功', phone }, currentStep: 3, hasResults: true });
              this.appendToLog(`获取手机号成功: ${phone}`);
            } catch (e) {
              this.appendToLog(`手机号解密失败: ${e.message}`, true);
            }
          } else {
            this.appendToLog(`获取手机号失败: ${res.data.message || res.data.code || '未知错误'}`, true);
          }
        } catch (e) {
          this.appendToLog(`获取手机号响应处理异常: ${e.message}`, true);
        }
      },
      fail: (err) => {
        console.error('[page-debug getMobile] 请求失败:', JSON.stringify(err));
        this.appendToLog(`请求失败: ${err.errMsg}`, true);
      }
    });
  },

  /** 清空日志 */
  onClearLog() {
    this.setData({ logs: [] });
  },

  /** 追加日志 */
  appendToLog(message, isError) {
    const now = new Date();
    const time = `${this.pad(now.getHours())}:${this.pad(now.getMinutes())}:${this.pad(now.getSeconds())}`;
    const logs = [...this.data.logs, { time, message, isError: !!isError }];
    this.setData({ logs });
  },

  pad(n) {
    return n < 10 ? '0' + n : n;
  },

  /** 返回上一页 */
  onGoBack() {
    wx.navigateBack();
  },
});
