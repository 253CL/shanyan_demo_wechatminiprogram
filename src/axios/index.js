import axios from 'axios';
const exampleobj = axios.create({
    withCredentials: true,
    // baseURL: 'https://api.253.com/open/i/htjc/'
    // baseURL: 'http://172.16.40.52:18080/sy/h5/init'  
    baseURL: 'http://120.253.136.198:36011/sy/h5/init'  
    // baseURL: 'flash_h5_api/sy/h5/init'  
});

// http request 拦截器
exampleobj.interceptors.request.use(
    (config) => {
        if (config.method === "post") {
            config.headers["Content-Type"] = "multipart/form-data";
          }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// http response 拦截器
exampleobj.interceptors.response.use(
    ({ data }) => {
        return Promise.resolve(data);
    },
    ({ response }) => {
        return Promise.reject(response);
    }
);

/**
 * get请求
 * @param {String} url 请求地址
 * @param {Object} params 请求参数
 */
export function httpGet(url, params) {
    return exampleobj.get(url, { params });
}

/**
 * post请求
 * @param {String} url 请求地址
 * @param {Object} params 请求参数
 */
export function httpPost(url, params) {
    return exampleobj.post(url, params);
}
