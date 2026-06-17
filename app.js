/**
 * 闪验小程序 SDK Demo - 应用入口
 *
 * 【核心职责】
 * 1. 环境配置统一管理：根据小程序版本选择 SDK 环境、appId、appKey
 * 2. 初始化 SDK：设置运行环境、清理缓存
 * 3. 暴露全局数据：各页面通过 getApp().globalData 获取配置信息
 *
 * 【环境说明】
 * ENV_MAP 定义了各小程序版本对应的配置：
 * - develop：微信开发者工具（手动创建应用，stable 环境）
 * - develop1：微信开发者工具（接口创建应用，stable 环境）- 默认使用
 * - trial：体验版（release 环境）
 * - release：正式版（release 环境）
 *
 * 【切换方式】
 * 修改 onLaunch 中的 envConfig 取值即可切换环境。
 */

const SDK = require('shanyan-miniprogram-sdk');

// 环境配置映射：根据小程序版本自动选择对应环境
const ENV_MAP = {
  // 开发环境1：微信开发者工具（手动创建应用）
  develop: {
    sdkEnv: 'stable', appId: 'CTbdVdtt', appKey: 'R20fq6CI', label: 'stable环境',
    captchaAppId: '2WnLTCAO', captchaAppKey: '8I8mDVCH', captchaCaptchaAppId: '193227887',
    captchaAppSecretKey: 'dzTLWJCe2klffFfWDOSY3TZ9Q', captchaTicketUrl: 'http://172.16.43.43:7777/open/txyzm/yzmMini-v2', captchaTicketIp: '116.66.66.166',
  },
  // 开发环境2：微信开发者工具（接口创建应用）- 推荐使用
  develop1: {
    sdkEnv: 'stable', appId: 'hfaqtYRe', appKey: 'BS5N82tT', label: 'stable环境',
    captchaAppId: '2WnLTCAO', captchaAppKey: '8I8mDVCH', captchaCaptchaAppId: '193227887',
    captchaAppSecretKey: 'dzTLWJCe2klffFfWDOSY3TZ9Q', captchaTicketUrl: 'http://172.16.43.43:7777/open/txyzm/yzmMini-v2', captchaTicketIp: '116.66.66.166',
  },
  // 体验版
  trial: {
    sdkEnv: 'release', appId: 'lGBu6YuW', appKey: 'QEI2xcBY', label: 'release环境',
    captchaAppId: 'eqWILZ9j', captchaAppKey: 'onFZ5nkI', captchaCaptchaAppId: '191114501',
    captchaAppSecretKey: 'CA7jaGZWzgnZPfvL3Pa0dno3S', captchaTicketUrl: 'https://api.253.com/open/txyzm/yzmMini-v2', captchaTicketIp: '116.66.66.166',
  },
  // 正式版
  release: {
    sdkEnv: 'release', appId: 'lGBu6YuW', appKey: 'QEI2xcBY', label: 'release环境',
    captchaAppId: 'eqWILZ9j', captchaAppKey: 'onFZ5nkI', captchaCaptchaAppId: '191114501',
    captchaAppSecretKey: 'CA7jaGZWzgnZPfvL3Pa0dno3S', captchaTicketUrl: 'https://api.253.com/open/txyzm/yzmMini-v2', captchaTicketIp: '116.66.66.166',
  },
};

App({
  globalData: {
    sdkInitialized: false,
    appId: '',
    appKey: '',
    envLabel: '',
    demoLogEnabled: true,
    // 行为验证码配置
    captchaAppId: '',
    captchaAppKey: '',
    captchaCaptchaAppId: '',
    captchaAppSecretKey: '',
    captchaTicketUrl: '',
    captchaTicketIp: '',
  },

  onLaunch() {
    const envConfig = ENV_MAP.develop;
    this.globalData.appId = envConfig.appId;
    this.globalData.appKey = envConfig.appKey;
    this.globalData.envLabel = envConfig.label;
    this.globalData.captchaAppId = envConfig.captchaAppId;
    this.globalData.captchaAppKey = envConfig.captchaAppKey;
    this.globalData.captchaCaptchaAppId = envConfig.captchaCaptchaAppId;
    this.globalData.captchaAppSecretKey = envConfig.captchaAppSecretKey;
    this.globalData.captchaTicketUrl = envConfig.captchaTicketUrl;
    this.globalData.captchaTicketIp = envConfig.captchaTicketIp;

    console.log(`[App] 启动成功，当前环境: ${envConfig.label}, appId: ${envConfig.appId}`);
  }
});
