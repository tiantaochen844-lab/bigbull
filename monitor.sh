#!/bin/bash
# 网站性能监控脚本

echo "=== AI Open Fortune 性能监控 ==="
echo "时间: $(date)"
echo ""

# PM2状态
echo "📊 PM2服务状态:"
pm2 status bigbull

echo ""
echo "📈 内存使用:"
pm2 show bigbull | grep "memory"

echo ""
echo "⚠️ 最近错误日志:"
pm2 logs bigbull --err --lines 10 --nostream

echo ""
echo "✅ 监控完成"
