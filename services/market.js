const axios = require('axios');
const yahooFinance = require('yahoo-finance2').default;

const cache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

// ── 腾讯财经 API (A股) ──────────────────────────────────
async function getTencentQuote(symbol) {
  try {
    const code = symbol.startsWith('6') ? `sh${symbol}` : `sz${symbol}`;
    const res = await axios.get(`https://qt.gtimg.cn/q=${code}`, {
      responseType: 'arraybuffer'
    });
    const text = new TextDecoder('gbk').decode(res.data);
    const data = text.split('~');
    if (data.length < 10) return null;
    return {
      symbol: symbol,
      name: data[1],
      price: parseFloat(data[3]),
      change: parseFloat(data[32]), // 涨跌幅 %
      volume: data[37] + '万', // 万手
      pe: data[39] || 'N/A', // 市盈率
      high: parseFloat(data[33]),
      low: parseFloat(data[34]),
      marketCap: data[45] + '亿', // 总市值
      market: 'cn'
    };
  } catch (err) {
    console.warn(`⚠️ Tencent Finance error for ${symbol}:`, err.message);
    return null;
  }
}

async function getTencentHistory(symbol, days = 90) {
  try {
    const code = symbol.startsWith('6') ? `sh${symbol}` : `sz${symbol}`;
    // 腾讯K线数据接口
    const res = await axios.get(`https://data.gtimg.cn/flashdata/hushen/daily/23/${code}.js`);
    const text = res.data;
    const lines = text.split('\\n\\').filter(l => l.includes(' '));
    // 每行格式: date open close high low volume
    const history = lines.map(line => {
      const parts = line.split(' ');
      if (parts.length < 3) return null;
      let dateStr = parts[0].replace('23', '2023'); // 腾讯接口返回短年份
      if (dateStr.length === 6) dateStr = '20' + dateStr;
      const formattedDate = `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`;
      return {
        date: formattedDate,
        price: parseFloat(parts[2])
      };
    }).filter(Boolean);
    return history.slice(-days);
  } catch (err) {
    console.warn(`⚠️ Tencent History error for ${symbol}:`, err.message);
    return [];
  }
}

// ── Yahoo Finance API (美股) ──────────────────────────
async function getYahooQuote(symbol) {
  try {
    const result = await yahooFinance.quote(symbol);
    return {
      symbol: result.symbol,
      price: result.regularMarketPrice,
      change: result.regularMarketChangePercent?.toFixed(2),
      volume: result.regularMarketVolume ? (result.regularMarketVolume / 1e6).toFixed(1) + 'M' : 'N/A',
      pe: result.trailingPE?.toFixed(1) || 'N/A',
      high: result.regularMarketDayHigh,
      low: result.regularMarketDayLow,
      marketCap: result.marketCap ? (result.marketCap / 1e9).toFixed(1) + 'B' : 'N/A',
      name: result.longName || result.shortName,
      market: 'global'
    };
  } catch (err) {
    console.warn(`⚠️ Yahoo Finance error for ${symbol}:`, err.message);
    return null;
  }
}

async function getYahooHistory(symbol, days = 90) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  try {
    const result = await yahooFinance.historical(symbol, {
      period1: start.toISOString().split('T')[0],
      period2: end.toISOString().split('T')[0],
      interval: '1d'
    });
    return result.map(r => ({
      date: r.date.toISOString().split('T')[0],
      price: parseFloat(r.close?.toFixed(2))
    }));
  } catch (err) {
    console.warn(`⚠️ Yahoo History error for ${symbol}:`, err.message);
    return [];
  }
}

// ── 统一入口 ───────────────────────────────────────────
async function getQuote(symbol) {
  const now = Date.now();
  if (cache[symbol] && now - cache[symbol].ts < CACHE_TTL) {
    return cache[symbol].data;
  }
  
  // A股代码通常是纯数字（如 600519，000858）
  const isAStock = /^[0-9]{6}$/.test(symbol);
  const data = isAStock ? await getTencentQuote(symbol) : await getYahooQuote(symbol);
  
  if (data) {
    cache[symbol] = { data, ts: now };
  }
  return data;
}

async function getHistory(symbol, days = 90) {
  const isAStock = /^[0-9]{6}$/.test(symbol);
  return isAStock ? await getTencentHistory(symbol, days) : await getYahooHistory(symbol, days);
}

// ── AI 预测模型 (简单线性回归) ────────────────────────
function predictFuture(history, days = 30) {
  if (!history || history.length < 5) return [];
  const n = history.length;
  const prices = history.map(h => h.price);
  
  // 线性回归
  const xMean = (n - 1) / 2;
  const yMean = prices.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (prices[i] - yMean);
    den += (i - xMean) ** 2;
  }
  const slope = den !== 0 ? num / den : 0;
  const intercept = yMean - slope * xMean;

  const lastDate = new Date(history[history.length - 1].date);
  const result = [];
  for (let i = 1; i <= days; i++) {
    const d = new Date(lastDate);
    d.setDate(d.getDate() + i);
    // 跳过周末
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    
    // 加入随机波动模拟真实感
    const volatility = (Math.random() - 0.5) * (yMean * 0.015);
    const predictedPrice = intercept + slope * (n + i) + volatility;
    
    result.push({
      date: d.toISOString().split('T')[0],
      price: parseFloat(predictedPrice.toFixed(2)),
      predicted: true
    });
  }
  return result;
}

module.exports = { getQuote, getHistory, predictFuture };
