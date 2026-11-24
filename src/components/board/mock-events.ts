// ============================================================
// 环节时间线的本地 mock 存储（内存态，页面刷新即重置）
// ============================================================
// 用途：A 的 events 契约（PATCH /:id/status 写 events + GET /:id/events）
// 落地前，驱动详情抽屉的时间线展示与流转记录。
// 契约对齐后：board-api 改为调用真实 events 接口，本文件整体删除。
//
// 事件语义与《落地方案》图 2 events 表一致：
//   type        = 到达的状态（投递状态枚举）
//   occurred_at = 发生时间（ISO 串）
//   note        = 可选备注
// ============================================================

import type { ApplicationStatus } from './status'

export interface TimelineEvent {
  id: string
  /** 到达的状态：与 events 表 type 字段语义一致（状态枚举） */
  type: ApplicationStatus
  /** 发生时间（ISO 字符串） */
  occurredAt: string
  note?: string
}

// 模块级内存存储：key 为投递卡片 id
const store = new Map<string, TimelineEvent[]>()

/** 为指定卡片初始化时间线（仅在尚无记录时写入，幂等） */
export function seedMockEvents(
  applicationId: string,
  events: TimelineEvent[],
): void {
  if (!store.has(applicationId)) {
    store.set(applicationId, events)
  }
}

/** 读取指定卡片的时间线（按发生时间倒序，符合「时间线按发生时间倒序」验收） */
export function getMockEvents(applicationId: string): TimelineEvent[] {
  return [...(store.get(applicationId) ?? [])].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )
}

/** 追加一条流转事件（创建卡片、状态流转时由适配层调用） */
export function appendMockEvent(
  applicationId: string,
  event: TimelineEvent,
): void {
  const events = store.get(applicationId) ?? []
  store.set(applicationId, [...events, event])
}
