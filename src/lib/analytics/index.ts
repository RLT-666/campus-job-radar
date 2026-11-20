// src/lib/analytics/index.ts
import { createClient } from '@/lib/supabase/client'

type EventName = 'signup' | 'view_timeline' | 'favorite_job' | 'create_application' | 'move_status' | 'push_sent' | 'push_open' | 'resume_match'

export async function track(name: EventName, props?: Record<string, unknown>) {
  try {
    // 1. 从浏览器端获取当前 Session 的 Access Token
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    // 2. 发请求时带上 Bearer Token
    await fetch('/api/track', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ name, props }),
    })
  } catch (error) {
    console.error('Track failed:', error)
  }
}