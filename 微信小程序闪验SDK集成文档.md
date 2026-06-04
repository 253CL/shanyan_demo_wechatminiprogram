# 微信小程序闪验 SDK 集成文档

## 1 版本历史

| 版本 | 更新内容 | 更新时间 |
| :---: | --- | --- |
| V1.0 | 初始版本：微信小程序闪验 SDK 集成文档 | 2026-06-03 |

## 2 产品概述

闪验 SDK 是基于运营商网关认证能力的一键登录解决方案。用户只需点击"一键登录"按钮，SDK 即可自动获取本机手机号码完成登录，无需手动输入手机号和短信验证码。

### 2.1 核心能力

- **一键登录**：用户在授权页点击确认，自动完成手机号校验并登录
- **本机号码校验**：验证用户输入的号码是否与当前 SIM 卡号码一致
- **三网支持**：自动适配移动、联通、电信三大运营商

### 2.2 技术架构

```
开发者小程序 ──SDK.init(appId)──▶ 闪验SDK ──请求创蓝服务端──▶ 获取各运营商取号参数
                                                    │
                              ┌── 移动：cmccAppId, cmccAppKey, cmccSign, cmccTimestamp
                              ├── 联通：cuccAppId, cuccSign, cuccTimestamp
                              └── 电信：ctccAppId, ctccSign
                                                    │
        开发者小程序 ◀──openLoginAuth 回调── 闪验SDK ◀──微信取号插件 ──使用下发参数取号
                                                    │
                                                    └── 拉起运营商授权页 → 用户授权 → 返回 token
                                                               │
        开发者服务端 ◀──token校验接口── 业务服务端 ──请求认证服务端──▶ 获取加密手机号
                                                   │
        开发者服务端 ──用 appkey AES 解密──▶ 明文手机号
```

## 3 接入准备

### 3.1 平台申请

1. 在微信公众平台申请微信小程序能力，获取 **wxappid**
2. 在创蓝平台注册账号，创建应用并获取 **appId** 和 **appkey**
3. 在腾讯公众平台小程序后台添加取号插件：`"设置" → "第三方服务" → "插件管理"` → 搜索 **"号码认证"** 申请添加

### 3.2 重要参数说明

| 参数 | 说明 |
| --- | --- |
| **wxappid** | 微信平台分配的微信小程序 AppID |
| **appId** | 创蓝平台分配的应用 ID，用于 SDK 初始化 |
| **appkey** | 创蓝平台分配的密钥，用于服务端 token 校验及手机号 AES 解密 |
| **businessType** | 业务类型，固定为 `8`（一键登录） |

## 4 SDK 快速接入

### 4.1 引入插件包

**① app.json 中引用插件：**

```json
{
  "pages": [
    "pages/index/index"
  ],
  "plugins": {
    "auth-plugin": {
      "version": "2.2.0",
      "provider": "wx35678fec06d475b4"
    }
  },
  "window": {
    "navigationStyle": "default"
  }
}
```

**② 页面 json 文件中声明插件组件（如需使用）：**

```json
{
  "usingComponents": {
    "onekeylogin": "plugin://auth-plugin/onekeylogin"
  }
}
```

**③ js 文件中引入 SDK：**

```javascript
const SDK = require('../../sdk/index');
```

### 4.2 设置环境

SDK 支持两个环境：`stable`（测试）和 `release`（生产）。

```javascript
// 在 app.js 的 onLaunch 中设置
SDK.setEnvironment('stable'); // 测试环境
// SDK.setEnvironment('release'); // 生产环境（默认）
```

### 4.3 初始化 SDK

```javascript
SDK.init({ appId: 'YOUR_APP_ID' }, (res) => {
  if (res.code === '200000') {
    console.log('初始化成功, traceId:', res.traceId);
  } else {
    console.log('初始化失败:', res.message);
  }
});
```

**回调参数：**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| code | string | `'200000'`=成功，其他=失败 |
| message | string | 结果描述 |
| traceId | string | 请求追踪 ID（成功时返回） |

### 4.4 打开授权页

```javascript
SDK.openLoginAuth((res) => {
  if (res.code === '200000') {
    console.log('取号成功, token:', res.token);
    console.log('msgId:', res.msgId);
    // 将 token 发送到业务服务端校验换取手机号
  } else if (res.code === '501') {
    console.log('用户取消授权');
  } else {
    console.log('取号失败:', res.message);
  }
});
```

