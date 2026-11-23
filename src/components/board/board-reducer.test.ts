// boardReducer 单元测试：覆盖乐观更新与回滚的全部转换分支
// 纯函数测试不依赖 DOM，直接跑在 Node 环境（vitest 默认环境即可）
import { describe, expect, it } from 'vitest'
import type { Application } from '@/mocks/applications'
import { boardReducer } from './board-reducer'

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
