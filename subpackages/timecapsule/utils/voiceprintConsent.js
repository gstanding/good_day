// subpackages/timecapsule/utils/voiceprintConsent.js
// 声纹授权协议同意状态管理 + 协议正文
//
// 合规依据：《个人信息保护法》第 28/29 条，声纹属敏感个人信息，
// 须单独同意 + 独立告知。本模块管理同意状态与协议正文版本。
//
// 版本号机制：协议正文实质性修改必须 bump CURRENT_VERSION，
// isConsented() 会比较存储版本与当前版本，不一致视为未同意，
// 强制重新征询（满足第 14 条「告知事项变更需重新取得同意」）。

const STORAGE_KEY = 'VOICEPRINT_AGREEMENT_CONSENT';
const CURRENT_VERSION = '1.0';

// 协议正文 HTML（rich-text nodes）
// 九要素齐全：目的/方式/用途/存储期限/保护措施/用户权利/删除途径/第三方共享/协议变更
const AGREEMENT_HTML = `
<div style="font-size:28rpx;line-height:1.7;color:#333;">
  <p style="font-weight:bold;font-size:32rpx;margin-bottom:16rpx;">引言</p>
  <p>根据《中华人民共和国个人信息保护法》第二十八条、第二十九条规定，声纹信息属于敏感个人信息。在您使用 Kintsu「声音胶囊」录音功能前，请仔细阅读并同意本协议。</p>

  <p style="font-weight:bold;font-size:32rpx;margin:24rpx 0 16rpx;">一、收集目的</p>
  <p>仅用于在「声音胶囊」功能中创建、保存和播放您录制的声音内容，作为您在特定地理位置的声音记忆。</p>

  <p style="font-weight:bold;font-size:32rpx;margin:24rpx 0 16rpx;">二、收集方式</p>
  <p>通过您设备的麦克风，在您主动长按录音按钮时录制。仅在您主动操作时进行，不会在后台监听。</p>

  <p style="font-weight:bold;font-size:32rpx;margin:24rpx 0 16rpx;">三、使用用途</p>
  <p>1. 将录音作为声音胶囊内容，在地图对应位置展示；</p>
  <p>2. 供您本人或到达该位置的其他用户播放；</p>
  <p>3. <strong>不会</strong>用于声纹生物识别、身份验证、声纹比对；</p>
  <p>4. <strong>不会</strong>用于算法训练或自动化决策。</p>

  <p style="font-weight:bold;font-size:32rpx;margin:24rpx 0 16rpx;">四、存储期限与位置</p>
  <p>1. 录音文件通过 saveFile 存储在小程序本地沙箱，直至您主动删除；</p>
  <p>2. 胶囊元数据（标题、描述、位置、时长）通过云同步备份，便于换设备恢复；</p>
  <p>3. 删除胶囊时，对应录音文件一并删除。</p>

  <p style="font-weight:bold;font-size:32rpx;margin:24rpx 0 16rpx;">五、保护措施</p>
  <p>1. 传输使用 HTTPS 加密；</p>
  <p>2. 云端元数据仅您本人可访问，不向第三方共享；</p>
  <p>3. 录音内容不上传服务器进行生物特征分析。</p>

  <p style="font-weight:bold;font-size:32rpx;margin:24rpx 0 16rpx;">六、您的权利</p>
  <p>1. 知情权、决定权；</p>
  <p>2. 查阅、复制权；</p>
  <p>3. 更正、补充权；</p>
  <p>4. 删除权；</p>
  <p>5. 撤回同意权（可在录音页「撤回声纹授权」）；</p>
  <p>6. 投诉举报权。</p>

  <p style="font-weight:bold;font-size:32rpx;margin:24rpx 0 16rpx;">七、删除途径</p>
  <p>1. 在胶囊详情页删除胶囊，对应录音文件一并删除；</p>
  <p>2. 撤回授权仅停止后续收集，已收集数据需手动删除；</p>
  <p>3. 可联系开发者批量删除。</p>

  <p style="font-weight:bold;font-size:32rpx;margin:24rpx 0 16rpx;">八、第三方共享</p>
  <p>不会将您的声纹信息共享给任何第三方，法律法规另有规定的除外。</p>

  <p style="font-weight:bold;font-size:32rpx;margin:24rpx 0 16rpx;">九、协议变更</p>
  <p>本协议可能因法律法规或业务调整更新，更新后将在您下次录音时重新征得同意。</p>
</div>
`;

/**
 * 校验是否已同意当前版本的协议
 * @returns {boolean}
 */
const isConsented = () => {
  const data = wx.getStorageSync(STORAGE_KEY);
  return !!(data && data.consented && data.version === CURRENT_VERSION);
};

/**
 * 写入同意状态（勾选同意时调用）
 */
const setConsented = () => {
  wx.setStorageSync(STORAGE_KEY, {
    consented: true,
    consentedAt: Date.now(),
    version: CURRENT_VERSION
  });
};

/**
 * 撤回同意（撤回授权入口调用）
 */
const revoke = () => {
  wx.setStorageSync(STORAGE_KEY, {
    consented: false,
    consentedAt: 0,
    version: CURRENT_VERSION
  });
};

/**
 * 获取协议正文 HTML
 * @returns {string}
 */
const getAgreementHtml = () => AGREEMENT_HTML;

module.exports = {
  isConsented,
  setConsented,
  revoke,
  getAgreementHtml,
  CURRENT_VERSION
};
