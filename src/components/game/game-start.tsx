'use client';

// 开始覆盖层：词库信息、玩法说明、开始按钮（玻璃拟态）
import { memo } from 'react';
import { Play, Library, Keyboard, Heart, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GameStartProps {
  bankTitle: string;
  wordCount: number;
  unit?: string; // 条目单位：词 / 句
  onStart: () => void;
}

export const GameStart = memo(function GameStart({ bankTitle, wordCount, unit = '词', onStart }: GameStartProps) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 backdrop-blur-md bg-white/70 px-6 text-center dark:bg-[#070b18]/70">
      <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">
        打字战斗
      </h2>

      <div className="flex items-center gap-2 rounded-full border border-purple-300 bg-purple-100/70 px-4 py-1.5 dark:border-purple-800/60 dark:bg-purple-950/40">
        <Library className="w-4 h-4 text-purple-500 dark:text-purple-300" />
        <span className="text-sm text-purple-700 dark:text-purple-200">
          {bankTitle || '默认词库'} · {wordCount} {unit}
        </span>
      </div>

      <div className="flex flex-col gap-2 text-sm text-slate-600 max-w-md dark:text-slate-300">
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
      </div>

      <Button
        size="lg"
        onClick={onStart}
        className="gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0 shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] hover:-translate-y-0.5 transition-all"
      >
        <Play className="w-5 h-5" />
        开始战斗（Enter）
      </Button>
    </div>
  );
});
