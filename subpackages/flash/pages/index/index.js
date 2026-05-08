const cardService = require('../../utils/cardService');

const STATUS_TABS = [
  { label: '全部', value: 'all' },
  { label: '待跟进', value: 'new' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'done' },
];

Page({
  data: {
    cards: [],
    query: '',
    activeStatus: 'all',
    tabs: STATUS_TABS,
    isEmpty: false,
  },

  onShow() {
    this._reload();
  },

  _reload() {
    const { query, activeStatus } = this.data;
    const raw = cardService.searchCards(query, null, activeStatus);
    const cards = raw.filter(c => c.status !== 'archived').map(cardService.enrichCard);
    this.setData({ cards, isEmpty: cards.length === 0 });
  },

  onSearchInput(e) {
    this.setData({ query: e.detail.value }, () => this._reload());
  },

  onStatusTab(e) {
    this.setData({ activeStatus: e.currentTarget.dataset.status }, () => this._reload());
  },

  goAdd() {
    wx.navigateTo({ url: '../edit/edit' });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `../detail/detail?id=${id}` });
  },
});
