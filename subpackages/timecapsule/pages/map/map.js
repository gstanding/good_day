// subpackages/timecapsule/pages/map/map.js
const capsuleService = require('../../utils/capsuleService');

Page({
  data: {
    latitude: 39.9042,
    longitude: 116.4074,
    markers: [],
    statusText: '正在定位...',
    showPlogPanel: false,
    plogLat: 0,
    plogLng: 0,
    plogRadius: 1000
  },

  onLoad() {
    this.updateLocation();
  },

  onShow() {
    this.refreshMarkers();
  },

  updateLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude,
          statusText: '定位准确'
        });
        
        // Seed mock data around user
        capsuleService.seedMockCapsules(res.latitude, res.longitude);
        this.refreshMarkers();
        this.checkNearby(res.latitude, res.longitude);
      },
      fail: (err) => {
        console.error(err);
        this.setData({ statusText: '定位失败，请重试' });
      }
    });
  },

  refreshMarkers() {
    const capsules = capsuleService.getCapsules();
    // Map markers using numeric ID (hash of UUID) to support bindmarkertap
    const markers = capsules.map(c => {
      // Simple hash function for string to integer
      let hash = 0;
      for (let i = 0; i < c.id.length; i++) {
        hash = ((hash << 5) - hash) + c.id.charCodeAt(i);
        hash |= 0; 
      }
      const markerId = Math.abs(hash); // Use positive ID

      return {
        id: markerId, 
        _uuid: c.id, // Custom property to track back
        latitude: c.latitude,
        longitude: c.longitude,
        iconPath: '/assets/tape_marker.png',
        width: 32,
        height: 32,
        callout: {
          content: c.title,
          padding: 10,
          borderRadius: 5,
          display: 'ALWAYS'
        }
      };
    });
    
    this.setData({ markers });
  },

  onMarkerTap(e) {
    const markerId = e.detail.markerId;
    const marker = this.data.markers.find(m => m.id === markerId);
    if (marker && marker._uuid) {
        wx.navigateTo({
            url: `/subpackages/timecapsule/pages/player/player?id=${marker._uuid}`,
        });
    }
  },

  checkNearby(lat, lng) {
    // We already show markers, auto-popup might be annoying if many.
    // Let's keep auto-popup only for very close (50m) one random.
    const result = capsuleService.findNearbyCapsule(lat, lng);
    if (result.capsule) {
      wx.showToast({
        title: '附近有声音胶囊',
        icon: 'none'
      });
    }
  },

  goRecord() {
    wx.navigateTo({
      url: '/subpackages/timecapsule/pages/record/record',
    });
  },

  onMapLongPress(e) {
    this.setData({
      showPlogPanel: true,
      plogLat: e.detail.latitude,
      plogLng: e.detail.longitude
    });
  },

  onRadiusChange(e) {
    this.setData({ plogRadius: e.detail.value });
  },

  closePlogPanel() {
    this.setData({ showPlogPanel: false });
  },

  goPlog() {
    const { plogLat, plogLng, plogRadius } = this.data;
    this.setData({ showPlogPanel: false });
    wx.navigateTo({
      url: `/subpackages/timecapsule/pages/plog/plog?lat=${plogLat}&lng=${plogLng}&radius=${plogRadius}`
    });
  }
})
