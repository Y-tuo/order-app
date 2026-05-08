'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

const STATUS_MAP = {
  pending: '待处理',
  cooking: '制作中',
  done: '已完成'
};

export default function CustomerPage() {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState({});
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showTodayOrders, setShowTodayOrders] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Auth
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Order history
  const [myOrderIds, setMyOrderIds] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const menuRef = useRef(null);
  const sectionRefs = useRef({});
  const isScrolling = useRef(false);

  // Initialize from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('myOrderIds');
      if (stored) {
        setMyOrderIds(JSON.parse(stored));
      }
    } catch (e) {}
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      if (data.authenticated) {
        setUser(data.user);
        loadMenu();
      } else {
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setLoading(true);
        loadMenu();
      } else {
        setLoginError(data.error);
      }
    } catch (err) {
      setLoginError('网络错误，请重试');
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleLogout() {
    if (!confirm('确定要退出登录吗？')) return;
    await fetch('/api/logout', { method: 'POST' });
    setUser(null);
  }

  async function loadMenu() {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      if (data.categories && data.menuItems) {
        setCategories(data.categories);
        setMenuItems(data.menuItems);
        if (data.categories.length > 0) {
          setActiveCategory(data.categories[0].id);
        }
      }
    } catch (err) {
      console.error('加载菜单失败:', err);
    } finally {
      setLoading(false);
    }
  }

  // Load order history
  const loadHistory = useCallback(async () => {
    if (myOrderIds.length === 0) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/my-orders?ids=${myOrderIds.join(',')}`);
      const data = await res.json();
      if (data.orders) {
        setMyOrders(data.orders);
      }
    } catch (err) {
      console.error('获取历史记录失败:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [myOrderIds]);

  useEffect(() => {
    if (showTodayOrders || showHistory) {
      loadHistory();
    }
  }, [showTodayOrders, showHistory, loadHistory]);

  // 判断是否为今天的订单
  function isToday(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() &&
           d.getMonth() === now.getMonth() &&
           d.getDate() === now.getDate();
  }

  // 获取今日订单
  const todayOrders = myOrders.filter(o => isToday(o.created_at));
  // 获取历史订单（非今日）
  const pastOrders = myOrders.filter(o => !isToday(o.created_at));

  // Scroll spy - update active category based on scroll position
  const handleScroll = useCallback(() => {
    if (isScrolling.current) return;
    const container = menuRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    let current = null;

    for (const cat of categories) {
      const el = sectionRefs.current[cat.id];
      if (el && el.offsetTop - container.offsetTop <= scrollTop + 60) {
        current = cat.id;
      }
    }

    if (current && current !== activeCategory) {
      setActiveCategory(current);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    const container = menuRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Click category -> scroll to section
  function scrollToCategory(catId) {
    const el = sectionRefs.current[catId];
    const container = menuRef.current;
    if (el && container) {
      isScrolling.current = true;
      setActiveCategory(catId);
      container.scrollTo({
        top: el.offsetTop - container.offsetTop,
        behavior: 'smooth'
      });
      setTimeout(() => { isScrolling.current = false; }, 600);
    }
  }

  // Cart operations
  function addItem(item) {
    setCart(prev => ({
      ...prev,
      [item.id]: {
        ...item,
        qty: (prev[item.id]?.qty || 0) + 1
      }
    }));
  }

  function removeItem(itemId) {
    setCart(prev => {
      const next = { ...prev };
      if (next[itemId]) {
        next[itemId] = { ...next[itemId], qty: next[itemId].qty - 1 };
        if (next[itemId].qty <= 0) delete next[itemId];
      }
      return next;
    });
  }

  function clearCart() {
    setCart({});
    setShowCart(false);
  }

  const cartItems = Object.values(cart);
  const totalCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

  // Submit order
  async function submitOrder() {
    if (cartItems.length === 0) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNo: '未指定',
          remark: remark.trim(),
          items: cartItems.map(i => ({
            menu_item_id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.qty
          })),
          totalPrice
        })
      });

      const data = await res.json();
      if (data.success) {
        setOrderId(data.orderId);
        setShowOrder(false);
        setShowSuccess(true);
        setCart({});
        setRemark('');
        
        // Save to history
        const newHistory = [data.orderId, ...myOrderIds].slice(0, 50); // Keep last 50
        setMyOrderIds(newHistory);
        localStorage.setItem('myOrderIds', JSON.stringify(newHistory));
      } else {
        alert(data.error || '提交失败');
      }
    } catch (err) {
      alert('网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  }

  function formatTime(dateStr) {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  function formatTimeShort(dateStr) {
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>加载中...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <h1 className={styles.loginTitle}>🍜 欢迎来到美味餐厅</h1>
          <p className={styles.loginSubtitle}>请输入专属账号继续点单</p>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <input
              type="text"
              placeholder="账号"
              value={loginForm.username}
              onChange={e => setLoginForm({...loginForm, username: e.target.value})}
              required
            />
            <input
              type="password"
              placeholder="密码"
              value={loginForm.password}
              onChange={e => setLoginForm({...loginForm, password: e.target.value})}
              required
            />
            {loginError && <div className={styles.errorMsg}>{loginError}</div>}
            <button type="submit" disabled={isLoggingIn}>
              {isLoggingIn ? '登录中...' : '进入餐厅'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 渲染订单列表的通用函数
  function renderOrderList(orders, emptyText) {
    if (orders.length === 0) {
      return (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px', opacity: 0.5 }}>📋</div>
          {emptyText}
        </div>
      );
    }
    return (
      <div className={styles.historyList}>
        {orders.map(order => (
          <div key={order.id} className={styles.historyCard}>
            <div className={styles.historyCardHeader}>
              <span>订单 #{order.id} ({formatTime(order.created_at)})</span>
              <span className={styles.historyCardStatus}>{STATUS_MAP[order.status] || order.status}</span>
            </div>
            <div className={styles.historyCardBody}>
              {order.order_items?.map((item, i) => (
                <div key={i} className={styles.historyCardItem}>
                  <span>{item.name} × {item.quantity}</span>
                  <span>{item.price * item.quantity} 饭票</span>
                </div>
              ))}
              {order.remark && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  备注: {order.remark}
                </div>
              )}
              {order.admin_reply && (
                <div style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '6px', background: 'var(--primary-bg)', padding: '8px', borderRadius: '8px' }}>
                  👨‍🍳 店长回复: {order.admin_reply}
                </div>
              )}
            </div>
            <div className={styles.historyCardTotal}>
              合计: {order.total_price} 饭票
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.logo}>🍜 美味餐厅</h1>
        </div>
        <div className={styles.headerRight} style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
          <span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>👤 {user.username}</span>
          <button className={styles.historyBtn} onClick={() => setShowTodayOrders(true)}>
            我的订单
          </button>
          <button className={styles.historyBtn} onClick={() => setShowHistory(true)}>
            历史订单
          </button>
          <button className={styles.historyBtn} onClick={handleLogout} style={{color: 'var(--red)'}}>
            退出
          </button>
        </div>
      </header>

      {/* Main Content: Sidebar + Menu */}
      <div className={styles.main}>
        {/* Left Category Sidebar */}
        <aside className={styles.sidebar}>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`${styles.sidebarItem} ${activeCategory === cat.id ? styles.sidebarActive : ''}`}
              onClick={() => scrollToCategory(cat.id)}
            >
              <span className={styles.sidebarIcon}>{cat.icon}</span>
              <span className={styles.sidebarName}>{cat.name}</span>
            </button>
          ))}
        </aside>

        {/* Right Menu List */}
        <div className={styles.menuContainer} ref={menuRef}>
          {categories.map(cat => (
            <section
              key={cat.id}
              ref={el => { sectionRefs.current[cat.id] = el; }}
              className={styles.menuSection}
            >
              <h2 className={styles.sectionTitle}>
                <span>{cat.icon}</span> {cat.name}
              </h2>
              <div className={styles.menuList}>
                {(menuItems[cat.id] || []).map((item, idx) => (
                  <div key={item.id} className={styles.menuItem}>
                    <div className={styles.menuItemImg}>
                      <img
                        src={item.image_url || '/images/placeholder.svg'}
                        alt={item.name}
                        loading="lazy"
                      />
                    </div>
                    <div className={styles.menuItemInfo}>
                      <h3 className={styles.menuItemName}>{item.name}</h3>
                      <p className={styles.menuItemDesc}>{item.description}</p>
                      <div className={styles.menuItemBottom}>
                        <span className={styles.menuItemPrice}>
                          {item.price}<em> 饭票</em>
                        </span>
                        <div className={styles.qtyControls}>
                          {cart[item.id] && (
                            <>
                              <button
                                className={styles.qtyBtnMinus}
                                onClick={() => removeItem(item.id)}
                              >−</button>
                              <span className={styles.qtyValue}>{cart[item.id].qty}</span>
                            </>
                          )}
                          <button
                            className={styles.qtyBtnPlus}
                            onClick={() => addItem(item)}
                          >+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
          <div className={styles.menuPadding}></div>
        </div>
      </div>

      {/* Cart Bar */}
      <div className={styles.cartBar}>
        <div className={styles.cartLeft} onClick={() => totalCount > 0 && setShowCart(true)}>
          <div className={styles.cartIconWrap}>
            <span className={styles.cartIcon}>🛒</span>
            {totalCount > 0 && (
              <span className={styles.cartBadge}>{totalCount}</span>
            )}
          </div>
          <div className={styles.cartInfo}>
            {totalCount > 0 ? (
              <>
                <span className={styles.cartTotal}>{totalPrice.toFixed(0)} 饭票</span>
                <span className={styles.cartHint}>点击查看购物车</span>
              </>
            ) : (
              <span className={styles.cartEmpty}>未选购商品</span>
            )}
          </div>
        </div>
        <button
          className={`${styles.cartSubmitBtn} ${totalCount > 0 ? styles.cartSubmitActive : ''}`}
          disabled={totalCount === 0}
          onClick={() => { setShowCart(false); setShowOrder(true); }}
        >
          {totalCount > 0 ? `去结算` : '选好了'}
        </button>
      </div>

      {/* Cart Panel Overlay */}
      {showCart && (
        <div className={styles.overlay} onClick={() => setShowCart(false)}>
          <div className={styles.cartPanel} onClick={e => e.stopPropagation()}>
            <div className={styles.cartPanelHeader}>
              <h3>已选商品</h3>
              <button className={styles.cartClearBtn} onClick={clearCart}>清空</button>
            </div>
            <div className={styles.cartPanelBody}>
              {cartItems.map(item => (
                <div key={item.id} className={styles.cartPanelItem}>
                  <div className={styles.cartPanelItemInfo}>
                    <span className={styles.cartPanelItemName}>{item.name}</span>
                    <span className={styles.cartPanelItemPrice}>{item.price * item.qty} 饭票</span>
                  </div>
                  <div className={styles.qtyControls}>
                    <button className={styles.qtyBtnMinus} onClick={() => removeItem(item.id)}>−</button>
                    <span className={styles.qtyValue}>{item.qty}</span>
                    <button className={styles.qtyBtnPlus} onClick={() => addItem(item)}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.cartPanelFooter}>
              <span className={styles.cartPanelTotal}>合计: <em>{totalPrice.toFixed(0)} 饭票</em></span>
              <button
                className={styles.cartPanelSubmit}
                onClick={() => { setShowCart(false); setShowOrder(true); }}
              >去结算</button>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmation Overlay */}
      {showOrder && (
        <div className={styles.overlay} onClick={() => setShowOrder(false)}>
          <div className={styles.orderPanel} onClick={e => e.stopPropagation()}>
            <div className={styles.orderHeader}>
              <h3>确认订单</h3>
              <button className={styles.orderClose} onClick={() => setShowOrder(false)}>✕</button>
            </div>
            <div className={styles.orderBody}>
              <div className={styles.formGroup}>
                <label>备注</label>
                <textarea
                  value={remark}
                  onChange={e => setRemark(e.target.value)}
                  placeholder="如：不要辣、少盐等"
                  rows={2}
                  maxLength={200}
                />
              </div>
              <div className={styles.orderSummary}>
                {cartItems.map(item => (
                  <div key={item.id} className={styles.orderSummaryItem}>
                    <span>{item.name} × {item.qty}</span>
                    <span>{item.price * item.qty} 饭票</span>
                  </div>
                ))}
                <div className={styles.orderSummaryTotal}>
                  <span>合计</span>
                  <span>{totalPrice.toFixed(0)} 饭票</span>
                </div>
              </div>
              <button
                className={styles.orderConfirmBtn}
                onClick={submitOrder}
                disabled={submitting}
              >
                {submitting ? '提交中...' : '提交订单'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Overlay */}
      {showSuccess && (
        <div className={styles.overlay}>
          <div className={styles.successPanel}>
            <div className={styles.successIcon}>✅</div>
            <h3>下单成功！</h3>
            <p>您的订单已提交，请耐心等待</p>
            <p className={styles.successOrderId}>订单号: #{orderId}</p>
            <button
              className={styles.successBtn}
              onClick={() => setShowSuccess(false)}
            >继续点菜</button>
          </div>
        </div>
      )}

      {/* 今日订单 (我的订单) */}
      {showTodayOrders && (
        <div className={styles.overlay} onClick={() => setShowTodayOrders(false)}>
          <div className={styles.orderPanel} onClick={e => e.stopPropagation()}>
            <div className={styles.orderHeader}>
              <h3>📋 今日订单</h3>
              <button className={styles.orderClose} onClick={() => setShowTodayOrders(false)}>✕</button>
            </div>
            <div className={styles.orderBody}>
              {myOrderIds.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px', opacity: 0.5 }}>📋</div>
                  今天还没有点过菜哦
                </div>
              ) : loadingHistory ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                  加载中...
                </div>
              ) : (
                renderOrderList(todayOrders, '今天还没有点过菜哦')
              )}
            </div>
          </div>
        </div>
      )}

      {/* 历史订单 */}
      {showHistory && (
        <div className={styles.overlay} onClick={() => setShowHistory(false)}>
          <div className={styles.orderPanel} onClick={e => e.stopPropagation()}>
            <div className={styles.orderHeader}>
              <h3>📜 历史订单</h3>
              <button className={styles.orderClose} onClick={() => setShowHistory(false)}>✕</button>
            </div>
            <div className={styles.orderBody}>
              {myOrderIds.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px', opacity: 0.5 }}>📜</div>
                  暂无历史订单
                </div>
              ) : loadingHistory ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                  加载中...
                </div>
              ) : (
                renderOrderList(myOrders, '暂无历史订单记录')
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
