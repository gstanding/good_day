const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/**
 * 静默登录：返回当前用户的 openid
 * 小程序端调用：wx.cloud.callFunction({ name: 'login' })
 */
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  return { openid: OPENID };
};
