// 投递卡片：看板列内的单条投递展示。
// 设计语言遵循「截止时刻表 · Editorial」：
//   纸面白底卡片 + 细分隔线 + 墨色正文；
//   截止临近（≤3 天）用琥珀色——全站唯一暖色信号，与登录页时刻表一致；
//   Offer 态用克莱因蓝点缀，其余状态保持中性，避免多色噪点。
'use client'

import { CalendarClock } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Application } from '@/mocks/applications'
import { daysUntilDeadline } from './status'

interface ApplicationCardProps {
  application: Application
  /** 点击卡片打开详情抽屉 */
  onOpen: (application: Application) => void
}

/** 截止时间标签：无截止不展示；已截止灰色；≤3 天琥珀警示；其余中性倒计时 */
function DeadlineBadge({ deadline }: { deadline?: string }) {
  const days = daysUntilDeadline(deadline)
  if (days === null) return null

  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#e0dcd2] px-2 py-0.5 text-[11px] font-medium text-[#7d786d]">
        <CalendarClock size={12} aria-hidden="true" />
        已截止
      </span>
    )
  }

  if (days <= 3) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#f2d9b6] bg-[#fdf6ec] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[#b45309]">
        <CalendarClock size={12} aria-hidden="true" />
        {days === 0 ? '今天截止' : `D-${days}`}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#ece8de] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[#7d786d]">
      <CalendarClock size={12} aria-hidden="true" />
      D-{days}
    </span>
  )
}

export function ApplicationCard({ application, onOpen }: ApplicationCardProps) {
  const isOffer = application.status === 'offer'

  return (
    <button
      type="button"
      onClick={() => onOpen(application)}
      // 键盘可聚焦可触发，读屏播报完整内容
      aria-label={`${application.company} ${application.position}，状态 ${application.status}`}
      className={cn(
        // 卡片整体为可点按钮：文本左对齐，悬浮时轻微上浮 + 边框加深
        'group/card w-full cursor-pointer rounded-xl border bg-white p-4 text-left shadow-[0_1px_2px_rgba(26,26,23,0.04)] transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-[#d8d3c6] hover:shadow-[0_8px_24px_-12px_rgba(26,26,23,0.18)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002fa7]/40',
        isOffer ? 'border-[#c9d3f0]' : 'border-[#e7e3d9]',
      )}
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
  )
}
