const cardService = require('../../utils/cardService');

const GROUP_ORDER = ['今天', '昨天', '本周', '更早'];

Page({
  data: {
    groups: [],
    tabs: [],
    totalCount: 0,
    weekCount: 0,
    query: '',
    activeStatus: 'all',
    statusBarH: 0,
    isEmpty: false,
  },

  onLoad() {
    const sys = wx.getSystemInfoSync();
    this.setData({ statusBarH: sys.statusBarHeight || 20 });
  },

  onShow() {
    this._reload();
  },

  _reload() {
    const { query, activeStatus } = this.data;

    const all = cardService.searchCards('', null, 'all')
      .filter(c => c.status !== 'archived');

    const weekAgo = Date.now() - 7 * 86400000;
    const weekCount = all.filter(c => c.createdAt >= weekAgo).length;

    const tabs = [
      { label: '全部',   value: 'all',         count: all.length },
      { label: '待跟进', value: 'new',          count: all.filter(c => c.status === 'new').length },
      { label: '进行中', value: 'in_progress',  count: all.filter(c => c.status === 'in_progress').length },
      { label: '已完成', value: 'done',         count: all.filter(c => c.status === 'done').length },
    ];

    const raw = cardService.searchCards(query, null, activeStatus)
      .filter(c => c.status !== 'archived');
    const cards = raw.map(cardService.enrichCard);

    const groupMap = {};
    for (const card of cards) {
      const g = card.group;
      if (!groupMap[g]) groupMap[g] = [];
      groupMap[g].push(card);
    }
    const groups = GROUP_ORDER
      .filter(g => groupMap[g])
      .map(g => ({ label: g, count: groupMap[g].length, cards: groupMap[g] }));

    this.setData({
      groups,
      tabs,
      totalCount: all.length,
      weekCount,
      isEmpty: cards.length === 0,
    });
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
    wx.navigateTo({ url: `../detail/detail?id=${e.currentTarget.dataset.id}` });
  },
});
