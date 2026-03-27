const nodemailer = require('nodemailer');
require('dotenv').config();

// 邮件配置（Resend SMTP）
const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 465,
  secure: true,
  auth: {
    user: 'resend',
    pass: process.env.SMTP_PASS || 're_ZbBGuMNN_C6ktFuBGpGXiFUGMPQznQkhB'
  }
});

// 发送欢迎邮件
async function sendWelcomeEmail(email, plan, userName) {
  const subject = plan === 'cn' ? 'AI创富 - 欢迎加入！' : 'AI Open Fortune - Welcome!';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#667eea;">🎉 欢迎加入AI创富！</h2>
      <p>尊敬的 ${userName || '投资者'}，</p>
      <p>感谢您订阅 <strong>${getPlanName(plan)}</strong>！</p>
      <p>本季度投资组合已为您准备就绪，请访问网站查看详情：</p>
      <p><a href="https://aiopenfortune.com" style="background:#667eea;color:white;padding:12px 30px;text-decoration:none;border-radius:6px;display:inline-block;">查看投资组合</a></p>
      <hr style="margin:30px 0;border:none;border-top:1px solid #eee;">
      <p style="color:#666;font-size:0.9em;">AI创富团队<br>legal@aiopenfortune.com</p>
    </div>
  `;
  
  await transporter.sendMail({
    from: '"AI创富" <noreply@aiopenfortune.com>',
    to: email,
    subject,
    html
  });
}

// 发送周报
async function sendWeeklyReport(email, plan, reportData) {
  const subject = '📊 本周持仓报告';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#667eea;">📊 本周持仓报告</h2>
      <p>本周收益：<strong style="color:${reportData.weeklyReturn >= 0 ? '#10b981' : '#ef4444'};">${reportData.weeklyReturn >= 0 ? '+' : ''}${reportData.weeklyReturn}%</strong></p>
      <p>累计收益：<strong>${reportData.totalReturn >= 0 ? '+' : ''}${reportData.totalReturn}%</strong></p>
      <p><a href="https://aiopenfortune.com" style="background:#667eea;color:white;padding:10px 24px;text-decoration:none;border-radius:6px;display:inline-block;">查看详情</a></p>
      <hr style="margin:30px 0;border:none;border-top:1px solid #eee;">
      <p style="color:#666;font-size:0.9em;">AI创富团队</p>
    </div>
  `;
  
  await transporter.sendMail({
    from: '"AI创富" <noreply@aiopenfortune.com>',
    to: email,
    subject,
    html
  });
}

function getPlanName(plan) {
  const names = { basic: '入门版', pro: '专业版', elite: '精英版' };
  return names[plan] || plan;
}

module.exports = { sendWelcomeEmail, sendWeeklyReport };
