// 看板列：列头（标题 + 光带 + 数量）+ 玻璃拟态卡片列表 + 空列占位。
// 拖拽：整列容器注册为 droppable（id = 列 key，data 携带状态集合供落点校验）；
// 悬停高亮由看板页根据「当前 over 列 + 流转合法性」计算后传入，
// 本组件不持有拖拽业务规则（规则统一在 status.ts 的 canTransition）。
// 视觉：深色玻璃面板悬浮于 three.js 雷达场景之上，Offer 列带翡翠辉光。
'use client'

import { useDroppable } from '@dnd-kit/core'

import { cn } from '@/lib/utils'
import type { Application } from '@/mocks/applications'
import { DraggableApplicationCard } from './DraggableApplicationCard'
import type { BoardColumnConfig } from './status'

/** 拖拽悬停高亮：none 无高亮；valid 合法落点；invalid 非法落点 */
export type DropHighlight = 'none' | 'valid' | 'invalid'

interface BoardColumnProps {
  /** 列配置（含该列收录的状态集合） */
  column: BoardColumnConfig
  /** 列强调色（status-visual.ts 单一数据源） */
  accent: string
  /** 该列已分好组的投递卡片 */
  applications: Application[]
  /** 点击卡片 → 打开详情抽屉 */
  onCardOpen: (application: Application) => void
  /** 拖拽悬停高亮状态 */
  dropHighlight?: DropHighlight
}

export function BoardColumn({
  column,
  accent,
  applications,
  onCardOpen,
  dropHighlight = 'none',
}: BoardColumnProps) {
  // 注册为拖拽落点：id 即列 key，data 供 onDragOver/onDragEnd 解析目标状态
  const { setNodeRef } = useDroppable({
    id: column.key,
    data: { statuses: column.statuses },
  })
  const isOffer = column.key === 'offer'

  return (
    <section aria-label={`${column.title}列`} className="flex flex-col gap-3">
      {/* 列头：状态色光带 + 标题 + 数量徽标 */}
      <div className="flex items-baseline justify-between gap-2 border-b border-white/10 pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="h-2.5 w-0.5 shrink-0 rounded-full"
            style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }}
          />
          <h2
            className={cn(
              'truncate text-[13px] font-semibold tracking-[0.02em]',
              isOffer ? 'text-[#7ee2b8]' : 'text-[#e8ecf6]',
            )}
          >
            {column.title}
          </h2>
        </div>
        <span className="text-[11.5px] tabular-nums text-[#8a93a8]">
          {applications.length}
        </span>
      </div>

      {/* 落点区域：卡片列表 + 空列占位都在其中，空列也可作为拖放目标 */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-24 flex-col gap-3 rounded-xl border p-1.5 transition-all duration-200',
          'border-white/8 bg-white/[0.045] backdrop-blur-md',
          dropHighlight === 'valid' &&
            'border-[#3d6bff]/60 bg-[#3d6bff]/10 shadow-[0_0_24px_-6px_rgba(61,107,255,0.45),inset_0_0_18px_rgba(61,107,255,0.08)]',
          dropHighlight === 'invalid' &&
            'border-[#ff6b6b]/50 bg-[#ff6b6b]/8 shadow-[0_0_24px_-6px_rgba(255,107,107,0.35)]',
          dropHighlight === 'none' && 'shadow-none',
          isOffer && dropHighlight === 'none' && 'border-[#34d399]/25 bg-[#34d399]/[0.05]',
        )}
      >
        {applications.map((app) => (
          <DraggableApplicationCard
            key={app.id}
            application={app}
            onOpen={onCardOpen}
          />
        ))}

        {/* 空列占位：保持列结构稳定，作为拖放目标视觉提示 */}
        {applications.length === 0 && (
          <p className="flex min-h-20 items-center justify-center rounded-lg border border-dashed border-white/12 px-3 py-4 text-center text-xs text-[#5c6579]">
            暂无投递
          </p>
        )}
      </div>
    </section>
  )
}
