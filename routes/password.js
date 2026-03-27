const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../services/db');
const { sendMail } = require('../services/mailer');

const BASE_URL = process.env.BASE_URL || 'https://aiopenfortune.com';

// 请求重置密码
router.post('/request', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: '请输入邮箱' });

  db.get(`SELECT * FROM users WHERE email=?`, [email], async (err, user) => {
    if (err || !user) {
      // 为了安全，即使用户不存在也返回成功
      return res.json({ success: true, message: '如果该邮箱已注册，您将收到重置密码邮件' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600000; // 1小时后过期

    db.run(
      `UPDATE users SET reset_token=?, reset_expires=? WHERE id=?`,
      [resetToken, expires, user.id],
      async (err) => {
        if (err) return res.status(500).json({ error: '服务器错误' });

        const resetUrl = `${BASE_URL}/reset-password.html?token=${resetToken}`;
        const isCn = user.market === 'cn';
        
        await sendMail({
          to: email,
          subject: isCn ? '🔐 重置密码 - AI创富' : '🔐 Reset Password - Open Fortune',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
              <h2 style="color:#667eea;">${isCn ? '重置密码' : 'Reset Password'}</h2>
              <p>${isCn ? '您请求重置密码。点击下方按钮重置：' : 'You requested a password reset. Click below to reset:'}</p>
              <a href="${resetUrl}" style="display:inline-block;margin:20px 0;padding:12px 30px;background:#667eea;color:white;text-decoration:none;border-radius:8px;">
                ${isCn ? '重置密码' : 'Reset Password'}
              </a>
              <p style="color:#666;font-size:0.9em;">${isCn ? '链接1小时内有效。如非本人操作，请忽略此邮件。' : 'Link expires in 1 hour. Ignore if you did not request this.'}</p>
            </div>
          `
        });

        res.json({ success: true, message: '重置密码邮件已发送' });
      }
    );
  });
});

// 重置密码
router.post('/reset', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: '缺少参数' });

  db.get(
    `SELECT * FROM users WHERE reset_token=? AND reset_expires>?`,
    [token, Date.now()],
    async (err, user) => {
      if (err || !user) {
        return res.status(400).json({ error: '重置链接无效或已过期' });
      }

      const hashed = await bcrypt.hash(password, 10);
      db.run(
        `UPDATE users SET password=?, reset_token=NULL, reset_expires=NULL WHERE id=?`,
        [hashed, user.id],
        (err) => {
          if (err) return res.status(500).json({ error: '重置失败' });
          res.json({ success: true, message: '密码重置成功' });
        }
      );
    }
  );
});

module.exports = router;
