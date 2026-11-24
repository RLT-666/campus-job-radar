// 可拖拽投递卡片：为 ApplicationCard 包装 dnd-kit 拖拽能力。
// 交互设计：
//   - 拖拽通过右上角手柄触发（手柄单独携带 listeners），卡片主体点击
//     仍打开详情抽屉，两种手势互不干扰；
//   - PointerSensor 设 6px 激活距离，避免点击手柄误触发拖拽；
//   - 手柄设 touch-action: none，移动端长按拖动不影响页面滚动；
//   - 拖动中本体降低透明度并随指针位移（transform），不做 DragOverlay
//     克隆——列内位置不变，视觉更轻、代码更少。
'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Application } from '@/mocks/applications'
import { ApplicationCard } from './ApplicationCard'

interface DraggableApplicationCardProps {
  application: Application
  /** 点击卡片打开详情抽屉（透传给 ApplicationCard） */
  onOpen: (application: Application) => void
}

export function DraggableApplicationCard({
  application,
  onOpen,
}: DraggableApplicationCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: application.id,
      // data 随拖拽事件携带卡片信息，供 onDragEnd 校验流转合法性
      data: { application },
    })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn('relative', isDragging && 'z-20 opacity-40')}
    >
      <ApplicationCard
        application={application}
        onOpen={onOpen}
        dragHandle={
          <button
            type="button"
            // dnd-kit 注入：role/tabIndex/aria 语义 + 指针与键盘监听
            {...attributes}
            {...listeners}
            aria-label={`拖动「${application.company}」卡片`}
            style={{ touchAction: 'none' }}
            className="flex size-6 cursor-grab items-center justify-center rounded-md text-[#a09a8c] transition-colors duration-200 hover:bg-[#f3f1ea] hover:text-[#1a1a17] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002fa7]/40 active:cursor-grabbing"
          >
            <GripVertical size={14} aria-hidden="true" />
          </button>
        }
      />
    </div>
  )
}