**回调参数：**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| code | string | `'200000'`=成功，`'501'`=用户取消，其他=失败 |
| message | string | 结果描述 |
| token | string | 取号凭证（成功时返回，用于服务端校验） |
| msgId | string | 消息 ID（成功时返回） |

### 4.5 完整调用流程示例

```javascript
// 1. 设置环境
SDK.setEnvironment('release');

// 2. 初始化
SDK.init({ appId: 'your_app_id' }, (initRes) => {
  if (initRes.code !== '200000') {
    wx.showToast({ title: '初始化失败', icon: 'none' });
    return;
  }

  // 3. 打开授权页
  SDK.openLoginAuth((authRes) => {
    if (authRes.code === '200000') {
      // 4. 将 token 发送到你的业务服务端
      wx.request({
        url: 'https://your-server.com/api/verify-token',
        method: 'POST',
        data: { token: authRes.token },
        success: (res) => {
          // 5. 登录成功，进入你的业务逻辑
          wx.navigateTo({ url: '/pages/home/home' });
        }
      });
    } else if (authRes.code === '501') {
      wx.showToast({ title: '已取消授权', icon: 'none' });
    } else {
      wx.showToast({ title: authRes.message, icon: 'none' });
    }
  });
});
```

## 5 SDK API 详细说明

### 5.1 SDK.setEnvironment(env)

设置 SDK 运行环境。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| env | string | 是 | `'stable'`=测试环境，`'release'`=生产环境（默认） |

> **注意**：需在 `SDK.init()` 之前调用。

### 5.2 SDK.init(params, callback)

初始化 SDK，请求创蓝服务端获取各运营商取号参数。

**入参 params：**

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| appId | string | 是 | 创蓝平台分配的应用 ID |

**回调 callback(res)：**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| code | string | `'200000'`=成功，其他=失败（具体见第 8 章） |
| message | string | 结果描述 |
| traceId | string | 请求追踪 ID（成功时返回） |

**SDK 内部流程：**
1. 校验 appId 参数
2. 以 HMAC-SHA1 签名请求创蓝服务端
3. 服务端返回各运营商（移动/联通/电信）的取号参数
4. SDK 缓存参数到本地 `wx.setStorageSync`，下次相同 appId 初始化时直接使用缓存
5. 回调通知调用方

### 5.3 SDK.openLoginAuth(cfg, callback)

打开运营商一键登录授权页（拉起微信取号插件）。

**入参 cfg（可选）：**

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| option | Object | 否 | 自定义 UI 配置，详见第 6 章 |

**回调 callback(res)：**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| code | string | `'200000'`=成功，`'501'`=用户取消，其他=失败 |
| message | string | 结果描述 |
| token | string | 取号凭证（成功时返回，格式：`A1/A2/A3-{base64密文}`） |
| msgId | string | 消息 ID |

**SDK 内部流程：**
1. 校验初始化状态和 cmccAppId
2. 使用服务端下发的 cmccAppId/cmccSign/cmccTimestamp/traceId 构建插件请求
3. 调用 `oneKeyLogin.getTokenInfo` 拉起取号插件
4. 插件自动判断网络环境：
   - WiFi/热点/无网络：返回网络异常
   - 4G/5G：向认证服务端取号 → 拉起授权页 → 用户授权
5. 根据 token 前缀自动识别运营商（H5=移动, CTH5=电信, CUH5=联通）
6. 对原始 token 进行 AES-CBC 加密，生成 SDK token 返回

### 5.4 SDK.getNetworkType(callback)

获取当前网络类型。优先使用取号插件的 `getConnection` 方法，降级使用微信原生 `wx.getNetworkType`。

```javascript
SDK.getNetworkType((res) => {
  console.log('networkType:', res.networkType); // 'wifi' / '4g' / '5g' / 'none'
});
```

### 5.5 SDK.setLog(flag)

设置 SDK 内部 console 日志输出开关。

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| flag | boolean | `true`=开启日志，`false`=关闭（默认） |

### 5.6 SDK.setReport(flag)

设置日志上报开关。

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| flag | boolean | `true`=开启上报（默认），`false`=关闭 |

