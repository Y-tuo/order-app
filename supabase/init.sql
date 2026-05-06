-- ============================================
-- 美味餐厅点菜系统 - 数据库初始化 SQL
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================

-- 1. 创建分类表
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🍽️',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建菜品表
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT DEFAULT '/images/placeholder.svg',
  is_available BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建订单表
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  table_no TEXT DEFAULT '未指定',
  remark TEXT DEFAULT '',
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'cooking', 'done')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建订单明细表
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1
);

-- 5. 创建索引
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 6. 启用 Realtime（用于管理端实时接收新订单）
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- 7. RLS 策略
-- 允许任何人读取菜单（顾客端需要）
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read categories" ON categories FOR SELECT USING (true);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read menu_items" ON menu_items FOR SELECT USING (true);

-- 允许任何人创建订单（顾客端需要）
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert orders" ON orders FOR INSERT WITH CHECK (true);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read order_items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert order_items" ON order_items FOR INSERT WITH CHECK (true);

-- ============================================
-- 8. 插入初始菜品数据
-- ============================================

-- 分类
INSERT INTO categories (name, icon, sort_order) VALUES
  ('热门推荐', '🔥', 1),
  ('凉菜', '🥒', 2),
  ('热菜', '🍳', 3),
  ('汤类', '🥣', 4),
  ('主食', '🍚', 5),
  ('饮品', '🥤', 6);

-- 菜品（使用分类的 UUID，需要子查询）
INSERT INTO menu_items (category_id, name, description, price, sort_order) VALUES
  ((SELECT id FROM categories WHERE name = '热门推荐'), '水煮鱼', '鲜嫩鱼片，麻辣鲜香，回味无穷', 58, 1),
  ((SELECT id FROM categories WHERE name = '热门推荐'), '宫保鸡丁', '花生脆嫩，鸡丁滑嫩，经典川菜', 38, 2),
  ((SELECT id FROM categories WHERE name = '热门推荐'), '麻婆豆腐', '麻辣鲜烫，豆腐嫩滑，下饭神器', 28, 3),
  ((SELECT id FROM categories WHERE name = '热门推荐'), '糖醋里脊', '外酥里嫩，酸甜可口，老少皆宜', 42, 4),

  ((SELECT id FROM categories WHERE name = '凉菜'), '凉拌黄瓜', '清爽开胃，蒜香浓郁', 12, 1),
  ((SELECT id FROM categories WHERE name = '凉菜'), '口水鸡', '红油浇淋，麻辣鲜香', 32, 2),
  ((SELECT id FROM categories WHERE name = '凉菜'), '皮蛋豆腐', '入口即化，清凉爽滑', 18, 3),
  ((SELECT id FROM categories WHERE name = '凉菜'), '拍黄瓜', '爽脆可口，清淡解腻', 10, 4),

  ((SELECT id FROM categories WHERE name = '热菜'), '回锅肉', '肥而不腻，酱香浓厚', 36, 1),
  ((SELECT id FROM categories WHERE name = '热菜'), '鱼香肉丝', '酸甜微辣，肉丝滑嫩', 32, 2),
  ((SELECT id FROM categories WHERE name = '热菜'), '干煸四季豆', '干香酥脆，咸鲜适口', 26, 3),
  ((SELECT id FROM categories WHERE name = '热菜'), '青椒肉丝', '青椒脆嫩，肉丝鲜嫩', 30, 4),

  ((SELECT id FROM categories WHERE name = '汤类'), '番茄蛋花汤', '酸甜开胃，蛋花飘香', 16, 1),
  ((SELECT id FROM categories WHERE name = '汤类'), '酸辣汤', '酸辣适口，开胃暖身', 18, 2),
  ((SELECT id FROM categories WHERE name = '汤类'), '紫菜蛋汤', '清淡鲜美，营养丰富', 14, 3),
  ((SELECT id FROM categories WHERE name = '汤类'), '玉米排骨汤', '汤鲜味浓，营养滋补', 38, 4),

  ((SELECT id FROM categories WHERE name = '主食'), '米饭', '精选东北大米，粒粒饱满', 3, 1),
  ((SELECT id FROM categories WHERE name = '主食'), '蛋炒饭', '粒粒分明，蛋香四溢', 15, 2),
  ((SELECT id FROM categories WHERE name = '主食'), '炸酱面', '酱香浓郁，面条劲道', 18, 3),
  ((SELECT id FROM categories WHERE name = '主食'), '红烧牛肉面', '牛肉软烂，汤浓面滑', 28, 4),

  ((SELECT id FROM categories WHERE name = '饮品'), '可乐', '冰爽畅快，经典口味', 6, 1),
  ((SELECT id FROM categories WHERE name = '饮品'), '雪碧', '清凉透心，柠檬味道', 6, 2),
  ((SELECT id FROM categories WHERE name = '饮品'), '酸梅汁', '酸甜解渴，消暑良品', 8, 3),
  ((SELECT id FROM categories WHERE name = '饮品'), '柠檬水', '鲜榨柠檬，清新爽口', 10, 4);
