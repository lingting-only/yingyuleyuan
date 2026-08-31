'use client';

import { useState, useCallback } from 'react';
import {
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  Lightbulb,
  Mic,
  BookOpen,
  PenTool,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { practiceItems } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Keyboard } from 'lucide-react';

type PracticeType = 'all' | 'vocabulary' | 'grammar' | 'speaking';

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  all: { label: '全部', icon: <Sparkles className="w-4 h-4" />, color: 'bg-sky-500' },
  vocabulary: { label: '词汇听写', icon: <BookOpen className="w-4 h-4" />, color: 'bg-emerald-500' },
  grammar: { label: '语法填空', icon: <PenTool className="w-4 h-4" />, color: 'bg-orange-500' },
  speaking: { label: '口语练习', icon: <Mic className="w-4 h-4" />, color: 'bg-purple-500' },
};

export default function PracticePage() {
  const [type, setType] = useState<PracticeType>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [userSpeakingText, setUserSpeakingText] = useState('');

  const filteredItems = type === 'all'
    ? practiceItems
    : practiceItems.filter((item) => item.type === type);

  const currentItem = filteredItems[currentIndex % filteredItems.length];

  const handleAnswer = useCallback((answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);
    setTotalAnswered((prev) => prev + 1);
    if (answer === currentItem.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  }, [showResult, currentItem]);

  const handleNext = useCallback(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setShowExplanation(false);
    setShowHint(false);
    setUserSpeakingText('');
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowExplanation(false);
    setShowHint(false);
    setScore(0);
    setTotalAnswered(0);
    setUserSpeakingText('');
  }, []);

  const isCorrect = selectedAnswer === currentItem.correctAnswer;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">互动练习</h1>
        <p className="text-sm text-muted-foreground mt-1">
          通过趣味练习巩固所学知识，提升英语综合能力
        </p>
      </div>

      {/* Typing Mode Entry */}
      <Link
        href="/typing"
        className="block bg-gradient-to-r from-sky-50 to-indigo-50 rounded-2xl border border-sky-100 p-4 hover:shadow-md transition-all hover:-translate-y-0.5"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500 text-white shrink-0">
            <Keyboard className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground text-sm">打字练习模式</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              探趣岛风格打字练习，支持整句/拆句模式、指法引导、语法标注
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-sky-500 shrink-0" />
        </div>
      </Link>

      {/* Score Bar */}
      <div className="bg-white rounded-2xl border border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium text-foreground">
              得分: {score}/{totalAnswered}
            </span>
          </div>
          {totalAnswered > 0 && (
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
              正确率 {Math.round((score / totalAnswered) * 100)}%
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-1" />
          重新开始
        </Button>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Object.entries(typeConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => {
              setType(key as PracticeType);
              setCurrentIndex(0);
              setSelectedAnswer(null);
              setShowResult(false);
              setShowExplanation(false);
              setShowHint(false);
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
              type === key
                ? `${config.color} text-white shadow-sm`
                : 'bg-white text-muted-foreground border border-border hover:border-sky-200'
            )}
          >
            {config.icon}
            {config.label}
          </button>
        ))}
      </div>

      {/* Practice Card */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {/* Card Header */}
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                'text-xs',
                currentItem.type === 'vocabulary' && 'bg-emerald-50 text-emerald-700',
                currentItem.type === 'grammar' && 'bg-orange-50 text-orange-700',
                currentItem.type === 'speaking' && 'bg-purple-50 text-purple-700'
              )}
            >
              {typeConfig[currentItem.type]?.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              第 {currentIndex + 1} 题 / 共 {filteredItems.length} 题
            </span>
          </div>
          {currentItem.type === 'vocabulary' && (
            <button className="p-2 rounded-lg hover:bg-slate-50 text-sky-500 transition-colors">
              <Volume2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Question */}
        <div className="p-5 md:p-6 space-y-5">
          <div>
            <h3 className="text-base font-semibold text-foreground leading-relaxed">
              {currentItem.question}
            </h3>
            {currentItem.questionEn && (
              <p className="text-sm text-muted-foreground mt-2 italic">
                &quot;{currentItem.questionEn}&quot;
              </p>
            )}
          </div>

          {/* Hint */}
          {currentItem.hint && !showResult && (
            <div>
              {!showHint ? (
                <button
                  onClick={() => setShowHint(true)}
                  className="flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-700"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  查看提示
                </button>
              ) : (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">{currentItem.hint}</p>
                </div>
              )}
            </div>
          )}

          {/* Options (for vocabulary & grammar) */}
          {(currentItem.type === 'vocabulary' || currentItem.type === 'grammar') && currentItem.options && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentItem.options.map((option) => {
                const isSelected = selectedAnswer === option;
                const isCorrectOption = option === currentItem.correctAnswer;
                let optionStyle = 'bg-white border-border hover:border-sky-300 hover:bg-sky-50';

                if (showResult) {
                  if (isCorrectOption) {
                    optionStyle = 'bg-emerald-50 border-emerald-300 text-emerald-700';
                  } else if (isSelected && !isCorrectOption) {
                    optionStyle = 'bg-red-50 border-red-300 text-red-700';
                  } else {
                    optionStyle = 'bg-slate-50 border-border opacity-50';
                  }
                }

                return (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    disabled={showResult}
                    className={cn(
                      'flex items-center gap-3 p-3.5 rounded-xl border text-sm font-medium text-left transition-all',
                      optionStyle,
                      !showResult && 'cursor-pointer'
                    )}
                  >
                    <span className="flex-1">{option}</span>
                    {showResult && isCorrectOption && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    )}
                    {showResult && isSelected && !isCorrectOption && (
                      <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Speaking input */}
          {currentItem.type === 'speaking' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-50 border border-purple-100">
                <Mic className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-purple-700">请用英语作答，然后提交对比参考答案</span>
              </div>
              <textarea
                value={userSpeakingText}
                onChange={(e) => setUserSpeakingText(e.target.value)}
                placeholder="在这里输入你的英语回答..."
                className="w-full p-3 rounded-xl border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100 resize-none h-24 transition-all"
              />
              {!showResult && (
                <Button
                  onClick={() => handleAnswer(userSpeakingText || '')}
                  disabled={!userSpeakingText.trim()}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  提交答案
                </Button>
              )}
              {showResult && (
                <div className="p-4 rounded-xl bg-slate-50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">参考答案：</p>
                  <p className="text-sm text-foreground italic">
                    {currentItem.correctAnswer}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {showResult && (
            <div className={cn(
              'p-4 rounded-xl border',
              isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
            )}>
              <div className="flex items-center gap-2 mb-2">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-semibold text-emerald-700">回答正确！</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-semibold text-red-700">回答错误</span>
                  </>
                )}
              </div>
              {currentItem.explanation && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {currentItem.explanation}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {showResult && !showExplanation && currentItem.explanation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExplanation(true)}
              >
                <Lightbulb className="w-4 h-4 mr-1" />
                查看解析
              </Button>
            )}
            <div className="flex-1" />
            {showResult && (
              <Button
                onClick={handleNext}
                className="bg-sky-500 hover:bg-sky-600 text-white"
              >
                下一题
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
