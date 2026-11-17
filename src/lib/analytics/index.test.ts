// src/lib/analytics/index.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { track } from './index'

// 模拟全局的 fetch 函数
global.fetch = vi.fn()

describe('track 埋点函数测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该发送正确的 POST 请求', async () => {
    // 核心魔法：用 vi.mocked 包装 fetch，这样就能自动获得类型，不用写 any
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }))

    await track('view_timeline', { page: 'home' })

    expect(fetch).toHaveBeenCalledWith('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'view_timeline', props: { page: 'home' } }),
    })
  })

  it('即使 fetch 失败（报错），函数也不应该崩溃', async () => {
    // 同样使用 vi.mocked
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network Error'))
    
    // 只要这行代码不抛出红字异常，测试就算通过
    await expect(track('view_timeline')).resolves.not.toThrow()
  })
})