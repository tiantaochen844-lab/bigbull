/**
 * 持仓预警监控服务
 * - Basic: 涨跌超过5%自动预警
 * - Pro: 用户自定义价格阈值预警
 * - Elite: AI智能买卖信号预警
 */

const db = require('./db');
const { sendMail } = require('./mailer');

// 初始化预警数据库表
function initAlertTables() {
  // 用户持仓表
  db.run(`CREATE TABLE IF NOT EXISTS holdings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT,
    cost_price REAL NOT NULL,
    quantity REAL NOT NULL,
    created_at DATETIME DEFAULT (datetime('now')),
    UNIQUE(user_id, symbol)
  )`);

  // 预警规则表
  db.run(`CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    alert_type TEXT NOT NULL,  -- 'pct_change'|'price_above'|'price_below'|'ai_signal'
    threshold REAL,            -- 涨跌幅(%)或目标价格
    direction TEXT,            -- 'up'|'down'|'both'
    is_active INTEGER DEFAULT 1,
    last_triggered DATETIME,
    created_at DATETIME DEFAULT (datetime('now'))
  )`);

  // 预警触发历史表
  db.run(`CREATE TABLE IF NOT EXISTS alert_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    trigger_price REAL,
    trigger_type TEXT,
    message TEXT,
    sent_at DATETIME DEFAULT (datetime('now'))
  )`);
}

// 获取股票当前价格（复用现有行情缓存）
async function getCurrentPrice(symbol) {
  return new Promise((resolve) => {
    // 从数据库缓存或内存获取最新行情
    db.get(
      `SELECT price, change_pct FROM stock_cache WHERE symbol=? AND updated_at > datetime('now', '-10 minutes')`,
      [symbol],
      (err, row) => {
        if (row) resolve({ price: row.price, changePct: row.change_pct });
        else resolve(null);
      }
    );
  });
}

// 发送预警邮件
async function sendAlertEmail(user, symbol, alertType, message) {
  const subject = `🚨 持仓预警：${symbol} - ${alertType}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;border-radius:12px;">
      <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:20px;border-radius:8px;margin-bottom:20px;">
        <h2 style="color:white;margin:0;">🚨 AI Open Fortune 持仓预警</h2>
      </div>
      <div style="background:white;padding:20px;border-radius:8px;border-left:4px solid #667eea;">
        <h3 style="color:#374151;">股票代码：${symbol}</h3>
        <p style="color:#6b7280;font-size:1.1em;">${message}</p>
        <p style="color:#9ca3af;font-size:0.85em;margin-top:20px;">
          此预警由 AI Open Fortune 自动发送，请登录查看详细信息。
        </p>
      </div>
      <p style="text-align:center;color:#9ca3af;font-size:0.8em;margin-top:20px;">
        © 2026 AI Open Fortune · <a href="https://aiopenfortune.com" style="color:#667eea;">访问网站</a>
      </p>
    </div>
  `;
  await sendMail({ to: user.email, subject, html });
}

// 检查并触发预警
async function checkAlerts() {
  // 获取所有活跃预警
  db.all(
    `SELECT a.*, u.email, u.name, u.plan FROM alerts a
     JOIN users u ON a.user_id = u.id
     WHERE a.is_active = 1 AND u.plan IS NOT NULL`,
    [],
    async (err, alerts) => {
      if (err || !alerts || alerts.length === 0) return;

      // 按股票分组，减少重复查询
      const symbols = [...new Set(alerts.map(a => a.symbol))];

      for (const symbol of symbols) {
        const priceData = await getCurrentPrice(symbol);
        if (!priceData) continue;

        const { price, changePct } = priceData;
        const symbolAlerts = alerts.filter(a => a.symbol === symbol);

        for (const alert of symbolAlerts) {
          let triggered = false;
          let message = '';

          if (alert.alert_type === 'pct_change') {
            // Basic/Pro: 涨跌幅预警
            const absChange = Math.abs(changePct);
            const threshold = alert.threshold || 5;
            if (absChange >= threshold) {
              if (alert.direction === 'both' ||
                 (alert.direction === 'up' && changePct > 0) ||
                 (alert.direction === 'down' && changePct < 0)) {
                triggered = true;
                message = `${symbol} 今日${changePct > 0 ? '上涨' : '下跌'} ${Math.abs(changePct).toFixed(2)}%，当前价格：$${price}，已触发您设定的 ${threshold}% 预警阈值。`;
              }
            }
          } else if (alert.alert_type === 'price_above' && price >= alert.threshold) {
            // Pro: 价格突破上限
            triggered = true;
            message = `${symbol} 当前价格 $${price} 已突破您设定的目标价 $${alert.threshold}，建议考虑止盈。`;
          } else if (alert.alert_type === 'price_below' && price <= alert.threshold) {
            // Pro: 价格跌破下限
            triggered = true;
            message = `${symbol} 当前价格 $${price} 已跌破您设定的止损价 $${alert.threshold}，建议及时处理。`;
          } else if (alert.alert_type === 'ai_signal') {
            // Elite: AI智能信号（基于涨跌幅+成交量综合判断）
            if (Math.abs(changePct) >= 3) {
              triggered = true;
              const signal = changePct > 0 ? '📈 买入信号' : '📉 卖出信号';
              message = `AI智能预警：${symbol} 触发${signal}，当前价格 $${price}，今日变动 ${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}%。`;
            }
          }

          if (triggered) {
            // 检查是否今天已经发送过（避免重复）
            const lastTriggered = alert.last_triggered ? new Date(alert.last_triggered) : null;
            const now = new Date();
            if (lastTriggered && (now - lastTriggered) < 4 * 60 * 60 * 1000) continue; // 4小时内不重复

            // 发送邮件
            await sendAlertEmail(
              { email: alert.email, name: alert.name },
              symbol,
              alert.alert_type === 'ai_signal' ? 'AI智能信号' : '价格预警',
              message
            );

            // 记录触发历史
            db.run(
              `INSERT INTO alert_history (alert_id, user_id, symbol, trigger_price, trigger_type, message)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [alert.id, alert.user_id, symbol, price, alert.alert_type, message]
            );

            // 更新最后触发时间
            db.run(`UPDATE alerts SET last_triggered=datetime('now') WHERE id=?`, [alert.id]);

            console.log(`✅ 预警已发送: ${alert.email} → ${symbol} ${message.slice(0, 50)}...`);
          }
        }
      }
    }
  );
}

// 启动定时监控（每5分钟检查一次）
function startAlertMonitor() {
  initAlertTables();
  console.log('🔔 持仓预警监控服务已启动（每5分钟检查）');
  setInterval(checkAlerts, 5 * 60 * 1000);
  // 启动后立即检查一次
  setTimeout(checkAlerts, 10000);
}

module.exports = { startAlertMonitor, initAlertTables };
