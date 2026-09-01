'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap,
  BarChart3,
  Keyboard,
  Library,
  BookX,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

// 4 项导航：打字练习 / 词库 / 错题本 / 学习进度
const navItems = [
  { href: '/', label: '打字练习', labelEn: 'Typing', icon: Keyboard },
  { href: '/gallery', label: '词库', labelEn: 'Gallery', icon: Library },
  { href: '/error-book', label: '错题本', labelEn: 'Error Book', icon: BookX },
  { href: '/progress', label: '学习进度', labelEn: 'Progress', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen bg-white border-r border-border transition-all duration-300 sticky top-0',
        collapsed ? 'w-[72px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border shrink-0">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-white font-bold text-lg shrink-0">
          <GraduationCap className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-bold text-foreground tracking-tight">
              EngExplorer
            </h1>
            <p className="text-[10px] text-muted-foreground">英语探索岛</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sky-50 text-sky-700 shadow-sm'
                  : 'text-muted-foreground hover:bg-slate-50 hover:text-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5 shrink-0', isActive && 'text-sky-600')} />
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse button */}
      <div className="p-3 border-t border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 rounded-lg text-muted-foreground hover:bg-slate-50 hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span className="text-xs">收起菜单</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
