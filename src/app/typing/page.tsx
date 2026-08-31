'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Settings,
  RefreshCw,
  User,
  AlertCircle,
  Maximize2,
  Minimize2,
  Volume2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { typingLessons, type TypingSentence, type TypingWord, fingerColors, type FingerType } from '@/lib/data';
import { playKeyClick, playErrorBuzz } from '@/lib/sounds';
import { VirtualKeyboard } from '@/components/typing/virtual-keyboard';
import { ParticleBurst } from '@/components/typing/particle-burst';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type PracticeMode = 'whole' | 'split';

// 无需手动输入的字符：空格与常用英文标点，打字时自动补全
const PUNCTUATION = new Set(['.', ',', '!', '?', ';', ':', "'", '"', '-', '(', ')']);
const isSkippable = (ch: string | undefined) => ch !== undefined && (ch === ' ' || PUNCTUATION.has(ch));

export default function TypingPage() {
  const [lessonIndex, setLessonIndex] = useState(0);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [mode, setMode] = useState<PracticeMode>('whole');
  const [showImage, setShowImage] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAnswer, setShowAnswer] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [showCompletionCard, setShowCompletionCard] = useState(false);
  const [errors, setErrors] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [splitIndex, setSplitIndex] = useState(0);
  const [burstKey, setBurstKey] = useState(0);
  const [burstCenter, setBurstCenter] = useState<{ x: number; y: number } | null>(null);
  // 输入错误时短暂显示的错误字符（自动消失，无需 Backspace）
  const [errorFlash, setErrorFlash] = useState<{ char: string; id: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentenceAreaRef = useRef<HTMLDivElement>(null);

  const lesson = typingLessons[lessonIndex];
  const sentence = lesson?.sentences[sentenceIndex];
  const totalSentences = lesson?.sentences.length || 0;

  // Timer
  useEffect(() => {
    if (isPaused || completed) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, completed]);

  // WPM calculation
  useEffect(() => {
    if (timer > 0 && typedText.length > 0) {
      const words = typedText.trim().split(/\s+/).length;
      const minutes = timer / 60;
      setWpm(Math.round(words / minutes));
    }
  }, [timer, typedText]);

  // 下一个需要输入的字符（跳过自动补全的空格与标点）
  const getNextChar = useCallback(() => {
    if (!sentence) return '';
    const target = showAnswer ? sentence.sentence : '';
    let i = typedText.length;
    while (i < target.length && isSkippable(target[i])) i++;
    return target[i] || '';
  }, [sentence, typedText, showAnswer]);

  // Get current word info
  const getCurrentWordInfo = useCallback((): { word: TypingWord; charIndex: number } | null => {
    if (!sentence) return null;
    let charCount = 0;
    for (const word of sentence.words) {
      const wordWithSpace = word.text + ' ';
      if (typedText.length >= charCount && typedText.length < charCount + wordWithSpace.length) {
        return { word, charIndex: typedText.length - charCount };
      }
      charCount += wordWithSpace.length;
    }
    return null;
  }, [sentence, typedText]);

  const currentWordInfo = getCurrentWordInfo();
  const nextChar = getNextChar();

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
        // Spaces are auto-skipped, ignore explicit space input
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
            // 从句子中心位置触发粒子消散，粒子完全消散后再弹出完成卡片
            const rect = sentenceAreaRef.current?.getBoundingClientRect();
            if (rect) {
              setBurstCenter({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
              setBurstKey((k) => k + 1);
            } else {
              setShowCompletionCard(true);
            }
            const totalChars = target.length;
            const correctChars = newTyped.split('').filter((c, i) => c === target[i]).length;
            setAccuracy(Math.round((correctChars / totalChars) * 100));
          }
        } else {
          // 错误输入不写入进度：播放警告音并短暂显示错误字符后自动消失
          setErrors((prev) => prev + 1);
          playErrorBuzz();
          const id = Date.now();
          setErrorFlash({ char: key, id });
          window.setTimeout(() => {
            setErrorFlash((prev) => (prev?.id === id ? null : prev));
          }, 350);
        }
      }
    },
    [completed, isPaused, sentence, typedText]
  );

  // Physical keyboard handler
  const handleNextSentence = useCallback(() => {
    if (sentenceIndex < totalSentences - 1) {
      setSentenceIndex((prev) => prev + 1);
      setTypedText('');
      setCompleted(false);
      setShowCompletionCard(false);
      setErrors(0);
      setSplitIndex(0);
    }
  }, [sentenceIndex, totalSentences]);

  const handlePrevSentence = useCallback(() => {
    if (sentenceIndex > 0) {
      setSentenceIndex((prev) => prev - 1);
      setTypedText('');
      setCompleted(false);
      setShowCompletionCard(false);
      setErrors(0);
      setSplitIndex(0);
    }
  }, [sentenceIndex]);

  const handleReset = useCallback(() => {
    setTypedText('');
    setCompleted(false);
    setShowCompletionCard(false);
    setErrors(0);
    setTimer(0);
    setWpm(0);
    setAccuracy(100);
    setSplitIndex(0);
  }, []);

  const handleReadAloud = useCallback(() => {
    if (sentence && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(sentence.sentence);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  }, [sentence]);

  // 打字成功后自动朗读该句子（稍等完成卡片弹出）
  useEffect(() => {
    if (!completed) return;
    const t = setTimeout(() => {
      handleReadAloud();
    }, 400);
    return () => clearTimeout(t);
  }, [completed, handleReadAloud]);

  // 兜底：即使粒子特效回调失效，也保证完成卡片最终弹出
  useEffect(() => {
    if (!completed) return;
    const t = setTimeout(() => {
      setShowCompletionCard(true);
    }, 1500);
    return () => clearTimeout(t);
  }, [completed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Enter key: when completed, auto-advance to next sentence
      if (e.key === 'Enter' && completed) {
        e.preventDefault();
        if (sentenceIndex < totalSentences - 1) {
          handleNextSentence();
        }
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
        e.preventDefault();
        setShowAnswer((prev) => !prev);
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
  }, [handleKeyPress, handleNextSentence, handlePrevSentence, handleReset, handleReadAloud]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
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

    return (
      <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
        {target.split('').map((char, index) => {
          let charClass = 'text-slate-300';
          // 当前位置短暂显示错误字符（红色），随后自动回退为目标字符
          const isErrorFlash = index === typedText.length && !!errorFlash;
          if (index < typedText.length) {
            charClass = typedText[index] === char ? 'text-foreground' : 'text-red-500';
          } else if (index === typedText.length) {
            charClass = errorFlash ? 'text-red-500' : 'text-foreground';
          }
          const displayChar = isErrorFlash
            ? errorFlash.char
            : char === ' '
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

    return (
      <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-2">
        {sentence.words.map((word, index) => {
          const wordText = word.text;
          const isCurrentWord = index === splitIndex;
          const color = fingerColors[word.finger];

          return (
            <div key={index} className="flex flex-col items-center">
              <span
                className={cn(
                  'text-2xl md:text-4xl font-mono font-bold transition-all duration-200',
                  isCurrentWord ? 'text-foreground scale-110' : 'text-slate-300'
                )}
                style={isCurrentWord ? { textShadow: `0 0 20px ${color}40` } : {}}
              >
                {wordText}
              </span>
              <div
                className="w-6 h-0.5 rounded-full mt-1"
                style={{ backgroundColor: isCurrentWord ? color : 'transparent' }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 bg-white border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/practice"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Link>
          <div className="hidden sm:block h-4 w-px bg-border" />
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="font-medium text-foreground">{lesson?.title}</span>
            <span className="text-muted-foreground">
              {lesson?.titleCn} ({sentenceIndex + 1}/{totalSentences})
            </span>
          </div>
          <div className="sm:hidden text-sm font-medium text-foreground">
            {sentenceIndex + 1}/{totalSentences}
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <Button variant="ghost" size="sm" className="text-xs md:text-sm">
            <Settings className="w-3.5 h-3.5 mr-1" />
            <span className="hidden md:inline">设置</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-xs md:text-sm">
            <BookOpen className="w-3.5 h-3.5 mr-1" />
            <span className="hidden md:inline">切换模式</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-xs md:text-sm">
            <BookOpen className="w-3.5 h-3.5 mr-1" />
            <span className="hidden md:inline">学习内容</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-xs md:text-sm" onClick={handleReset}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            <span className="hidden md:inline">重置进度</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-xs md:text-sm">
            <User className="w-3.5 h-3.5 mr-1" />
            <span className="hidden md:inline">个性化</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-xs md:text-sm">
            <AlertCircle className="w-3.5 h-3.5 mr-1" />
            <span className="hidden md:inline">报错</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-xs md:text-sm" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 mr-1" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 mr-1" />
            )}
            <span className="hidden md:inline">全屏</span>
          </Button>
        </div>
      </div>

      {/* Secondary Bar */}
      <div className="flex items-center gap-3 px-3 md:px-4 py-2 bg-white/80 border-b border-border">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Play className="w-3.5 h-3.5" />
          {formatTime(timer)}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setMode('split')}
            className={cn(
              'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
              mode === 'split'
                ? 'bg-sky-500 text-white'
                : 'bg-slate-100 text-muted-foreground hover:bg-slate-200'
            )}
          >
            拆句练习
          </button>
          <button
            onClick={() => setMode('whole')}
            className={cn(
              'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
              mode === 'whole'
                ? 'bg-sky-500 text-white'
                : 'bg-slate-100 text-muted-foreground hover:bg-slate-200'
            )}
          >
            整句练习
          </button>
        </div>
        <button
          onClick={() => setShowImage(!showImage)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-muted-foreground hover:bg-slate-200 transition-colors"
        >
          {showImage ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          显示图片
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 md:py-10 gap-6 md:gap-8">
        {completed && showCompletionCard && sentence ? (
          /* Completion Card */
          <div className="flex flex-col items-center gap-4 animate-fade-in-up">
            {/* Card */}
            <div className="bg-slate-200/80 rounded-2xl px-8 py-6 md:px-12 md:py-8 text-center shadow-lg max-w-md w-full">
              {/* Phonetics */}
              <div className="flex items-center justify-center gap-4 mb-3">
                {sentence.phonetics?.map((p, i) => (
                  <span key={i} className="text-base md:text-lg text-slate-600 font-mono">
                    {p.phonetic}
                  </span>
                ))}
              </div>

              {/* POS Badges */}
              <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                {sentence.phonetics?.map((p, i) => (
                  <span
                    key={i}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium text-white',
                      i % 3 === 0 ? 'bg-indigo-400' : i % 3 === 1 ? 'bg-emerald-400' : 'bg-sky-400'
                    )}
                  >
                    {p.pos}
                  </span>
                ))}
              </div>

              {/* English Text */}
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                {sentence.sentence.trim().replace(/\.$/, '')}!
              </h2>

              {/* Orange Separator */}
              <div className="w-full h-0.5 bg-orange-400 rounded-full mb-4" />

              {/* Grammar Role */}
              <p className="text-sm md:text-base text-slate-600">
                {sentence.grammarRole || sentence.grammar}
              </p>
            </div>

            {/* Chinese Translation */}
            <p className="text-xl md:text-2xl font-medium text-foreground">
              {sentence.translation}
            </p>

            {/* Hint */}
            <p className="text-xs text-muted-foreground">
              按 <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-mono text-xs">Enter</kbd> 开始下一题
            </p>
          </div>
        ) : (
          <>
            {/* Sentence Display */}
            <div ref={sentenceAreaRef} className="text-center space-y-3 w-full max-w-3xl">
              {mode === 'whole' ? renderSentence() : renderSplitSentence()}

              {/* Grammar annotation */}
              {sentence && (
                <p className="text-sm text-muted-foreground">{sentence.grammar}</p>
              )}

              {/* Translation */}
              {sentence && showAnswer && (
                <p className="text-base md:text-lg text-foreground font-medium">{sentence.translation}</p>
              )}
            </div>

            {/* Virtual Keyboard */}
            <div className="w-full max-w-3xl">
              <VirtualKeyboard
                nextKey={nextChar}
                typedText={typedText}
                targetText={sentence?.sentence || ''}
                onKeyPress={handleKeyPress}
                showFingerGuide={true}
              />
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-3xl">
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
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
          </>
        )}

        {/* Bottom Controls */}
        {completed && showCompletionCard ? (
          <div className="flex flex-col items-center gap-3">
            {/* Completion Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">用时</p>
                <p className="font-semibold text-foreground">{formatTime(timer)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">速度</p>
                <p className="font-semibold text-foreground">{wpm} WPM</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">准确率</p>
                <p className="font-semibold text-foreground">{accuracy}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">错误</p>
                <p className="font-semibold text-red-500">{errors}</p>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleReset} className="text-xs">
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                再来一次
              </Button>
              {sentenceIndex < totalSentences - 1 && (
                <Button
                  size="sm"
                  onClick={handleNextSentence}
                  className="bg-sky-500 hover:bg-sky-600 text-white text-xs"
                >
                  下一题
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnswer(!showAnswer)}
                className="text-xs"
              >
                {showAnswer ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
                空格 隐藏答案
              </Button>
              <Badge variant="secondary" className="text-xs">
                Shift ←→ 切题
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
            </div>
          </>
        )}
      </div>

      {/* 粒子消散特效层 */}
      <ParticleBurst
        burstKey={burstKey}
        center={burstCenter}
        onFinish={() => setShowCompletionCard(true)}
      />

    </div>
  );
}
