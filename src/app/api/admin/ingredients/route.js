export const dynamic = 'force-dynamic';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await requireAdmin();
    const { data: ingredients, error } = await supabaseAdmin
      .from('ingredients')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ ingredients });
  } catch (err) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: '未登录' }, { status: 401 });
    return NextResponse.json({ error: '获取食材列表失败' }, { status: 500 });
  }
}

// 恢复已删除食材
export async function PUT(request) {
  try {
    await requireAdmin();
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: '缺少ID' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('ingredients')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: '未登录' }, { status: 401 });
    return NextResponse.json({ error: '恢复失败' }, { status: 500 });
  }
}

// 物理永久删除
export async function DELETE(request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少ID' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('ingredients')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: '未登录' }, { status: 401 });
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
