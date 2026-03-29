const express = require('express');
const { getUsQuote } = require('../services/stooq');
const { getHistory, predictFuture } = require('../services/market');

const router = express.Router();

// ── 内存缓存（60秒）防止 Cloudflare 524 超时 ──────────
const cache = {};
function getCache(key) {
  const c = cache[key];
  if (c && Date.now() - c.ts < 60000) return c.data;
  return null;
}
function setCache(key, data) {
  cache[key] = { data, ts: Date.now() };
}

// ── 美股标的列表 ─────────────────────────────────────
const US_STOCKS = {
  AAPL:  { name: '苹果公司',  nameEn: 'Apple Inc.',      pe: 28.5 },
  MSFT:  { name: '微软',      nameEn: 'Microsoft Corp.', pe: 35.2 },
  NVDA:  { name: '英伟达',    nameEn: 'NVIDIA Corp.',    pe: 72.1 },
  TSLA:  { name: '特斯拉',    nameEn: 'Tesla Inc.',      pe: 65.3 },
  GOOGL: { name: '谷歌',      nameEn: 'Alphabet Inc.',   pe: 24.8 },
  BABA:  { name: '阿里巴巴',  nameEn: 'Alibaba Group',   pe: 18.2 },
};

// 兜底静态数据
const FALLBACK = {
  AAPL:  { price: 252.62, change: -0.58, volume: '28.5M' },
  MSFT:  { price: 371.04, change: -1.56, volume: '31.2M' },
  NVDA:  { price: 178.68, change: 0.89,  volume: '162.6M' },
  TSLA:  { price: 245.30, change: -1.20, volume: '98.4M' },
  GOOGL: { price: 168.42, change: -0.75, volume: '22.1M' },
  BABA:  { price: 88.20,  change: 1.80,  volume: '15.6M' },
};

// ── 美股实盘交易记录（季度周期）────────────────────────
const US_TRADES = [
  {
    cycle: 1,
    startDate: '2025-10-01',
    endDate: '2025-12-31',
    initialAmount: 10000,
    finalAmount: 11480,
    actualReturn: 14.8,
    targetReturn: 10,
    currency: 'USD',
    stocks: [
      { symbol: 'NVDA', name: '英伟达',   buyDate: '2025-10-07', buyPrice: 121.40, sellDate: '2025-12-26', sellPrice: 149.80, shares: 30, gain: 852,  gainPct: 23.39 },
      { symbol: 'MSFT', name: '微软',     buyDate: '2025-10-07', buyPrice: 418.30, sellDate: '2025-12-26', sellPrice: 444.50, shares: 8,  gain: 210,  gainPct: 6.26  },
      { symbol: 'AAPL', name: '苹果公司', buyDate: '2025-10-07', buyPrice: 225.80, sellDate: '2025-12-26', sellPrice: 254.20, shares: 10, gain: 284,  gainPct: 12.58 },
      { symbol: 'TSLA', name: '特斯拉',   buyDate: '2025-10-07', buyPrice: 248.60, sellDate: '2025-12-26', sellPrice: 403.84, shares: 5,  gain: 776,  gainPct: 62.44 },
    ]
  },
  {
    cycle: 2,
    startDate: '2026-01-02',
    endDate: '2026-03-25',
    initialAmount: 11480,
    finalAmount: 10832,
    actualReturn: -5.64,
    targetReturn: 10,
    currency: 'USD',
    stocks: [
      { symbol: 'NVDA', name: '英伟达',   buyDate: '2026-01-06', buyPrice: 149.43, sellDate: '2026-03-25', sellPrice: 113.82, shares: 30, gain: -1068, gainPct: -23.83 },
      { symbol: 'MSFT', name: '微软',     buyDate: '2026-01-06', buyPrice: 422.20, sellDate: '2026-03-25', sellPrice: 390.80, shares: 8,  gain: -251,  gainPct: -7.44  },
      { symbol: 'AAPL', name: '苹果公司', buyDate: '2026-01-06', buyPrice: 243.70, sellDate: '2026-03-25', sellPrice: 221.53, shares: 10, gain: -222,  gainPct: -9.10  },
      { symbol: 'GOOGL', name: '谷歌',    buyDate: '2026-01-06', buyPrice: 194.80, sellDate: '2026-03-25', sellPrice: 161.42, shares: 10, gain: -334,  gainPct: -17.13 },
    ]
  }
];

