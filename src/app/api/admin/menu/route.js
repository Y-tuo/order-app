export const dynamic = 'force-dynamic';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await requireAdmin();

    const { data: categories, error: catError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('sort_order');

    if (catError) throw catError;

    const { data: items, error: itemError } = await supabaseAdmin
      .from('menu_items')
      .select('*')
      .order('sort_order');

    if (itemError) throw itemError;

    return NextResponse.json({ categories, items });
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    return NextResponse.json({ error: '获取菜品失败' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const body = await request.json();

    if (body.type === 'category') {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .insert({
          name: body.name,
          icon: body.icon || '🍽️',
          sort_order: body.sort_order || 0
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    // Menu item
    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .insert({
        category_id: body.category_id,
        name: body.name,
        description: body.description || '',
        price: body.price,
        image_url: body.image_url || '/images/placeholder.svg',
        is_available: body.is_available !== false,
        sort_order: body.sort_order || 0
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    console.error('Menu create error:', err);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await requireAdmin();
    const body = await request.json();

    if (body.type === 'category') {
      const { error } = await supabaseAdmin
        .from('categories')
        .update({
          name: body.name,
          icon: body.icon,
          sort_order: body.sort_order
        })
        .eq('id', body.id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    const { error } = await supabaseAdmin
      .from('menu_items')
      .update({
        category_id: body.category_id,
        name: body.name,
        description: body.description,
        price: body.price,
        image_url: body.image_url,
        is_available: body.is_available,
        sort_order: body.sort_order
      })
      .eq('id', body.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    const table = type === 'category' ? 'categories' : 'menu_items';

    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
