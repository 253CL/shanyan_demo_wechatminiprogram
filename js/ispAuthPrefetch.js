(function (win) {
    let baseUrl = 'https://hs.wosms.cn';
    window['LTRZ'] = {
        getTokenInfo: function (obj) {
            let that = this 
            let protrue = "true"
            let ispro = 'true'
            return new Promise(function (resolve, reject) {

                setTimeout(() => {
                    if (protrue !== 'false') {
                        ispro = 'false'
                        return false
                    }
                }, 6000)

                if (!obj.appKey) {
                    reject({
                        code: -16,
                        msg: "appKey不能为空"
                    })
                    return false;
                } else if (!obj.authenticator) {
                    reject({
                        code: -17,
                        msg: "authenticator不能为空"
                    })
                    return false;
                } else if (!obj.ts) {
                    reject({
                        code: -18,
                        msg: "ts不能为空"
                    })
                    return false;
                }
                let fp = new Fingerprint2();

                let referer = location.protocol + '//' + location.host + location.pathname,
                    origin = location.protocol + '//' + location.host;
                fp.get(function (result) {
                    $.ajax({
                        url: baseUrl + '/api/atrace/isp',
                        type: 'get',
                        // headers: {
                        // 	ref: referer,
                        // 	ori: origin
                        // },
                        data: {
                            appKey: obj.appKey,
                            authenticator: obj.authenticator,
                            ts: obj.ts,
                            bwid: result,
                            signType:obj.signType                            
                        },

                        success: function (res) {
                            if (res.code == '0000') {
                                if (ispro == 'false') {
                                    reject({
                                        code: -20,
                                        msg: '超时的错误策略'
                                    })
                                    return false;
                                }
                                // return
                                if (res.operator == "CM") {
                                    that.jsonp_mt(res.url, "a").then((obj) => {
                                        if (ispro == "false") {
                                            reject({
                                                code: -20,
                                                msg: "超时的错误策略",
                                            });
                                            return false;
                                        }
                                        //移动返回值回调
                                        $.ajax({
                                            url: res.traceCallback,
                                            type: "get",
                                            data: {
                                                traceId: obj.traceId,
                                                timestamp: obj.timestamp,
                                                resultCode: obj.resultCode,
                                                desc: obj.desc,
                                                data: obj.data,
                                            },
                                            success: function (res) {
                                                if (res.code == "0000") {
                                                    protrue = "false";
                                                    if (ispro == "false") {
                                                        reject({
                                                            code: -20,
                                                            msg: "超时的错误策略",
                                                        });
                                                        return false;
                                                    }
													resolve(res);
                                                } else {
                                                    reject({
                                                        code: res.code,
                                                        msg: res.msg,
                                                    });
                                                }
                                            },
                                            error: function (err) {
                                                console.log("取移动预授权码错误：" + err);
                                                reject(err)
                                            },
                                        });
                                    }).catch((err) => {
                                        console.log("取移动预授权码异常：" + err);
                                    });
                                } else if (res.operator == "CT") {
									that.jsonp_mt(res.url, "a").then((obj) => {
										if (ispro == "false") {
											reject({
												code: -20,
												msg: "超时的错误策略",
											});
											return false;
										}
										//电信返回值回调
										$.ajax({
											url: res.traceCallback,
											type: "get",
											data: {
												result: obj.result,
												msg: obj.msg,
												data: obj.data,
											},
											success: function (res) {
												if (res.code == "0000") {
													protrue = "false";
													if (ispro == "false") {
														reject({
															code: -20,
															msg: "超时的错误策略",
														});
														return false;
													}
													resolve(res);
												} else {
													reject({
														code: res.code,
														msg: res.msg,
													});
												}
											},
											error: function (err) {
												console.log("取电信预授权码错误："+err);
                                                reject(err)
											},
										});
									}).catch((err) => {
										console.log("取电信预授权码异常："+err);
									});
                                } else {
                                    // url为集团门户地址
                                    let url = res.url.split('&')[0];
                                    let appid = that.getUrlString(url, 'appid')
                                    that.jsonp_u(url, 'a').then(obj => {
                                        if (obj.authurl == -2) {
                                            alert('公网ip错误')
                                        }
                                        if (obj.authurl) {
                                            that.jsonp_u(obj.authurl + '/api?appid=' + appid, 'a').then(obj1 => {
                                                let err_code = ""
                                                if (obj1.err_code) {
                                                    err_code = obj1.err_code
                                                } else {
                                                    err_code = ""
                                                }
                                                if (ispro == 'false') {
                                                    reject({
                                                        code: -20,
                                                        msg: '超时的错误策略'
                                                    })
                                                    return
                                                }
                                                $.ajax({
                                                    url: window.atob(res.url.split('&ret_url=')[1]),
                                                    type: 'get',
                                                    data: {
                                                        // appKey: obj.appKey,
                                                        // authenticator: obj.authenticator,
                                                        ts: obj.ts,
                                                        code: obj1.code,
                                                        province: obj1.province,
                                                        err_code: err_code
                                                    },
                                                    success: function (res) {
                                                        resolve(res)
                                                        if (res.code == '0000') {
                                                            protrue = 'false'
                                                            if (ispro == 'false') {
                                                                reject({
                                                                    code: -20,
                                                                    msg: '超时的错误策略'
                                                                })
                                                                return false
                                                            }
                                                            resolve(res)
                                                        } else {
                                                            reject({
                                                                code: res.code,
                                                                msg: res.msg
                                                            })
                                                        }
                                                    },
                                                    error: function (err) {
                                                        // console.log(err);
                                                        reject(err)
                                                    }
                                                })
                                            }).catch(err => {
                                                // console.log(err);
                                            })
                                        } else {
                                            reject(obj)
                                        }
                                    }).catch(err => {
                                        // console.log(err);
                                    })
                                }
                            } else {
                                reject(res)
                            }
                        },
                        error: function (err) {
                            // console.log(err);
                            reject(err)
                        }
                    })
                })
            })
        },
        jsonp_u: function (url, callback) {
            return new Promise((resolve) => {
                var script = document.createElement('script');
                url += `&callback=${callback}`;
                script.src = url;
                window[callback] = function (data) {
                    resolve(data)
                };
                document.body.insertBefore(script, document.body.firstChild)
            })
        },
        jsonp_mt: function (url, callback) {
            return new Promise((resolve) => {
                var script = document.createElement("script");
                script.src = url;
                window[callback] = function (data) {
                    resolve(data);
                };
                document.body.insertBefore(script, document.body.firstChild);
            });
        },
        getUrlString: function (url, name) {
            let str = url.split('?')[1]
            var vars = str.split("&");
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                if (pair[0] == name) {
                    return pair[1];
                }
            }
        },
    }
}(window))