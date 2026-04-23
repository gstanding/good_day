// pages/home/home.js

const THEMES = {
  minimal: {
    key: 'minimal', name: '极简白', hint: '干净·克制',
    swatch0: '#F4F4F6', swatch1: '#FFFFFF', swatch2: '#1C1C1E',
    dark: false,
    pageBg: '#F4F4F6', navBg: '#F4F4F6', navText: 'black',
    card: '#FFFFFF', cardBorder: 'none',
    cardShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)',
    text: '#1C1C1E', textMuted: 'rgba(60,60,67,0.55)', textDim: 'rgba(60,60,67,0.42)',
    sectionLabel: 'rgba(60,60,67,0.45)', divider: 'rgba(60,60,67,0.1)',
    chevron: 'rgba(60,60,67,0.3)', subtitle: '让生活更简单',
    heroBg: 'linear-gradient(135deg, #FFFFFF 0%, #F7F7F9 100%)',
    heroText: '#1C1C1E', heroAccent: '#FF3B30', heroMuted: 'rgba(60,60,67,0.65)',
    heroShadow: '0 8px 20px rgba(0,0,0,0.06)',
    comingBg: 'rgba(255,255,255,0.5)', comingBorderColor: 'rgba(60,60,67,0.15)',
    btnBg: 'rgba(255,255,255,0.85)', btnBorder: 'rgba(0,0,0,0.06)',
    sheetBg: '#FFFFFF', sheetText: '#1C1C1E', sheetSec: 'rgba(60,60,67,0.55)',
    handle: 'rgba(60,60,67,0.18)', themeCardBg: 'rgba(250,250,252,0.7)',
    iconComingBg: '#E9E9EC', iconComingPlus: '#3C3C43',
  },
  cream: {
    key: 'cream', name: '暖意奶油', hint: '温暖·治愈',
    swatch0: '#FAF6F0', swatch1: '#F5D5B8', swatch2: '#2B2318',
    dark: false,
    pageBg: '#FAF6F0', navBg: '#FAF6F0', navText: 'black',
    card: 'rgba(255,255,255,0.62)', cardBorder: '1px solid rgba(154,139,114,0.18)',
    cardShadow: '0 1px 3px rgba(120,80,40,0.04)',
    text: '#2B2318', textMuted: 'rgba(43,35,24,0.55)', textDim: 'rgba(43,35,24,0.4)',
    sectionLabel: '#9A8B72', divider: 'rgba(154,139,114,0.18)',
    chevron: 'rgba(154,139,114,0.5)', subtitle: '让日子慢下来',
    heroBg: 'linear-gradient(135deg, #F5D5B8 0%, #EDB896 100%)',
    heroText: '#2B1810', heroAccent: '#7A4A28', heroMuted: 'rgba(43,24,16,0.65)',
    heroShadow: '0 8px 24px rgba(120,80,40,0.14)',
    comingBg: 'rgba(255,255,255,0.3)', comingBorderColor: 'rgba(154,139,114,0.28)',
    btnBg: 'rgba(255,255,255,0.75)', btnBorder: 'rgba(154,139,114,0.2)',
    sheetBg: '#FFFFFF', sheetText: '#2B2318', sheetSec: 'rgba(43,35,24,0.55)',
    handle: 'rgba(154,139,114,0.25)', themeCardBg: 'rgba(250,246,240,0.8)',
    iconComingBg: 'rgba(154,139,114,0.12)', iconComingPlus: '#9A8B72',
  },
  tape: {
    key: 'tape', name: '磁带蓝', hint: '怀旧·质感',
    swatch0: '#EEF1F7', swatch1: '#1E3A8A', swatch2: '#FFFFFF',
    dark: false,
    pageBg: '#EEF1F7', navBg: '#EEF1F7', navText: 'black',
    card: '#FFFFFF', cardBorder: '1px solid rgba(30,58,138,0.08)',
    cardShadow: '0 2px 4px rgba(30,58,138,0.06), 0 8px 20px rgba(30,58,138,0.06)',
    text: '#0F1F44', textMuted: 'rgba(15,31,68,0.55)', textDim: 'rgba(15,31,68,0.4)',
    sectionLabel: '#5A6A8A', divider: 'rgba(30,58,138,0.1)',
    chevron: 'rgba(30,58,138,0.35)', subtitle: '每一份时光值得收藏',
    heroBg: 'linear-gradient(135deg, #1E3A8A 0%, #1D6BF0 100%)',
    heroText: '#FFFFFF', heroAccent: '#30D0FF', heroMuted: 'rgba(255,255,255,0.7)',
    heroShadow: '0 10px 30px rgba(30,58,138,0.28)',
    comingBg: 'transparent', comingBorderColor: 'rgba(30,58,138,0.18)',
    btnBg: 'rgba(255,255,255,0.75)', btnBorder: 'rgba(30,58,138,0.1)',
    sheetBg: '#FFFFFF', sheetText: '#0F1F44', sheetSec: 'rgba(15,31,68,0.55)',
    handle: 'rgba(30,58,138,0.15)', themeCardBg: 'rgba(238,241,247,0.8)',
    iconComingBg: 'rgba(30,58,138,0.07)', iconComingPlus: '#5A6A8A',
  },
  midnight: {
    key: 'midnight', name: '深夜黑', hint: '年轻·高对比',
    swatch0: '#0B0B0D', swatch1: '#17171B', swatch2: '#FFD60A',
    dark: true,
    pageBg: '#0B0B0D', navBg: '#0B0B0D', navText: 'white',
    card: '#17171B', cardBorder: '1px solid rgba(255,255,255,0.06)',
    cardShadow: 'none',
    text: '#FFFFFF', textMuted: 'rgba(255,255,255,0.6)', textDim: 'rgba(255,255,255,0.4)',
    sectionLabel: '#8B8B94', divider: 'rgba(255,255,255,0.08)',
    chevron: 'rgba(255,255,255,0.4)', subtitle: 'Let your life breathe.',
    heroBg: 'linear-gradient(135deg, #1F1F24 0%, #111114 100%)',
    heroText: '#FFFFFF', heroAccent: '#FFD60A', heroMuted: 'rgba(255,255,255,0.6)',
    heroShadow: 'none',
    comingBg: 'transparent', comingBorderColor: 'rgba(255,255,255,0.1)',
    btnBg: 'rgba(255,255,255,0.08)', btnBorder: 'rgba(255,255,255,0.12)',
    sheetBg: '#17171B', sheetText: '#FFFFFF', sheetSec: 'rgba(255,255,255,0.55)',
    handle: 'rgba(255,255,255,0.18)', themeCardBg: 'rgba(255,255,255,0.03)',
    iconComingBg: 'rgba(255,255,255,0.06)', iconComingPlus: 'rgba(255,255,255,0.55)',
  },
};

