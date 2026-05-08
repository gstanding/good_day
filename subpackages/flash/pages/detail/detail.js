const cardService = require('../../utils/cardService');

const STATUS_OPTIONS = [
  { value: 'new', label: '待跟进', color: '#6366F1' },
  { value: 'in_progress', label: '进行中', color: '#F59E0B' },
  { value: 'done', label: '已完成', color: '#22C55E' },
  { value: 'archived', label: '已归档', color: '#8E8E93' },
];

Page({
  data: {
    card: null,
    statusOptions: STATUS_OPTIONS,
    createdStr: '',
    updatedStr: '',
  },

  onShow() {
    const id = this._id;
    if (id) this._loadCard(id);
  },

  onLoad(options) {
    this._id = options.id;
    this._loadCard(options.id);
  },

  _loadCard(id) {
    const raw = cardService.getCardById(id);
    if (!raw) {
      wx.showToast({ title: '卡片不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }
    const card = cardService.enrichCard(raw);
    this.setData({
      card,
      createdStr: this._fmt(raw.createdAt),
      updatedStr: this._fmt(raw.updatedAt || raw.createdAt),
    });
  },

  _fmt(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  },

  setStatus(e) {
    const status = e.currentTarget.dataset.status;
    const raw = cardService.getCardById(this._id);
    if (!raw) return;
    const updated = { ...raw, status, updatedAt: Date.now() };
    cardService.saveCard(updated);
    this._loadCard(this._id);
  },

  goEdit() {
    wx.navigateTo({ url: `../edit/edit?id=${this._id}` });
  },

  deleteCard() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          cardService.deleteCard(this._id);
          wx.navigateBack();
        }
      },
    });
  },
});
