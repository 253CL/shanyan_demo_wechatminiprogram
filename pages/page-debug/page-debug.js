const SDK = require('../../sdk/index');

// 环境配置
const ENV_CONFIG = {
  develop: {
    appId: '9IQdkCRI',
    appKey: 'CZIp8p8u',
    label: '测试环境',
  },
  trial: {
    appId: '9IQdkCRI',
    appKey: 'CZIp8p8u',
    label: '体验环境',
  },
  release: {
    appId: '',
    appKey: '',
    label: '生产环境',
  },
};

const envVersion = __wxConfig.envVersion || 'develop';
const currentConfig = ENV_CONFIG[envVersion] || ENV_CONFIG.develop;

Page({
  data: {
    statusBarHeight: 20,
    appId: currentConfig.appId,
    appKey: currentConfig.appKey,
    envLabel: currentConfig.label,
    logs: [],
    stepResults: {
      init: null,
      token: null,
      mobile: null,
    },
    currentStep: 0,
    hasResults: false,
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20,
    });
  },

  onStep1Init() {
    const { appId } = this.data;
    if (!appId) {
      this.appendToLog('请先配置 appId（见 ENV_CONFIG 环境配置）', true);
      return;
    }
    this.appendToLog('调用 SDK.init()，请求服务端获取配置信息...');
    SDK.setLog(true);
    SDK.init({ appId }, (res) => {
      this.appendToLog(`Init 回调: ${JSON.stringify(res)}`);
      if (res.code === '000000') {
        this.setData({ 'stepResults.init': res, currentStep: 1, hasResults: true });
      } else {
        this.appendToLog(`Init 失败: ${res.message}`, true);
      }
    });
  },

  onStep2Token() {
    this.appendToLog('调用 SDK.openLoginAuth()，等待拉起授权页...');
    SDK.openLoginAuth((res) => {
      this.appendToLog(`openLoginAuth 回调: ${JSON.stringify(res)}`);
      if (res.code === '200000') {
        this.setData({ 'stepResults.token': res, currentStep: 2, hasResults: true });
      } else if (res.code === '501') {
        this.appendToLog('用户取消授权（非异常）');
      } else {
        this.appendToLog(`获取 Token 失败: ${res.message}`, true);
      }
    });
  },

  onStep3Mobile() {
    const tokenResult = this.data.stepResults.token;
    if (!tokenResult || !tokenResult.token) {
      this.appendToLog('请先完成第二步获取 token', true);
      return;
    }
    const { appKey } = this.data;
    if (!appKey) {
      this.appendToLog('请先配置 appKey（见 ENV_CONFIG 环境配置）', true);
      return;
    }
    this.appendToLog('调用 SDK.getMobile()，请求服务端换取手机号...');
    this.appendToLog('⚠️ 注：生产环境建议在业务服务端调用，避免 appKey 泄露');
    SDK.getMobile({ token: tokenResult.token, appkey: appKey }, (res) => {
      this.appendToLog(`Mobile 回调: ${JSON.stringify(res)}`);
      if (res.code === '200000') {
        this.setData({ 'stepResults.mobile': res, currentStep: 3, hasResults: true });
      } else {
        this.appendToLog(`获取手机号失败: ${res.message}`, true);
      }
    });
  },

  onClearLog() {
    this.setData({ logs: [] });
  },

  appendToLog(message, isError) {
    const now = new Date();
    const time = `${this.pad(now.getHours())}:${this.pad(now.getMinutes())}:${this.pad(now.getSeconds())}`;
    const logs = [...this.data.logs, { time, message, isError: !!isError }];
    this.setData({ logs });
  },

  pad(n) {
    return n < 10 ? '0' + n : n;
  },

  onGoBack() {
    wx.navigateBack();
  },
});
