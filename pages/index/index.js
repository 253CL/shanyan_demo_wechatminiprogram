/**
 * 首页 - 模式选择页
 *
 * 提供两个入口：
 * - 体验模式：展示不同 UI 样式的授权页效果（4 种预设样式）
 * - 调试模式：分步测试 SDK 完整流程（初始化 → 取号 → 换手机号）
 *
 * 安全处理：wx.getSystemInfoSync 包裹 try-catch，失败时回退到默认值。
 */
Page({
  data: {
    statusBarHeight: 20,
  },

  onLoad() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight || 20,
      });
    } catch (e) {
      this.setData({
        statusBarHeight: 20,
      });
    }
  },

  /** 进入体验模式 */
  onExperienceMode() {
    wx.navigateTo({ url: '/pages/page-experience/page-experience' });
  },

  /** 进入调试模式 */
  onDebugMode() {
    wx.navigateTo({ url: '/pages/page-debug/page-debug' });
  },
});
