const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../services/db');
const { sendMail, subscriptionEmail } = require('../services/mailer');
const { createXunhupayOrder, verifyXunhupayCallback } = require('../services/xunhupay');

const BASE_URL = process.env.BASE_URL || 'https://aiopenfortune.com';
const JWT_SECRET = process.env.JWT_SECRET || 'openfortune_secret_2026';

// 套餐价格（元）
const CN_PLANS = {
  basic:  { name: '入门版', quarterly: 199, annual: 557 },
  pro:    { name: '专业版', quarterly: 499, annual: 1397 },
  elite:  { name: '精英版', quarterly: 999, annual: 2797 }
};

// 验证 JWT
function getUser(req) {
  try {
    const auth = req.headers.authorization?.split(' ')[1];
    return auth ? jwt.verify(auth, JWT_SECRET) : null;
  } catch { return null; }
}

// ─────────────────────────────────────
// POST /api/cn-payment/create
// 创建国内支付订单
// ─────────────────────────────────────
router.post('/create', async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: '请先登录 / Please login first' });

  const { plan, period = 'quarterly', payType = 'wechat' } = req.body;

  if (!CN_PLANS[plan]) {
    return res.status(400).json({ error: '无效的套餐类型' });
  }
  if (!['wechat', 'alipay'].includes(payType)) {
    return res.status(400).json({ error: '支付方式无效' });
  }

  const planInfo = CN_PLANS[plan];
  const amount = period === 'annual' ? planInfo.annual : planInfo.quarterly;
  const tradeOrderId = `OF${Date.now()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const title = `AI创富 ${planInfo.name} ${period === 'annual' ? '年付' : '季付'}`;

  // 记录订单到数据库（pending 状态）
  db.run(
    `INSERT OR IGNORE INTO orders (order_id, user_id, plan, amount, currency, status, payment_provider, created_at)
     VALUES (?, ?, ?, ?, 'CNY', 'pending', 'xunhupay', datetime('now'))`,
    [tradeOrderId, user.id, plan, amount],
    async (err) => {
      if (err) {
        console.error('订单创建失败:', err.message);
        return res.status(500).json({ error: '订单创建失败' });
      }

      try {
        const result = await createXunhupayOrder({
          tradeOrderId,
          totalFee: amount,
          title,
          type: payType,
          notifyUrl: `${BASE_URL}/api/cn-payment/notify`,
          returnUrl: `${BASE_URL}/cn.html?paid=1&plan=${plan}`
        });

        res.json({
          success: true,
          orderId: tradeOrderId,
          payUrl: result.url,
          qrcode: result.qrcode,
          amount,
          title
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    }
  );
});

// ─────────────────────────────────────
// POST /api/cn-payment/notify
// 虎皮椒异步回调（支付成功通知）
// ─────────────────────────────────────
router.post('/notify', express.urlencoded({ extended: true }), async (req, res) => {
  const params = req.body;
  console.log('虎皮椒回调:', params);

  // 验证签名
  if (!verifyXunhupayCallback(params)) {
    console.error('虎皮椒签名验证失败');
    return res.send('fail');
  }

  // 只处理支付成功状态
  if (params.status !== 'OD') {
    return res.send('success');
  }

  const orderId = params.trade_order_id;
  const amount = parseFloat(params.total_fee);

  // 查订单
  db.get(`SELECT * FROM orders WHERE order_id=? AND status='pending'`, [orderId], async (err, order) => {
    if (err || !order) {
      console.error('订单不存在或已处理:', orderId);
      return res.send('success'); // 告诉虎皮椒已处理，避免重复回调
    }

    // 计算订阅到期时间（季付3个月，年付12个月）
    const months = amount > 1000 ? 12 : 3;
    const expires = new Date();
    expires.setMonth(expires.getMonth() + months);
    const expiresStr = expires.toISOString().split('T')[0];

    // 更新订单状态
    db.run(
      `UPDATE orders SET status='paid', paid_at=datetime('now') WHERE order_id=?`,
      [orderId],
      async (err) => {
        if (err) return res.send('fail');

        // 更新用户订阅
        db.run(
          `UPDATE users SET plan=?, expires=?, verified=1 WHERE id=?`,
          [order.plan, expiresStr, order.user_id],
          async (err) => {
            if (err) return res.send('fail');

            // 发订阅成功邮件
            db.get(`SELECT * FROM users WHERE id=?`, [order.user_id], async (err, user) => {
              if (user) {
                const planName = CN_PLANS[order.plan]?.name || order.plan;
                const emailData = subscriptionEmail(user.name, planName, expiresStr, 'cn');
                await sendMail({ to: user.email, ...emailData });
                console.log(`✅ 国内支付成功: ${user.email} → ${planName}，到期：${expiresStr}`);
              }
            });
          }
        );

        res.send('success');
      }
    );
  });
});

// ─────────────────────────────────────
// GET /api/cn-payment/status/:orderId
// 查询订单状态（前端轮询用）
// ─────────────────────────────────────
router.get('/status/:orderId', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: '未授权' });

  db.get(
    `SELECT order_id, plan, amount, status, created_at FROM orders WHERE order_id=? AND user_id=?`,
    [req.params.orderId, user.id],
    (err, order) => {
      if (err || !order) return res.status(404).json({ error: '订单不存在' });
      res.json(order);
    }
  );
});

module.exports = router;
