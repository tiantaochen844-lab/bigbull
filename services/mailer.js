const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.qq.com',
  port: parseInt(process.env.MAIL_PORT || '465'),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

async function sendMail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || 'Open Fortune <noreply@openfortune.com>',
      to, subject, html
    });
    console.log(`📧 Email sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error('❌ Email error:', err.message);
    return false;
  }
}

// 欢迎邮件
function welcomeEmail(name, verifyUrl) {
  return {
    subject: '🐂 Welcome to Open Fortune - Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">🐂 Open Fortune</h1>
          <p style="color: rgba(255,255,255,0.9);">开放财富 - Transparent Investment Platform</p>
        </div>
        <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 12px 12px;">
          <h2>Welcome, ${name}! 欢迎加入！</h2>
          <p>Please verify your email address to activate your account.</p>
          <p>请点击下方按钮验证您的邮箱，激活账户。</p>
          <a href="${verifyUrl}" style="display: inline-block; margin: 20px 0; padding: 14px 32px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Verify Email / 验证邮箱
          </a>
          <p style="color: #666; font-size: 0.9em;">Link expires in 24 hours. / 链接24小时内有效。</p>
        </div>
      </div>
    `
  };
}

// 订阅成功邮件
function subscriptionEmail(name, plan, expires, market) {
  const isCn = market === 'cn';
  return {
    subject: isCn ? `🎉 订阅成功 - Open Fortune ${plan}` : `🎉 Subscription Confirmed - Open Fortune ${plan}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, ${isCn ? '#f093fb, #f5576c' : '#667eea, #764ba2'}); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">🐂 Open Fortune</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2>${isCn ? `恭喜 ${name}，订阅成功！` : `Congratulations ${name}! Subscription Activated`}</h2>
          <p>${isCn ? `您已成功订阅 <strong>${plan}</strong>，有效期至 ${expires}` : `You've subscribed to <strong>${plan}</strong>, valid until ${expires}`}</p>
          <p>${isCn ? '感谢您的信任，我们将竭诚为您提供优质的投资服务！' : 'Thank you for trusting Open Fortune. We will deliver the best investment insights!'}</p>
        </div>
      </div>
    `
  };
}

// 周期收益报告
function performanceEmail(name, cycle, returnRate, amount, market) {
  const isCn = market === 'cn';
  const currency = isCn ? '¥' : '$';
  return {
    subject: isCn ? `📊 第${cycle}周期收益报告 - +${returnRate}%` : `📊 Cycle ${cycle} Performance Report - +${returnRate}%`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">📊 ${isCn ? '收益报告' : 'Performance Report'}</h1>
          <p style="color: white; font-size: 2em; font-weight: bold;">+${returnRate}%</p>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2>${isCn ? `${name}，本周期收益已确认！` : `${name}, your cycle return is confirmed!`}</h2>
          <p>${isCn ? `第${cycle}周期` : `Cycle ${cycle}`}: ${currency}${amount.toLocaleString()}</p>
          <p>${isCn ? '点击查看下一周期投资组合' : 'Click to view the next cycle portfolio'}</p>
          <a href="http://43.133.48.91:3000${isCn ? '/cn.html' : ''}" style="display: inline-block; margin: 20px 0; padding: 14px 32px; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
            ${isCn ? '查看下期组合' : 'View Next Portfolio'}
          </a>
        </div>
      </div>
    `
  };
}

module.exports = { sendMail, welcomeEmail, subscriptionEmail, performanceEmail };
