// 新建投递弹窗：包装建卡表单的对话框。
// 无障碍与交互由 Radix Dialog 承担（焦点圈定、Escape 关闭、aria 语义、
// 点击遮罩关闭），本项目不做自研弹窗——避免重复造轮子且易出无障碍缺陷。
// 样式遵循「截止时刻表 · Editorial」：白面板 + 墨色标题 + 细分隔线。
'use client'

import { Dialog } from 'radix-ui'
import { X } from 'lucide-react'

import type { ApplicationFormValues } from '@/app/board/application-form.schema'
import { ApplicationForm } from './ApplicationForm'

interface CreateApplicationModalProps {
  /** 是否打开（受控） */
  open: boolean
  /** 打开状态变化回调（点遮罩/Escape/关闭按钮均走这里） */
  onOpenChange: (open: boolean) => void
  /**
   * 表单校验通过后的回调：由看板页负责新增卡片、关闭弹窗与埋点。
   * 约定：接口失败抛异常时表单保持打开，由看板页展示错误提示。
   */
  onSubmit: (values: ApplicationFormValues) => void
}

export function CreateApplicationModal({
  open,
  onOpenChange,
  onSubmit,
}: CreateApplicationModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* 遮罩：墨色半透明，打开时淡入 */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#1a1a17]/45 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />

        {/* 面板：居中，移动端留边距、限制最大高度内部滚动，避免 375px 屏被顶出 */}
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#e7e3d9] bg-white p-6 shadow-[0_1px_2px_rgba(26,26,23,0.04),0_24px_64px_-24px_rgba(26,26,23,0.28)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          {/* 标题行：衬线标题 + 关闭按钮 */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title
                className="text-[22px] font-bold leading-tight text-[#1a1a17]"
                style={{ fontFamily: 'var(--font-serif-sc), serif' }}
              >
                新建投递
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[13px] text-[#7d786d]">
                记录公司与岗位，投递后将出现在看板对应状态列。
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="关闭弹窗"
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#7d786d] transition-colors duration-200 hover:bg-[#f3f1ea] hover:text-[#1a1a17] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002fa7]/40"
            >
              <X size={16} aria-hidden="true" />
            </Dialog.Close>
          </div>

          {/* 表单区 */}
          <div className="mt-5">
            <ApplicationForm onSubmit={onSubmit} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
