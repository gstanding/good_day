App({
  onLaunch() {
    const theme = wx.getStorageSync('theme') || { color: '#ff4d4f' };
    this.globalData = {
      theme,
      oaUsername: 'gh_xxxxxxxx',
      openid: null,
    };

    // 云开发已停用，数据仅存本地 Storage
    // 如需恢复云同步，取消下面两行注释并确保 wx.cloud.init 可用：
    //   wx.cloud.init({ env: 'notebook-0gir99j66ed68064', traceUser: true });
    //   require('./utils/userService').login().then(openid => { this.globalData.openid = openid; });
  },

  globalData: {
    userInfo: null,
    theme: null,
    oaUsername: 'gh_xxxxxxxx',
    openid: null,
  },
});
