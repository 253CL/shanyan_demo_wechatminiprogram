/**
 * 授权页 UI 预设配置库
 *
 * 【说明】
 * 提供多种底部授权弹窗的预设样式配置。开发者可以：
 * 1. 直接使用预设样式（开箱即用）
 * 2. 基于预设样式进行微调（复制后修改特定字段）
 * 3. 组合不同预设的部分配置（mix and match）
 *
 * 【应用】
 * 所有配置对应微信一键登录插件文档的自定义弹窗配置（authPageType='5'）。
 * SDK 内部将这些配置通过 option 参数传递给插件。
 *
 * 【样式配置结构】
 * 每个配置包含以下主要部分：
 * - maskStyle：蒙层（遮罩）配置
 * - layerStyle：弹窗容器配置
 * - phoneStyle：手机号显示配置
 * - authTipStyle：授权提示栏配置
 * - tipStyle：其他提示信息配置
 * - cancleBtnStyle：取消按钮配置
 * - sureBtnStyle：确认按钮配置
 * - agreeLineStyle：协议条款栏配置
 * - checkBtnStyle：协议勾选框配置
 * - agreeStyle：协议链接配置
 * - customControlStyle：自定义控件配置（数组）
 *
 * 【使用示例】
 * const { getBottomPopupOption } = require('../../ui-presets');
 * SDK.openLoginAuth({
 *   option: getBottomPopupOption(),  // 使用预设样式
 * }, (res) => {
 *   if (res.code === '200000') {
 *     console.log('token:', res.token);
 *   }
 * });
 */

/**
 * 预设 1：底部弹窗样式（标准版）
 *
 * 【特点】
 * - 圆角底部弹窗（类 iOS 风格）
 * - 双按钮布局（取消 + 确认）
 * - 完整功能（含协议栏、自定义控件）
 * - 高度 639rpx，适合大多数手机
 *
 * 【UI 构成】
 * 上：Logo + 提示文案
 * 中：手机号显示 + 协议栏 + 自定义控件
 * 下：取消按钮 | 确认按钮
 *
 * @returns {Object} UI 配置对象
 */
