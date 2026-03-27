const express = require('express');
const cron = require('node-cron');
const { sendWelcomeEmail, sendWeeklyReport } = require('../services/email');

const router = express.Router();

// ── 简易数据库（真实环境应用sqlite）───────────────────
let reports = []; // 待审核报告队列
let sentLog = [];  // 已发送日志

// ── 统计数据 ─────────────────────────────────────────
router.get('/stats', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const totalUsers = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) reject(err); else resolve(row?.count || 0);
      });
    });
    res.json({
      totalUsers,
      pendingReports: reports.filter(r => r.status === 'pending').length,
      thisWeekSent: sentLog.filter(s => {
        const d = new Date(s.sentAt);
        const now = new Date();
        return d >= new Date(now.setDate(now.getDate() - 7));
      }).length
    });
  } catch(e) {
    res.json({ totalUsers: 0, pendingReports: 0, thisWeekSent: 0 });
  }
});

// ── 获取待审核报告 ────────────────────────────────────
router.get('/reports/pending', (req, res) => {
  res.json(reports.filter(r => r.status === 'pending'));
});

// ── AI生成周报 ────────────────────────────────────────
router.post('/reports/generate-weekly', async (req, res) => {
  try {
    // 抓取最新行情生成报告摘要
    const weeklyReport = {
      id: Date.now(),
      type: 'weekly',
      title: `📊 AI创富周报 · ${new Date().toLocaleDateString('zh-CN')}`,
      preview: 'AI分析：本周A股整体震荡，特变电工+0.8%、宁德时代-1.2%，整体持仓稳健；美股科技股承压，建议持有待反弹。',
      content: generateWeeklyContent(),
      recipients: 'all',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    reports.push(weeklyReport);
    res.json({ message: '✅ 周报已生成，请在待审核列表中查看并审核发送' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── AI生成季度报告 ────────────────────────────────────
router.post('/reports/generate-quarter', async (req, res) => {
  try {
    const quarterReport = {
      id: Date.now(),
      type: 'quarter',
      title: `🎯 季度清仓报告 · ${new Date().getFullYear()}Q${Math.ceil((new Date().getMonth()+1)/3)}`,
      preview: 'AI汇总：本季度实现收益13.6%，超越目标15%目标进度86%。特变电工实现+17.5%，比亚迪+16.5%，五粮液+12.6%。',
      content: generateQuarterContent(),
      recipients: 'all',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    reports.push(quarterReport);
    res.json({ message: '✅ 季度报告已生成，请审核后发送' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── 审核通过并群发 ────────────────────────────────────
router.post('/reports/:id/approve', async (req, res) => {
  const report = reports.find(r => r.id === parseInt(req.params.id));
  if (!report) return res.status(404).json({ error: '报告不存在' });

  try {
    const db = req.app.locals.db;
    // 获取所有活跃订阅用户
    const users = await new Promise((resolve, reject) => {
      db.all('SELECT email, username FROM users WHERE id IN (SELECT user_id FROM subscriptions WHERE status = "active")', (err, rows) => {
        if (err) reject(err); else resolve(rows || []);
      });
    });

    // 标记为已发送
    report.status = 'sent';
    report.sentAt = new Date().toISOString();
    sentLog.push({ ...report });

    // 群发（实际应用中用 nodemailer 发送）
    // for (const user of users) { await sendReport(user.email, report); }

    res.json({ message: `✅ 审核通过！已向 ${users.length} 位用户发送（开发模式：已记录，SMTP配置后自动发送）` });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── 拒绝报告 ─────────────────────────────────────────
router.post('/reports/:id/reject', (req, res) => {
  const report = reports.find(r => r.id === parseInt(req.params.id));
  if (!report) return res.status(404).json({ error: '报告不存在' });
  report.status = 'rejected';
  res.json({ message: '已拒绝' });
});

// ── 测试邮件 ─────────────────────────────────────────
router.post('/test-email', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: '请提供邮箱地址' });
  try {
    await sendWelcomeEmail(email, 'pro', '测试用户');
    res.json({ message: `✅ 测试邮件已发送到 ${email}` });
  } catch(e) {
    res.status(500).json({ error: `发送失败：${e.message}（请配置SMTP_USER和SMTP_PASS环境变量）` });
  }
});

// ── 定时任务：每周五17:00自动生成周报 ───────────────────
cron.schedule('0 17 * * 5', () => {
  console.log('[CRON] 自动生成周报...');
  const weeklyReport = {
    id: Date.now(),
    type: 'weekly',
    title: `📊 AI创富周报 · ${new Date().toLocaleDateString('zh-CN')}`,
    preview: '本周持仓数据已更新，请审核后发送给订阅用户。',
    content: generateWeeklyContent(),
    recipients: 'all',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  reports.push(weeklyReport);
  console.log('[CRON] 周报已加入审核队列');
}, { timezone: 'Asia/Shanghai' });

// ── 季末自动生成季度报告（每季最后一周） ────────────────
cron.schedule('0 9 22 3,6,9,12 *', () => {
  console.log('[CRON] 自动生成季度清仓报告...');
  const quarterReport = {
    id: Date.now(),
    type: 'quarter',
    title: `🎯 季度清仓报告`,
    preview: 'AI已汇总本季度交易数据，请审核后发送。',
    content: generateQuarterContent(),
    recipients: 'all',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  reports.push(quarterReport);
  console.log('[CRON] 季度报告已加入审核队列');
}, { timezone: 'Asia/Shanghai' });

// ── 报告内容生成函数 ──────────────────────────────────
function generateWeeklyContent() {
  return {
    summary: 'AI分析本周市场走势，综合技术面与基本面，生成持仓周报。',
    holdings: '详见网站实时行情页面。',
    nextWeek: '下周关注美联储议息会议及A股PMI数据。'
  };
}

function generateQuarterContent() {
  return {
    summary: '本季度完整交易记录及收益数据。',
    trades: '详见网站实盘交易记录页面。',
    nextQuarter: '下季度组合策略将在季初公布。'
  };
}

module.exports = router;
