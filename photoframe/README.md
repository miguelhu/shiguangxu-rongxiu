# 当前日常相框前端

这是线上 `/photoframe/` 所用项目的源码快照，独立于仓库原有 `frame/`。

来源：`FreeWizardWu/ai-frame` 的 `prototype/showcase`，基线提交 `41da81c`，加上当前本地修改：小叙改用扶边探身素材、只在首页菜单展开且没有来信／SOS弹层时出现；收起菜单后隐藏。保留原项目来源，不改变上游仓库。

```sh
npm ci
npm run dev
# 当前日常相框入口：http://localhost:5175/#/frame
npm run build:photoframe
# dist/ 部署到域名 /photoframe/ 下
```

`npm run build` 使用根路径；部署到当前域名子路径必须使用 `build:photoframe`，以正确处理媒体地址。主项目同时包含家庭端的历史页面，日常相框路由在 `src/router/index.tsx`。

AI服务按运行环境提供 `VITE_AI_SERVICE_URL` 等配置；此快照不包含服务器密钥、账号、部署密码或后端服务。保留的上游部署脚本不表示应部署到其原有云账号。这里的账号绑定、部分录音／发送／设置等仍为原型行为，生产接入以相框PRD与差距清单为准。

源码与必要运行素材均已收录；构建产物、依赖、测试截图和私有环境文件不提交。
