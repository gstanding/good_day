const cardService = require('../../utils/cardService');

const LIFECYCLE_STAGES = [
  { key: 'new',         label: '待跟进', desc: '已收存', dot: '#6366F1', soft: '#ECECFB', ink: '#4F4FC0' },
  { key: 'in_progress', label: '进行中', desc: '在路上', dot: '#E89515', soft: '#FBEFD7', ink: '#A86200' },
  { key: 'done',        label: '已完成', desc: '已落地', dot: '#22A150', soft: '#DEF1E0', ink: '#15803D' },
];

const RIBBON_FILL = {
  new:         '0%',
  in_progress: '50%',
  done:        '100%',
  archived:    '0%',
};

const CTA_MAP = {
  new:         { cta: '准备好行动了？', btn: '推进到进行中 ›' },
  in_progress: { cta: '已经落地了吗？', btn: '标记为已完成 ›' },
  done:        { cta: '想再调整状态？', btn: '调整状态 ›' },
};

Page({
  data: {
    card: null,
    lifecycleStages: [],
    ribbonFillStyle: '0%',
    lifecycleCta: '',
    lifecycleCtaBtn: '',
    createdStr: '',
    updatedStr: '',
    statusBarH: 0,
  },

  onLoad(options) {
    this._id = options.id;
    const sys = wx.getSystemInfoSync();
    this.setData({ statusBarH: sys.statusBarHeight || 20 });
    this._loadCard(options.id);
  },

  onShow() {
    if (this._id) this._loadCard(this._id);
  },

  _loadCard(id) {
    const raw = cardService.getCardById(id);
    if (!raw) {
      wx.showToast({ title: '卡片不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }
    const card = cardService.enrichCard(raw);

    const activeIdx = LIFECYCLE_STAGES.findIndex(s => s.key === card.status);
    const lifecycleStages = activeIdx >= 0
      ? LIFECYCLE_STAGES.map((s, i) => ({
          ...s,
          reached:   i <= activeIdx,
          isCurrent: i === activeIdx,
        }))
      : [];

    const ctaInfo = CTA_MAP[card.status] || {};

    this.setData({
      card,
      lifecycleStages,
      ribbonFillStyle: RIBBON_FILL[card.status] || '0%',
      lifecycleCta:    ctaInfo.cta || '',
      lifecycleCtaBtn: ctaInfo.btn || '',
      createdStr:  this._fmtDate(raw.createdAt),
      updatedStr:  this._fmtDate(raw.updatedAt || raw.createdAt),
    });
  },

  _fmtDate(ts) {
    const d = new Date(ts);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${d.getMonth() + 1}月${d.getDate()}日 · ${h}:${m}`;
  },

  goBack() {
    wx.navigateBack();
  },

  goEdit() {
    wx.navigateTo({ url: `../edit/edit?id=${this._id}` });
  },

  advanceStatus() {
    const { card } = this.data;
    if (!card) return;
    const ADVANCE = { new: 'in_progress', in_progress: 'done' };
    const next = ADVANCE[card.status];
    if (!next) {
      wx.showActionSheet({
        itemList: ['标记为进行中', '标记为待跟进'],
        success: (res) => {
          const statuses = ['in_progress', 'new'];
          this._setStatus(statuses[res.tapIndex]);
        },
      });
      return;
    }
    this._setStatus(next);
  },

  _setStatus(status) {
    const raw = cardService.getCardById(this._id);
    if (!raw) return;
    cardService.saveCard({ ...raw, status, updatedAt: Date.now() });
    this._loadCard(this._id);
  },

  showMoreMenu() {
    wx.showActionSheet({
      itemList: ['删除胶囊'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.showModal({
            title: '确认删除',
            content: '删除后无法恢复',
            confirmColor: '#FF3B30',
            success: (r) => {
              if (r.confirm) {
                cardService.deleteCard(this._id);
                wx.navigateBack();
              }
            },
          });
        }
      },
    });
  },
});
