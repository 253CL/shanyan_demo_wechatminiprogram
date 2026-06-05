/**
 * 闪验小程序 SDK Demo - 应用入口
 *
 * 环境配置统一管理：根据小程序版本选择 SDK 环境、appId、appKey。
 * 各页面通过 getApp().globalData 获取统一的配置信息。
 *
 * ENV_MAP 说明：
 * - develop：微信开发者工具（手动创建应用）
 * - develop1：微信开发者工具（接口创建应用）
 * - trial：体验版
 * - release：正式版
 *
 * 当前默认使用 develop1 配置（接口创建应用），如需切换可修改 onLaunch 中的 envConfig 取值。
 */

const SDK = require('./sdk/index');

// 环境配置映射：根据小程序版本自动选择对应环境
const ENV_MAP = {
  develop: { sdkEnv: 'stable', appId: 'CTbdVdtt', appKey: 'R20fq6CI', label: 'stable环境' },//手动创建应用
  develop1: { sdkEnv: 'stable', appId: 'hfaqtYRe', appKey: 'BS5N82tT', label: 'stable环境' },//接口创建应用
  trial: { sdkEnv: 'release', appId: '9IQdkCRI', appKey: 'CZIp8p8u', label: 'release环境' },
  release: { sdkEnv: 'release', appId: '9IQdkCRI', appKey: 'CZIp8p8u', label: 'release环境' },
};

App({
  globalData: {
    sdkInitialized: false,  // SDK 全局初始化状态
    appId: '',              // 当前环境 appId
    appKey: '',             // 当前环境 appKey
    envLabel: '',           // 环境标识
    demoLogEnabled: false,  // demo 层日志开关（默认关闭）
  },

  /**
   * 小程序启动时触发（冷启动时调用）
   * 在此统一设置 SDK 环境，确保各页面使用相同配置
   */
  onLaunch() {
    const envConfig = ENV_MAP.develop1;

    // 设置 SDK 运行环境
    SDK.setEnvironment(envConfig.sdkEnv);
    this.globalData.appId = envConfig.appId;
    this.globalData.appKey = envConfig.appKey;
    this.globalData.envLabel = envConfig.label;

    console.log(`[App] 当前环境: ${envConfig.label}, appId: ${envConfig.appId}`);
  }
});
