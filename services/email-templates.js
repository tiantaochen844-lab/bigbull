// 邮件模板样式
const baseStyle = `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;`;
const containerStyle = `max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);`;
const contentStyle = `padding: 40px 30px; background: #f9fafb;`;
const footerStyle = `padding: 20px 30px; background: #f3f4f6; text-align: center; color: #6b7280; font-size: 0.875rem;`;
const buttonStyle = `display: inline-block; margin: 20px 0; padding: 14px 32px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 1rem;`;

// 欢迎邮件模板
function welcomeEmailTemplate(name, verifyUrl, market = 'cn') {
  const isCn = market === 'cn';
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isCn ? '欢迎加入 Open Fortune' : 'Welcome to Open Fortune'}</title>
</head>
<body style="${baseStyle}">
  <div style="${containerStyle}">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 2rem;">🐂 Open Fortune</h1>
      <p style="color: rgba(255,255,255,0.95); margin: 10px 0 0 0; font-size: 1rem;">${isCn ? 'AI创富 · 双向奔赴' : 'AI-Driven Wealth · Growing Together'}</p>
    </div>

    <div style="${contentStyle}">
      <h2 style="color: #1f2937; margin-top: 0;">${isCn ? `欢迎加入，${name}！` : `Welcome, ${name}!`}</h2>
      <p style="font-size: 1rem; color: #4b5563;">
        ${isCn 
          ? '感谢您选择 Open Fortune — 您的 AI 共创天地，慢慢变富，潇洒人生！' 
          : 'Thank you for choosing Open Fortune — Your AI co-creation space for steady wealth growth and a fulfilling life!'}
      </p>
      <p style="font-size: 1rem; color: #4b5563;">
        ${isCn 
          ? '请点击下方按钮验证您的邮箱地址，激活账户：' 
          : 'Please click the button below to verify your email address and activate your account:'}
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="${buttonStyle}">
          ✉️ ${isCn ? '验证邮箱' : 'Verify Email'}
        </a>
      </div>

      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px; margin-top: 20px;">
        <p style="margin: 0; color: #1d4ed8; font-size: 0.875rem;">
          ${isCn 
            ? '⏰ 验证链接将在 <strong>24 小时</strong>后失效。如未申请此账户，请忽略此邮件。' 
            : '⏰ This verification link will expire in <strong>24 hours</strong>. If you did not request this account, please ignore this email.'}
        </p>
      </div>
    </div>

    <div style="${footerStyle}">
      <p style="margin: 5px 0; font-weight: 500;">AI Open Fortune Team</p>
      <p style="margin: 5px 0;"><a href="mailto:legal@aiopenfortune.com" style="color: #667eea; text-decoration: none;">legal@aiopenfortune.com</a></p>
      <p style="margin: 10px 0 0 0; font-size: 0.75rem; color: #9ca3af;">© 2026 Open Fortune. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

// 订阅成功邮件模板
function subscriptionEmailTemplate(name, plan, expires, market) {
  const isCn = market === 'cn';
  const headerBg = isCn
    ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isCn ? '订阅成功' : 'Subscription Confirmed'}</title>
</head>
<body style="${baseStyle}">
  <div style="${containerStyle}">
    <div style="background: ${headerBg}; padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 1.75rem;">🎉 ${isCn ? '订阅成功' : 'Subscription Confirmed'}</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Open Fortune</p>
    </div>

    <div style="${contentStyle}">
      <h2 style="color: #1f2937; margin-top: 0;">${isCn ? `恭喜 ${name}！` : `Congratulations, ${name}!`}</h2>

      <div style="background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; color: #374151;">
          <strong>${isCn ? '订阅计划：' : 'Plan: '}</strong>${plan}
        </p>
        <p style="margin: 0; color: #374151;">
          <strong>${isCn ? '有效期至：' : 'Valid until: '}</strong>${expires}
        </p>
      </div>

      <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #065f46;">
          ✨ ${isCn ? '感谢您的信任，我们将竭诚为您提供优质的投资服务！' : 'Thank you for trusting Open Fortune. We will deliver the best investment insights!'}
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://aiopenfortune.com${isCn ? '/cn.html' : ''}" style="${buttonStyle}">
          ${isCn ? '查看投资组合 →' : 'View Portfolio →'}
        </a>
      </div>
    </div>

    <div style="${footerStyle}">
      <p style="margin: 5px 0; font-weight: 500;">AI Open Fortune Team</p>
      <p style="margin: 5px 0;"><a href="mailto:legal@aiopenfortune.com" style="color: #667eea; text-decoration: none;">legal@aiopenfortune.com</a></p>
      <p style="margin: 10px 0 0 0; font-size: 0.75rem; color: #9ca3af;">© 2026 Open Fortune. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

