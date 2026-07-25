/**
 * cloudSync.js — 封装 syncData 云函数调用
 *
 * ⚠️ 云开发已停用，push/pull 已降级为空操作（no-op）。
 * 所有数据仅存本地 Storage，调用方无需改动。
 *
 * 如需恢复云同步：
 *   1. 在 app.js 中恢复 wx.cloud.init(...)
 *   2. 将下方 push/pull 函数体替换为 wx.cloud.callFunction 调用
 *
 * type: 'anniversaries' | 'flashCards' | 'capsules'
 */

const OPENID_KEY = '__kintsu_openid__';

function isLoggedIn() {
  return !!wx.getStorageSync(OPENID_KEY);
}

/**
 * 推送到云端 — 已降级为空操作（云开发停用）
 */
function push(type, items) {
  // no-op: 云开发已停用，数据仅存本地
}

/**
 * 从云端拉取 — 已降级为空操作（云开发停用）
 * @returns {Promise<null>}
 */
async function pull(type) {
  // no-op: 云开发已停用，返回 null 表示无云端数据
  return null;
}

module.exports = { push, pull };
