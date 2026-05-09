'use client';

import React, { useState, useEffect } from 'react';
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
  const [editCategory, setEditCategory] = useState(null);
  const [catFormData, setCatFormData] = useState({ name: '', icon: '🍽️', sort_order: 0 });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
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
      const res = await fetch(`/api/admin/menu?id=${id}&type=item`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadMenu();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (err) {
      alert('网络错误');
    }
  }

  // 批量删除
  async function batchDeleteItems() {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定删除选中的 ${selectedIds.size} 个菜品？此操作不可恢复。`)) return;
    try {
      const ids = Array.from(selectedIds).join(',');
      const res = await fetch(`/api/admin/menu?ids=${ids}&type=item`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSelectedIds(new Set());
        setBatchMode(false);
        loadMenu();
      } else {
        alert(data.error || data.message || '批量删除失败');
      }
    } catch (err) {
      alert('网络错误');
    }
  }

  // 全选/反选
  function toggleSelectAll() {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i.id)));
    }
  }

  // 切换单项选择
  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // 退出批量模式
  function exitBatchMode() {
    setBatchMode(false);
    setSelectedIds(new Set());
  }

  function openAddCategory() {
    setEditCategory(null);
    setCatFormData({ name: '', icon: '🍽️', sort_order: 0 });
    setShowCatForm(true);
  }

  function openEditCategory(cat) {
    setEditCategory(cat);
    setCatFormData({ name: cat.name, icon: cat.icon || '🍽️', sort_order: cat.sort_order || 0 });
    setShowCatForm(true);
  }

  async function saveCategory(e) {
    e.preventDefault();
    try {
      if (editCategory) {
        await fetch('/api/admin/menu', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'category', ...catFormData, id: editCategory.id })
        });
      } else {
        await fetch('/api/admin/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'category', ...catFormData })
        });
      }
      setShowCatForm(false);
      setCatFormData({ name: '', icon: '🍽️', sort_order: 0 });
      loadMenu();
    } catch (err) {
      alert('保存失败');
    }
  }

  async function deleteCategory(id) {
    if (!confirm('删除分类将同时删除该分类下的所有菜品，确定吗？')) return;
    try {
      const res = await fetch(`/api/admin/menu?id=${id}&type=category`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadMenu();
      } else {
        alert(data.error || data.message || '删除失败');
      }
    } catch (err) {
      alert('网络错误');
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

  // --- Drag and Drop Logic ---
  function handleDragStart(e, item) {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  async function handleDrop(e, targetItem) {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    const newItems = [...items];
    const draggedIdx = newItems.findIndex(i => i.id === draggedItem.id);
    const targetIdx = newItems.findIndex(i => i.id === targetItem.id);

    // If moving across categories, update category_id
    const updatedDraggedItem = { ...draggedItem, category_id: targetItem.category_id };
    newItems.splice(draggedIdx, 1);
    newItems.splice(targetIdx, 0, updatedDraggedItem);

    // Update sort_order for the target category
    const categoryItems = newItems.filter(i => i.category_id === targetItem.category_id);
    categoryItems.forEach((item, index) => {
      item.sort_order = index;
    });

    setItems(newItems);
    setDraggedItem(null);

    try {
      await fetch('/api/admin/menu/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: categoryItems })
      });
    } catch (err) {
      alert('排序更新失败');
      loadMenu(); // revert on fail
    }
  }
  // ---------------------------

  const getCategoryName = (catId) => categories.find(c => c.id === catId)?.name || '未分类';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>📦 菜品管理</h1>
          <p className={styles.subtitle}>管理您的菜单分类与菜品</p>
        </div>
        <div className={styles.headerActions}>
          {!batchMode ? (
            <>
              <button className={styles.batchBtn} onClick={() => setBatchMode(true)}>
                <span>☑️</span> 批量管理
              </button>
              <button className={styles.addCatBtn} onClick={openAddCategory}>+ 新增分类</button>
              <button className={styles.addBtn} onClick={openAddItem}>+ 新增菜品</button>
            </>
          ) : (
            <>
              <button className={styles.exitBatchBtn} onClick={exitBatchMode}>退出批量</button>
            </>
          )}
        </div>
      </div>

      {/* Batch Action Bar */}
      {batchMode && (
        <div className={styles.batchBar}>
          <div className={styles.batchLeft}>
            <label className={styles.batchCheckAll}>
              <input
                type="checkbox"
                checked={selectedIds.size === items.length && items.length > 0}
                onChange={toggleSelectAll}
              />
              <span>全选</span>
            </label>
            <span className={styles.batchInfo}>
              已选择 <em>{selectedIds.size}</em> / {items.length} 项
            </span>
          </div>
          <button
            className={styles.batchDeleteBtn}
            disabled={selectedIds.size === 0}
            onClick={batchDeleteItems}
          >
            🗑️ 删除选中 ({selectedIds.size})
          </button>
        </div>
      )}

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
              <div className={styles.catActions}>
                <button className={styles.catEditBtn} onClick={() => openEditCategory(cat)}>编辑</button>
                <button className={styles.catDeleteBtn} onClick={() => deleteCategory(cat.id)}>删除</button>
              </div>
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
                  {batchMode && (
                    <th className={styles.thCheck}>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === items.length && items.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                  )}
                  <th>图片</th>
                  <th>名称</th>
                  <th>分类</th>
                  <th>价格</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => {
                  const catItems = items.filter(i => i.category_id === cat.id);
                  if (catItems.length === 0) return null;
                  return (
                    <React.Fragment key={`cat-${cat.id}`}>
                      <tr className={styles.categoryHeaderRow}>
                        <td colSpan={batchMode ? 7 : 6} style={{ background: '#f8fafc', fontWeight: 700, padding: '12px 16px', color: '#475569' }}>
                          <span style={{ marginRight: '8px' }}>{cat.icon}</span> {cat.name}
                        </td>
                      </tr>
                      {catItems.map(item => (
                        <tr 
                          key={item.id} 
                          className={selectedIds.has(item.id) ? styles.rowSelected : ''}
                          draggable={!batchMode}
                          onDragStart={(e) => handleDragStart(e, item)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, item)}
                          style={{ cursor: !batchMode ? 'move' : 'default' }}
                        >
                          {batchMode && (
                            <td className={styles.tdCheck}>
                              <input
                                type="checkbox"
                                checked={selectedIds.has(item.id)}
                                onChange={() => toggleSelect(item.id)}
                              />
                            </td>
                          )}
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
                          <td><span className={styles.catTag}>{cat.name}</span></td>
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
                    </React.Fragment>
                  );
                })}
                {/* Uncategorized items */}
                {(() => {
                  const uncategorizedItems = items.filter(i => !categories.find(c => c.id === i.category_id));
                  if (uncategorizedItems.length === 0) return null;
                  return (
                    <React.Fragment key="cat-uncategorized">
                      <tr className={styles.categoryHeaderRow}>
                        <td colSpan={batchMode ? 7 : 6} style={{ background: '#f8fafc', fontWeight: 700, padding: '12px 16px', color: '#475569' }}>
                          <span style={{ marginRight: '8px' }}>📦</span> 未分类
                        </td>
                      </tr>
                      {uncategorizedItems.map(item => (
                        <tr 
                          key={item.id} 
                          className={selectedIds.has(item.id) ? styles.rowSelected : ''}
                          draggable={!batchMode}
                          onDragStart={(e) => handleDragStart(e, item)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, item)}
                          style={{ cursor: !batchMode ? 'move' : 'default' }}
                        >
                          {batchMode && (
                            <td className={styles.tdCheck}>
                              <input
                                type="checkbox"
                                checked={selectedIds.has(item.id)}
                                onChange={() => toggleSelect(item.id)}
                              />
                            </td>
                          )}
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
                          <td><span className={styles.catTag}>未分类</span></td>
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
                    </React.Fragment>
                  );
                })()}
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
              <h3>{editCategory ? '编辑分类' : '新增分类'}</h3>
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
