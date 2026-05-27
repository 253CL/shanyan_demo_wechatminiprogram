# 闪验小程序 SDK

一键登录微信小程序插件版 SDK，支持移动、联通、电信三网。

## 项目结构

```
├── app.js / app.json          # 小程序入口，已引用 oneKeyLogin 插件
├── sdk/
│   ├── index.js               # SDK 主入口
│   ├── config.js              # 默认配置
│   ├── crypto.js              # 加解密工具（crypto-js）
│   └── log.js                 # 日志上报
└── pages/index/               # Demo 测试页面
```

## 快速开始

### 1. 在微信开发者工具中打开本项目

### 2. 构建 npm

微信开发者工具 → 菜单栏 → 工具 → 构建 npm

### 3. 替换配置

在 `project.config.json` 中将 `appid` 替换为你的小程序 AppID

### 4. 在小程序中引用 SDK

```javascript
const ShanYanSDK = require('./sdk/index');

// Step 1: 初始化
ShanYanSDK.init({
  appId: 'your_app_id',
  appkey: 'your_app_key',
}, (res) => {
  console.log('初始化结果:', res);
});

// Step 2: 获取网络类型（可选）
ShanYanSDK.getNetworkType((res) => {
  console.log('网络类型:', res);
});

// Step 3: 获取 Token
ShanYanSDK.getToken((res) => {
  console.log('Token 结果:', res);
});

// Step 4: 解密手机号（服务端 tokenValidate 后调用）
ShanYanSDK.decryptPhone(encryptedMsisdn, appkey, (res) => {
  console.log('手机号:', res.phone);
});
```

## SDK API

| 方法 | 参数 | 说明 |
|---|---|---|
| `init(params, callback)` | `{ appId, appkey }` | 初始化 SDK，生成 traceId |
| `setConfig(config, callback)` | `{ authPageType, option }` | 设置自定义授权页配置 |
| `getToken(callback)` | - | 调用插件取号，拉起授权页 |
| `getNetworkType(callback)` | - | 获取当前网络类型 |
| `decryptPhone(encrypted, appkey, callback)` | `加密串, 密钥` | AES 解密手机号 |
| `setLog(flag)` | `Boolean` | 开启/关闭日志上报 |
| `getState()` | - | 获取 SDK 内部状态 |
| `getPlugin()` | - | 获取插件实例，用于高级调用 |

## 日志上报

每个 SDK 方法调用时自动上报日志到 `https://h5.253.com/web/report`，上报字段与 H5 SDK 保持一致（仅 appPlatform 改为 4）。

## 插件信息

- 插件 AppID: `wx35678fec06d475b4`
- 插件版本: `2.2.0`
- 能力编码: `59`
- 业务类型: `8`
