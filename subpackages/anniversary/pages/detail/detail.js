// pages/detail/detail.js
const storage = require('../../utils/storage');
const util = require('../../utils/util');

Page({
  data: {
    id: null,
    item: null
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
    }
  },

  onShow() {
    if (this.data.id) {
      this.loadData(this.data.id);
    }
  },

  loadData(id) {
    const item = storage.getItem(id);
    if (!item) {
      wx.navigateBack();
      return;
    }

    let days = 0;
    let displayDate = '';
    let progress = 0;
    
    if (item.mode === 'countDown') {
      days = util.getDaysLeft(item.date, item.type, item.cycle || 'year');
      displayDate = util.getNextDate(item.date, item.type, item.cycle || 'year');
      progress = util.getCycleProgress(item.date, item.type, item.cycle || 'year');
    } else {
      days = util.getDaysPassed(item.date, item.type);
      displayDate = item.date + (item.type === 'lunar' ? ' (农历)' : '');
    }

    this.setData({
      item: {
        ...item,
        days,
        displayDate,
        progress
      }
    });
    
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#ffffff',
    })
  },

  goEdit() {
    wx.navigateTo({
      url: `/subpackages/anniversary/pages/edit/edit?id=${this.data.id}`,
    });
  },

  addToCalendar() {
    const item = this.data.item;
    // displayDate format: YYYY-MM-DD or YYYY-MM-DD (Lunar: M/D)
    // We need to parse YYYY-MM-DD from the start
    const dateStr = item.displayDate.split(' ')[0];
    const [year, month, day] = dateStr.split('-').map(Number);
    const startTime = new Date(year, month - 1, day).getTime() / 1000;
    const endTime = startTime + 3600; // 1 hour

    wx.addPhoneCalendar({
      title: `${item.title} 纪念日`,
      startTime,
      endTime,
      description: '来自好日子的提醒',
      success: () => {
        wx.showToast({
          title: '已添加到日历',
        });
      },
      fail: (err) => {
        console.error(err);
        wx.showToast({
          title: '添加失败',
          icon: 'none'
        });
      }
    })
  },

  onShareAppMessage() {
    const item = this.data.item;
    return {
      title: `${item.title}: ${item.days} 天${item.mode === 'countDown' ? '剩余' : '已过去'}!`,
      path: `/subpackages/anniversary/pages/detail/detail?id=${item.id}`
    };
  }
})