# Token 生成规则

**\[调用运营商sdk 获取 运营商 Token 后 根据此规则进行加密 生成新的 Token ，暴露给客户，由客户调用置换手机号的接口\]**

提供的文本显示了不同运算符（包括联通、移动和电信）的令牌生成的各种示例。令牌生成过程涉及各种参数，例如运算符的 accessToken、应用程序 appid、数据标识（dd）、版本号（vs）和浏览器加密指纹（fp）。

dd 参数是通过将数据分为三部分生成的：32 位随机数、电话掩码的 AES 加密值以及 UUID\.randomUUID\(\) \+ 生成 ID 时间戳 \+ 设备供应商 \+ 系统版本 \+ 设备型号的组合。

Sign 生成过程使用 AES 加密数据字段，其中密钥是 appid 的 MD5 值，初始向量是 appid 的 MD5 值。

令牌生成过程将运算符类型、Sign 和其他参数组合起来，创建一个唯一的令牌字符串。

提供的代码示例演示了如何使用 Java 代码生成 sign 和 token，包括使用 JSONObject 对象存储参数，使用 MD5 和 AES 加密算法进行数据加密，以及将加密后的数据进行 Base64 编码。

## **Token示例：**

- 联通：

A2\-mIUhtS24ir7G58rVYOPSOpIRwodEDqbK2ck868NqLliUsrBLB9LC1TuQFC\-kA2qAHvlHnMtb5dzLKsrY44AfeFiqKdM\-RxJJibDwI4stFUqPluMp2Lb7nYTNgKFf6WUINDqgFi9V\-\_ZgTCSapqkz\-lIo\-EpNU4VcQcc9XbZ3ZGljd18nv7bjxMmCAiIYuST\-b09OfKcPEpjaouqa\-gVB2KGNYXWvgpEcJ\-aBXDsUy6ETVauIKKKG2UrxI9MbyE3oYLKoqofIw1ab8xxFNHGPWYUe9TUNhr9VzMaBSkBhGH1o9Yvd2J9w5LDKINBW3wg3HMTuEDiQ6xyrd3uaeO54bE\_2sDrr5pE9YCO9XDvJ93lM7Vj95EGmPpXiL3H0q1VXJM1co4gYRmQOIrUbnY1xmg

- 移动：

A1\-8bV89vhU2bQvWR\_Sa2A7w9amUkVpoiitKPVASOiwGhUdjFxicUMyuTML3eGuOK0qKOCg3zUego14ENZvfbUYV9d\_ybPWLnaxIkavkRM5LifjY4eTbd\-xnUgcapKPim9ULWknGNETx7EsQ03Y\-w0vEs160Vx6mZfgWGhxQOvC1eTnI5uSoigYRj4N3csR9q91orm4SPB\_rpFntOTA5Q7QyNX\-9uQqcvUhRlDRucEZ0U\-Qnd6\_\_FCUluAOXsPwmNO4aNY4\_SL7UEshZ2MKUJmhyKueajO4i4elCFs0xgLOvWdbtbXV5IYUj9hJMF1C\-X2shtil\-sJxOjWDvJZI8awYJu3VKXyLs8q6RzaHU489MuGfnjF4gS\-rUFwbe\-7UPO5HCSEg5m919kfyfGS6L07v6BTUFs9dNLp2qn9AHkBWMl1vZob7r4T7\-\-pJjlM\_a5GG

- 电信：

A3\-8bV89vhU2bQvWR\_Sa2A7w62P4AMKTudNR5yxcPeqwNkFQxFJduwSyxRGtmOdPfLjnztHo3KG7JiWhOYbbPJid1D1CUXH6x7WJ8ZHK5iSmb5xqa0ZzqMRLVulAxg4hQsLbWM2A21V\-9n7ZiueF4G56Mw5O8\_vbSBJ2Dm49JrctJK\_cJJo1\-wcR1Bu2J1cCJj1rOoj5vgIcsRuhUDHQKySmdsORJTzFcheOl3IxndS\_GK1KcGazYN4JBjyzETPla8EGIE\_60LWBCh0pMxCeLiZu0CDc53iGzoqaKQMdjffmsyIXDvaZtrvJlfEGjRHboiVIo7gxou\-0eHN0YCckgfH6Z9AWuLy5vZHtTsz6aEUyiaKGWxkAmfjmH3MS\_x2FA0lO2JkUCSxAjqXMSCjza88qhEH6BUoDeqdz7JLrp9EXkY

### **生成参数：**

```JSON
{
    **"tk"**: **"nm76513e772ae0422eab4b569a5b810aa3"**,
    **"ap"**: **"o1bWQCXT"**,
    **"au"**: **"2702"**,
    **"dd"**: **"823a1b261733cb0f90376fccfbe47139,TN0v7N7pdjqosqssaolaVw,7790158eadec441cbfcd5701b379be6a1698920199522"**,
    **"vs"**: **"2.3.3.9"**,
    **"fp"**: **"0"**
}
```

### **各参数含义：**

```Properties
"tk":运营商accessToken
”ap”:应用appid
“au”:*电信：gwAuth （校验码 （客户端未返回可为空））*
“dd”:数据标识
"vs": 版本号（1.0.0）
"fp": *浏览器加密指纹（根据jssdk返回）*
```

## dd生成规则：

根据逗号可以将\&\#34;dd\&\#34;分为3部分：

