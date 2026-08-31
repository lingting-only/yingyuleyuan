'use client';

import { Bell, Search, User } from 'lucide-react';

export function Header() {
  return (
    <header className="hidden md:flex items-center justify-between h-16 px-6 bg-white border-b border-border sticky top-0 z-30">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-border flex-1">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索课程、单词、语法..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-xl hover:bg-slate-50 text-muted-foreground transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 flex items-center justify-center text-white">
            <User className="w-4 h-4" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-foreground leading-tight">学习者</p>
            <p className="text-[10px] text-muted-foreground">Lv.5 探索者</p>
          </div>
        </div>
      </div>
    </header>
  );
}
