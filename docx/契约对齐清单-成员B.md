# 契约对齐清单（成员 B → A）

> 提出人：成员 B（前端与交互主责）
> 日期：2026-11-23（W1 末）
> 背景：按《分工执行计划》表 5，看板页面依赖投递 API 契约（可用 mock）。
> 当前看板 UI 已按「文档契约 9 态」先行开发，数据访问收敛在
> `src/components/board/board-api.ts` 适配层。以下差异请 A 确认后，
> B 仅需替换适配层实现，页面与组件零改动。
>
> 依据文档：《落地方案》图 2/表 6、《分工执行计划》图 1。

## 1. 状态枚举不一致（最高优先级，阻塞拖拽联调）

| 来源 | 枚举 |
| --- | --- |
| 文档契约（落地方案/分工计划） | `wishlist, applied, written, interview_1/2/3, hr, offer, rejected`（9 态） |
| A 当前实现（src/lib/schema.ts） | `todo, applied, interview, offer, rejected`（5 态） |

影响：建卡表单、看板 6 列归并、拖拽流转接口全部依赖此枚举；两版并存会导致
「前端能拖、后端不认」的脏数据（文档原话风险）。

请求：以哪个为准？B 建议按文档 9 态执行，请 A 在 schema.ts 中更新
`applicationStatusEnum`（或说明最终口径），B 随后把 `components/board/status.ts`
的本地定义替换为 `z.infer` 推导。

## 2. 缺失的状态流转接口（拖拽 + 时间线的共同前置）

文档要求：

| 接口 | 用途 | 现状 |
| --- | --- | --- |
| `PATCH /api/applications/:id/status` | 状态流转：校验 from/to、写 events 时间线、409 状态冲突 | 不存在。现有 `PATCH /api/applications/:id` 只改 status/sort_order，不写 events |
| `GET /api/applications/:id/events` | 读取环节时间线（按发生时间倒序） | 不存在 |

请求：W2 拖拽乐观更新依赖第 1 项；卡片抽屉时间线依赖第 2 项。
B 已用内存 mock（`components/board/mock-events.ts`）先行，接口就绪即替换。

## 3. 字段命名与覆盖差异

| 字段 | 文档 applications 表 | A 的 createApplicationSchema | B 的建卡表单 |
| --- | --- | --- | --- |
| 备注 | `notes` | `note` | `notes` |
| 薪资范围 | `salary_range` | 缺失 | `salaryRange` |
| 截止时间 | `deadline` | 缺失 | `deadline` |
| 来源链接 | `source_url` | 缺失 | `sourceUrl` |

请求：统一以文档 applications 表为准（前端表单已按此开发）；A 补齐
create/update schema 字段后，B 更新表单 schema 的字段映射（仅适配层改动）。

## 4. 响应结构约定（联调防呆）

现有接口返回 `{ success, message, data }` 或 `{ success, errors }`；
文档错误码约定为 400/401/403/409/500。
请求确认：写操作失败时是否统一返回 `{ success: false, message, code? }`？
B 的适配层按「非 2xx 抛异常 → 页面回滚提示」实现，需要稳定的失败判定规则。

## 5. 其他（知会，不阻塞）

- **@dnd-kit**：落地方案技术栈已预选（阶段一引入），B 将在 W2 安装
  （package.json 变更请 A 知悉/合并），用于看板拖拽 + 乐观更新。
- **worker.js 的 lint warning**（`$` 未使用）：A 目录下的文件，CI 仅 error
  失败不受影响，A 可顺带清理。
- **jobs 接口**：文档要求 GET /api/jobs 支持 type/industry/from/to 筛选，
  当前仅支持 company 搜索；时间线页（W3，B 负责）开工前需要该契约，
  预计下周三联调前对齐即可。

## 对齐方式建议

周三联调会逐项过；第 1、2 项建议 A 在本周内出契约 PR（类型 + zod schema +
mock 数据，按「契约先行」做法），B 合并后替换适配层。