const THEME_LIST = Object.values(THEMES);

Page({
  data: {
    themeKey: 'minimal',
    t: THEMES.minimal,
    themes: THEME_LIST,
    pickerOpen: false,
    hasAnniversary: false,
    heroTitle: '',
    heroDays: 0,
    heroDate: '',
    annMeta: '',
    capMeta: '',
  },

  onShow() {
    const saved = wx.getStorageSync('toolkit-theme') || 'minimal';
    this._applyTheme(saved, false);
    this._loadStats();
  },

  _applyTheme(key, save = true) {
    const t = THEMES[key] || THEMES.minimal;
    this.setData({ themeKey: key, t });
    if (save) wx.setStorageSync('toolkit-theme', key);
    wx.setNavigationBarColor({
      frontColor: t.dark ? '#ffffff' : '#000000',
      backgroundColor: t.navBg,
      animation: { duration: 300, timingFunc: 'easeIn' },
    });
    wx.setBackgroundColor({ backgroundColor: t.pageBg });
  },

  // ── 数据加载 ──────────────────────────────────────

  _loadStats() {
    this._loadAnniversary();
    this._loadCapsule();
  },

  _loadAnniversary() {
    try {
      const items = wx.getStorageSync('GOOD_DAY_ANNIVERSARIES') || [];
      // 注意：mode 字段为 'countDown'（大写 D）
      const countdowns = items.filter(i => i.mode === 'countDown');

      if (!countdowns.length) {
        this.setData({ hasAnniversary: false, annMeta: '' });
        return;
      }

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      let best = null, bestDays = Infinity;

      countdowns.forEach(item => {
        const next = this._calcNextOccurrence(item.date, item.cycle || 'year');
        if (!next) return;
        const days = Math.ceil((next - now) / 86400000);
        if (days >= 0 && days < bestDays) {
          bestDays = days;
          best = { item, days, next };
        }
      });

      if (best) {
        const m = best.next.getMonth() + 1;
        const d = best.next.getDate();
        this.setData({
          hasAnniversary: true,
          heroTitle: best.item.title,
          heroDays: best.days,
          heroDate: `${m}月${d}日`,
          annMeta: best.days === 0 ? '就是今天' : `距下一个 ${best.days} 天`,
        });
      } else {
        this.setData({ hasAnniversary: false, annMeta: '' });
      }
    } catch (e) {
      this.setData({ hasAnniversary: false, annMeta: '' });
    }
  },

  // 仅支持公历，覆盖绝大多数场景；农历倒计时用近似值
  _calcNextOccurrence(dateStr, cycle) {
    const parts = dateStr.split('-').map(Number);
    if (parts.length < 3) return null;
    const [, month, day] = parts;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (cycle === 'week') {
      const origin = new Date(parts[0], month - 1, day);
      const targetDow = origin.getDay();
      const todayDow = now.getDay();
      let diff = (targetDow - todayDow + 7) % 7;
      if (diff === 0) diff = 7; // 同一天算下周
      const next = new Date(now);
      next.setDate(now.getDate() + diff);
      return next;
    }

    if (cycle === 'month') {
      const next = new Date(now.getFullYear(), now.getMonth(), day);
      if (next <= now) next.setMonth(next.getMonth() + 1);
      return next;
    }

    // year（默认）
    const next = new Date(now.getFullYear(), month - 1, day);
    if (next < now) next.setFullYear(next.getFullYear() + 1);
    return next;
  },

  _loadCapsule() {
    try {
      const capsules = wx.getStorageSync('TIME_CAPSULES') || [];
      const mine = capsules.filter(c => c.isMine && !c.isMock);
      this.setData({ capMeta: mine.length > 0 ? `${mine.length} 个胶囊` : '' });
    } catch (e) {
      this.setData({ capMeta: '' });
    }
  },

  // ── 主题 ──────────────────────────────────────────

  openPicker() {
    this.setData({ pickerOpen: true });
  },

  closePicker() {
    this.setData({ pickerOpen: false });
  },

  selectTheme(e) {
    const key = e.currentTarget.dataset.key;
    this._applyTheme(key);
    setTimeout(() => this.setData({ pickerOpen: false }), 180);
  },

  // ── 导航 ──────────────────────────────────────────

  goAnniversary() {
    wx.navigateTo({ url: '/subpackages/anniversary/pages/index/index' });
  },

  // Hero 卡点击：有纪念日时进列表，无时也进列表（可添加）
  goHero() {
    wx.navigateTo({ url: '/subpackages/anniversary/pages/index/index' });
  },

  goCapsule() {
    wx.navigateTo({ url: '/subpackages/timecapsule/pages/map/map' });
  },
});
