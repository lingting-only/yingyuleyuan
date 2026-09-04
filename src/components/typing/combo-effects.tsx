'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// ===== 里程碑数据 =====

const COMBO_MILESTONES: Record<number, { text: string; color: string; mascot: string; flame: number }> = {
  3:  { text: '3 连斩!',      color: '#10b981', mascot: '不错哦!',  flame: 1 },
  5:  { text: '5 行云流水!',  color: '#0ea5e9', mascot: '好厉害!',  flame: 2 },
  10: { text: '10 势如破竹!', color: '#f97316', mascot: '太强了!',  flame: 3 },
  20: { text: '20 完美连击!', color: '#fbbf24', mascot: '你是天才!', flame: 4 },
  50: { text: '50 神之手!',   color: '#a855f7', mascot: '封神啦!',  flame: 5 },
};

const MILESTONE_THRESHOLDS = [50, 20, 10, 5, 3];

// 取最近达成的里程碑（向下取整）
export function getComboMilestone(combo: number) {
  const hit = MILESTONE_THRESHOLDS.find((t) => combo >= t);
  return hit ? { threshold: hit, ...COMBO_MILESTONES[hit] } : null;
}

// ===== emoji 飞溅规模 =====
const EMOJI_POOLS = {
  small: ['⭐', '✨', '💫'],
  mid:   ['🎉', '⭐', '✨', '💫', '🎊'],
  big:   ['🎉', '⭐', '✨', '💫', '🎊', '👏', '👍', '🎯'],
  huge:  ['🎉', '⭐', '✨', '💫', '🎊', '👏', '👍', '🎯', '💯', '🔥', '🏆'],
};

function getEmojiBatch(combo: number): { count: number; emojis: string[] } {
  if (combo >= 50) return { count: 18, emojis: EMOJI_POOLS.huge };
  if (combo >= 10) return { count: 12, emojis: EMOJI_POOLS.big };
  if (combo >= 3)  return { count: 8,  emojis: EMOJI_POOLS.mid };
  return { count: 5, emojis: EMOJI_POOLS.small };
}

// ===== 1) ComboBanner：浮动连斩文字 =====

export function ComboBanner({ combo, triggerKey }: { combo: number; triggerKey: number }) {
  if (triggerKey === 0) return null;
  const m = getComboMilestone(combo);
  if (!m) return null;
  return (
    <div
      key={`banner-${triggerKey}`}
      className="animate-combo-banner pointer-events-none fixed left-1/2 top-1/2 z-55 text-5xl md:text-7xl font-extrabold drop-shadow-lg"
      style={{ color: m.color, textShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
    >
      {m.text}
    </div>
  );
}

// ===== 2) ScreenFlash：屏幕金光一闪 =====

export function ScreenFlash({ triggerKey }: { triggerKey: number }) {
  if (triggerKey === 0) return null;
  return (
    <div
      key={`flash-${triggerKey}`}
      className="animate-screen-flash pointer-events-none fixed inset-0 z-40 bg-gradient-to-b from-amber-300/50 to-amber-200/20"
      aria-hidden
    />
  );
}

// ===== 3) ConfettiBurst：彩带 canvas 洒落 =====

type ConfettiParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  rotation: number;
  vr: number;
  square: boolean;
};

const CONFETTI_COLORS = ['#0ea5e9', '#10b981', '#f97316', '#fbbf24', '#a855f7', '#ffffff', '#ec4899'];

export function ConfettiBurst({ combo, triggerKey }: { combo: number; triggerKey: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (triggerKey === 0 || combo < 20) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = combo >= 50 ? 180 : 110;
    const particles: ConfettiParticle[] = Array.from({ length: count }, () => {
      const x = Math.random() * w;
      return {
        x,
        y: -10 - Math.random() * 30,
        vx: (Math.random() - 0.5) * 3,
        vy: 3 + Math.random() * 4,
        size: 3 + Math.random() * 4,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        life: 0,
        maxLife: 80 + Math.random() * 40,
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        square: Math.random() > 0.5,
      };
    });

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      let alive = false;
      for (const p of particles) {
        if (p.life >= p.maxLife) continue;
        alive = true;
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.vx *= 0.99;
        p.rotation += p.vr;
        const t = p.life / p.maxLife;
        const alpha = 1 - t;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        if (p.square) {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (alive) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [triggerKey, combo]);

  if (triggerKey === 0 || combo < 20) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-45 h-screen w-screen"
      aria-hidden
    />
  );
}

// ===== 4) EmojiBurst：emoji 庆祝飞溅 =====

interface EmojiItem {
  id: number;
  emoji: string;
  tx: number; // CSS var
  ty: number;
  rot: number;
  key: string;
}

export function EmojiBurst({
  combo,
  triggerKey,
  center,
}: {
  combo: number;
  triggerKey: number;
  center: { x: number; y: number } | null;
}) {
  const [items, setItems] = useState<EmojiItem[]>([]);

  // 使用 useEffect 在渲染外生成随机数据，避免 React purity 规则报错
  useEffect(() => {
    if (triggerKey === 0 || !center) {
      setItems([]);
      return;
    }
    const { count, emojis } = getEmojiBatch(combo);
    const generated: EmojiItem[] = Array.from({ length: count }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 60 + Math.random() * 120;
      return {
        id: i,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        tx: Math.cos(angle) * radius,
        ty: Math.sin(angle) * radius - 20,
        rot: (Math.random() - 0.5) * 360,
        key: `${triggerKey}-${i}`,
      };
    });
    setItems(generated);
    // triggerKey 变化时重新生成
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey, combo]);

  if (items.length === 0 || !center) return null;

  return (
    <>
      {items.map((it) => (
        <span
          key={it.key}
          className="pointer-events-none fixed z-48 text-2xl md:text-3xl animate-emoji-fly select-none"
          style={{
            left: center!.x,
            top: center!.y,
            '--tx': `${it.tx}px`,
            '--ty': `${it.ty}px`,
            '--rot': `${it.rot}deg`,
          } as React.CSSProperties}
          aria-hidden
        >
          {it.emoji}
        </span>
      ))}
    </>
  );
}

// ===== 5) ComboHud：火焰数字 HUD（键盘左侧 absolute 定位）=====

export const ComboHud = memo(function ComboHud({ combo }: { combo: number }) {
  const m = getComboMilestone(combo);
  const flameCount = m ? m.flame : 0;
  const comboKey = combo; // 用于 hud-pop 触发

  return (
    <div className="hidden md:block absolute left-[-200px] top-1/2 -translate-y-1/2 z-20 pointer-events-none">
      <div className="flex flex-col items-center gap-1 select-none">
        {/* 火焰 */}
        <div className="flex gap-0.5">
          {Array.from({ length: flameCount }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'text-xl leading-none',
                flameCount >= 3 && 'animate-flame-flicker'
              )}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              🔥
            </span>
          ))}
        </div>
        {/* 数字 */}
        <div
          key={comboKey} 
          className={cn(
            'animate-hud-pop text-xl font-extrabold w-30 text-center rounded-lg py-1',
            combo === 0
              ? 'text-muted-foreground/50 bg-muted/50'
              : combo >= 50
                ? 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400'
                : combo >= 20
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                  : 'bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400'
          )}
        >
          {`${combo} ${combo >= 1 && 'x连击' || ''}`}
        </div>
      </div>
    </div>
  );
});

