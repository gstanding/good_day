// subpackages/timecapsule/pages/player/player.js
const capsuleService = require('../../utils/capsuleService');
const util = require('../../utils/util');

const innerAudioContext = wx.createInnerAudioContext();

Page({
  data: {
    id: null,
    title: '',
    date: '',
    duration: 0,
    currentTime: 0,
    currentTimeStr: '00:00',
    durationStr: '00:00',
    isPlaying: false,
    isMine: false,
    imagePath: ''
  },

  onLoad(options) {
    if (options.id) {
      this.loadCapsule(options.id);
    }
    this.initAudio();
  },

  onUnload() {
    innerAudioContext.stop();
  },

  loadCapsule(id) {
    const capsules = capsuleService.getCapsules();
    const capsule = capsules.find(c => c.id == id); // Loose equality for number/string mix
    
    if (capsule) {
      this.setData({
        id: capsule.id,
        title: capsule.title,
        description: capsule.description || '',
        date: util.formatTime(new Date(capsule.createdAt)),
        duration: capsule.duration,
        durationStr: this.formatDuration(capsule.duration),
        isMine: !!capsule.isMine,
        imagePath: capsule.imagePath || ''
      });
      
      if (capsule.isMock) {
         // Mock audio: use a generic online file or just simulate
         // For demo, let's use a short silent or sample file if available
         // Or just don't set src and let it fail gracefully or just UI simulation
         innerAudioContext.src = 'https://down.ear0.com:3321/preview?soundid=37418&type=mp3'; // Example sound
      } else {
         innerAudioContext.src = capsule.filePath;
      }
    }
  },

  initAudio() {
    innerAudioContext.onPlay(() => {
      this.setData({ isPlaying: true });
    });
    
    innerAudioContext.onPause(() => {
      this.setData({ isPlaying: false });
    });
    
    innerAudioContext.onStop(() => {
      this.setData({ isPlaying: false, currentTime: 0, currentTimeStr: '00:00' });
    });
    
    innerAudioContext.onEnded(() => {
      this.setData({ isPlaying: false, currentTime: 0, currentTimeStr: '00:00' });
    });
    
    innerAudioContext.onTimeUpdate(() => {
      const cur = innerAudioContext.currentTime;
      this.setData({
        currentTime: cur,
        currentTimeStr: this.formatDuration(cur)
      });
    });
    
    innerAudioContext.onError((res) => {
      console.log(res.errMsg);
      wx.showToast({
        title: '播放失败',
        icon: 'none'
      });
    });
  },

  togglePlay() {
    if (this.data.isPlaying) {
      innerAudioContext.pause();
    } else {
      innerAudioContext.play();
    }
  },

  deleteCapsule() {
    wx.showModal({
      title: '删除',
      content: '确定要删除这个胶囊吗？',
      success: (res) => {
        if (res.confirm) {
          capsuleService.deleteCapsule(this.data.id);
          wx.navigateBack();
        }
      }
    });
  },

  formatDuration(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min < 10 ? '0' + min : min}:${sec < 10 ? '0' + sec : sec}`;
  }
})
