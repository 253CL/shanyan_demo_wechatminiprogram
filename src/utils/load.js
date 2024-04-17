// SDK 文件列表
const sdkList = [
    'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js',
    'https://www.cmpassport.com/h5/js/jssdk_auth/jssdk-1.0.0.min.js',
    'https://static.e.189.cn/open/login/js/wap/js-sdk/EAccountSDK-fjs-1.5.0.min.js',
    'https://unpkg.com/axios/dist/axios.min.js',
    // 添加其他 SDK 文件的 URL
];
let flag = true;
// 动态创建 script 标签引入 SDK 文件
function loadSDK(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}


// 加载并初始化所有的 SDK
async function loadAndInitSDKs() {
    if (!flag) {
        return;
    }
    try {
        const promises = sdkList.map((url) => loadSDK(url));
        await Promise.all(promises);
        flag = false;
    } catch (error) {
        console.error('SDK 加载失败', error);
    }
}

export { loadAndInitSDKs };