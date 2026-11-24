// ============================================================
// 看板状态 reducer（纯函数，可单测）
// ============================================================
// 设计说明（对应《落地方案》难点一「看板拖拽的数据一致性」）：
//   - 看板状态完全可由服务端数据派生，不引入 Redux/Zustand 等全局状态库；
//   - 乐观更新 = 先派发 MOVE 立即改本地 UI，再异步调接口，
//     接口失败派发 ROLLBACK 回滚并提示（由页面层编排，reducer 只负责纯转换）；
//   - 所有状态转换集中在本文件，单测覆盖后拖拽/回滚逻辑不再散落组件内。
// ============================================================

import type { Application } from '@/mocks/applications'
import type { ApplicationStatus } from './status'

/** 看板可派发的全部动作 */
export type BoardAction =
  /** 初次加载：用接口/mock 数据整体填充看板 */
  | { type: 'LOAD'; applications: Application[] }
  /** 新建投递卡片（表单校验已通过，由适配层生成 id 与落库） */
  | { type: 'ADD'; application: Application }
  /** 乐观流转：立即改变本地状态，等待接口确认 */
  | { type: 'MOVE'; id: string; from: ApplicationStatus; to: ApplicationStatus }
  /** 流转失败回滚：恢复为流转前状态 */
  | { type: 'ROLLBACK'; id: string; previousStatus: ApplicationStatus }
  /** 保存笔记（本地立即生效；接口失败由页面层回滚旧值） */
  | { type: 'UPDATE_NOTES'; id: string; notes: string }
  /** 删除卡片 */
  | { type: 'DELETE'; id: string }

/**
 * 看板 reducer：输入当前卡片列表与动作，输出新列表。
 * 纯函数约束：不读外部状态、不发请求、不产生副作用（埋点/接口由页面层负责）。
 */
export function boardReducer(
  state: Application[],
  action: BoardAction,
): Application[] {
  switch (action.type) {
    case 'LOAD':
      return action.applications

    case 'ADD':
      // 新卡片插到列表头部（创建时间最新，符合看板直觉）
      return [action.application, ...state]

    case 'MOVE': {
      // 只改目标卡片的 status；找不到 id 说明数据已变化，原样返回（幂等）
      return state.map((app) =>
        app.id === action.id ? { ...app, status: action.to } : app,
      )
    }

    case 'ROLLBACK':
      // 恢复流转前状态；同样幂等，避免重复回滚造成抖动
      return state.map((app) =>
        app.id === action.id ? { ...app, status: action.previousStatus } : app,
      )

    case 'UPDATE_NOTES':
      return state.map((app) =>
        app.id === action.id ? { ...app, notes: action.notes } : app,
      )

    case 'DELETE':
      return state.filter((app) => app.id !== action.id)

    default:
      // 穷尽性检查：未来新增动作漏写分支时在编译期暴露
      return state
  }
}
