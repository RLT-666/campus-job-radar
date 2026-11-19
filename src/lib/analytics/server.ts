// src/lib/analytics/server.ts
import { createClient } from '@/lib/supabase/server'

export async function trackServer(
  name: string, 
  props?: Record<string, unknown>
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // 如果没登录，服务端埋点直接放弃，不影响主业务
    if (!user) return

    await supabase.from('analytics_events').insert({
      user_id: user.id,
      name: name,
      props: props || {},
    })
  } catch (error) {
    // 埋点报错静默处理，绝对不能影响 A 的正常接口返回
    console.error('Server track failed:', error)
  }
}