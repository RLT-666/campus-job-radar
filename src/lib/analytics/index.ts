// src/lib/analytics/index.ts
type EventName = 'signup' | 'view_timeline' | 'favorite_job' | 'create_application' | 'move_status' | 'push_sent' | 'push_open' | 'resume_match'

export async function track(name: EventName, props?: Record<string, unknown>) {
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, props }),
    })
  } catch (error) {
    // 埋点失败静默处理，不阻断用户操作
    console.error('Track failed:', error)
  }
}