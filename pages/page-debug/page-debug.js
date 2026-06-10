const SDK = require('shanyan-miniprogram-sdk');
const demoUtils = require('../../demo-utils');
const dlog = require('../../demo-log');
const app = getApp();

const appId = app.globalData.appId;
const appKey = app.globalData.appKey;

// 手机号查询接口地址（demo 层独立定义）
// 注意：此接口已从 SDK 配置中移除，现由 demo 层自行管理
const MOBILE_QUERY_URLS = {
  stable: 'https://110.cm253.com:8445/open/web/wxprog-mobile-query',
  release: 'https://api.253.com/open/web/wxprog-mobile-query',
};

/**
 * 调试模式页 - 分步测试 SDK 完整流程
 *
 * 【业务流程】
 * 该页面提供三个独立的操作按钮，用户按顺序点击来测试 SDK 的完整功能链路：
 *
 * 步骤 1 - 初始化（SDK.init）
 *   - 调用 SDK.init({ appId }, callback)
 *   - 请求服务端获取运营商（移动/联通/电信）的取号参数
 *   - 成功返回 traceId，保存为后续取号凭证
 *
 * 步骤 2 - 拉起授权页获取 token（SDK.openLoginAuth）
 *   - 需步骤 1 成功才能调用
 *   - 拉起运营商授权页，展示手机号，用户点击确认
 *   - 返回加密后的 token（格式：A1/A2/A3-{base64密文}）
 *   - **token 一次有效**：拿到新 token 后自动清除步骤 3 的结果
 *
 * 步骤 3 - 换取手机号（getMobile）
 *   - 需步骤 2 成功并获得 token 才能调用
 *   - 将加密 token 发送到服务端，服务端返回加密手机号
 *   - 用 appKey 通过 AES-CBC 解密手机号
 *   - **token 失效后无法重用**：需重新执行步骤 2
 *
 * 【错误处理】
 * - 所有网络请求、加密解密操作均包裹 try-catch
 * - 异常时输出详细日志但不崩溃小程序
 * - 用户可点击"清空日志"重置调试状态
 *
 * 【日志系统】
 * - 主日志：页面上展示，包含时间戳和错误标记
 * - 详细日志：通过 demo-log 输出到控制台（需 app.globalData.demoLogEnabled=true）
 */
