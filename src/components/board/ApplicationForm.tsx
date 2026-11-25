'use client'
// 建卡表单：收集投递卡片字段，zod 校验并展示字段级错误；
// 校验通过后通过 onSubmit 把值交给看板层本地新增卡片，本轮不调真实接口。
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  applicationFormSchema,
  type ApplicationFormValues,
} from '@/app/board/application-form.schema'
import { APPLICATION_STATUSES, STATUS_LABELS } from '@/components/board/status'

// 渠道选项：与 schema 里的中文枚举取值一致
const CHANNEL_OPTIONS = ['官网', '内推', '宣讲会', '其他'] as const

// 状态下拉选项：从状态机单一数据源推导（枚举值 + 中文标签），
// 下拉只展示中文，提交值仍存英文枚举，与 mock/契约对齐
const STATUS_OPTIONS = APPLICATION_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value],
}))

interface ApplicationFormProps {
  // 校验通过后的回调：由看板层实现本地新增卡片
  onSubmit: (values: ApplicationFormValues) => void
}

export function ApplicationForm({ onSubmit }: ApplicationFormProps) {
  // 表单受控状态：可选字段用空串表示未填
  const [form, setForm] = useState({
    company: '',
    position: '',
    channel: '官网',
    status: 'wishlist',
    salaryRange: '',
    deadline: '',
    notes: '',
  })
  // 字段级错误：key 为字段名，value 为提示文案
  const [errors, setErrors] = useState<
    Partial<Record<keyof ApplicationFormValues, string>>
  >({})

  // 更新单个字段，并清掉该字段的旧错误提示
  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // safeParse 不抛异常：失败时从 issues 里按字段收集错误文案
    const result = applicationFormSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: typeof errors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof typeof errors
        if (key) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    // 校验通过：回调给看板层新增卡片，随后重置表单
    onSubmit(result.data)
    setForm({
      company: '',
      position: '',
      channel: '官网',
      status: 'wishlist',
      salaryRange: '',
      deadline: '',
      notes: '',
    })
    setErrors({})
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-[#e8ecf6]">
      {/* 公司（必填） */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="company" className="text-sm font-medium">公司</label>
        <Input
          id="company"
          value={form.company}
          onChange={(e) => update('company', e.target.value)}
          placeholder="示例科技"
        />
        {errors.company && <p className="text-sm text-destructive">{errors.company}</p>}
      </div>

      {/* 岗位（必填） */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="position" className="text-sm font-medium">岗位</label>
        <Input
          id="position"
          value={form.position}
          onChange={(e) => update('position', e.target.value)}
          placeholder="前端开发实习生"
        />
        {errors.position && <p className="text-sm text-destructive">{errors.position}</p>}
      </div>

      {/* 渠道（必选，原生 select，避免新增 Radix 依赖） */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="channel" className="text-sm font-medium">渠道</label>
        <select
          id="channel"
          value={form.channel}
          onChange={(e) => update('channel', e.target.value)}
          className="h-9 w-full rounded-lg border border-white/15 bg-white/[0.05] px-2 text-sm text-[#e8ecf6] outline-none transition-colors duration-150 focus-visible:border-[#3d6bff]/60"
        >
          {CHANNEL_OPTIONS.map((ch) => (
            <option key={ch} value={ch}>{ch}</option>
          ))}
        </select>
      </div>

      {/* 状态（必选，默认意向） */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="status" className="text-sm font-medium">状态</label>
        <select
          id="status"
          value={form.status}
          onChange={(e) => update('status', e.target.value)}
          className="h-9 w-full rounded-lg border border-white/15 bg-white/[0.05] px-2 text-sm text-[#e8ecf6] outline-none transition-colors duration-150 focus-visible:border-[#3d6bff]/60"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* 薪资范围（可选） */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="salaryRange" className="text-sm font-medium">薪资范围（可选）</label>
        <Input
          id="salaryRange"
          value={form.salaryRange}
          onChange={(e) => update('salaryRange', e.target.value)}
          placeholder="如 200-300/天"
        />
        {errors.salaryRange && <p className="text-sm text-destructive">{errors.salaryRange}</p>}
      </div>

      {/* 截止时间（可选日期） */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="deadline" className="text-sm font-medium">截止时间（可选）</label>
        <Input
          id="deadline"
          type="date"
          value={form.deadline}
          onChange={(e) => update('deadline', e.target.value)}
        />
      </div>

      {/* 备注（可选多行，原生 textarea） */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium">备注（可选）</label>
        <textarea
          id="notes"
          rows={3}
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="补充笔记、面试反馈等"
          className="w-full min-w-0 rounded-lg border border-white/15 bg-white/[0.05] px-2.5 py-1.5 text-sm text-[#e8ecf6] outline-none transition-colors duration-150 placeholder:text-[#5c6579] focus-visible:border-[#3d6bff]/60"
        />
        {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
      </div>

      <Button
        type="submit"
        className="h-10 w-full bg-gradient-to-br from-[#2b5cff] via-[#3d6bff] to-[#6f96ff] text-[13.5px] font-semibold text-white shadow-[0_6px_24px_-6px_rgba(61,107,255,0.55)] hover:brightness-110"
      >
        提交卡片
      </Button>
    </form>
  )
}