### 5.7 SDK.setDetailReport(flag)

设置日志上报是否获取设备信息字段（device/deviceName/osVersion/netType）。

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| flag | boolean | `true`=获取（默认），`false`=不获取 |

### 5.8 SDK.setInitTimeout(ms)

设置 init 接口超时时间。

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| ms | number | 超时时间（毫秒），默认 `6000` |

超时后返回 `code: '001023', message: '超时'`。

### 5.9 SDK.clearScripCache()

清理本地初始化缓存。调用后下次 `init` 将重新请求服务端获取参数。

### 5.10 SDK.getPlugin()

获取取号插件实例（高级用法）。一般场景不需要调用。

## 6 授权页自定义配置

授权页通过 `SDK.openLoginAuth({ option: { ... } }, callback)` 传入配置。

> **注意**：`logo` 的配置直接以 `logoStyle` 字段放在 `option` 根层级，不需要嵌套在 `{ logo: { logoStyle: { ... } } }` 结构中。

### 6.1 配置项示例

```javascript
SDK.openLoginAuth({
  option: {
    logoStyle: {
      src: 'https://example.com/logo.png',
      width: '200rpx',
      height: '200rpx',
    },
    sureBtnStyle: {
      text: '一键登录',
      bgColor: '#2b7de0',
    },
  }
}, (res) => { ... });
```

### 6.2 配置项详细说明

| 配置模块 | 字段 | 含义 | 值 | 说明 |
| --- | --- | --- | --- | --- |
| **logo** | logoStyle.width | Logo 宽度 | 百分比或数值，如 `200rpx` | 可选 |
| | logoStyle.height | Logo 高度 | 百分比或数值 | 可选 |
| | logoStyle.src | Logo 图片路径 | URL 路径 | 可选，默认创蓝 logo |
| | logoStyle.top | logo 距页面上边框距离 | 数值，如 `20rpx` | 可选 |
| | logoStyle.left | logo 距页面左边框距离 | 数值或 `center` | 可选 |
| **小程序名称** | bussinessNameStyle.text | 小程序名称文案 | string | 可选 |
| | bussinessNameStyle.fontColor | 字体颜色 | 十六进制颜色码 | 可选 |
| | bussinessNameStyle.fontSize | 字体大小 | 数值，如 `32rpx` | 可选 |
| | bussinessNameStyle.top | 距上边框距离 | 数值 | 可选 |
| | bussinessNameStyle.left | 距左边框距离 | 数值或 `center` | 可选 |
| **授权栏** | authTextStyle.fontColor | 字体颜色 | 十六进制颜色码 | 可选 |
| | authTextStyle.fontSize | 字体大小 | 数值 | 可选 |
| | authTextStyle.top | 距上边框距离 | 数值 | 可选 |
| | authTextStyle.left | 距左边框距离 | 数值或 `center` | 可选 |
| **授权提示栏** | authTipStyle.ifShow | 是否展示 | boolean | 可选 |
| | authTipStyle.text | 提示栏文案 | string | 可选 |
| **号码栏** | phoneStyle.fontColor | 字体颜色 | 十六进制颜色码 | 可选 |
| | phoneStyle.fontSize | 字体大小 | 数值 | 可选 |
| **取消按钮** | cancleBtnStyle.text | 按钮文案（默认"拒绝"） | string，≤6字 | 可选 |
| | cancleBtnStyle.bgColor | 按钮颜色 | 十六进制颜色码 | 可选 |
| | cancleBtnStyle.radius | 按钮圆角 | 数值 | 可选 |
| | cancleBtnStyle.width | 按钮宽度 | 百分比或数值 | 可选 |
| | cancleBtnStyle.height | 按钮高度 | 百分比或数值 | 可选 |
| **登录按钮** | sureBtnStyle.text | 按钮文案（默认"授权登录"） | string，≤6字 | 可选 |
| | sureBtnStyle.bgColor | 按钮颜色 | 十六进制颜色码 | 可选 |
| | sureBtnStyle.fontColor | 字体颜色 | 十六进制颜色码 | 可选 |
| | sureBtnStyle.radius | 按钮圆角 | 数值 | 可选 |
| | sureBtnStyle.width | 按钮宽度 | 百分比或数值 | 可选 |
| | sureBtnStyle.height | 按钮高度 | 百分比或数值 | 可选 |
| **协议栏** | agreeLineStyle.fontColor | 字体颜色 | 十六进制颜色码 | 可选 |
| | agreeLineStyle.fontSize | 字体大小 | 数值 | 可选 |
| **协议勾选** | checkBtnStyle.uncheck | 未选中图标 URL | string | 可选 |
| | checkBtnStyle.checked | 选中图标 URL | string | 可选 |
| | checkBtnStyle.width | 图标宽度 | 数值 | 可选 |
| | checkBtnStyle.height | 图标高度 | 数值 | 可选 |
| **协议名称** | agreeStyle.contracts | 协议数组 | `[{name:"协议名", url:"链接"}]` | 可选 |
| | agreeStyle.fontColor | 字体颜色 | 十六进制颜色码 | 可选 |
| **自定义控件** | customControlStyle | 数组格式 | 详见下方说明 | 可选 |
| **弹窗** | layerStyle.height | 弹窗高度 | 百分比或数值 | 可选 |
| | layerStyle.radius | 弹窗圆角 | 数值 | 可选 |
| | layerStyle.bgColor | 弹窗背景色 | 十六进制颜色码 | 可选 |
| **蒙层** | maskStyle.ifShowMask | 是否显示蒙层 | boolean，默认 true | 可选 |
| | maskStyle.bgColor | 蒙层背景色 | 十六进制颜色码 | 可选 |

