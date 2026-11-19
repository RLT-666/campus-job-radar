/**
 * 处理整个列表
 * 核心功能：GET 和 POST
 * 业务场景：前端 B 同学打开“看板”页，请求 /api/applications，这个文件里的 GET 就会把所有列表数据查出来给他；他点击“新建投递”，这个文件里的 POST 就会把数据存进数据库。
 */
import { NextResponse } from 'next/server';
import { createApplicationSchema } from '@/lib/schema';
import { createClient } from '@/lib/supabase/server';
// 1. GET 请求：获取所有投递记录
export async function GET() {
  try {
    const supabase = await createClient();

// 获取当前登录的用户
const { 
  data: { user }, error: authError } = await supabase.auth.getUser();

// 如果没登录或者报错，直接返回 401 未授权
if (authError || !user) {
  return NextResponse.json({ success: false, message: '未登录或登录已过期' }, { status: 401 });
}

// 拿到真实的用户 ID
const userId = user.id;

    // 真实查询 Supabase 的 applications 表
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId) // 只查当前用户的记录
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
    const supabase = await createClient();
    // 获取当前登录的用户
    const { 
      data: { user }, error: authError } = await supabase.auth.getUser();

    // 如果没登录或者报错，直接返回 401 未授权
    if (authError || !user) {
      return NextResponse.json({ success: false, message: '未登录或登录已过期' }, { status: 401 });
    }

    // 拿到真实的用户 ID
    const userId = user.id;
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
        user_id: userId,
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