'use client';

// 飘字特效：+XP / +ENERGY / HEADSHOT / -HP，key 驱动自动消散
import { memo, useEffect } from 'react';
import type { FloatingText } from '@/lib/game';
import { cn } from '@/lib/utils';

const KIND_STYLES: Record<FloatingText['kind'], string> = {
  xp: 'text-amber-600 drop-shadow-[0_0_10px_rgba(217,119,6,0.5)] dark:text-amber-300 dark:drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]',
  energy: 'text-cyan-600 drop-shadow-[0_0_10px_rgba(8,145,178,0.5)] dark:text-cyan-300 dark:drop-shadow-[0_0_10px_rgba(34,211,238,0.9)]',
  headshot: 'text-yellow-600 text-2xl md:text-3xl font-extrabold italic drop-shadow-[0_0_16px_rgba(202,138,4,0.6)] dark:text-yellow-300 dark:drop-shadow-[0_0_16px_rgba(253,224,71,1)]',
  damage: 'text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)] dark:text-red-400 dark:drop-shadow-[0_0_10px_rgba(248,113,113,0.9)]',
};

interface FloatingTextLayerProps {
  floats: FloatingText[];
  onFloatEnd: (id: number) => void;
}

function FloatItem({ float, onEnd }: { float: FloatingText; onEnd: (id: number) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onEnd(float.id), 950);
    return () => clearTimeout(t);
  }, [float.id, onEnd]);

  return (
    <div
      className={cn(
        'pointer-events-none absolute z-20 animate-float-up font-mono text-sm md:text-base font-bold whitespace-nowrap',
        KIND_STYLES[float.kind]
      )}
      style={{ left: `${float.x}%`, top: `${float.y}%` }}
    >
      {float.text}
    </div>
  );
}

export const FloatingTextLayer = memo(function FloatingTextLayer({
  floats,
  onFloatEnd,
}: FloatingTextLayerProps) {
  return (
    <>
      {floats.map((f) => (
        <FloatItem key={f.id} float={f} onEnd={onFloatEnd} />
      ))}
    </>
  );
});
