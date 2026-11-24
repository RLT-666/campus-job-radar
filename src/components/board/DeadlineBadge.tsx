// 截止时间标签：卡片与详情抽屉共用，保证两处展示口径一致。
// 规则（设计语言「琥珀=唯一暖色信号」）：
//   无截止 → 不渲染；已过期 → 灰色「已截止」；
//   今天截止/≤3 天 → 琥珀警示；其余 → 中性倒计时 D-n。
'use client'

import { CalendarClock } from 'lucide-react'

import { daysUntilDeadline } from './status'

export function DeadlineBadge({ deadline }: { deadline?: string }) {
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
