export const dynamic = 'force-dynamic';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (date) {
      query = query.gte('created_at', `${date}T00:00:00`)
                    .lt('created_at', `${date}T23:59:59`);
    }

    const { data: orders, error } = await query;
    if (error) throw error;

    // Get total count
    let countQuery = supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }
    if (date) {
      countQuery = countQuery.gte('created_at', `${date}T00:00:00`)
                              .lt('created_at', `${date}T23:59:59`);
    }

    const { count } = await countQuery;

    return NextResponse.json({ orders, total: count });
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    console.error('Orders fetch error:', err);
    return NextResponse.json({ error: '获取订单失败' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await requireAdmin();

    const { id, status } = await request.json();

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    console.error('Order update error:', err);
    return NextResponse.json({ error: '更新订单失败' }, { status: 500 });
  }
}
