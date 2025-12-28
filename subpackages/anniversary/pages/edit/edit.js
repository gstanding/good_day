// pages/edit/edit.js
const storage = require('../../utils/storage');
const util = require('../../utils/util');

Page({
  data: {
    id: null,
    title: '',
    date: util.formatTime(new Date()).split('/').join('-'), // Default today
    mode: 'countDown',
    cycle: 'year',
    type: 'solar',
    theme: '#ff4d4f',
    colors: ['#ff4d4f', '#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96'],
    cycleOptions: [
      { name: '每年', value: 'year' },
      { name: '每月', value: 'month' },
      { name: '每周', value: 'week' }
    ]
  },

  onLoad(options) {
    if (options.id) {
      const item = storage.getItem(options.id);
      if (item) {
        this.setData({
          id: item.id,
          title: item.title,
          date: item.date,
          mode: item.mode,
          cycle: item.cycle || 'year',
          type: item.type,
          theme: item.theme
        });
        wx.setNavigationBarTitle({
          title: '编辑',
        });
      }
    } else {
        wx.setNavigationBarTitle({
          title: '新建',
        });
    }
  },

  onTitleChange(e) {
    this.setData({ title: e.detail.value });
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  setMode(e) {
    this.setData({ mode: e.currentTarget.dataset.mode });
  },

  setCycle(e) {
    this.setData({ cycle: e.currentTarget.dataset.cycle });
  },

  setType(e) {
    this.setData({ type: e.currentTarget.dataset.type });
  },

  setTheme(e) {
    this.setData({ theme: e.currentTarget.dataset.color });
  },

  save() {
    if (!this.data.title) {
      wx.showToast({
        title: '请输入标题',
        icon: 'none'
      });
      return;
    }

    const item = {
      id: this.data.id || util.uuid(),
      title: this.data.title,
      date: this.data.date,
      mode: this.data.mode,
      cycle: this.data.cycle,
      type: this.data.type,
      theme: this.data.theme
    };

    storage.saveItem(item);
    wx.navigateBack();
  },

  delete() {
    if (this.data.id) {
      wx.showModal({
        title: '删除',
        content: '确认删除吗？',
        success: (res) => {
          if (res.confirm) {
            storage.deleteItem(this.data.id);
            wx.navigateBack();
          }
        }
      });
    }
  }
})
