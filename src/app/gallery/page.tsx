'use client';

// 词库 / 课程选择页
// 数据源为 wordbanks/index.json 索引 + 各词库 JSON 内容
// 分「PEP 单词词库」「句子课程」两组，点击「开始练习」记录选课并回到首页落地即练

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Play, CheckCircle2, MessageSquare, Library } from 'lucide-react';
import { wordBankIndex, type WordBankMeta } from '@/lib/wordbank';
import { getSelectedLessonId, setSelectedLessonId } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// 主题色循环：与项目三主色一致
const THEME_COLORS = [
  {
    // 海洋青 sky
    grad: 'from-sky-400 to-sky-600',
    ring: 'ring-sky-500',
    badge: 'bg-sky-100 text-sky-700',
    hover: 'hover:border-sky-300',
  },
  {
    // 薄荷绿 emerald
    grad: 'from-emerald-400 to-emerald-600',
    ring: 'ring-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
    hover: 'hover:border-emerald-300',
  },
  {
    // 珊瑚橙 orange
    grad: 'from-orange-400 to-orange-600',
    ring: 'ring-orange-500',
    badge: 'bg-orange-100 text-orange-700',
    hover: 'hover:border-orange-300',
  },
];

export default function GalleryPage() {
  const router = useRouter();
  // 当前选中课程 id（SSR 安全：挂载后读取）
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedId(getSelectedLessonId());
  }, []);

  // 选课并回到首页练习
  const handleStart = (id: string) => {
    setSelectedLessonId(id);
    router.push('/');
  };

  const wordBanks = wordBankIndex.filter((b) => b.type === 'word');
  const sentenceBanks = wordBankIndex.filter((b) => b.type === 'sentence');

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
      {/* 顶部返回首页 */}
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/">
            <ArrowLeft className="size-4" />
            返回练习
          </Link>
        </Button>
      </div>

      {/* 标题区 */}
      <div className="mb-8 flex items-start gap-3">
        <div className="rounded-2xl bg-sky-100 p-3 text-sky-600">
          <BookOpen className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">选择课程</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            从下方词库挑选单词词库或句子课程，点击「开始练习」即可回到打字界面
          </p>
        </div>
      </div>

      {/* PEP 单词词库 */}
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
        <Library className="size-5 text-sky-600" />
        PEP 单词词库
      </h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {wordBanks.map((bank, idx) => (
          <BankCard
            key={bank.id}
            bank={bank}
            idx={idx}
            isSelected={selectedId === bank.id}
            onStart={handleStart}
          />
        ))}
      </div>

      {/* 句子课程 */}
      <h2 className="mb-4 mt-10 flex items-center gap-2 text-lg font-bold text-slate-800">
        <MessageSquare className="size-5 text-emerald-600" />
        句子课程
      </h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {sentenceBanks.map((bank, idx) => (
          <BankCard
            key={bank.id}
            bank={bank}
            idx={idx}
            isSelected={selectedId === bank.id}
            onStart={handleStart}
          />
        ))}
      </div>

      {/* 空数据兜底 */}
      {wordBankIndex.length === 0 && (
        <div className="rounded-2xl border border-dashed bg-slate-50 p-12 text-center">
          <p className="text-muted-foreground">暂无课程，请稍后再来</p>
        </div>
      )}
    </div>
  );
}

// 词库/课程卡片
function BankCard({
  bank,
  idx,
  isSelected,
  onStart,
}: {
  bank: WordBankMeta;
  idx: number;
  isSelected: boolean;
  onStart: (id: string) => void;
}) {
  const theme = THEME_COLORS[idx % THEME_COLORS.length];
  const isWord = bank.type === 'word';
  const unitLabel = isWord ? `${bank.count} 词` : `${bank.count} 句`;

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-lg',
        theme.hover,
        isSelected && `ring-2 ${theme.ring}`
      )}
    >
      {/* 主题色渐变头部 */}
      <div className={cn('h-2 bg-gradient-to-r', theme.grad)} />

      <div className="flex flex-1 flex-col p-5">
        {/* 序号 + 当前角标 */}
        <div className="mb-3 flex items-center justify-between">
          <span
            className={cn(
              'inline-flex size-8 items-center justify-center rounded-full text-sm font-bold',
              theme.badge
            )}
          >
            {idx + 1}
          </span>
          {isSelected && (
            <Badge className={cn('gap-1', theme.badge)} variant="secondary">
              <CheckCircle2 className="size-3" />
              当前
            </Badge>
          )}
        </div>

        {/* 标题：中文主 / 英文副 */}
        <h3 className="text-lg font-bold text-slate-800">{bank.titleCn}</h3>
        <p className="text-sm font-medium text-muted-foreground">{bank.titleEn}</p>

        {/* 数量 + 年级徽章 */}
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          {isWord ? <Library className="size-3.5" /> : <MessageSquare className="size-3.5" />}
          共 {unitLabel}
          {bank.grade && (
            <Badge variant="secondary" className="text-[10px]">
              {bank.grade}
            </Badge>
          )}
        </div>

        {/* 预览：词库为前 3 词，句子课程为首句 */}
        {bank.preview && (
          <div className="mt-4 rounded-xl bg-slate-50 p-3">
            <p className="font-mono text-sm text-slate-700">{bank.preview}</p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="mt-auto pt-5">
          <Button
            onClick={() => onStart(bank.id)}
            className={cn('w-full gap-2 bg-gradient-to-r text-white', theme.grad)}
          >
            <Play className="size-4" />
            开始练习
          </Button>
        </div>
      </div>
    </div>
  );
}
