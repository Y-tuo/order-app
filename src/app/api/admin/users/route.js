export const dynamic = 'force-dynamic';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  try {
    await requireAdmin();
    const { data: users, error } = await supabaseAdmin
      .from('customers')
      .select('id, username, password, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ users });
  } catch (err) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: '未登录' }, { status: 401 });
    return NextResponse.json({ error: '获取账号失败' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: '请填写账号和密码' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('customers')
      .insert({ username, password });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: '账号名已存在' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: '未登录' }, { status: 401 });
    return NextResponse.json({ error: '创建账号失败' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await requireAdmin();
    const { id, password } = await request.json();
    
    if (!password) {
      return NextResponse.json({ error: '密码不能为空' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('customers')
      .update({ password })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: '未登录' }, { status: 401 });
    return NextResponse.json({ error: '修改密码失败' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // First set customer_id to null in orders to avoid foreign key constraint error
    await supabaseAdmin
      .from('orders')
      .update({ customer_id: null })
      .eq('customer_id', id);

    // Then delete the user
    const { error } = await supabaseAdmin
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: '未登录' }, { status: 401 });
    console.error('Delete user error:', err);
    return NextResponse.json({ error: '删除账号失败' }, { status: 500 });
  }
}
