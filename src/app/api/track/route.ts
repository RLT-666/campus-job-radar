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
  props: z.record(z.string(), z.unknown()).optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. 从 Header 里获取 Token（与 A 的接口保持一致）
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Missing Token' }, { status: 401 })
    }

    // 2. 把 Token 传给 getUser 验证
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid Token' }, { status: 401 })
    }

    const body = await request.json()
    const result = trackSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid event data' }, { status: 400 })
    }

    const { name, props } = result.data

    // 3. 真正的落库动作
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