'use client';

// 词库 / 课程选择页
// 数据源为 wordbanks/index.json 索引 + 各词库 JSON 内容
// 分「PEP 单词词库」「句子课程」两组，点击「开始练习」记录选课并回到首页落地即练

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Play, CheckCircle2, MessageSquare, Library } from 'lucide-react';
import { initWordBanks, wordBankIndex, type WordBankMeta } from '@/lib/wordbank';
import { getSelectedLessonId, setSelectedLessonId } from '@/lib/storage';
import { TopBar } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// 主题色循环（10 色）：色相环均匀分布，相邻循环色色相差 ≥100°，保证区分度
// 每色提供 渐变(400→600，白字可读) / 高亮环(500) / 徽章(亮 100+700、暗 950+400) / 悬停边框(300)
// 十六进制取各色 500 基准值，便于图表等其他场景复用：
// sky #0EA5E9 rgb(14,165,233)   | orange #F97316 rgb(249,115,22)   | violet #8B5CF6 rgb(139,92,246)
// emerald #10B981 rgb(16,185,129)| rose #F43F5E rgb(244,63,94)     | teal #14B8A6 rgb(20,184,166)
// fuchsia #D946EF rgb(217,70,239)| amber #F59E0B rgb(245,158,11)   | indigo #6366F1 rgb(99,102,241)
// lime #84CC16 rgb(132,204,22)
const THEME_COLORS = [
  {
    // 海洋青 sky
    grad: 'from-sky-400 to-sky-600',
    ring: 'ring-sky-500',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
    hover: 'hover:border-sky-300',
  },
  {
    // 珊瑚橙 orange
    grad: 'from-orange-400 to-orange-600',
    ring: 'ring-orange-500',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
    hover: 'hover:border-orange-300',
  },
  {
    // 紫罗兰 violet
    grad: 'from-violet-400 to-violet-600',
    ring: 'ring-violet-500',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
    hover: 'hover:border-violet-300',
  },
  {
    // 薄荷绿 emerald
    grad: 'from-emerald-400 to-emerald-600',
    ring: 'ring-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    hover: 'hover:border-emerald-300',
  },
  {
    // 玫瑰红 rose
    grad: 'from-rose-400 to-rose-600',
    ring: 'ring-rose-500',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
    hover: 'hover:border-rose-300',
  },
  {
    // 青碧 teal
    grad: 'from-teal-400 to-teal-600',
    ring: 'ring-teal-500',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
    hover: 'hover:border-teal-300',
  },
  {
    // 品红 fuchsia
    grad: 'from-fuchsia-400 to-fuchsia-600',
    ring: 'ring-fuchsia-500',
    badge: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-400',
    hover: 'hover:border-fuchsia-300',
  },
  {
    // 琥珀金 amber
    grad: 'from-amber-400 to-amber-600',
    ring: 'ring-amber-500',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    hover: 'hover:border-amber-300',
  },
  {
    // 靛蓝 indigo
    grad: 'from-indigo-400 to-indigo-600',
    ring: 'ring-indigo-500',
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
    hover: 'hover:border-indigo-300',
  },
  {
    // 青柠 lime（渐变改用 600→800，保证白字对比度）
    grad: 'from-lime-600 to-lime-800',
    ring: 'ring-lime-600',
    badge: 'bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-400',
    hover: 'hover:border-lime-300',
  },
];

export default function GalleryPage() {
  const router = useRouter();
  // 当前选中课程 id（SSR 安全：挂载后读取）
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 词库索引：挂载后异步加载（内容来自 public/wordbanks/ 静态资源）
  const [banks, setBanks] = useState<WordBankMeta[]>([]);

  useEffect(() => {
    setSelectedId(getSelectedLessonId());
    initWordBanks().then(() => setBanks([...wordBankIndex]));
  }, []);

  // 选课并回到首页练习
  const handleStart = (id: string) => {
    setSelectedLessonId(id);
    router.push('/');
  };

  const wordBanks = banks.filter((b) => b.type === 'word');
  const sentenceBanks = banks.filter((b) => b.type === 'sentence');

  return (
    <>
      {/* 全局单行顶栏：与其他页面保持一致，仅内容区切换 */}
      <TopBar />
      {/* 内容区：全宽平铺，独立滚动且隐藏滚动条 */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden w-full px-4 py-6 md:px-6 lg:px-8 bg-gradient-to-b from-background to-muted">
      {/* 标题区 */}
      <div className="mb-8 flex items-start gap-3">
        <div className="rounded-2xl bg-sky-100 p-3 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
          <BookOpen className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">选择课程</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            从下方词库挑选单词词库或句子课程，点击「开始练习」即可回到打字界面
          </p>
        </div>
      </div>

      {/* PEP 单词词库 */}
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
        <Library className="size-5 text-sky-600" />
        PEP 单词词库
      </h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
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
      <h2 className="mb-4 mt-10 flex items-center gap-2 text-lg font-bold text-foreground">
        <MessageSquare className="size-5 text-emerald-600" />
        句子课程
      </h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
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
      {banks.length === 0 && (
        <div className="rounded-2xl border border-dashed bg-muted p-12 text-center">
          <p className="text-muted-foreground">暂无课程，请稍后再来</p>
        </div>
      )}
      </div>
    </>
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
        'group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-lg',
        theme.hover,
        isSelected && `ring-2 ${theme.ring}`
      )}
    >
      {/* 主题色渐变头部 */}
      <div className={cn('h-2 bg-gradient-to-r', theme.grad)} />

      <div className="flex flex-1 flex-col p-4">
        {/* 序号 + 当前角标 */}
        <div className="mb-2 flex items-center justify-between">
          <span
            className={cn(
              'inline-flex size-7 items-center justify-center rounded-full text-xs font-bold',
              theme.badge
            )}
          >
            {idx + 1}
          </span>
          {isSelected && (
            <Badge className={cn('gap-1 text-[10px]', theme.badge)} variant="secondary">
              <CheckCircle2 className="size-3" />
              当前
            </Badge>
          )}
        </div>

        {/* 标题：中文主 / 英文副 */}
        <h3 className="text-base font-bold text-foreground">{bank.titleCn}</h3>
        <p className="text-xs font-medium text-muted-foreground">{bank.titleEn}</p>

        {/* 数量 + 年级徽章 */}
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          {isWord ? <Library className="size-3.5" /> : <MessageSquare className="size-3.5" />}
          共 {unitLabel}
          {bank.grade && (
            <Badge variant="secondary" className="text-[10px]">
              {bank.grade}
            </Badge>
          )}
        </div>

        {/* 预览：词库为前 3 词，句子课程为首句（单行截断，悬停看全文） */}
        {bank.preview && (
          <div className="mt-3 rounded-lg bg-muted px-2.5 py-2" title={bank.preview}>
            <p className="truncate font-mono text-xs text-foreground">{bank.preview}</p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="mt-auto pt-4">
          <Button
            size="sm"
            onClick={() => onStart(bank.id)}
            className={cn('w-full gap-2 bg-gradient-to-r text-white', theme.grad)}
          >
            <Play className="size-3.5" />
            开始练习
          </Button>
        </div>
      </div>
    </div>
  );
}
