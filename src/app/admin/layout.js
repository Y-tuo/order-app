'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './admin.module.css';

const navItems = [
  { href: '/admin/orders', icon: '📋', label: '订单管理' },
  { href: '/admin/menu', icon: '📦', label: '菜品管理' },
  { href: '/admin/history', icon: '📊', label: '历史统计' },
  { href: '/admin/users', icon: '👥', label: '账号管理' },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  // Login page doesn't need admin layout
  if (pathname === '/admin/login') {
    return children;
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarLogo}>🍜</span>
          <h2 className={styles.sidebarTitle}>美味餐厅</h2>
          <span className={styles.sidebarSub}>管理后台</span>
        </div>
        <nav className={styles.nav}>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.navActive : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.navItem} target="_blank">
            <span className={styles.navIcon}>🔗</span>
            <span className={styles.navLabel}>访问点菜页</span>
          </Link>
        </div>
      </aside>
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