function getBottomPopupOption() {
  return {
    // === 蒙层 maskStyle ===
    // 蒙层是弹窗后面的半透明背景
    maskStyle: {
      'ifShowMask': true,      // 是否显示蒙层（Boolean，默认 true）
      'bgColor': 'rgba(0,0,0,0.5)', // 蒙层背景颜色（RGBA 格式）
      'opacity': '0.5'         // 蒙层透明度（0-1）
    },
    // === 弹窗 layerStyle ===
    // 弹窗容器的布局和外观
    layerStyle: {
      'height': '639rpx',      // 弹窗高度（rpx 为微信小程序的相对单位）
      'radius': '40rpx 80rpx 0px 0px', // 圆角半径（上左 上右 下右 下左）
      'bgColor': 'rgba(255, 255, 255, 1)' // 弹窗背景颜色
    },
    // === 号码栏 phoneStyle ===
    // 显示用户手机号的区域
    phoneStyle: {
      'fontFamily': '',        // 号码栏字体（空=系统默认）
      'fontColor': 'rgba(153, 15, 153, 1)', // 号码栏字体颜色（紫色）
      'fontSize': '52rpx',     // 号码栏字体大小（较大，易读）
      'top': '180rpx',         // 号码栏距离弹窗上边的距离
      'left': 'center'         // 号码栏水平位置（center=居中）
    },
    // === 授权栏 authTipStyle ===
    // 授权确认提示（如"×××号码已认证"）
    authTipStyle: {
      'ifShow': false,          // 是否展示授权栏（本预设关闭）
    },
    // === 提示栏 tipStyle ===
    // 其他提示文案
    tipStyle: {
      'fontFamily': '24',        // 提示栏字体大小
      'fontColor': 'rgba(13, 153, 53, 1)', // 提示栏字体颜色（绿色）
      'fontSize': '22rpx',     // 提示栏字体大小
      'top': '250rpx'          // 提示栏距离弹窗上边的距离
    },
    // === 取消授权按钮 cancleBtnStyle ===
    // 左侧按钮，用户点击取消授权
    cancleBtnStyle: {
      'text': '取消授权',      // 按钮文案（限 6 字以内）
      'textAlign': '',         // 文本对齐方式（center/left/right，空=默认）
      'fontFamily': '',        // 按钮字体
      'fontColor': 'rgba(53, 134, 241, 1)', // 按钮字体颜色（蓝色）
      'fontSize': '32rpx',     // 按钮字体大小
      'top': '323rpx',         // 按钮距离弹窗上边的距离
      'left': '96rpx',         // 按钮距离弹窗左边的距离
      'width': '224rpx',       // 按钮宽度
      'height': '90rpx',       // 按钮高度
      'bgColor': '#FFFFFF',    // 按钮背景颜色（白色）
      'radius': '45rpx',       // 按钮圆角半径（椭圆按钮）
      'borderColor': 'rgba(53, 134, 241, 1)', // 按钮边框颜色（蓝色）
      'borderWidth': '2rpx'    // 按钮边框线宽
    },
    // === 登录授权按钮 sureBtnStyle ===
    // 右侧按钮，用户点击确认授权
    sureBtnStyle: {
      'text': '确认登录',      // 按钮文案（默认"授权登录"）
      'textAlign': 'center',   // 文本对齐方式（居中）
      'fontFamily': '',        // 按钮字体
      'fontColor': '#FFFFFF',  // 按钮字体颜色（白色）
      'fontSize': '32rpx',     // 按钮字体大小
      'top': '323rpx',         // 按钮距离弹窗上边的距离
      'left': '404rpx',        // 按钮距离弹窗左边的距离
      'width': '270rpx',       // 按钮宽度
      'height': '90rpx',       // 按钮高度
      'bgColor': 'rgba(3, 134, 41, 1)', // 按钮背景颜色（绿色）
      'radius': '45rpx',       // 按钮圆角半径
      'borderColor': 'rgba(3, 134, 41, 1)', // 按钮边框颜色（绿色）
      'borderWidth': '2rpx'    // 按钮边框线宽
    },
    // === 协议栏 agreeLineStyle ===
    // 协议文本和勾选框的容器
    agreeLineStyle: {
      'textAlign': 'left',     // 协议栏文本对齐方式（左对齐）
      'fontFamily': '',        // 协议栏字体
      'fontColor': 'rgba(93, 8, 253, 1)', // 协议栏字体颜色（深蓝色）
      'fontSize': '20rpx',     // 协议栏字体大小（较小）
      'top': '446rpx',         // 协议栏距离弹窗上边的距离
      'left': 'center',        // 协议栏水平位置（居中）
      'width': '85%',          // 协议栏宽度（占弹窗宽度的 85%）
      'height': ''             // 协议栏高度（空=自适应）
    },
    // === 协议勾选按钮 checkBtnStyle ===
    // 协议前面的勾选框图标
    checkBtnStyle: {
      'uncheck': 'https://h5auth.cmpassport.com/h5/js/jssdk_auth/image/chooseIcon.png',  // 未勾选状态的图标 URL
      'checked': 'https://h5auth.cmpassport.com/h5/js/jssdk_auth/image/choosedIcon.png', // 已勾选状态的图标 URL
      'width': '32rpx',        // 勾选按钮图标宽度
      'height': '32rpx'        // 勾选按钮图标高度
    },
    // === 协议名称 agreeStyle ===
    // 协议链接和样式
    agreeStyle: {
      'contracts': [           // 协议数组，每个协议是一个可点击的链接
        { name: '《服务协议》', url: '/pages/contract/index?type=service' },
        { name: '《隐私政策》', url: '/pages/contract/index?type=privacy' }
      ],
      'fontFamily': '',        // 协议名称字体
      'fontColor': 'rgba(213, 134, 21, 1)' // 协议名称字体颜色（橙色）
    },
    // === 自定义按钮控件 customControlStyle（数组格式） ===
    // 弹窗下方可添加额外的自定义按钮（如"其他登录方式"）
    customControlStyle: [
      {
        'ifShow': true,        // 是否展示自定义控件（Boolean，默认 FALSE）
        'name': '其他登录方式>', // 自定义控件显示文案
        'url': '/pages/page-captcha/index', // 点击跳转到行为验证码页
        'width': '200rpx',     // 自定义控件宽度
        'height': '',          // 自定义控件高度（空=自适应）
        'top': '560rpx',       // 自定义控件距离弹窗上边框的距离
        'left': 'center',      // 自定义控件距离弹窗左边框的边距（center=居中）
        'fontFamily': '',      // 控件字体
        'fontSize': '28rpx',   // 控件字体大小
        'fontColor': 'rgba(53, 14, 41, 1)', // 控件字体颜色（深紫色）
        'bgColor': '',         // 自定义控件背景颜色（空=透明）
        'textAlign': 'left',   // 自定义控件文本对齐选项
        'radius': '0',         // 自定义控件圆角（0=无圆角）
      }
    ],
  };
}

