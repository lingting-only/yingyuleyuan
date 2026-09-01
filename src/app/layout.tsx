import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
// import { Header } from '@/components/layout/header';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-nunito',
});

export const metadata: Metadata = {
  title: {
    default: 'EngExplorer - 英语探索岛',
    template: '%s | EngExplorer',
  },
  description: '一款趣味英语学习应用，让英语学习像探索岛屿一样有趣',
  keywords: ['英语学习', '在线英语', '英语课程', '互动练习', '学习社区'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={nunito.variable}>
      <body className={`${nunito.className} antialiased`}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* <Header /> */}
            <MobileNav />
            <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
