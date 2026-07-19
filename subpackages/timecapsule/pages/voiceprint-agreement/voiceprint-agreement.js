// subpackages/timecapsule/pages/voiceprint-agreement/voiceprint-agreement.js
const voiceprintConsent = require('../../utils/voiceprintConsent');

Page({
  data: {
    agreed: false,
    agreementHtml: ''
  },

  onLoad() {
    this.setData({
      agreementHtml: voiceprintConsent.getAgreementHtml()
    });
  },

  toggleAgree() {
    this.setData({ agreed: !this.data.agreed });
  },

  onConsent() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先勾选同意', icon: 'none' });
      return;
    }
    voiceprintConsent.setConsented();
    wx.showToast({ title: '授权成功', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 800);
  },

  onReject() {
    wx.showToast({ title: '未同意协议，无法录音', icon: 'none' });
    setTimeout(() => wx.navigateBack(), 800);
  }
});
