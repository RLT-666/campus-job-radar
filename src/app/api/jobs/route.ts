/**
 * 岗位列表接口
 * 核心功能：GET 和 POST
 * 业务场景：前端查询 jobs 表里的岗位列表（支持按公司名模糊搜索），或者新增一条岗位数据。
 */
import { NextResponse } from 'next/server';
import { jobSchema } from '@/lib/schema';
import { createClient } from '@/lib/supabase/server';

// 1. GET 请求：查询 jobs 表，支持按 company 模糊搜索，按 created_at 倒序
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    

    // 从 URL 读取搜索关键词，例如 /api/jobs?company=字节
    const { searchParams } = new URL(request.url);
    const company = searchParams.get('company')?.trim();

    let query = supabase.from('jobs').select('*');

    if (company) {
      // ilike 不区分大小写的模糊匹配
      query = query.ilike('company', `%${company}%`);
    }

    // 按创建时间倒序
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '获取岗位列表失败' }, { status: 500 });
  }
}

// 2. POST 请求：用 jobSchema 校验后插入 jobs 表
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

     const authHeader = request.headers.get('Authorization');
     const token = authHeader?.replace('Bearer ', '');
      // 如果没有 Token，拒绝新增岗位
    if (!token) {
      return NextResponse.json({ success: false, message: '无权操作，请先登录' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ success: false, message: '登录已过期' }, { status: 401 });
    }

    const body = await request.json();

    // 1. 用 Zod 校验前端数据
    const validation = jobSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.format() },
        { status: 400 }
      );
    }

    // 2. 插入到 Supabase 的 jobs 表
    const { data, error } = await supabase
      .from('jobs')
      .insert([validation.data])
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
