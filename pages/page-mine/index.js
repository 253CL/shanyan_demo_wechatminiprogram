Page({
  data: {
    statusBarHeight: 20,
    version: '',
    aboutText: '上海创蓝云智信息科技股份有限公司（简称创蓝云智）成立于 2011 年，注册资金 6000 万，总部位于松江启迪漕河泾。主营产品是向企业客户提供以消息通信服务为基础，融合大数据、5G 等技术的通信综合解决方案。经过 10 余年的发展，创蓝已成为行业内知名的电信增值服务提供商，先后获得软件企业、高新技术企业、市专精特新企业、中国互联网百强企业等资质。同时创蓝是中国通信企业协会增值服务专业委员会的常务委员单位、全球移动通信系统协会（GSMA）的会员单位。创蓝在 2015 年率先推出行业标杆 "5S 到"，掀起行业革新，并自主研发创蓝云智国际短信平台，率先战略布局全球短信服务市场；每年的研发投入 5000 万 +，占营收的 6% 以上，获得知识产权达 100 多件。',
  },

  onLoad() {
    try {
      const windowInfo = wx.getWindowInfo();
      this.setData({
        statusBarHeight: windowInfo.statusBarHeight || 20,
      });
    } catch (e) {
      this.setData({ statusBarHeight: 20 });
    }

    try {
      const accountInfo = wx.getAccountInfoSync();
      const miniProgram = accountInfo.miniProgram;
      let version;
      if (miniProgram.envVersion === 'release') {
        version = 'v' + miniProgram.version;
      } else if (miniProgram.envVersion === 'trial') {
        version = '体验版';
      } else {
        version = '开发版';
      }
      this.setData({ version });
    } catch (e) {
      this.setData({ version: '未知' });
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
  },

  onOpenDoc(e) {
    const doc = e.currentTarget.dataset.doc;
    wx.navigateTo({
      url: '/pages/page-doc-view/index?doc=' + doc,
    });
  },

  /**
   * 分享给好友
   */
  onShareAppMessage() {
    return {
      title: '一键登录Demo',
      path: '/pages/page-mine/index',
      imageUrl: '',
    };
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    return {
      title: '一键登录Demo',
      query: '',
      imageUrl: '',
    };
  },
});
