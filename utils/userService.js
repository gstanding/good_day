/**
 * userService.js — 微信静默登录 + 跨设备数据恢复
 *
 * 初始同步逻辑（__kintsu_synced__ 标志控制，只跑一次）：
 *   - 本地有数据 → 全量推送到云端（兼容接入登录功能前已有数据的老用户）
 *   - 本地无数据 → 从云端拉取（换手机/重装场景）
 */

const cloudSync = require('./cloudSync');

const OPENID_KEY = '__kintsu_openid__';
// 用新 key，与旧版 __kintsu_restored__ 区分，确保老用户也能跑一次初始推送
const SYNCED_KEY = '__kintsu_synced__';

/**
 * 静默登录入口，在 app.js onLaunch 中调用
 * @returns {Promise<string|null>} openid
 */
async function login() {
  let openid = wx.getStorageSync(OPENID_KEY);

  if (!openid) {
    // 首次：调用云函数获取 openid
    try {
      const res = await wx.cloud.callFunction({ name: 'login' });
      openid = res.result && res.result.openid;
      if (!openid) return null;
      wx.setStorageSync(OPENID_KEY, openid);
    } catch (e) {
      console.error('[userService] login failed:', e);
      return null;
    }
  }

  // 初始同步（每个设备只跑一次）
  if (!wx.getStorageSync(SYNCED_KEY)) {
    await _initialSync();
  }

  return openid;
}

/**
 * 初始同步：
 *   有本地数据 → 推到云端（老用户补推、或旧设备正常使用场景）
 *   无本地数据 → 从云端拉取（新设备 / 重装）
 */
async function _initialSync() {
  const localAnn   = wx.getStorageSync('GOOD_DAY_ANNIVERSARIES') || [];
  const localFlash = wx.getStorageSync('FLASH_CARDS') || [];
  const localCap   = wx.getStorageSync('TIME_CAPSULES') || [];
  const hasLocalData = localAnn.length > 0 || localFlash.length > 0 || localCap.length > 0;

  if (hasLocalData) {
    // 本地有数据：全量推送（fire-and-forget，不阻塞）
    cloudSync.push('anniversaries', localAnn);
    cloudSync.push('flashCards', localFlash);
    cloudSync.push('capsules', localCap);
    console.log('[userService] pushed existing local data to cloud');
  } else {
    // 本地无数据：从云端恢复
    try {
      const [ann, flash, cap] = await Promise.all([
        cloudSync.pull('anniversaries'),
        cloudSync.pull('flashCards'),
        cloudSync.pull('capsules'),
      ]);
      if (ann   && ann.length   > 0) wx.setStorageSync('GOOD_DAY_ANNIVERSARIES', ann);
      if (flash && flash.length > 0) wx.setStorageSync('FLASH_CARDS', flash);
      if (cap   && cap.length   > 0) wx.setStorageSync('TIME_CAPSULES', cap);
      console.log('[userService] restored from cloud:', {
        ann: ann ? ann.length : 0,
        flash: flash ? flash.length : 0,
        cap: cap ? cap.length : 0,
      });
    } catch (e) {
      console.error('[userService] restore failed:', e);
    }
  }

  wx.setStorageSync(SYNCED_KEY, true);
}

/**
 * 获取当前 openid（同步）
 */
function getOpenid() {
  return wx.getStorageSync(OPENID_KEY) || null;
}

/**
 * 强制重新同步（调试用，或提供给用户的"手动同步"按钮）
 */
async function forceSync() {
  wx.removeStorageSync(SYNCED_KEY);
  await _initialSync();
}

module.exports = { login, getOpenid, forceSync };
