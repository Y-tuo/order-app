'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ingredients.module.css';

export default function AdminIngredientsPage() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadIngredients();
  }, []);

  async function loadIngredients() {
    try {
      const res = await fetch('/api/admin/ingredients');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (data.ingredients) {
        setIngredients(data.ingredients);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(id) {
    if (!confirm('确定要恢复该食材吗？')) return;
    try {
      const res = await fetch('/api/admin/ingredients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        loadIngredients();
      } else {
        alert(data.error || '恢复失败');
      }
    } catch (err) {
      alert('网络错误');
    }
  }

  async function handleHardDelete(id) {
    if (!confirm('永久删除后将无法恢复，确定要彻底删除该记录吗？')) return;
    try {
      const res = await fetch(`/api/admin/ingredients?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadIngredients();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (err) {
      alert('网络错误');
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>🥦 食材高级管理</h1>
      <div className={styles.content}>
        <div className={styles.listCard}>
          <div className={styles.headerRow}>
            <h2>食材数据全景</h2>
            <p className={styles.subText}>您可以查看家人们的所有操作记录，并恢复被误删的食材。</p>
          </div>
          {loading ? (
            <p style={{ padding: '20px' }}>加载中...</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>食材名称</th>
                  <th>数量</th>
                  <th>分类</th>
                  <th>备注</th>
                  <th>状态</th>
                  <th>最后操作人</th>
                  <th>操作时间</th>
                  <th>高级操作</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map(ing => (
                  <tr key={ing.id} className={ing.status === 'deleted' ? styles.deletedRow : ''}>
                    <td>{ing.id}</td>
                    <td style={{ fontWeight: 'bold' }}>{ing.name}</td>
                    <td>{ing.quantity || '-'}</td>
                    <td>{ing.category}</td>
                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ing.remark}>
                      {ing.remark || '-'}
                    </td>
                    <td>
                      <span className={ing.status === 'deleted' ? styles.badgeDeleted : styles.badgeActive}>
                        {ing.status === 'deleted' ? '已删除' : '正常'}
                      </span>
                    </td>
                    <td>{ing.last_updated_by}</td>
                    <td>{new Date(ing.updated_at).toLocaleString()}</td>
                    <td>
                      {ing.status === 'deleted' ? (
                        <button className={styles.btnRestore} onClick={() => handleRestore(ing.id)}>恢复</button>
                      ) : (
                        <span style={{ color: '#ccc', fontSize: '12px' }}>无</span>
                      )}
                      <button className={styles.btnHardDelete} onClick={() => handleHardDelete(ing.id)}>彻底删除</button>
                    </td>
                  </tr>
                ))}
                {ingredients.length === 0 && (
                  <tr><td colSpan="9" style={{textAlign:'center', padding: '40px', color:'#999'}}>暂无食材记录</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
