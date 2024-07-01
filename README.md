shanyanh5
## 打包上线
### 测试环境
1. 将src\axios\index.js 中
`const exampleobj = axios.create({
    withCredentials: true,
    timeout:5000,
    // baseURL: 'https://api.253.com/open/i/htjc/'
    // baseURL: 'http://172.16.40.52:18080/sy/h5/init'  
    // baseURL: 'http://120.253.136.198:36011/sy/h5/init'  
    // baseURL: 'https://sy.cl2m.cn/sy/h5/init'  //生产
    // baseURL: 'flash_h5_api/sy/h5/init' // 测试环境
});
`
改为
`const exampleobj = axios.create({
    withCredentials: true,
    timeout:5000,
    // baseURL: 'https://api.253.com/open/i/htjc/'
    // baseURL: 'http://172.16.40.52:18080/sy/h5/init'  
    // baseURL: 'http://120.253.136.198:36011/sy/h5/init'  
    // baseURL: 'https://sy.cl2m.cn/sy/h5/init'  //生产
    baseURL: 'flash_h5_api/sy/h5/init' // 测试环境
});
`
2. 将src\index.js中

1....
// 生产与本地
const _getSign = useCallback((res = {}) => {
        return httpPost('https://sy.cl2m.cn/sy/h5/init', { appId, data: res.encryValue });
    }, []);`
`
改为
// 测试
`
const _getSign = useCallback((res = {}) => {
    return httpPost('', { appId, data: res.encryValue });
        // return httpPost('https://sy.cl2m.cn/sy/h5/init', { appId, data: res.encryValue });
    }, []);`
`
2....
`
    // const response = await httpPost("", { appId, data: '' });
    const response = await httpPost(`https://${backupDomains[currentDomainIndex]}/sy/h5/init`, { appId, data: '' });
`

3. 涉及到index.html 的地方
<script src="js/umd/shanyan2.0.0.2.js"></script> // 测试与本地开发
<!-- <script src="oss地址"></script> --> // 生产