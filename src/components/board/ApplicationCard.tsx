// 投递卡片：看板列内的单条投递展示。
// 结构说明：外层 div 承载卡片视觉（玻璃面板/悬浮/辉光），内层 button 承载
// 「点击打开详情抽屉」；拖拽手柄由 dragHandle 槽位注入并独立于内层按钮
// （避免 button 嵌套 button 的非法 HTML，也避免点击与拖拽手势互相干扰）。
// 视觉：深空玻璃卡 + 左缘状态光带（status-visual.ts 单一数据源）+
//       悬停辉光上浮；Offer 态带翡翠描边，截止临近由 DeadlineBadge 琥珀警示。
'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import type { Application } from '@/mocks/applications'
import { STATUS_ACCENTS } from './status-visual'
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
  const accent = STATUS_ACCENTS[application.status] ?? '#8a93a8'

  return (
    <div
      className={cn(
        // 卡片视觉在外层容器：悬浮上浮 + 边框提亮 + 状态色辉光
        'group/card relative overflow-hidden rounded-xl border transition-all duration-200',
        'bg-[#0b0f1a]/75 backdrop-blur-md',
        'hover:-translate-y-0.5 hover:bg-[#0e1424]/85',
        'hover:shadow-[0_10px_32px_-12px_rgba(61,107,255,0.45)] hover:border-white/20',
        isOffer
          ? 'border-[#34d399]/35 shadow-[0_0_20px_-8px_rgba(52,211,153,0.4)]'
          : 'border-white/10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.5)]',
      )}
    >
      {/* 左缘状态光带：颜色编码进度，纯装饰 */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: accent, boxShadow: `0 0 10px ${accent}` }}
      />

      {/* 拖拽手柄：右上角，悬浮/聚焦时提亮 */}
      {dragHandle && (
        <span className="absolute right-2.5 top-2.5 z-10">{dragHandle}</span>
      )}

      {/* 内容按钮：整卡可点开抽屉；标题行右侧留出手柄空间 */}
      <button
        type="button"
        onClick={() => onOpen(application)}
        // 键盘可聚焦可触发，读屏播报完整内容
        aria-label={`${application.company} ${application.position}，状态 ${application.status}`}
        className="w-full cursor-pointer rounded-xl p-4 pl-[19px] pr-9 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3d6bff]/50"
      >
        {/* 公司（衬线标题）+ 岗位 */}
        <div className="min-w-0">
          <p
            className="truncate text-[15px] font-semibold leading-snug text-[#e8ecf6]"
            style={{ fontFamily: 'var(--font-serif-sc), serif' }}
          >
            {application.company}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-[#8a93a8]">
            {application.position}
          </p>
        </div>

        {/* 元信息行：渠道 · 薪资，右侧截止标签 */}
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/8 pt-2.5">
          <p className="min-w-0 truncate text-[11.5px] text-[#8a93a8]">
            {application.channel}
            {application.salaryRange ? ` · ${application.salaryRange}` : ''}
          </p>
          <DeadlineBadge deadline={application.deadline} />
        </div>

        {/* 笔记首行预览：有笔记时展示，帮助快速回忆进度 */}
        {application.notes && (
          <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-[#6b7488]">
            {application.notes}
          </p>
        )}
      </button>
    </div>
  )
}
