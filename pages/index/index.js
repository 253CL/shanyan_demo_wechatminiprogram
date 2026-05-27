Page({
  data: {},

  onExperienceMode() {
    wx.navigateTo({ url: '/pages/page-experience/page-experience' });
  },

  onDebugMode() {
    wx.navigateTo({ url: '/pages/page-debug/page-debug' });
  },
});
