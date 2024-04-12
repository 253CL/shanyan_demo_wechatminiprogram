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
const replacementPhoneNumber = (token, appId, appKey, callback) => {
    let params = { token, appId };
    const sign = sortAndEncryptObjectProperties(params, appKey);
    params = { token, appId, sign };
    let formData = new FormData();
    for (let key in params) {
        formData.append(key, params[key]);
    }
    axios
        .post('https://57.cm253.com:8445/open/web/mobile-query', formData, {
        // .post('https://56.cm253.com:8445/open/web/mobile-query', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        .then(({ data }) => {
            if (data.code === '200000') {
                const mobile = phoneDecrypt(data.data.mobile, appKey);
                console.log(mobile);
                callback('解密后的手机号码' + mobile);
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
const isWifi = () => {
    const connection = window.YDRZAuthLogin.getConnection(123);
    return connection.netType === 'wifi';
};
const checkAuthEnable = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isMobile && isMobileData();
};
const isMobileData = () => {
    const connection = window.YDRZAuthLogin.getConnection(123);
    return connection.netType === 'cellular';
};
const auth = (params, callback) => {
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
};
const checkKeysExist = (obj) => {
    const keysToCheck = ['setLoginTitle', 'setLoginLogo', 'setPrivacyOne', 'setPrivacyTwo'];
    for (let key of keysToCheck) {
        if (key in obj) {
            return true;
        }
    }
    return false;
};
const dynamicType = (uiCongig) => {
    if (uiCongig.isModal) {
        return '2';
    } else {
        return checkKeysExist(uiCongig) ? '3' : '0';
    }
};
const definedProtocolArr = (uiCongig) => {
    return [
        uiCongig?.setPrivacyOne?.[0] && { name: uiCongig.setPrivacyOne[0], url: uiCongig.setPrivacyOne[1] },
        uiCongig?.setPrivacyTwo?.[0] && { name: uiCongig.setPrivacyTwo[0], url: uiCongig.setPrivacyTwo[1] }
    ].filter(item => item);
}
const customConfigFn = (uiCongig) => {
    window.YDRZAuthLogin.authPageInit({
        bgColor: '#FFFFFF',
        titleStyle: { name: `${uiCongig.setLoginTitle || '本机号码登录'}`, fontFamily: 'PingFangSC-Medium, PingFang SC', fontSize: '1.33rem', fontColor: '#444444', width: '70%', height: '1.83rem', left: 'center', high: '1rem', textAlign: 'center' },
        logoStyle: { url: `${uiCongig.setLoginLogo || 'https://www.cmpassport.com/h5/js/jssdk_auth/image/logo.png'}` },
        phoneNumStyle: { fontFamily: 'PingFangSC-Semibold, PingFang SC', fontSize: '2.58rem', fontColor: '#444444', bgColor: '#FFFFFF', fontWeight: '500', width: '27rem', left: 'center', high: '20.58rem', inputStyle: { width: '1.83rem', height: '3rem' } },
        authTextStyle: { fontFamily: 'PingFangSC-Medium, PingFang SC', fontSize: '1.08rem', fontColor: '#444444', appNameColor: '#444444', width: '100%', textAlign: 'center', high: '16.75rem', left: 'center', fontWeight: '500' },
        agreeStyle: {
            fontFamily: 'PingFangSC-Regular, PingFang SC',
            fontSize: '1rem',
            fontColor: '#999999',
            high: '30.58rem',
            left: 'center',
            checkedButton: { width: '1.33rem', height: '1.33rem', uncheckColor: '#cccccc', checkedColor: '#1E82EB', uncheckUrl: '', checkedUrl: '' },
            hrefStyle: {
                fontColor: '#1E82EB',
                agreeArr: definedProtocolArr()
            }
        },
        tipStyle: { fontFamily: 'PingFangSC-Regular, PingFang SC', fontSize: '0.92rem', fontColor: '#999999', high: '27rem', left: 'center' },
        returnBtnStyle: { width: '0.65rem', height: '1.1rem', left: '1rem', high: '1.3rem', url: 'https://www.cmpassport.com/h5/js/jssdk_auth/image/returnIcon.png' }
    });
};

const customModalConfigFn = (uiCongig) => {
    window.YDRZAuthLogin.CustomControlsInit('ydrzCustomControls', {
        titleStyle: { ifShow: 'true', name: "请填写完整号码并授权使用此号码", high: "6.5rem ", fontSize: "3vw" },
        layerStyle: { width: '', height: '20rem', bgColor: '#fff', borderRadius: '23px' },
        logoStyle: { url: `${uiCongig.setLoginLogo || 'https://www.cmpassport.com/h5/js/jssdk_auth/image/logo.png'}`, width: "5rem", height: "5rem", high: "1rem" },
        maskStyle: {
            ifShowMask: true,
            bgColor: '',
            opacity: ''
        },
        phoneStyle: {
            fontSize: '',
            fontColor: '#000000',
            high: '10rem',
            left: '20px'
        },
        agreeStyle: {
            fontSize: '',
            textalign: '',
            fontColor: '',
            hrefColor: '',
            high: '15rem',
            left: '',
            agreeArr: definedProtocolArr()
        },
        closeBtnStyle: {
            ifShowBtn: true,
            btnImage: '',
            top: '',
            right: '',
            width: '',
            height: ''
        },
        customControlStyle: {
            ifShow: true,
            width: '',
            height: '24px',
            high: '12rem',
            left: 'center',
            bgColor: '#fff',
            border: '0',
            borderRadius: '',
            name: '若非本机号码，请返回并切换4G/5G网络使用',
            fontSize: '12px',
            fontColor: 'rgb(230 114 28)',
            textAlign: 'center',
            textDecoration: ''
        }
    });
};
export { replacementPhoneNumber, cryptographicToken, isWifi, checkAuthEnable, isMobileData, auth, checkKeysExist, dynamicType, customConfigFn, customModalConfigFn };
