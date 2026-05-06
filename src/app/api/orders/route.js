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

    // Send Push Notification (PushPlus)
    const pushToken = process.env.PUSHPLUS_TOKEN;
    if (pushToken) {
      try {
        const title = `新订单提醒 - ${totalPrice} 饭票`;
        const content = `
下单人: ${session?.username || '未知家庭成员'}
总价: ${totalPrice} 饭票
备注: ${remark || '无'}
菜品明细:
${items.map(i => `- ${i.name} × ${i.quantity}`).join('\n')}
        `.trim();
        
        await fetch('http://www.pushplus.plus/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: pushToken,
            title,
            content,
            template: 'txt'
          })
        });
      } catch (pushErr) {
        console.error('Push notification failed:', pushErr);
      }
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (err) {
    console.error('Order creation error:', err);
    return NextResponse.json({ error: '提交订单失败' }, { status: 500 });
  }
}
