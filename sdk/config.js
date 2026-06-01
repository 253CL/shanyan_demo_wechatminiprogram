/**
 * SDK 配置常量
 *
 * 说明：
 * - SDK_VERSION：SDK 版本号，用于日志上报标识版本
 * - APP_PLATFORM：平台标识，5=微信小程序插件
 * - DEFAULT_AUTH_PAGE_TYPE：授权页默认展示类型
 *   '4' = 底部弹窗模式（标准授权页）
 *   '5' = 自定义弹窗模式（支持自定义按钮、协议栏等）
 * - BUSINESS_TYPE：业务类型，固定为 '8'（一键登录）
 * - VERSION：接口版本号，固定为 '1.0'
 * - PLUGIN_APP_ID：一键登录插件的微信 AppID（"号码认证"插件）
 *
 * 多环境配置：
 * - stable：测试环境，用于开发调试
 * - release：生产环境（默认），用于正式上线
 * 通过 setEnvironment() 切换，需在 init() 之前调用。
 */

module.exports = {
  SDK_VERSION: '1.0.0.0',                   // SDK 版本号
  APP_PLATFORM: 5,                          // 平台标识：5=微信小程序插件
  DEFAULT_AUTH_PAGE_TYPE: '4',              // 授权页类型默认值：'4'=底部弹窗
  BUSINESS_TYPE: '8',                       // 业务类型：8=一键登录
  VERSION: '1.0',                           // 接口版本号
  PLUGIN_APP_ID: 'wx35678fec06d475b4',     // 一键登录插件 AppID

  // ==================== 多环境接口地址 ====================
  // 默认使用 release（生产环境），可通过 setEnvironment() 切换为 stable
  currentEnv: 'release',                    // 当前环境标识
  ENV: {
    stable: {
      initUrl: 'https://109.cm253.com:8445/sy/h5/init',
      logUrl: 'https://109.cm253.com:8445/logger/web/report',
      mobileQueryUrl: 'https://110.cm253.com:8445/open/web/wxprog-mobile-query',
    },
    release: {
      initUrl: 'https://sy.cl2m.cn/sy/h5/init',
      logUrl: 'https://h5.253.com/web/report',
      mobileQueryUrl: 'https://api.253.com/open/web/wxprog-mobile-query',
    },
  },
};
