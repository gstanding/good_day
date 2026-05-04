// subpackages/timecapsule/pages/map/map.js
const capsuleService = require('../../utils/capsuleService');

const MIN_R = 300;
const MAX_R = 100000;

Page({
  data: {
    latitude: 39.9042,
    longitude: 116.4074,
    markers: [],
    circles: [],
    statusText: '正在定位...',
    showPlogPanel: false,
    plogLat: 0,
    plogLng: 0,
    plogCenterTitle: '',
    plogRadius: 1000,
    plogRadiusLabel: '1.0km',
    sliderValue: 21,
  },

  onLoad() {},

  onShow() {
    this.updateLocation();
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
    const markers = capsules.map(c => {
      let hash = 0;
      for (let i = 0; i < c.id.length; i++) {
        hash = ((hash << 5) - hash) + c.id.charCodeAt(i);
        hash |= 0;
      }
      const markerId = Math.abs(hash);
      return {
        id: markerId,
        _uuid: c.id,
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
    if (!marker || !marker._uuid) return;

    const capsule = capsuleService.getCapsules().find(c => c.id === marker._uuid);
    if (!capsule) return;

    wx.showActionSheet({
      itemList: ['播放胶囊', '以此为中心圈选范围'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.navigateTo({
            url: `/subpackages/timecapsule/pages/player/player?id=${marker._uuid}`,
          });
        } else {
          this._openPlogPanel(capsule.latitude, capsule.longitude, capsule.title);
        }
      },
    });
  },

  checkNearby(lat, lng) {
    const result = capsuleService.findNearbyCapsule(lat, lng);
    if (result.capsule) {
      wx.showToast({ title: '附近有声音胶囊', icon: 'none' });
    }
  },

  goRecord() {
    wx.navigateTo({ url: '/subpackages/timecapsule/pages/record/record' });
  },

  // ── Log-scale helpers ──────────────────────────────
  _sliderToRadius(val) {
    return Math.round(MIN_R * Math.pow(MAX_R / MIN_R, val / 100));
  },

  _radiusToSlider(r) {
    return Math.round(Math.log(r / MIN_R) / Math.log(MAX_R / MIN_R) * 100);
  },

  _formatRadius(r) {
    return r >= 1000 ? `${(r / 1000).toFixed(1)}km` : `${r}m`;
  },

  _makeCircle(lat, lng, radius) {
    return [{
      latitude: lat,
      longitude: lng,
      radius,
      color: '#4a90e266',
      fillColor: '#4a90e218',
      strokeWidth: 2,
    }];
  },

  // ── Plog panel ─────────────────────────────────────
  _openPlogPanel(lat, lng, title) {
    const sliderValue = this._radiusToSlider(this.data.plogRadius);
    const radius = this._sliderToRadius(sliderValue);
    this.setData({
      showPlogPanel: true,
      plogLat: lat,
      plogLng: lng,
      plogCenterTitle: title,
      sliderValue,
      plogRadius: radius,
      plogRadiusLabel: this._formatRadius(radius),
      circles: this._makeCircle(lat, lng, radius),
    });
  },

  onRadiusChange(e) {
    const sliderValue = e.detail.value;
    const radius = this._sliderToRadius(sliderValue);
    const { plogLat, plogLng } = this.data;
    this.setData({
      sliderValue,
      plogRadius: radius,
      plogRadiusLabel: this._formatRadius(radius),
      circles: this._makeCircle(plogLat, plogLng, radius),
    });
  },

  closePlogPanel() {
    this.setData({ showPlogPanel: false, circles: [] });
  },

  goPlog() {
    const { plogLat, plogLng, plogRadius } = this.data;
    this.setData({ showPlogPanel: false, circles: [] });
    wx.navigateTo({
      url: `/subpackages/timecapsule/pages/plog/plog?lat=${plogLat}&lng=${plogLng}&radius=${plogRadius}`
    });
  }
})
