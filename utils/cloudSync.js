/**
 * cloudSync.js — 封装 syncData 云函数调用
 *
 * push(type, items)  写本地 → 云端（异步，fire-and-forget，不阻塞 UI）
 * pull(type)         读云端 → 返回数组（或 null 表示该用户尚无数据）
 *
 * type: 'anniversaries' | 'flashCards' | 'capsules'
 */

const OPENID_KEY = '__kintsu_openid__';

function isLoggedIn() {
  return !!wx.getStorageSync(OPENID_KEY);
}

/**
 * 将最新数据推送到云端（不阻塞，失败静默）
 */
function push(type, items) {
  if (!isLoggedIn()) return;
  wx.cloud.callFunction({
    name: 'syncData',
    data: { action: 'push', type, items },
  }).catch(e => {
    console.error('[cloudSync] push error:', type, e);
  });
}

/**
 * 从云端拉取数据，返回 items 数组（或 null）
 */
async function pull(type) {
  try {
    const res = await wx.cloud.callFunction({
      name: 'syncData',
      data: { action: 'pull', type },
    });
    return res.result ? res.result.items : null;
  } catch (e) {
    console.error('[cloudSync] pull error:', type, e);
    return null;
  }
}

module.exports = { push, pull };
