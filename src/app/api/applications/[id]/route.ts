/**
 * 处理单条数据
 * 文件夹带方括号 [id]：这是 Next.js 的动态路由。意味着前端请求 /api/applications/abc-123 时，会自动跑到这个文件里。
 * 核心功能：PATCH 请求。
 * 业务场景：前端 B 同学在“看板”页把一张卡片从“待办”拖到了“面试”，前端就会发一个 PATCH 请求给这个接口。AI 帮你用 Zod 校验了要更新的数据，然后去 Supabase 里改了那条特定 ID 的记录。
 */
import { NextResponse } from 'next/server';
import { updateApplicationSchema } from '@/lib/schema';
import { createClient } from '@/lib/supabase/server';
import z from 'zod';
// PATCH 请求：更新某条投递记录的 status / sort_order
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    // 获取当前登录的用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // 如果没登录或者报错，直接返回 401 未授权
    if (authError || !user) {
      return NextResponse.json({ success: false, message: '未登录或登录已过期' }, { status: 401 });
    }

    // 拿到真实的用户 ID
    const userId = user.id;
    const { id } = await params;
    const body = await request.json();

    // 1. 用 Zod 校验前端数据
    const validation = updateApplicationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.format() },
        { status: 400 }
      );
    }

    // 2. 更新 Supabase 中对应的记录
    const { data, error } = await supabase
      .from('applications')
      .update(validation.data)
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ success: false, message: '无效的记录 ID' }, { status: 400 });
    }

    // 3. 没有命中任何记录（id 不存在或不属于当前用户）
    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, message: '记录不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: '更新成功', data: data[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}
