const SDK = require('../../sdk/index');

Page({
  data: {
    statusBarHeight: 20,
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20,
    });

    // 进入页面后自动调用 SDK 初始化
    this.autoInit();
  },

  autoInit() {
    const appId = '9IQdkCRI';
    SDK.setLog(true);
    SDK.init({ appId }, (res) => {
      console.log('Page-Experience SDK init result:', res);
      if (res.code === '000000') {
        wx.showToast({ title: '初始化成功', icon: 'success' });
      } else {
        wx.showToast({ title: '初始化失败: ' + res.message, icon: 'none' });
      }
    });
  },

  onStandardStyle() {
    wx.showToast({ title: '标准底部弹窗样式', icon: 'none' });
    // 此处可接入实际的标准样式逻辑
  },

  onCustomStyle() {
    wx.showToast({ title: '自定义底部弹窗样式', icon: 'none' });
    // 此处可接入实际的自定义样式逻辑
  },

  onGoBack() {
    wx.navigateBack();
  },
});
