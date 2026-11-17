import { NextResponse } from 'next/server';
import { createApplicationSchema } from '@/lib/schema';
import { supabase } from '@/lib/supabase'; // 引入刚才写的连接

// 1. GET 请求：获取所有投递记录
export async function GET() {
  try {
    // 真实查询 Supabase 的 applications 表
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false }); // 按时间倒序

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '获取数据失败' }, { status: 500 });
  }
}

// 2. POST 请求：新建投递记录
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. 用 Zod 校验前端数据
    const validation = createApplicationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.format() },
        { status: 400 }
      );
    }

    // 2. 准备要存入 Supabase 的数据
  const newApplication = {
        user_id: '123e4567-e89b-12d3-a456-426614174000', // 暂时随便写个，比如 '123e4567-e89b-12d3-a456-426614174000'
        company: validation.data.company,
        position: validation.data.position,
        channel: validation.data.channel,
        status: validation.data.status,
        note: validation.data.note,
    };
    // 3. 插入到 Supabase 的 applications 表
    const { data, error } = await supabase
      .from('applications')
      .insert([newApplication])
      .select(); // 插入后顺便把生成好的数据返回回来

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: '创建成功', data: data[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}