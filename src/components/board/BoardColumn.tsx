// 看板列：列头（标题 + 数量）+ 卡片列表 + 空列占位。
// 拖拽：整列容器注册为 droppable（id = 列 key，data 携带状态集合供落点校验）；
// 悬停高亮由看板页根据「当前 over 列 + 流转合法性」计算后传入，
// 本组件不持有拖拽业务规则（规则统一在 status.ts 的 canTransition）。
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
  /** 该列已分好组的投递卡片 */
  applications: Application[]
  /** 点击卡片 → 打开详情抽屉 */
  onCardOpen: (application: Application) => void
  /** 拖拽悬停高亮状态 */
  dropHighlight?: DropHighlight
}

export function BoardColumn({
  column,
  applications,
  onCardOpen,
  dropHighlight = 'none',
}: BoardColumnProps) {
  // 注册为拖拽落点：id 即列 key，data 供 onDragOver/onDragEnd 解析目标状态
  const { setNodeRef } = useDroppable({
    id: column.key,
    data: { statuses: column.statuses },
  })

  return (
    <section aria-label={`${column.title}列`} className="flex flex-col gap-3">
      {/* 列头：编辑风细分隔线 + 数量徽标 */}
      <div className="flex items-baseline justify-between border-b border-[#1a1a17] pb-2">
        <h2 className="text-[13px] font-semibold tracking-[0.02em] text-[#1a1a17]">
          {column.title}
        </h2>
        <span className="text-[11.5px] tabular-nums text-[#7d786d]">
          {applications.length}
        </span>
      </div>

      {/* 落点区域：卡片列表 + 空列占位都在其中，空列也可作为拖放目标 */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-24 flex-col gap-3 rounded-xl border p-1.5 transition-colors duration-150',
          dropHighlight === 'valid' && 'border-[#002fa7]/50 bg-[#eef2fd]/70',
          dropHighlight === 'invalid' && 'border-[#b42318]/40 bg-[#fdf5f4]/70',
          dropHighlight === 'none' && 'border-transparent',
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
          <p className="flex min-h-20 items-center justify-center rounded-lg border border-dashed border-[#d8d3c6] px-3 py-4 text-center text-xs text-[#a09a8c]">
            暂无投递
          </p>
        )}
      </div>
    </section>
  )
}
