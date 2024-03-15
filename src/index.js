import './index.less';
import ReactDOM from 'react-dom/client';
import React, { useCallback, useEffect, useRef } from 'react';
import { useNotification } from 'rc-notification';
import { httpPost } from './axios';
import codeConfig from './config';
let domobj = null;
let rootobj = null;
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

const isObj = (value) => {
    return Object.prototype.toString.call(value).slice(8, -1) === 'Object';
};

const isFunction = (value) => {
    return Object.prototype.toString.call(value).slice(8, -1) === 'Function';
};

function Main({ params, callback }) {
    const [notice, contextHolder] = useNotification({ motion: noticeMotion, prefixCls: 'jm-message', maxCount: 1 });
    const appId = params.appId || '';

    //提示框
    const noticeHandle = useCallback(
        (content) => {
            notice.open({ content, duration: 2.5, closable: false, placement: 'top' });
        },
        [notice]
    );
        const _getSign=(res={})=>{
          return  httpPost('/sy/h5/init', { telecomType: '3', appId, data: res.encryValue })
        }
    const cucc = (cuccdata) => {
        window.LTRZ['getTokenInfo']({
            //1.获取置换码方法
            appKey: cuccdata.appSecret, //密钥
            authenticator: cuccdata.sign, //加密后的数据。客户设置
            ts: cuccdata.timestamp
        })
            .then((res) => {
                console.log(res, 'cuccres');
            })
            .catch((err) => {
                console.log(err, 'cuccerr');
            });
    };
    const ctcc = useCallback((ctccdata) => {
        window.fjs.getAccessCode({
            debug: true, // 非必填，布尔值，开启调试模式,调用的所有api的返回值会在客户端alert出来，在pc端打印出来。生产环境请设置为false
            btnId: 'j-get-code', //必填，“获取accessCode”按钮标签id（可参考下方html/js示例）
            appId: ctccdata.appId, //必填，开发者在注册应用的时候由天翼账号开放平台分发的接入方appId
            authDomain: '', //非必填，合作方传入域名参数
            getSignParams: function (res) {
                _getSign(res).then((data) => {
                    console.log(data,"zuihoude ");
                    window.fjs.setSign(data.data.sign);
                });
                
                //获取sign加密串的回调。
                //返回结果示例
                // {
                //   encryValue: 'xxx'
                // }
                // res.encryValue：需要被加密的字符串。
                // 接入方前端ajax把该加密字符串发送给接入方后端。接入方服务器加密该字符串，（加密详情参考3.3.1）得到并返回sign。
                // 接入方前端再调用fjs.setSign(sign) 把sign传给jssdk。（可参考下方html/js示例）
            },
            ready: function (res) {
                console.log(res, 'ctccreadyres');
                var j_get_code = document.getElementById('j-get-code');
                j_get_code.style.display = 'block';
                // 预判断成功回调，// res返回结果示例：
                //  {
                //      result: '0',
                //      msg: '预取号成功'
                //  }
                // ready回调中，接入方需要把“获取本机号码”按钮显示即可。（可参考下方html/js示例）
            },
            success: function (res) {
                console.log(res, 'ctccres');
                //成功回调。通过返回参数，请求h5codeinfo接口获取用户手机号码信息。（详情参考3.4）
                // res返回结果示例
                //  {
                //        result: '0',
                //        accessCode: 'xxx',
                //        fingerId: 'xxx',
                //        gwAuth: 'xxx',
                //        msg:"授权成功",
                //  }
            },
            error: function (err) {
                console.log(err, 'ctccerr');

                //返回预判断失败。这里由合作方处理失败后的逻辑
            }
        });
    }, []);
    const cmccAjax = useCallback((cmccdata) => {
        window.YDRZAuthLogin.getTokenInfo({
            data: {
                version: '2.0', //接口版本号 （必填）
                appId: cmccdata.appId, //应用Id （必填）
                sign: cmccdata.sign,
                traceId: cmccdata.traceId,
                timestamp: cmccdata.timestamp, //请求消息发送的系统时间，精确到毫秒，共17位，格式：20121227180001165
                openType: '1', //取号类型
                expandParams: '', //扩展参数 格式：参数名=值 多个时使用 \| 分割 （选填）
                authPageType: '0', //若值为“1”时展示弹窗，若值为“2”时展示自定义弹窗版，若值为“3”时展示自定义页面版，若为其它值则展示页面。更多说明见“2.重要参数说明”中“2.3.authPageType”
                devInfo: '', // 1：用户点击其他登录方式时回收授权弹窗，点击协议时协议内容使用iframe打开,默认不回收授权弹窗，点击协议时协议内容在一个新窗口打开
                setReturn: '' // 1：授权页面显示返回键，不传或其他值根据浏览器判断
            },
            success: function (res) {
                console.log(res, 'res',"移动的成功回调");
            },
            error: function (res) {
                console.log(res, 'error');
            },
            layerCallback: function (res) {
                //authPageType等于2时可以通过该回调方法监听，用户输入中间四位号码并勾选协议后触发
            }
        });
    }, []);
    // 移动初始化
    const cmccInit = useCallback(() => {
        httpPost('/sy/h5/init', { telecomType: '1', appId, data: '' })
            .then((res) => {
                cmccAjax(res.data);
            })
            .catch((err) => {
                console.log('初始化失败');
            });
    }, [appId, cmccAjax]);
    // 联通初始化
    const cuccInit = useCallback(() => {
        httpPost('/sy/h5/init', { telecomType: '2', appId, data: '' })
            .then((res) => {
                cucc(res.data);
            })
            .catch((err) => {
                console.log('初始化失败');
            });
    }, [appId]);
    // 电信初始化
    const ctccInit = useCallback(() => {
        httpPost('/sy/h5/init', { telecomType: '3', appId, data: '' })
            .then((res) => {
             ctcc(res.data);
            })
            .catch((err) => {
                console.log('初始化失败',err);
            });
    }, [appId, ctcc]);
    useEffect(() => {
        // cmccInit();
    }, [cmccInit]);
    useEffect(() => {
        // cuccInit();
    }, [cuccInit]);

    useEffect(() => {
        ctccInit();
    }, [ctccInit]);
    return (
        <React.Fragment>
            {contextHolder}
            <button style={{ display: 'none' }} id="j-get-code">
                电信校验本机号码
            </button>
            <div className="example">闪验h5</div>
        </React.Fragment>
    );
}

function createLayout(params, callback) {
    rootobj = ReactDOM.createRoot(domobj);
    rootobj.render(<Main params={params} callback={callback} />);
}

function createRoot(params, callback) {
    console.log('create', 'params', params);
    if (isFunction(callback) === false) {
        callback = (value) => console.log(value);
    }

    if (isObj(params) === false) {
        return callback({ code: '000500', message: '参数错误' });
    }

    if (Boolean(params.appKey) === false) {
        return callback({ code: '000510', message: 'appKey必传' });
    }

    if (Boolean(params.appId) === false) {
        return callback({ code: '000520', message: 'appId必传' });
    }

    domobj = document.createElement('div');
    domobj.classList.add('jm-layout');
    document.body.appendChild(domobj);
    createLayout(params, callback);
}

export default createRoot;
