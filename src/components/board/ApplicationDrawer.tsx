// ============================================================
// 卡片详情抽屉：完整字段展示 + 笔记编辑 + 环节时间线 + 删除
// ============================================================
// 交互约定：
//   - 打开/关闭受控（application 为 null 即关闭），Radix Dialog 提供
//     焦点圈定、Escape 关闭与无障碍语义；
//   - 笔记编辑为「本地草稿 + 显式保存」：保存由页面层乐观编排
//     （先改列表再调适配层，失败回滚），NotesEditor 只维护草稿与脏状态；
//     草稿重置用 key 重挂载实现（React 官方推荐，避免 effect 内 setState）；
//   - 删除走 AlertDialog 二次确认，防误触。
// 样式：Editorial 白面板右滑抽屉，移动端铺满（375px 验收）。
// ============================================================
'use client'

import { useState } from 'react'
import { AlertDialog, Dialog } from 'radix-ui'
import { ExternalLink, Loader2, Trash2, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Application } from '@/mocks/applications'
import { DeadlineBadge } from './DeadlineBadge'
import type { TimelineEvent } from './mock-events'
import { STATUS_LABELS } from './status'

interface ApplicationDrawerProps {
  /** 当前查看的卡片；null 表示抽屉关闭 */
  application: Application | null
  onOpenChange: (open: boolean) => void
  /** 笔记保存（页面层做乐观更新 + 失败回滚编排） */
  onSaveNotes: (id: string, notes: string) => void
  /** 删除卡片（页面层调适配层并派发 DELETE） */
  onDelete: (id: string) => void
  /** 环节时间线（按发生时间倒序，由页面层通过适配层拉取） */
  events: TimelineEvent[]
  /** 时间线加载中 */
  eventsLoading: boolean
  /** 删除请求进行中（防止重复点击） */
  deleting: boolean
}

// ---------- 笔记编辑器（内嵌子组件，key 重挂载重置草稿） ----------
interface NotesEditorProps {
  application: Application
  onSaveNotes: (id: string, notes: string) => void
}

function NotesEditor({ application, onSaveNotes }: NotesEditorProps) {
  // 草稿初始值取自当前卡片；父组件用 key={application.id} 保证切换卡片时重挂载
  const [draft, setDraft] = useState(application.notes ?? '')

  // 草稿与已保存值一致时禁用保存按钮，避免无意义请求
  const savingDisabled = draft === (application.notes ?? '')

  return (
    <section aria-labelledby="drawer-notes-title">
      <h3
        id="drawer-notes-title"
        className="text-[11.5px] font-medium tracking-[0.08em] text-[#7d786d]"
      >
        笔记
      </h3>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={4}
        maxLength={500}
        placeholder="补充面试反馈、下一步安排等"
        className="mt-2 w-full min-w-0 rounded-xl border border-[#e0dcd2] bg-[#faf9f6] px-3 py-2.5 text-[13.5px] leading-relaxed text-[#1a1a17] caret-[#002fa7] placeholder:text-[#a09a8c] focus-visible:border-[#002fa7]/60 focus-visible:outline-none"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11.5px] tabular-nums text-[#a09a8c]">
          {draft.length}/500
        </span>
        <button
          type="button"
          disabled={savingDisabled}
          onClick={() => onSaveNotes(application.id, draft)}
          className={cn(
            'h-8 cursor-pointer rounded-lg bg-[#002fa7] px-3.5 text-[13px] font-medium text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002fa7]/40',
            savingDisabled
              ? 'cursor-not-allowed opacity-40'
              : 'hover:bg-[#00267f]',
          )}
        >
          保存笔记
        </button>
      </div>
    </section>
  )
}

// ---------- 时间线单条：状态圆点 + 竖线 + 状态名 + 时间 + 备注 ----------
function TimelineItem({ event }: { event: TimelineEvent }) {
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {/* 圆点与连接线（纯装饰） */}
      <span aria-hidden="true" className="mt-1 flex flex-col items-center">
        <span className="size-2 rounded-full bg-[#002fa7]" />
        <span className="w-px flex-1 bg-[#ece8de]" />
      </span>
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-[#1a1a17]">
          {STATUS_LABELS[event.type] ?? event.type}
        </p>
        <p className="mt-0.5 text-[11.5px] tabular-nums text-[#7d786d]">
          {new Date(event.occurredAt).toLocaleString('zh-CN', { hour12: false })}
        </p>
        {event.note && (
          <p className="mt-1 text-[12.5px] leading-relaxed text-[#5f5b52]">
            {event.note}
          </p>
        )}
      </div>
    </li>
  )
}

