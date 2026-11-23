// boardReducer 与状态机辅助函数的单元测试：
// 覆盖乐观更新/回滚的全部转换分支与拖拽落点解析
// 纯函数测试不依赖 DOM，直接跑在 Node 环境（vitest 默认环境即可）
import { describe, expect, it } from 'vitest'
import type { Application } from '@/mocks/applications'
import { boardReducer } from './board-reducer'
import {
  BOARD_COLUMNS,
  canTransition,
  resolveTargetStatus,
  type BoardColumnConfig,
} from './status'

/** 构造测试用卡片 */
function makeApp(id: string, status: Application['status']): Application {
  return { id, company: `公司${id}`, position: '实习生', channel: '官网', status }
}

describe('boardReducer', () => {
  it('LOAD：整体替换看板数据', () => {
    const loaded = [makeApp('a', 'wishlist'), makeApp('b', 'offer')]
    const state = boardReducer([makeApp('x', 'applied')], {
      type: 'LOAD',
      applications: loaded,
    })
    expect(state).toEqual(loaded)
  })

  it('ADD：新卡片插到列表头部', () => {
    const state = boardReducer([makeApp('a', 'applied')], {
      type: 'ADD',
      application: makeApp('b', 'wishlist'),
    })
    expect(state.map((app) => app.id)).toEqual(['b', 'a'])
  })

  it('MOVE：乐观流转立即改变目标卡片状态，不影响其他卡片', () => {
    const state = boardReducer(
      [makeApp('a', 'wishlist'), makeApp('b', 'applied')],
      { type: 'MOVE', id: 'a', from: 'wishlist', to: 'applied' },
    )
    expect(state.find((app) => app.id === 'a')?.status).toBe('applied')
    expect(state.find((app) => app.id === 'b')?.status).toBe('applied')
  })

  it('MOVE：id 不存在时原样返回（幂等，不抛异常）', () => {
    const before = [makeApp('a', 'wishlist')]
    const state = boardReducer(before, {
      type: 'MOVE',
      id: 'ghost',
      from: 'wishlist',
      to: 'offer',
    })
    expect(state).toEqual(before)
  })

  it('ROLLBACK：接口失败后恢复流转前状态', () => {
    // 模拟：乐观流转 applied → written 后接口失败
    const afterMove = boardReducer([makeApp('a', 'applied')], {
      type: 'MOVE',
      id: 'a',
      from: 'applied',
      to: 'written',
    })
    const afterRollback = boardReducer(afterMove, {
      type: 'ROLLBACK',
      id: 'a',
      previousStatus: 'applied',
    })
    expect(afterRollback[0].status).toBe('applied')
  })

  it('UPDATE_NOTES：更新指定卡片的笔记', () => {
    const state = boardReducer([makeApp('a', 'applied')], {
      type: 'UPDATE_NOTES',
      id: 'a',
      notes: '一面安排在周三',
    })
    expect(state[0].notes).toBe('一面安排在周三')
  })

  it('DELETE：按 id 删除卡片', () => {
    const state = boardReducer([makeApp('a', 'wishlist'), makeApp('b', 'offer')], {
      type: 'DELETE',
      id: 'a',
    })
    expect(state.map((app) => app.id)).toEqual(['b'])
  })
})

// ---------- 状态机与拖拽落点解析 ----------
describe('resolveTargetStatus', () => {
  const interviewColumn = BOARD_COLUMNS.find((c) => c.key === 'interview')!

  function columnOf(key: string): BoardColumnConfig {
    return BOARD_COLUMNS.find((c) => c.key === key)!
  }

  it('单状态列：返回该列状态', () => {
    expect(resolveTargetStatus('wishlist', columnOf('applied'))).toBe('applied')
    expect(resolveTargetStatus('applied', columnOf('offer'))).toBe('offer')
  })

  it('面试中列：卡片不在面试环节时默认进入一面', () => {
    expect(resolveTargetStatus('applied', interviewColumn)).toBe('interview_1')
  })

  it('面试中列：卡片已在面试环节时返回 null（同列移动无变化）', () => {
    expect(resolveTargetStatus('interview_2', interviewColumn)).toBeNull()
    expect(resolveTargetStatus('hr', interviewColumn)).toBeNull()
  })
})

describe('canTransition', () => {
  it('允许正常链路的向后流转', () => {
    expect(canTransition('wishlist', 'applied')).toBe(true)
    expect(canTransition('applied', 'written')).toBe(true)
    expect(canTransition('interview_1', 'interview_2')).toBe(true)
    expect(canTransition('hr', 'offer')).toBe(true)
  })

  it('允许被拒后复活回意向', () => {
    expect(canTransition('rejected', 'wishlist')).toBe(true)
  })

  it('拒绝终态转出与非法跳跃', () => {
    expect(canTransition('offer', 'applied')).toBe(false)
    expect(canTransition('offer', 'rejected')).toBe(false)
    expect(canTransition('wishlist', 'offer')).toBe(false) // 不可跨环节直达
  })
})