/**
 * 预设 2：全屏样式
 *
 * 【特点】
 * - 占满整个屏幕，沉浸式体验
 * - 蓝色主色调，现代风格
 * - 适合品牌定制和展示
 * - Logo 居上，号码居中，按钮居下
 *
 * 【UI 构成】
 * 上：品牌 Logo（20%）
 * 中：手机号显示（40%-50%）
 * 下：确认 + 取消按钮（50%-58%）、返回按钮（顶部左侧）
 *
 * @returns {Object} UI 配置对象
 */
function getFullScreenOption() {
  return {
    // === 蒙层 maskStyle ===
    maskStyle: {
      'ifShowMask': true,      // 是否显示蒙层（全屏时通常显示）
    },
    // === 弹窗 layerStyle ===
    // 全屏模式下 layerStyle 定义整个屏幕的外观
    layerStyle: {
      'height': '100%',        // 弹窗高度（100%=全屏）
      'radius': '0rpx',        // 弹窗圆角（0=无圆角，全屏时无需圆角）
      'bgColor': 'rgba(255, 255, 255, 1)' // 弹窗背景颜色（白色）
    },
    // === Logo 配置 logoStyle ===
    // 品牌 Logo 的位置和大小
    logoStyle: {
      'src': 'https://www.chuanglan.com/images/logo.svg', // Logo 图片 URL
      'top': '20%',            // Logo 距离屏幕顶部的位置（占屏幕高度的 20%）
      'left': 'center',        // Logo 水平位置（居中）
      width: "300rpx",         // Logo 宽度
      height: "200rpx"         // Logo 高度
    },
    // === 业务名称 bussinessNameStyle ===
    bussinessNameStyle: {
      'top': '85%',            // 业务名称距离屏幕顶部的位置
      'left': 'center'         // 业务名称水平位置（居中）
    },
    // === 授权文本 authTextStyle ===
    authTextStyle: {
      fontSize: "0rpx"         // 授权文本字体大小（0=隐藏）
    },
    // === 授权栏 authTipStyle ===
    authTipStyle: {
      'ifShow': false          // 是否展示授权栏（全屏模式关闭）
    },
    // === 提示栏 tipStyle ===
    tipStyle: {
      'top': '45%'             // 提示栏距离屏幕顶部的位置
    },
    // === 号码栏 phoneStyle ===
    phoneStyle: {
      'fontFamily': '',        // 号码栏字体
      'fontColor': '#333333',  // 号码栏字体颜色（深灰色）
      'fontSize': '48rpx',     // 号码栏字体大小（大号）
      'top': '40%',         // 号码栏距离屏幕顶部的位置
      'left': 'center'         // 号码栏水平位置（居中）
    },
    // === 取消授权按钮 cancleBtnStyle ===
    cancleBtnStyle: {
      'text': '其他登录方式>', // 按钮文案
      'fontColor': '#FFFFFF',  // 按钮字体颜色（白色）
      'fontSize': '30rpx',     // 按钮字体大小
      'width': '80%',       // 按钮宽度（占屏幕宽度的 80%）
      'height': '88rpx',       // 按钮高度
      'bgColor': '#2b7de0',    // 按钮背景颜色（蓝色）
      'radius': '44rpx',       // 按钮圆角半径
      'left': 'center',        // 按钮水平位置（居中）
      'top': '58%'             // 按钮距离屏幕顶部的位置
    },
    // === 登录授权按钮 sureBtnStyle ===
    sureBtnStyle: {
      'text': '一键登录',      // 按钮文案
      'textAlign': 'center',   // 文本对齐方式（居中）
      'fontFamily': '',        // 按钮字体
      'fontColor': '#FFFFFF',  // 按钮字体颜色（白色）
      'fontSize': '30rpx',     // 按钮字体大小
      'top': '50%',            // 按钮垂直位置（50%=屏幕中央）
      'left': 'center',        // 按钮水平位置（居中）
      'width': '80%',       // 按钮宽度（占屏幕宽度的 80%）
      'height': '88rpx',       // 按钮高度
      'bgColor': '#2b7de0',    // 按钮背景颜色（蓝色）
      'radius': '44rpx',       // 按钮圆角半径
      'borderColor': '#2b7de0', // 按钮边框颜色（蓝色）
      'borderWidth': '0'       // 按钮边框线宽（0=无边框）
    },
    // === 协议栏 agreeLineStyle ===
    agreeLineStyle: {
      'textAlign': 'center',   // 协议栏文本对齐方式（居中）
      'fontFamily': '',        // 协议栏字体
      'fontColor': '#999999',  // 协议栏字体颜色（灰色）
      'fontSize': '22rpx',     // 协议栏字体大小
      'top': '90%',         // 协议栏距离屏幕顶部的位置（近底部）
      'left': 'center',        // 协议栏水平位置（居中）
      'width': '80%',          // 协议栏宽度
      'height': ''             // 协议栏高度（自适应）
    },
    // === 协议勾选按钮 checkBtnStyle ===
    checkBtnStyle: {
      'uncheck': 'https://h5auth.cmpassport.com/h5/js/jssdk_auth/image/chooseIcon.png',
      'checked': 'https://h5auth.cmpassport.com/h5/js/jssdk_auth/image/choosedIcon.png',
      'width': '28rpx',        // 勾选按钮图标宽度
      'height': '28rpx'        // 勾选按钮图标高度
    },
    // === 协议名称 agreeStyle ===
    agreeStyle: {
      'contracts': [           // 协议数组
        { name: '《用户协议》', url: '/pages/contract/index?type=service' },
        { name: '《隐私政策》', url: '/pages/contract/index?type=privacy' }
      ],
      'fontFamily': '',        // 协议名称字体
      'fontColor': '#2b7de0'   // 协议名称字体颜色（蓝色）
    },
    // === 自定义按钮控件 customControlStyle（数组格式） ===
    customControlStyle: [
      {
        'ifShow': true,        // 是否展示自定义控件
        'name': '‹',          // 按钮文案（返回按钮）
        'openType': "navigateBack", // 微信小程序的返回功能
        'textAlign': 'left',   // 文本对齐方式（左对齐）
        'fontFamily': '',        // 按钮字体
        'fontColor': '#000000',  // 按钮字体颜色（黑色）
        'fontSize': '60rpx',     // 按钮字体大小（大号）
        'top': '80rpx',         // 按钮距离屏幕顶部的距离
        'left': '40rpx',         // 按钮距离屏幕左边的距离
        'width': '88rpx',       // 按钮宽度
        'height': '68rpx',      // 按钮高度
        'bgColor': 'transparent', // 按钮背景（透明）
        'borderColor': 'transparent', // 按钮边框（透明）
        'borderWidth': "0px"    // 按钮边框线宽（无）
      }
    ],
  };
}

