App({
  onLaunch() {
    // Check local storage for theme
    const theme = wx.getStorageSync('theme') || { color: '#ff4d4f' };
    this.globalData = {
      theme,
      oaUsername: 'gh_xxxxxxxx',
    };
  },
  globalData: {
    userInfo: null,
    theme: null,
    oaUsername: 'gh_xxxxxxxx',
  }
})
