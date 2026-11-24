// 投递卡片：看板列内的单条投递展示。
// 结构说明：外层 div 承载卡片视觉（边框/悬浮/阴影），内层 button 承载
// 「点击打开详情抽屉」；拖拽手柄由 dragHandle 槽位注入并独立于内层按钮
// （避免 button 嵌套 button 的非法 HTML，也避免点击与拖拽手势互相干扰）。
// 设计语言遵循「截止时刻表 · Editorial」：白底卡片 + 细分隔线 + 墨色正文；
// Offer 态用克莱因蓝边框点缀，其余状态中性；截止标签复用 DeadlineBadge。
'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import type { Application } from '@/mocks/applications'
import { DeadlineBadge } from './DeadlineBadge'

interface ApplicationCardProps {
  application: Application
  /** 点击卡片打开详情抽屉 */
  onOpen: (application: Application) => void
  /** 拖拽手柄（可选）：由 DraggableApplicationCard 注入 dnd-kit 的 listeners 与 attributes */
  dragHandle?: ReactNode
}

export function ApplicationCard({
  application,
  onOpen,
  dragHandle,
}: ApplicationCardProps) {
  const isOffer = application.status === 'offer'

  return (
    <div
      className={cn(
        // 卡片视觉在外层容器：悬浮轻微上浮 + 边框加深
        'group/card relative rounded-xl border bg-white shadow-[0_1px_2px_rgba(26,26,23,0.04)] transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-[#d8d3c6] hover:shadow-[0_8px_24px_-12px_rgba(26,26,23,0.18)]',
        isOffer ? 'border-[#c9d3f0]' : 'border-[#e7e3d9]',
      )}
    >
      {/* 拖拽手柄：右上角，悬浮/聚焦时加深 */}
      {dragHandle && (
        <span className="absolute right-2.5 top-2.5 z-10">{dragHandle}</span>
      )}

      {/* 内容按钮：整卡可点开抽屉；标题行右侧留出手柄空间 */}
      <button
        type="button"
        onClick={() => onOpen(application)}
        // 键盘可聚焦可触发，读屏播报完整内容
        aria-label={`${application.company} ${application.position}，状态 ${application.status}`}
        className="w-full cursor-pointer rounded-xl p-4 pr-9 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002fa7]/40"
      >
        {/* 公司（衬线标题，编辑风核心识别点）+ 岗位 */}
        <div className="min-w-0">
          <p
            className="truncate text-[15px] font-semibold leading-snug text-[#1a1a17]"
            style={{ fontFamily: 'var(--font-serif-sc), serif' }}
          >
            {application.company}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-[#5f5b52]">
            {application.position}
          </p>
        </div>

        {/* 元信息行：渠道 · 薪资，右侧截止标签 */}
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#f0ede5] pt-2.5">
          <p className="min-w-0 truncate text-[11.5px] text-[#7d786d]">
            {application.channel}
            {application.salaryRange ? ` · ${application.salaryRange}` : ''}
          </p>
          <DeadlineBadge deadline={application.deadline} />
        </div>

        {/* 笔记首行预览：有笔记时展示，帮助快速回忆进度 */}
        {application.notes && (
          <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-[#7d786d]">
            {application.notes}
          </p>
        )}
      </button>
    </div>
  )
}
