import './index.less';
import ReactDOM from 'react-dom/client';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { httpPost } from './axios';
import { NumberKeyboard, PasscodeInput, Radio } from 'antd-mobile';
import {replacementPhoneNumber,cryptographicToken,isCtcc,auth} from "./config/index"
let domobj = null;
let rootobj = null;
let cuccResponseData = {};
let cmccResponseData = {};
let ctccResponseData = {};
let uiCongig={};
//销毁组件
const destroyHandle = () => {
    setTimeout(() => {
        if (rootobj) {
            rootobj.unmount();
        }
        if (domobj) {
            document.body.removeChild(domobj);
        }
    }, 0)}
function Main({ params, callback }) {
    const [cuccView, setCuccView] = useState(false);
    const [cuccPhoneNumber, setCuccPhoneNumber] = useState('');
    const [_cuccResponseData, setCuccResponseData] = useState({});
    const [checked, setchecked] = useState(false);
    const [callResult, setCallResult] = useState([]);
    const appId = params.appId || '';
    const appKey = params.appKey || '';
    const cmccCancel = () => {
        destroyHandle();
    };
    //销毁组件
    const destroyHandle = useCallback(() => {
        setTimeout(() => {
            if (rootobj) {
                rootobj.unmount();
            }
            if (domobj) {
                document.body.removeChild(domobj);
            }
        }, 0);
    }, []);
    const radioChange = () => {
        setchecked(!checked);
    };
    const cucc = useCallback(() => {
        window.LTRZ['getTokenInfo']({
            //1.获取置换码方法
            appKey: cuccResponseData.appSecret, //密钥
            authenticator: cuccResponseData.sign, //加密后的数据。客户设置
            ts: cuccResponseData.timestamp
        })
            .then((res) => {
                domobj.classList.add('jm-layout');
                setCuccView(true);
                setCuccResponseData(res);
            })
            .catch((err) => {
                console.log('cuccerr', err);
                setCallResult((pre) => [...pre, { err, time: new Date().getTime() }]);
            });
    }, []);
    const cmcc = useCallback(() => {
        window.YDRZAuthLogin.getTokenInfo({
            data: {
                version: '2.0', //接口版本号 （必填）
                appId: cmccResponseData.appId, //应用Id （必填）
                sign: cmccResponseData.sign,
                traceId: cmccResponseData.traceId,
                timestamp: cmccResponseData.timestamp, //请求消息发送的系统时间，精确到毫秒，共17位，格式：20121227180001165
                openType: '1', //取号类型
                expandParams: '', //扩展参数 格式：参数名=值 多个时使用 \| 分割 （选填）
                authPageType:Object.keys(uiCongig)?'3': '0', //若值为“1”时展示弹窗，若值为“2”时展示自定义弹窗版，若值为“3”时展示自定义页面版，若为其它值则展示页面。更多说明见“2.重要参数说明”中“2.3.authPageType”
                devInfo: '', // 1：用户点击其他登录方式时回收授权弹窗，点击协议时协议内容使用iframe打开,默认不回收授权弹窗，点击协议时协议内容在一个新窗口打开
                setReturn: '' // 1：授权页面显示返回键，不传或其他值根据浏览器判断
            },
            success: function (res) {
                const token = cryptographicToken('A1', res,appId);
                replacementPhoneNumber(token,appId,appKey,callback,destroyHandle);
            },
            error: function (err) {
                console.log('cmccerr', err);
                setCallResult((pre) => [...pre, { err, time: new Date().getTime() }]);
            },
            layerCallback: function (res) {
                //authPageType等于2时可以通过该回调方法监听，用户输入中间四位号码并勾选协议后触发
            }
        });
    }, [appId, appKey, callback, destroyHandle]);

    const numberKeyboardChange = (e) => {
        setCuccPhoneNumber((pre) => {
            return pre.length < 4 ? pre + e : pre;
        });
    };
    const numberKeyboardDelete = () => {
        setCuccPhoneNumber((prestr) => {
            return prestr.substring(0, prestr.length - 1);
        });
    };
    const { firstThree, lastFour } = useMemo(() => {
        const str = _cuccResponseData.pmobile;
        const firstThree = str?.substring(0, 3);
        const lastFour = str?.substring(str?.length - 4);
        return {
            lastFour,
            firstThree
        };
    }, [_cuccResponseData]);
    useEffect(() => {
        if (callResult.length === 2) {
            const maxTimeObject = callResult.reduce((max, current) => (current.time > max.time ? current : max));
            callback(maxTimeObject.err);
        }
    }, [callResult, callback]);
    useEffect(() => {
        if (cuccPhoneNumber.length === 4 && checked) {
            const data = { ...cuccResponseData, userInformation: `${firstThree}${cuccPhoneNumber}${lastFour}`,accessCode:_cuccResponseData.accessCode };
            const token = cryptographicToken('A2', data,appId);
            replacementPhoneNumber(token,appId,appKey,callback,destroyHandle);
        }
    }, [_cuccResponseData.accessCode, appId, appKey, callback, checked, cuccPhoneNumber, destroyHandle, firstThree, lastFour]);
    useEffect(() => {
        cucc();
    }, [cucc]);
    useEffect(() => {
        cmcc();
    }, [cmcc]);
    return (
        <React.Fragment>
            {cuccView && (
                <div>
                    <span className="cancel" onClick={cmccCancel}>
                        {'<'}
                    </span>
                    <div className="top">
                        <p className="top-title">本机号码登录</p>
                    </div>
                    <div className="image">
                        <img alt="" src="https://n.sinaimg.cn/tech/656/w376h280/20191030/a94f-ihqyuym4783651.jpg"></img>
                    </div>
                    <p className="title">中国联通为您提供本机号码认证服务，请输入完整号码</p>
                    <div className="phone-number">
                        {firstThree?.split('').map((item, index) => (
                            <span key={index} className="phone-block">
                                {item}
                            </span>
                        ))}
                        <div className="phone-number-box">
                            <PasscodeInput value={cuccPhoneNumber} length={4} plain keyboard={<div style={{ display: 'none' }}></div>} />
                        </div>
                        {lastFour?.split('').map((item, index) => (
                            <span key={index} className="phone-block">
                                {item}
                            </span>
                        ))}
                    </div>
                    <p className="hint">若非本机号码，请返回并切换4G/5G网络使用</p>
                    <div className="authorize">
                        <Radio checked={checked} onClick={radioChange} />
                        <span>登录即同意</span>
                        <span onClick={() => (window.location.href = 'https://auth.wosms.cn/html/oauth/protocol2.html')} className="protocol">
                            天翼账号服务协议与隐私政策
                        </span>
                        <span>并使用本机号码登录</span>
                    </div>
                    <NumberKeyboard visible={cuccView} showCloseButton={false} onInput={(e) => numberKeyboardChange(e)} onDelete={numberKeyboardDelete} />
                </div>
            )}
        </React.Fragment>
    );
}
function InitLayout({ params, callback }) {
    const appId = params.appId || '';
    const appKey = params.appKey || '';
    const _getSign = useCallback(
        (res = {}) => {
            return httpPost('', { telecomType: '3', appId, data: res.encryValue });
        },
        [appId]
    );
    const destroyHandle = useCallback(() => {
        setTimeout(() => {
            if (rootobj) {
                rootobj.unmount();
            }
            if (domobj) {
                document.body.removeChild(domobj);
            }
        }, 0);
    }, []);
    const ctcc = useCallback(() => {
        window.fjs?.getAccessCode({
            debug: false, // 非必填，布尔值，开启调试模式,调用的所有api的返回值会在客户端alert出来，在pc端打印出来。生产环境请设置为false
            btnId: 'j-get-code', //必填，“获取accessCode”按钮标签id（可参考下方html/js示例）
            appId: ctccResponseData.appId, //必填，开发者在注册应用的时候由天翼账号开放平台分发的接入方appId
            authDomain: '', //非必填，合作方传入域名参数
            getSignParams: function (res) {
                _getSign(res).then((data) => {
                    window.fjs.setSign(data.data.sign);
                });
            },
            ready: function (res) {
                console.log(res,"电信准备好了");
            },
            success: function (res) {
                const token = cryptographicToken('A3', res,appId);
                replacementPhoneNumber(token,appId,appKey,callback,destroyHandle);
            },
            error: function (err) {
                console.log('ctccerr', err);
                // setCallResult((pre) => [...pre, { err, time: new Date().getTime() }]);
            }
        });
    }, [_getSign, appId, appKey, callback, destroyHandle]);
    const customConfigFn = () => {
        window.YDRZAuthLogin.authPageInit({
            bgColor: '#FFFFFF',
            titleStyle: { name: `${uiCongig.setLoginTitle||"本机号码登录"}`, fontFamily: 'PingFangSC-Medium, PingFang SC', fontSize: '1.33rem', fontColor: '#444444', width: '70%', height: '1.83rem', left: 'center', high: '1rem', textAlign: 'center' },
            logoStyle: { url:  `${uiCongig.setLoginLogo||"https://www.cmpassport.com/h5/js/jssdk_auth/image/logo.png"}` , width: '6.96rem', height: '7.32rem', high: '7.9rem', left: 'center' },
            authTextStyle: { fontFamily: 'PingFangSC-Medium, PingFang SC', fontSize: '1.08rem', fontColor: '#444444', appNameColor: '#444444', width: '100%', textAlign: 'center', high: '22.75rem', left: 'center', fontWeight: '500' },
            phoneNumStyle: { fontFamily: 'PingFangSC-Semibold, PingFang SC', fontSize: '2.08rem', fontColor: '#444444', bgColor: '#FFFFFF', fontWeight: '600', width: '15.42rem', left: 'center', high: '19.58rem', inputStyle: { width: '1.83rem', height: '2.17rem' } },
            agreeStyle: { fontFamily: 'PingFangSC-Regular, PingFang SC', fontSize: '1rem', fontColor: '#999999', high: '30.58rem', left: 'center', checkedButton: { width: '1.33rem', height: '1.33rem', uncheckColor: '#cccccc', checkedColor: '#1E82EB', uncheckUrl: '', checkedUrl: '' }, hrefStyle: { fontColor: '#1E82EB', agreeArr: [{name:uiCongig.setPrivacyOne[0],url:uiCongig.setPrivacyOne[1]}] } },
            tipStyle: { fontFamily: 'PingFangSC-Regular, PingFang SC', fontSize: '0.92rem', fontColor: '#999999', high: '27rem', left: 'center' },
            returnBtnStyle: { width: '0.65rem', height: '1.1rem', left: '1rem', high: '1rem', url: 'https://www.cmpassport.com/h5/js/jssdk_auth/image/returnIcon.png' },
            customControlStyle: { ifShow: 'ture', width: '120px', height: '24px', high: '450px', left: 'center', bgColor: '#fff', border: '0', borderRadius: '', url: 'https://www.baidu.com', name: '其他登录方式', fontSize: '16px', fontColor: '#392211', textAlign: 'center', textDecoration: '' }
        });
    };
    // 移动初始化
    const cmccInit = useCallback(() => {
        httpPost('', { telecomType: '1', appId, data: '' })
            .then((res) => {
                cmccResponseData = res.data;
                if(Object.keys(uiCongig)){
                    customConfigFn()
                }
            })
            .catch((err) => {
                console.log('移动初始化-初始化失败',err);
            });
    }, [appId]);
    // 联通初始化
    const cuccInit = useCallback(() => {
        httpPost('', { telecomType: '2', appId, data: '' })
            .then((res) => {
                cuccResponseData = res.data;
            })
            .catch((err) => {
                console.log('联通初始化-初始化失败');
            });
    }, [appId]);
    // 电信初始化
    const ctccInit = useCallback(() => {
        httpPost('', { telecomType: '3', appId, data: '' })
            .then((res) => {
                ctccResponseData = res.data;
                ctcc();
            })
            .catch((err) => {
                console.log('电信初始化-初始化失败', err);
            });
    }, [appId,ctcc]);
    useEffect(() => {
        cmccInit();
    }, [cmccInit]);
    useEffect(() => {
        cuccInit();
    }, [cuccInit]);
    useEffect(() => {
        ctccInit();
    }, [ctccInit]);
    return;
}
function createLayout(params, callback) {
    rootobj.render(<Main params={params} callback={callback} />);
}
function createInitLayout(params, callback) {
    rootobj = ReactDOM.createRoot(domobj);
    rootobj.render(<InitLayout params={params} callback={callback} />);
} 
function start(params, callback) {
    const result = auth(params, callback);
    if (!result) {
        return;
    }
    if(isCtcc(ctccResponseData)){
        return;
    }
    const _callback = (value) => {
        callback(value);
        destroyHandle();
    };
    createLayout(params, _callback);
}

function Init(params, callback) {
    const result = auth(params, callback);
    if (!result) {
        return;
    }
    domobj = document.createElement('div');
    document.body.appendChild(domobj);
    const _callback = (value) => {
        callback(value);
        destroyHandle();
    };
    createInitLayout(params, _callback);
}

function setUIConfig(config){
    uiCongig=config
}
const obj = { start, Init ,setUIConfig};
export default obj;
