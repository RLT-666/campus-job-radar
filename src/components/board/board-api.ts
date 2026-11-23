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
//   6. fetchApplicationEvents  → GET    /api/applications/:id/events
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
import {
  appendMockEvent,
  getMockEvents,
  seedMockEvents,
  type TimelineEvent,
} from './mock-events'
import type { ApplicationStatus } from './status'

/** 为 mock 卡片预置的时间线（模拟历史流转，接口对齐后由 events 表提供） */
const MOCK_EVENT_SEED: Record<string, TimelineEvent[]> = {
  'app-001': [
    { id: 'evt-001', type: 'wishlist', occurredAt: '2026-11-10T09:00:00.000Z' },
    { id: 'evt-002', type: 'applied', occurredAt: '2026-11-12T14:30:00.000Z', note: '官网投递' },
  ],
  'app-002': [
    { id: 'evt-003', type: 'wishlist', occurredAt: '2026-11-08T10:00:00.000Z' },
    { id: 'evt-004', type: 'applied', occurredAt: '2026-11-09T16:20:00.000Z', note: '内推投递' },
    { id: 'evt-005', type: 'written', occurredAt: '2026-11-15T19:00:00.000Z' },
    { id: 'evt-006', type: 'interview_1', occurredAt: '2026-11-18T10:00:00.000Z', note: '一面安排在周三下午' },
  ],
  'app-003': [
    { id: 'evt-007', type: 'wishlist', occurredAt: '2026-11-16T12:00:00.000Z', note: '宣讲会看到' },
  ],
}

/** 模块加载时预置 mock 事件（幂等） */
for (const [id, events] of Object.entries(MOCK_EVENT_SEED)) {
  seedMockEvents(id, events)
}

/** 拉取当前用户的投递卡片列表（目前返回本地 mock 数据） */
export async function fetchBoardApplications(): Promise<Application[]> {
  // TODO(契约对齐后): 调 GET /api/applications，未登录 401 时交由页面层跳转登录
  return mockApplications
}

/**
 * 新建投递卡片。
 * 目前本地生成临时 id（浏览器 crypto.randomUUID）并写入一条「意向」起始事件；
 * 契约对齐后由服务端生成 uuid、写入 events 起始记录并返回完整数据。
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

  // 时间线起点：卡片创建即到达初始状态（与 events 表「状态流转写入」口径一致）
  appendMockEvent(application.id, {
    id: crypto.randomUUID(),
    type: values.status,
    occurredAt: new Date().toISOString(),
    note: '创建投递',
  })

  // TODO(契约对齐后): 调 POST /api/applications，成功用返回值替换本地构造的卡片
  return application
}

/**
 * 状态流转（拖拽落列后调用）。
 * from 用于服务端做状态冲突校验（文档错误码约定：409 状态冲突），
 * to 为目标状态；服务端同时写入 events 时间线。
 */
export async function moveApplicationStatus(
  id: string,
  from: ApplicationStatus,
  to: ApplicationStatus,
): Promise<void> {
  // mock 阶段：本地追加流转事件，模拟服务端写 events 的行为
  appendMockEvent(id, {
    id: crypto.randomUUID(),
    type: to,
    occurredAt: new Date().toISOString(),
    note: `${from} → ${to}`,
  })

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

/**
 * 读取卡片环节时间线（目前来自本地 mock 事件存储，按发生时间倒序）。
 * 契约对齐后改为调 GET /api/applications/:id/events。
 */
export async function fetchApplicationEvents(
  applicationId: string,
): Promise<TimelineEvent[]> {
  return getMockEvents(applicationId)
}
