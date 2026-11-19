/**
 * 收藏接口
 * 核心功能：GET（当前用户的收藏列表）、POST（新增收藏）、DELETE（取消收藏）
 * 业务场景：前端 B 同学在时间线页点击收藏/取消收藏，收藏数据写入 favorites 表。
 * 注意：favorites 表是复合主键 (user_id, job_id)。
 */
import { NextResponse } from 'next/server';
import { favoriteSchema } from '@/lib/schema';
import { createClient } from '@/lib/supabase/server';

// 1. GET 请求：查询当前用户的收藏列表
export async function GET(request: Request) {
    try {
    const supabase = await createClient();

    // 从 Apifox 的 Header 里提取 Token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    // 如果没有 Token，直接拦截
    if (!token) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
    }

    // 把 Token 传给 getUser 验证
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, message: '未登录或Token过期' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id',  user.id) // 只查当前用户的收藏
      .order('created_at', { ascending: false }); // 最近收藏的排在前面

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '获取收藏列表失败' }, { status: 500 });
  }
}

// 2. POST 请求：新增收藏（body 里只需要 job_id）
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
     // 从 Apifox 的 Header 里提取 Token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    // 如果没有 Token，直接拦截
    if (!token) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
    }

    // 把 Token 传给 getUser 验证
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, message: '未登录或Token过期' }, { status: 401 });
    }
    // 1. 用 Zod 校验 job_id 是否为合法 UUID
    const validation = favoriteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.format() },
        { status: 400 }
      );
    }

    // 2. 插入 favorites 表（复合主键 user_id + job_id，user_id ）
    const { data, error } = await supabase
      .from('favorites')
      .insert([{ user_id: user.id, job_id: validation.data.job_id }])
      .select();

    if (error) {
      // 23505 = 唯一键冲突，说明该用户已经收藏过这个岗位
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, message: '已经收藏过该岗位' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(
      { success: true, message: '收藏成功', data: data[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}

// 3. DELETE 请求：取消收藏
// 支持两种传参：/api/favorites?job_id=xxx 或 body 里传 { "job_id": "xxx" }
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    
  const { data: { user }, error: authError } = await supabase.auth.getUser();
     if (authError || !user) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobIdFromQuery = searchParams.get('job_id');
    // DELETE 请求不一定带 body，解析失败时兜底为 null
    const body = jobIdFromQuery ? null : await request.json().catch(() => null);
    const jobId = jobIdFromQuery ?? body?.job_id;

    // 1. 用 Zod 校验 job_id 是否为合法 UUID
    const validation = favoriteSchema.safeParse({ job_id: jobId });
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.format() },
        { status: 400 }
      );
    }

    // 2. 按复合主键 (user_id, job_id) 删除
    const { data, error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('job_id', validation.data.job_id)
      .select();

    if (error) throw error;

    // 3. 没有命中任何记录，说明本来就没收藏过
    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, message: '该岗位不在收藏列表中' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: '已取消收藏' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}
