import './globals.css';

export const metadata = {
  title: '美味餐厅 - 在线点菜',
  description: '扫码点菜，轻松下单，美味即达',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