### 6.3 自定义控件说明

`customControlStyle` 为数组格式，支持在授权页添加自定义按钮控件。

| 字段 | 含义 | 值 | 说明 |
| --- | --- | --- | --- |
| ifShow | 是否展示 | boolean，默认 false | 必选 |
| id | 控件 ID | string | 可选 |
| openType | 跳转方式 | `navigate/redirect/switchTab/reLaunch/navigateBack` | 可选 |
| name | 显示文案 | string | 可选 |
| width | 宽度 | 百分比或数值 | 可选 |
| height | 高度 | 百分比或数值 | 可选 |
| top | 距弹窗上边框距离 | 百分比或数值 | 可选 |
| left | 距弹窗左边框距离 | 百分比或数值 | 可选 |
| fontColor | 字体颜色 | 十六进制颜色码 | 可选 |
| fontSize | 字体大小 | 数值 | 可选 |
| bgColor | 背景颜色 | 十六进制颜色码 | 可选 |
| textAlign | 文本对齐 | `center/left/right` | 可选 |
| radius | 圆角 | 数值 | 可选 |
| url | 跳转 URL | URL 链接 | 必选 |

### 6.4 底部授权页效果图

两种授权页样式：

1. **掩码底部授权页（authPageType=4）**：展示手机号掩码，用户直接点击授权登录
2. **标准底部授权页（authPageType=5）**：需用户输入中间 4 位号码后授权

SDK 内部固定使用 `authPageType: '5'`（自定义授权弹窗模式）。

## 7 服务端 token 校验接口

获取到 SDK 返回的 token 后，**必须由业务服务端**调用此接口校验并换取加密手机号。

### 7.1 接口信息

| 字段 | 值 |
| --- | --- |
| 接口名称 | tokenValidate |
| 接口描述 | 校验 token 凭证，获取用户信息 |
| 承载协议 | HTTPS |
| 请求方式 | POST |
| 数据格式 | JSON |
| 接口 URL | `https://www.cmpassport.com/h5/onekeylogin/tokenValidate` |
| 接口方向 | 业务服务端 → 认证服务端 |

### 7.2 请求参数

**Header（HTTP 请求头）：**

| 字段 | 是否必填 | 描述 |
| --- | --- | --- |
| interfaceVersion | 是 | 接口版本号，填 `1.0` |
| appId | 是 | 应用 ID |
| traceId | 是 | 时间跟踪 ID |
| timestamp | 是 | 请求时间，yyyyMMddHHmmssSSS 格式（17位） |
| businessType | 是 | 业务类型，填 `8` |

**Body（JSON）：**

