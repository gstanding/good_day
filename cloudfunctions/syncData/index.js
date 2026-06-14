const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/**
 * 数据同步云函数
 *
 * event.action: 'push' | 'pull'
 * event.type:   'anniversaries' | 'flashCards' | 'capsules'
 * event.items:  数据数组（push 时传入）
 *
 * 每个用户在各集合中有唯一一条文档，_id = openid，由云函数侧写入。
 * 安全性：openid 由 cloud.getWXContext() 获取，客户端无法伪造。
 */

const COLLECTIONS = {
  anniversaries: 'kintsu_anniversaries',
  flashCards: 'kintsu_flash_cards',
  capsules: 'kintsu_capsules',
};

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return { error: 'no_openid' };

  const db = cloud.database();
  const { action, type, items } = event;

  const colName = COLLECTIONS[type];
  if (!colName) return { error: 'invalid_type' };

  const col = db.collection(colName);

  // ── 推送：本地 → 云端 ──────────────────────────────
  if (action === 'push') {
    // set() 是真正的 upsert：
    //   - 文档存在（_id = OPENID）→ 整体替换
    //   - 文档不存在 → 以 OPENID 为 _id 新建
    // 注意：update() 在文档不存在时不抛异常，只返回 { stats: { updated: 0 } }，
    //       所以不能用 update + catch(add) 的写法。
    try {
      await col.doc(OPENID).set({
        data: {
          items,
          updatedAt: db.serverDate(),
        },
      });
      return { success: true };
    } catch (e) {
      console.error('[syncData] push failed:', type, e);
      return { error: 'push_failed', detail: String(e) };
    }
  }

  // ── 拉取：云端 → 本地 ──────────────────────────────
  if (action === 'pull') {
    try {
      const res = await col.doc(OPENID).get();
      return { items: res.data.items || [] };
    } catch (e) {
      // 该用户尚无数据（新用户或第一次使用）
      return { items: null };
    }
  }

  return { error: 'invalid_action' };
};
