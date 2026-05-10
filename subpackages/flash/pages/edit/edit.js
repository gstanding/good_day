const cardService = require('../../utils/cardService');

const STATUS_OPTIONS = [
  { value: 'new', label: '待跟进', color: '#6366F1' },
  { value: 'in_progress', label: '进行中', color: '#F59E0B' },
  { value: 'done', label: '已完成', color: '#22C55E' },
  { value: 'archived', label: '已归档', color: '#8E8E93' },
];

Page({
  data: {
    isEdit: false,
    id: '',
    title: '',
    content: '',
    tagsRaw: '',
    tags: [],
    status: 'new',
    createdAt: 0,
    statusOptions: STATUS_OPTIONS,
  },

  onLoad(options) {
    if (options.id) {
      const card = cardService.getCardById(options.id);
      if (card) {
        wx.setNavigationBarTitle({ title: '编辑灵感' });
        this.setData({
          isEdit: true,
          id: card.id,
          title: card.title,
          content: card.content || '',
          tagsRaw: (card.tags || []).join('，'),
          tags: card.tags || [],
          status: card.status,
          createdAt: card.createdAt,
        });
      }
    }
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  onTagInput(e) {
    const raw = e.detail.value;
    const tags = raw.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean).slice(0, 5);
    this.setData({ tagsRaw: raw, tags });
  },

  onStatusSelect(e) {
    this.setData({ status: e.currentTarget.dataset.status });
  },

  confirmSave() {
    const { id, isEdit, title, content, tags, status, createdAt } = this.data;
    if (!title.trim()) {
      wx.showToast({ title: '请填写标题', icon: 'none' });
      return;
    }
    const now = Date.now();
    const card = {
      id: id || cardService.uuid(),
      title: title.trim(),
      content: content.trim(),
      tags,
      status,
      createdAt: isEdit ? createdAt : now,
      updatedAt: now,
    };
    cardService.saveCard(card);
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 600);
  },
});
