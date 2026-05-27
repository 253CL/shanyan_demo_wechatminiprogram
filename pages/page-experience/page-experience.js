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
      // 静默初始化，不展示 toast
    });
  },

  onStandardStyle() {
    wx.showToast({ title: '默认标准底部弹窗样式', icon: 'none' });
  },

  onCustomStyle1() {
    wx.showToast({ title: '自定义底部弹窗样式1', icon: 'none' });
  },

  onCustomStyle2() {
    wx.showToast({ title: '自定义底部弹窗样式2', icon: 'none' });
  },

  onCustomStyle3() {
    wx.showToast({ title: '自定义底部弹窗样式3', icon: 'none' });
  },

  onGoBack() {
    wx.navigateBack();
  },
});
