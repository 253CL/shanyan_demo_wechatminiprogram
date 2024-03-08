import './index.less';
import ReactDOM from 'react-dom/client';
import React, { useCallback, useEffect } from 'react';
import { useNotification } from 'rc-notification';
import { httpPost } from './axios';
import codeConfig from './config';
let domobj = null;
let rootobj = null;
const lightColors = ['#FFFFFF', '#FFD9E3', '#D8D6FF', '#CFF9FF', '#FFCEFD', '#D8FFCD', '#FFF4CB']; // 亮色数组
const darkColors = ['#000000', '#3B3C04', '#183C03', '#063C28', '#063C3A', '#060D3C', '#3C0636']; // 暗色数组
const actionsArr = ['LookFront', 'LookLeft', 'LookRight', 'LookUp', 'LookDown']; //, 'OpenMouth', 'ShakeHead', 'BlinkEye','Nodhead''
console.log('actionsArr', actionsArr);
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
    const appKey = params.appKey || '';
    const appId = params.appId || '';

    //提示框
    const noticeHandle = useCallback(
        (content) => {
            notice.open({ content, duration: 2.5, closable: false, placement: 'top' });
        },
        [notice]
    );

    function actionclick(type) {
        const colors = type === 1 || type === 3 ? lightColors.concat(darkColors).join(',') : '';
        const actions = type === 1 || type === 2 ? actionsArr.join(',') : '';
        beginHandle({ actions, colors });
    }
    function beginHandle({ colors = '', actions = '' }) {
        const returnUrl = window.location.href;
        const params = { appId, appKey, returnUrl, colors, actions };
        let formData = new FormData();
        for (let key in params) {
            formData.append(key, params[key]);
        }
        const url = 'glare-life-check-init';
        httpPost(url, formData)
            .then(function (response) {
                const { data, code, message } = response || {};
                if (code !== '200000') return noticeHandle(message);
                if (!data.token) return noticeHandle(data.resMsg);
                window.location.href = `https://api-h5.jumdata.com/lifecheck/v2/check/index?token=${data.token}`;
            })
            .catch((error) => {
                console.log(error);
            });
    }
    const clearURLParams = () => {
        const newURL = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newURL);
    };
    const codeMapJsx = (code) => {
        if (codeConfig[code]) {
            const { explain, resultExplain } = codeConfig[code];
            return (
                <div>
                    {explain && <h1>{explain}</h1>}
                    {resultExplain && resultExplain.split('。').map((item, index) => <p key={index}>{item.trim()}</p>)}
                </div>
            );
        } else {
            return null;
        }
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const params = { token, appId, appKey };
        let formData = new FormData();
        for (let key in params) {
            formData.append(key, params[key]);
        }
        clearURLParams();
        if (!token) return;
        httpPost('glare-life-check-result', formData)
            .then(function (response) {
                const { data, code, message } = response || {};
                code !== '200000' ? noticeHandle(message) : noticeHandle(codeMapJsx(data.resCode));
            })
            .catch((error) => {
                console.log(error);
            });
    }, [appId, appKey, noticeHandle]);
    return (
        <React.Fragment>
            {contextHolder}
            <div className="example">
                <h3 onClick={() => actionclick(1)}>动态炫光活体（闪光+动作）</h3>
                <h3 onClick={() => actionclick(2)}>动态炫光检测（动作）</h3>
                <h3 onClick={() => actionclick(3)}>动态炫光检测（闪光）</h3>
            </div>
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
