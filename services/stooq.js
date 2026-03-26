const axios = require('axios');

// stooq.com 美股实时行情（对境外IP友好，免费）
async function getUsQuote(symbol) {
  try {
    const url = `https://stooq.com/q/l/?s=${symbol.toLowerCase()}.us&f=sd2t2ohlcv&h&e=csv`;
    const res = await axios.get(url, { timeout: 5000 });
    const lines = res.data.trim().split('\n');
    if (lines.length < 2) return null;
    const parts = lines[1].split(',');
    // Symbol,Date,Time,Open,High,Low,Close,Volume
    const close  = parseFloat(parts[6]);
    const open   = parseFloat(parts[3]);
    const high   = parseFloat(parts[4]);
    const low    = parseFloat(parts[5]);
    const volume = parseInt(parts[7]);
    if (!close || close === 0) return null;
    const change = parseFloat(((close - open) / open * 100).toFixed(2));
    return {
      price: close,
      open,
      high,
      low,
      change,
      volume: volume > 1e6 ? (volume / 1e6).toFixed(1) + 'M' : (volume / 1e3).toFixed(0) + 'K',
      live: true
    };
  } catch (e) {
    return null;
  }
}

module.exports = { getUsQuote };
