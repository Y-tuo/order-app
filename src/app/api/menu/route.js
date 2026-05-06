import { supabaseAdmin } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch categories
    const { data: categories, error: catError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('sort_order');

    if (catError) throw catError;

    // Fetch available menu items
    const { data: items, error: itemError } = await supabaseAdmin
      .from('menu_items')
      .select('*')
      .eq('is_available', true)
      .order('sort_order');

    if (itemError) throw itemError;

    // Group items by category
    const menuItems = {};
    for (const cat of categories) {
      menuItems[cat.id] = items.filter(i => i.category_id === cat.id);
    }

    return NextResponse.json({ categories, menuItems });
  } catch (err) {
    console.error('Menu fetch error:', err);
    return NextResponse.json({ error: '加载菜单失败' }, { status: 500 });
  }
}
