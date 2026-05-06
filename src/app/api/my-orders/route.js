import { supabaseAdmin } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get('ids');
  
  if (!idsParam) {
    return NextResponse.json({ orders: [] });
  }

  const ids = idsParam.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
  if (ids.length === 0) {
    return NextResponse.json({ orders: [] });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .in('id', ids)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return NextResponse.json({ orders: data });
  } catch (err) {
    console.error('Error fetching my orders:', err);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
