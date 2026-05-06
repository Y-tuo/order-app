'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './menu.module.css';

export default function MenuPage() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category_id: '',
    image_url: '', is_available: true, sort_order: 0
  });
  const [showCatForm, setShowCatForm] = useState(false);
  const [catFormData, setCatFormData] = useState({ name: '', icon: '🍽️', sort_order: 0 });
  const router = useRouter();

  useEffect(() => { loadMenu(); }, []);

  async function loadMenu() {
    try {
      const res = await fetch('/api/admin/menu');
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
      if (data.items) setItems(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openAddItem() {
    setEditItem(null);
    setFormData({
      name: '', description: '', price: '', category_id: categories[0]?.id || '',
      image_url: '', is_available: true, sort_order: 0
    });
    setShowForm(true);
  }

  function openEditItem(item) {
    setEditItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category_id: item.category_id,
      image_url: item.image_url || '',
      is_available: item.is_available,
      sort_order: item.sort_order || 0
    });
    setShowForm(true);
  }

  async function saveItem(e) {
    e.preventDefault();
    const body = { ...formData, price: Number(formData.price) };

    try {
      if (editItem) {
        await fetch('/api/admin/menu', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, id: editItem.id })
        });
      } else {
        await fetch('/api/admin/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      }
      setShowForm(false);
      loadMenu();
    } catch (err) {
      alert('保存失败');
    }
  }

  async function deleteItem(id) {
    if (!confirm('确定删除？')) return;
    try {
      await fetch(`/api/admin/menu?id=${id}&type=item`, { method: 'DELETE' });
      loadMenu();
    } catch (err) {
      alert('删除失败');
    }
  }

  async function saveCategory(e) {
    e.preventDefault();
    try {
      await fetch('/api/admin/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'category', ...catFormData })
      });
      setShowCatForm(false);
      setCatFormData({ name: '', icon: '🍽️', sort_order: 0 });
      loadMenu();
    } catch (err) {
      alert('保存失败');
    }
  }

  async function deleteCategory(id) {
    if (!confirm('删除分类将同时删除该分类下的所有菜品，确定？')) return;
    try {
      await fetch(`/api/admin/menu?id=${id}&type=category`, { method: 'DELETE' });
      loadMenu();
    } catch (err) {
      alert('删除失败');
    }
  }

  async function toggleAvailable(item) {
    try {
      await fetch('/api/admin/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category_id: item.category_id,
          image_url: item.image_url,
          is_available: !item.is_available,
          sort_order: item.sort_order
        })
      });
      loadMenu();
    } catch (err) {
      alert('更新失败');
    }
  }

  const getCategoryName = (catId) => categories.find(c => c.id === catId)?.name || '未分类';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>📦 菜品管理</h1>
        <div className={styles.headerActions}>
          <button className={styles.addCatBtn} onClick={() => setShowCatForm(true)}>+ 新增分类</button>
          <button className={styles.addBtn} onClick={openAddItem}>+ 新增菜品</button>
        </div>
      </div>

      {/* Categories */}
      <div className={styles.catSection}>
        <h3 className={styles.sectionTitle}>分类管理</h3>
        <div className={styles.catGrid}>
          {categories.map(cat => (
            <div key={cat.id} className={styles.catCard}>
              <span className={styles.catIcon}>{cat.icon}</span>
              <span className={styles.catName}>{cat.name}</span>
              <span className={styles.catCount}>
                {items.filter(i => i.category_id === cat.id).length} 道菜
              </span>
              <button className={styles.catDeleteBtn} onClick={() => deleteCategory(cat.id)}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Items Table */}
      <div className={styles.tableSection}>
        <h3 className={styles.sectionTitle}>菜品列表</h3>
        {loading ? (
          <p className={styles.loading}>加载中...</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>图片</th>
                  <th>名称</th>
                  <th>分类</th>
                  <th>价格</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <img
                        src={item.image_url || '/images/placeholder.svg'}
                        alt={item.name}
                        className={styles.itemImg}
                      />
                    </td>
                    <td>
                      <div className={styles.itemName}>{item.name}</div>
                      <div className={styles.itemDesc}>{item.description}</div>
                    </td>
                    <td>{getCategoryName(item.category_id)}</td>
                    <td className={styles.itemPrice}>{item.price} 饭票</td>
                    <td>
                      <button
                        className={`${styles.toggleBtn} ${item.is_available ? styles.toggleOn : styles.toggleOff}`}
                        onClick={() => toggleAvailable(item)}
                      >
                        {item.is_available ? '在售' : '停售'}
                      </button>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.editBtn} onClick={() => openEditItem(item)}>编辑</button>
                        <button className={styles.deleteBtn} onClick={() => deleteItem(item.id)}>删除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Item Form Modal */}
      {showForm && (
        <div className={styles.overlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editItem ? '编辑菜品' : '新增菜品'}</h3>
              <button className={styles.modalClose} onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={saveItem} className={styles.form}>
              <div className={styles.formRow}>
                <label>菜品名称</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className={styles.formRow}>
                <label>描述</label>
                <input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className={styles.formRow}>
                <label>价格 (饭票)</label>
                <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
              </div>
              <div className={styles.formRow}>
                <label>分类</label>
                <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div className={styles.formRow}>
                <label>图片 URL（留空使用占位图）</label>
                <input value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} placeholder="/images/placeholder.svg" />
              </div>
              <div className={styles.formRow}>
                <label>排序（数字越小越靠前）</label>
                <input type="number" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: Number(e.target.value)})} />
              </div>
              <div className={styles.formRow}>
                <label className={styles.checkLabel}>
                  <input type="checkbox" checked={formData.is_available} onChange={e => setFormData({...formData, is_available: e.target.checked})} />
                  上架销售
                </label>
              </div>
              <button type="submit" className={styles.submitBtn}>保存</button>
            </form>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCatForm && (
        <div className={styles.overlay} onClick={() => setShowCatForm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>新增分类</h3>
              <button className={styles.modalClose} onClick={() => setShowCatForm(false)}>✕</button>
            </div>
            <form onSubmit={saveCategory} className={styles.form}>
              <div className={styles.formRow}>
                <label>分类名称</label>
                <input value={catFormData.name} onChange={e => setCatFormData({...catFormData, name: e.target.value})} required />
              </div>
              <div className={styles.formRow}>
                <label>图标 Emoji</label>
                <input value={catFormData.icon} onChange={e => setCatFormData({...catFormData, icon: e.target.value})} />
              </div>
              <div className={styles.formRow}>
                <label>排序</label>
                <input type="number" value={catFormData.sort_order} onChange={e => setCatFormData({...catFormData, sort_order: Number(e.target.value)})} />
              </div>
              <button type="submit" className={styles.submitBtn}>保存</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