export function ApplicationDrawer({
  application,
  onOpenChange,
  onSaveNotes,
  onDelete,
  events,
  eventsLoading,
  deleting,
}: ApplicationDrawerProps) {
  return (
    <Dialog.Root open={application !== null} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* 遮罩：轻量墨色，点击关闭 */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#1a1a17]/25 data-[state=open]:animate-in data-[state=open]:fade-in-0" />

        {/* 面板：桌面右滑抽屉（限宽），移动端铺满 */}
        <Dialog.Content className="fixed right-0 top-0 z-50 flex h-dvh w-full flex-col overflow-hidden border-l border-[#e7e3d9] bg-white outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=open]:fade-in-0 data-[state=open]:duration-200 sm:w-[26rem]">
          {application && (
            <>
              {/* 头部：衬线公司名 + 岗位 + 状态标签 + 关闭 */}
              <header className="border-b border-[#ece8de] px-5 pb-4 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Dialog.Title
                      className="truncate text-[22px] font-bold leading-tight text-[#1a1a17]"
                      style={{ fontFamily: 'var(--font-serif-sc), serif' }}
                    >
                      {application.company}
                    </Dialog.Title>
                    <Dialog.Description className="mt-1 truncate text-[13.5px] text-[#5f5b52]">
                      {application.position}
                    </Dialog.Description>
                  </div>
                  <Dialog.Close
                    aria-label="关闭详情"
                    className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#7d786d] transition-colors duration-200 hover:bg-[#f3f1ea] hover:text-[#1a1a17] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002fa7]/40"
                  >
                    <X size={16} aria-hidden="true" />
                  </Dialog.Close>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full border border-[#c9d3f0] bg-[#eef2fd] px-2.5 py-0.5 text-[11.5px] font-medium text-[#002fa7]">
                    {STATUS_LABELS[application.status]}
                  </span>
                  <DeadlineBadge deadline={application.deadline} />
                </div>
              </header>

              {/* 主体：可滚动区域 */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {/* 元信息 */}
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
                  <div>
                    <dt className="text-[11.5px] text-[#7d786d]">渠道</dt>
                    <dd className="mt-0.5 text-[#1a1a17]">{application.channel}</dd>
                  </div>
                  <div>
                    <dt className="text-[11.5px] text-[#7d786d]">薪资范围</dt>
                    <dd className="mt-0.5 text-[#1a1a17]">
                      {application.salaryRange || '未填写'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11.5px] text-[#7d786d]">截止时间</dt>
                    <dd className="mt-0.5 text-[#1a1a17]">
                      {application.deadline || '未填写'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11.5px] text-[#7d786d]">来源链接</dt>
                    <dd className="mt-0.5">
                      {application.sourceUrl ? (
                        // 合规要求：展示原文链接并新窗口打开
                        <a
                          href={application.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#002fa7] underline-offset-4 hover:underline"
                        >
                          查看原文
                          <ExternalLink size={12} aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="text-[#a09a8c]">未填写</span>
                      )}
                    </dd>
                  </div>
                </dl>

                {/* 笔记编辑：key 重挂载保证切换卡片时草稿重置 */}
                <div className="mt-6">
                  <NotesEditor
                    key={application.id}
                    application={application}
                    onSaveNotes={onSaveNotes}
                  />
                </div>

                {/* 环节时间线 */}
                <section className="mt-6" aria-labelledby="drawer-timeline-title">
                  <h3
                    id="drawer-timeline-title"
                    className="text-[11.5px] font-medium tracking-[0.08em] text-[#7d786d]"
                  >
                    环节时间线
                  </h3>
                  {eventsLoading ? (
                    <div className="mt-3 flex items-center text-[#7d786d]">
                      <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                      <span className="ml-2 text-[12.5px]">加载中…</span>
                    </div>
                  ) : events.length === 0 ? (
                    <p className="mt-3 rounded-xl border border-dashed border-[#d8d3c6] px-3 py-4 text-center text-[12.5px] text-[#a09a8c]">
                      暂无流转记录
                    </p>
                  ) : (
                    <ul className="mt-3">
                      {events.map((event) => (
                        <TimelineItem key={event.id} event={event} />
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              {/* 底部：危险操作 */}
              <footer className="border-t border-[#ece8de] px-5 py-4">
                <AlertDialog.Root>
                  <AlertDialog.Trigger asChild>
                    <button
                      type="button"
                      disabled={deleting}
                      className="flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#f0d5d2] bg-[#fdf5f4] text-[13px] font-medium text-[#b42318] transition-colors duration-200 hover:bg-[#fbeae8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b42318]/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      删除投递
                    </button>
                  </AlertDialog.Trigger>
                  <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-[#1a1a17]/35 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                    <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[60] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#e7e3d9] bg-white p-6 outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
                      <AlertDialog.Title className="text-[17px] font-bold text-[#1a1a17]">
                        删除这条投递？
                      </AlertDialog.Title>
                      <AlertDialog.Description className="mt-1.5 text-[13px] leading-relaxed text-[#5f5b52]">
                        {application.company} · {application.position}
                        将从看板中移除，该操作不可恢复。
                      </AlertDialog.Description>
                      <div className="mt-5 flex justify-end gap-2">
                        <AlertDialog.Cancel asChild>
                          <button
                            type="button"
                            className="h-8 cursor-pointer rounded-lg border border-[#e0dcd2] px-3.5 text-[13px] text-[#5f5b52] transition-colors duration-200 hover:bg-[#f3f1ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002fa7]/40"
                          >
                            取消
                          </button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                          <button
                            type="button"
                            onClick={() => onDelete(application.id)}
                            className="h-8 cursor-pointer rounded-lg bg-[#b42318] px-3.5 text-[13px] font-medium text-white transition-colors duration-200 hover:bg-[#9a1d14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b42318]/40"
                          >
                            确认删除
                          </button>
                        </AlertDialog.Action>
                      </div>
                    </AlertDialog.Content>
                  </AlertDialog.Portal>
                </AlertDialog.Root>
              </footer>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
