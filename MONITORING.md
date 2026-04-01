# 网站性能监控指南

## 日常监控命令

### 查看服务状态
```bash
pm2 status
pm2 show bigbull
```

### 查看日志
```bash
# 实时日志
pm2 logs bigbull

# 错误日志
pm2 logs bigbull --err

# 最近50行
pm2 logs bigbull --lines 50
```

### 运行监控脚本
```bash
cd /root/.openclaw/workspace/bigbull
bash monitor.sh
```

## Google Analytics监控

访问：https://analytics.google.com
- 实时用户数
- 页面浏览量
- 用户来源
- 转化率

## 性能测试工具

1. **PageSpeed Insights**: https://pagespeed.web.dev
2. **GTmetrix**: https://gtmetrix.com
3. **WebPageTest**: https://www.webpagetest.org

## 告警设置

建议设置以下告警：
- 服务器CPU > 80%
- 内存使用 > 80%
- 响应时间 > 3秒
- 错误率 > 5%

## 用户反馈渠道

- 邮箱：support@aiopenfortune.com
- 在线客服：待添加
