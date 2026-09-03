'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { GraduationCap, BarChart3, Keyboard, Library, BookX, Sun, Moon, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';

// 4 项导航：打字练习 / 词库 / 错题本 / 学习进度
const navItems = [
  { href: '/', label: '打字练习', icon: Keyboard },
  { href: '/gallery', label: '词库', icon: Library },
  { href: '/error-book', label: '错题本', icon: BookX },
  { href: '/progress', label: '学习进度', icon: BarChart3 },
];

// 当前页高亮判断：首页精确匹配，其余前缀匹配
function isNavActive(pathname: string, href: string) {
  return pathname === href || (href !== '/' && pathname.startsWith(href));
}

// 全局单行顶栏：Logo + 图标导航（位置固定）+ 页面插槽 + 全屏 + 主题切换
// 全屏按钮所有页面均显示，目标为整个文档
// 移动端隐藏（走 MobileNav 底部 Tab）
export function TopBar({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  // 暗黑模式切换：mounted 前不渲染图标，避免 SSR 水合不一致
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === 'dark';

  // 全屏状态：监听 fullscreenchange，保证 Esc 退出后图标同步
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <header className="hidden md:flex items-center gap-3 h-12 px-4 bg-background border-b border-border sticky top-0 z-30 shrink-0">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 text-white">
          <GraduationCap className="w-4 h-4" />
        </div>
        <div className="leading-tight">
          <h1 className="text-sm font-bold text-foreground tracking-tight">EngExplorer</h1>
          <p className="text-[10px] text-muted-foreground">英语探索岛</p>
        </div>
      </Link>

      <TooltipProvider delayDuration={200}>
        {/* 页面内容插槽（左侧）：如首页的课程信息 + 计时 + 练习工具 */}
        <div className="flex-1 min-w-0 flex items-center gap-1">{children}</div>

        {/* 图标导航：固定在右侧（全屏/主题按钮左边） */}
        <nav className="flex items-center gap-1 shrink-0">
          {navItems.map((item) => {
            const isActive = isNavActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon-sm"
                    className={cn(
                      isActive &&
                        'bg-sky-100 text-sky-600 hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-400'
                    )}
                  >
                    <Link href={item.href}>
                      <Icon className="w-4 h-4" />
                      <span className="sr-only">{item.label}</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* 主题切换 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="sr-only">切换主题</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isDark ? '切换到浅色模式' : '切换到暗黑模式'}
          </TooltipContent>
        </Tooltip>
        {/* 全屏：所有页面固定显示 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="sr-only">全屏</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{isFullscreen ? '退出全屏' : '全屏'}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </header>
  );
}
