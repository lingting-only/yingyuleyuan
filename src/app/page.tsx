'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  RefreshCw,
  Maximize2,
  Minimize2,
  Volume2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Play,
  LogOut,
  Sun,
  Moon,
  Image as ImageIcon,
  ImageOff,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { type TypingSentence, fingerColors } from '@/lib/data';
import {
  wordBankIndex,
  bankToPracticeQueue,
  findPracticeById,
  findBankIdByItem,
  initWordBanks,
} from '@/lib/wordbank';
import { playKeyClick, playErrorBuzz } from '@/lib/sounds';
import {
  getSelectedLessonId,
  getErrorPracticeIds,
  clearErrorPractice,
  getErrorBook,
  addError,
  removeError,
  recordSentenceCompletion,
  getBankProgress,
  setBankProgress,
} from '@/lib/storage';
import { VirtualKeyboard } from '@/components/typing/virtual-keyboard';
import { ParticleBurst } from '@/components/typing/particle-burst';
import { TopBar } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type PracticeMode = 'whole' | 'split';

// 无需手动输入的字符：空格与常用英文标点，打字时自动补全
const PUNCTUATION = new Set(['.', ',', '!', '?', ';', ':', "'", '"', '-', '(', ')']);
const isSkippable = (ch: string | undefined) => ch !== undefined && (ch === ' ' || PUNCTUATION.has(ch));

