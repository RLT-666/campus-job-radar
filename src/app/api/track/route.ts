// src/app/api/track/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const trackSchema = z.object({
  name: z.enum([
    'signup', 'view_timeline', 'favorite_job', 
    'create_application', 'move_status', 'push_sent', 
    'push_open', 'resume_match'
  ]),
  // 注意：把 z.any() 改成了 z.unknown()，这样就不会报 ESLint 错误了
  props: z.record(z.string(), z.unknown()).optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = trackSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid event data' }, { status: 400 })
    }

    const { name, props } = result.data

    // 真正的落库动作
    const { error: insertError } = await supabase
      .from('analytics_events')
      .insert({
        user_id: user.id,
        name: name,
        props: props || {},
      })

    if (insertError) {
      console.error('❌ 插入数据库报错了:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('❌ 接口内部报错:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}