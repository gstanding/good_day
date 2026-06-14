const cloudSync = require('../../../utils/cloudSync');

const KEY = 'GOOD_DAY_ANNIVERSARIES';

const getItems = () => {
  try {
    return wx.getStorageSync(KEY) || [];
  } catch (e) {
    return [];
  }
}

const saveItem = (item) => {
  const items = getItems();
  const index = items.findIndex(i => i.id === item.id);
  if (index > -1) {
    items[index] = item;
  } else {
    items.push(item);
  }
  wx.setStorageSync(KEY, items);
  cloudSync.push('anniversaries', items);
  return items;
}

const deleteItem = (id) => {
  let items = getItems();
  items = items.filter(i => i.id !== id);
  wx.setStorageSync(KEY, items);
  cloudSync.push('anniversaries', items);
  return items;
}

const getItem = (id) => {
  const items = getItems();
  return items.find(i => i.id === id);
}

module.exports = {
  getItems,
  saveItem,
  deleteItem,
  getItem
}
