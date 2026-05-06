'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './history.module.css';

export default function HistoryPage() {
  const [orders, setOrders] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, revenue: 0, pending: 0, cooking: 0, done: 0, avgPrice: 0 });
  const router = useRouter();

  useEffect(() => {
    loadHistory();
  }, [date]);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?date=${date}&limit=200`);
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        const total = data.orders.length;
        const revenue = data.orders.reduce((s, o) => s + Number(o.total_price), 0);
        setStats({
          total,
          revenue,
          pending: data.orders.filter(o => o.status === 'pending').length,
          cooking: data.orders.filter(o => o.status === 'cooking').length,
          done: data.orders.filter(o => o.status === 'done').length,
          avgPrice: total > 0 ? Math.round(revenue / total) : 0
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(dateStr) {
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  const statusLabel = { pending: '待处理', cooking: '制作中', done: '已完成' };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>📊 历史统计</h1>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className={styles.datePicker}
        />
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📋</div>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>总订单数</div>
        </div>
        <div className={`${styles.statCard} ${styles.statHighlight}`}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statValue}>¥{stats.revenue}</div>
          <div className={styles.statLabel}>总营收</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statValue}>¥{stats.avgPrice}</div>
          <div className={styles.statLabel}>平均客单价</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statValue}>{stats.done}</div>
          <div className={styles.statLabel}>已完成</div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className={styles.breakdownCard}>
        <h3 className={styles.breakdownTitle}>订单状态分布</h3>
        <div className={styles.breakdownBar}>
          {stats.total > 0 && (
            <>
              {stats.done > 0 && (
                <div className={styles.barDone} style={{ width: `${(stats.done / stats.total) * 100}%` }}>
                  {stats.done}
                </div>
              )}
              {stats.cooking > 0 && (
                <div className={styles.barCooking} style={{ width: `${(stats.cooking / stats.total) * 100}%` }}>
                  {stats.cooking}
                </div>
              )}
              {stats.pending > 0 && (
                <div className={styles.barPending} style={{ width: `${(stats.pending / stats.total) * 100}%` }}>
                  {stats.pending}
                </div>
              )}
            </>
          )}
        </div>
        <div className={styles.breakdownLegend}>
          <span className={styles.legendDone}>✅ 已完成 {stats.done}</span>
          <span className={styles.legendCooking}>🔥 制作中 {stats.cooking}</span>
          <span className={styles.legendPending}>⏳ 待处理 {stats.pending}</span>
        </div>
      </div>

      {/* Order History Table */}
      <div className={styles.tableCard}>
        <h3 className={styles.tableTitle}>订单明细</h3>
        {loading ? (
          <p className={styles.loading}>加载中...</p>
        ) : orders.length === 0 ? (
          <p className={styles.empty}>当日无订单记录</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>桌号</th>
                  <th>菜品</th>
                  <th>金额</th>
                  <th>状态</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td className={styles.orderId}>#{order.id}</td>
                    <td>{order.table_no}</td>
                    <td className={styles.orderItems}>
                      {order.order_items?.map(i => `${i.name}×${i.quantity}`).join('、')}
                    </td>
                    <td className={styles.orderPrice}>¥{order.total_price}</td>
                    <td>
                      <span className={`${styles.statusTag} ${styles[`status_${order.status}`]}`}>
                        {statusLabel[order.status]}
                      </span>
                    </td>
                    <td className={styles.orderTime}>{formatTime(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
