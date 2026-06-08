/**
 * SDK 配置常量
 *
 * 多环境配置：
 * - stable：测试环境，用于开发调试
 * - release：生产环境（默认），用于正式上线
 * 通过 setEnvironment() 切换，需在 init() 之前调用。
 */

module.exports = {
  SDK_VERSION: '1.1.0.2',                   // SDK 版本号（用于日志上报和初始化入参）
  APP_PLATFORM: 5,                          // 平台标识：5=微信小程序
  DEFAULT_AUTH_PAGE_TYPE: '4',              // 授权页类型默认值：'4'=底部弹窗，'5'=自定义弹窗
  BUSINESS_TYPE: '8',                       // 业务类型：8=一键登录
  VERSION: '1.0',                           // 接口版本号
  PLUGIN_APP_ID: 'wx35678fec06d475b4',     // 一键登录插件 AppID（号码认证插件）

  // 备用域名初始化 URL（首次请求失败时自动重试）
  BACKUP_INIT_URL: 'https://fs.cl2009.com/sy/h5/init',

  // 当前环境标识，默认 release（生产环境）
  currentEnv: 'release',

  // 多环境接口地址
  ENV: {
    stable: {
      initUrl: 'https://109.cm253.com:8445/sy/h5/init',             // 初始化接口
      logUrl: 'https://109.cm253.com:8445/logger/web/report',       // 日志上报接口
    },
    release: {
      initUrl: 'https://sy.cl2m.cn/sy/h5/init',                     // 初始化接口
      logUrl: 'https://h5.253.com/web/report',                      // 日志上报接口
    },
  },
};
