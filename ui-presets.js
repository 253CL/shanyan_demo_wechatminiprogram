/**
 * 授权页 UI 预设配置
 *
 * 说明：
 * 提供多种底部授权弹窗的预设样式，开发者可直接使用或基于此修改。
 * 所有配置对应插件文档 7.5 节的自定义弹窗（authPageType='5'）。
 *
 * 使用方式：
 *   const { getBottomPopupOption, getMinimalPopupOption } = require('../../ui-presets');
 *   SDK.openLoginAuth({
 *     option: getBottomPopupOption(),
 *   }, (res) => { ... });
 */

/**
 * 预设1：底部弹窗样式（标准版）
 * 圆角弹窗，双按钮布局，含协议栏和自定义控件
 */
function getBottomPopupOption() {
  return {
    // === 蒙层 maskStyle ===
    maskStyle: {
      'ifShowMask': true,      // 是否显示蒙层（Boolean，默认 true）
      'bgColor': 'rgba(0,0,0,0.5)', // 蒙层背景颜色
      'opacity': '0.5'         // 蒙层透明度
    },
    // === 弹窗 layerStyle ===
    layerStyle: {
      'height': '639rpx',      // 弹窗高度
      'radius': '40rpx 80rpx 0px 0px', // 弹窗圆角
      'bgColor': 'rgba(255, 255, 255, 1)' // 弹窗背景颜色
    },
    // === 号码栏 phoneStyle ===
    phoneStyle: {
      'fontFamily': '',        // 号码栏字体
      'fontColor': 'rgba(153, 15, 153, 1)', // 号码栏字体颜色
      'fontSize': '52rpx',     // 号码栏字体大小
      'top': '180rpx',         // 号码栏距离页面上边框距离
      'left': 'center'         // 号码栏水平位置，center=居中
    },
    // === 授权栏 authTipStyle ===
    authTipStyle: {
      'ifShow': false,          // 是否展示授权栏
    },
    // === 提示栏 tipStyle ===
    tipStyle: {
      'fontFamily': '24',        // 提示栏字体
      'fontColor': 'rgba(13, 153, 53, 1)', // 提示栏字体颜色
      'fontSize': '22rpx',     // 提示栏字体大小
      'top': '250rpx'
    },
    // === 取消授权按钮 cancleBtnStyle ===
    cancleBtnStyle: {
      'text': '取消授权',      // 按钮文案（不超过 6 字）
      'textAlign': '',         // 文本对齐方式：center/left/right
      'fontFamily': '',        // 按钮字体
      'fontColor': 'rgba(53, 134, 241, 1)', // 按钮字体颜色
      'fontSize': '32rpx',     // 按钮字体大小
      'top': '323rpx',         // 按钮距离页面上边框距离
      'left': '96rpx',         // 按钮距离页面左边框距离
      'width': '224rpx',       // 按钮宽度
      'height': '90rpx',       // 按钮高度
      'bgColor': '#FFFFFF',    // 按钮背景颜色
      'radius': '45rpx',       // 按钮圆角
      'borderColor': 'rgba(53, 134, 241, 1)', // 按钮边框颜色
      'borderWidth': '2rpx'    // 按钮边框线宽
    },
    // === 登录授权按钮 sureBtnStyle ===
    sureBtnStyle: {
      'text': '确认登录',      // 按钮文案（默认"授权登录"，不超过 6 字）
      'textAlign': 'center',   // 文本对齐方式
      'fontFamily': '',        // 按钮字体
      'fontColor': '#FFFFFF',  // 按钮字体颜色
      'fontSize': '32rpx',     // 按钮字体大小
      'top': '323rpx',         // 按钮距离页面上边框距离
      'left': '404rpx',        // 按钮距离页面左边框距离
      'width': '270rpx',       // 按钮宽度
      'height': '90rpx',       // 按钮高度
      'bgColor': 'rgba(3, 134, 41, 1)', // 按钮背景颜色
      'radius': '45rpx',       // 按钮圆角
      'borderColor': 'rgba(3, 134, 41, 1)', // 按钮边框颜色
      'borderWidth': '2rpx'    // 按钮边框线宽
    },
    // === 协议栏 agreeLineStyle ===
    agreeLineStyle: {
      'textAlign': 'left',     // 协议栏文本对齐方式
      'fontFamily': '',        // 协议栏字体
      'fontColor': 'rgba(93, 8, 253, 1)', // 协议栏字体颜色
      'fontSize': '20rpx',     // 协议栏字体大小
      'top': '446rpx',         // 协议栏距离页面上边框距离
      'left': 'center',        // 协议栏水平位置
      'width': '85%',          // 协议栏宽度
      'height': ''             // 协议栏高度
    },
    // === 协议勾选按钮 checkBtnStyle ===
    checkBtnStyle: {
      'uncheck': 'https://h5auth.cmpassport.com/h5/js/jssdk_auth/image/chooseIcon.png',
      'checked': 'https://h5auth.cmpassport.com/h5/js/jssdk_auth/image/choosedIcon.png',
      'width': '32rpx',        // 勾选按钮图标宽度
      'height': '32rpx'        // 勾选按钮图标高度
    },
    // === 协议名称 agreeStyle ===
    agreeStyle: {
      'contracts': [           // 定义协议数组 [{name:"协议名称",url:"小程序页面路径"}]
        { name: '《服务协议》', url: '/pages/contract/index?type=service' },
        { name: '《隐私政策》', url: '/pages/contract/index?type=privacy' }
      ],
      'fontFamily': '',        // 协议名称字体
      'fontColor': 'rgba(213, 134, 21, 1)' // 协议名称字体颜色
    },
    // === 自定义按钮控件 customControlStyle（数组格式） ===
    customControlStyle: [
      {
        'ifShow': true,        // 是否展示自定义控件（Boolean，默认 FALSE）
        'name': '其他登录方式>', // 自定义控件显示文案
        'width': '200rpx',     // 自定义控件宽度
        'height': '',          // 自定义控件高度
        'top': '560rpx',       // 自定义控件距离弹窗上边框高度
        'left': 'center',      // 自定义控件距离弹窗左边框边距
        'fontFamily': '',      // 控件字体
        'fontSize': '28rpx',   // 控件字体大小
        'fontColor': 'rgba(53, 14, 41, 1)', // 控件字体颜色
        'bgColor': '',         // 自定义控件背景颜色
        'textAlign': 'left',   // 自定义控件文本对齐选项
        'radius': '0',         // 自定义控件圆角
      }
    ],
  };
}

