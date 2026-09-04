'use client';

import { memo, useState } from 'react';
import { cn } from '@/lib/utils';
import { fingerColors, type TypingSentence } from '@/lib/data';

interface SentenceDisplayProps {
  sentence: TypingSentence | undefined;
  typedText: string;
  errorFlash: { char: string; id: number } | null;
  splitIndex: number;
  dictationMode: boolean;
  mode: 'whole' | 'split';
  completed: boolean;
}

/**
 * 独立的单词/句子展示组件
 * - 内部维护 hoveredWord 状态，避免悬停/点击触发整页重渲染
 * - memo 包裹，只有 typedText / sentence / errorFlash / splitIndex 变化才重渲染
 */
function SentenceDisplayInner({
  sentence,
  typedText,
  errorFlash,
  splitIndex,
  dictationMode,
  mode,
  completed,
}: SentenceDisplayProps) {
  const [hoveredWord, setHoveredWord] = useState<number | null>(null);

  if (!sentence) return null;
  const target = sentence.sentence;

  // ===== 默写模式：按空格拆词，未输入字母用等宽占位符隐藏 =====
  const renderDictationWords = () => {
    let cursor = 0;
    const words = target.split(' ').map((text) => {
      const wStart = cursor;
      cursor += text.length;
      const end = cursor;
      cursor += 1;
      return { text, wStart, end };
    });
    return (
      <div className="flex flex-wrap items-baseline justify-center gap-x-1 gap-y-3 leading-[1.4]">
        {words.map((w, idx) => {
          const isHover = hoveredWord === idx;
          return (
            <span
              key={idx}
              className="text-3xl md:text-5xl font-mono font-bold"
              onMouseEnter={() => setHoveredWord(idx)}
              onMouseLeave={() => setHoveredWord((cur) => (cur === idx ? null : cur))}
              style={{ cursor: 'pointer' }}
            >
              {w.text.split('').map((ch, ci) => {
                const gi = w.wStart + ci;
                if (isHover) {
                  return (
                    <span key={ci} className="text-foreground">
                      {ch}
                    </span>
                  );
                }
                if (gi < typedText.length) {
                  const correct = typedText[gi] === ch;
                  return (
                    <span key={ci} className={correct ? 'text-foreground' : 'text-red-500'}>
                      {ch}
                    </span>
                  );
                }
                return (
                  <span key={ci} className="text-muted-foreground/60">
                    {'\u2581'}
                  </span>
                );
              })}
            </span>
          );
        })}
      </div>
    );
  };

  // ===== 正常整句模式：逐字符展示输入进度 =====
  const renderWholeSentence = () => {
    return (
      <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
        {target.split('').map((char, index) => {
          const isSpace = char === ' ';
          const isErrorFlash = index === typedText.length && !!errorFlash;
          let charClass = 'text-muted-foreground/40';
          if (index < typedText.length) {
            charClass = typedText[index] === char ? 'text-foreground' : 'text-red-500';
          } else if (index === typedText.length) {
            charClass = errorFlash ? 'text-red-500' : 'text-foreground';
          }
          const displayChar = isErrorFlash
            ? errorFlash.char
            : isSpace
              ? '\u00A0'
              : char;

          return (
            <span
              key={index}
              className={cn(
                'text-3xl md:text-5xl font-mono font-bold transition-colors duration-100 relative',
                charClass
              )}
            >
              {index === typedText.length && !completed && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-sky-500 animate-pulse" />
              )}
              {displayChar}
            </span>
          );
        })}
      </div>
    );
  };

  // ===== 拆词模式 =====
  const renderSplitSentence = () => {
    let cursor = 0;
    const tokenStarts = sentence.words.map((w) => {
      const s = cursor;
      cursor += w.text.length;
      cursor += 1;
      return s;
    });
    return (
      <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-4 leading-[1.4]">
        {sentence.words.map((word, index) => {
          const wordText = word.text;
          const isCurrentWord = index === splitIndex;
          const color = fingerColors[word.finger];
          const isHover = hoveredWord === index;
          return (
            <div key={index} className="flex flex-col items-center">
              <span
                className={cn(
                  'text-2xl md:text-4xl font-mono font-bold transition-all duration-200',
                  isCurrentWord && !dictationMode ? 'text-foreground scale-110' : 'text-muted-foreground/40'
                )}
                style={
                  dictationMode
                    ? { cursor: 'pointer' }
                    : isCurrentWord
                      ? { textShadow: `0 0 20px ${color}40` }
                      : {}
                }
                onMouseEnter={() => setHoveredWord(index)}
                onMouseLeave={() => setHoveredWord((cur) => (cur === index ? null : cur))}
              >
                {dictationMode
                  ? wordText.split('').map((ch, ci) => {
                      const gi = tokenStarts[index] + ci;
                      if (isHover) {
                        return (
                          <span key={ci} className="text-foreground">
                            {ch}
                          </span>
                        );
                      }
                      if (gi < typedText.length) {
                        const correct = typedText[gi] === ch;
                        return (
                          <span key={ci} className={correct ? 'text-foreground' : 'text-red-500'}>
                            {ch}
                          </span>
                        );
                      }
                      return (
                        <span key={ci} className="text-muted-foreground/60">
                          {'\u2581'}
                        </span>
                      );
                    })
                  : wordText}
              </span>
              <div
                className="w-6 h-0.5 rounded-full mt-1"
                style={{ backgroundColor: isCurrentWord && !dictationMode ? color : 'transparent' }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  // 默写模式下：拆词或整句按 mode 决定
  if (dictationMode) {
    return mode === 'whole' ? renderDictationWords() : renderSplitSentence();
  }
  return mode === 'whole' ? renderWholeSentence() : renderSplitSentence();
}

export default memo(SentenceDisplayInner);
