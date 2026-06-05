const crypto = require('../../sdk/crypto');
const config = require('../../sdk/config');
const dlog = require('../../demo-log');
const app = getApp();

/**
 * 授权结果页
 *
 * 基于 Android ResultActivity 实现，展示一键登录授权的成功/失败状态。
 * 成功时会调用服务端置换手机号，失败时展示错误详情。
 */
Page({
  data: {
    statusBarHeight: 20,
    styleName: '',
    isSuccess: true,
    statusText: '登录中...',
    phone: '',
    telecomText: '',
    errorText: '',
  },

  onLoad(options) {
    dlog.log('[Page-Result] onLoad options:', JSON.stringify(options));
    dlog.log('[Page-Result] globalData appId:', app.globalData.appId, 'appKey:', app.globalData.appKey, 'env:', app.globalData.envLabel);

    try {
      const windowInfo = wx.getWindowInfo();
      this.setData({
        statusBarHeight: windowInfo.statusBarHeight || 20,
      });
    } catch (e) {
      this.setData({
        statusBarHeight: 20,
      });
    }

    this.setData({
      styleName: options.styleName || '',
    });

    const resultCode = options.code;
    const resultMessage = options.message || '';
    const token = options.token || '';

    dlog.log('[Page-Result] resultCode:', resultCode, 'resultMessage:', resultMessage);
    if (resultCode === '200000') {
      this.setData({ isSuccess: true, statusText: '登录中...' });
      this.setData({ telecomText: '该能力由创蓝闪验提供' });
      this.queryMobile(app.globalData.appId, token);
    } else {
      this.setData({
        isSuccess: false,
        errorText: `状态码：${resultCode}\n错误日志：${decodeURIComponent(resultMessage)}`,
      });
    }
  },

  /** 调用服务端接口置换手机号 */
  queryMobile(appId, token) {
    dlog.log('[Page-Result] queryMobile 开始调用');
    dlog.log('[Page-Result] appId:', appId);
    dlog.log('[Page-Result] appKey:', app.globalData.appKey);
    dlog.log('[Page-Result] token:', token);

    try {
      const appKey = app.globalData.appKey;
      const timestamp = String(Date.now());

      dlog.log('[Page-Result] timestamp:', timestamp);

      const params = {
        appId: appId,
        token: token,
        timestamp: timestamp,
      };
      const sign = crypto.hmacSHA256Sign(params, appKey);

      dlog.log('[Page-Result] 签名入参:', JSON.stringify(params));
      dlog.log('[Page-Result] sign:', sign);

      const mobileQueryUrl = config.ENV[config.currentEnv].mobileQueryUrl;
      dlog.log('[Page-Result] mobileQueryUrl:', mobileQueryUrl);
      dlog.log('[Page-Result] currentEnv:', config.currentEnv);

      const requestData = `appId=${encodeURIComponent(appId)}&token=${encodeURIComponent(token)}&timestamp=${encodeURIComponent(timestamp)}&sign=${encodeURIComponent(sign)}`;
      dlog.log('[Page-Result] wx.request data (form):', requestData);

      wx.request({
        url: mobileQueryUrl,
        method: 'POST',
        data: requestData,
        header: { 'Content-Type': 'application/x-www-form-urlencoded' },
        success: (res) => {
          dlog.log('[Page-Result] wx.request success');
          dlog.log('[Page-Result] HTTP status:', res.statusCode);
          dlog.log('[Page-Result] response type:', typeof res.data);
          dlog.log('[Page-Result] response data:', JSON.stringify(res.data));

          try {
            const data = res.data;
            dlog.log('[Page-Result] data.code:', data && typeof data === 'object' ? data.code : '(非JSON响应)');

            if (data && typeof data === 'object' && data.code === '200000') {
              dlog.log('[Page-Result] 手机号置换成功');
              const mobileName = data.data ? data.data.mobile : '';
              dlog.log('[Page-Result] encrypted mobileName:', mobileName);

              const key = crypto.md5(appKey);
              dlog.log('[Page-Result] md5(appKey):', key);

              const phone = crypto.aesDecrypt(mobileName, appKey);
              dlog.log('[Page-Result] 解密手机号:', phone);

              this.setData({
                phone: phone,
                statusText: '登录成功',
              });
            } else {
              dlog.log('[Page-Result] 手机号置换失败');
              const statusCode = res.statusCode || 'unknown';
              const errorMsg = typeof data === 'string' ? data : JSON.stringify(data);
              dlog.log('[Page-Result] 展示失败 - 状态码:', statusCode, '错误日志:', errorMsg);
              this.showFail(`状态码：${statusCode}\n错误日志：${errorMsg}`);
            }
          } catch (e) {
            dlog.error('[Page-Result] success 回调处理异常:', e);
            this.showFail(`错误日志：${e.message}`);
          }
        },
        fail: (err) => {
          dlog.error('[Page-Result] wx.request fail:', JSON.stringify(err));
          this.showFail(`错误日志：${err.errMsg || '网络请求失败'}`);
        },
      });
    } catch (e) {
      dlog.error('[Page-Result] queryMobile 异常:', e);
      this.showFail(`错误日志：${e.message}`);
    }
  },

  /** 切换到失败状态 */
  showFail(errorText) {
    this.setData({
      isSuccess: false,
      statusText: '登录失败',
      errorText: errorText,
    });
  },

  /** 返回体验模式页 */
  onTryAgain() {
    wx.navigateBack();
  },

  /** 返回上一页 */
  onGoBack() {
    wx.navigateBack();
  },
});
