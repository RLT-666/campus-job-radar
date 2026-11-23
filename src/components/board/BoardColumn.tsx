// 看板列：列头（标题 + 数量）+ 卡片列表 + 空列占位。
// 本组件只负责展示；拖拽落点（droppable）在 W2 接入 @dnd-kit 时由列容器承接，
// 列配置与状态归并规则统一来自 status.ts。
'use client'

import { ApplicationCard } from './ApplicationCard'
import type { BoardColumnConfig } from './status'
import type { Application } from '@/mocks/applications'

interface BoardColumnProps {
  /** 列配置（含该列收录的状态集合） */
  column: BoardColumnConfig
  /** 该列已分好组的投递卡片 */
  applications: Application[]
  /** 点击卡片 → 打开详情抽屉 */
  onCardOpen: (application: Application) => void
}

export function BoardColumn({ column, applications, onCardOpen }: BoardColumnProps) {
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

      {/* 列内卡片列表 */}
      <div className="flex min-h-24 flex-col gap-3">
        {applications.map((app) => (
          <ApplicationCard key={app.id} application={app} onOpen={onCardOpen} />
        ))}

        {/* 空列占位：保持列结构稳定，后续拖拽时作为有效落点视觉提示 */}
        {applications.length === 0 && (
          <p className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-[#d8d3c6] px-3 py-4 text-center text-xs text-[#a09a8c]">
            暂无投递
          </p>
        )}
      </div>
    </section>
  )
}
