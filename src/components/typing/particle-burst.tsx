'use client';

import { useEffect, useRef } from 'react';

type Particle = {
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

// 打字成功后的粒子消散特效：从句子中心位置向外炸开、飘散并淡出
export function ParticleBurst({
  burstKey,
  center,
  onFinish,
}: {
  burstKey: number;
  center: { x: number; y: number } | null;
  onFinish?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onFinishRef = useRef(onFinish);
  // eslint-disable-next-line react-hooks/refs
  onFinishRef.current = onFinish;

  useEffect(() => {
    if (burstKey === 0 || !center) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    // 以 canvas 自身的实际位置/尺寸为参照，把视口坐标换算成 canvas 内部坐标，
    // 避免 fixed 定位包含块偏移（侧边栏/顶栏布局）导致爆发中心错位
    const cRect = canvas.getBoundingClientRect();
    const scaleX = (cRect.width / canvas.clientWidth) || 1;
    const scaleY = (cRect.height / canvas.clientHeight) || 1;
    const originX = (center.x - cRect.left) / scaleX;
    const originY = (center.y - cRect.top) / scaleY;
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 主题色系粒子：海洋青 / 薄荷绿 / 珊瑚橙 / 白色高光
    const colors = ['#0ea5e9', '#38bdf8', '#10b981', '#f97316', '#fbbf24', '#ffffff'];

    // 从句子中心点向四周 360° 放射
    const count = 130;
    const particles: Particle[] = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 7.5;
      const jitter = Math.random() * 8; // 起点轻微抖动，避免完全重叠
      return {
        x: originX + Math.cos(angle) * jitter,
        y: originY + Math.sin(angle) * jitter,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5, // 稍向上飘
        size: 2 + Math.random() * 3.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: 40 + Math.random() * 25, // 约 0.55s ~ 1.1s，避免过长尾等待
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.25,
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
        p.vy += 0.12; // 重力
        p.vx *= 0.985; // 空气阻力
        p.vy *= 0.985;
        p.rotation += p.vr;
        const t = p.life / p.maxLife;
        const alpha = 1 - t;
        // 消散过程中同步缩小，让视觉消失时间接近实际结束时间
        const shrink = 1 - t * 0.6;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        if (p.square) {
          ctx.rotate(p.rotation);
          ctx.fillRect((-p.size * shrink) / 2, (-p.size * shrink) / 2, p.size * shrink, p.size * shrink);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, (p.size * shrink) / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (alive) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, w, h);
        // 粒子全部消散完毕，通知外部（如再弹出完成卡片）
        onFinishRef.current?.();
      }
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [burstKey, center]);

  // 覆盖全屏但不拦截任何交互
  // 注意：canvas 是替换元素，inset-0 不会拉伸它，必须显式指定 CSS 尺寸
  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 h-screen w-screen"
      aria-hidden
    />
  );
}
