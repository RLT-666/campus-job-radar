# 埋点事件契约表

| 事件名 | 触发时机 | 关键 props | 调用方 | 计划周 |
|---|---|---|---|---|
| `signup` | 登录成功且首次注册 | `source` | C（登录回调） | W1 |
| `view_timeline` | 时间线页加载成功 | `filter_type`, `filter_industry`, `filter_time` | B | W1 |
| `create_application` | 创建投递卡片成功 | `channel`, `status` | B | W1 |
| `move_status` | 拖拽状态流转成功 | `from`, `to` | B/A | W1—W2 |
| `favorite_job` | 收藏/取消收藏成功 | `job_id`, `action` | B | W3 |
| `push_sent` | Worker 推送成功 | `channel`, `kind` | A/C | W3—W4 |
| `push_open` | 推送落地页打开 | `channel`, `kind` | B/C | W4 |
| `resume_match` | AI 匹配成功 | `match_score`, `degraded` | C | W6 |

**统一规则：**
1. 服务端从 session 取 `user_id`，不信任客户端传 `user_id`。
2. 所有 props 经 zod 校验，禁止自由文本透传。
3. 新增事件必须经 C 登记（更新此文档）。