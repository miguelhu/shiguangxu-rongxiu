# 小叙Agent实现差距

记录基于2026-10-22规格中的代码检查，2026-10-27归档；不是生产验收结论。当前要求见[小叙Agent](../../PRD/公共能力/小叙Agent.md)。

## 现状与实现差距

| 当前依据 | 已有能力 | 正式接入必须补齐 |
| --- | --- | --- |
| `elder-app/src/agent/AgentHome.tsx` | 持续对话样式、选项、三组固定六卡、关键词路由 | 统一任务编排、工具结果驱动、个性化候选与验证 |
| `elder-app/src/agent/model.ts` | 简单正则提取时间／人物等、浏览器保存 | 多事实与证据定位、修正冲突、人物归一、可靠云记录 |
| `elder-app/src/ChatComposer.tsx` | 按住说话、取消、原声、键盘 | 正式ASR、转写修订合并、真机权限与中断验收 |
| `MemoryLibrary.tsx`、`ArticleEditor.tsx` | 分类、文件、文章正文、局部编辑 | 授权检索、关联与去重候选、跨端修订与同步 |
| `FamilyTree.tsx`、`Contacts.tsx` | 示例家谱、亲友展示 | 对话生成变更提案、图校验、确认写入、撤回与账号隔离 |
| `Reminders.tsx` | 本机提醒、有限时间解析 | 可靠时区与重复规则、实例、真实调度、相框回执 |
| `DailyCamera.tsx`、`DirectCompose.tsx`、`DispatchInbox.tsx` | 拍摄、编辑、选人、消息演示 | 真正投递、幂等、部分失败、已送达／已读状态 |
| `AccountDevices.tsx`、`shared/ConnectionPanel.tsx` | 绑定入口、二维码与本机申请 | 真实登录、关系申请、设备权限、服务端验证 |

原型中的规则、示例消息、本机保存不能计作 AI、账号、投递或同步的生产验收。本文不把网页案例播放步骤作为正式功能。
