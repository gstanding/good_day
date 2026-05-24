const cardService = require('../../utils/cardService');

const STATUS_OPTIONS = [
  { value: 'new',         label: '待跟进', dot: '#6366F1', soft: '#ECECFB', ink: '#4F4FC0' },
  { value: 'in_progress', label: '进行中', dot: '#E89515', soft: '#FBEFD7', ink: '#A86200' },
  { value: 'done',        label: '已完成', dot: '#22A150', soft: '#DEF1E0', ink: '#15803D' },
  { value: 'archived',    label: '已归档', dot: '#9C9C9C', soft: '#ECEBEA', ink: '#6E6E76' },
];

Page({
  data: {
    step: 'input',     // 'input' | 'loading' | 'preview'
    rawInput: '',
    title: '',
    tags: [],
    tagInput: '',
    status: 'new',
    isEdit: false,
    id: '',
    createdAt: 0,
    statusOptions: STATUS_OPTIONS,
    statusBarH: 0,
    timeStamp: '',
  },

  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    this.setData({
      statusBarH: sys.statusBarHeight || 20,
      timeStamp: this._buildTimeStamp(),
    });
    if (options.id) {
      const card = cardService.getCardById(options.id);
      if (card) {
        const raw = card.content ? `${card.title}\n${card.content}` : card.title;
        this.setData({
          isEdit: true,
          id: card.id,
          rawInput: raw,
          title: card.title,
          tags: card.tags || [],
          status: card.status,
          createdAt: card.createdAt,
          step: 'preview',
        });
      }
    }
  },

  _buildTimeStamp() {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${h}:${m} · ${days[d.getDay()]}`;
  },

  onCloseTap() {
    wx.navigateBack();
  },

  onRawInput(e) {
    this.setData({ rawInput: e.detail.value });
  },

  aiOrganize() {
    const { rawInput } = this.data;
    if (!rawInput.trim()) {
      wx.showToast({ title: '请先输入内容', icon: 'none' });
      return;
    }
    this.setData({ step: 'loading' });
    wx.cloud.callFunction({
      name: 'aiOrganize',
      data: { rawInput: rawInput.trim() },
      timeout: 25000,
      success: (res) => {
        const { result, error, code, msg, raw } = res.result || {};
        if (error || !result) {
          console.error('[aiOrganize] 云函数返回错误:', error, code, msg, raw);
          wx.showToast({ title: 'AI 整理失败，请手动填写', icon: 'none' });
          this.setData({
            step: 'preview',
            title: rawInput.trim().split('\n')[0].slice(0, 30),
            tags: [],
          });
          return;
        }
        this.setData({
          step: 'preview',
          title: result.title || '',
          tags: (result.tags || []).slice(0, 5),
        });
      },
      fail: () => {
        wx.showToast({ title: '网络请求失败', icon: 'none' });
        this.setData({ step: 'input' });
      },
    });
  },

  quickSave() {
    const { rawInput } = this.data;
    if (!rawInput.trim()) {
      wx.showToast({ title: '请先输入内容', icon: 'none' });
      return;
    }
    const lines = rawInput.trim().split('\n');
    this._save(lines[0].slice(0, 60), lines.slice(1).join('\n').trim(), [], 'new');
  },

  backToInput() {
    this.setData({ step: 'input' });
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  removeTag(e) {
    const tags = [...this.data.tags];
    tags.splice(e.currentTarget.dataset.index, 1);
    this.setData({ tags });
  },

  onTagInputChange(e) {
    this.setData({ tagInput: e.detail.value });
  },

  onTagInputConfirm() {
    const { tagInput, tags } = this.data;
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 5) {
      this.setData({ tags: [...tags, t], tagInput: '' });
    }
  },

  onStatusSelect(e) {
    this.setData({ status: e.currentTarget.dataset.status });
  },

  confirmSave() {
    const { title, rawInput, tags, status } = this.data;
    if (!title.trim()) {
      wx.showToast({ title: '请填写标题', icon: 'none' });
      return;
    }
    const lines = rawInput.trim().split('\n');
    const content = lines.length > 1 ? lines.slice(1).join('\n').trim() : '';
    this._save(title.trim(), content, tags, status);
  },

  _save(title, content, tags, status) {
    const { id, isEdit, createdAt } = this.data;
    const now = Date.now();
    cardService.saveCard({
      id: id || cardService.uuid(),
      title,
      content,
      tags,
      status,
      createdAt: isEdit ? createdAt : now,
      updatedAt: now,
    });
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 600);
  },
});