/**
 * 预设2：全屏样式
 * 全屏弹窗，蓝色主色调，适合品牌定制
 */
function getFullScreenOption() {
  return {
    // === 蒙层 maskStyle ===
    maskStyle: {
      'ifShowMask': true,      // 是否显示蒙层
    },
    // === 弹窗 layerStyle ===
    layerStyle: {
      'height': '100%',        // 弹窗高度（全屏）
      'radius': '0rpx',        // 弹窗圆角
      'bgColor': 'rgba(255, 255, 255, 1)' // 弹窗背景颜色
    },
    logoStyle: {
      'top': '20%',
      'left': 'center',
      width: "300rpx",
      height: "200rpx"
    },
    bussinessNameStyle: {
      'top': '85%',
      'left': 'center'
    },
    authTextStyle: {
      fontSize: "0rpx"
    },
    authTipStyle: {
      'ifShow': false
    },
    tipStyle: {
      'top': '45%'
    },
    // === 号码栏 phoneStyle ===
    phoneStyle: {
      'fontFamily': '',        // 号码栏字体
      'fontColor': '#333333',  // 号码栏字体颜色
      'fontSize': '48rpx',     // 号码栏字体大小
      'top': '40%',         // 号码栏距离页面上边框距离
      'left': 'center'         // 号码栏水平位置
    },
    // === 取消授权按钮 cancleBtnStyle ===
    cancleBtnStyle: {
      'text': '其他登录方式>', // 自定义控件显示文案
      'fontColor': '#FFFFFF',  // 按钮字体颜色
      'fontSize': '30rpx',     // 按钮字体大小
      'width': '80%',       // 按钮宽度
      'height': '88rpx',       // 按钮高度
      'bgColor': '#2b7de0',    // 按钮背景颜色
      'radius': '44rpx',       // 按钮圆角
      'left': 'center',
      'top': '58%'
    },
    // === 登录授权按钮 sureBtnStyle ===
    sureBtnStyle: {
      'text': '一键登录',      // 按钮文案
      'textAlign': 'center',   // 文本对齐方式
      'fontFamily': '',        // 按钮字体
      'fontColor': '#FFFFFF',  // 按钮字体颜色
      'fontSize': '30rpx',     // 按钮字体大小
      'top': '50%',            // 按钮垂直居中
      'left': 'center',        // 按钮距离页面左边框距离
      'width': '80%',       // 按钮宽度
      'height': '88rpx',       // 按钮高度
      'bgColor': '#2b7de0',    // 按钮背景颜色
      'radius': '44rpx',       // 按钮圆角
      'borderColor': '#2b7de0', // 按钮边框颜色
      'borderWidth': '0'       // 按钮边框线宽
    },
    // === 协议栏 agreeLineStyle ===
    agreeLineStyle: {
      'textAlign': 'center',   // 协议栏文本对齐方式
      'fontFamily': '',        // 协议栏字体
      'fontColor': '#999999',  // 协议栏字体颜色
      'fontSize': '22rpx',     // 协议栏字体大小
      'top': '90%',         // 协议栏距离页面上边框距离
      'left': 'center',        // 协议栏水平位置
      'width': '80%',          // 协议栏宽度
      'height': ''             // 协议栏高度
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
      'contracts': [           // 定义协议数组
        { name: '《用户协议》', url: '/pages/contract/index?type=service' },
        { name: '《隐私政策》', url: '/pages/contract/index?type=privacy' }
      ],
      'fontFamily': '',        // 协议名称字体
      'fontColor': '#2b7de0'   // 协议名称字体颜色
    },
    // === 自定义按钮控件 customControlStyle（数组格式） ===
    customControlStyle: [
      {
        'ifShow': true,        // 是否展示自定义控件（Boolean，默认 FALSE）
        'name': '‹',          // 按钮文案
        'openType': "navigateBack",
        'textAlign': 'left',   // 文本对齐方式
        'fontFamily': '',        // 按钮字体
        'fontColor': '#000000',  // 按钮字体颜色
        'fontSize': '60rpx',     // 按钮字体大小
        'top': '80rpx',         // 按钮距离页面上边框距离
        'left': '40rpx',         // 按钮距离页面左边框距离
        'width': '88rpx',       // 按钮宽度
        'height': '68rpx',      // 按钮高度
        'bgColor': 'transparent',
        'borderColor': 'transparent',
        'borderWidth': "0px"
      }
    ],
  };
}