/**
 * 预设 3：极简样式
 *
 * 【特点】
 * - 小圆角底部弹窗，紧凑设计
 * - 单按钮居中，简化交互
 * - 最少化非必要信息
 * - 适合快速登录场景和小屏幕设备
 *
 * 【UI 构成】
 * 上：Logo + 标题（可选）
 * 中：手机号显示
 * 下：单个大按钮（占满宽度）
 * 底：协议栏
 *
 * @returns {Object} UI 配置对象
 */
function getMinimalPopupOption() {
  return {
    // === 蒙层 maskStyle ===
    maskStyle: {
      'ifShowMask': true,      // 是否显示蒙层
      'bgColor': 'rgba(0,0,0,0.4)', // 蒙层背景颜色（半透明黑色）
      'opacity': '0.4'         // 蒙层透明度
    },
    // === 弹窗 layerStyle ===
    layerStyle: {
      'height': '550rpx',      // 弹窗高度（相对较小）
      'radius': '24rpx',       // 弹窗圆角（适中）
      'bgColor': '#FFFFFF'     // 弹窗背景颜色（白色）
    },
    // === Logo 配置 logoStyle ===
    logoStyle: {
      'top': '15rpx',          // Logo 距离弹窗顶部的距离（靠上）
    },
    // === 业务名称 bussinessNameStyle ===
    bussinessNameStyle: {
      'text': '一键登录demo',  // 业务名称文案
      "fontFamily": 'monospace', // 业务名称字体（等宽字体）
      'top': '15rpx',          // 业务名称距离弹窗顶部的距离
    },
    // === 号码栏 phoneStyle ===
    phoneStyle: {
      'fontFamily': '',        // 号码栏字体
      'fontColor': '#333333',  // 号码栏字体颜色（深灰色）
      'fontSize': '44rpx',     // 号码栏字体大小（中等）
      'top': '80rpx',          // 号码栏距离弹窗顶部的距离
      'left': 'center'         // 号码栏水平位置（居中）
    },
    // === 授权文本 authTextStyle ===
    authTextStyle: {
      'fontSize': '25rpx'      // 授权文本字体大小
    },
    // === 授权栏 authTipStyle ===
    authTipStyle: {
      'ifShow': false          // 是否展示授权栏（极简版关闭）
    },
    // === 取消授权按钮 cancleBtnStyle ===
    cancleBtnStyle: {
      'text': '',              // 按钮文案（空=不显示此按钮）
      'textAlign': 'center',   // 文本对齐方式
      'fontFamily': '',        // 按钮字体
      'fontColor': '#999999',  // 按钮字体颜色（灰色）
      'fontSize': '28rpx',     // 按钮字体大小
      'top': '310rpx',         // 按钮距离弹窗顶部的距离
      'left': 'center',        // 按钮水平位置（居中）
      'width': '200rpx',       // 按钮宽度
      'height': '72rpx',       // 按钮高度
      'bgColor': '#F5F5F5',    // 按钮背景颜色（浅灰色）
      'radius': '36rpx',       // 按钮圆角半径
      'borderColor': 'transparent', // 按钮边框颜色（透明）
      'borderWidth': '0'       // 按钮边框线宽
    },
    // === 登录授权按钮 sureBtnStyle ===
    sureBtnStyle: {
      'text': '手机号一键登录', // 按钮文案（强调点）
      'textAlign': 'center',   // 文本对齐方式（居中）
      'fontFamily': '',        // 按钮字体
      'fontColor': '#FFFFFF',  // 按钮字体颜色（白色）
      'fontSize': '28rpx',     // 按钮字体大小
      'top': '220rpx',         // 按钮距离弹窗顶部的距离
      'left': 'center',        // 按钮水平位置（居中）
      'width': '520rpx',       // 按钮宽度（占弹窗宽度的大部分）
      'height': '80rpx',       // 按钮高度（较大）
      'bgColor': '#2b7de0',    // 按钮背景颜色（蓝色）
      'radius': '40rpx',       // 按钮圆角半径
      'borderColor': '#2b7de0', // 按钮边框颜色（蓝色）
      'borderWidth': '0'       // 按钮边框线宽
    },
    // === 协议栏 agreeLineStyle ===
    agreeLineStyle: {
      'textAlign': 'center',   // 协议栏文本对齐方式（居中）
      'fontFamily': '',        // 协议栏字体
      'fontColor': '#999999',  // 协议栏字体颜色（灰色）
      'fontSize': '20rpx',     // 协议栏字体大小（较小）
      'top': '420rpx',         // 协议栏距离弹窗顶部的距离
      'left': 'center',        // 协议栏水平位置（居中）
      'width': '80%',          // 协议栏宽度
      'height': ''             // 协议栏高度（自适应）
    },
    // === 协议勾选按钮 checkBtnStyle ===
    checkBtnStyle: {
      'width': '24rpx',        // 勾选按钮图标宽度
      'height': '24rpx'        // 勾选按钮图标高度
    },
    // === 协议名称 agreeStyle ===
    agreeStyle: {
      'contracts': [           // 协议数组（极简版仅显示一个协议）
        { name: '《服务协议》', url: '/pages/contract/index?type=service' }
      ],
      'fontFamily': '',        // 协议名称字体
      'fontColor': '#2b7de0'   // 协议名称字体颜色（蓝色）
    },
  };
}

// === 导出 ===
module.exports = {
  getBottomPopupOption,    // 底部弹窗样式（标准版）
  getFullScreenOption,     // 全屏样式
  getMinimalPopupOption,   // 极简样式
};
