const express = require('express');
const paypal = require('@paypal/checkout-server-sdk');
const jwt = require('jsonwebtoken');
const db = require('../services/db');
const { sendMail, subscriptionEmail } = require('../services/mailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'openfortune_secret';
const BASE_URL = `http://43.133.48.91:${process.env.PORT || 3000}`;

// ── PayPal 环境配置 ───────────────────────────────────
function getPayPalClient() {
  const clientId     = process.env.PAYPAL_CLIENT_ID     || 'placeholder';
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || 'placeholder';
  const env = process.env.PAYPAL_MODE === 'live'
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);
  return new paypal.core.PayPalHttpClient(env);
}

// ── 套餐价格配置 ──────────────────────────────────────
const PLANS = {
  global: {
    basic: { name: 'Basic / 基础版', price: '49.00', currency: 'USD' },
    pro:   { name: 'Pro / 专业版',   price: '99.00', currency: 'USD' },
    elite: { name: 'Elite / 精英版', price: '199.00', currency: 'USD' }
  },
  cn: {
    starter: { name: '入门版', price: '199.00', currency: 'USD' }, // 人民币需微信支付，PayPal 用 USD 等值
    pro:     { name: '专业版', price: '399.00', currency: 'USD' },
    vip:     { name: '尊享版', price: '799.00', currency: 'USD' }
  }
};

// 从 Authorization header 取用户
function getUserFromToken(req) {
  try {
    const auth = req.headers.authorization?.split(' ')[1];
    return auth ? jwt.verify(auth, JWT_SECRET) : null;
  } catch { return null; }
}

// ── 创建 PayPal 订单 ──────────────────────────────────
router.post('/paypal/create-order', async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Please login first / 请先登录' });

  const { plan, market = 'global' } = req.body;
  const planInfo = PLANS[market]?.[plan];
  if (!planInfo) return res.status(400).json({ error: 'Invalid plan / 无效套餐' });

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: planInfo.currency,
        value: planInfo.price
      },
      description: `Open Fortune - ${planInfo.name} (Quarterly / 季度订阅)`
    }],
    application_context: {
      brand_name: 'Open Fortune',
      landing_page: 'BILLING',
      user_action: 'PAY_NOW',
      return_url: `${BASE_URL}/payment-success.html?plan=${plan}&market=${market}&uid=${user.id}`,
      cancel_url:  `${BASE_URL}/${market === 'cn' ? 'cn.html' : 'index.html'}#pricing`
    }
  });

  try {
    const client = getPayPalClient();
    const order = await client.execute(request);
    const approveUrl = order.result.links.find(l => l.rel === 'approve')?.href;

    // 记录待支付订阅
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 3);
    db.run(
      `INSERT INTO subscriptions (user_id, plan, market, amount, currency, payment_method, stripe_session_id, status, starts_at, expires_at)
       VALUES (?,?,?,?,?,?,?,?,datetime('now'),?)`,
      [user.id, plan, market, parseFloat(planInfo.price), planInfo.currency, 'paypal', order.result.id, 'pending', expires.toISOString()]
    );

    res.json({ orderId: order.result.id, approveUrl });
  } catch (err) {
    console.error('PayPal create-order error:', err);
    res.status(500).json({
      error: 'PayPal not configured yet. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env',
      hint: 'Get credentials at https://developer.paypal.com',
      detail: err.message
    });
  }
});

// ── 捕获 PayPal 付款（前端跳转回来后调用）────────────
router.post('/paypal/capture-order', async (req, res) => {
  const { orderId, plan, market, uid } = req.body;
  if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  try {
    const client = getPayPalClient();
    const capture = await client.execute(request);

    if (capture.result.status === 'COMPLETED') {
      const expires = new Date();
      expires.setMonth(expires.getMonth() + 3);

      db.run(`UPDATE subscriptions SET status='active' WHERE stripe_session_id=?`, [orderId]);
      db.run(`UPDATE users SET plan=?, plan_expires=? WHERE id=?`, [plan, expires.toISOString(), uid]);

      db.get(`SELECT * FROM users WHERE id=?`, [uid], async (err, user) => {
        if (user) {
          const planName = PLANS[market]?.[plan]?.name || plan;
          const { subject, html } = subscriptionEmail(user.name, planName, expires.toISOString().split('T')[0], market);
          await sendMail({ to: user.email, subject, html });
        }
      });

      res.json({ success: true, status: 'COMPLETED' });
    } else {
      res.status(400).json({ error: 'Payment not completed', status: capture.result.status });
    }
  } catch (err) {
    console.error('PayPal capture error:', err.message);
    res.status(500).json({ error: 'Capture failed', detail: err.message });
  }
});

// ── 微信支付（需企业商户资质）────────────────────────
router.post('/wechat/pay', async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: '请先登录' });
  res.json({
    status: 'pending_config',
    message: '微信支付需配置企业商户号，请联系管理员',
    contact: 'admin@openfortune.com'
  });
});

// ── 查询订阅状态 ──────────────────────────────────────
router.get('/status', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  db.all(`SELECT * FROM subscriptions WHERE user_id=? ORDER BY created_at DESC LIMIT 5`, [user.id], (err, rows) => {
    res.json(rows || []);
  });
});

module.exports = router;
