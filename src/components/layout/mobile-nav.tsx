'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap,
  BarChart3,
  Keyboard,
  Library,
  BookX,
  Menu,
  X,
  Bell,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

// 4 项导航（与 sidebar 一致，label 简短以适配底部 Tab）
const navItems = [
  { href: '/', label: '打字', icon: Keyboard },
  { href: '/gallery', label: '词库', icon: Library },
  { href: '/error-book', label: '错题', icon: BookX },
  { href: '/progress', label: '进度', icon: BarChart3 },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between h-14 px-4 bg-background border-b border-border sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 text-white">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-foreground">EngExplorer</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            <Bell className="w-5 h-5" />
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile slide-out menu */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-14 left-0 right-0 bg-background border-b border-border shadow-lg animate-fade-in-up">
            <nav className="p-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400'
                        : 'text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40 px-2 pb-safe">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors',
                  isActive ? 'text-sky-600' : 'text-muted-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
