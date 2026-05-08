import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCustomerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { data: ingredients, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, ingredients });
  } catch (error) {
    console.error('获取食材失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await req.json();
    const { name, quantity, category, remark } = body;

    if (!name) {
      return NextResponse.json({ error: '食材名称不能为空' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('ingredients')
      .insert([
        {
          name,
          quantity,
          category,
          remark,
          last_updated_by: session.username,
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, ingredient: data });
  } catch (error) {
    console.error('添加食材失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少ID参数' }, { status: 400 });
    }

    const body = await req.json();
    const { name, quantity, category, remark } = body;

    const { data, error } = await supabase
      .from('ingredients')
      .update({
        name,
        quantity,
        category,
        remark,
        last_updated_by: session.username,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, ingredient: data });
  } catch (error) {
    console.error('更新食材失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少ID参数' }, { status: 400 });
    }

    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除食材失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
