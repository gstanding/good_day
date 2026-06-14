const userService = require('./utils/userService');

App({
  onLaunch() {
    wx.cloud.init({ env: 'notebook-0gir99j66ed68064', traceUser: true });

    const theme = wx.getStorageSync('theme') || { color: '#ff4d4f' };
    this.globalData = {
      theme,
      oaUsername: 'gh_xxxxxxxx',
      openid: null,
    };

    // 静默登录：获取 openid，新设备自动从云端恢复历史数据
    // 不阻塞启动，数据恢复在后台静默进行
    userService.login().then(openid => {
      this.globalData.openid = openid;
    }).catch(e => {
      console.error('[App] login error:', e);
    });
  },

  globalData: {
    userInfo: null,
    theme: null,
    oaUsername: 'gh_xxxxxxxx',
    openid: null,
  },
});
