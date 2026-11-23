// ============================================================
// 看板页：投递漏斗 6 列视图（阶段一闭环）
// ============================================================
// 数据流：适配层 board-api → 纯 reducer board-reducer → 列/卡片组件。
// 当前由 mock 数据驱动（按《分工执行计划》表 5，看板可用 mock 并行开发）；
// A 的契约对齐后仅替换 board-api 内部实现，本页与组件零改动。
//
// 埋点：创建卡片成功上报 create_application（props: channel/status，
// 口径见 docx/analytics-events.md，事件表由 C 维护）。
//
// 详情抽屉：点击卡片右侧滑出，含完整字段、笔记乐观保存（失败回滚）、
// 环节时间线（mock events，契约对齐后换 events 接口）与删除二次确认。
//
// 设计语言：产品页统一走「截止时刻表 · Editorial」
// （纸面 #faf9f6 / 墨色 #1a1a17 / 克莱因蓝 #002fa7 / 琥珀仅作截止警示）。
// 主色通过作用域内覆盖 --color-primary 实现，暂不动全局 shadcn 令牌，
// 全站令牌统一在 W5「视觉统一」任务中一次性收敛。
// ============================================================
'use client'

import { useEffect, useReducer, useRef, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Loader2, Plus } from 'lucide-react'

import { BoardColumn, type DropHighlight } from '@/components/board/BoardColumn'
import { ApplicationDrawer } from '@/components/board/ApplicationDrawer'
import { CreateApplicationModal } from '@/components/board/CreateApplicationModal'
import {
  createApplication,
  deleteApplication,
  fetchApplicationEvents,
  fetchBoardApplications,
  moveApplicationStatus,
  saveApplicationNotes,
} from '@/components/board/board-api'
import { boardReducer } from '@/components/board/board-reducer'
import {
  BOARD_COLUMNS,
  canTransition,
  resolveTargetStatus,
} from '@/components/board/status'
import type { TimelineEvent } from '@/components/board/mock-events'
import { Button } from '@/components/ui/Button'
import { track } from '@/lib/analytics'
import type { Application } from '@/mocks/applications'
import type { ApplicationFormValues } from './application-form.schema'

/** 轻提示语气：成功用墨色描边，失败用警示红 */
type ToastTone = 'success' | 'error'

