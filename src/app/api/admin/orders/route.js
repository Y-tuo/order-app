export const dynamic = 'force-dynamic';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
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

    if (startDate) {
      query = query.gte('created_at', `${startDate}T00:00:00`);
    }
    if (endDate) {
      query = query.lte('created_at', `${endDate}T23:59:59`);
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
    if (startDate) {
      countQuery = countQuery.gte('created_at', `${startDate}T00:00:00`);
    }
    if (endDate) {
      countQuery = countQuery.lte('created_at', `${endDate}T23:59:59`);
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

    const { id, status, admin_reply } = await request.json();

    const updatePayload = { updated_at: new Date().toISOString() };
    if (status) updatePayload.status = status;
    if (admin_reply !== undefined) updatePayload.admin_reply = admin_reply;

    const { error } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
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

export async function DELETE(request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少订单 ID' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    console.error('Order deletion error:', err);
    return NextResponse.json({ error: '删除订单失败' }, { status: 500 });
  }
}
