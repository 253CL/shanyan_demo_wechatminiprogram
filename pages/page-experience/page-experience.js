const SDK = require('shanyan-miniprogram-sdk');
const dlog = require('../../demo-log');
const app = getApp();

/**
 * 体验模式页 - 展示多种授权页 UI 样式
 *
 * 【业务流程】
 * 1. 页面加载时自动初始化 SDK（请求服务端获取运营商参数）
 * 2. 提供 4 个按钮，用户可选择体验不同的授权页样式
 * 3. 点击按钮后拉起对应样式的授权页
 * 4. 授权完成后跳转到结果页展示 token 和状态
 *
 * 【样式对比】
 * 按钮 1：默认样式 - 不传 option，使用 SDK 内置默认配置
 * 按钮 2：全屏样式 - 占满屏幕，蓝色品牌定制主题，Logo + 大按钮
 * 按钮 3：极简样式 - 小圆角弹窗，单个大按钮，最小化非必要信息
 * 按钮 4：标准样式 - 底部圆角弹窗，双按钮布局，完整功能（协议栏）
 *
 * 【技术细节】
 * - 页面加载时自动初始化，即使失败也继续（提供体验）
 * - wx.getWindowInfo 获取状态栏高度，适配不同设备
 * - 每次授权完成时将结果编码为 URL 参数传递到结果页
 */
Page({
  data: {
    statusBarHeight: 20,
  },

  /**
   * 页面加载时触发
   * 1. 获取状态栏高度（适配刘海屏等异形屏幕）
   * 2. 自动初始化 SDK（请求服务端获取运营商参数）
   */
  onLoad() {
    try {
      const windowInfo = wx.getWindowInfo();
      this.setData({
        statusBarHeight: windowInfo.statusBarHeight || 20,
      });
    } catch (e) {
      this.setData({
        statusBarHeight: 20,
      });
    }
    this.autoInit();
  },

  /**
   * 自动初始化 SDK
   *
   * 【流程】
   * 1. 开启 SDK 日志输出
   * 2. 调用 SDK.init()
   * 3. 记录初始化结果到 globalData（仅用于标记，不阻断后续流程）
   *
   * 【重要】
   * 即使初始化失败也不中止，用户可继续体验其他样式
   */
  autoInit() {
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
   *
   * @param {Function} getPreset - 返回 UI 配置对象的函数（如 getBottomPopupOption）
   * @param {string} label - 样式名称，用于结果页展示
   *
   * 【流程】
   * 1. 调用 getPreset() 生成 UI 配置
   * 2. 调用 SDK.openLoginAuth() 拉起授权页
   * 3. 授权完成后跳转到结果页，传递 token 和状态
   */
  openAuthWithStyle(getPreset, label) {
    const option = getPreset();
    dlog.log('[Page-Experience] openAuthWithStyle 拉起授权页, label:', label);
    SDK.openLoginAuth({ option: option }, (authRes) => {
      dlog.log('[Page-Experience] openLoginAuth result:', JSON.stringify(authRes));
      dlog.log('[Page-Experience] authRes.code:', authRes && authRes.code, 'type:', typeof authRes);
      if (authRes.code === '501') {
        // 全屏样式中"其他登录方式"按钮返回 501，跳转到行为验证码
        if (label === '全屏样式') {
          dlog.log('[Page-Experience] 全屏样式用户选择其他登录方式 (501)，跳转到行为验证码页');
          wx.switchTab({
            url: '/pages/page-captcha/index',
            success: () => { dlog.log('[Page-Experience] switchTab 跳转成功'); },
            fail: (err) => { dlog.error('[Page-Experience] switchTab 跳转失败:', JSON.stringify(err)); },
          });
          return;
        }
        dlog.log('[Page-Experience] 用户取消授权 (501)');
        wx.showToast({ title: '用户取消授权', icon: 'none' });
        return;
      }
      if (authRes.code === '502') {
        dlog.log('[Page-Experience] 用户选择其他登录方式 (502)，跳转到行为验证码页');
        wx.switchTab({
          url: '/pages/page-captcha/index',
          success: () => { dlog.log('[Page-Experience] switchTab 跳转成功'); },
          fail: (err) => { dlog.error('[Page-Experience] switchTab 跳转失败:', JSON.stringify(err)); },
        });
        return;
      }
      this.navigateToResult(label, authRes);
    });
  },

  /**
   * 跳转到结果页
   *
   * @param {string} styleName - 样式名称
   * @param {Object} authRes - 授权结果（包含 code, message, token 等）
   *
   * 【URL 参数】
   * - styleName：页面显示的样式名称
   * - code：授权结果码（200000=成功）
   * - message：结果描述
   * - token：加密 token（仅成功时有值）
   *
   * 【编码】
   * 所有参数都做 URL encode，避免特殊字符破坏 URL
   */
  navigateToResult(styleName, authRes) {
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
      if (authRes.code === '502') {
        dlog.log('[Page-Experience] 用户选择其他登录方式 (502)，跳转到行为验证码页');
        wx.switchTab({
          url: '/pages/page-captcha/index',
          success: () => { dlog.log('[Page-Experience] switchTab 跳转成功'); },
          fail: (err) => { dlog.error('[Page-Experience] switchTab 跳转失败:', JSON.stringify(err)); },
        });
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