// 周报模板（含持仓概览）
function weeklyReportEmailTemplate(name, weekNum, weeklyReturn, totalReturn, holdings, market) {
  const isCn = market === 'cn';
  const currency = isCn ? '¥' : '$';
  const isPositive = weeklyReturn >= 0;
  const returnColor = isPositive ? '#10b981' : '#ef4444';
  const bgGrad = isPositive
    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';

  // 生成持仓列表 HTML
  const holdingsHtml = (holdings && holdings.length > 0)
    ? holdings.map(h => `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; font-weight: 500;">${h.symbol || ''}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; color: #6b7280;">${h.name || ''}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: bold; color: ${(h.return || 0) >= 0 ? '#10b981' : '#ef4444'};">
            ${(h.return || 0) >= 0 ? '+' : ''}${h.return || 0}%
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; text-align: right;">${currency}${(h.value || 0).toLocaleString()}</td>
        </tr>`).join('')
    : `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #6b7280;">${isCn ? '暂无持仓数据' : 'No holdings data'}</td></tr>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isCn ? '本周持仓报告' : 'Weekly Portfolio Report'}</title>
</head>
<body style="${baseStyle}">
  <div style="${containerStyle}">
    <div style="background: ${bgGrad}; padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 1.5rem;">📊 ${isCn ? '本周持仓报告' : 'Weekly Portfolio Report'}</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Week #${weekNum}</p>
      <p style="color: white; font-size: 3.5rem; font-weight: bold; margin: 15px 0 0 0;">${isPositive ? '+' : ''}${weeklyReturn}%</p>
      <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 0.875rem;">${isCn ? '本周收益' : 'Weekly Return'}</p>
    </div>

    <div style="${contentStyle}">
      <h2 style="color: #1f2937; margin-top: 0;">${isCn ? `${name}，本周报告来了！` : `${name}'s Weekly Summary`}</h2>

      <!-- 核心数据 -->
      <div style="display: flex; gap: 16px; margin: 20px 0;">
        <div style="flex: 1; background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center;">
          <p style="margin: 0; color: #6b7280; font-size: 0.875rem;">${isCn ? '本周收益' : 'Weekly Return'}</p>
          <p style="margin: 8px 0 0 0; font-size: 1.75rem; font-weight: bold; color: ${returnColor};">${isPositive ? '+' : ''}${weeklyReturn}%</p>
        </div>
        <div style="flex: 1; background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center;">
          <p style="margin: 0; color: #6b7280; font-size: 0.875rem;">${isCn ? '累计收益' : 'Total Return'}</p>
          <p style="margin: 8px 0 0 0; font-size: 1.75rem; font-weight: bold; color: ${totalReturn >= 0 ? '#10b981' : '#ef4444'};">${totalReturn >= 0 ? '+' : ''}${totalReturn}%</p>
        </div>
      </div>

      <!-- 持仓明细 -->
      <h3 style="color: #374151; font-size: 1rem; margin: 30px 0 10px;">${isCn ? '📈 本周持仓明细' : '📈 Holdings Detail'}</h3>
      <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px 8px; text-align: left; font-size: 0.875rem; color: #6b7280; font-weight: 600;">${isCn ? '代码' : 'Symbol'}</th>
            <th style="padding: 12px 8px; text-align: left; font-size: 0.875rem; color: #6b7280; font-weight: 600;">${isCn ? '名称' : 'Name'}</th>
            <th style="padding: 12px 8px; text-align: right; font-size: 0.875rem; color: #6b7280; font-weight: 600;">${isCn ? '收益率' : 'Return'}</th>
            <th style="padding: 12px 8px; text-align: right; font-size: 0.875rem; color: #6b7280; font-weight: 600;">${isCn ? '市值' : 'Value'}</th>
          </tr>
        </thead>
        <tbody>
          ${holdingsHtml}
        </tbody>
      </table>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://aiopenfortune.com${isCn ? '/cn.html' : ''}" style="${buttonStyle}">
          ${isCn ? '查看完整报告 →' : 'View Full Report →'}
        </a>
      </div>

      <p style="font-size: 0.8rem; color: #9ca3af; text-align: center; margin-top: 10px;">
        ${isCn ? '⚠️ 本报告仅供参考，不构成投资建议。投资有风险，入市需谨慎。' : '⚠️ This report is for informational purposes only and does not constitute investment advice.'}
      </p>
    </div>

    <div style="${footerStyle}">
      <p style="margin: 5px 0; font-weight: 500;">AI Open Fortune Team</p>
      <p style="margin: 5px 0;"><a href="mailto:legal@aiopenfortune.com" style="color: #667eea; text-decoration: none;">legal@aiopenfortune.com</a></p>
      <p style="margin: 10px 0 0 0; font-size: 0.75rem; color: #9ca3af;">© 2026 Open Fortune. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

// 周期收益报告邮件模板（兼容旧接口）
function performanceEmailTemplate(name, cycle, returnRate, amount, market) {
  const isCn = market === 'cn';
  const currency = isCn ? '¥' : '$';
  const isPositive = returnRate >= 0;
  const color = isPositive ? '#10b981' : '#ef4444';
  const bgGrad = isPositive
    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isCn ? '收益报告' : 'Performance Report'}</title>
</head>
<body style="${baseStyle}">
  <div style="${containerStyle}">
    <div style="background: ${bgGrad}; padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 1.5rem;">📊 ${isCn ? '收益报告' : 'Performance Report'}</h1>
      <p style="color: white; font-size: 3rem; font-weight: bold; margin: 20px 0 0 0;">${isPositive ? '+' : ''}${returnRate}%</p>
    </div>

    <div style="${contentStyle}">
      <h2 style="color: #1f2937; margin-top: 0;">${isCn ? `${name}，本周期收益已确认！` : `${name}, your cycle return is confirmed!`}</h2>

      <div style="background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #6b7280;">${isCn ? '周期' : 'Cycle'}</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold;">#${cycle}</td>
          </tr>
          <tr style="border-top: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280;">${isCn ? '收益率' : 'Return'}</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; font-size: 1.25rem; color: ${color};">${isPositive ? '+' : ''}${returnRate}%</td>
          </tr>
          <tr style="border-top: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280;">${isCn ? '收益金额' : 'Amount'}</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; font-size: 1.25rem;">${currency}${amount.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://aiopenfortune.com${isCn ? '/cn.html' : ''}" style="${buttonStyle}">
          ${isCn ? '查看下期组合 →' : 'View Next Portfolio →'}
        </a>
      </div>
    </div>

    <div style="${footerStyle}">
      <p style="margin: 5px 0; font-weight: 500;">AI Open Fortune Team</p>
      <p style="margin: 5px 0;"><a href="mailto:legal@aiopenfortune.com" style="color: #667eea; text-decoration: none;">legal@aiopenfortune.com</a></p>
      <p style="margin: 10px 0 0 0; font-size: 0.75rem; color: #9ca3af;">© 2026 Open Fortune. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

module.exports = {
  welcomeEmailTemplate,
  subscriptionEmailTemplate,
  weeklyReportEmailTemplate,
  performanceEmailTemplate
};
