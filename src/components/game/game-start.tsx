'use client';

// 开始覆盖层：词库信息、模式选择、玩法说明、开始按钮（玻璃拟态）
import { memo } from 'react';
import { Play, Library, Keyboard, Heart, Swords, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GameMode } from '@/lib/game';
import { cn } from '@/lib/utils';

interface GameStartProps {
  bankTitle: string;
  wordCount: number;
  unit?: string;
  gameMode: GameMode;
  onStart: () => void;
  onSelectMode: (mode: GameMode) => void;
}

export const GameStart = memo(function GameStart({
  bankTitle,
  wordCount,
  unit = '词',
  gameMode,
  onStart,
  onSelectMode,
}: GameStartProps) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 backdrop-blur-md bg-white/70 px-6 text-center dark:bg-[#070b18]/70">
      <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">
        打字游戏
      </h2>

      <div className="flex items-center gap-2 rounded-full border border-purple-300 bg-purple-100/70 px-4 py-1.5 dark:border-purple-800/60 dark:bg-purple-950/40">
        <Library className="w-4 h-4 text-purple-500 dark:text-purple-300" />
        <span className="text-sm text-purple-700 dark:text-purple-200">
          {bankTitle || '默认词库'} · {wordCount} {unit}
        </span>
      </div>

      {/* 模式选择 */}
      <div className="flex gap-3">
        <button
          onClick={() => onSelectMode('letter')}
          className={cn(
            'flex flex-col items-center gap-2 px-5 py-3 rounded-xl border-2 transition-all duration-200',
            gameMode === 'letter'
              ? 'border-purple-500 bg-purple-100 dark:bg-purple-950/60 shadow-[0_0_20px_rgba(139,92,246,0.4)]'
              : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 hover:border-purple-300 dark:hover:border-purple-600'
          )}
        >
          <Swords className={cn('w-6 h-6', gameMode === 'letter' ? 'text-purple-500' : 'text-slate-400')} />
          <span className={cn('text-sm font-medium', gameMode === 'letter' ? 'text-purple-700 dark:text-purple-200' : 'text-slate-500 dark:text-slate-400')}>
            字母模式
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-500">逐字击杀</span>
        </button>

        <button
          onClick={() => onSelectMode('spell')}
          className={cn(
            'flex flex-col items-center gap-2 px-5 py-3 rounded-xl border-2 transition-all duration-200',
            gameMode === 'spell'
              ? 'border-emerald-500 bg-emerald-100 dark:bg-emerald-950/60 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
              : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 hover:border-emerald-300 dark:hover:border-emerald-600'
          )}
        >
          <PenTool className={cn('w-6 h-6', gameMode === 'spell' ? 'text-emerald-500' : 'text-slate-400')} />
          <span className={cn('text-sm font-medium', gameMode === 'spell' ? 'text-emerald-700 dark:text-emerald-200' : 'text-slate-500 dark:text-slate-400')}>
            拼写模式
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-500">看中文拼写</span>
        </button>
      </div>

      {/* 玩法说明 */}
      <div className="flex flex-col gap-2 text-sm text-slate-600 max-w-md dark:text-slate-300">
        {gameMode === 'letter' ? (
          <>
            <p className="flex items-center justify-center gap-2">
              <Swords className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              每次出现一个单词，每个字母都是一个敌人
            </p>
            <p className="flex items-center justify-center gap-2">
              <Keyboard className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              按对字母即从键位发射光波子弹，击碎对应字母敌人
            </p>
            <p className="flex items-center justify-center gap-2">
              <Heart className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
              敌人越过底部青色防线会扣血，血量归零游戏结束
            </p>
          </>
        ) : (
          <>
            <p className="flex items-center justify-center gap-2">
              <PenTool className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              屏幕上显示中文意思，输入对应英文单词
            </p>
            <p className="flex items-center justify-center gap-2">
              <Keyboard className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              输入完整英文后自动攻击，无需按 Enter
            </p>
            <p className="flex items-center justify-center gap-2">
              <Heart className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
              敌人越过底部青色防线会扣血，血量归零游戏结束
            </p>
          </>
        )}
      </div>

      <Button
        size="lg"
        onClick={onStart}
        className={cn(
          'gap-2 border-0 shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:-translate-y-0.5 transition-all',
          gameMode === 'letter'
            ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500'
            : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500'
        )}
      >
        <Play className="w-5 h-5" />
        开始战斗（Enter）
      </Button>
    </div>
  );
});