| 字段 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| token | string | 是 | token 身份凭证（小程序端 SDK 返回） |
| sign | string | 是 | 签名，使用业务方 RSA 私钥对 `(appId+traceId+timestamp+token+version)` 进行 SHA256withRSA 签名 |
| userInformation | string | 是 | 浏览器加密指纹（小程序端取号时 oneKeyLogin.getConnection 或 getTokenInfo 返回的 userInformation 字段） |
| expandParams | string | 否 | 扩展参数，格式：`param1=value1\|param2=value2` |

### 7.3 响应参数

**Header：**

| 字段 | 约束 | 说明 |
| --- | --- | --- |
| traceId | 必选 | 对应请求头的 traceId |
| appId | 必选 | 应用 ID |
| timestamp | 必选 | 响应时间 |

**Body：**

| 字段 | 父对象 | 约束 | 说明 |
| --- | --- | --- | --- |
| resultCode | - | 必选 | 状态码 |
| desc | - | 必选 | 状态码描述 |
| serviceTime | - | 必选 | 时间戳 |
| data | - | 必选 | 数据对象（成功时返回） |
| msisdn | data | 必选 | AES 加密手机号，使用 appkey 解密 |
| securityPhone | data | 必选 | 手机号掩码，如 `138****5491` |
| expandParams | data | 可选 | 扩展参数 |

### 7.4 手机号解密

认证服务端返回的 `msisdn` 字段是使用 **AES** 加密后的手机号，解密密钥为创蓝平台下发的 **appkey**。

**Java 示例：**

```java
import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

public class AesDecrypt {
    public static String decrypt(String encrypted, String appkey) throws Exception {
        SecretKeySpec keySpec = new SecretKeySpec(appkey.getBytes("UTF-8"), "AES");
        Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
        cipher.init(Cipher.DECRYPT_MODE, keySpec);
        byte[] decrypted = cipher.doFinal(Base64.getDecoder().decode(encrypted));
        return new String(decrypted, "UTF-8");
    }

    public static void main(String[] args) throws Exception {
        String msisdn = "m+FDykYrD1qsjp0cBATZug==";
        String appkey = "B50BBEF6C4CD4FA8";
        System.out.println("解密手机号: " + decrypt(msisdn, appkey));
    }
}
```

## 8 返回码说明

### 8.1 SDK 返回码

| 返回码 | 描述 | 说明 |
| --- | --- | --- |
| 200000 | 成功 | 初始化/取号成功 |
| 001023 | 超时 | init 接口超时 |
| 000400 | 服务端响应为空 | 服务端未返回有效数据 |
| 000401 | 请求服务端失败 | 网络请求异常 |
| 000500 | 请先调用 init 初始化 | openLoginAuth 前未调用 init |
| 000501 | 移动 appId 未初始化 | cmccAppId 未获取到 |
| 000520 | appId 必传 | init 未传入 appId |
| 000600 | SDK 初始化异常 | 初始化过程发生异常 |
| 000601 | SDK 响应处理异常 | 处理服务端响应时发生异常 |
| 000602 | Token 签名计算异常 | 签名计算过程发生异常 |
| 000603 | Token UUID 生成异常 | UUID 生成失败 |
| 000604 | Token 处理异常 | Token 处理过程发生异常 |
| 000605 | Token 插件调用异常 | 调用取号插件时发生异常 |
| 000606 | 网络类型处理异常 | 网络类型处理时发生异常 |
| 000607 | 网络类型调用异常 | 网络类型调用时发生异常 |
| 000001 | 获取网络类型失败 | 获取网络类型失败 |

### 8.2 取号插件返回码

**移动取号：**

| 返回码 | 描述 |
| --- | --- |
| 103000 | 成功 |
| 500 | 网络异常，请检查网络设置 |
| 503 | 参数缺失 |
| 130010 | 参数为空 |
| 105002 | 移动网关取号失败 |
| 105112 | 时间戳非法 |
| 105113 | APPID 非法或为空 |
| 103101 | 错误的请求签名 |
| 110023 | 应用没有权益 |
| 110025 | 权益已失效 |
| 110029 | 微信 appid 校验失败 |

**电信取号：**

| 返回码 | 描述 |
| --- | --- |
| 103000 | 成功 |
| 301 | 参数错误 |
| 500 | 网络异常 |
| 502 | 电信/联通取号能力关闭 |
| 105003 | 电信网关取号失败 |
| 110023 | 应用没有权益 |
| 110025 | 权益已失效 |

