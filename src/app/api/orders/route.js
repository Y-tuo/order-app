export const dynamic = 'force-dynamic';
import { supabaseAdmin } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { tableNo, items, remark, totalPrice } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: '请至少选择一道菜' }, { status: 400 });
    }

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        table_no: tableNo || '未指定',
        remark: remark || '',
        total_price: totalPrice,
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (err) {
    console.error('Order creation error:', err);
    return NextResponse.json({ error: '提交订单失败' }, { status: 500 });
  }
}
