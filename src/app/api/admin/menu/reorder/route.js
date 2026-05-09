export const dynamic = 'force-dynamic';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await requireAdmin();
    const { type, items } = await request.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: '无效的数据' }, { status: 400 });
    }

    const table = type === 'category' ? 'categories' : 'menu_items';

    for (const item of items) {
      const updateData = { sort_order: item.sort_order };
      if (type !== 'category' && item.category_id) {
        updateData.category_id = item.category_id;
      }
      await supabaseAdmin
        .from(table)
        .update(updateData)
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
