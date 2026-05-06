'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './users.module.css';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState({});
  const router = useRouter();

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setFormData({ username: '', password: '' });
        setIsEditing(false);
        loadUsers();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('操作失败');
    }
  }

  async function handleDelete(id) {
    if (!confirm('确定要删除此账号吗？该用户将无法再登录点餐。')) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || '删除失败');
      }
      loadUsers();
    } catch (err) {
      console.error(err);
      alert('删除失败');
    }
  }

  function togglePassword(id) {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>👥 账号管理 (家庭成员)</h1>
      <div className={styles.content}>
        <div className={styles.formCard}>
          <h2>{isEditing ? '修改密码' : '新增成员账号'}</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label>登录账号 (如: 老爸)</label>
              <input
                type="text"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                disabled={isEditing}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>登录密码</label>
              <input
                type="text"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder={isEditing ? '输入新密码' : '设置初始密码'}
                required
              />
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary}>保存</button>
              {isEditing && (
                <button type="button" className={styles.btnSecondary} onClick={() => { setIsEditing(false); setFormData({ username: '', password: '' }); }}>取消</button>
              )}
            </div>
          </form>
        </div>

        <div className={styles.listCard}>
          <h2>现有账号</h2>
          {loading ? (
            <p>加载中...</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>账号</th>
                  <th>密码</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: showPassword[user.id] ? 'inherit' : 'monospace', fontSize: showPassword[user.id] ? '14px' : '18px', display: 'inline-block', width: '80px' }}>
                          {showPassword[user.id] ? user.password : '••••••'}
                        </span>
                        <button 
                          onClick={() => togglePassword(user.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-secondary)' }}
                          title={showPassword[user.id] ? '隐藏密码' : '显示密码'}
                        >
                          {showPassword[user.id] ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className={styles.btnEdit} onClick={() => { setIsEditing(true); setFormData({ id: user.id, username: user.username, password: '' }); }}>改密</button>
                      <button className={styles.btnDelete} onClick={() => handleDelete(user.id)}>删除</button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan="4" style={{textAlign:'center', color:'#999'}}>暂无账号，请在左侧添加</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
