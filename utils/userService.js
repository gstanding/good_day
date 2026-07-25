/**
 * userService.js — 微信静默登录 + 跨设备数据恢复
 *
 * ⚠️ 云开发已停用，所有方法已降级为空操作（no-op）。
 * 调用方（app.js）已移除 login() 调用，此文件保留仅为兼容已有 require。
 *
 * 如需恢复：
 *   1. 在 app.js 中恢复 wx.cloud.init(...) 和 userService.login() 调用
 *   2. 将下方方法体替换为原始云函数调用逻辑
 */

const OPENID_KEY = '__kintsu_openid__';
const SYNCED_KEY = '__kintsu_synced__';

/**
 * 静默登录 — 已降级为空操作（云开发停用）
 * @returns {Promise<null>}
 */
async function login() {
  // no-op: 云开发已停用
  return null;
}

/**
 * 获取当前 openid — 已降级（云开发停用）
 * @returns {null}
 */
function getOpenid() {
  return null;
}

/**
 * 强制重新同步 — 已降级为空操作（云开发停用）
 */
async function forceSync() {
  // no-op: 云开发已停用
}

module.exports = { login, getOpenid, forceSync };
