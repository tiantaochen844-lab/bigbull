const axios = require('axios');

// 腾讯财经实时行情（GBK编码，对境外IP友好）
async function getSinaQuote(sinaCode) {
  try {
    const res = await axios.get(`https://qt.gtimg.cn/q=${sinaCode}`, {
      timeout: 5000,
      responseType: 'arraybuffer'
    });
    // 腾讯财经返回 GBK 编码
    const raw = Buffer.from(res.data).toString('binary');
    const match = raw.match(/="([^"]+)"/);
    if (!match) return null;
    const parts = match[1].split('~');
    if (parts.length < 40) return null;

    const price     = parseFloat(parts[3]);
    const prevClose = parseFloat(parts[4]);
    const high      = parseFloat(parts[33]);
    const low       = parseFloat(parts[34]);
    const change    = parseFloat(parts[32]);  // 涨跌幅%
    const volume    = parseFloat(parts[36]);  // 手
    const pe        = parseFloat(parts[39]);

    if (!price || price === 0) return null;

    return {
      price,
      prevClose,
      high,
      low,
      change,
      volume: (volume / 100).toFixed(0) + '万',
      pe: isNaN(pe) ? '--' : pe.toFixed(2),
      live: true
    };
  } catch (e) {
    return null;
  }
}

module.exports = { getSinaQuote };