Page({
  data: {
    statusBarHeight: 20,
    appId: app.globalData.appId,
    envLabel: app.globalData.envLabel,
    logs: [],
    // 三个步骤的执行结果，每步成功时保存响应数据
    stepResults: {
      init: null,       // 步骤 1 的结果（含 traceId）
      token: null,      // 步骤 2 的结果（含加密 token）
      mobile: null,     // 步骤 3 的结果（含解密手机号）
    },
    currentStep: 0,     // 当前已完成的步骤（0/1/2/3）
    hasResults: false,  // 是否有任何步骤完成过
  },

  /**
   * 页面加载时触发
   * 获取状态栏高度用于兼容不同设备的刘海屏等
   */
  onLoad() {
    try {
      const windowInfo = wx.getWindowInfo();
      this.setData({
        statusBarHeight: windowInfo.statusBarHeight || 20,
      });
    } catch (e) {
      this.setData({
        statusBarHeight: 20,
      });
    }
  },

  /**
   * 步骤 1：初始化 SDK
   *
   * 【流程】
   * 1. 开启 SDK 日志输出（便于调试）
   * 2. 调用 SDK.init({ appId }, callback)
   * 3. 等待服务端响应（获取运营商参数）
   * 4. 成功时保存 traceId，解锁步骤 2
   *
   * 【预期响应】
   * - code='200000'：初始化成功，包含 traceId
   * - code!=200000：初始化失败，显示错误信息
   */
  onStep1Init() {
    this.appendToLog('调用 SDK.init()，请求服务端获取配置信息...');
    SDK.init({ appId }, (res) => {
      this.appendToLog(`Init 回调: ${JSON.stringify(res)}`);
      if (res.code === '200000') {
        this.setData({ 'stepResults.init': res, currentStep: 1, hasResults: true });
      } else {
        this.appendToLog(`Init 失败: ${res.message}`, true);
      }
    });
  },

  /**
   * 步骤 2：拉起授权页获取加密 token
   *
   * 【前置条件】
   * - 步骤 1 必须成功，且 initState === 'success'
   * - 否则 openLoginAuth 会内部自动重试初始化
   *
   * 【流程】
   * 1. 调用 SDK.openLoginAuth(callback)
   * 2. SDK 拉起运营商授权页（底部弹窗或全屏）
   * 3. 用户确认授权 → 返回加密 token
   * 4. 用户取消授权 → 返回 code='501'（非异常）
   *
   * 【重要】
   * - token 格式：A1/A2/A3-{base64密文}（A1=移动, A2=联通, A3=电信）
   * - token 仅可使用一次
   * - 拿到新 token 后自动清除步骤 3 结果（旧 token 失效）
   */
  onStep2Token() {
    this.appendToLog('调用 SDK.openLoginAuth()，等待拉起授权页...');
    SDK.openLoginAuth((res) => {
      this.appendToLog(`openLoginAuth 回调: ${JSON.stringify(res)}`);
      if (res.code === '200000') {
        // token 一次有效：拿到新 token 后清除第三步结果（旧 token 失效）
        this.setData({ 'stepResults.token': res, 'stepResults.mobile': null, currentStep: 2, hasResults: true });
      } else if (res.code === '501') {
        // 用户主动取消授权，非异常情况
        this.appendToLog('用户取消授权（非异常）');
      } else {
        this.appendToLog(`获取 Token 失败: ${res.message}`, true);
      }
    });
  },

  /**
   * 步骤 3：用 token 换取手机号
   *
   * 【接口定义】
   * - URL：MOBILE_QUERY_URLS[env]
   * - Method：POST
   * - Content-Type：application/x-www-form-urlencoded
   * - 入参：appId, sign(HMAC-SHA256), token
   *
   * 【签名规则】
   * sign = HMAC-SHA256(
   *   按字母顺序拼接: appId{值} + token{值},
   *   密钥: appKey
   * )
   *
   * 【成功响应】
   * code='200000' 时：
   * - data.data.mobile 为 AES-CBC 加密的手机号
   * - 用 appKey 作为密钥解密（前 16 位作 key，后 16 位作 iv）
   *
   * 【限制】
   * - token 一次有效，本步骤完成后 token 失效
   * - 若步骤 3 已完成则不可重复点击，需重新执行步骤 2 获取新 token
   *
   * 【异常处理】
   * - token 为空或已失效 → 显示错误提示
   * - 签名计算失败 → 显示异常信息
   * - 服务端返回错误 → 显示 message 或 code
   * - 解密失败 → 显示解密异常
   */
  onStep3Mobile() {
    const tokenResult = this.data.stepResults.token;
    if (!tokenResult || !tokenResult.token) {
      this.appendToLog('请先完成第二步获取 token', true);
      return;
    }
    // token 一次有效，第三步已完成后不可重复点击
    if (this.data.stepResults.mobile) {
      this.appendToLog('token 已失效（一次有效），请重试第二步', true);
      return;
    }
    this.appendToLog('调用 getMobile()，请求服务端换取手机号...');

    const token = tokenResult.token;
    let sign;
    try {
      // 按 appId, token 的字母顺序签名
      sign = demoUtils.hmacSHA256Sign({ appId, token }, appKey);
    } catch (e) {
      this.appendToLog(`签名计算异常: ${e.message}`, true);
      return;
    }
    const formData = `appId=${encodeURIComponent(appId)}&sign=${encodeURIComponent(sign)}&token=${encodeURIComponent(token)}`;
    const envLabel = app.globalData.envLabel;
    const mobileUrl = envLabel && envLabel.indexOf('stable') !== -1 ? MOBILE_QUERY_URLS.stable : MOBILE_QUERY_URLS.release;

    // 打印请求信息（仅当 demoLogEnabled=true 时显示）
    dlog.log('[page-debug getMobile] 请求 URL:', mobileUrl);
    dlog.log('[page-debug getMobile] 请求入参:', formData);

    wx.request({
      url: mobileUrl,
      method: 'POST',
      data: formData,
      header: { 'Content-Type': 'application/x-www-form-urlencoded' },
      success: (res) => {
        try {
          // 打印响应信息
          dlog.log('[page-debug getMobile] HTTP 状态码:', res.statusCode);
          dlog.log('[page-debug getMobile] 响应数据:', JSON.stringify(res.data));

          if (!res.data) {
            this.appendToLog('服务端返回为空', true);
            return;
          }
          if (typeof res.data === 'object' && res.data.code === '200000') {
            try {
              const encryptedMobile = res.data.data && res.data.data.mobile;
              if (!encryptedMobile) {
                this.appendToLog('服务端返回的手机号为空', true);
                return;
              }
              // 使用 appKey 解密手机号
              const phone = demoUtils.aesDecrypt(encryptedMobile, appKey);
              if (!phone) {
                this.appendToLog('手机号解密返回为空', true);
                return;
              }
              dlog.log('[page-debug getMobile] 解密手机号:', phone);
              this.setData({ 'stepResults.mobile': { code: '200000', message: '获取成功', phone }, currentStep: 3, hasResults: true });
              this.appendToLog(`获取手机号成功: ${phone}`);
            } catch (e) {
              this.appendToLog(`手机号解密失败: ${e.message}`, true);
            }
          } else {
            const failMsg = res.data && typeof res.data === 'object'
              ? (res.data.message || res.data.code || '未知错误')
              : JSON.stringify(res.data);
            this.appendToLog(`获取手机号失败: ${failMsg}`, true);
          }
        } catch (e) {
          this.appendToLog(`获取手机号响应处理异常: ${e.message}`, true);
        }
      },
      fail: (err) => {
        dlog.error('[page-debug getMobile] 请求失败:', JSON.stringify(err));
        this.appendToLog(`请求失败: ${err.errMsg}`, true);
      }
    });
  },

  /**
   * 清空所有日志
   * 用户点击"清空日志"按钮时调用
   */
  onClearLog() {
    this.setData({ logs: [] });
  },

  /**
   * 追加日志到日志列表
   *
   * @param {string} message - 日志文本
   * @param {boolean} isError - 是否为错误日志（true 时高亮显示）
   *
   * 【日志格式】
   * 日志自动带时间戳，格式为 HH:mm:ss
   * 错误日志会被标记，在 UI 中展示为红色
   */
  appendToLog(message, isError) {
    const now = new Date();
    const time = `${this.pad(now.getHours())}:${this.pad(now.getMinutes())}:${this.pad(now.getSeconds())}`;
    const logs = [...this.data.logs, { time, message, isError: !!isError }];
    this.setData({ logs });
  },

  /**
   * 数字补零工具函数
   * @param {number} n - 原始数字
   * @returns {string} 不足两位时补零
   */
  pad(n) {
    return n < 10 ? '0' + n : n;
  },

  /**
   * 返回上一页
   */
  onGoBack() {
    wx.navigateBack();
  },
});
