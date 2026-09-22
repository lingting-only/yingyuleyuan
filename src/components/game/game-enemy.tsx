'use client';

// 字母敌人：霓虹发光卡片携带单个字母；下一个待输入字母高亮呼吸，
// 输错时晃动，被子弹命中后字母碎裂成粒子消散
import { memo, useEffect, useState, type CSSProperties } from 'react';
import type { LetterEnemy } from '@/lib/game';
import { cn } from '@/lib/utils';

interface LetterEnemyCardProps {
  enemy: LetterEnemy;
  isNext: boolean; // 是否为当前待输入字母
  onDeathEnd: (id: number) => void;
}

// 死亡粒子：8 个方向，带轻微距离差，营造碎裂飞散
const DEATH_PARTICLES = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2;
  const dist = 18 + (i % 3) * 7;
  return {
    dx: Math.cos(angle) * dist,
    dy: Math.sin(angle) * dist,
  };
});

export const LetterEnemyCard = memo(function LetterEnemyCard({
  enemy,
  isNext,
  onDeathEnd,
}: LetterEnemyCardProps) {
  // 输错晃动：enemy.shake 自增时触发一次左右抖动
  const [shaking, setShaking] = useState(false);
  useEffect(() => {
    if (enemy.shake <= 0) return;
    setShaking(true);
    const t = setTimeout(() => setShaking(false), 400);
    return () => clearTimeout(t);
  }, [enemy.shake]);

  // 死亡动画结束后通知引擎移除实体（与子弹到达回调幂等共存）
  useEffect(() => {
    if (!enemy.dying) return;
    const t = setTimeout(() => onDeathEnd(enemy.id), 320);
    return () => clearTimeout(t);
  }, [enemy.dying, enemy.id, onDeathEnd]);

  return (
    <div
      className={cn(
        'pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center',
        'w-9 h-9 md:w-11 md:h-11 rounded-xl border backdrop-blur-sm font-mono text-lg md:text-xl font-extrabold',
        enemy.dying
          ? 'animate-enemy-die border-amber-500 bg-amber-100/90 text-amber-600 dark:border-amber-400 dark:bg-amber-950/60 dark:text-amber-300'
          : enemy.hit
            ? 'animate-enemy-locked border-amber-500 bg-amber-50 text-amber-700 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)] dark:border-amber-300 dark:bg-amber-900/60 dark:text-amber-100 dark:drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]'
            : isNext
              ? 'animate-enemy-locked border-cyan-500 bg-cyan-50 text-cyan-700 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] dark:border-cyan-400 dark:bg-cyan-950/60 dark:text-cyan-200 dark:drop-shadow-[0_0_10px_rgba(34,211,238,0.9)]'
              : 'animate-enemy-glow border-purple-400 bg-white/90 text-purple-700 dark:border-purple-500/70 dark:bg-[#0d1226]/90 dark:text-purple-300'
      )}
      style={{
        left: `${enemy.x}%`,
        top: `${enemy.y}%`,
        // 晃动动画用内联覆盖，避免与呼吸发光动画的 animation 冲突
        ...(shaking && !enemy.dying ? { animation: 'enemy-shake 0.4s ease-in-out' } : {}),
      }}
    >
      {enemy.char}

      {/* 死亡粒子消散 */}
      {enemy.dying && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          {DEATH_PARTICLES.map((p, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full animate-enemy-particle"
              style={
                {
                  backgroundColor: 'currentColor',
                  '--dx': `${p.dx}px`,
                  '--dy': `${p.dy}px`,
                  animationDelay: `${i * 0.015}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}
    </div>
  );
});