**联通取号：**

| 返回码 | 描述 |
| --- | --- |
| 103000 | 成功 |
| 500 | 网络异常 |
| 502 | 电信/联通取号能力关闭 |
| 105001 | 联通网关取号失败 |
| 110023 | 应用没有权益 |
| 110025 | 权益已失效 |

**获取 token：**

| 返回码 | 描述 |
| --- | --- |
| 501 | 用户取消授权 |
| 502 | 用户选择其他登录方式 |
| 103002 | 没有填写必传参数 |
| 104000 | app 不存在 |
| 104001 | businessType 校验失败 |
| 104003 | 应用没有权益 |
| 104004 | 权益已失效 |
| 104007 | accessToken 不存在（token 有效期 2 分钟） |
| 104008 | accessToken 校验失败 |
| 104011 | 手机号不能为空 |
| 104012 | 本机号码校验失败 |

### 8.3 服务端 token 校验返回码

| 返回码 | 描述 |
| --- | --- |
| 103000 | 成功 |
| 103001 | fail |
| 103002 | 没有填写必传参数 |
| 104000 | app 不存在 |
| 104001 | businessType 校验失败 |
| 104003 | 应用没有权益 |
| 104004 | 权益已失效 |
| 104007 | token 不存在（token 有效期 2 分钟） |
| 104008 | token 校验失败 |
| 104012 | 本机号码校验失败 |
| 104013 | 验证签名失败 |
| 104017 | IP 校验失败（接口设置了 IP 白名单） |

## 9 常见问题

### 9.1 是否支持 WiFi 环境下使用？

**答：** 取号仅支持数据流量（4G/5G）下使用，不支持 WiFi、热点环境。SDK 会在授权页提示用户切换至数据网络。

### 9.2 授权页输入错误号码是否有限制次数？

**答：** 同一号码连续输入 3 次错误将被锁定。联调测试时请避免连续输错 3 次。

### 9.3 Token 有效期是多久？

**答：** Token 有效期为 **2 分钟**，超时后需重新取号。请在获取 token 后尽快发送到业务服务端进行校验。

### 9.4 SDK 的 init 和 openLoginAuth 使用的 appId 是同一个吗？

**答：** 不是。`SDK.init()` 传入的是开发者在创蓝平台注册的 **appId**；`openLoginAuth` 内部使用服务端下发的 **cmccAppId**（移动专用），两者不同，不可混用。

### 9.5 为什么 openLoginAuth 没有超时机制？

**答：** 取号插件拉起授权页后不提供回调，若设置超时会在用户授权过程中误触发超时回调。因此 SDK 仅对 `init` 接口设置了超时机制（默认 6 秒），`openLoginAuth` 不设超时。

### 9.6 签名（sign）和 token 校验接口的签名是否相同？

**答：** 不相同。SDK 调用取号时的 sign 使用 **MD5** 算法（`MD5(appId + businessType + msgId + timestamp + traceId + version + appkey)`）；token 校验接口的 sign 使用 **SHA256withRSA** 算法（RSA 私钥签名），两者生成工具不同。

### 9.7 如何排查常见错误？

| 返回码 | 排查方法 |
| --- | --- |
| 105112 | 时间戳非法。时间戳需为 17 位，格式：yyyyMMddHHmmssSSS |
| 105113 | AppId 非法或为空。请联系认证侧排查 |
| 103101 | 错误的请求签名。常见原因：签名拼接顺序或字段不正确 |
| 103111 | WAP 网关 IP 错误。使用了 WiFi 或异网数据网络 |
| 110023 | 应用没有权益。检查是否正确创建能力（能力编码 59）、businessType=8、体验量有效 |
| 110025 | 权益已失效。检查能力配置页面"上下线时间"是否过期 |
| 104007 | token 不存在。token 超过 2 分钟有效期或重复校验 |
| 104012 | 本机号码校验失败。用户输错中间四位号码 |
| 104013 | 验证签名失败。检查公私钥生成工具、公钥报备、签名拼接 |
| 104017 | IP 校验失败。实际服务器出口 IP 未报备，请在平台配置 IP 白名单 |
| 110029 | 微信 appid 校验失败。wxappid 未在平台添加报备，多个需用英文逗号隔开 |
