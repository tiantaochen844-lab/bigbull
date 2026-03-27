const rateLimit = require('express-rate-limit');

// 通用API限流：每IP每15分钟最多100次
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// 严格限流：注册/登录/忘记密码，每IP每15分钟最多5次
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请15分钟后再试 / Too many attempts, please try again later.' }
});

// 邮件类限流：每IP每小时最多3次（发送邮件接口）
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '发送邮件过于频繁，请1小时后再试 / Too many email requests, please try again in 1 hour.' }
});

// 支付类限流：每IP每分钟最多10次
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '支付请求过于频繁，请稍后再试 / Too many payment requests.' }
});

module.exports = { generalLimiter, authLimiter, emailLimiter, paymentLimiter };
