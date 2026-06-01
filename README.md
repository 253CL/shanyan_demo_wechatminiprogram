# 闪验小程序 SDK

一键登录微信小程序插件版 SDK，支持移动、联通、电信三网。

## 项目结构

```
├── app.js / app.json              # 小程序入口，已引用 oneKeyLogin 插件
├── sdk/
│   ├── index.js                   # SDK 主入口（init / openLoginAuth / getNetworkType）
│   ├── config.js                  # 环境配置与常量
│   ├── crypto.js                  # 加解密工具（crypto-js）
│   ├── errors.js                  # 错误码定义
│   └── log.js                     # 日志上报
├── ui-presets.js                  # 授权页 UI 预设配置（3 种样式）
└── pages/
    ├── index/                     # 首页（模式选择）
    ├── page-experience/           # 体验模式（UI 样式展示）
    └── page-debug/                # 调试模式（分步测试 + 日志）
```

## 快速开始

### 1. 在微信开发者工具中打开本项目

### 2. 构建 npm

微信开发者工具 → 菜单栏 → 工具 → 构建 npm

### 3. 替换配置

在 `project.config.json` 中将 `appid` 替换为你的小程序 AppID

### 4. 在小程序中引用 SDK

```javascript
const SDK = require('./sdk/index');

// Step 1: 初始化（请求服务端获取运营商取号参数）
SDK.init({ appId: 'your_app_id' }, (res) => {
  if (res.code === '000000') {
    console.log('初始化成功');
  }
});

// Step 2: 获取网络类型（可选）
SDK.getNetworkType((res) => {
  console.log('网络类型:', res.networkType);
});

// Step 3: 拉起授权页获取 Token
SDK.openLoginAuth((res) => {
  if (res.code === '200000') {
    console.log('token:', res.token);
  }
});

// Step 4: 用 token 换取手机号（建议在业务服务端调用）
// SDK 不直接封装此步骤，开发者需在服务端请求 mobileQueryUrl 接口
```

## SDK API

| 方法 | 参数 | 说明 |
|---|---|---|
| `init(params, callback)` | `{ appId }` | 初始化 SDK，请求服务端获取运营商取号参数 |
| `openLoginAuth([cfg], callback)` | `[{ option }]` | 拉起授权页，获取加密 token |
| `getNetworkType(callback)` | - | 获取当前网络类型（wifi/4g/5g） |
| `getPlugin()` | - | 获取插件实例，用于高级调用 |
| `getState()` | - | 获取 SDK 内部状态（调试用） |
| `setEnvironment(env)` | `'stable' \| 'release'` | 设置运行环境（需在 init 前调用） |
| `setLog(flag)` | `Boolean` | 开启/关闭 SDK 内部日志输出 |
| `setReport(flag)` | `Boolean` | 开启/关闭日志上报 |
| `setDetailLog(flag)` | `Boolean` | 开启/关闭敏感日志详情输出 |

## 授权页 UI 预设

`ui-presets.js` 提供 3 种预设样式，对应接入文档 7.5 节自定义弹窗配置：

```javascript
const uiPresets = require('./ui-presets');

// 底部弹窗样式（双按钮 + 协议栏 + 自定义控件）
SDK.openLoginAuth({ option: uiPresets.getBottomPopupOption() }, callback);

// 全屏样式（品牌定制蓝色主题）
SDK.openLoginAuth({ option: uiPresets.getFullScreenOption() }, callback);

// 极简样式（单按钮居中）
SDK.openLoginAuth({ option: uiPresets.getMinimalPopupOption() }, callback);
```

> `checkBtnStyle` 的 `uncheck`/`checked` 字段需要填入网络 URL 才能生效，
> 插件无法加载小程序本地相对路径的图片资源。

## 日志上报

SDK 运行过程中的关键事件（初始化成功/失败、取号成功/失败等）会自动上报到日志服务器，上报字段与 H5 SDK 保持一致（appPlatform 为 5）。

## 插件信息

- 插件 AppID: `wx35678fec06d475b4`
- 插件版本: `2.2.0`
- 能力编码: `59`
- 业务类型: `8`
