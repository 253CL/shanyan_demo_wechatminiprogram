const SDK = require('../../sdk/index');
const dlog = require('../../demo-log');
const app = getApp();

/**
 * 体验模式页
 *
 * 页面加载后自动初始化 SDK，提供 4 种授权页样式供体验：
 * - 默认弹窗样式：不传 option，SDK 使用默认配置
 * - 全屏样式：getFullScreenOption，蓝色品牌定制主题
 * - 自定义弹窗样式1：getMinimalPopupOption，极简单按钮
 * - 自定义弹窗样式2：getBottomPopupOption，双按钮 + 协议栏
 *
 * 授权完成后跳转到结果页，展示登录成功/失败状态。
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
    this.autoInit();
  },

  /** 自动初始化 SDK */
  autoInit() {
    SDK.setLog(true);
    SDK.init({ appId: app.globalData.appId }, (res) => {
      dlog.log('[Page-Experience] SDK init result:', JSON.stringify(res));
      if (res.code === '200000') {
        app.globalData.sdkInitialized = true;
      } else {
        dlog.warn('[Page-Experience] SDK init failed, but continuing for experience');
      }
    });
  },

  /**
   * 通用方法：使用指定 UI 预设打开授权页，完成后跳转到结果页
   * @param {Function} getPreset - UI 预设配置函数
   * @param {string} label - 样式名称（用于结果页显示）
   */
  openAuthWithStyle(getPreset, label) {
    const option = getPreset();
    SDK.openLoginAuth({ option: option }, (authRes) => {
      dlog.log('[Page-Experience] openLoginAuth result:', JSON.stringify(authRes));
      if (authRes.code === '501') {
        wx.showToast({ title: '用户取消授权', icon: 'none' });
        return;
      }
      this.navigateToResult(label, authRes);
    });
  },

  /** 跳转到授权结果页 */
  navigateToResult(styleName, authRes) {
    dlog.log('[Page-Experience] navigateToResult:', styleName, JSON.stringify(authRes));
    const params = [
      `styleName=${encodeURIComponent(styleName)}`,
      `code=${authRes.code}`,
      `message=${encodeURIComponent(authRes.message || '')}`,
    ];
    if (authRes.token) {
      params.push(`token=${encodeURIComponent(authRes.token)}`);
    }
    const url = `/pages/page-result/page-result?${params.join('&')}`;
    dlog.log('[Page-Experience] navigateTo url:', url);
    wx.navigateTo({
      url: url,
    });
  },

  /** 默认弹窗样式：不传 option，SDK 使用默认配置 */
  onStandardStyle() {
    SDK.openLoginAuth((authRes) => {
      dlog.log('[Page-Experience] openLoginAuth result:', JSON.stringify(authRes));
      if (authRes.code === '501') {
        wx.showToast({ title: '用户取消授权', icon: 'none' });
        return;
      }
      this.navigateToResult('默认弹窗样式', authRes);
    });
  },

  /** 全屏样式 */
  onCustomStyle() {
    const { getFullScreenOption } = require('../../ui-presets');
    this.openAuthWithStyle(getFullScreenOption, '全屏样式');
  },

  /** 自定义弹窗样式1（极简样式） */
  onCustomStyle1() {
    const { getMinimalPopupOption } = require('../../ui-presets');
    this.openAuthWithStyle(getMinimalPopupOption, '自定义弹窗样式1');
  },

  /** 自定义弹窗样式2（底部弹窗） */
  onCustomStyle2() {
    const { getBottomPopupOption } = require('../../ui-presets');
    this.openAuthWithStyle(getBottomPopupOption, '自定义弹窗样式2');
  },

  /** 返回上一页 */
  onGoBack() {
    wx.navigateBack();
  },
});
