const cloud = require('wx-server-sdk');
const https = require('https');
const { DEEPSEEK_API_KEY } = require('./config');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { rawInput } = event;
  if (!rawInput || !rawInput.trim()) {
    return { error: 'empty_input' };
  }

  const body = JSON.stringify({
    model: 'deepseek-chat',
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

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.deepseek.com',
        path: '/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const text = json.choices[0].message.content.trim();
            resolve({ result: JSON.parse(text) });
          } catch (e) {
            resolve({ error: 'parse_failed' });
          }
        });
      }
    );
    req.on('error', () => resolve({ error: 'network_failed' }));
    req.write(body);
    req.end();
  });
};
