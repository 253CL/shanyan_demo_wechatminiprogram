/**
 * 闪验小程序 SDK Demo - 应用入口
 */

App({
  globalData: {
    sdkInitialized: false  // SDK 全局初始化状态
  },

  /**
   * 小程序启动时触发（冷启动时调用）
   */
  onLaunch() {
    console.log('App launched');
  }
});
