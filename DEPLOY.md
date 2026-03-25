# Open Fortune - Cloudflare Pages 部署说明

## 架构说明

```
用户浏览器
    ↓
Cloudflare Pages（全球CDN）
    ↓ API 请求
腾讯云服务器 43.133.48.91（Node.js 后端）
    ↓
PayPal / QQ邮件 / 腾讯财经 / Yahoo Finance
```

## 第一步：修改前端 API 地址

前端代码里所有 `/api/...` 请求需要改成指向腾讯云服务器的完整地址。

## 第二步：Cloudflare Pages 部署

1. 登录 https://dash.cloudflare.com
2. 左侧菜单 → Workers & Pages → Create application
3. 选择 Pages → Connect to Git
4. 授权 GitHub，选择 tiantaochen844-lab/bigbull 仓库
5. 配置如下：
   - Build command: （留空，纯静态）
   - Build output directory: public
   - Root directory: /
6. 点 Save and Deploy

部署完成后会得到一个域名：https://bigbull.pages.dev

## 第三步：绑定自定义域名（可选）

在 Cloudflare Pages 项目 → Custom domains → 添加你的域名
