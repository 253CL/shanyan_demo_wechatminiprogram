/**
 * 隐私政策弹窗组件
 * 首次启动时显示，用户同意后才允许继续使用。
 */
Component({
  data: {
    visible: false,
  },

  methods: {
    checkAndShow() {
      const agreed = wx.getStorageSync('privacyAgreed');
      if (!agreed) {
        this.setData({ visible: true });
      }
    },

    forceShow() {
      this.setData({ visible: true });
    },

    onAgree() {
      wx.setStorageSync('privacyAgreed', true);
      this.setData({ visible: false });
      this.triggerEvent('agree');
    },

    onDisagree() {
      this.setData({ visible: false });
      wx.exitMiniProgram();
    },

    onReadPrivacy() {
      wx.navigateTo({ url: '/pages/contract/index?type=privacy' });
    },

    onReadService() {
      wx.navigateTo({ url: '/pages/contract/index?type=service' });
    },

    stopPropagation() {
      // 阻止遮罩层点击事件冒泡
    },
  },
});
