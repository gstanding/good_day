// pages/home/home.js
Page({
  goAnniversary() {
    wx.navigateTo({
      url: '/subpackages/anniversary/pages/index/index',
    });
  },

  goCapsule() {
    wx.navigateTo({
      url: '/subpackages/timecapsule/pages/map/map',
    });
  }
})
