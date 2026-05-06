'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function CustomerPage() {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState({});
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [tableNo, setTableNo] = useState('');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const menuRef = useRef(null);
  const sectionRefs = useRef({});
  const isScrolling = useRef(false);

  // Load menu data
  useEffect(() => {
    loadMenu();
  }, []);

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
          tableNo: tableNo.trim() || '未指定',
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
        setTableNo('');
        setRemark('');
      } else {
        alert(data.error || '提交失败');
      }
    } catch (err) {
      alert('网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>菜单加载中...</p>
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
        <div className={styles.headerRight}>
          <span className={styles.headerTag}>扫码点餐</span>
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
              {(menuItems[cat.id] || []).map(item => (
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
                        <em>¥</em>{item.price}
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
                <span className={styles.cartTotal}>¥{totalPrice.toFixed(0)}</span>
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
                    <span className={styles.cartPanelItemPrice}>¥{item.price * item.qty}</span>
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
              <span className={styles.cartPanelTotal}>合计: <em>¥{totalPrice.toFixed(0)}</em></span>
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
                <label>桌号</label>
                <input
                  type="text"
                  value={tableNo}
                  onChange={e => setTableNo(e.target.value)}
                  placeholder="请输入桌号，如：A3"
                  maxLength={10}
                />
              </div>
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
                    <span>¥{item.price * item.qty}</span>
                  </div>
                ))}
                <div className={styles.orderSummaryTotal}>
                  <span>合计</span>
                  <span>¥{totalPrice.toFixed(0)}</span>
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
    </div>
  );
}
