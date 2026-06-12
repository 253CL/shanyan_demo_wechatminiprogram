/**
 * 首页 - 模式选择页
 *
 * 【页面功能】
 * 提供两个入口，用户可选择进入不同的功能模式：
 * 1. 体验模式：展示 SDK 授权页的 4 种预设 UI 样式（可直观感受不同品牌风格）
 * 2. 调试模式：分步测试 SDK 完整业务流程（初始化 → 取号 → 换手机号）
 *
 * 【技术细节】
 * - 使用 wx.getWindowInfo() 获取状态栏高度，适配不同设备的刘海屏
 * - 获取失败时回退到默认值 20px，确保不因 API 异常而崩溃
 */
Page({
  data: {
    statusBarHeight: 20,  // 状态栏高度（px），用于兼容不同设备
  },

  /**
   * 页面加载时触发
   * 获取设备的状态栏高度用于适配刘海屏等异形屏幕
   */
  onLoad() {
    try {
      const windowInfo = wx.getWindowInfo();
      this.setData({
        statusBarHeight: windowInfo.statusBarHeight || 20,
      });
    } catch (e) {
      // 获取失败时使用默认值，避免小程序崩溃
      this.setData({
        statusBarHeight: 20,
      });
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  /**
   * 进入体验模式
   * 导航至体验页面，展示多种授权页样式预设
   */
  onExperienceMode() {
    wx.navigateTo({ url: '/pages/page-experience/page-experience' });
  },

  /**
   * 进入调试模式
   * 导航至调试页面，分步测试 SDK 完整流程
   */
  onDebugMode() {
    wx.navigateTo({ url: '/pages/page-debug/page-debug' });
  },

  /**
   * 分享给好友
   */
  onShareAppMessage() {
    return {
      title: '一键登录Demo',
      path: '/pages/index/index',
      imageUrl: '',
    };
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    return {
      title: '一键登录Demo',
      query: '',
      imageUrl: '',
    };
  },
});
