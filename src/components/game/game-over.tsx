'use client';

// 结算覆盖层：得分/击杀/WPM/准确率/最高连击 + 历史最高纪录 + 再来一局
import { memo } from 'react';
import { RotateCcw, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GameStats } from '@/lib/game';
import type { GameBest } from '@/lib/storage';

interface GameOverProps {
  stats: GameStats;
  wpm: number;
  accuracy: number;
  best: GameBest;
  isNewBest: boolean;
  onRestart: () => void;
}

export const GameOver = memo(function GameOver({
  stats,
  wpm,
  accuracy,
  best,
  isNewBest,
  onRestart,
}: GameOverProps) {
  const rows = [
    { label: '完成单词', value: stats.kills },
    { label: '最高连击', value: `x${stats.maxCombo}` },
    { label: 'WPM', value: wpm },
    { label: '准确率', value: `${accuracy}%` },
    { label: '存活时间', value: `${stats.elapsed}s` },
  ];

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 backdrop-blur-md bg-white/75 px-6 text-center dark:bg-[#070b18]/75">
      <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 drop-shadow-[0_0_20px_rgba(248,113,113,0.5)]">
        战斗结束
      </h2>

      {isNewBest && (
        <div className="animate-score-pop flex items-center gap-2 rounded-full border border-amber-400 bg-amber-100/70 px-4 py-1.5 dark:border-amber-500/60 dark:bg-amber-950/50">
          <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-bold text-amber-700 dark:text-amber-300">新纪录！</span>
        </div>
      )}

      <div className="animate-score-pop text-5xl md:text-6xl font-extrabold font-mono text-amber-600 drop-shadow-[0_0_24px_rgba(217,119,6,0.35)] tabular-nums dark:text-amber-300 dark:drop-shadow-[0_0_24px_rgba(251,191,36,0.6)]">
        {stats.score.toLocaleString()}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3 w-full max-w-lg">
        {rows.map((r) => (
          <div
            key={r.label}
            className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700/60 dark:bg-slate-900/60"
          >
            <div className="text-[10px] text-slate-500 dark:text-slate-400">{r.label}</div>
            <div className="font-mono font-bold text-slate-900 tabular-nums dark:text-slate-100">{r.value}</div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        历史最佳：{best.score.toLocaleString()} 分 · {best.kills} 杀 · x{best.maxCombo} 连击 ·{' '}
        {best.survived}s
      </p>

      <Button
        size="lg"
        onClick={onRestart}
        className="gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0 shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] hover:-translate-y-0.5 transition-all"
      >
        <RotateCcw className="w-5 h-5" />
        再来一局（Enter）
      </Button>
    </div>
  );
});
