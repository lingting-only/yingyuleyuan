'use client';

// 战场容器：星际太空背景（星云 + 闪烁星空）、单词信息（音标/中文/输入进度）、字母敌人、飘字层、底部防线
import { memo, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { GameWord, LetterEnemy, FloatingText } from '@/lib/game';
import { GAME_DEFENSE_LINE } from '@/lib/game';
import { LetterEnemyCard } from './game-enemy';
import { FloatingTextLayer } from './floating-text';
import { cn } from '@/lib/utils';

interface Star {
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
}

interface Meteor {
  left: number; // 起始 left %
  top: number; // 起始 top %
  angle: number; // 划过角度
  dist: number; // 移动距离 px
  delay: number; // 动画延迟 s
  duration: number; // 周期 s
}

interface GameArenaProps {
  word: GameWord | null;
  typed: number;
  enemies: LetterEnemy[];
  floats: FloatingText[];
  shakeKey: number;
  onDeathEnd: (id: number) => void;
  onFloatEnd: (id: number) => void;
  children?: ReactNode; // 覆盖层（开始/暂停/结算）
}

export const GameArena = memo(function GameArena({
  word,
  typed,
  enemies,
  floats,
  shakeKey,
  onDeathEnd,
  onFloatEnd,
  children,
}: GameArenaProps) {
  // 星空与流星：客户端生成随机数据（避免 SSR/CSR 水合不一致）
  const [stars, setStars] = useState<Star[]>([]);
  const [meteors, setMeteors] = useState<Meteor[]>([]);
  useEffect(() => {
    setStars(
      Array.from({ length: 90 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 2,
        delay: Math.random() * 5,
        duration: 2 + Math.random() * 4,
      }))
    );
    setMeteors(
      Array.from({ length: 5 }, (_, i) => {
        // 一半从左上向右下（35°~75°），一半从右上向左下（110°~150°）
        const fromLeft = i % 2 === 0;
        const angle = fromLeft ? 35 + Math.random() * 40 : 110 + Math.random() * 40;
        return {
          left: fromLeft ? Math.random() * 22 : 78 + Math.random() * 22,
          top: Math.random() * 22,
          angle,
          dist: 420 + Math.random() * 200,
          delay: i * 1.5 + Math.random() * 1.2,
          duration: 5.5 + Math.random() * 2.5,
        };
      })
    );
  }, []);

  return (
    // key 随 shakeKey 变化强制重挂，保证每次受伤都能重新播放震屏动画
    <div
      key={shakeKey}
      className={cn(
        'relative w-full max-w-4xl flex-1 min-h-0 overflow-hidden rounded-2xl border border-purple-200 dark:border-purple-900/60',
        'bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-[#030016] dark:via-[#0a0a2e] dark:to-[#0e0a2e]',
        shakeKey > 0 && 'animate-shake-screen'
      )}
      style={{
        backgroundImage:
          'linear-gradient(var(--arena-grid) 1px, transparent 1px), linear-gradient(90deg, var(--arena-grid) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    >
      {/* 星云光斑：柔和的彩色光晕营造太空氛围（颜色随主题变量） */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute -top-16 -left-16 w-80 h-80 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--nebula-1), transparent 70%)' }}
        />
        <div
          className="absolute -bottom-24 -right-16 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--nebula-2), transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--nebula-3), transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-56 h-56 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--nebula-4), transparent 70%)' }}
        />
      </div>

      {/* 星空闪烁（颜色随主题变量） */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {stars.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-indigo-300/70 dark:bg-white animate-star-twinkle"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
              boxShadow: 'var(--star-glow)',
            }}
          />
        ))}
      </div>

      {/* 流星划过：随机角度/距离，亮点带拖尾快速斜向掠过 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {meteors.map((m, i) => (
          <span
            key={i}
            className="absolute meteor meteor-fly"
            style={
              {
                left: `${m.left}%`,
                top: `${m.top}%`,
                '--angle': `${m.angle}deg`,
                '--dist': `${m.dist}px`,
                animationDelay: `${m.delay}s`,
                animationDuration: `${m.duration}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/* 网格流动层 */}
      <div
        className="animate-grid-drift pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(var(--arena-grid-flow) 1px, transparent 1px), linear-gradient(90deg, var(--arena-grid-flow) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
        aria-hidden
      />

      {/* 字母敌人：下一个待输入字母高亮 */}
      {enemies.map((e) => (
        <LetterEnemyCard key={e.id} enemy={e} isNext={e.index === typed} onDeathEnd={onDeathEnd} />
      ))}

      {/* 飘字层 */}
      <FloatingTextLayer floats={floats} onFloatEnd={onFloatEnd} />

      {/* 底部防线：脉冲青色光带 */}
      <div
        className="animate-defense-pulse pointer-events-none absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_16px_rgba(34,211,238,0.9)]"
        style={{ top: `${GAME_DEFENSE_LINE}%` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-0 right-0 bottom-0 bg-gradient-to-t from-cyan-500/15 to-transparent"
        style={{ top: `${GAME_DEFENSE_LINE}%` }}
        aria-hidden
      />

      {/* 单词信息：音标 + 中文 + 输入进度（底部一行醒目展示） */}
      {word && (
        <div className="pointer-events-none absolute inset-x-0 bottom-1 z-20 flex justify-center px-2">
          <div className="flex items-baseline gap-2 md:gap-3 rounded-full bg-white/85 border border-cyan-300 px-4 md:px-5 py-1 md:py-1.5 shadow-[0_0_18px_rgba(34,211,238,0.2)] backdrop-blur-sm dark:bg-slate-950/75 dark:border-cyan-800/60">
            {word.phonetic && (
              <span className="font-mono text-xs md:text-sm text-slate-500 dark:text-slate-400">{word.phonetic}</span>
            )}
            <span className="text-base md:text-xl font-bold text-slate-900 dark:text-slate-100">
              {word.meaning}
            </span>
            <span className="font-mono text-sm md:text-base tracking-[0.25em]">
              <span className="text-emerald-600 dark:text-emerald-400">
                {word.text.slice(0, typed)}
              </span>
              <span className="text-slate-400 dark:text-slate-500">{word.text.slice(typed)}</span>
            </span>
          </div>
        </div>
      )}

      {/* 覆盖层插槽 */}
      {children}
    </div>
  );
});
