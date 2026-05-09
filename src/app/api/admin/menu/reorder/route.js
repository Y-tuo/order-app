export const dynamic = 'force-dynamic';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await requireAdmin();
    const { items } = await request.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: '无效的数据' }, { status: 400 });
    }

    // Supabase JS doesn't have a simple batch update for multiple rows with different values unless using upsert.
    // However, upserting only specific columns might complain if NOT NULL columns are missing.
    // For menu_items, if name, price are required, an upsert needs them.
    // Instead of upsert, we can do sequential updates since the number of items in a category is usually small.
    // Alternatively, just update the sort_order.
    for (const item of items) {
      await supabaseAdmin
        .from('menu_items')
        .update({ sort_order: item.sort_order, category_id: item.category_id })
        .eq('id', item.id);
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    console.error('Reorder error:', err);
    return NextResponse.json({ error: '排序更新失败' }, { status: 500 });
  }
}