第1部分：823a1b261733cb0f90376fccfbe47139：32位随机数。

第2部分：TN0v7N7pdjqosqssaolaVw：AES\(手机掩码\)后的值

第3部分：7790158eadec441cbfcd5701b379be6a1698920199522：UUID\.randomUUID\(\)\+生成ID时的时间戳\+设备厂商\+系统版本\+设备型号

**注意：**

- **移动、电信卡：只需要第1部分。示例：\&\#34;dd\&\#34;: \&\#34;823a1b261733cb0f90376fccfbe47139\&\#34;。**

- **联通卡：第3部分生成前需要先判断本地是否有该部分缓存，没有则重新生成并缓存到本地，如果有则直接使用缓存值，不重新生成。示例：\&\#34;dd\&\#34;**: **\&\#34;823a1b261733cb0f90376fccfbe47139,TN0v7N7pdjqosqssaolaVw,7790158eadec441cbfcd5701b379be6a1698920199522\&\#34;**



## Sign生成规则：

①将data中的所有字段做AES加密，其中秘钥是appid的MD5值前16位，初始化向量是appid的MD5值后16位。

②将生成的密文做Base64编码生成sign。







## token生成规则：

A\+运营商类型\+sign（其中运营商类型,移动是”1”,联通是”2”,电信是”3”）

### Java代码示例:

```Java
// 以移动卡A1,appid是”loXN4jDs”的应用为例，sign及token生成示例代码：

JSONObject params = new JSONObject();
params.put("ap", “loXN4jDs”);
params.put("tk", "nm76513e772ae0422eab4b569a5b810aa3");
params.put("au", "2702");
params.put("dd", "823a1b261733cb0f90376fccfbe47139,TN0v7N7pdjqosqssaolaVw,7790158eadec441cbfcd5701b379be6a1698920199522");
params.put("vs", "2.3.4.1");
params.put("**fp**", "0");
String appIdKey = AbObtainUtil.md5(“loXN4jDs”);
String encryptKey = appIdKey.substring(0, 16);
String encryptIv = appIdKey.substring(16);
String sign = Base64.encodeToString(AbObtainUtil.aesEncrypt(params.toString().getBytes("utf-8"), encryptKey, encryptIv), Base64.NO_WRAP | Base64.NO_PADDING | Base64.URL_SAFE);
String token =token = " A1-" + sign;
 
 
public class AbObtainUtil {
    /**
     * MD5生成签名字符串
     *
     * @param str 需签名参数
     * @return
     */
    public static String md5(String str) {
        if (AppStringUtils.isEmpty(str)) {
            return "";
        }
        MessageDigest md5 = null;
        try {
            md5 = MessageDigest.getInstance("MD5");
            byte[] bytes = md5.digest(str.getBytes());
            String result = "";
            for (byte b : bytes) {
                String temp = Integer.toHexString(b & 0xff);
                if (temp.length() == 1) {
                    temp = "0" + temp;
                }
                result += temp;
            }
            return result;
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        }
        return "";
    }

    /**
     * AES加密
     */
    public static byte[] aesEncrypt(byte[] dataBytes, String encryptKey, String encryptIv) {
        try {
            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            SecretKeySpec keyspec = new SecretKeySpec(encryptKey.getBytes(), "AES");
            IvParameterSpec ivspec = new IvParameterSpec(encryptIv.getBytes());
            cipher.init(Cipher.ENCRYPT_MODE, keyspec, ivspec);
            return cipher.doFinal(dataBytes);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
```

### Js代码示例：

```JavaScript
const CryptoJS = require("crypto-js");

function md5(str) {
    if (!str) {
        return "";
    }
    const hash = CryptoJS.MD5(str).toString();
    return hash;
}

function aesEncrypt(data, key, iv) {
    let cipher = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });
    return cipher.ciphertext.toString(CryptoJS.enc.Base64);
}

function convertSign(sign) {
    return sign.replace(/\//g, "_").replace(/\+/g, "-").replace(/=/g, "");
}

let params = {
    ap: "loXN4jDs",
    tk: "nm76513e772ae0422eab4b569a5b810aa3",
    au: "2702",
    dd: "823a1b261733cb0f90376fccfbe47139,TN0v7N7pdjqosqssaolaVw,7790158eadec441cbfcd5701b379be6a1698920199522",
    vs: "2.3.4.1",
    fp: "0",
};

let appIdKey = md5("loXN4jDs");
let encryptKey = CryptoJS.enc.Utf8.parse(appIdKey.substring(0, 16));
let encryptIv = CryptoJS.enc.Utf8.parse(appIdKey.substring(16));

let encryptedData = aesEncrypt(JSON.stringify(params), encryptKey, encryptIv);

let sign = "A1-" + encryptedData;
let convertedSign = convertSign(sign);

console.log("appIdKey: " + appIdKey);
console.log("encryptKey: " + CryptoJS.enc.Base64.stringify(encryptKey));
console.log("encryptIv: " + CryptoJS.enc.Base64.stringify(encryptIv));
console.log("Sign: " + convertedSign);
```

在 JavaScript 中使用 CryptoJS 库来进行 MD5 和 AES 加密操作，从而实现与提供的 Java 代码相同的功能。此代码假设已安装了 CryptoJS 模块，可以通过 npm install crypto\-js 命令进行安装。



