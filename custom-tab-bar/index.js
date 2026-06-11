Component({
  data: {
    selected: 0,
    color: '#999999',
    selectedColor: '#2b7de0',
    list: [
      {
        pagePath: '/pages/index/index',
        text: '一键登录',
        iconPath: '/images/home_login_unchecked.png',
        selectedIconPath: '/images/home_login_checked.png'
      },
      {
        pagePath: '/pages/page-captcha/index',
        text: '行为验证码',
        iconPath: '/images/home_captcha_unchecked.png',
        selectedIconPath: '/images/home_captcha_checked.png'
      },
      {
        pagePath: '/pages/page-mine/index',
        text: '个人中心',
        iconPath: '/images/home_mine_unchecked.png',
        selectedIconPath: '/images/home_mine_checked.png'
      }
    ]
  },

  methods: {
    switchTab(e) {
      const path = e.currentTarget.dataset.path;
      wx.switchTab({ url: path });
    }
  }
});
