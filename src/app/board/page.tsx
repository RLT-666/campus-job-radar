// ============================================================
// 看板页：投递漏斗 6 列视图 ——「深空雷达 · Mission Control」暗色版
// ============================================================
// 数据流：适配层 board-api → 纯 reducer board-reducer → 列/卡片组件
// （与旧版完全一致：乐观更新/回滚/状态机校验/埋点全部保留，仅重写视觉层）。
//
// 视觉：three.js 深空雷达背景（RadarScene，dynamic ssr:false 按需加载）
//   + CSS 氛围光晕层 + 玻璃拟态列与卡片。
//   配色：深空底 #05070e / 电光克莱因蓝 #3d6bff / 品牌青 #75e6ed /
//         琥珀 #f5b04d 仅作截止警示 / 翡翠 #34d399 表 Offer / 珊瑚红 #ff6b6b 表未通过。
// ============================================================
'use client'

import { useEffect, useReducer, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
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
import { Loader2, Plus, Radar } from 'lucide-react'

import {
  BoardColumn,
  type DropHighlight,
} from '@/components/board/BoardColumn'
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
  daysUntilDeadline,
  resolveTargetStatus,
} from '@/components/board/status'
import { COLUMN_ACCENTS } from '@/components/board/status-visual'
import type { TimelineEvent } from '@/components/board/mock-events'
import { track } from '@/lib/analytics'
import type { Application } from '@/mocks/applications'
import type { ApplicationFormValues } from './application-form.schema'

// 3D 背景：纯客户端渲染，服务端跳过（WebGL 依赖浏览器上下文）
const RadarScene = dynamic(() => import('@/components/board/RadarScene'), {
  ssr: false,
})

/** 轻提示语气：成功用电光蓝描边，失败用警示红 */
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
  // 决定列高亮（合法=电光蓝、非法=警示红、无=不变）
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

  // ---------- 拖拽编排（看板数据一致性，逻辑与旧版一致） ----------

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  // 悬停过程实时校验落点合法性：决定列高亮（电光蓝=可放、警示红=不可放）
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
    // 乐观更新：先改本地 UI，再调适配层（拖动后服务端状态一致）
    dispatch({ type: 'MOVE', id: app.id, from, to })
    moveApplicationStatus(app.id, from, to)
      .then(() => {
        // 埋点契约（analytics-events.md）：move_status 成功上报 from/to
        void track('move_status', { from, to })
      })
      .catch(() => {
        // 失败回滚本地状态并提示（断网拖动可回滚）
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

  // 页头统计：面试中（4 个面试态归并）/ Offer / 今日截止
  const interviewCount = applications.filter((app) =>
    ['interview_1', 'interview_2', 'interview_3', 'hr'].includes(app.status),
  ).length
  const offerCount = applications.filter(
    (app) => app.status === 'offer',
  ).length
  const dueTodayCount = applications.filter(
    (app) => daysUntilDeadline(app.deadline) === 0,
  ).length

  return (
    <main className="relative min-h-svh overflow-x-hidden bg-[#05070e] text-[#e8ecf6] [--color-primary:#3d6bff]">
      {/* 氛围光晕层（CSS）：深空底色 + 双侧辐射光，DOM 序在 3D 画布之前 */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(60%_80%_at_15%_25%,rgba(61,107,255,0.16),transparent_60%),radial-gradient(50%_70%_at_88%_12%,rgba(117,230,237,0.09),transparent_60%),radial-gradient(70%_60%_at_50%_115%,rgba(61,107,255,0.12),transparent_65%)]"
      />
      {/* three.js 深空雷达背景（星域粒子 + 扫描盘 + 线框穹顶，鼠标视差） */}
      <RadarScene />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        {/* 页头：衬线大标题 + 活动统计 + 主操作 */}
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-[11.5px] font-medium tracking-[0.18em] text-[#75e6ed]">
              <Radar size={14} aria-hidden="true" />
              CAMPUS JOB RADAR
            </div>
            <h1
              className="text-[32px] font-bold leading-tight tracking-[-0.01em] text-[#e8ecf6]"
              style={{ fontFamily: 'var(--font-serif-sc), serif' }}
            >
              投递看板
              <span className="ml-3 bg-gradient-to-r from-[#3d6bff] to-[#75e6ed] bg-clip-text text-transparent">
                · 深空雷达
              </span>
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] tabular-nums text-[#8a93a8]">
                共 <b className="font-semibold text-[#e8ecf6]">{totalCount}</b> 条投递
              </span>
              <span className="rounded-full border border-[#3d6bff]/30 bg-[#3d6bff]/10 px-3 py-1 text-[12px] tabular-nums text-[#9db9ff]">
                面试中 {interviewCount}
              </span>
              <span className="rounded-full border border-[#34d399]/30 bg-[#34d399]/10 px-3 py-1 text-[12px] tabular-nums text-[#7ee2b8]">
                Offer {offerCount}
              </span>
              {dueTodayCount > 0 && (
                <span className="rounded-full border border-[#f5b04d]/40 bg-[#f5b04d]/10 px-3 py-1 text-[12px] tabular-nums text-[#f5b04d]">
                  今日截止 {dueTodayCount}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#2b5cff] via-[#3d6bff] to-[#6f96ff] px-5 text-[13.5px] font-semibold text-white shadow-[0_6px_24px_-6px_rgba(61,107,255,0.55)] transition-all duration-200 hover:shadow-[0_8px_32px_-6px_rgba(61,107,255,0.7)] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3d6bff]/50 active:scale-[0.98]"
          >
            <Plus size={15} aria-hidden="true" />
            新建投递
          </button>
        </header>

        {/* 加载态：骨架占位，避免内容闪跳 */}
        {loading ? (
          <div className="flex min-h-48 items-center justify-center text-[#8a93a8]">
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
                    accent={COLUMN_ACCENTS[col.key]}
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

      {/* 轻提示：底部居中深色玻璃胶囊，读屏可感知 */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-white/12 bg-[#0b0f1a]/90 px-4 py-2 text-[13px] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)] backdrop-blur-md"
        >
          <span
            className={
              toast.tone === 'error' ? 'text-[#ff6b6b]' : 'text-[#e8ecf6]'
            }
          >
            {toast.message}
          </span>
        </div>
      )}
    </main>
  )
}
