const crypto = require('crypto');
const axios = require('axios');

// 虎皮椒配置（需要在 .env 中配置）
const XUNHUPAY_APPID = process.env.XUNHUPAY_APPID || '';
const XUNHUPAY_APPSECRET = process.env.XUNHUPAY_APPSECRET || '';
const XUNHUPAY_API = 'https://api.xunhupay.com/payment/do.html';

/**
 * 生成虎皮椒签名
 */
function generateSign(params, secret) {
  const sortedKeys = Object.keys(params).sort();
  const signStr = sortedKeys.map(k => `${k}=${params[k]}`).join('&') + secret;
  return crypto.createHash('md5').update(signStr, 'utf8').digest('hex');
}

/**
 * 创建虎皮椒支付订单
 * @param {string} tradeOrderId - 商户订单号
 * @param {number} totalFee - 金额（元）
 * @param {string} title - 商品标题
 * @param {string} type - 支付方式 (wechat/alipay)
 * @param {string} notifyUrl - 异步回调地址
 * @param {string} returnUrl - 同步跳转地址
 */
async function createXunhupayOrder({ tradeOrderId, totalFee, title, type, notifyUrl, returnUrl }) {
  if (!XUNHUPAY_APPID || !XUNHUPAY_APPSECRET) {
    throw new Error('虎皮椒配置未设置，请在 .env 中配置 XUNHUPAY_APPID 和 XUNHUPAY_APPSECRET');
  }

  const params = {
    version: '1.1',
    appid: XUNHUPAY_APPID,
    trade_order_id: tradeOrderId,
    total_fee: totalFee.toFixed(2),
    title,
    time: Math.floor(Date.now() / 1000).toString(),
    notify_url: notifyUrl,
    return_url: returnUrl,
    callback_url: returnUrl,
    type, // wechat 或 alipay
    nonce_str: crypto.randomBytes(16).toString('hex')
  };

  params.hash = generateSign(params, XUNHUPAY_APPSECRET);

  try {
    const response = await axios.post(XUNHUPAY_API, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000
    });

    const data = response.data;
    if (data.errcode !== 0) {
      throw new Error(`虎皮椒支付创建失败: ${data.errmsg}`);
    }

    return {
      success: true,
      url: data.url, // 支付二维码页面
      qrcode: data.url_qrcode, // 二维码图片地址
      orderId: data.order_id // 虎皮椒订单号
    };
  } catch (err) {
    console.error('虎皮椒支付请求失败:', err.message);
    throw err;
  }
}

/**
 * 验证虎皮椒回调签名
 */
function verifyXunhupayCallback(params) {
  const { hash, ...data } = params;
  const calculatedHash = generateSign(data, XUNHUPAY_APPSECRET);
  return hash === calculatedHash;
}

module.exports = {
  createXunhupayOrder,
  verifyXunhupayCallback
};