export default function HomePage() {
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [mode] = useState<PracticeMode>('whole'); // 默认整句练习
  const [showImage, setShowImage] = useState(true);
  const [dictationMode, setDictationMode] = useState(false); // 默写模式：隐藏英文，打对一个词展示一个词
  const [showFingerGuide, setShowFingerGuide] = useState(true); // 空格键：切换手势图（默写模式下不隐藏）
  const [hoveredWord, setHoveredWord] = useState<number | null>(null); // 鼠标悬停临时展示的单词的下标
  const [isPaused, setIsPaused] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // 暗黑模式切换：mounted 前不渲染图标，避免 SSR 水合不一致
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === 'dark';
  const [completed, setCompleted] = useState(false);
  const [errors, setErrors] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [splitIndex, setSplitIndex] = useState(0);
  // 输入错误时短暂显示的错误字符（自动消失，无需 Backspace）
  const [errorFlash, setErrorFlash] = useState<{ char: string; id: number } | null>(null);
  // 队列化练习源：挂载后按选课/错题模式重载
  const [practiceQueue, setPracticeQueue] = useState<TypingSentence[]>([]);
  const [queueLabel, setQueueLabel] = useState('');
  const [isErrorMode, setIsErrorMode] = useState(false);
  // 单词完成后的粒子消散特效：爆发序号与爆发中心（取自单词区）
  const [burstKey, setBurstKey] = useState(0);
  const [burstCenter, setBurstCenter] = useState<{ x: number; y: number } | null>(null);
  const burstRef = useRef<HTMLDivElement>(null);
  // 朗读并发控制：正在播放时忽略重复触发，播放完毕后才允许再次播放
  const speakingRef = useRef(false);

  const sentence = practiceQueue[sentenceIndex];
  const totalSentences = practiceQueue.length;

  // 构建练习队列（挂载时与退出错题时调用）
  const loadQueue = useCallback(() => {
    const ids = getErrorPracticeIds();
    let startIndex = 0;
    if (ids.length > 0) {
      const sentences = ids
        .map((id) => findPracticeById(id))
        .filter((s): s is TypingSentence => Boolean(s));
      setPracticeQueue(sentences);
      setQueueLabel('错题练习');
      setIsErrorMode(true);
      // 消费错题练习态
      clearErrorPractice();
    } else {
      const sel = getSelectedLessonId();
      const bank = wordBankIndex.find((b) => b.id === sel) ?? wordBankIndex[0];
      const queue = bank ? bankToPracticeQueue(bank.id) ?? [] : [];
      setPracticeQueue(queue);
      setQueueLabel(bank?.titleCn ?? '');
      setIsErrorMode(false);
      // 从上次学习进度继续（未练过则从 0 开始）
      const saved = bank ? getBankProgress()[bank.id] : 0;
      startIndex = Math.min(Math.max(saved ?? 0, 0), Math.max(queue.length - 1, 0));
    }
    setSentenceIndex(startIndex);
    setTypedText('');
    setCompleted(false);
    setErrors(0);
    setTimer(0);
    setWpm(0);
    setAccuracy(100);
    setSplitIndex(0);
  }, []);

  // 挂载时先加载词库内容（public/wordbanks/ 静态资源），再载入选课/错题模式
  useEffect(() => {
    initWordBanks().then(() => loadQueue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer
  useEffect(() => {
    if (isPaused || completed) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, completed]);

  // 页面切走/失去焦点时暂停，返回后需按任意键继续（不做自动恢复）
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && !isPaused) setIsPaused(true);
    };
    const handleBlur = () => {
      if (!isPaused) setIsPaused(true);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isPaused]);

  // WPM calculation
  useEffect(() => {
    if (timer > 0 && typedText.length > 0) {
      const words = typedText.trim().split(/\s+/).length;
      const minutes = timer / 60;
      setWpm(Math.round(words / minutes));
    }
  }, [timer, typedText]);

  // 错题自动记录 + 用户学习统计：完成一句时，出错则入错题本（零错且已在库则移除），
  // 同时把本次练习的统计（用时/WPM/准确率/错误）持久化到 localStorage
  useEffect(() => {
    if (!completed || !sentence) return;
    if (errors > 0) {
      addError(sentence.id);
    } else {
      const inBook = getErrorBook().some((r) => r.id === sentence.id);
      if (inBook) removeError(sentence.id);
    }
    const lessonId = findBankIdByItem(sentence.id);
    recordSentenceCompletion({
      sentenceId: sentence.id,
      lessonId,
      wpm,
      accuracy,
      errors,
      duration: timer,
    });
    // 记录学习进度：非错题模式下，完成一句后从下一题继续（学完则回到开头）
    if (!isErrorMode && lessonId) {
      const next = sentenceIndex + 1;
      setBankProgress(lessonId, next >= totalSentences ? 0 : next);
    }
    // 不弹出确认页：完成一句后触发粒子消散特效，短暂停顿后直接切换下一个单词（最后一题回到开头）
    const el = burstRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setBurstCenter({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }
    setBurstKey((k) => k + 1);
    const nextIdx = sentenceIndex < totalSentences - 1 ? sentenceIndex + 1 : 0;
    const t = setTimeout(() => {
      setSentenceIndex(nextIdx);
      setTypedText('');
      setCompleted(false);
      setErrors(0);
      setSplitIndex(0);
      setTimer(0);
      setWpm(0);
      setAccuracy(100);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed]);

  // 下一个需要输入的字符（跳过自动补全的空格与标点）
  const getNextChar = useCallback(() => {
    if (!sentence) return '';
    const target = sentence.sentence;
    let i = typedText.length;
    while (i < target.length && isSkippable(target[i])) i++;
    return target[i] || '';
  }, [sentence, typedText]);

  const nextChar = getNextChar();
  // 键盘提示位（下一字符高亮）跟随手势图开关；默写模式不隐藏手势图
  const keyHint = showFingerGuide ? nextChar : '';

  const handleReadAloud = useCallback(() => {
    if (!sentence || !('speechSynthesis' in window)) return;
    // 正在播放时忽略本次触发（防并发），只有当上一段播放完毕后才允许再次播放
    if (speakingRef.current) return;
    const utterance = new SpeechSynthesisUtterance(sentence.sentence);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    speakingRef.current = true;
    const reset = () => {
      speakingRef.current = false;
    };
    utterance.onend = reset;
    utterance.onerror = reset;
    speechSynthesis.speak(utterance);
  }, [sentence]);

  // Handle key press
  const handleKeyPress = useCallback(
    (key: string) => {
      if (completed || isPaused) return;
      if (!sentence) return;

      const target = sentence.sentence;

      if (key === 'Backspace') {
        setTypedText((prev) => prev.slice(0, -1));
        playKeyClick();
        return;
      }

      if (key === 'Space' || key === ' ') {
        // 空格自动跳过，忽略显式空格输入
        return;
      }

      if (key === 'Enter') {
        key = '\n';
      }

      if (key.length === 1) {
        // 自动补全当前位置的空格与标点（如句尾的 . 无需手动输入）
        let newTyped = typedText;
        while (isSkippable(target[newTyped.length])) {
          newTyped += target[newTyped.length];
        }

        const expected = target[newTyped.length];

        if (key === expected) {
          newTyped += key;

          // 输入后继续补全空格与标点（可能直接补完整句）
          while (isSkippable(target[newTyped.length])) {
            newTyped += target[newTyped.length];
          }

          setTypedText(newTyped);
          playKeyClick();

          if (newTyped === target) {
            setCompleted(true);
            const totalChars = target.length;
            const correctChars = newTyped.split('').filter((c, i) => c === target[i]).length;
            setAccuracy(Math.round((correctChars / totalChars) * 100));
          }
        } else {
          // 错误输入不写入进度：播放警告音并重新朗读单词，短暂显示错误字符后自动消失
          setErrors((prev) => prev + 1);
          playErrorBuzz();
          handleReadAloud();
          const id = Date.now();
          setErrorFlash({ char: key, id });
          window.setTimeout(() => {
            setErrorFlash((prev) => (prev?.id === id ? null : prev));
          }, 350);
        }
      }
    },
    [completed, isPaused, sentence, typedText, handleReadAloud]
  );

  const handleNextSentence = useCallback(() => {
    if (sentenceIndex < totalSentences - 1) {
      setSentenceIndex((prev) => prev + 1);
      setTypedText('');
      setCompleted(false);
      setErrors(0);
      setSplitIndex(0);
    }
  }, [sentenceIndex, totalSentences]);

  const handlePrevSentence = useCallback(() => {
    if (sentenceIndex > 0) {
      setSentenceIndex((prev) => prev - 1);
      setTypedText('');
      setCompleted(false);
      setErrors(0);
      setSplitIndex(0);
    }
  }, [sentenceIndex]);

  const handleReset = useCallback(() => {
    setTypedText('');
    setCompleted(false);
    setErrors(0);
    setTimer(0);
    setWpm(0);
    setAccuracy(100);
    setSplitIndex(0);
  }, []);

  const handleExitErrorMode = useCallback(() => {
    clearErrorPractice();
    setIsErrorMode(false);
    loadQueue();
  }, [loadQueue]);

  // 单词/句子出现（刚切换/打开）时自动朗读
  useEffect(() => {
    if (!sentence) return;
    const t = setTimeout(() => {
      handleReadAloud();
    }, 50);
    return () => clearTimeout(t);
  }, [sentence, sentenceIndex, handleReadAloud]);

  // 切换句子时重置悬停展示
  useEffect(() => {
    setHoveredWord(null);
  }, [sentenceIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // 暂停状态下按任意键恢复练习（该键仅用于恢复，不作为输入）
      if (isPaused) {
        e.preventDefault();
        setIsPaused(false);
        return;
      }

      if (e.key === 'ArrowLeft' && e.shiftKey) {
        handlePrevSentence();
        return;
      }
      if (e.key === 'ArrowRight' && e.shiftKey) {
        handleNextSentence();
        return;
      }
      if (e.key === ' ') {
        // 空格：切换手势图（含下一字符高亮），不影响英文单词与默写模式
        e.preventDefault();
        setShowFingerGuide((prev) => !prev);
        return;
      }
      if (e.key === 'a' && e.ctrlKey) {
        e.preventDefault();
        handleReadAloud();
        return;
      }
      if (e.key === ';' && e.ctrlKey) {
        e.preventDefault();
        handleReset();
        return;
      }

      handleKeyPress(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress, handleNextSentence, handlePrevSentence, handleReset, handleReadAloud, isPaused, completed, sentenceIndex, totalSentences]);

  const toggleFullscreen = () => {
    // 与 TopBar 一致：对整个文档全屏，保证任何页面行为统一
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Render sentence with typing progress
  const renderSentence = () => {
    if (!sentence) return null;
    const target = sentence.sentence;

    // 默写模式：按空格拆词，每个已输入正确的字母逐个显示，未输入字母用等宽占位符隐藏；悬停临时展示整词
    if (dictationMode) {
      let cursor = 0;
      const words = target.split(' ').map((text) => {
        const wStart = cursor;
        cursor += text.length;
        const end = cursor;
        cursor += 1; // 跳过空格
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
                  const gi = w.wStart + ci; // 该字母在整句中的下标
                  // 悬停展示整词
                  if (isHover) {
                    return (
                      <span key={ci} className="text-foreground">
                        {ch}
                      </span>
                    );
                  }
                  // 已输入：正确绿/错误红
                  if (gi < typedText.length) {
                    const correct = typedText[gi] === ch;
                    return (
                      <span key={ci} className={correct ? 'text-foreground' : 'text-red-500'}>
                        {ch}
                      </span>
                    );
                  }
                  // 未输入：隐藏占位符
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
    }

    // 正常模式：逐字符展示输入进度
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

  // Render split mode sentence
  const renderSplitSentence = () => {
    if (!sentence) return null;

    // 按输入进度计算每个单词的起始下标（空格也计入 typedText）
    let cursor = 0;
    const tokenStarts = sentence.words.map((w) => {
      const s = cursor;
      cursor += w.text.length;
      cursor += 1; // 跳过单词之间的空格
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
                      const gi = tokenStarts[index] + ci; // 该字母在整句中的下标
                      // 悬停展示整词
                      if (isHover) {
                        return (
                          <span key={ci} className="text-foreground">
                            {ch}
                          </span>
                        );
                      }
                      // 已输入：正确/错误着色；未输入：隐藏占位符
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

  // 练习工具栏：课程信息 + 计时 + 图片/默写/重置 放在一块
  // 桌面端注入全局 TopBar 插槽；全屏与主题按钮由 TopBar 统一提供
  // 移动端：全屏与主题按钮在此行内补充（md:hidden）
  const practiceBar = (
    <>
      <div className="flex items-center gap-2 text-sm min-w-0">
        <span className="font-medium text-foreground truncate">{queueLabel}</span>
        <span className="text-muted-foreground shrink-0">
          ({sentenceIndex + 1}/{totalSentences})
        </span>
      </div>
      {isErrorMode && (
        <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">错题练习</Badge>
      )}
      {isErrorMode && (
        <Button variant="ghost" size="sm" className="text-xs md:text-sm" onClick={handleExitErrorMode}>
          <LogOut className="w-3.5 h-3.5 mr-1" />
          <span className="hidden md:inline">退出错题</span>
        </Button>
      )}
      <div className="hidden">
        <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" onClick={() => setShowImage(!showImage)}>
            {showImage ? <ImageIcon className="w-4 h-4" /> : <ImageOff className="w-4 h-4" />}
            <span className="sr-only">显示图片</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{showImage ? '隐藏图片' : '显示图片'}</TooltipContent>
      </Tooltip>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(
              dictationMode && 'bg-sky-100 text-sky-600 hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-400'
            )}
            onClick={() => setDictationMode((prev) => !prev)}
          >
            {dictationMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="sr-only">默写模式</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{dictationMode ? '关闭默写模式' : '开启默写模式'}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" onClick={handleReset}>
            <RefreshCw className="w-4 h-4" />
            <span className="sr-only">重置进度</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">重置进度</TooltipContent>
      </Tooltip>
      {/* 移动端补充：全屏与主题切换（桌面端由 TopBar 固定提供） */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="sr-only">全屏</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{isFullscreen ? '退出全屏' : '全屏'}</TooltipContent>
      </Tooltip>
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        <span className="sr-only">切换主题</span>
      </Button>
    </>
  );

  return (
    <div className="h-full bg-gradient-to-b from-background to-muted flex flex-col">
      {/* 全局单行顶栏：Logo + 导航 + 练习工具栏（课程信息/计时/图片/默写/重置）+ 全屏 + 主题 */}
      <TopBar>{practiceBar}</TopBar>

      {/* 移动端：练习工具栏单独一行（顶栏由 MobileNav 提供） */}
      <div className="md:hidden flex items-center justify-between gap-1 px-3 py-2 bg-background border-b border-border">
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-1 min-w-0">{practiceBar}</div>
        </TooltipProvider>
      </div>

      {/* Secondary Bar（已删除拆句/整句切换，默认整句练习） */}

      {/* Main Content：独立滚动区（隐藏滚动条），滚动条不影响顶栏 */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden flex flex-col items-center justify-center px-4 py-6 md:py-10 gap-3 md:gap-4">
        {/* 单词区（音标/词性 + 单词展示）：暂停时整块遮挡，尺寸与内容一致避免页面跳动 */}
        <div ref={burstRef} className="relative w-full max-w-4xl flex flex-col items-center gap-3">
          {/* 单词信息：音标与词性 */}
          {sentence?.phonetics && sentence.phonetics.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {sentence.phonetics.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-card/80 border border-border rounded-full px-3 py-1 shadow-sm"
                >
                  <span className="font-mono text-sm text-foreground">{p.phonetic}</span>
                  <span className="text-xs font-medium text-sky-600">{p.pos}</span>
                </div>
              ))}
            </div>
          )}

          {/* Sentence Display */}
          <div className="text-center space-y-3 w-full">
            {mode === 'whole' ? renderSentence() : renderSplitSentence()}

            {/* Grammar annotation */}
            {sentence && (
              <p className="text-sm text-muted-foreground">{sentence.grammar}</p>
            )}

            {/* Translation */}
            {sentence && (
              <p className="text-base md:text-lg text-foreground font-medium">{sentence.translation}</p>
            )}
          </div>

          {/* 暂停时遮挡整个单词区（含音标/词性），提示按任意键继续 */}
          {isPaused && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 backdrop-blur-md bg-background/50 rounded-xl">
              <p className="text-lg md:text-xl font-semibold text-foreground">按任意键继续</p>
              <p className="text-xs text-muted-foreground">页面已暂停</p>
            </div>
          )}
        </div>

        {/* Virtual Keyboard */}
        <div className="w-full max-w-3xl">
          <VirtualKeyboard
            nextKey={keyHint}
            typedText={typedText}
            targetText={sentence?.sentence || ''}
            onKeyPress={handleKeyPress}
            showFingerGuide={showFingerGuide}
          />
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-3xl">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full transition-all duration-300"
              style={{
                width: sentence
                  ? `${(typedText.length / sentence.sentence.length) * 100}%`
                  : '0%',
              }}
            />
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevSentence}
            disabled={sentenceIndex === 0}
            className="text-xs"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            上一题
          </Button>
          <Button variant="outline" size="sm" onClick={handleReadAloud} className="text-xs">
            <Volume2 className="w-3.5 h-3.5 mr-1" />
            Ctrl A 朗读
          </Button>
          <Badge variant="secondary" className="text-xs">
            Shift ←→ 切题
          </Badge>
          <Badge variant="secondary" className="text-xs">
            空格 {showFingerGuide ? '隐藏手势' : '显示手势'}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Ctrl ; 再来一次
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextSentence}
            disabled={sentenceIndex >= totalSentences - 1}
            className="text-xs"
          >
            下一题
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>速度: <strong className="text-foreground">{wpm}</strong> WPM</span>
          <span>准确率: <strong className="text-foreground">{accuracy}%</strong></span>
          <span>错误: <strong className="text-red-500">{errors}</strong></span>
          <span>时间: <strong className="text-foreground">{formatTime(timer)}</strong></span>
        </div>
      </div>

      {/* 单词完成后的粒子消散特效（覆盖全屏、不拦截交互） */}
      <ParticleBurst burstKey={burstKey} center={burstCenter} />
    </div>
  );
}