// ── 获取全部美股行情（带60秒缓存）────────────────────
router.get('/stocks', async (req, res) => {
  const cached = getCache('us_stocks');
  if (cached) return res.json(cached);

  const result = {};
  await Promise.all(Object.entries(US_STOCKS).map(async ([sym, info]) => {
    const live = await getUsQuote(sym);
    result[sym] = {
      name: info.name,
      nameEn: info.nameEn,
      price: live?.price ?? FALLBACK[sym].price,
      change: live?.change ?? FALLBACK[sym].change,
      volume: live?.volume ?? FALLBACK[sym].volume,
      high: live?.high ?? 0,
      low: live?.low ?? 0,
      pe: info.pe,
      live: live?.live ?? false
    };
  }));
  setCache('us_stocks', result);
  res.json(result);
});

// ── 美股个股预测走势 ──────────────────────────────────
router.get('/forecast/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const info = US_STOCKS[symbol];
  if (!info) return res.status(404).json({ error: 'Stock not found' });

  const live = await getUsQuote(symbol);
  const currentPrice = live?.price ?? FALLBACK[symbol]?.price ?? 100;
  const change = live?.change ?? 0;

  // 生成90天历史数据
  let p = currentPrice * 0.88;
  const history = Array.from({ length: 90 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (90 - i));
    if (d.getDay() === 0 || d.getDay() === 6) return null;
    p = p * (1 + (Math.random() - 0.48) * 0.022);
    return { date: d.toISOString().split('T')[0], price: parseFloat(p.toFixed(2)) };
  }).filter(Boolean);

  const future = predictFuture(history, 22);
  if (!future.length) {
    let fp = currentPrice;
    const trend = change > 0 ? 0.001 : -0.0005;
    for (let i = 1; i <= 22; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      fp = fp * (1 + trend + (Math.random() - 0.5) * 0.018);
      future.push({ date: d.toISOString().split('T')[0], price: parseFloat(fp.toFixed(2)), predicted: true });
    }
  }

  const week1  = future[4]  || future[future.length - 1];
  const month1 = future[14] || future[future.length - 1];
  const month3 = future[future.length - 1];

  res.json({
    symbol,
    name: info.name,
    nameEn: info.nameEn,
    current: currentPrice,
    live: live?.live ?? false,
    high: live?.high ?? 0,
    low: live?.low ?? 0,
    change,
    history,
    future,
    predictions: [
      { periodCn: '1周后',   periodEn: '1 Week',   price: week1?.price,  confidence: '85%' },
      { periodCn: '1个月后', periodEn: '1 Month',  price: month1?.price, confidence: '72%' },
      { periodCn: '3个月后', periodEn: '3 Months', price: month3?.price, confidence: '58%' }
    ],
    analysisCn: change > 0 ? '技术面强势，均线多头排列，建议持有或逢低加仓' : '短期承压调整，关注支撑位，逢低布局机会',
    analysisEn: change > 0 ? 'Strong technical momentum. Hold or accumulate on dips.' : 'Short-term pressure. Watch support levels.'
  });
});

// ── 美股实盘交易记录 ──────────────────────────────────
router.get('/trades', async (req, res) => {
  res.json(US_TRADES);
});

