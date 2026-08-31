'use client';

import { useState, useEffect } from 'react';
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
  'b': { left: '/typing-hands/keyB.svg', right: '/typing-hands/Right.svg' },

  // ========== 右手按键 ==========
  'h': { left: '/typing-hands/Left.svg', right: '/typing-hands/KeyH.svg' },
  'j': { left: '/typing-hands/Left.svg', right: '/typing-hands/KeyJ.svg' },
  'k': { left: '/typing-hands/Left.svg', right: '/typing-hands/keyK.svg' },
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
  typedText: string;
  targetText: string;
  onKeyPress: (key: string) => void;
  showFingerGuide?: boolean;
}

export function VirtualKeyboard({
  nextKey,
  typedText,
  targetText,
  onKeyPress,
  showFingerGuide = true,
}: VirtualKeyboardProps) {
  const nextKeyLower = nextKey.toLowerCase();
  const isShift = nextKey !== nextKeyLower && /[A-Z!@#$%^&*()_+{}|:"<>?~]/.test(nextKey);
  const [leftHandSvg, setLeftHandSvg] = useState<string | null>(null);
  const [rightHandSvg, setRightHandSvg] = useState<string | null>(null);
  
  // 新增偏移state
  const [leftOffsetY, setLeftOffsetY] = useState<number>(0);
  const [rightOffsetY, setRightOffsetY] = useState<number>(0);

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
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-gradient-to-b from-slate-100 to-slate-200 rounded-2xl p-3 md:p-4 shadow-lg border border-slate-200 relative overflow-hidden">
        {/* Hand SVG Overlay - show both hands with fingertips at ASDF row */}
        {showFingerGuide && (leftHandSvg || rightHandSvg) && (
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              opacity: 0.9,
              padding: '0 20px',
            }}
          >
            {/* 删除 max‑w‑[600px]，直接100%继承键盘父容器尺寸，和键盘共用坐标系 */}
            <div className="relative w-full h-[260px]">
              {/* 左手 */}
              {leftHandSvg && (
                <div
                  className="absolute left-0 w-1/2 h-full flex justify-center"
                  style={{
                    transform: `translateY(${BASE_Y + leftOffsetY}px)`,
                    transition: 'transform 0.2s ease-out',
                  }}
                >
                  <img
                    src={leftHandSvg}
                    alt="Left hand position"
                    className="h-full max-w-full w-auto object-contain"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                  />
                </div>
              )}
              {/* 右手，保留 translateX向左偏移 */}
              {rightHandSvg && (
                <div
                  className="absolute right-0 w-1/2 h-full flex justify-center"
                  style={{
                    transform: `translateY(${BASE_Y + rightOffsetY}px) translateX(-90px)`,
                    transition: 'transform 0.2s ease-out',
                  }}
                >
                  <img
                    src={rightHandSvg}
                    alt="Right hand position"
                    className="h-full max-w-full w-auto object-contain"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {keyboardRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1 md:gap-1.5 mb-1 md:mb-1.5 justify-center relative z-10">
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
                    'relative flex items-center justify-center rounded-lg font-semibold text-xs md:text-sm transition-all duration-150 select-none',
                    'h-9 md:h-11 border-b-2 active:border-b-0 active:translate-y-0.5',
                    isActive
                      ? 'bg-white border-white shadow-md scale-105 z-10'
                      : 'bg-slate-300 border-slate-400 hover:bg-slate-250 text-slate-700'
                  )}
                  style={{
                    width: `${width * 42}px`,
                    minWidth: `${width * 36}px`,
                  }}
                >
                  {keyDef.label}
                  {showFingerGuide && !isActive && (
                    <div
                      className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full opacity-60"
                      style={{ backgroundColor: color }}
                    />
                  )}
                  {isActive && showFingerGuide && (
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
