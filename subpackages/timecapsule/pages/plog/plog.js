// subpackages/timecapsule/pages/plog/plog.js
const capsuleService = require('../../utils/capsuleService');
const util = require('../../utils/util');

const MOCK_AUDIO = 'https://down.ear0.com:3321/preview?soundid=37418&type=mp3';

Page({
  data: {
    capsules: [],
    markers: [],
    polyline: [],
    mapLat: 0,
    mapLng: 0,
    currentIndex: -1,
    isPlaying: false,
    currentCardId: '',
    isEmpty: false
  },

  onLoad(options) {
    const lat = parseFloat(options.lat);
    const lng = parseFloat(options.lng);
    const radius = parseInt(options.radius) || 1000;

    const raw = capsuleService.findNearbyCapsules(lat, lng, radius);
    if (!raw.length) {
      this.setData({ isEmpty: true });
      return;
    }

    const capsules = raw
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(c => ({
        ...c,
        timeStr: util.formatTime(new Date(c.createdAt)),
        durationStr: this.formatDuration(c.duration)
      }));

    const markers = capsules.map((c, i) => ({
      id: i,
      latitude: c.latitude,
      longitude: c.longitude,
      iconPath: '/assets/tape_marker.png',
      width: 28,
      height: 28,
      label: {
        content: String(i + 1),
        fontSize: 12,
        color: '#fff',
        bgColor: '#4a90e2',
        borderRadius: 8,
        padding: 2,
        anchorX: 0,
        anchorY: -1
      }
    }));

    const polyline = [{
      points: capsules.map(c => ({ latitude: c.latitude, longitude: c.longitude })),
      color: '#4a90e2bb',
      width: 4,
      arrowLine: true
    }];

    this.setData({ capsules, markers, polyline, mapLat: lat, mapLng: lng });
    this.initAudio();
  },

  onUnload() {
    if (this.audio) {
      this.audio.stop();
      this.audio.destroy();
    }
  },

  initAudio() {
    this.audio = wx.createInnerAudioContext();

    this.audio.onPlay(() => {
      this.setData({ isPlaying: true });
    });

    this.audio.onPause(() => {
      this.setData({ isPlaying: false });
    });

    this.audio.onStop(() => {
      this.setData({ isPlaying: false });
    });

    this.audio.onEnded(() => {
      this.playIndex(this.data.currentIndex + 1);
    });

    this.audio.onError(() => {
      wx.showToast({ title: '播放失败，跳过', icon: 'none' });
      this.playIndex(this.data.currentIndex + 1);
    });
  },

  playIndex(index) {
    const { capsules } = this.data;
    if (index < 0 || index >= capsules.length) {
      this.audio.stop();
      this.setData({ isPlaying: false, currentIndex: -1 });
      return;
    }
    const c = capsules[index];
    this.audio.src = c.isMock ? MOCK_AUDIO : c.filePath;
    this.audio.play();
    this.setData({ currentIndex: index, currentCardId: 'card-' + index });
  },

  togglePlay() {
    if (this.data.currentIndex === -1) {
      this.playIndex(0);
      return;
    }
    if (this.data.isPlaying) {
      this.audio.pause();
    } else {
      this.audio.play();
    }
  },

  prevCapsule() {
    this.playIndex(this.data.currentIndex - 1);
  },

  nextCapsule() {
    this.playIndex(this.data.currentIndex + 1);
  },

  tapCard(e) {
    this.playIndex(parseInt(e.currentTarget.dataset.index));
  },

  formatDuration(seconds) {
    const s = Math.floor(seconds || 0);
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min < 10 ? '0' + min : min}:${sec < 10 ? '0' + sec : sec}`;
  }
})
