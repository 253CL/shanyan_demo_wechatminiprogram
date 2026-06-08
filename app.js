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

const SDK = require('./sdk/index');

// 环境配置映射：根据小程序版本自动选择对应环境
const ENV_MAP = {
  // 开发环境1：微信开发者工具（手动创建应用）
  develop: { sdkEnv: 'stable', appId: 'CTbdVdtt', appKey: 'R20fq6CI', label: 'stable环境' },
  // 开发环境2：微信开发者工具（接口创建应用）- 推荐使用
  develop1: { sdkEnv: 'stable', appId: 'hfaqtYRe', appKey: 'BS5N82tT', label: 'stable环境' },
  // 体验版环境：用于 WeChat official testing
  trial: { sdkEnv: 'release', appId: '9IQdkCRI', appKey: 'CZIp8p8u', label: 'release环境' },
  // 正式版环境：用于生产线上
  release: { sdkEnv: 'release', appId: '9IQdkCRI', appKey: 'CZIp8p8u', label: 'release环境' },
};

App({
  globalData: {
    sdkInitialized: false,  // SDK 是否已初始化（已下发运营商参数）
    appId: '',              // 当前环境的应用 ID（开发者在创蓝平台的应用 ID）
    appKey: '',             // 当前环境的应用 Key（用于手机号解密）
    envLabel: '',           // 环境标签，用于 UI 展示（如 "stable环境"、"release环境"）
    demoLogEnabled: true,  // demo 层日志开关（仅影响页面层日志，SDK 层不受影响，默认关闭）
  },

  /**
   * 小程序启动时触发（冷启动时调用一次）
   *
   * 【初始化流程】
   * 1. 从 ENV_MAP 中选择当前环境的配置
   * 2. 调用 SDK.setEnvironment 设置 SDK 运行环境（stable/release）
   * 3. 清理上次的初始化缓存，确保本次启动时重新请求服务端
   * 4. 保存 appId/appKey/envLabel 到 globalData，供各页面使用
   * 5. 输出日志便于调试
   *
   * 【重要】
   * 此处仅设置全局配置，并不执行 SDK.init()。
   * 实际初始化由各页面在需要时调用 SDK.init({ appId }, callback)。
   */
  onLaunch() {
    const envConfig = ENV_MAP.develop1;

    // 设置 SDK 运行环境（必须在 init 前调用）
    SDK.setEnvironment(envConfig.sdkEnv);
    SDK.setLog(true);
    // 清理本地缓存的初始化参数，确保下次 init 时重新请求服务端
    SDK.clearScripCache();

    // 保存环境配置到全局数据，供页面层使用
    this.globalData.appId = envConfig.appId;
    this.globalData.appKey = envConfig.appKey;
    this.globalData.envLabel = envConfig.label;

    console.log(`[App] 启动成功，当前环境: ${envConfig.label}, appId: ${envConfig.appId}`);
  }
});
