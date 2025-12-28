const storage = require('../../utils/storage');
const util = require('../../utils/util');

Page({
  data: {
    list: []
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const rawList = storage.getItems();
    const list = rawList.map(item => {
      let days = 0;
      let displayDate = '';
      
      if (item.mode === 'countDown') {
        days = util.getDaysLeft(item.date, item.type, item.cycle || 'year');
        displayDate = util.getNextDate(item.date, item.type, item.cycle || 'year');
      } else {
        days = util.getDaysPassed(item.date, item.type);
        displayDate = item.date + (item.type === 'lunar' ? ' (农历)' : '');
      }

      return {
        ...item,
        days,
        displayDate
      };
    });
    
    // Sort: Favorites top? Or just by closest date?
    // Let's sort by creation for now, or maybe days left?
    // Usually user wants closest upcoming or most important.
    // Let's just keep storage order for now.
    this.setData({ list });
  },

  goAdd() {
    wx.navigateTo({
      url: '/subpackages/anniversary/pages/edit/edit',
    });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/subpackages/anniversary/pages/detail/detail?id=${id}`,
    });
  }
})
