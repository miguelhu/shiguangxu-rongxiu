# 各端工程交付 · 2026-10-28

## 下载哪个包

GitHub Release 的 Assets 是按端拆分的工程；无需 git clone。不要下载 GitHub 自动生成的 Source code 全仓库包。

| 包名 | 当前用途 | 开发端口 | 页面入口 |
| --- | --- | --- | --- |
| miniapp | 小程序浏览器原型，共创者和统筹者在同一个工程 | 5191 | `/` 选择角色；`/?role=contributor&page=welcome`；`/?role=coordinator&page=workspace` |
| web | 整体展示网站、案例与多角色链路演示 | 5188 | `/` |
| elder-app | 长者 App 浏览器原型 | 5230 | `/` |
| photoframe | 当前日常相框前端，含仪式和收到心意等体验 | 5175 | `/#/frame` |
| legacy-frame | 早期仪式原型，仅历史参考；不作为当前相框开发起点 | 5192 | `/` |
| docs | 全部已入库 PRD、验收案例、实现差距与交付说明 | — | `docs/PRD/README.md` |

各包保留所需照片、音频和字体，因此相框包仍相对较大；不包含 Git 历史、依赖安装目录、构建产物、截图评审站、旧 ZIP 和未入库文件。需要小程序只下载 miniapp 和 docs 即可。

## 安装和构建

建议 Node.js 22 LTS。解压后保留目录结构，进入对应端目录：

```sh
npm ci
npm run dev
# 正式静态构建
npm run build
```

产物在该端 `dist/`。必须完整部署 dist（包括 images、audio 等），不能只上传 index.html 和 assets。小程序可部署到 `/mini-program-showcase/`，长者 App 到 `/app/`；子目录地址应以 `/` 结尾。用 HTTP 服务访问，不要直接双击 HTML。

当前相框部署到 `/photoframe/` 时，使用 `npm run build:photoframe`，随后把整个 dist 放到该路径。普通 `npm run build` 适用于域名根路径。不要直接执行 photoframe 中沿用的 deploy:* 命令，它们是历史云环境配置。

miniapp 与 web 的 Vite 配置依赖包内 `scripts/serve-frame.mjs`，不要只移动内层项目文件夹。其本地成品预览默认读取同级 `photoframe/dist`：需要联调时，把 photoframe 包中的 photoframe 目录放到 miniapp/web 同级，先运行相框的 `npm ci && npm run build:photoframe`，再启动小程序/网页开发服务。也可设置 `SGX_FRAME_DIST=/绝对路径/photoframe/dist npm run dev`。只下载小程序可开发全部本端界面，但内嵌日常相框预览需要相框包。

静态部署和 `vite preview` 不提供上述开发中间件；应在同一站点挂载 `/photoframe/`。长者 App 跳转相框亦需要该路径。

## 本次修复

- 小程序在 `/mini-program-showcase/` 下使用自身打包媒体，避免独立部署依赖主站 `/images/` 导致照片缺失。
- 首次打开携带 case 参数的小程序链接时，正确进入指定案例，而非始终落到老师案例。
- 本地相框预览从旧版 frame 切换到当前 photoframe，补充 WebP、MP3、MP4 等媒体类型。
- 增加可重复执行的按端打包脚本，附版本提交号、包大小和 SHA-256 校验；包内包含必要公共脚本。

## 实现范围

这是交互原型工程 Release，不是生产上线版本。miniapp 尚非微信原生小程序，elder-app 尚非原生安装包，photoframe 尚非硬件固件。账号、通知、内容同步、AI、验证码等有演示或本机状态；PRD 写明的能力不代表后台已经实现。各端独立 localStorage 不能当作正式多设备同步。

当前文档以 docs/PRD/README.md 的优先级为准。原型中的案例、固定日期和演示提示不作为生产需求。

## 验证与待办

- 五个前端的 TypeScript 和 Vite 构建通过。
- 五个 Release 源码包分别在全新目录解压，独立执行 npm ci 和构建均通过；当前验证环境为 Node.js 24.18.0。相框同时验证 `/photoframe/` 专用构建。
- 长者 App 现有 Playwright 用例 17/17 通过。
- 小程序新增 Release 用例 3/3 通过，覆盖首次案例链接、子目录独立图片加载、24 个共创者与统筹者页面的运行错误和 HTTP 错误检查。执行：`npm run build && npx playwright test --workers=1`。
- 网页现有历史回归 9/20 通过、11 项未通过；失败涉及旧版“我的”礼物数量、发起入口旧文案、旧语音按钮、旧话题图片卡、旧祝福输入入口、已移除的参与状态标签、旧相框预览流程和现场入口。它们不能作为当前版本全部功能已验收的证明，需按当前 PRD 更新用例并继续验收。原测试保留在 web/tests/demo-v6.spec.ts，未通过项没有被隐藏或跳过。
- 本次不宣称真实登录、服务端通知、设备同步、微信原生能力或硬件已通过测试。源码交付也不会自动改变线上部署。

## 复现交付

仓库根目录运行 `node scripts/package-release.mjs v2026.10.28`。脚本只打包 Git 已跟踪文件，输出到 packages/版本号，未跟踪的 move-in 等文件不会进入交付。发布前应提交变更，以 manifest.json 中的 revision 对照版本。下载后可用 `shasum -a 256 -c SHA256SUMS.txt` 校验。