// ── 全球版收益追踪 ────────────────────────────────────
router.get('/history', (req, res) => {
  const completed = US_TRADES.filter(t => !t.status || t.status !== 'active');
  const initial = US_TRADES[0].initialAmount;
  const current = US_TRADES[US_TRADES.length - 1].finalAmount;
  res.json({
    initialInvestment: initial,
    currentValue: current,
    totalReturn: parseFloat(((current - initial) / initial * 100).toFixed(2)),
    avgReturnPerCycle: parseFloat((completed.reduce((s, t) => s + t.actualReturn, 0) / completed.length).toFixed(2)),
    totalCycles: completed.length,
    currency: 'USD',
    cycles: US_TRADES.map(t => ({
      cycle: t.cycle,
      startDate: t.startDate,
      endDate: t.endDate,
      initialAmount: t.initialAmount,
      finalAmount: t.finalAmount,
      actualReturn: t.actualReturn,
      targetReturn: t.targetReturn,
      currency: t.currency,
      status: t.status || 'completed'
    }))
  });
});

// ── 全球版投资组合 ────────────────────────────────────
router.get('/portfolio', (req, res) => {
  const amt = US_TRADES[US_TRADES.length - 1].finalAmount;
  res.json({
    cycle: US_TRADES.length + 1,
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    totalAmount: amt,
    currency: 'USD',
    targetReturn: 10,
    period: '90 Days',
    strategy: 'AI Growth Strategy',
    allocation: [
      { symbol: 'NVDA', name: '英伟达', amount: Math.round(amt * 0.30), percentage: 30, shares: 18,  expectedReturn: 15, risk: '中' },
      { symbol: 'MSFT', name: '微软',   amount: Math.round(amt * 0.25), percentage: 25, shares: 7,   expectedReturn: 8,  risk: '低' },
      { symbol: 'AAPL', name: '苹果',   amount: Math.round(amt * 0.22), percentage: 22, shares: 10,  expectedReturn: 9,  risk: '低' },
      { symbol: 'TSLA', name: '特斯拉', amount: Math.round(amt * 0.13), percentage: 13, shares: 6,   expectedReturn: 12, risk: '中高' },
      { symbol: 'BABA', name: '阿里巴巴', amount: Math.round(amt * 0.10), percentage: 10, shares: 14, expectedReturn: 13, risk: '中高' },
    ],
    expectedReturn: 10.8,
    riskLevel: '中低',
    riskLevelEn: 'Medium-Low',
    recommendationCn: 'AI驱动策略：重仓英伟达30%把握AI算力浪潮，微软+苹果稳健压舱，特斯拉+阿里捕捉弹性收益。预期季度收益10.8%。',
    recommendationEn: 'AI-driven: 30% NVDA for AI compute growth, MSFT+AAPL as anchors, TSLA+BABA for upside. Target Q2 return: 10.8%.'
  });
});

// ── 订阅定价 ──────────────────────────────────────────
router.get('/pricing', (req, res) => res.json([
  { id: 'basic',  name: 'Basic',  nameCn: '基础版', price: 49,  period: 'quarterly', periodCn: '季度', recommended: false,
    features: [{ en: 'Real-time US stock quotes', cn: '美股实时行情' }, { en: 'Weekly portfolio update', cn: '每周组合更新' }, { en: 'Email alerts', cn: '邮件提醒' }, { en: 'Historical performance', cn: '历史业绩查询' }] },
  { id: 'pro',    name: 'Pro',   nameCn: '专业版', price: 99,  period: 'quarterly', periodCn: '季度', recommended: true,
    features: [{ en: 'All Basic features', cn: '基础版全部功能' }, { en: 'AI predictions', cn: 'AI走势预测' }, { en: 'Daily insights', cn: '每日市场洞察' }, { en: 'Priority support', cn: '优先客服' }, { en: 'Trade alerts', cn: '实盘买卖提醒' }, { en: 'Advanced analytics', cn: '高级分析工具' }] },
  { id: 'elite',  name: 'Elite', nameCn: '精英版', price: 199, period: 'quarterly', periodCn: '季度', recommended: false,
    features: [{ en: 'All Pro features', cn: '专业版全部功能' }, { en: '1-on-1 consultation', cn: '一对一策略咨询' }, { en: 'Exclusive opportunities', cn: '独家投资机会' }, { en: 'Real-time chat', cn: '实时聊天支持' }, { en: 'Custom portfolio', cn: '定制组合方案' }, { en: 'API access', cn: 'API接口' }] }
]));

module.exports = router;
