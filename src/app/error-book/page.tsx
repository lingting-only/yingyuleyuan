'use client';

// 错题本页
// 记录打字练习中出错过的句子：完成时若 errors>0 自动入库
// 参照 qwerty-learner 的 error-book：可重练错题、可单条移除、可清空

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  BookX,
  Play,
  Trash2,
  X,
  Volume2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { findPracticeById, initWordBanks } from '@/lib/wordbank';
import { TopBar } from '@/components/layout/header';
import {
  getErrorBook,
  removeError,
  clearErrorBook,
  setErrorPractice,
  type ErrorBookRecord,
} from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export default function ErrorBookPage() {
  const router = useRouter();
  // 错题本记录：挂载后读取，SSR 安全
  const [records, setRecords] = useState<ErrorBookRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // 词库内容改为运行时 fetch，需先加载完成才能反查错题详情
    initWordBanks().finally(() => {
      setRecords(getErrorBook());
      setLoaded(true);
    });
  }, []);

  // 按 lastWrongAt 倒序，并合并句子详情
  const mergedList = useMemo(() => {
    return [...records]
      .sort((a, b) => b.lastWrongAt - a.lastWrongAt)
      .map((r) => ({ record: r, sentence: findPracticeById(r.id) }))
      .filter((x) => x.sentence); // 仅展示仍可找到详情的句子
  }, [records, loaded]);

  // 本地刷新
  const refresh = useCallback(() => setRecords(getErrorBook()), []);

  // 单条移除
  const handleRemove = (id: string) => {
    removeError(id);
    refresh();
  };

  // 练习错题：写入错题练习态并回到首页错题模式
  const handlePractice = () => {
    const ids = mergedList.map((x) => x.record.id);
    if (ids.length === 0) return;
    setErrorPractice(ids);
    router.push('/?mode=error');
  };

  // 清空错题本
  const handleClear = () => {
    clearErrorBook();
    refresh();
  };

  // 朗读
  const handleRead = (text: string) => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.8;
      speechSynthesis.speak(u);
    }
  };

  const empty = loaded && mergedList.length === 0;

  return (
    <>
      {/* 全局单行顶栏：与其他页面保持一致，仅内容区切换 */}
      <TopBar />
      {/* 内容区：全宽平铺，独立滚动且隐藏滚动条 */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden w-full px-4 py-6 md:px-6 lg:px-8 bg-gradient-to-b from-background to-muted">
      {/* 标题 + 操作 */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-red-100 p-3 text-red-600 dark:bg-red-950 dark:text-red-400">
            <BookX className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">错题本</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mergedList.length > 0
                ? `共 ${mergedList.length} 道错题，零错完成会自动移除`
                : '练习中出错的句子会自动记录到这里'}
            </p>
          </div>
        </div>

        {/* 顶部操作：仅在有错题时显示 */}
        {mergedList.length > 0 && (
          <div className="flex flex-shrink-0 gap-2">
            <Button onClick={handlePractice} className="gap-2 bg-sky-500 hover:bg-sky-600">
              <Play className="size-4" />
              练习错题
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2 text-red-600 hover:text-red-700">
                  <Trash2 className="size-4" />
                  清空
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认清空错题本？</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作将移除全部 {mergedList.length} 条错题记录，无法撤销。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClear}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    清空
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* 空状态 */}
      {empty && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted py-16 text-center">
          <div className="mb-3 rounded-full bg-emerald-100 p-4 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <CheckCircle2 className="size-8" />
          </div>
          <p className="text-lg font-semibold text-foreground">还没有错题</p>
          <p className="mt-1 text-sm text-muted-foreground">去练习吧，出错会自动记录到这里</p>
          <Button asChild className="mt-5 gap-2 bg-sky-500 hover:bg-sky-600">
            <Link href="/">
              <Play className="size-4" />
              开始练习
            </Link>
          </Button>
        </div>
      )}

      {/* 错题列表：自适应平铺 */}
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(420px,100%),1fr))] gap-3">
        {mergedList.map(({ record, sentence }) => {
          if (!sentence) return null;
          const phoneticText = sentence.phonetics
            ?.map((p) => `${p.text} ${p.phonetic}`)
            .join('  ');

          return (
            <li
              key={record.id}
              className="group rounded-2xl border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {/* 英文句 */}
                  <p className="font-mono text-lg font-semibold text-foreground">
                    {sentence.sentence}
                  </p>
                  {/* 翻译 */}
                  <p className="mt-1 text-sm text-muted-foreground">{sentence.translation}</p>
                  {/* 音标 */}
                  {phoneticText && (
                    <p className="mt-2 font-mono text-xs text-muted-foreground">{phoneticText}</p>
                  )}
                </div>

                {/* 右侧：徽章 + 操作 */}
                <div className="flex flex-shrink-0 flex-col items-end gap-2">
                  <Badge variant="secondary" className="gap-1 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                    <AlertTriangle className="size-3" />
                    错 {record.errorCount} 次
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(record.lastWrongAt, { addSuffix: true, locale: zhCN })}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-sky-600"
                      onClick={() => handleRead(sentence.sentence)}
                      aria-label="朗读"
                    >
                      <Volume2 className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-red-600"
                      onClick={() => handleRemove(record.id)}
                      aria-label="移除"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      </div>
    </>
  );
}
