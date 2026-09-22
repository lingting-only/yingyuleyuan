'use client';

// 光波子弹层：正确按键时从键位飞向字母敌人，拖尾光波 + 字母弹头
import { memo, useEffect, useState } from 'react';

export interface Bullet {
  id: number; // 与敌人 id 一致
  char: string;
  fromX: number; // 视口坐标（键位中心）
  fromY: number;
  toX: number; // 视口坐标（敌人中心）
  toY: number;
}

interface BulletLayerProps {
  bullets: Bullet[];
  onArrive: (id: number) => void;
}

const FLIGHT_MS = 220;

function BulletItem({ bullet, onArrive }: { bullet: Bullet; onArrive: (id: number) => void }) {
  const [go, setGo] = useState(false);

  // 双 rAF 确保初始帧渲染后再启动过渡动画
  useEffect(() => {
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setGo(true)));
    return () => cancelAnimationFrame(r);
  }, []);

  // 兜底：过渡未触发时按飞行时长强制到达
  useEffect(() => {
    const t = setTimeout(() => onArrive(bullet.id), FLIGHT_MS + 120);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dx = bullet.toX - bullet.fromX;
  const dy = bullet.toY - bullet.fromY;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  return (
    <div
      className="pointer-events-none fixed z-40"
      style={{
        left: bullet.fromX,
        top: bullet.fromY,
        transform: go ? `translate(${dx}px, ${dy}px)` : 'translate(0px, 0px)',
        transition: `transform ${FLIGHT_MS}ms cubic-bezier(.4,0,.8,.4)`,
      }}
      onTransitionEnd={() => onArrive(bullet.id)}
    >
      {/* 弹体朝向飞行方向：拖尾光波 + 字母弹头 */}
      <div
        className="flex items-center"
        style={{ transform: `translateY(-50%) rotate(${angle}deg)`, transformOrigin: '0 50%' }}
      >
        <div className="h-1.5 w-10 md:w-14 rounded-full bg-gradient-to-r from-transparent via-cyan-400/60 to-cyan-300 blur-[1px]" />
        <div className="-ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-300 font-mono text-sm font-extrabold uppercase text-[#070b18] shadow-[0_0_12px_rgba(34,211,238,0.95),0_0_30px_rgba(34,211,238,0.6)]">
          {bullet.char}
        </div>
      </div>
    </div>
  );
}

export const BulletLayer = memo(function BulletLayer({ bullets, onArrive }: BulletLayerProps) {
  return (
    <>
      {bullets.map((b) => (
        <BulletItem key={b.id} bullet={b} onArrive={onArrive} />
      ))}
    </>
  );
});
