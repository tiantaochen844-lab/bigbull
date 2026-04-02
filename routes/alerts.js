/**
 * 持仓预警 API 路由
 * POST /api/alerts/holdings       - 添加持仓
 * GET  /api/alerts/holdings       - 查询持仓
 * POST /api/alerts/create         - 创建预警
 * GET  /api/alerts/list           - 查询预警列表
 * DELETE /api/alerts/:id          - 删除预警
 * GET  /api/alerts/history        - 预警触发历史
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../services/db');
const JWT_SECRET = process.env.JWT_SECRET || 'openfortune_secret_2026';

function getUser(req) {
  try {
    const auth = req.headers.authorization?.split(' ')[1];
    return auth ? jwt.verify(auth, JWT_SECRET) : null;
  } catch { return null; }
}

// 套餐权限检查
function checkPlanPermission(plan, requiredPlan) {
  const levels = { basic: 1, pro: 2, elite: 3 };
  return (levels[plan] || 0) >= (levels[requiredPlan] || 1);
}

// ── 添加/更新持仓 ─────────────────────────────────────
router.post('/holdings', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { symbol, name, cost_price, quantity } = req.body;
  if (!symbol || !cost_price || !quantity) {
    return res.status(400).json({ error: 'Missing required fields: symbol, cost_price, quantity' });
  }

  db.run(
    `INSERT INTO holdings (user_id, symbol, name, cost_price, quantity)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, symbol) DO UPDATE SET
     cost_price=excluded.cost_price, quantity=excluded.quantity`,
    [user.id, symbol.toUpperCase(), name || symbol, cost_price, quantity],
    (err) => {
      if (err) return res.status(500).json({ error: '持仓添加失败' });
      res.json({ success: true, message: `${symbol} 持仓已添加/更新` });
    }
  );
});

// ── 查询持仓 ──────────────────────────────────────────
router.get('/holdings', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  db.all(
    `SELECT * FROM holdings WHERE user_id=? ORDER BY created_at DESC`,
    [user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: '查询失败' });
      res.json(rows || []);
    }
  );
});

// ── 删除持仓 ──────────────────────────────────────────
router.delete('/holdings/:symbol', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  db.run(
    `DELETE FROM holdings WHERE user_id=? AND symbol=?`,
    [user.id, req.params.symbol.toUpperCase()],
    (err) => {
      if (err) return res.status(500).json({ error: '删除失败' });
      res.json({ success: true });
    }
  );
});

// ── 创建预警 ──────────────────────────────────────────
router.post('/create', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { symbol, alert_type, threshold, direction = 'both' } = req.body;
  if (!symbol || !alert_type) {
    return res.status(400).json({ error: 'Missing required fields: symbol, alert_type' });
  }

  // 权限检查
  db.get(`SELECT plan FROM users WHERE id=?`, [user.id], (err, u) => {
    if (!u) return res.status(403).json({ error: 'User not found' });

    if (alert_type === 'ai_signal' && !checkPlanPermission(u.plan, 'elite')) {
      return res.status(403).json({ error: 'AI智能预警需要Elite套餐' });
    }
    if (['price_above', 'price_below'].includes(alert_type) && !checkPlanPermission(u.plan, 'pro')) {
      return res.status(403).json({ error: '自定义价格预警需要Pro套餐或以上' });
    }

    db.run(
      `INSERT INTO alerts (user_id, symbol, alert_type, threshold, direction)
       VALUES (?, ?, ?, ?, ?)`,
      [user.id, symbol.toUpperCase(), alert_type, threshold || 5, direction],
      function(err) {
        if (err) return res.status(500).json({ error: '预警创建失败' });
        res.json({ success: true, alertId: this.lastID, message: `${symbol} 预警已创建` });
      }
    );
  });
});

// ── 查询预警列表 ──────────────────────────────────────
router.get('/list', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  db.all(
    `SELECT * FROM alerts WHERE user_id=? ORDER BY created_at DESC`,
    [user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: '查询失败' });
      res.json(rows || []);
    }
  );
});

// ── 删除预警 ──────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  db.run(
    `DELETE FROM alerts WHERE id=? AND user_id=?`,
    [req.params.id, user.id],
    (err) => {
      if (err) return res.status(500).json({ error: '删除失败' });
      res.json({ success: true });
    }
  );
});

// ── 预警触发历史 ──────────────────────────────────────
router.get('/history', (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  db.all(
    `SELECT * FROM alert_history WHERE user_id=? ORDER BY sent_at DESC LIMIT 50`,
    [user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: '查询失败' });
      res.json(rows || []);
    }
  );
});

module.exports = router;
