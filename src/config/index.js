const codeConfig = {
    200: {
        explain: '活体检测通过',
        resultExplain: ''
    },
    202: {
        explain: '活体检测未通过',
        resultExplain: '1.检测到摄像头视频劫持攻击。2.在视频中用户做出的动作不符合给定的序列。3.人脸未通过活体判断'
    },
    201: {
        explain: '未查询到检测结果',
        resultExplain: ''
    },
    203: {
        explain: '活体检测失败',
        resultExplain: '1.浏览器缺少进行活体采集的特性或出现软硬件故障。2.用户拒绝进行活体采集，例如摄像头权限被禁止。3.动作参数错误。4.其它错误'
    },
    301: {
        explain: 'token已过期',
        resultExplain: '指初始化之后未在10分钟内获取结果'
    }
};

export default codeConfig;
