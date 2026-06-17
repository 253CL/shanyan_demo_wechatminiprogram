const dlog = require('../../demo-log');
const app = getApp();

Page({
  data: {
    statusBarHeight: 20,
    captchaAppId: '',
  },

  onLoad() {
    try {
      const windowInfo = wx.getWindowInfo();
      this.setData({
        statusBarHeight: windowInfo.statusBarHeight || 20,
      });
    } catch (e) {
      this.setData({ statusBarHeight: 20 });
    }
    const g = app.globalData;
    if (g.captchaCaptchaAppId) {
      this.setData({ captchaAppId: g.captchaCaptchaAppId });
    }
    dlog.log('[Page-Captcha] 验证码配置信息 =>');
    dlog.log('  appId:', g.captchaAppId);
    dlog.log('  CaptchaAppId:', g.captchaCaptchaAppId);
    dlog.log('  AppSecretKey:', g.captchaAppSecretKey);
    dlog.log('  票据请求地址:', g.captchaTicketUrl);
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  onShowCaptcha() {
    const captcha = this.selectComponent('#captcha');
    if (!captcha) {
      wx.showToast({ title: '验证码组件未加载', icon: 'none' });
      return;
    }
    dlog.log('[Page-Captcha] 准备启动验证码弹窗');
    try {
      captcha.show();
      dlog.log('[Page-Captcha] captcha.show() 调用成功');
    } catch (e) {
      dlog.error('[Page-Captcha] captcha.show() 调用异常:', e);
      captcha.refresh();
    }
  },

  handlerReady() {
    this.setData({ captchaReady: true });
    dlog.log('[Page-Captcha] 回调 => handlerReady，验证码组件已准备就绪');
  },

  handlerVerify(ev) {
    dlog.log('[Page-Captcha] 回调 => handlerVerify, ev.detail:', JSON.stringify(ev.detail));
    if (ev.detail.ret === 0) {
      const ticket = ev.detail.ticket;
      dlog.log('[Page-Captcha] 验证成功，ticket:', ticket);
      this.verifyTicketOnServer(ticket);
    } else {
      dlog.log('[Page-Captcha] 验证失败，ret:', ev.detail.ret);
      wx.showToast({ title: '验证失败', icon: 'none' });
    }
  },

  handlerClose(ev) {
    dlog.log('[Page-Captcha] 回调 => handlerClose, ev.detail:', JSON.stringify(ev.detail));
    if (ev && ev.detail && ev.detail.ret === 2) {
      dlog.log('[Page-Captcha] 用户主动点击关闭按钮，验证码弹窗关闭');
    } else {
      dlog.log('[Page-Captcha] 验证码弹窗关闭');
    }
  },

  handlerError(ev) {
    dlog.log('[Page-Captcha] 回调 => handlerError, ev.detail:', JSON.stringify(ev.detail));
    dlog.error('[Page-Captcha] 验证码配置失败 => errMsg:', ev && ev.detail ? ev.detail.errMsg : 'unknown');
    wx.showToast({ title: '验证码加载失败', icon: 'none' });
  },

  verifyTicketOnServer(ticket) {
    const g = app.globalData;
    const requestData = {
      appId: g.captchaAppId || '',
      appKey: g.captchaAppKey || '',
      AppSecretKey: g.captchaAppSecretKey || '',
      CaptchaAppId: g.captchaCaptchaAppId || '',
      Ticket: ticket,
      IP: g.captchaTicketIp || '',
    };
    const ticketUrl = g.captchaTicketUrl || 'https://api.253.com/open/txyzm/yzmMini-v2';
    dlog.log('[Page-Captcha] 请求服务端票据校验 => POST ' + ticketUrl);
    dlog.log('[Page-Captcha] 请求参数:', JSON.stringify(requestData));
    wx.request({
      url: ticketUrl,
      method: 'POST',
      header: { 'content-type': 'application/x-www-form-urlencoded' },
      data: requestData,
      success: (res) => {
        dlog.log('[Page-Captcha] 服务端响应回调 => statusCode:', res.statusCode);
        dlog.log('[Page-Captcha] 响应数据:', JSON.stringify(res.data));
        if (res.data && res.data.code === '200000' && res.data.data && res.data.data.CaptchaCode === '1') {
          dlog.log('[Page-Captcha] 验证通过，跳转结果页');
          wx.navigateTo({
            url: '/pages/page-result/page-result?styleName=captcha&success=true&ticket=' + ticket + '&message=' + encodeURIComponent('验证通过'),
          });
        } else {
          const msg = (res.data && res.data.data && res.data.data.CaptchaMsg) || (res.data && res.data.message) || '验证失败';
          const captchaCode = (res.data && res.data.data && res.data.data.CaptchaCode) || '';
          dlog.warn('[Page-Captcha] 验证未通过 => CaptchaCode:', captchaCode, 'CaptchaMsg:', msg);
          wx.navigateTo({
            url: '/pages/page-result/page-result?styleName=captcha&success=false&captchaCode=' + captchaCode + '&message=' + encodeURIComponent(msg),
          });
        }
      },
      fail: (err) => {
        dlog.error('[Page-Captcha] 服务端请求失败 =>', JSON.stringify(err));
        wx.navigateTo({
          url: '/pages/page-result/page-result?styleName=captcha&success=false&message=' + encodeURIComponent('验证失败'),
        });
      },
    });
  },

  onShareAppMessage() {
    return {
      title: '一键登录Demo',
      path: '/pages/page-captcha/index',
      imageUrl: '',
    };
  },

  onShareTimeline() {
    return {
      title: '一键登录Demo',
      query: '',
      imageUrl: '',
    };
  },
});
