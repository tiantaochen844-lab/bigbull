const { sendMail, welcomeEmail, weeklyReportEmail, performanceEmail } = require('./services/mailer');
require('dotenv').config();

async function test() {
  console.log('📧 Testing Resend SMTP...');
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_FROM:', process.env.SMTP_FROM);

  const TEST_TO = process.argv[2] || 'test@example.com';

  // 测试1: 欢迎邮件
  console.log('\n--- Test 1: Welcome Email ---');
  const welcome = welcomeEmail('张三', 'https://aiopenfortune.com/verify?token=abc123');
  const r1 = await sendMail({ to: TEST_TO, ...welcome });
  console.log('Welcome email:', r1 ? '✅ Sent' : '❌ Failed');

  await new Promise(r => setTimeout(r, 2000));

  // 测试2: 周报邮件（含持仓）
  console.log('\n--- Test 2: Weekly Report Email ---');
  const weekly = weeklyReportEmail('张三', 12, 8.5, 23.4, [
    { symbol: 'AAPL', name: 'Apple Inc.', return: 12.3, value: 15000 },
    { symbol: 'MSFT', name: 'Microsoft', return: 5.8, value: 12000 },
    { symbol: 'GOOGL', name: 'Alphabet', return: -2.1, value: 8000 }
  ], 'cn');
  const r2 = await sendMail({ to: TEST_TO, ...weekly });
  console.log('Weekly report:', r2 ? '✅ Sent' : '❌ Failed');

  await new Promise(r => setTimeout(r, 2000));

  // 测试3: 周期报告邮件
  console.log('\n--- Test 3: Performance Report Email ---');
  const perf = performanceEmail('张三', 5, 12.4, 50000, 'cn');
  const r3 = await sendMail({ to: TEST_TO, ...perf });
  console.log('Performance email:', r3 ? '✅ Sent' : '❌ Failed');

  console.log('\n✅ All tests completed!');
}

test().catch(console.error);
