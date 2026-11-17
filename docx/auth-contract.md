# 认证与路由契约

## 路由约定
- 公开路由：`/login`、`/api/auth/**`
- 受保护路由：`/timeline`、`/board`、`/me`、`/match`
- 未登录访问受保护路由：proxy 重定向到 `/login?next=原路径`
- 登录成功：回跳 `next`，若无则回 `/timeline`
- 登出：回 `/login`

## 错误码
- 400 参数错误
- 401 未登录
- 403 无权限
- 500 服务异常

## 前端调用规范
前端通过 `@/lib/auth/client` 导出的函数进行登录/登出操作，不要直接调用 Supabase。