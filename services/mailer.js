const nodemailer = require('nodemailer');
require('dotenv').config();

const {
  welcomeEmailTemplate,
  subscriptionEmailTemplate,
  weeklyReportEmailTemplate,
  performanceEmailTemplate
} = require('./email-templates');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.resend.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendMail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Open Fortune <noreply@aiopenfortune.com>',
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
    subject: '🐂 Welcome to Open Fortune - 验证您的邮箱',
    html: welcomeEmailTemplate(name, verifyUrl)
  };
}

// 订阅成功邮件
function subscriptionEmail(name, plan, expires, market) {
  const isCn = market === 'cn';
  return {
    subject: isCn
      ? `🎉 订阅成功 - Open Fortune ${plan}`
      : `🎉 Subscription Confirmed - Open Fortune ${plan}`,
    html: subscriptionEmailTemplate(name, plan, expires, market)
  };
}

// 周报邮件
function weeklyReportEmail(name, weekNum, weeklyReturn, totalReturn, holdings, market) {
  const isCn = market === 'cn';
  const sign = weeklyReturn >= 0 ? '+' : '';
  return {
    subject: isCn
      ? `📊 Week #${weekNum} 持仓报告 ${sign}${weeklyReturn}%`
      : `📊 Week #${weekNum} Portfolio Report ${sign}${weeklyReturn}%`,
    html: weeklyReportEmailTemplate(name, weekNum, weeklyReturn, totalReturn, holdings, market)
  };
}

// 周期收益报告
function performanceEmail(name, cycle, returnRate, amount, market) {
  const isCn = market === 'cn';
  const sign = returnRate >= 0 ? '+' : '';
  return {
    subject: isCn
      ? `📊 第${cycle}周期收益报告 ${sign}${returnRate}%`
      : `📊 Cycle ${cycle} Performance Report ${sign}${returnRate}%`,
    html: performanceEmailTemplate(name, cycle, returnRate, amount, market)
  };
}

module.exports = {
  sendMail,
  welcomeEmail,
  subscriptionEmail,
  weeklyReportEmail,
  performanceEmail
};
