import './index.less';
import ReactDOM from 'react-dom/client';
import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { httpPost } from './axios';
import { NumberKeyboard, PasscodeInput, Radio, Dialog } from 'antd-mobile';
import { useNotification } from 'rc-notification';
import {  cryptographicToken, auth, checkKeysExist, dynamicType, customModalConfigFn, customConfigFn } from './utils/index';
import { loadAndInitSDKs } from './utils/load';

let domobj = null;
let rootobj = null;
let cuccResponseData = {};
let cmccResponseData = {};
let ctccResponseData = {};
let uiCongig = {};
let ctccFlag = false;
let ctccFinish = false;
const noticeMotion = {
    motionName: 'jm-message-fade',
    motionAppear: true,
    motionEnter: true,
    motionLeave: true,
    onLeaveStart: (ele) => {
        const { offsetHeight } = ele;
        return { height: offsetHeight };
    },
    onLeaveActive: () => ({ height: 0, opacity: 0, margin: 0 })
};
let appId;
const destroyHandle = () => {
    uiCongig = {};
    setTimeout(() => {
        if (rootobj) {
            rootobj.unmount();
            rootobj = null;
        }
        if (domobj) {
            document.body.removeChild(domobj);
            domobj = null;
        }
    }, 0);
};

function Main({ params, callback }) {
    const [notice, contextHolder] = useNotification({ motion: noticeMotion, prefixCls: 'jm-message', maxCount: 1 });
    const [cuccView, setCuccView] = useState(false);
    const [cuccDialogView, setcuccDialogView] = useState(false)
    const [cuccPhoneNumber, setCuccPhoneNumber] = useState('');
    const [_cuccResponseData, setCuccResponseData] = useState({});
    const [checked, setchecked] = useState(false);
    const [callResult, setCallResult] = useState([]);
    const ref = useRef();
    const cuccCancel = () => {
        setCuccView(false);
        setcuccDialogView(false);
        destroyHandle();
    };
    const radioChange = () => {
        setchecked(!checked);
    };
    //提示框
    const noticeHandle = useCallback(
        (content) => {
            notice.open({ content, duration: 2.5, closable: false, placement: 'top' });
        },
        [notice]
    );
    const cuccAuthorization = () => {
        if (uiCongig.setPageType) {
            setcuccDialogView(true);
        } else {
            domobj.classList.add('jm-layout');
            setCuccView(true);
        }
    }
    const cucc = useCallback(() => {
        window.LTRZ['getTokenInfo']({
            //1.获取置换码方法
            appKey: cuccResponseData.appSecret, //密钥
            authenticator: cuccResponseData.sign, //加密后的数据。客户设置
            ts: cuccResponseData.timestamp
        })
            .then((res) => {
                cuccAuthorization();
                setCuccResponseData(res);
            })
            .catch((err) => {
                console.log("cuccerr",err);
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
                authPageType: dynamicType(uiCongig), //若值为“1”时展示弹窗，若值为“2”时展示自定义弹窗版，若值为“3”时展示自定义页面版，若为其它值则展示页面。更多说明见“2.重要参数说明”中“2.3.authPageType”
                devInfo: '', // 1：用户点击其他登录方式时回收授权弹窗，点击协议时协议内容使用iframe打开,默认不回收授权弹窗，点击协议时协议内容在一个新窗口打开
                setReturn: '' // 1：授权页面显示返回键，不传或其他值根据浏览器判断
            },
            success: function (res) {
                // 移动弹窗版本 默认会直接 success 需要判断 是否是授权了的
                if (!uiCongig.setPageType || (uiCongig.setPageType && res.token)) {
                    const token = cryptographicToken('A1', res, appId);
                    callback({ code: '200000', message: '授权成功' ,token})
                    // replacementPhoneNumber(token, appId, appKey, callback);
                }
            },
            error: function (err) {
                console.log("cmccerr",err);
                setCallResult((pre) => [...pre, { err, time: new Date().getTime() }]);
            },
            layerCallback: function (res) {
                //authPageType等于2时可以通过该回调方法监听，用户输入中间四位号码并勾选协议后触发
            }
        });
    }, [ callback]);

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
    const handleProtocolClick = () => {
        const url = uiCongig?.setPrivacyOne?.[1] ? uiCongig?.setPrivacyOne[1] : 'https://auth.wosms.cn/html/oauth/protocol2.html';
        window.location.href = url;
    };
    const handleProtocolClicktwo = () => {
        const url = uiCongig?.setPrivacyTwo?.[1] ? uiCongig?.setPrivacyTwo[1] : 'https://auth.wosms.cn/html/oauth/protocol2.html';
        window.location.href = url;
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
            const data = { ...cuccResponseData, userInformation: `${firstThree}${cuccPhoneNumber}${lastFour}`, accessCode: _cuccResponseData.accessCode };
            const token = cryptographicToken('A2', data, appId);
            callback({ code: '200000', message: '授权成功' ,token})
            // replacementPhoneNumber(token, appId, appKey, callback);
        }
    }, [_cuccResponseData.accessCode, callback, checked, cuccPhoneNumber, firstThree, lastFour]);
    useEffect(() => {
        if (cuccPhoneNumber.length === 4 && !checked) {
            noticeHandle('请勾选同意服务条款');
        }
    }, [checked, cuccPhoneNumber.length, noticeHandle]);
    useEffect(() => {
        cucc();
    }, [cucc]);
    useEffect(() => {
        cmcc();
    }, [cmcc]);

    return (
        <React.Fragment>
            {contextHolder}
            {cuccView && (
                <div>
                    <div className="top">
                        <img className="cancel" onClick={cuccCancel} src="https://static2.253.com/wanshu/shanyanh5/left.png" alt="返回按钮"></img>
                        <p className="top-title">{uiCongig.setLoginTitle || '本机号码登录'}</p>
                    </div>
                    <div className="content">
                        <div className="image">
                            <img alt="" src={uiCongig.setLoginLogo || 'https://static2.253.com/wanshu/shanyanh5/liantong.png'}></img>
                        </div>
                        <p className="title">请填写完整号码并授权使用此号码</p>
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
                            {uiCongig.setPrivacyOne?.[0] && (
                                <span onClick={handleProtocolClick} className="protocol">
                                    {uiCongig.setPrivacyOne?.[0] || '《中国联通认证服务协议》'}
                                </span>
                            )}
                            {uiCongig.setPrivacyTwo?.[0] && (
                                <span onClick={handleProtocolClicktwo} className="protocol">
                                    {uiCongig.setPrivacyTwo?.[0] || '《中国联通认证服务协议》'}
                                </span>
                            )}
                            <span onClick={() => window.location.href = "https://auth.wosms.cn/html/oauth/protocol2.html"} className="protocol">
                                《中国联通认证服务协议》
                            </span>
                            <span>并使用本机号码登录</span>
                        </div>

                    </div>
                </div>
            )}
            <NumberKeyboard getContainer={null} visible={cuccView || cuccDialogView} showCloseButton={false} onInput={(e) => numberKeyboardChange(e)} onDelete={numberKeyboardDelete} />
            <div ref={ref} className="cucc-modal"></div>
            <Dialog
                style={{ width: "80vw" }}
                getContainer={ref.current}
                visible={cuccDialogView}
                content={
                    <div className="content">
                        <img className="cancelImg" src="https://static2.253.com/wanshu/shanyanh5/delect_iocn.png" alt="" onClick={cuccCancel}></img>
                        <div className="image">
                            <img alt="" src={uiCongig.setLoginLogo || 'https://static2.253.com/wanshu/shanyanh5/liantong.png'}></img>
                        </div>
                        <p className="title">请填写完整号码并授权使用此号码</p>
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
                            {uiCongig.setPrivacyOne?.[0] && (
                                <span onClick={handleProtocolClick} className="protocol">
                                    {uiCongig.setPrivacyOne?.[0] || '《中国联通认证服务协议》'}
                                </span>
                            )}
                            {uiCongig.setPrivacyTwo?.[0] && (
                                <span onClick={handleProtocolClicktwo} className="protocol">
                                    {uiCongig.setPrivacyTwo?.[0] || '《中国联通认证服务协议》'}
                                </span>
                            )}
                            <span onClick={() => window.location.href = "https://auth.wosms.cn/html/oauth/protocol2.html"} className="protocol">
                                《中国联通认证服务协议》
                            </span>
                            <span>并使用本机号码登录</span>
                        </div>
                    </div>
                }
            />
        </React.Fragment>
    );
}
function InitLayout({ params, callback }) {
    appId = params.appId || '';
    const _getSign = useCallback(
        (res = {}) => {
            return httpPost('', { appId, data: res.encryValue });
        },
        []
    );
    const ctcc = useCallback(() => {
        ctccFinish = false;
        window.fjs?.getAccessCode({
            debug: false, // 非必填，布尔值，开启调试模式,调用的所有api的返回值会在客户端alert出来，在pc端打印出来。生产环境请设置为false
            btnId: 'j-get-code', //必填，“获取accessCode”按钮标签id（可参考下方html/js示例）
            appId: ctccResponseData.appId, //必填，开发者在注册应用的时候由天翼账号开放平台分发的接入方appId
            authDomain: '', //非必填，合作方传入域名参数
            getSignParams: function (res) {
                _getSign(res).then((data) => {
                    window.fjs.setSign(data.data.ctccSign);
                });
            },
            ready: function (res) {
                ctccFinish = true;
                ctccFlag = true;
            },
            success: function (res) {
                const token = cryptographicToken('A3', res, appId);
                callback({ code: '200000', message: '授权成功' ,token})
                // replacementPhoneNumber(token, appId, appKey, callback);
            },
            error: function (err) {
                console.log("ctccerr",err);
                ctccFinish = true;
                // callback(err)
            }
        });
    }, [_getSign, callback]);
    const initAjax = useCallback(() => {
        httpPost('', { appId, data: '' })
            .then(({ data, retCode, retMsg }) => {
                if (retCode === '0') {
                    const { cuccAppId, cuccSign, ctccAppId, ctccSign, cmccAppId, cmccSign, traceId, cmccTimestamp, cuccTimestamp } = data;
                    cuccResponseData = { appSecret: cuccAppId, sign: cuccSign, timestamp: cuccTimestamp };
                    ctccResponseData = { appId: ctccAppId, sign: ctccSign };
                    cmccResponseData = { appId: cmccAppId, sign: cmccSign, traceId, timestamp: cmccTimestamp };
                    ctcc();
                    callback({ code: '000000', message: '初始化成功' });
                } else {
                    callback({ code: '000400', message: retMsg });
                }
            })
            .catch((err) => {
                callback({ code: '000400', message: '初始化失败' });
            });
    }, [ callback, ctcc]);

    useEffect(() => {
        initAjax();
    }, [initAjax]);

    return;
}
function createLayout(params, callback) {
    if (!domobj) {
        domobj = document.createElement('div');
        document.body.appendChild(domobj);
    }
    if (!rootobj) {
        rootobj = ReactDOM.createRoot(domobj);
    }

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
    if (ctccFlag) {
        return;
    }
    if (!ctccFinish) {
        return callback('请稍后再试');
    }
    const _callBack = (value) => {
        callback(value);
        destroyHandle();
    };
    createLayout(params, _callBack);
}

async function Init(params, callback) {
    const result = auth(params, callback);
    if (!result) {
        return;
    }
    try {
        await loadAndInitSDKs();
        domobj = document.createElement('div');
        document.body.appendChild(domobj);
        const _callBack = (value) => {
            callback(value);
        };
        createInitLayout(params, _callBack);
    } catch (error) {
        callback({ code: '000600', message: "SDK 加载或初始化失败" });
    }
}

function setUIConfig(config, callback) {
    uiCongig = config;
    if (uiCongig.setPrivacyOne?.[0].length > 20 || uiCongig.setPrivacyTwo?.[0].length > 20) {
        return callback({ code: '000500', message: "协议长度不能超过20" });
    }
    if (uiCongig.setPageType) {
        customModalConfigFn(uiCongig);
    } else {
        if (checkKeysExist(config)) {
            customConfigFn(uiCongig);
        }
    }
    
    return callback({ code: '000700', message: "自定义配置成功" });
}
const obj = { start, Init, setUIConfig };
export default obj;
