module.exports = {
  content: `| 日期     | 版本     | 修订内容摘要                                                    |
| -------- | ----------------------------------------------------------- |---------- |
| 2023-09-07    | v1.0.0            | 更新接口文档|

# 微信小程序接入
## 1、注册激活产品

[创蓝云智](https://www.chuanglan.com/control/login)注册账号,进行认证，并激活。
## 2、接入说明
### 小程序原生语言接入
> 注意：
> 1. 请勿在“微信开发者工具”的“游客模式”下接入验证码。
> 2. 目前尚未支持 Skyline 渲染模式。

#### **步骤 1：添加插件**

1. 用管理员身份登录 微信公众平台，且需使用接入小程序的相关账号。
2. 选择设置 > 第三方设置 > 添加插件，在搜索框内输入关键字“腾讯验证码”查找插件，并单击添加，如下图所示。
![](https://static2.253.com/document/2023-10/DPSJ4YH384PEWKTZ.png)

#### **步骤 2：集成插件**
1. 引入验证码小程序插件。
   使用验证码插件前，需要在 app.json 中声明验证码小程序插件，如下：
   \`\`\`javascript
     {
           "plugins": {
               "captcha": {
                   "version": "2.0.0", //请选择小程序插件最新版本
                   "provider": "wx1fe8d9a3cb067a75"
               }
           }
      }
   \`\`\`
2. 引入验证码小程序组件。
   需要在页面.json文件中需要引入自定义组件，js 代码如下：
   \`\`\`javascript
     {
           "usingComponents": {
             "t-captcha": "plugin://captcha/t-captcha"
           }
      }
   \`\`\`
#### **步骤 3：使用小程序插件**
1. 使用原生小程序语言接入时，需要在自定义的.wxml文件中，使用验证码插件，wxml 代码如下：
   \`\`\`javascript
      <!-- app-id：验证码CaptchaAppId, 从创蓝云智控制台中获取, 在行为验证码控制台页面内【行为验证码】>【应用管理】> 【验证ID】进行查看 -->
      <t-captcha
           id="captcha"
           app-id="小程序插件验证码CaptchaAppId"
           bindverify="handlerVerify"
           bindready="handlerReady"
           bindclose="handlerClose"
           binderror="handlerError" />
      <button bindtap='login'>登录</button>
   \`\`\`
- 组件参数说明：

  |  字段名    | 值类型                      | 默认值 | 说明                              |
  | --------- | -------------------------- | -------- | -------------------------------------- |
  | CaptchaAppId      | String | 无       | 验证码应用 ID                                     |
  | lang   | String | zh-CN       | 语言，可选 zh-CN、zh-TW、en                                     |
  | themeColor | String  | #1A79FF       | 主题色 |
- 组件事件说明：

  | 事件名      | 参数 | 说明                                              |
  | ------------ | ------ | ------------------------------------------------- |
  | ready          | 无    | 验证码准备就绪    |
  | verify       | {ret, ticket} | 验证码验证完成 |
  | close | {ret} | 验证码弹框准备关闭                                   |
  | error     | 无   | 验证码配置失败                                  |
- 组件方法说明
  | 方法名      |  说明                                              |
  | ------------ | ------------------------------------------------- |
  | show        | 展示验证码    |
  | destroy       | 销毁验证码 |
  | refresh | 重置验证码                                   |
2. 在自定义的.js文件中，监听事件，代码如下：
   \`\`\`javascript
      Page({
             data: {},
             login: function () {
                 this.selectComponent('#captcha').show()
                 // 进行业务逻辑，若出现错误需重置验证码，执行以下方法
                 // if (error) {
                 // this.selectComponent('#captcha').refresh()
                 // }
             },
             // 验证码验证结果回调
             handlerVerify: function (ev) {
                 // 如果使用了 mpvue，ev.detail 需要换成 ev.mp.detail
                 if(ev.detail.ret === 0) {
                     // 验证成功
                     console.log('ticket:', ev.detail.ticket)
                 } else {
                     // 验证失败
                     // 请不要在验证失败中调用refresh，验证码内部会进行相应处理
                 }
             },    
             // 验证码准备就绪
             handlerReady: function () {
                 console.log('验证码准备就绪')
             },    
             // 验证码弹框准备关闭
             handlerClose: function (ev) {
                 // 如果使用了 mpvue，ev.detail 需要换成 ev.mp.detail,ret为0是验证完成后自动关闭验证码弹窗，ret为2是用户主动点击了关闭按钮关闭验证码弹窗
                 if(ev && ev.detail.ret && ev.detail.ret === 2){
                     console.log('点击了关闭按钮，验证码弹框准备关闭');
                 } else {
                     console.log('验证完成，验证码弹框准备关闭');
                 }
             },
             // 验证码出错
             handlerError: function (ev) {
                 console.log(ev.detail.errMsg)
             }
        })
   \`\`\`
   注意
  
   业务客户端完成验证码接入后，服务端需二次核查验证码票据结果（未接入票据校验，会导致黑产轻易伪造验证结果，失去验证码人机对抗效果），详情请参见 接入票据校验(微信小程序)。

### uni-app 前端框架接入
注意：
请勿在“微信开发者工具”的“游客模式”下接入验证码。

#### **步骤 1：添加插件**

1. 用管理员身份登录 微信公众平台，且需使用接入小程序的相关账号。
2. 选择设置 > 第三方设置 > 添加插件，在搜索框内输入关键字“腾讯验证码”查找插件，并单击添加，如下图所示。
![](https://static2.253.com/document/2023-10/ISVO9EEJMS9BONRY.png)

#### **步骤 2：集成插件**
1. 引入验证码小程序插件。
   使用验证码插件前，需要在 app.json 中声明验证码小程序插件，如下：
   \`\`\`javascript
     {
           "plugins": {
               "myPlugin": {
                   "version": "2.0.0", //请选择小程序插件最新版本
                   "provider": "wx1fe8d9a3cb067a75"
               }
           }
      }
   \`\`\`
2. 引入验证码小程序组件。
   需要在页面.json文件中需要引入自定义组件，js 代码如下：
   \`\`\`javascript
     {
           "usingComponents": {
             "t-captcha": "plugin://captcha/t-captcha"
           }
      }
   \`\`\`
#### **步骤 3：使用小程序插件**
1. 使用原生小程序语言接入时，需要在自定义的.wxml文件中，使用验证码插件，wxml 代码如下：
   \`\`\`javascript
      <!-- app-id：验证码CaptchaAppId, 从创蓝云智控制台中获取, 在行为验证码控制台页面内【行为验证码】>【应用管理】> 【验证ID】进行查看 -->
      <t-captcha
           id="captcha"
           app-id="小程序插件验证码CaptchaAppId"
           @verify="handlerVerify"
           @ready="handlerReady"
           @close="handlerClose"
           @error="handlerError" />
      <button @click="login">登录</button>
   \`\`\`
- 组件参数说明：

  |  字段名    | 值类型                      | 默认值 | 说明                              |
  | --------- | -------------------------- | -------- | -------------------------------------- |
  | CaptchaAppId      | String | 无       | 验证码应用 ID                                     |
  | lang   | String | zh-CN       | 语言，可选 zh-CN、zh-TW、en                                     |
  | themeColor | String  | #1A79FF       | 主题色 |
- 组件事件说明：

  | 事件名      | 参数 | 说明                                              |
  | ------------ | ------ | ------------------------------------------------- |
  | ready          | 无    | 验证码准备就绪    |
  | verify       | {ret, ticket} | 验证码验证完成 |
  | close | {ret} | 验证码弹框准备关闭                                   |
  | error     | 无   | 验证码配置失败                                  |

- 组件方法说明
  | 方法名      |  说明                                              |
  | ------------ | ------------------------------------------------- |
  | show        | 展示验证码    |
  | destroy       | 销毁验证码 |
  | refresh | 重置验证码                                   |
2. 在自定义的.vue文件中，监听事件，代码如下：
   \`\`\`javascript
      methods:{
           login: function () {
               this.selectComponent('#captcha').show()
               // 进行业务逻辑，若出现错误需重置验证码，执行以下方法
               // if (error) {
               // this.selectComponent('#captcha').refresh()
               // }
           },
           // 验证码验证结果回调
           handlerVerify: function (ev) {
               // 如果使用了 mpvue，ev.detail 需要换成 ev.mp.detail
               if(ev.detail.ret === 0) {
                   // 验证成功
                   console.log('ticket:', ev.detail.ticket)
               } else {
                   // 验证失败
                   // 请不要在验证失败中调用refresh，验证码内部会进行相应处理
               }
           },    
           // 验证码准备就绪
           handlerReady: function () {
               console.log('验证码准备就绪')
           },    
           // 验证码弹框准备关闭
           handlerClose: function (ev) {
               // 如果使用了 mpvue，ev.detail 需要换成 ev.mp.detail,ret为0是验证完成后自动关闭验证码弹窗，ret为2是用户主动点击了关闭按钮关闭验证码弹窗
               if(ev && ev.detail.ret && ev.detail.ret === 2){
                   console.log('点击了关闭按钮，验证码弹框准备关闭');
               } else {
                   console.log('验证完成，验证码弹框准备关闭');
               }
           },
           // 验证码出错
           handlerError: function (ev) {
               console.log(ev.detail.errMsg)
           }
      }
   \`\`\`
### Taro 框架小程序插件接入示例
1. 在 app.config.ts 引入小程序插件。
\`\`\`json

{
  "plugins": {
    "captcha": {
      "version": "2.1.0",
      "provider": "wx1fe8d9a3cb067a75"
    }
  }
}
\`\`\`
2. 在需要加载验证码的页面配置插件，如 page/index/index.config.ts。
\`\`\`json

{
  "usingComponents": {
    "t-captcha": "plugin://captcha/t-captcha"
  }
}

\`\`\`
3. 在页面调用验证码，如 page/index/index.tsx。
\`\`\`json

import { getCurrentInstance, PageInstance } from '@tarojs/taro';

export default function Index() {
  // 获取页面实例

  const { page } = getCurrentInstance();

  // 弹出验证码

  const handlerCaptchaShow = () => {
    const pageInstance = page as PageInstance;

    const captcha: any = pageInstance.selectComponent && pageInstance?.selectComponent('#captcha');

    try {
      captcha?.show();
    } catch (error) {
      // 进行业务逻辑，若出现错误需重置验证码，执行以下方法

      captcha?.refresh();
    }
  };

  // 验证码验证结果回调

  const handlerVerify = (ev) => {
    console.log('ret:', ev.detail);

    // 如果使用了 mpvue，ev.detail 需要换成 ev.mp.detail

    if (ev.detail.ret === 0) {
      // 验证成功

      console.log('ticket:', ev.detail.ticket);
    } else {
      // 验证失败
      // 请不要在验证失败中调用refresh，验证码内部会进行相应处理
    }
  };

  return (
    <View className='index'>
      <t-captcha id='captcha' appId='小程序插件验证码CaptchaAppId' onVerify={handlerVerify} />
      <Button onClick={handlerCaptchaShow}>弹出验证码</Button>
    </View>
  );
}

\`\`\`
> 注意
业务客户端完成验证码接入后，服务端需二次核查验证码票据结果（未接入票据校验，会导致黑产轻易伪造验证结果，失去验证码人机对抗效果），详情请参见 [服务端接入> 微信小程序接入]。


服务端文档：
| 日期     | 版本     | 修订内容摘要                                                    |
| -------- | ----------------------------------------------------------- |---------- |
| 2023-09-07    | v1.0.0                                                | 新增接口文档|

 # 一、Web 及 App接入
 
### 1、接口描述

> - 请求协议：https 
> - 请求方式：post
> - Content-Type：multipart/form-data 
> - 接口地址：https://api.253.com/open/txyzm/yzm-v2

### 2、输入参数

| 参数名       | 类型   | 说明                         |
| ------------ | ------ | ---------------------------- |
| appId        | string | 应用 id                      |
| appKey       | string | 应用 key                     |
| AppSecretKey | string | 验证码密钥                 |
| CaptchaAppId | string | 验证码 appId              |
| RendStr      | string | 验证票据需要的随机字符串     |
| Ticket       | string | 验证码返回给用户的票据       |
| IP           | string | 用户操作来源的外网 IP        |

输出参数

| 参数名       | 类型    | 说明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| chargeStatus | string  | 是否收费 1 收费，0 不收费                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| message      | string  | 响应code码解释                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| tradeNo      | string  | 交易流水号                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| CaptchaMsg   | string  | 状态描述及验证错误信息 注意：此字段可能返回 null，表示取不到有效值。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| EvilLevel    | string  | [0,100]，恶意等级 注意：此字段可能返回 null，表示取不到有效值。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| RequestId    | string  | 验证码系统返回的唯一请求 ID，每次请求都会返回。定位问题时需要提供该次请求的 RequestId。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| CaptchaCode  | string  | 1 OK 验证通过<br>6 user code len error 验证码长度不匹配 <br>7 captcha no match 验证码答案不匹配/Randstr 参数不匹配（建议重新生成 Randstr、Ticket 进行校验。） <br>8 verify timeout 验证码签名超时（Ticket票据过期，前端生成Ticket后，有效时长为5分钟）<br> 9 Sequnce repeat 验证码签名重放（Ticket票据被重复校验，建议重新生成 Randstr、Ticket 进行校验） <br>10 Sequnce invalid 验证码签名序列<br> 11 Cookie invalid 验证码 cooking 信息不合法 <br>12 sig len error 签名长度错误<br> 13 verify ip no match ip 不匹配<br> 15 decrypt fail 验证码签名解密失败（以下情况均可导致该错误发生：1.CaptchaType 不等于9。2.Randstr 或 Ticket 所填写的值和前端生成的不一致。3.userIP 不合法。4.CaptchaAppId、AppSecretKey 填写有误。）<br> 16 appid no match 验证码强校验 appid 错误（CaptchaAppId错误，前端代码 data-appid 和后端 CaptchaAppId 所填写的值，都必须和验证码应用中 CaptchaAppId （验证id）一致） <br>17 cmd no much 验证码系统命令不匹配<br> 18 uin no match 号码不匹配 19 seq redirect 重定向验证<br> 20 opt no vcode 操作使用 pt 免验证码校验错误<br> 21 diff 差别，验证错误 <br>22 captcha type not match 验证码类型与拉取时不一致 <br>23 verify type error 验证类型错误 <br>24 invalid pkg 非法请求包 <br>25 bad visitor 策略拦截<br> 26 system busy 系统内部错误<br> 100 param err appsecretkey 参数校验错误 |
| EvilBitmap   | string  | 风控拦截策略<br>注意：此字段可能返回 null，表示取不到有效值，<br>0：空秒拨代理IP异常	<br>1：IP短时聚集异常（短时间内多次发起验证）	<br>2：AppId+IP短时聚集异常（短时间内多次发起验证）<br>	3：AppId+IP+设备短时聚集异常（短时间内多次发起验证）<br>4：流量特征异常（比如TCP协议栈信息异常）<br>5：数据参数异常（比如浏览器参数异常）<br>	6：蜜罐异常（执行了不该执行的逻辑）<br>	7：行为聚类异常|
| code         | string  | 响应 code 码 <br>200000 请求成功 <br>400001 参数校验异常 <br>400101 商户信息不存在<br> 400102 商户 IP 地址不合法 <br>400200 黑名单列表 <br>400201 手机号码不能为空<br> 400901 账户信息不存在<br> 400902 应用类型信息不存在<br> 403000 用户校验失败 <br>403101 账户被系统禁用 <br>403102 账户未激活 <br>415000 请求数据转换异常 <br>500000 系统异常 <br>500002 数据处理异常<br> 500003 业务操作失败<br> 500004 远程调用失败<br> 500005 账户余额异常<br> 500006 请求外部系统失败 <br>500901 邮箱未设置<br> 500902 账户信息已存在<br> 500903 账户相关能力已激活 <br>504000 系统超时<br> 510101 用户产品可用数量不足                                                                                                                                                                                                                                                          |

返回示例:

正常:

\`\`\`json
{
  tradeNo: "656221037519835137",
  chargeStatus: 1,
  message: "成功",
  data: {
    CaptchaMsg: "OK",
    EvilLevel: "0",
    EvilBitmap: "0",
    RequestId: "984d6957-902c-4be8-af3a-012309b63d80",
    CaptchaCode: "1"
  },
  code: "200000"
}
\`\`\`

验证码 CaptchaAppId、AppSecretKey 错误:

\`\`\`json
{
  tradeNo: "656198616582455296",
  chargeStatus: 1,
  message: "成功",
  data: {
    CaptchaMsg: "SecretKeyCheck Error",
    EvilLevel: "0",
    EvilBitmap: "null",
    RequestId: "e82f459a-cbf5-4167-9a9e-1d2c1bbdf9bd",
    CaptchaCode: "100"
  },
  code: "200000"
}
\`\`\`

验证码 ticket 超时，需要重新获取:

\`\`\`json
{
  tradeNo: "656221420577095680",
  chargeStatus: 1,
  message: "成功",
  data: {
    CaptchaMsg: "verify timeout",
    EvilLevel: "0",
    EvilBitmap: "null",
    RequestId: "060352db-3767-4a3c-bd31-3beb624b17ce",
    CaptchaCode: "8"
  },
  code: "200000"
}
\`\`\`

Ticket 和 rendStr 不一致，返回示例:

\`\`\`json
{
  tradeNo: "656222083289710592",
  chargeStatus: 1,
  message: "成功",
  data: {
    CaptchaMsg: "decrypt fail",
    EvilLevel: "0",
    EvilBitmap: "null",
    RequestId: "593dd626-8563-4f4d-9f17-6fe3a216937a",
    CaptchaCode: "15"
  },
  code: "200000"
}
\`\`\`

# 二、微信小程序接入


### 1、接口描述

> - 请求协议：https 
> - 请求方式：post
> - Content-Type：multipart/form-data 
> - 接口地址：https://api.253.com/open/txyzm/yzmMini-v2

### 2、输入参数

| 参数名       | 类型   | 说明                         |
| ------------ | ------ | ---------------------------- |
| appId        | string | 应用 id                      |
| appKey       | string | 应用 key                     |
| AppSecretKey | string | 验证码密钥                 |
| CaptchaAppId | string | 验证码 appId              |
| Ticket       | string | 验证码返回给用户的票据       |
| IP           | string | 用户操作来源的外网 IP        |

输出参数

| 参数名       | 类型    | 说明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| chargeStatus | string  | 是否收费 1 收费，0 不收费                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| message      | string  | 响应code码解释                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| data         | string  | 返回结果                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| CaptchaCode  | string  | 1 ticket verification succeeded 票据验证成功<br> 7 CaptchaAppId does not match 票据与验证码应用APPID不匹配<br> 8 ticket expired 票据超时<br> 10 ticket format error 票据格式不正确<br> 15 ticket decryption failed 票据解密失败<br> 16 CaptchaAppId wrong format 检查验证码应用APPID错误<br> 21 (1)ticket error 票据验证错误 (2)diff 一般是由于用户网络较差，导致前端自动容灾，而生成了容灾票据，业务侧可根据需要进行跳过或二次处理<br> 25 invalid ticket 无效票据<br> 26 system internal error 系统内部错误<br> 31 UnauthorizedOperation.Unauthorized 无有效套餐包/账户已欠费<br> 100 param err 参数校验错误<br> 示例值：8|
| CaptchaMsg   | string  | 状态描述及验证错误信息 注意：此字段可能返回 null，表示取不到有效值。 示例值：ticket expired                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| RequestId    | string  | 唯一请求 ID，每次请求都会返回。定位问题时需要提供该次请求的 RequestId。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| code         | string  | 响应 code 码 <br>200000 请求成功 <br>400001 参数校验异常 <br>400101 商户信息不存在<br> 400102 商户 IP 地址不合法 <br>400200 黑名单列表 <br>400201 手机号码不能为空<br> 400901 账户信息不存在<br> 400902 应用类型信息不存在<br> 403000 用户校验失败 <br>403101 账户被系统禁用 <br>403102 账户未激活 <br>415000 请求数据转换异常 <br>500000 系统异常 <br>500002 数据处理异常<br> 500003 业务操作失败<br> 500004 远程调用失败<br> 500005 账户余额异常<br> 500006 请求外部系统失败 <br>500901 邮箱未设置<br> 500902 账户信息已存在<br> 500903 账户相关能力已激活 <br>504000 系统超时<br> 510101 用户产品可用数量不足                                                                                                                                                                                                                                                          |

返回示例:

正常:

\`\`\`json
{
    "chargeStatus": 1,
    "message": "成功",
    "data": {
        "CaptchaCode": "1",
        "CaptchaMsg": "ticket verification succeeded",
        "RequestId": "d9faaf84-02c3-484c-a24c-3fa6a2556be4"
    },
    "code": "200000"
}
\`\`\`

验证码 CaptchaAppId、AppSecretKey 错误:

\`\`\`json
{
    "chargeStatus": 1,
    "message": "成功",
    "data": {
        "CaptchaCode": "31",
        "CaptchaMsg": "Uin-CaptchaAppId不匹配，请检查使用的CaptchaAppId是否属于对应的账户/子账户",
        "RequestId": "f2d03160-86b2-4a23-876a-908d3b8f551e"
    },
    "code": "200000"
}
\`\`\`

验证码 ticket 超时，需要重新获取:

\`\`\`json
{
    "chargeStatus": 1,
    "message": "成功",
    "data": {
        "CaptchaCode": "8",
        "CaptchaMsg": "ticket expired 详情请参考输出参数中CaptchaCode字段的具体描述",
        "RequestId": "3dafd257-c036-4d3f-8f80-75ed7fa2f9cc"
    },
    "code": "200000"
}
\`\`\`

Ticket错误，返回示例:

\`\`\`json
{
    "chargeStatus": 1,
    "message": "成功",
    "data": {
        "CaptchaCode": "15",
        "CaptchaMsg": "ticket decryption failed 详情请参考输出参数中CaptchaCode字段的具体描述",
        "RequestId": "98e87d2a-746f-40de-8460-87cead75549b"
    },
    "code": "200000"
}
\`\`\`

# code码解释
code码解释见：[code码解释](https://doc.chuanglan.com/document/2X0LOCDC1951KYDC)`
};
