// subpackages/timecapsule/pages/record/record.js
const capsuleService = require('../../utils/capsuleService');
const util = require('../../utils/util');

const recorderManager = wx.getRecorderManager();

Page({
  data: {
    isRecording: false,
    isRecorded: false,
    duration: 0,
    status: '准备录音',
    tempFilePath: '',
    tempImagePath: '',
    title: '',
    description: ''
  },

  onLoad() {
    this.initRecorder();
  },

  initRecorder() {
    recorderManager.onStart(() => {
      this.setData({ isRecording: true, status: '录音中...', duration: 0 });
      this.timer = setInterval(() => {
        if (this.data.duration >= 60) {
          this.stopRecord();
        } else {
          this.setData({ duration: this.data.duration + 1 });
        }
      }, 1000);
    });

    recorderManager.onStop((res) => {
      clearInterval(this.timer);
      this.setData({ isRecording: false });
      
      const { tempFilePath, duration } = res;
      if (duration < 1000) {
        wx.showToast({ title: '录音太短', icon: 'none' });
        this.setData({ status: '准备录音', duration: 0 });
        return;
      }
      
      if (this.ignoreResult) {
        this.ignoreResult = false;
        this.setData({ status: '已取消', duration: 0 });
        return;
      }

      this.setData({
        isRecorded: true,
        status: '录音完成',
        tempFilePath: tempFilePath,
        duration: Math.round(duration / 1000)
      });
    });

    recorderManager.onError((err) => {
      console.error(err);
      this.setData({ isRecording: false, status: '录音失败' });
    });
  },

  handleTap() {
    wx.showToast({
      title: '请长按录音',
      icon: 'none'
    });
  },

  startRecord() {
    recorderManager.start({
      duration: 60000,
      format: 'aac'
    });
  },

  stopRecord() {
    if (this.data.isRecording) {
      recorderManager.stop();
    }
  },

  cancel() {
    if (this.data.isRecording) {
      this.ignoreResult = true;
      recorderManager.stop();
    }
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onDescInput(e) {
    this.setData({ description: e.detail.value });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ tempImagePath: res.tempFiles[0].tempFilePath });
      }
    });
  },

  discardRecord() {
    this.setData({
      isRecorded: false,
      status: '准备录音',
      duration: 0,
      tempFilePath: '',
      tempImagePath: '',
      title: '',
      description: ''
    });
  },

  confirmSave() {
    if (!this.data.title) {
      wx.showToast({
        title: '请给胶囊起个名字',
        icon: 'none'
      });
      return;
    }

    const { tempFilePath, tempImagePath, duration, title, description } = this.data;
    
    wx.showLoading({ title: '埋藏中...' });

    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        const capsule = {
          id: util.uuid(),
          latitude: res.latitude,
          longitude: res.longitude,
          filePath: '', // Will be updated
          duration: duration,
          createdAt: Date.now(),
          title: title,
          description: description,
          isMine: true
        };
        
        const finalize = (imagePath) => {
          if (imagePath) capsule.imagePath = imagePath;
          capsuleService.saveCapsule(capsule);
          wx.hideLoading();
          wx.showToast({ title: '胶囊已埋下' });
          setTimeout(() => wx.navigateBack(), 1500);
        };

        wx.getFileSystemManager().saveFile({
          tempFilePath: tempFilePath,
          success: (saveRes) => {
            capsule.filePath = saveRes.savedFilePath;

            if (tempImagePath) {
              wx.getFileSystemManager().saveFile({
                tempFilePath: tempImagePath,
                success: (imgRes) => finalize(imgRes.savedFilePath),
                fail: () => finalize('')
              });
            } else {
              finalize('');
            }
          },
          fail: (err) => {
            console.error(err);
            wx.hideLoading();
            wx.showToast({ title: '保存失败', icon: 'none' });
          }
        });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '无法获取位置', icon: 'none' });
      }
    });
  }
})
