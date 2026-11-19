// src/app/api/analytics/funnel/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('analytics_events')
    .select('name')
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const funnel = {
    view_timeline: 0,
    favorite_job: 0,
    create_application: 0,
    move_status: 0,
  }

  data.forEach(event => {
    if (event.name in funnel) {
      funnel[event.name as keyof typeof funnel]++
    }
  })

  return NextResponse.json({ funnel })
}