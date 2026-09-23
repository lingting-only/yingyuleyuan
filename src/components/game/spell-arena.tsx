'use client';

// 拼写字战场容器：拼写模式专用，敌人显示中文意思，用户靠记忆输入英文
import { memo, useEffect, useState, useRef, type CSSProperties } from 'react';
import type { SpellEnemy } from '@/lib/game';
import { GAME_DEFENSE_LINE } from '@/lib/game';
import { cn } from '@/lib/utils';
import { ParticleBurst } from '@/components/typing/particle-burst';

interface Star {
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
}

interface Meteor {
  left: number;
  top: number;
  angle: number;
  dist: number;
  delay: number;
  duration: number;
}

interface SpellArenaProps {
  enemy: SpellEnemy | null;
  inputValue: string;
  isError: boolean;
  shakeKey: number;
  hitKey: number; // 每次正确击中时递增，触发攻击特效
  burstKey: number; // 击杀时递增，触发粒子消散
  onDeathEnd: () => void;
  children?: React.ReactNode;
}

// 敌人死亡动画持续时间（ms）
const DEATH_DURATION = 700;

export const SpellArena = memo(function SpellArena({
  enemy,
  inputValue,
  isError,
  shakeKey,
  hitKey,
  burstKey,
  onDeathEnd,
  children,
}: SpellArenaProps) {
  const [stars, setStars] = useState<Star[]>([]);
  const [meteors, setMeteors] = useState<Meteor[]>([]);
  const [isDying, setIsDying] = useState(false);
  const [showHit, setShowHit] = useState(false);
  const arenaRef = useRef<HTMLDivElement>(null);
  const [burstCenter, setBurstCenter] = useState<{ x: number; y: number } | null>(null);
  const prevBurstKey = useRef(0);

  // 星空/流星仅初始化一次
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

  // 监听敌人 dying 状态变化，播放切割死亡动画（视觉由 CSS animation 驱动）
  useEffect(() => {
    if (enemy?.dying && !isDying) {
      setIsDying(true);
      const timer = setTimeout(() => {
        setIsDying(false);
        onDeathEnd();
      }, DEATH_DURATION);
      return () => clearTimeout(timer);
    }
    if (!enemy?.dying) {
      setIsDying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enemy?.dying]);

  // 监听 hitKey 变化，触发击中特效
  useEffect(() => {
    if (hitKey > 0) {
      setShowHit(true);
      const timer = setTimeout(() => setShowHit(false), 200);
      return () => clearTimeout(timer);
    }
  }, [hitKey]);

  // 监听 burstKey 变化，触发死亡粒子消散
  useEffect(() => {
    if (burstKey > 0 && burstKey !== prevBurstKey.current) {
      prevBurstKey.current = burstKey;
      // 计算敌人在屏幕上的绝对坐标
      if (arenaRef.current && enemy) {
        const rect = arenaRef.current.getBoundingClientRect();
        const x = rect.left + (enemy.x / 100) * rect.width;
        const y = rect.top + (enemy.y / 100) * rect.height;
        setBurstCenter({ x, y });
      }
    }
  }, [burstKey, enemy]);

  // 敌人是否晃动（输入错误时）
  const shakeClass = enemy?.shake ? 'animate-word-shake' : '';

  // 敌人主体内容（中文意思 + 音标），供正常态与切割两半复用
  const bodyContent = (
    <>
      <div className={cn(
        'relative text-3xl md:text-4xl font-bold text-transparent bg-clip-text',
        showHit
          ? 'bg-gradient-to-r from-red-300 via-orange-300 to-red-300'
          : 'bg-gradient-to-r from-emerald-200 via-cyan-200 to-teal-200',
        'drop-shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all duration-100'
      )}>
        {enemy?.meaning}
      </div>
      {enemy?.phonetic && (
        <div className="relative mt-1 text-center text-sm font-mono text-cyan-400/80 dark:text-cyan-300/70">
          {enemy.phonetic}
        </div>
      )}
    </>
  );

  return (
    <div
      ref={arenaRef}
      key={shakeKey}
      className={cn(
        'relative w-full max-w-4xl flex-1 min-h-0 overflow-hidden rounded-2xl border border-emerald-200 dark:border-emerald-900/60',
        'bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-[#030016] dark:via-[#071a0a] dark:to-[#0a1628]',
        shakeKey > 0 && 'animate-shake-screen'
      )}
      style={{
        backgroundImage:
          'linear-gradient(var(--arena-grid) 1px, transparent 1px), linear-gradient(90deg, var(--arena-grid) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    >
      {/* 星云光斑 - 绿色主题 */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute -top-16 -left-16 w-80 h-80 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15), transparent 70%)' }}
        />
        <div
          className="absolute -bottom-24 -right-16 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.1), transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)' }}
        />
      </div>

      {/* 星空闪烁 */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {stars.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-emerald-300/60 dark:bg-white animate-star-twinkle"
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

      {/* 流星划过 */}
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

      {/* 单词敌人 - 拼写模式：显示中文意思 + 音标 */}
      {enemy && (
        <div
          className={cn(
            'absolute flex flex-col items-center transition-transform duration-200',
            shakeClass,
            !isDying && 'animate-word-float'
          )}
          style={{
            left: `${enemy.x}%`,
            top: `${enemy.y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
          }}
        >
          {/* 血条（每个字母一格），死亡时淡出 */}
          <div className={cn('mb-2 flex gap-1 transition-opacity duration-200', isDying && 'opacity-0')}>
            {Array.from({ length: enemy.maxHp }, (_, i) => (
              <div
                key={i}
                className={cn(
                  'h-2 w-4 rounded-sm transition-all duration-150',
                  i < enemy.hp
                    ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                    : 'bg-slate-700/50 dark:bg-slate-800/50'
                )}
              />
            ))}
          </div>

          {/* 敌人主体：大号中文意思 */}
          <div
            className={cn(
              'relative px-8 py-5 rounded-2xl transition-all duration-150',
              // 背景 / 边框 / 阴影仅正常态显示，死亡时由切割两半接管
              !isDying && 'bg-gradient-to-br from-emerald-900/90 via-teal-900/90 to-cyan-900/90 backdrop-blur-sm border-2',
              !isDying && (
                showHit
                  ? 'border-red-400 shadow-[0_0_40px_rgba(248,113,113,0.8)] scale-105'
                  : 'border-emerald-400/60 shadow-[0_0_30px_rgba(16,185,129,0.5),0_0_60px_rgba(16,185,129,0.25)] dark:shadow-[0_0_30px_rgba(16,185,129,0.6),0_0_60px_rgba(16,185,129,0.35)]'
              )
            )}
          >
            {/* 内发光（仅正常态） */}
            {!isDying && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10" />
            )}

            {/* 击中闪光 */}
            {showHit && !isDying && (
              <div className="absolute inset-0 rounded-2xl bg-white/30" />
            )}

            {/* 正常态内容（死亡时隐藏，由切割两半替代） */}
            {!isDying && bodyContent}

            {/* 切割特效：上半片 + 下半片 + 刀光 */}
            {isDying && (
              <>
                {/* 左上片：沿斜线向左上分离后消散 */}
                <div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-900/90 via-teal-900/90 to-cyan-900/90 backdrop-blur-sm"
                  style={{
                    clipPath: 'polygon(0 0, 100% 0, 0 100%)',
                    animation: 'spell-slash-top 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
                  }}
                >
                  <div className="w-full h-full flex flex-col items-center justify-center px-8 py-5">
                    {bodyContent}
                  </div>
                </div>
                {/* 右下片：沿斜线向右下分离后消散 */}
                <div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-900/90 via-teal-900/90 to-cyan-900/90 backdrop-blur-sm"
                  style={{
                    clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                    animation: 'spell-slash-bottom 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
                  }}
                >
                  <div className="w-full h-full flex flex-col items-center justify-center px-8 py-5">
                    {bodyContent}
                  </div>
                </div>
                {/* 切割刀光：斜向光刃快速划过 */}
                <div
                  className="absolute left-1/2 top-1/2 pointer-events-none"
                  style={{
                    width: '180%',
                    height: '4px',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,1), transparent)',
                    boxShadow: '0 0 22px rgba(255,255,255,1), 0 0 48px rgba(16,185,129,0.85)',
                    animation: 'spell-slash-line 0.35s ease-out forwards',
                  }}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* 底部防线 */}
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

      {/* 输入进度显示 */}
      {enemy && (
        <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center px-4">
          <div
            className={cn(
              'flex items-center gap-1 rounded-full px-5 py-3 backdrop-blur-sm transition-all duration-200',
              'border-2',
              isError
                ? 'bg-red-500/20 border-red-400 animate-input-shake'
                : 'bg-white/90 dark:bg-slate-950/80 border-emerald-300 dark:border-emerald-800/60'
            )}
          >
            <span className="font-mono text-xl md:text-2xl tracking-widest font-bold">
              {Array.from({ length: enemy.word.length }).map((_, i) => {
                const typed = inputValue[i] ?? '';
                return (
                  <span
                    key={i}
                    className={cn(
                      'transition-colors duration-100',
                      typed ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'
                    )}
                  >
                    {typed || '_'}
                  </span>
                );
              })}
            </span>
          </div>
        </div>
      )}

      {/* 覆盖层插槽 */}
      {children}

      {/* 击杀粒子消散 */}
      {burstKey > 0 && (
        <ParticleBurst
          burstKey={burstKey}
          center={burstCenter}
          onFinish={() => setBurstCenter(null)}
        />
      )}
    </div>
  );
});
