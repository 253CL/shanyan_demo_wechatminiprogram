/**
 * SDK 配置常量
 *
 * 说明：
 * - SDK_VERSION：SDK 版本号，用于日志上报标识版本
 * - LOG_URL：创蓝日志上报接口地址
 * - APP_PLATFORM：平台标识，5=微信小程序插件
 * - DEFAULT_AUTH_PAGE_TYPE：授权页默认展示类型
 *   '4' = 底部弹窗模式（标准授权页）
 *   '5' = 自定义弹窗模式（支持自定义按钮、协议栏等）
 * - BUSINESS_TYPE：业务类型，固定为 '8'（一键登录）
 * - VERSION：接口版本号，固定为 '1.0'
 * - PLUGIN_APP_ID：一键登录插件的微信 AppID
 * - ENV_MAP：多环境接口地址映射（stable=测试环境，release=生产环境）
 * - MOBILE_QUERY_URL：手机号查询接口地址
 */

module.exports = {
  SDK_VERSION: '1.0.0.0',                 // SDK 版本号
  LOG_URL: 'https://h5.253.com/web/report',  // 日志上报地址（创蓝）
  APP_PLATFORM: 5,                      // 平台标识：5=微信小程序插件
  DEFAULT_AUTH_PAGE_TYPE: '4',          // 授权页类型默认值：'4'=底部弹窗
  BUSINESS_TYPE: '8',                   // 业务类型：8=一键登录
  VERSION: '1.0',                       // 接口版本号
  PLUGIN_APP_ID: 'wx35678fec06d475b4', // 一键登录插件 AppID

  // ==================== 多环境配置 ====================
  // stable = 测试环境，release = 生产环境
  // init 时通过 params.env 参数选择对应环境，默认使用 stable
  ENV_MAP: {
    stable: {
      initUrl: 'https://sy.cl2m.cn/sy/h5/init',   // 测试环境初始化接口
    },
    release: {
      initUrl: 'https://sy.253.com/sy/h5/init',   // 生产环境初始化接口（需替换为实际地址）
    },
  },

  // 手机号查询接口（各环境共用）
  MOBILE_QUERY_URL: 'https://api.253.com/open/web/mobile-query',
};
