# 荣休礼小程序界面工程

这是共创者与统筹者共用的一份前端源码。运行 `npm ci && npm run dev`，访问 `http://localhost:5191/`；执行 `npm run build` 可检查类型并生成 `dist/`。

`src/App.tsx` 是独立入口；`src/v6/Contributor.tsx` 为共创四步，`Preparation.tsx` 与 `Review.tsx` 为发起和统筹，`Account.tsx` 为人物／我的／设置／消息，`Greeting.tsx` 为礼后送时光与现场补充，`Frame.tsx` 在这里仅用于手机成品预览。

运行时仍是浏览器 React 原型，尚无微信小程序项目配置、真实登录、上传、通知或后端。页面演示状态保存在浏览器本机；正式开发以 [小程序 PRD](../docs/PRD/02_荣休礼小程序PRD.md) 和 [统筹 PRD](../docs/PRD/03_荣休礼统筹管理PRD.md) 为需求依据。顶部人物下拉仅用于检查本代码包所带的荣休礼样本。
