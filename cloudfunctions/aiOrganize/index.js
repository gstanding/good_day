const cloud = require('wx-server-sdk');
const https = require('https');
const { MINIMAX_API_KEY } = require('./config');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { rawInput } = event;
  if (!rawInput || !rawInput.trim()) {
    return { error: 'empty_input' };
  }

  const body = JSON.stringify({
    model: 'MiniMax-M2.7',
    messages: [
      {
        role: 'system',
        content: '你是一个帮助整理灵感笔记的助手。根据用户输入内容，提取一个简洁标题（不超过20字）和2-4个相关标签（每个2-6字）。只返回JSON，格式：{"title":"...","tags":["...","..."]}，不要其他任何内容。',
      },
      { role: 'user', content: rawInput.trim() },
    ],
    max_tokens: 200,
    temperature: 0.3,
  });

  console.log('[aiOrganize] 请求开始, input:', rawInput.slice(0, 30));

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.minimaxi.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MINIMAX_API_KEY}`,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        console.log('[aiOrganize] HTTP 状态码:', res.statusCode);
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          console.log('[aiOrganize] 响应体:', data.slice(0, 200));
          try {
            const json = JSON.parse(data);
            const text = json.choices[0].message.content.trim();
            // M2.7 是思维链模型，需过滤 <think>...</think> 推理块
            const clean = text
              .replace(/<think>[\s\S]*?<\/think>/g, '')
              .replace(/```json\n?|\n?```/g, '')
              .trim();
            resolve({ result: JSON.parse(clean) });
          } catch (e) {
            console.error('[aiOrganize] 解析失败:', e.message);
            resolve({ error: 'parse_failed', raw: data.slice(0, 300) });
          }
        });
      }
    );
    req.on('error', (e) => {
      console.error('[aiOrganize] 网络错误:', e.code, e.message);
      resolve({ error: 'network_failed', code: e.code, msg: e.message });
    });
    req.setTimeout(15000, () => {
      console.error('[aiOrganize] 请求超时');
      req.destroy();
      resolve({ error: 'timeout' });
    });
    req.write(body);
    req.end();
  });
};
