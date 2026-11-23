// ============================================================
// 看板数据访问适配层（UI 与数据源之间的唯一边界）
// ============================================================
// 背景：按《分工执行计划》表 5「看板页面依赖投递 API 契约（可用 mock）」，
// 在 A 的契约对齐前，看板先用本地 mock 驱动开发，页面与组件不感知数据来源。
//
// 契约对齐后（见 docx/契约对齐清单-成员B.md）只需修改本文件各函数实现：
//   1. fetchBoardApplications  → GET    /api/applications
//   2. createApplication       → POST   /api/applications
//   3. moveApplicationStatus   → PATCH  /api/applications/:id/status（服务端写 events）
//   4. saveApplicationNotes    → PATCH  /api/applications/:id
//   5. deleteApplication       → DELETE /api/applications/:id
// 页面层与组件层零改动。
//
// 错误约定：除 fetch 外的写操作失败时【必须抛异常】，
// 页面层依赖异常来触发乐观更新回滚与提示，这是 W2「断网可回滚」验收的前提。
// ============================================================

import type { ApplicationFormValues } from '@/app/board/application-form.schema'
import {
  mockApplications,
  type Application,
} from '@/mocks/applications'
import type { ApplicationStatus } from './status'

/** 拉取当前用户的投递卡片列表（目前返回本地 mock 数据） */
export async function fetchBoardApplications(): Promise<Application[]> {
  // TODO(契约对齐后): 调 GET /api/applications，未登录 401 时交由页面层跳转登录
  return mockApplications
}

/**
 * 新建投递卡片。
 * 目前本地生成临时 id（浏览器 crypto.randomUUID）；
 * 契约对齐后由服务端生成 uuid 并返回完整记录。
 */
export async function createApplication(
  values: ApplicationFormValues,
): Promise<Application> {
  const application: Application = {
    id: crypto.randomUUID(),
    company: values.company,
    position: values.position,
    channel: values.channel,
    salaryRange: values.salaryRange || undefined,
    status: values.status,
    deadline: values.deadline || undefined,
    notes: values.notes || undefined,
  }

  // TODO(契约对齐后): 调 POST /api/applications，成功用返回值替换本地构造的卡片
  return application
}

/**
 * 状态流转（拖拽落列后调用）。
 * from 用于服务端做状态冲突校验（文档错误码约定：409 状态冲突），
 * to 为目标状态；服务端同时写入 events 时间线。
 */
export async function moveApplicationStatus(
  _id: string,
  _from: ApplicationStatus,
  _to: ApplicationStatus,
): Promise<void> {
  // TODO(契约对齐后): 调 PATCH /api/applications/:id/status，
  // 非 2xx（含 409 冲突、500）一律 throw，触发页面层回滚
}

/** 保存卡片笔记（抽屉内编辑）。失败必须抛异常触发回滚。 */
export async function saveApplicationNotes(
  _id: string,
  _notes: string,
): Promise<void> {
  // TODO(契约对齐后): 调 PATCH /api/applications/:id
}

/** 删除投递卡片。失败必须抛异常。 */
export async function deleteApplication(_id: string): Promise<void> {
  // TODO(契约对齐后): 调 DELETE /api/applications/:id
}
