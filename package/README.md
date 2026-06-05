# 创蓝闪验微信小程序一键登录 SDK

基于运营商网关认证能力的一键登录解决方案，支持移动、联通、电信三网。

## 安装

```bash
npm install shanyan-miniprogram-sdk
```

## 快速接入

### 1. 添加微信取号插件

在 `app.json` 中添加：

```json
{
  "plugins": {
    "auth-plugin": {
      "version": "2.2.0",
      "provider": "wx35678fec06d475b4"
    }
  }
}
```

> 开发者需在微信公众平台「设置 → 第三方服务 → 插件管理」中搜索"号码认证"添加。

### 2. 构建 npm

在微信开发者工具中点击 **工具 → 构建 npm**。

### 3. 使用 SDK

```javascript
const SDK = require('shanyan-miniprogram-sdk');

// 设置环境（必须在 init 之前调用）
SDK.setEnvironment('stable'); // 测试环境
// SDK.setEnvironment('release'); // 生产环境（默认）

// 初始化
SDK.init({ appId: '你的创蓝appId' }, (res) => {
  if (res.code === '200000') {
    console.log('初始化成功, traceId:', res.traceId);

    // 打开一键登录授权页
    SDK.openLoginAuth((res) => {
      if (res.code === '200000') {
        console.log('取号成功, token:', res.token);
        // 将 token 传给业务服务端换取手机号
      } else if (res.code === '501') {
        console.log('用户取消授权');
      } else {
        console.log('取号失败:', res.message);
      }
    });
  }
});
```

## API

| 方法 | 说明 |
|---|---|
| `init(params, callback)` | 初始化 SDK，获取运营商取号参数 |
| `openLoginAuth([cfg], callback)` | 打开一键登录授权页 |
| `getNetworkType(callback)` | 获取当前网络类型 |
| `setEnvironment(env)` | 设置运行环境：`stable`（测试）/ `release`（生产） |
| `setLog(flag)` | 开启/关闭 SDK 内部日志 |
| `setReport(flag)` | 开启/关闭日志上报 |
| `setDetailReport(flag)` | 开启/关闭详细日志字段 |
| `clearScripCache()` | 清理初始化缓存 |
| `setInitTimeout(ms)` | 设置 init 超时时间（默认 6000ms） |

## 注意事项

- `setEnvironment` 必须在 `init` 之前调用
- 取号需要在蜂窝网络（4G/5G）下，WiFi 环境无法获取手机号
- SDK 仅负责客户端取号，`appkey` 解密手机号需在业务服务端实现

## License

ISC
