const cardService = require('../../utils/cardService');

const DEEPSEEK_KEY = 'DEEPSEEK_API_KEY';

const STATUS_OPTIONS = [
  { value: 'new', label: '待跟进', color: '#6366F1' },
  { value: 'in_progress', label: '进行中', color: '#F59E0B' },
  { value: 'done', label: '已完成', color: '#22C55E' },
  { value: 'archived', label: '已归档', color: '#8E8E93' },
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
    apiKeyVisible: false,
    apiKeyInput: '',
  },

  onLoad(options) {
    if (options.id) {
      const card = cardService.getCardById(options.id);
      if (card) {
        wx.setNavigationBarTitle({ title: '编辑灵感' });
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

  onRawInput(e) {
    this.setData({ rawInput: e.detail.value });
  },

  aiOrganize() {
    const { rawInput } = this.data;
    if (!rawInput.trim()) {
      wx.showToast({ title: '请先输入内容', icon: 'none' });
      return;
    }
    const apiKey = wx.getStorageSync(DEEPSEEK_KEY);
    if (!apiKey) {
      this.setData({ apiKeyVisible: true });
      return;
    }
    this.setData({ step: 'loading' });
    wx.request({
      url: 'https://api.deepseek.com/chat/completions',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      data: {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个帮助整理灵感笔记的助手。根据用户输入内容，提取一个简洁标题（不超过20字）和2-4个相关标签（每个2-6字）。只返回JSON，格式：{"title":"...","tags":["...","..."]}，不要其他任何内容。',
          },
          { role: 'user', content: rawInput.trim() },
        ],
        max_tokens: 200,
        temperature: 0.3,
      },
      success: (res) => {
        try {
          const text = res.data.choices[0].message.content.trim();
          const json = JSON.parse(text);
          this.setData({
            step: 'preview',
            title: json.title || '',
            tags: (json.tags || []).slice(0, 5),
          });
        } catch (e) {
          wx.showToast({ title: 'AI 解析失败，请手动填写', icon: 'none' });
          this.setData({
            step: 'preview',
            title: rawInput.trim().split('\n')[0].slice(0, 30),
            tags: [],
          });
        }
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

  onApiKeyInput(e) {
    this.setData({ apiKeyInput: e.detail.value });
  },

  saveApiKey() {
    const { apiKeyInput } = this.data;
    if (!apiKeyInput.trim()) return;
    wx.setStorageSync(DEEPSEEK_KEY, apiKeyInput.trim());
    this.setData({ apiKeyVisible: false, apiKeyInput: '' });
    wx.showToast({ title: 'Key 已保存', icon: 'success' });
    setTimeout(() => this.aiOrganize(), 400);
  },

  cancelApiKey() {
    this.setData({ apiKeyVisible: false });
  },
});
