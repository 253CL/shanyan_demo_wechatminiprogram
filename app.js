/**
 * 闪验小程序 SDK Demo - 应用入口
 *
 * 环境配置统一管理：根据小程序版本选择 SDK 环境、appId、appKey。
 * 各页面通过 getApp().globalData 获取统一的配置信息。
 */

const SDK = require('./sdk/index');

// 环境配置映射：根据小程序版本自动选择对应环境
const ENV_MAP = {
  develop: { sdkEnv: 'stable', appId: 'CTbdVdtt', appKey: 'R20fq6CI', label: 'stable环境' },//手动创建应用
  develop1: { sdkEnv: 'stable', appId: 'xfbnjAr8', appKey: 'jVdlA4YL', label: 'stable环境' },//接口创建应用
  trial: { sdkEnv: 'release', appId: '9IQdkCRI', appKey: 'CZIp8p8u', label: 'release环境' },
  release: { sdkEnv: 'release', appId: '9IQdkCRI', appKey: 'CZIp8p8u', label: 'release环境' },
};

App({
  globalData: {
    sdkInitialized: false,  // SDK 全局初始化状态
    appId: '',              // 当前环境 appId
    appKey: '',             // 当前环境 appKey
    envLabel: '',           // 环境标识
  },

  /**
   * 小程序启动时触发（冷启动时调用）
   * 在此统一设置 SDK 环境，确保各页面使用相同配置
   */
  onLaunch() {
    const envConfig = ENV_MAP[__wxConfig.envVersion] || ENV_MAP.develop;

    // 设置 SDK 运行环境
    SDK.setEnvironment(envConfig.sdkEnv);

    this.globalData.appId = envConfig.appId;
    this.globalData.appKey = envConfig.appKey;
    this.globalData.envLabel = envConfig.label;

    console.log(`[App] 当前环境: ${envConfig.label}, appId: ${envConfig.appId}`);
  }
});
