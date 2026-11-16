// src/app/api/track/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
// 假设你在这里导入了 db 用于插入数据

const trackSchema = z.object({
  name: z.enum([
    'signup', 'view_timeline', 'favorite_job', 
    'create_application', 'move_status', 'push_sent', 
    'push_open', 'resume_match'
  ]),
  props: z.record(z.string(), z.any()).optional(),
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

    // TODO: 等 A 把 analytics_events 表建好后，在这里插入数据库
    // await db.insert(analyticsEvents).values({ user_id: user.id, name, props })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}