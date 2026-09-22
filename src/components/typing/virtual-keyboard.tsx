'use client';

import { memo, useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { fingerColors, type FingerType } from '@/lib/data';

interface KeyDef {
  key: string;
  label: string;
  finger: FingerType;
  width?: number; // in units
}

const keyboardRows: KeyDef[][] = [
  [
    { key: '`', label: '`', finger: 'left-pinky' },
    { key: '1', label: '1', finger: 'left-pinky' },
    { key: '2', label: '2', finger: 'left-ring' },
    { key: '3', label: '3', finger: 'left-middle' },
    { key: '4', label: '4', finger: 'left-index' },
    { key: '5', label: '5', finger: 'left-index' },
    { key: '6', label: '6', finger: 'right-index' },
    { key: '7', label: '7', finger: 'right-index' },
    { key: '8', label: '8', finger: 'right-middle' },
    { key: '9', label: '9', finger: 'right-ring' },
    { key: '0', label: '0', finger: 'right-pinky' },
    { key: '-', label: '-', finger: 'right-pinky' },
    { key: '=', label: '=', finger: 'right-pinky' },
    { key: 'Backspace', label: '⌫', finger: 'right-pinky', width: 2 },
  ],
  [
    { key: 'Tab', label: 'Tab', finger: 'left-pinky', width: 1.5 },
    { key: 'q', label: 'Q', finger: 'left-pinky' },
    { key: 'w', label: 'W', finger: 'left-ring' },
    { key: 'e', label: 'E', finger: 'left-middle' },
    { key: 'r', label: 'R', finger: 'left-index' },
    { key: 't', label: 'T', finger: 'left-index' },
    { key: 'y', label: 'Y', finger: 'right-index' },
    { key: 'u', label: 'U', finger: 'right-index' },
    { key: 'i', label: 'I', finger: 'right-middle' },
    { key: 'o', label: 'O', finger: 'right-ring' },
    { key: 'p', label: 'P', finger: 'right-pinky' },
    { key: '[', label: '[', finger: 'right-pinky' },
    { key: ']', label: ']', finger: 'right-pinky' },
    { key: '\\', label: '\\', finger: 'right-pinky', width: 1.5 },
  ],
  [
    { key: 'CapsLock', label: 'Caps', finger: 'left-pinky', width: 1.8 },
    { key: 'a', label: 'A', finger: 'left-pinky' },
    { key: 's', label: 'S', finger: 'left-ring' },
    { key: 'd', label: 'D', finger: 'left-middle' },
    { key: 'f', label: 'F', finger: 'left-index' },
    { key: 'g', label: 'G', finger: 'left-index' },
    { key: 'h', label: 'H', finger: 'right-index' },
    { key: 'j', label: 'J', finger: 'right-index' },
    { key: 'k', label: 'K', finger: 'right-middle' },
    { key: 'l', label: 'L', finger: 'right-ring' },
    { key: ';', label: ';', finger: 'right-pinky' },
    { key: "'", label: "'", finger: 'right-pinky' },
    { key: 'Enter', label: 'Enter', finger: 'right-pinky', width: 2.2 },
  ],
  [
    { key: 'Shift', label: 'Shift', finger: 'left-pinky', width: 2.4 },
    { key: 'z', label: 'Z', finger: 'left-pinky' },
    { key: 'x', label: 'X', finger: 'left-ring' },
    { key: 'c', label: 'C', finger: 'left-middle' },
    { key: 'v', label: 'V', finger: 'left-index' },
    { key: 'b', label: 'B', finger: 'left-index' },
    { key: 'n', label: 'N', finger: 'right-index' },
    { key: 'm', label: 'M', finger: 'right-index' },
    { key: ',', label: ',', finger: 'right-middle' },
    { key: '.', label: '.', finger: 'right-ring' },
    { key: '/', label: '/', finger: 'right-pinky' },
    { key: 'ShiftR', label: 'Shift', finger: 'right-pinky', width: 2.6 },
  ],
  [
    { key: 'Space', label: 'Space', finger: 'thumb', width: 6.5 },
  ],
];

// Map keys to their hand SVG files - now includes both left and right hands
const keyToHandSvg: Record<string, { left: string; right: string }> = {
  // ========== 左手按键 ==========
  'a': { left: '/typing-hands/KeyA.svg', right: '/typing-hands/Right.svg' },
  's': { left: '/typing-hands/KeyS.svg', right: '/typing-hands/Right.svg' },
  'd': { left: '/typing-hands/KeyD.svg', right: '/typing-hands/Right.svg' },
  'f': { left: '/typing-hands/KeyF.svg', right: '/typing-hands/Right.svg' },
  'g': { left: '/typing-hands/KeyG.svg', right: '/typing-hands/Right.svg' },
  'q': { left: '/typing-hands/KeyQ.svg', right: '/typing-hands/Right.svg' },
  'w': { left: '/typing-hands/KeyW.svg', right: '/typing-hands/Right.svg' },
  'e': { left: '/typing-hands/KeyE.svg', right: '/typing-hands/Right.svg' },
  'r': { left: '/typing-hands/KeyR.svg', right: '/typing-hands/Right.svg' },
  't': { left: '/typing-hands/KeyT.svg', right: '/typing-hands/Right.svg' },
  'z': { left: '/typing-hands/KeyZ.svg', right: '/typing-hands/Right.svg' },
  'x': { left: '/typing-hands/KeyX.svg', right: '/typing-hands/Right.svg' },
  'c': { left: '/typing-hands/KeyC.svg', right: '/typing-hands/Right.svg' },
  'v': { left: '/typing-hands/KeyV.svg', right: '/typing-hands/Right.svg' },
  'b': { left: '/typing-hands/KeyB.svg', right: '/typing-hands/Right.svg' },

  // ========== 右手按键 ==========
  'h': { left: '/typing-hands/Left.svg', right: '/typing-hands/KeyH.svg' },
  'j': { left: '/typing-hands/Left.svg', right: '/typing-hands/KeyJ.svg' },
  'k': { left: '/typing-hands/Left.svg', right: '/typing-hands/KeyK.svg' },
  'l': { left: '/typing-hands/Left.svg', right: '/typing-hands/KeyL.svg' },
  'y': { left: '/typing-hands/Left.svg', right: '/typing-hands/KeyY.svg' },
  'u': { left: '/typing-hands/Left.svg', right: '/typing-hands/KeyU.svg' },
  'i': { left: '/typing-hands/Left.svg', right: '/typing-hands/KeyI.svg' },
  'o': { left: '/typing-hands/Left.svg', right: '/typing-hands/KeyO.svg' },
  'p': { left: '/typing-hands/Left.svg', right: '/typing-hands/KeyP.svg' },
  'n': { left: '/typing-hands/Left.svg', right: '/typing-hands/KeyN.svg' },
  'm': { left: '/typing-hands/Left.svg', right: '/typing-hands/KeyM.svg' },
};

// 新增常量
const BASE_Y = 120;
const ROW_OFFSET = 30;

// Determine which hand is active for a key
function getActiveHand(key: string): 'left' | 'right' | 'both' {
  const leftKeys = ['a', 's', 'd', 'f', 'g', 'q', 'w', 'e', 'r', 't', 'z', 'x', 'c', 'v', 'b'];
  const rightKeys = ['h', 'j', 'k', 'l', 'y', 'u', 'i', 'o', 'p', 'n', 'm', ',', '.', '/'];
  
  const keyLower = key.toLowerCase();
  if (leftKeys.includes(keyLower)) return 'left';
  if (rightKeys.includes(keyLower)) return 'right';
  return 'both';
}

interface VirtualKeyboardProps {
  nextKey: string;
  onKeyPress: (key: string) => void;
  showFingerGuide?: boolean;
  showFingerBars?: boolean; // 是否显示按键底部的指法色条（独立于手势图/图例）
  rippleKey?: number; // 连斩里程碑触发键盘波纹
  compact?: boolean; // 紧凑模式：整体缩小按键，用于游戏页等空间受限场景
}

export function VirtualKeyboard({
  nextKey,
  onKeyPress,
  showFingerGuide = true,
  showFingerBars,
  rippleKey,
  compact = false,
}: VirtualKeyboardProps) {
  // 色条默认跟随手势图开关，也可单独指定（如游戏页只显示色条不显示手势图）
  const barsOn = showFingerBars ?? showFingerGuide;
  const nextKeyLower = nextKey.toLowerCase();
  const isShift = nextKey !== nextKeyLower && /[A-Z!@#$%^&*()_+{}|:"<>?~]/.test(nextKey);
  const [leftHandSvg, setLeftHandSvg] = useState<string | null>(null);
  const [rightHandSvg, setRightHandSvg] = useState<string | null>(null);
  
  // 新增偏移state
  const [leftOffsetY, setLeftOffsetY] = useState<number>(0);
  const [rightOffsetY, setRightOffsetY] = useState<number>(0);

  // 预加载所有手部 SVG：挂载时一次性请求并缓存到浏览器，避免切换单词时重新加载导致闪烁
  const preloadedRef = useRef(false);
  useEffect(() => {
    if (preloadedRef.current) return;
    preloadedRef.current = true;
    const preload = (src: string) => {
      const img = new Image();
      img.src = src;
    };
    Object.values(keyToHandSvg).forEach(({ left, right }) => {
      preload(left);
      preload(right);
    });
  }, []);

  // Update hand SVGs when next key changes
  useEffect(() => {
    if (nextKey && keyToHandSvg[nextKeyLower]) {
      const handSvgs = keyToHandSvg[nextKeyLower];
      setLeftHandSvg(handSvgs.left);
      setRightHandSvg(handSvgs.right);
  
      const topRow = new Set(['q','w','e','r','t','y','u','i','o','p']);
      const bottomRow = new Set(['z','x','c','v','b','n','m',',','.','/']);
  
      const delta = topRow.has(nextKeyLower) ? -ROW_OFFSET : bottomRow.has(nextKeyLower) ? ROW_OFFSET : 0;
      const activeHand = getActiveHand(nextKeyLower);
  
      if (activeHand === 'left') {
        setLeftOffsetY(delta);
        setRightOffsetY(0);
      } else if (activeHand === 'right') {
        setRightOffsetY(delta);
        setLeftOffsetY(0);
      }
    } else {
      setLeftHandSvg(null);
      setRightHandSvg(null);
      setLeftOffsetY(0);
      setRightOffsetY(0);
    }
  }, [nextKey, nextKeyLower]);

  return (
    <div className={cn('w-full mx-auto', compact ? 'max-w-xl' : 'max-w-3xl')}>
      <div className={cn(
        'bg-gradient-to-b from-muted to-secondary rounded-2xl shadow-lg border border-border relative overflow-hidden',
        compact ? 'p-2 md:p-2.5' : 'p-3 md:p-4'
      )}>
        {/* Hand SVG Overlay - show both hands with fingertips at ASDF row */}
        {showFingerGuide && (
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{ padding: '0 20px' }}
          >
            {/* 删除 max‑w‑[600px]，直接100%继承键盘父容器尺寸，和键盘共用坐标系 */}
            <div className="relative w-full h-[260px]">
              {/* 左手：始终渲染，通过 opacity 淡入淡出，避免卸载导致的闪烁 */}
              <div
                className="absolute left-0 w-1/2 h-full flex justify-center"
                style={{
                  transform: `translateY(${BASE_Y + leftOffsetY}px)`,
                  transition: 'transform 0.2s ease-out, opacity 0.15s ease-out',
                  opacity: leftHandSvg ? 0.9 : 0,
                }}
              >
                <img
                  src={leftHandSvg ?? '/typing-hands/Left.svg'}
                  alt="Left hand position"
                  className="h-full max-w-full w-auto object-contain"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                />
              </div>
              {/* 右手：保留 translateX向左偏移，同样始终渲染 */}
              <div
                className="absolute right-0 w-1/2 h-full flex justify-center"
                style={{
                  transform: `translateY(${BASE_Y + rightOffsetY}px) translateX(-90px)`,
                  transition: 'transform 0.2s ease-out, opacity 0.15s ease-out',
                  opacity: rightHandSvg ? 0.9 : 0,
                }}
              >
                <img
                  src={rightHandSvg ?? '/typing-hands/Right.svg'}
                  alt="Right hand position"
                  className="h-full max-w-full w-auto object-contain"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                />
              </div>
            </div>
          </div>
        )}

        {keyboardRows.map((row, rowIndex) => (
          <div key={rowIndex} className={cn(
            'flex justify-center relative z-10',
            compact ? 'gap-0.5 md:gap-1 mb-0.5 md:mb-1' : 'gap-1 md:gap-1.5 mb-1 md:mb-1.5'
          )}>
            {row.map((keyDef) => {
              const isActive =
                keyDef.key.toLowerCase() === nextKeyLower ||
                (isShift && (keyDef.key === 'Shift' || keyDef.key === 'ShiftR'));
              const color = fingerColors[keyDef.finger];
              const width = keyDef.width || 1;

              return (
                <button
                  key={keyDef.key}
                  onClick={() => onKeyPress(keyDef.key)}
                  className={cn(
                    'relative flex items-center justify-center rounded-lg font-semibold transition-all duration-150 select-none',
                    compact
                      ? 'text-[10px] md:text-xs h-6 md:h-8'
                      : 'text-xs md:text-sm h-9 md:h-11',
                    'border-b-2 active:border-b-0 active:translate-y-0.5',
                    isActive
                      ? 'shadow-md scale-105 z-10'
                      : 'bg-card border-border text-foreground shadow-sm hover:bg-secondary'
                  )}
                  style={{
                    width: `${width * (compact ? 30 : 42)}px`,
                    minWidth: `${width * (compact ? 24 : 36)}px`,
                    // 高亮键直接使用所属手指的提示色（浅色系配深色文字保证可读）
                    ...(isActive
                      ? { backgroundColor: color, borderColor: color, color: '#1e293b' }
                      : {}),
                  }}
                >
                  {keyDef.label}
                  {barsOn && !isActive && (
                    <div
                      className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full opacity-60"
                      style={{ backgroundColor: color }}
                    />
                  )}
                  {isActive && barsOn && (
                    <div
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-1 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* 连斩里程碑键盘波纹 */}
        {(rippleKey ?? 0) > 0 && (
          <div
            key={`ripple-${rippleKey}`}
            className="pointer-events-none absolute left-1/2 top-1/2 z-40 w-40 h-40 rounded-full blur-md animate-keyboard-ripple"
            style={{
              background: 'radial-gradient(circle, rgba(14,165,233,0.5) 0%, rgba(14,165,233,0) 70%)',
            }}
            aria-hidden
          />
        )}
      </div>

      {/* Finger guide legend */}
      {showFingerGuide && (
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {Object.entries(fingerColors).map(([finger, color]) => (
            <div key={finger} className="flex items-center gap-1">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] text-muted-foreground">
                {finger === 'left-pinky' && '左小指'}
                {finger === 'left-ring' && '左无名指'}
                {finger === 'left-middle' && '左中指'}
                {finger === 'left-index' && '左食指'}
                {finger === 'right-index' && '右食指'}
                {finger === 'right-middle' && '右中指'}
                {finger === 'right-ring' && '右无名指'}
                {finger === 'right-pinky' && '右小指'}
                {finger === 'thumb' && '拇指'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(VirtualKeyboard);
