Page({
  data: {
    statusBarHeight: 20,
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20,
    });
  },

  onExperienceMode() {
    wx.navigateTo({ url: '/pages/page-experience/page-experience' });
  },

  onDebugMode() {
    wx.navigateTo({ url: '/pages/page-debug/page-debug' });
  },
});