// ===== 6) Mascot：吉祥物 + 鼓励气泡（键盘右侧 absolute 定位）=====

export const Mascot = memo(function Mascot({
  combo,
  triggerKey,
  errorTriggerKey,
}: {
  combo: number;
  triggerKey: number;
  errorTriggerKey: number;
}) {
  const [expression, setExpression] = useState<'happy' | 'excited' | 'sad'>('happy');
  const [bubble, setBubble] = useState<string | null>(null);
  const lastTriggerRef = useRef(0);
  const lastErrorRef = useRef(0);

  // 里程碑达成 → excited + 台词气泡
  useEffect(() => {
    if (triggerKey === 0 || triggerKey === lastTriggerRef.current) return;
    lastTriggerRef.current = triggerKey;
    const m = getComboMilestone(combo);
    if (!m) return;
    setExpression('excited');
    setBubble(m.mascot);
    const t1 = setTimeout(() => {
      setBubble(null);
      setExpression('happy');
    }, 1600);
    return () => clearTimeout(t1);
  }, [triggerKey, combo]);

  // 错误 → sad + 抖动
  useEffect(() => {
    if (errorTriggerKey === 0 || errorTriggerKey === lastErrorRef.current) return;
    lastErrorRef.current = errorTriggerKey;
    setExpression('sad');
    const t1 = setTimeout(() => setExpression('happy'), 800);
    return () => clearTimeout(t1);
  }, [errorTriggerKey]);

  return (
    <div className="hidden md:flex absolute right-[-128px] top-1/2 -translate-y-1/2 z-20 pointer-events-none flex-col items-end gap-1 select-none">
      {bubble && (
        <div className="animate-mascot-bubble bg-white/90 border border-sky-200 rounded-2xl px-3 py-1.5 text-sm font-bold text-sky-600 shadow-md whitespace-nowrap">
          {bubble}
        </div>
      )}
      <div
        className={cn(
          'text-5xl',
          'animate-flame-flicker',
          expression === 'excited' && 'animate-mascot-bounce',
          expression === 'sad' && 'animate-mascot-sad'
        )}
      >
        {expression === 'happy' ? '😊' : expression === 'excited' ? '🤩' : '😖'}
      </div>
    </div>
  );
});

// ===== 7) ErrorCrack：错误红色裂纹闪现 =====

export function ErrorCrack({ triggerKey }: { triggerKey: number }) {
  if (triggerKey === 0) return null;
  return (
    <div
      key={`crack-${triggerKey}`}
      className="animate-crack-flash pointer-events-none fixed inset-0 z-40"
      style={{
        background: 'radial-gradient(circle at 50% 50%, rgba(239,68,68,0.35) 0%, transparent 60%)',
      }}
      aria-hidden
    />
  );
}
