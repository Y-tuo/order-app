export const dynamic = 'force-dynamic';
import { supabaseAdmin } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/auth';

export async function POST(request) {
  try {
    const { tableNo, items, remark, totalPrice } = await request.json();
    const session = await getCustomerSession();

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
        status: 'pending',
        customer_id: session?.sub || null
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

    // Send Push Notification (Bark)
    const barkUrl = process.env.BARK_URL || 'https://api.day.app/mHK5xZ9h7uoUVC3XYdmo3H/';
    if (barkUrl) {
      try {
        const title = `新订单提醒 - ${totalPrice} 饭票`;
        const body = `下单人: ${session?.username || '未知家庭成员'}\n总价: ${totalPrice} 饭票\n备注: ${remark || '无'}\n菜品明细:\n${items.map(i => `- ${i.name} × ${i.quantity}`).join('\n')}`;
        
        await fetch(barkUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            title,
            body,
            icon: 'https://cdn-icons-png.flaticon.com/512/3170/3170733.png' // optional icon
          })
        });
      } catch (pushErr) {
        console.error('Bark notification failed:', pushErr);
      }
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (err) {
    console.error('Order creation error:', err);
    return NextResponse.json({ error: '提交订单失败' }, { status: 500 });
  }
}
