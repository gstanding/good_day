App({
  onLaunch() {
    // Check local storage for theme
    const theme = wx.getStorageSync('theme') || { color: '#ff4d4f' };
    this.globalData = {
      theme
    };
  },
  globalData: {
    userInfo: null,
    theme: null
  }
})