export default function BoardPage() {
  // 看板卡片列表：唯一状态源，全部变更走 reducer（乐观更新/回滚的载体）
  const [applications, dispatch] = useReducer(boardReducer, [])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  // 详情抽屉：只存选中 id，展示对象从列表派生（笔记/状态变更即时反映，无副本漂移）
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected =
    applications.find((app) => app.id === selectedId) ?? null
  // 时间线：随选中卡片拉取（契约对齐后由 events 接口提供）
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  // 删除进行中：防止确认框重复提交
  const [deleting, setDeleting] = useState(false)
  // 拖拽过程状态：activeId 为拖动中卡片 id；overColumnKey + overValid
  // 决定列高亮（合法=蓝、非法=红、无=不变）
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overColumnKey, setOverColumnKey] = useState<string | null>(null)
  const [overValid, setOverValid] = useState(false)
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(
    null,
  )
  // 轻提示自动消失计时器：重复触发时重置，避免多条提示互相顶掉
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 拖拽传感器：指针（鼠标/触摸/笔）设 6px 激活距离防误触；
  // 键盘传感器支持手柄聚焦后空格提起、方向键移动、空格放下
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  function showToast(message: string, tone: ToastTone = 'success') {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message, tone })
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  // 初次加载：适配层拉取当前用户全部投递（当前为 mock）
  useEffect(() => {
    let cancelled = false
    fetchBoardApplications()
      .then((data) => {
        if (!cancelled) dispatch({ type: 'LOAD', applications: data })
      })
      .catch(() => {
        if (!cancelled) showToast('加载投递数据失败，请刷新重试', 'error')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 建卡提交：适配层新增 → reducer 生效 → 关闭弹窗 → 埋点。
  // 契约对齐后 createApplication 失败会抛异常，弹窗保持打开并提示，不丢用户输入。
  async function handleCreate(values: ApplicationFormValues) {
    try {
      const application = await createApplication(values)
      dispatch({ type: 'ADD', application })
      setModalOpen(false)
      showToast('投递卡片已创建')
      // 埋点契约（analytics-events.md）：props 传 channel 与 status
      void track('create_application', {
        channel: values.channel,
        status: values.status,
      })
    } catch {
      showToast('创建失败，请稍后重试', 'error')
    }
  }

  // 打开详情抽屉：先置加载态再记选中 id（加载态在事件处理器中设置，
  // 避免 effect 体内同步 setState 触发 react-hooks/set-state-in-effect）
  function handleOpenCard(application: Application) {
    setEventsLoading(true)
    setSelectedId(application.id)
  }

  // 关闭抽屉：清空选中与时间线缓存，保证下次打开不闪旧数据
  function handleCloseDrawer() {
    setSelectedId(null)
    setEvents([])
    setEventsLoading(false)
  }

  // 选中卡片变化时拉取环节时间线（倒序由适配层保证）。
  // 仅异步回调中 setState；selectedId 为 null 时直接返回（此时抽屉已关）
  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    fetchApplicationEvents(selectedId)
      .then((list) => {
        if (!cancelled) setEvents(list)
      })
      .catch(() => {
        if (!cancelled) showToast('时间线加载失败', 'error')
      })
      .finally(() => {
        if (!cancelled) setEventsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedId])

  // 保存笔记（乐观更新）：
  // 先派发 UPDATE_NOTES 立即改本地列表 → 再调适配层 → 失败回滚旧值并提示。
  // 这是《落地方案》难点一「乐观更新 + 失败回滚」在笔记场景的同一套编排。
  function handleSaveNotes(id: string, notes: string) {
    const previous = applications.find((app) => app.id === id)?.notes ?? ''
    dispatch({ type: 'UPDATE_NOTES', id, notes })
    saveApplicationNotes(id, notes)
      .then(() => showToast('笔记已保存'))
      .catch(() => {
        dispatch({ type: 'UPDATE_NOTES', id, notes: previous })
        showToast('保存失败，已还原', 'error')
      })
  }

  // 删除卡片：非乐观（有二次确认），适配层成功后移除并关闭抽屉
  function handleDelete(id: string) {
    setDeleting(true)
    deleteApplication(id)
      .then(() => {
        dispatch({ type: 'DELETE', id })
        handleCloseDrawer()
        showToast('投递卡片已删除')
      })
      .catch(() => showToast('删除失败，请稍后重试', 'error'))
      .finally(() => setDeleting(false))
  }

  // ---------- 拖拽编排（对应《落地方案》难点一：看板数据一致性） ----------

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  // 悬停过程实时校验落点合法性：决定列高亮（蓝=可放、红=不可放）
  function handleDragOver(event: DragOverEvent) {
    if (!event.over || !activeId) {
      setOverColumnKey(null)
      setOverValid(false)
      return
    }
    const column = BOARD_COLUMNS.find((col) => col.key === event.over!.id)
    const app = applications.find((a) => a.id === activeId)
    if (!column || !app) {
      setOverColumnKey(null)
      setOverValid(false)
      return
    }
    setOverColumnKey(column.key)
    const to = resolveTargetStatus(app.status, column)
    setOverValid(
      to !== null && to !== app.status && canTransition(app.status, to),
    )
  }

  // 松手：解析落点 → 状态机校验 → 乐观更新 + 适配层调用 → 失败回滚
  function handleDragEnd(event: DragEndEvent) {
    const overKey = event.over ? String(event.over.id) : null
    setActiveId(null)
    setOverColumnKey(null)
    setOverValid(false)

    // 未落在任何列上：放弃本次拖动
    if (!overKey) return
    const app = applications.find((a) => a.id === event.active.id)
    const column = BOARD_COLUMNS.find((col) => col.key === overKey)
    if (!app || !column) return

    const to = resolveTargetStatus(app.status, column)
    // 放回原列/原状态：静默无操作（不打扰）
    if (to === null || to === app.status) return
    // 状态机不允许的流转：明确提示，不静默放行（脏数据防线）
    if (!canTransition(app.status, to)) {
      showToast(`不允许流转到「${column.title}」`, 'error')
      return
    }

    const from = app.status
    // 乐观更新：先改本地 UI，再调适配层（W2 验收：拖动后服务端状态一致）
    dispatch({ type: 'MOVE', id: app.id, from, to })
    moveApplicationStatus(app.id, from, to)
      .then(() => {
        // 埋点契约（analytics-events.md）：move_status 成功上报 from/to
        void track('move_status', { from, to })
      })
      .catch(() => {
        // 失败回滚本地状态并提示（W2 验收：断网拖动可回滚）
        dispatch({ type: 'ROLLBACK', id: app.id, previousStatus: from })
        showToast('状态流转失败，已回滚', 'error')
      })
  }

  function handleDragCancel() {
    setActiveId(null)
    setOverColumnKey(null)
    setOverValid(false)
  }

  // 按列配置对当前卡片分组（列配置来自 status.ts 单一数据源）
  const columns = BOARD_COLUMNS.map((col) => ({
    ...col,
    items: applications.filter((app) => col.statuses.includes(app.status)),
  }))

  const totalCount = applications.length

  return (
    <main className="min-h-svh bg-[#faf9f6] text-[#1a1a17] [--color-primary:#002fa7]">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        {/* 页头：衬线大标题 + 统计 + 主操作 */}
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1
              className="text-[28px] font-bold leading-tight tracking-[-0.01em]"
              style={{ fontFamily: 'var(--font-serif-sc), serif' }}
            >
              投递看板
            </h1>
            <p className="mt-1.5 text-[13.5px] text-[#7d786d]">
              共 {totalCount} 条投递 · 按进度跟踪校招机会
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setModalOpen(true)}
            className="h-9 cursor-pointer gap-1.5 px-4 text-[13.5px] font-medium text-white transition-colors duration-200 hover:bg-[#00267f]"
          >
            <Plus size={15} aria-hidden="true" />
            新建投递
          </Button>
        </header>

        {/* 加载态：骨架占位，避免内容闪跳 */}
        {loading ? (
          <div className="flex min-h-48 items-center justify-center text-[#7d786d]">
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            <span className="ml-2 text-sm">正在加载投递数据…</span>
          </div>
        ) : (
          /* 列容器：窄屏单列纵向堆叠，桌面 2/3 列、超宽 6 列，
             保证 375px 无横向滚动（移动端验收标准）。
             拖拽上下文包裹整个网格：卡片跨列流转在此编排 */
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              {columns.map((col) => {
                // 仅拖动中的卡片所在指针悬停的列需要高亮；合法/非法由状态机判定
                const dropHighlight: DropHighlight =
                  activeId === null
                    ? 'none'
                    : overColumnKey === col.key
                      ? overValid
                        ? 'valid'
                        : 'invalid'
                      : 'none'
                return (
                  <BoardColumn
                    key={col.key}
                    column={col}
                    applications={col.items}
                    onCardOpen={handleOpenCard}
                    dropHighlight={dropHighlight}
                  />
                )
              })}
            </div>
          </DndContext>
        )}
      </div>

      {/* 新建投递弹窗 */}
      <CreateApplicationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleCreate}
      />

      {/* 卡片详情抽屉 */}
      <ApplicationDrawer
        application={selected}
        onOpenChange={(open) => {
          if (!open) handleCloseDrawer()
        }}
        onSaveNotes={handleSaveNotes}
        onDelete={handleDelete}
        events={events}
        eventsLoading={eventsLoading}
        deleting={deleting}
      />

      {/* 轻提示：底部居中，读屏可感知 */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full border bg-white px-4 py-2 text-[13px] shadow-[0_8px_24px_-8px_rgba(26,26,23,0.24)]"
        >
          <span
            className={
              toast.tone === 'error' ? 'text-[#b42318]' : 'text-[#1a1a17]'
            }
          >
            {toast.message}
          </span>
        </div>
      )}
    </main>
  )
}
