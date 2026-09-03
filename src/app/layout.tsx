import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { MobileNav } from '@/components/layout/mobile-nav';
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
    <html lang="zh-CN" className={nunito.variable} suppressHydrationWarning>
      <body className={`${nunito.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex flex-col h-screen overflow-hidden">
            <MobileNav />
            <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
