require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── 中间件 ───────────────────────────────────────────
app.use(cors({
  origin: [
    'http://43.133.48.91:3000',
    'https://aiopenfortune.com',
    'https://www.aiopenfortune.com',
    'https://bigbull.pages.dev',
    /\.pages\.dev$/,
    /\.cloudflare\.com$/
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// ── 初始化数据库 ─────────────────────────────────────
require('./services/db');

// ── 路由 ─────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/password',    require('./routes/password'));
app.use('/api/payment',     require('./routes/payment'));
app.use('/api/cn-payment',  require('./routes/cn_payment'));
app.use('/api/admin',       require('./routes/admin'));
app.use('/api',         require('./routes/us_market'));
app.use('/api',         require('./routes/cn_market'));

// ── A股静态数据 ───────────────────────────────────────
const aStocks = {
  '600519': { name: '贵州茅台', code: '600519', price: 1685.50, change: 1.8,  volume: '125万', pe: 32.5 },
  '000858': { name: '五粮液',   code: '000858', price: 168.30,  change: -0.5, volume: '890万', pe: 28.3 },
  '300750': { name: '宁德时代', code: '300750', price: 198.60,  change: 3.2,  volume: '2340万', pe: 45.8 },
  '601318': { name: '中国平安', code: '601318', price: 42.80,   change: 0.8,  volume: '3210万', pe: 8.5  },
  '000333': { name: '美的集团', code: '000333', price: 58.90,   change: 1.5,  volume: '1560万', pe: 15.2 },
  '002594': { name: '比亚迪',   code: '002594', price: 245.70,  change: 2.8,  volume: '1890万', pe: 38.6 }
};

const aCycles = [
  { cycle: 1, startDate: '2025-09-24', endDate: '2025-12-24', initialAmount: 100000, finalAmount: 115000, actualReturn: 15.0, targetReturn: 15.0, status: 'completed' },
  { cycle: 2, startDate: '2025-12-24', endDate: '2026-03-24', initialAmount: 115000, finalAmount: 132250, actualReturn: 15.0, targetReturn: 15.0, status: 'completed' }
];

const investmentCycles = [
  { cycle: 1, startDate: '2025-09-24', endDate: '2025-12-24', initialAmount: 100000, finalAmount: 110200, actualReturn: 10.2, targetReturn: 10.0, status: 'completed' },
  { cycle: 2, startDate: '2025-12-24', endDate: '2026-03-24', initialAmount: 110200, finalAmount: 121420, actualReturn: 10.2, targetReturn: 10.0, status: 'completed' }
];

// ── 全球版历史 & 组合 API ─────────────────────────────
app.get('/api/history', (req, res) => {
  const last = investmentCycles[investmentCycles.length - 1];
  res.json({
    totalCycles: investmentCycles.length,
    initialInvestment: 100000,
    currentValue: last.finalAmount,
    totalReturn: ((last.finalAmount - 100000) / 100000 * 100).toFixed(2),
    avgReturnPerCycle: (investmentCycles.reduce((s, c) => s + c.actualReturn, 0) / investmentCycles.length).toFixed(2),
    cycles: investmentCycles
  });
});

app.get('/api/portfolio', (req, res) => {
  const last = investmentCycles[investmentCycles.length - 1];
  const amt = last.finalAmount;
  res.json({
    cycle: investmentCycles.length + 1,
    startDate: '2026-03-24', endDate: '2026-06-24',
    totalAmount: amt, targetReturn: 10, period: '90 Days', strategy: 'Steady Growth',
    allocation: [
      { symbol: 'NVDA', name: '英伟达', amount: Math.round(amt * 0.28), percentage: 28, shares: 39,  expectedReturn: 14.5, risk: '中' },
      { symbol: 'MSFT', name: '微软',   amount: Math.round(amt * 0.25), percentage: 25, shares: 72,  expectedReturn: 8.8,  risk: '低' },
      { symbol: 'AAPL', name: '苹果',   amount: Math.round(amt * 0.22), percentage: 22, shares: 149, expectedReturn: 9.5,  risk: '低' },
      { symbol: 'BABA', name: '阿里巴巴', amount: Math.round(amt * 0.15), percentage: 15, shares: 206, expectedReturn: 13.2, risk: '中高' },
      { symbol: 'GOOGL', name: '谷歌',  amount: Math.round(amt * 0.07), percentage: 7,  shares: 59,  expectedReturn: 7.8,  risk: '低' },
      { symbol: 'TSLA', name: '特斯拉', amount: Math.round(amt * 0.03), percentage: 3,  shares: 19,  expectedReturn: 8.5,  risk: '高' }
    ],
    expectedReturn: 10.5, riskLevel: '中低', riskLevelEn: 'Medium-Low',
    recommendationCn: '基于前两个周期累计收益21.42%的优异表现，第三周期继续优化配置：加大英伟达至28%把握AI浪潮，保持微软、苹果稳定仓位，提升阿里巴巴至15%捕捉中概股反弹机会。预期收益10.5%。',
    recommendationEn: 'Building on 21.42% cumulative returns, Cycle 3 increases NVDA to 28% for AI momentum, maintains MSFT/AAPL as stable anchors, raises BABA to 15% for Chinese tech rebound. Target: 10.5%.'
  });
});

app.get('/api/pricing', (req, res) => res.json([
  { id: 'basic',  name: 'Basic',  nameCn: '基础版', price: 49,  period: 'quarterly', periodCn: '季度', recommended: false,
    features: [{ en: 'Real-time portfolio updates', cn: '实时投资组合更新' }, { en: 'Weekly market analysis', cn: '每周市场分析' }, { en: 'Email alerts', cn: '邮件提醒' }, { en: 'Historical performance data', cn: '历史业绩数据' }] },
  { id: 'pro',    name: 'Pro',   nameCn: '专业版', price: 99,  period: 'quarterly', periodCn: '季度', recommended: true,
    features: [{ en: 'All Basic features', cn: '基础版全部功能' }, { en: 'AI-powered predictions', cn: 'AI驱动预测' }, { en: 'Daily market insights', cn: '每日市场洞察' }, { en: 'Priority support', cn: '优先客服支持' }, { en: 'Custom alerts', cn: '自定义提醒' }, { en: 'Advanced analytics', cn: '高级分析工具' }] },
  { id: 'elite',  name: 'Elite', nameCn: '精英版', price: 199, period: 'quarterly', periodCn: '季度', recommended: false,
    features: [{ en: 'All Pro features', cn: '专业版全部功能' }, { en: '1-on-1 strategy consultation', cn: '一对一策略咨询' }, { en: 'Exclusive investment opportunities', cn: '独家投资机会' }, { en: 'Real-time chat support', cn: '实时聊天支持' }, { en: 'Custom portfolio builder', cn: '定制组合构建器' }, { en: 'API access', cn: 'API接口访问' }] }
]));

// ── 启动 ──────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🐂 Open Fortune running on http://0.0.0.0:${PORT}`);
  console.log(`🌍 Access: http://43.133.48.91:${PORT}`);
  console.log(`🇨🇳 A股版: http://43.133.48.91:${PORT}/cn.html`);
});
