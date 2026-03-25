const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../services/db');
const { sendMail, welcomeEmail } = require('../services/mailer');
require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'openfortune_secret';
const BASE_URL = `http://43.133.48.91:${process.env.PORT || 3000}`;

// 注册
router.post('/register', async (req, res) => {
  const { email, password, name, market = 'global' } = req.body;
  if (!email || !password || !name)
    return res.status(400).json({ error: 'Missing required fields / 请填写所有必填项' });

  const hashed = await bcrypt.hash(password, 10);
  const verifyToken = crypto.randomBytes(32).toString('hex');

  db.run(
    `INSERT INTO users (email, password, name, market, verify_token) VALUES (?, ?, ?, ?, ?)`,
    [email, hashed, name, market, verifyToken],
    async function (err) {
      if (err) {
        if (err.message.includes('UNIQUE'))
          return res.status(409).json({ error: 'Email already registered / 邮箱已注册' });
        return res.status(500).json({ error: 'Registration failed' });
      }

      // 发送验证邮件
      const verifyUrl = `${BASE_URL}/api/auth/verify?token=${verifyToken}`;
      const { subject, html } = welcomeEmail(name, verifyUrl);
      await sendMail({ to: email, subject, html });

      res.json({ success: true, message: 'Registration successful, please check your email / 注册成功，请查收验证邮件' });
    }
  );
});

// 邮箱验证
router.get('/verify', (req, res) => {
  const { token } = req.query;
  db.run(`UPDATE users SET verified=1, verify_token=NULL WHERE verify_token=?`, [token], function (err) {
    if (err || this.changes === 0)
      return res.redirect('/?error=invalid_token');
    res.redirect('/?verified=1');
  });
});

// 登录
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email=?`, [email], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid credentials / 邮箱或密码错误' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials / 邮箱或密码错误' });

    const token = jwt.sign({ id: user.id, email: user.email, plan: user.plan, market: user.market }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token, user: {
        id: user.id, name: user.name, email: user.email,
        plan: user.plan, market: user.market, verified: user.verified
      }
    });
  });
});

// 获取当前用户信息
router.get('/me', (req, res) => {
  const auth = req.headers.authorization?.split(' ')[1];
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(auth, JWT_SECRET);
    db.get(`SELECT id,name,email,plan,market,plan_expires,verified FROM users WHERE id=?`, [payload.id], (err, user) => {
      if (err || !user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
