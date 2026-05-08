'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import styles from './orders.module.css';

const STATUS_MAP = {
  pending: { label: '待处理', className: 'statusPending' },
  cooking: { label: '制作中', className: 'statusCooking' },
  done: { label: '已完成', className: 'statusDone' }
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, revenue: 0, pending: 0 });
  const [replyText, setReplyText] = useState({});
  const router = useRouter();

  const loadOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);

      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        updateStats(data.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter, router]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Supabase Realtime subscription for new orders
  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders'
      }, () => {
        loadOrders();
        playSound();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders'
      }, () => {
        loadOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  function updateStats(orderList) {
    setStats({
      total: orderList.length,
      revenue: orderList.reduce((s, o) => s + Number(o.total_price), 0),
      pending: orderList.filter(o => o.status === 'pending').length
    });
  }

  async function updateOrderStatus(id, status) {
    try {
      await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      loadOrders();
    } catch (err) {
      console.error(err);
    }
  }

  async function updateAdminReply(id) {
    const text = replyText[id] || '';
    try {
      await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, admin_reply: text })
      });
      loadOrders();
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteOrder(id) {
    if (!confirm('确定要永久删除此订单吗？删除后不可恢复。')) return;
    try {
      await fetch(`/api/admin/orders?id=${id}`, {
        method: 'DELETE',
      });
      loadOrders();
    } catch (err) {
      console.error(err);
    }
  }

  function playSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.15].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(delay === 0 ? 880 : 1100, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.25);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.25);
      });
    } catch {}
  }

  function formatTime(dateStr) {
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  const filters = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待处理' },
    { key: 'cooking', label: '制作中' },
    { key: 'done', label: '已完成' }
  ];

  return (
    <div className={styles.page}>
      {/* Header with stats */}
      <div className={styles.header}>
        <h1 className={styles.title}>📋 订单管理</h1>
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>今日订单</span>
          </div>
          <div className={`${styles.statCard} ${styles.statRevenue}`}>
            <span className={styles.statValue}>{stats.revenue} 饭票</span>
            <span className={styles.statLabel}>今日营收</span>
          </div>
          <div className={`${styles.statCard} ${styles.statPending}`}>
            <span className={styles.statValue}>{stats.pending}</span>
            <span className={styles.statLabel}>待处理</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterBar}>
        {filters.map(f => (
          <button
            key={f.key}
            className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.key === 'pending' && stats.pending > 0 && (
              <span className={styles.filterBadge}>{stats.pending}</span>
            )}
          </button>
        ))}
        <button className={styles.refreshBtn} onClick={loadOrders}>🔄 刷新</button>
      </div>

      {/* Orders Grid */}
      <div className={styles.ordersGrid}>
        {loading ? (
          <div className={styles.empty}>加载中...</div>
        ) : orders.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🍽️</div>
            <p>暂无订单</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div className={styles.orderIdRow}>
                  <span className={styles.orderId}>#{order.id}</span>
                  {order.customers?.username && (
                    <span style={{ fontSize: '13px', marginLeft: '8px', color: 'var(--primary)', fontWeight: '600', background: 'var(--primary-bg)', padding: '2px 10px', borderRadius: '20px' }}>
                      👤 {order.customers.username}
                    </span>
                  )}
                </div>
                <span className={`${styles.statusBadge} ${styles[STATUS_MAP[order.status]?.className]}`}>
                  {STATUS_MAP[order.status]?.label}
                </span>
              </div>

              <div className={styles.orderBody}>
                {order.order_items?.map((item, i) => (
                  <div key={i} className={styles.orderItemRow}>
                    <span>{item.name} × {item.quantity}</span>
                    <span>{item.price * item.quantity} 饭票</span>
                  </div>
                ))}
                {order.remark && (
                  <div className={styles.orderRemark}>📝 {order.remark}</div>
                )}
                {order.admin_reply && (
                  <div style={{ fontSize: '13px', color: 'var(--primary)', marginTop: '8px', background: 'var(--primary-bg)', padding: '10px 12px', borderRadius: '8px' }}>
                    👨‍🍳 已回复: {order.admin_reply}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <input
                    type="text"
                    value={replyText[order.id] !== undefined ? replyText[order.id] : (order.admin_reply || '')}
                    onChange={e => setReplyText({ ...replyText, [order.id]: e.target.value })}
                    placeholder="回复顾客备注..."
                    style={{ flex: 1, padding: '9px 12px', fontSize: '13px', border: '1.5px solid var(--border)', borderRadius: '8px', outline: 'none', transition: 'all 0.2s' }}
                  />
                  <button
                    onClick={() => updateAdminReply(order.id)}
                    style={{ padding: '9px 16px', fontSize: '13px', background: 'var(--primary-bg)', border: '1.5px solid rgba(59,130,246,0.2)', borderRadius: '8px', cursor: 'pointer', color: 'var(--primary)', fontWeight: '500', transition: 'all 0.2s' }}
                  >
                    保存回复
                  </button>
                </div>
              </div>

              <div className={styles.orderFooter}>
                <div>
                  <div className={styles.orderTotal}>{order.total_price} 饭票</div>
                  <div className={styles.orderTime}>⏰ {formatTime(order.created_at)}</div>
                </div>
                <div className={styles.orderActions}>
                  {order.status === 'pending' && (
                    <>
                      <button
                        className={styles.actionCooking}
                        onClick={() => updateOrderStatus(order.id, 'cooking')}
                      >开始制作</button>
                      <button
                        className={styles.actionDone}
                        onClick={() => updateOrderStatus(order.id, 'done')}
                      >完成</button>
                    </>
                  )}
                  {order.status === 'cooking' && (
                    <button
                      className={styles.actionDone}
                      onClick={() => updateOrderStatus(order.id, 'done')}
                    >完成出餐</button>
                  )}
                  <button
                    className={styles.actionDelete}
                    onClick={() => deleteOrder(order.id)}
                    style={{ background: 'var(--red)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', marginLeft: '4px', fontWeight: '600', transition: 'all 0.2s' }}
                  >删除</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
