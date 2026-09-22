'use client';

// 游戏顶部 HUD：血量、得分、击杀、连击、等级、能量条
import { memo } from 'react';
import { Heart, Zap, Swords, Flame, Gauge } from 'lucide-react';
import type { GameStats } from '@/lib/game';
import { GAME_MAX_HP, GAME_MAX_ENERGY } from '@/lib/game';
import { cn } from '@/lib/utils';

interface GameHudProps {
  stats: GameStats;
  wpm: number;
}

export const GameHud = memo(function GameHud({ stats, wpm }: GameHudProps) {
  return (
    <div className="w-full max-w-4xl flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        {/* 血量 */}
        <div className="flex items-center gap-1">
          {Array.from({ length: GAME_MAX_HP }).map((_, i) => (
            <Heart
              key={i}
              className={cn(
                'w-4 h-4 md:w-5 md:h-5 transition-colors',
                i < stats.hp
                  ? 'text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                  : 'text-slate-300 dark:text-slate-600'
              )}
            />
          ))}
        </div>

        {/* 得分 */}
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="font-mono font-bold text-amber-600 dark:text-amber-300 tabular-nums">
            {stats.score.toLocaleString()}
          </span>
        </div>

        {/* 击杀 */}
        <div className="flex items-center gap-1.5">
          <Swords className="w-4 h-4 text-purple-400" />
          <span className="font-mono font-bold text-purple-600 dark:text-purple-300 tabular-nums">{stats.kills}</span>
        </div>

        {/* 连击 */}
        <div className="flex items-center gap-1.5">
          <Flame
            className={cn(
              'w-4 h-4',
              stats.combo > 0 ? 'text-orange-400 animate-flame-flicker' : 'text-slate-600'
            )}
          />
          <span
            key={stats.combo}
            className={cn(
              'font-mono font-bold tabular-nums animate-hud-pop',
              stats.combo > 0 ? 'text-orange-300' : 'text-slate-500'
            )}
          >
            x{stats.combo}
          </span>
        </div>

        {/* 等级 */}
        <div className="flex items-center gap-1.5">
          <Gauge className="w-4 h-4 text-fuchsia-400" />
          <span className="font-mono font-bold text-fuchsia-600 dark:text-fuchsia-300 tabular-nums">
            Lv.{stats.level}
          </span>
        </div>

        {/* WPM */}
        <span className="hidden md:inline font-mono text-slate-500 dark:text-slate-400 tabular-nums">{wpm} WPM</span>
      </div>

      {/* 能量条 */}
      <div className="h-2.5 rounded-full bg-slate-800/80 border border-cyan-900/60 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_10px_rgba(34,211,238,0.7)] transition-all duration-300"
          style={{ width: `${(stats.energy / GAME_MAX_ENERGY) * 100}%` }}
        />
      </div>
    </div>
  );
});
