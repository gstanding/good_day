const KEY = 'FLASH_CARDS';
const DAILY_KEY = 'FLASH_DAILY_CARD';

const STATUS_LABELS = {
  new: '待跟进',
  in_progress: '进行中',
  done: '已完成',
  archived: '已归档',
};

const STATUS_COLORS = {
  new: '#6366F1',
  in_progress: '#F59E0B',
  done: '#22C55E',
  archived: '#8E8E93',
};

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getCards() {
  return wx.getStorageSync(KEY) || [];
}

function saveCard(card) {
  const cards = getCards();
  const idx = cards.findIndex(c => c.id === card.id);
  if (idx > -1) {
    cards[idx] = card;
  } else {
    cards.unshift(card);
  }
  wx.setStorageSync(KEY, cards);
}

function deleteCard(id) {
  wx.setStorageSync(KEY, getCards().filter(c => c.id !== id));
}

function getCardById(id) {
  return getCards().find(c => c.id === id) || null;
}

function searchCards(query, tag, status) {
  let cards = getCards();
  if (status && status !== 'all') {
    cards = cards.filter(c => c.status === status);
  }
  if (tag) {
    cards = cards.filter(c => c.tags && c.tags.includes(tag));
  }
  if (query) {
    const q = query.toLowerCase();
    cards = cards.filter(c =>
      c.title.toLowerCase().includes(q) ||
      (c.content && c.content.toLowerCase().includes(q))
    );
  }
  return cards;
}

function getDailyCard() {
  const cards = getCards().filter(c => c.status !== 'archived');
  if (!cards.length) return null;
  const today = new Date().toDateString();
  const saved = wx.getStorageSync(DAILY_KEY) || {};
  if (saved.date === today) {
    const found = cards.find(c => c.id === saved.id);
    if (found) return found;
  }
  const card = cards[Math.floor(Math.random() * cards.length)];
  wx.setStorageSync(DAILY_KEY, { date: today, id: card.id });
  return card;
}

function enrichCard(card) {
  return {
    ...card,
    statusLabel: STATUS_LABELS[card.status] || card.status,
    statusColor: STATUS_COLORS[card.status] || '#8E8E93',
    relTimeStr: relTime(card.updatedAt || card.createdAt),
  };
}

function relTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)} 天前`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

module.exports = {
  uuid,
  getCards,
  saveCard,
  deleteCard,
  getCardById,
  searchCards,
  getDailyCard,
  enrichCard,
  STATUS_LABELS,
  STATUS_COLORS,
};
