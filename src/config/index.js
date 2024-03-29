import axios from 'axios';
const CryptoJS = require('crypto-js');
const phoneDecrypt = (content, keys) => {
    const md5Key = CryptoJS.MD5(keys).toString().substring(0, 16);
    const md5Iv = CryptoJS.MD5(keys).toString().substring(16);
    const key = CryptoJS.enc.Utf8.parse(md5Key);
    const iv = CryptoJS.enc.Utf8.parse(md5Iv);
    const encryptedHexStr = CryptoJS.enc.Hex.parse(content);
    const srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
    const decrypt = CryptoJS.AES.decrypt(srcs, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    const decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
    return decryptedStr.toString();
};

const aesEncryptObject = (str, obj) => {
    const md5Key = CryptoJS.MD5(str).toString().substring(0, 16);
    const md5Iv = CryptoJS.MD5(str).toString().substring(16);
    const key = CryptoJS.enc.Utf8.parse(`${md5Key}`);
    const iv = CryptoJS.enc.Utf8.parse(`${md5Iv}`); //16位初始向量
    try {
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(obj), key, {
            iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        return encrypted.toString();
    } catch (error) {
        console.log(error);
    }
};
const isObj = (value) => {
    return Object.prototype.toString.call(value).slice(8, -1) === 'Object';
};
const isFunction = (value) => {
    return Object.prototype.toString.call(value).slice(8, -1) === 'Function';
};
const convertSign = (sign) => {
    return sign.replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '');
};
const replacementPhoneNumber = (token, appId, appKey, callback, destroyHandle) => {
    let params = { token, appId };
    const sign = sortAndEncryptObjectProperties(params, appKey);
    params = { token, appId, sign };
    let formData = new FormData();
    for (let key in params) {
        formData.append(key, params[key]);
    }
    axios
        .post('https://56.cm253.com:8445/open/web/mobile-query', formData, {
            headers: {
                // .post('https://f5a9-218-76-38-2.ngrok-free.app/open/web/mobile-query', formData, {
                //     headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        .then(({ data }) => {
            if (data.code === '200000') {
                const mobile = phoneDecrypt(data.data.mobile, appKey);
                console.log(mobile);
                callback('解密后的手机号码' + mobile);                
                destroyHandle();
            } else {
                callback(data.message);
            }
        })
        .catch((error) => {
            callback(error);
        });
};

const sortAndEncryptObjectProperties = (obj, secretKey) => {
    const sortedProperties = Object.keys(obj).sort();
    const concatenatedProperties = sortedProperties.map((key) => `${key}${obj[key]}`).join('');
    const hash = CryptoJS.HmacSHA256(concatenatedProperties, secretKey);
    const hashInHex = hash.toString(CryptoJS.enc.Hex);
    return hashInHex;
};
const generateRandomBitNumber = (length) => {
    let result = '';
    const characters = '0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};
const cryptographicToken = (type, responseData, appId) => {
    const randomNumber = generateRandomBitNumber(32);
    const params = {
        ap: appId,
        tk: responseData.token || responseData.accessCode || '',
        au: responseData.gwAuth || '',
        dd: randomNumber,
        vs: '1.0.0',
        fp: responseData.userInformation || ''
    };
    const token = convertSign(aesEncryptObject(appId, params));
    return `${type}-` + token;
};
const isCtcc=(data)=>{
   return Object.keys(data)>0
}
const isWifi=() =>{
    const connection = window.YDRZAuthLogin.getConnection(123);
    return connection.netType === 'wifi';
}
const checkAuthEnable=() =>{
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isMobile && isMobileData();
}
const isMobileData=() =>{
    const connection = window.YDRZAuthLogin.getConnection(123);
    return connection.netType === 'cellular';
}
const auth=(params, callback)=> {
    if (isFunction(callback) === false) {
        callback = (value) => console.log(value);
    }
    if (isObj(params) === false) {
        callback({ code: '000500', message: '参数错误' });
        return false;
    }
    if (Boolean(params.appKey) === false) {
        callback({ code: '000510', message: 'appKey必传' });
        return false;
    }
    if (Boolean(params.appId) === false) {
        callback({ code: '000520', message: 'appId必传' });
        return false;
    }
    return true;
}
export { replacementPhoneNumber, cryptographicToken,isCtcc ,isWifi,checkAuthEnable,isMobileData,auth};