/**
 * 预设3：极简样式
 * 小圆角弹窗，单按钮居中，适合快速登录场景
 */
function getMinimalPopupOption() {
  return {
    // === 蒙层 maskStyle ===
    maskStyle: {
      'ifShowMask': true,      // 是否显示蒙层
      'bgColor': 'rgba(0,0,0,0.4)', // 蒙层背景颜色
      'opacity': '0.4'         // 蒙层透明度
    },
    // === 弹窗 layerStyle ===
    layerStyle: {
      'height': '550rpx',      // 弹窗高度
      'radius': '24rpx',       // 弹窗圆角
      'bgColor': '#FFFFFF'     // 弹窗背景颜色
    },
    logoStyle: {
      'top': '15rpx',
    },
    bussinessNameStyle: {
      'top': '15rpx',
    },
    // === 号码栏 phoneStyle ===
    phoneStyle: {
      'fontFamily': '',        // 号码栏字体
      'fontColor': '#333333',  // 号码栏字体颜色
      'fontSize': '44rpx',     // 号码栏字体大小
      'top': '80rpx',          // 号码栏距离页面上边框距离
      'left': 'center'         // 号码栏水平位置
    },
    authTextStyle: {
      'fontSize': '25rpx'
    },
    authTipStyle: {
      'ifShow': false
    },
    // === 取消授权按钮 cancleBtnStyle ===
    cancleBtnStyle: {
      'text': '',              // 按钮文案（空=不显示）
      'textAlign': 'center',   // 文本对齐方式
      'fontFamily': '',        // 按钮字体
      'fontColor': '#999999',  // 按钮字体颜色
      'fontSize': '28rpx',     // 按钮字体大小
      'top': '310rpx',         // 按钮距离页面上边框距离
      'left': 'center',        // 按钮水平位置
      'width': '200rpx',       // 按钮宽度
      'height': '72rpx',       // 按钮高度
      'bgColor': '#F5F5F5',    // 按钮背景颜色
      'radius': '36rpx',       // 按钮圆角
      'borderColor': 'transparent', // 按钮边框颜色
      'borderWidth': '0'       // 按钮边框线宽
    },
    // === 登录授权按钮 sureBtnStyle ===
    sureBtnStyle: {
      'text': '手机号一键登录', // 按钮文案
      'textAlign': 'center',   // 文本对齐方式
      'fontFamily': '',        // 按钮字体
      'fontColor': '#FFFFFF',  // 按钮字体颜色
      'fontSize': '28rpx',     // 按钮字体大小
      'top': '220rpx',         // 按钮距离页面上边框距离
      'left': 'center',        // 按钮水平位置
      'width': '520rpx',       // 按钮宽度
      'height': '80rpx',       // 按钮高度
      'bgColor': '#2b7de0',    // 按钮背景颜色
      'radius': '40rpx',       // 按钮圆角
      'borderColor': '#2b7de0', // 按钮边框颜色
      'borderWidth': '0'       // 按钮边框线宽
    },
    // === 协议栏 agreeLineStyle ===
    agreeLineStyle: {
      'textAlign': 'center',   // 协议栏文本对齐方式
      'fontFamily': '',        // 协议栏字体
      'fontColor': '#999999',  // 协议栏字体颜色
      'fontSize': '20rpx',     // 协议栏字体大小
      'top': '420rpx',         // 协议栏距离页面上边框距离
      'left': 'center',        // 协议栏水平位置
      'width': '80%',          // 协议栏宽度
      'height': ''             // 协议栏高度
    },
    // === 协议勾选按钮 checkBtnStyle ===
    checkBtnStyle: {
      'width': '24rpx',        // 勾选按钮图标宽度
      'height': '24rpx'        // 勾选按钮图标高度
    },
    // === 协议名称 agreeStyle ===
    agreeStyle: {
      'contracts': [           // 定义协议数组
        { name: '《服务协议》', url: '/pages/contract/index?type=service' }
      ],
      'fontFamily': '',        // 协议名称字体
      'fontColor': '#2b7de0'   // 协议名称字体颜色
    },
  };
}

module.exports = {
  getBottomPopupOption,
  getFullScreenOption,
  getMinimalPopupOption,
};
