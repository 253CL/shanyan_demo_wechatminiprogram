const dlog = require('../../demo-log');
const app = getApp();

Page({
  data: {
    statusBarHeight: 20,
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
    dlog.log('[Page-Captcha] 验证码组件已准备就绪，可以启动');
  },

  handlerVerify(ev) {
    if (ev.detail.ret === 0) {
      const ticket = ev.detail.ticket;
      dlog.log('[Page-Captcha] 验证成功，收到 ticket:', ticket);
      this.verifyTicketOnServer(ticket);
    } else {
      dlog.log('[Page-Captcha] 验证失败，ret:', ev.detail.ret);
      wx.showToast({ title: '验证失败', icon: 'none' });
    }
  },

  handlerClose(ev) {
    if (ev && ev.detail && ev.detail.ret === 2) {
      dlog.log('[Page-Captcha] 用户主动点击关闭按钮，验证码弹窗关闭');
    } else {
      dlog.log('[Page-Captcha] 验证码弹窗关闭');
    }
  },

  handlerError(ev) {
    dlog.error('[Page-Captcha] 验证码配置失败 => errMsg:', ev && ev.detail ? ev.detail.errMsg : 'unknown');
    wx.showToast({ title: '验证码加载失败', icon: 'none' });
  },

  verifyTicketOnServer(ticket) {
    const requestData = {
      appId: 'eqWILZ9j',
      appKey: 'onFZ5nkI',
      AppSecretKey: 'CA7jaGZWzgnZPfvL3Pa0dno3S',
      CaptchaAppId: '191114501',
      Ticket: ticket,
      IP: '116.66.66.166',
    };
    dlog.log('[Page-Captcha] 请求服务端票据校验 => POST https://api.253.com/open/txyzm/yzmMini-v2');
    dlog.log('[Page-Captcha] 请求参数:', JSON.stringify(requestData));
    wx.request({
      url: 'https://api.253.com/open/txyzm/yzmMini-v2',
      method: 'POST',
      header: { 'content-type': 'application/x-www-form-urlencoded' },
      data: requestData,
      success: (res) => {
        dlog.log('[Page-Captcha] 服务端响应 => statusCode:', res.statusCode, 'data:', JSON.stringify(res.data));
        if (res.data && res.data.code === '200000' && res.data.data && res.data.data.CaptchaCode === '1') {
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
        dlog.error('[Page-Captcha] 服务端请求失败 => ', JSON.stringify(err));
        wx.navigateTo({
          url: '/pages/page-result/page-result?styleName=captcha&success=false&message=' + encodeURIComponent('验证失败'),
        });
      },
    });
  },
});
