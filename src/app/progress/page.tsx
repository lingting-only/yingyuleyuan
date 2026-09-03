'use client';

// 学习进度页：完全使用 localStorage 持久化的真实用户数据渲染
// 新用户首次打开显示 0 / 空状态，不展示任何 mock 数据

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Clock,
  Target,
  Trophy,
  Flame,
  TrendingUp,
  Award,
  BarChart3,
  Play,
} from 'lucide-react';
import { initWordBanks, wordBankIndex } from '@/lib/wordbank';
import { getUserStats, formatWeekday, type UserStats } from '@/lib/storage';
import { TopBar } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// 全零统计对象：SSR 与客户端首次渲染一致（不调用 new Date 避免水合不一致）
const ZERO_STATS: UserStats = {
  totalStudyTime: 0,
  totalErrors: 0,
  completedSentences: [],
  completedByLesson: {},
  lastStudyDate: null,
  streakDays: 0,
  weeklyMinutes: [],
  recentRecords: [],
};

export default function ProgressPage() {
  const [statsState, setStatsState] = useState<UserStats | null>(null);
  // 词库索引：挂载后异步加载（成就解锁与课程完成度依赖 count）
  const [banks, setBanks] = useState(wordBankIndex);

  // 挂载后读取 localStorage 真实数据 + 加载词库索引
  useEffect(() => {
    setStatsState(getUserStats());
    initWordBanks().then(() => setBanks([...wordBankIndex]));
  }, []);

  const stats = statsState ?? ZERO_STATS;

  // 概览统计计算
  const totalSeconds = stats.totalStudyTime;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const studyTimeLabel =
    hours > 0 ? `${hours}小时${minutes}分钟` : `${minutes}分钟`;

  const recent = stats.recentRecords;
  const avgScore =
    recent.length > 0
      ? Math.round(recent.reduce((a, r) => a + r.accuracy, 0) / recent.length)
      : 0;

  const weekly = stats.weeklyMinutes;
  const totalMinutes = Math.round(weekly.reduce((a, w) => a + w.minutes, 0));
  const maxMin = weekly.length ? Math.max(...weekly.map((w) => w.minutes), 1) : 1;

  // 学习成就：基于真实数据动态解锁
  const achievements = [
    {
      icon: '🔥',
      title: '学习达人',
      desc: '连续学习7天',
      unlocked: stats.streakDays >= 7,
    },
    {
      icon: '📚',
      title: '课程先锋',
      desc: '完成首门课程',
      unlocked: wordBankIndex.some(
        (l) => (stats.completedByLesson[l.id]?.length ?? 0) === l.count
      ),
    },
    {
      icon: '💯',
      title: '满分王者',
      desc: '练习获得满分',
      unlocked: recent.some((r) => r.accuracy === 100),
    },
    {
      icon: '🌟',
      title: '句子大师',
      desc: '掌握30个句子',
      unlocked: stats.completedSentences.length >= 30,
    },
    {
      icon: '🎯',
      title: '精准射手',
      desc: '最近10次准确率≥95%',
      unlocked:
        recent.length >= 10 &&
        recent.slice(0, 10).every((r) => r.accuracy >= 95),
    },
    {
      icon: '🏆',
      title: '社区之星',
      desc: '获得50个赞',
      unlocked: false, // 暂无社区数据
    },
    {
      icon: '📝',
      title: '笔耕不辍',
      desc: '连续学习30天',
      unlocked: stats.streakDays >= 30,
    },
    {
      icon: '🚀',
      title: '全能选手',
      desc: '完成所有课程',
      unlocked: wordBankIndex.every(
        (l) => (stats.completedByLesson[l.id]?.length ?? 0) === l.count
      ),
    },
  ];
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  // 最近 10 次练习记录（最新在前）
  const recentTop = recent.slice(0, 10);

  return (
    <>
      {/* 全局单行顶栏：与其他页面保持一致，仅内容区切换 */}
      <TopBar />
      {/* 内容区：全宽平铺，独立滚动且隐藏滚动条 */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden w-full p-4 md:p-6 lg:p-8 space-y-6 bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">学习进度</h1>
        <p className="text-sm text-muted-foreground mt-1">
          追踪你的学习数据，见证每一步成长
        </p>
      </div>

      {/* Overview Stats：自适应平铺 */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 md:gap-4">
        <OverviewCard
          icon={<Clock className="w-5 h-5 text-sky-500" />}
          label="总学习时长"
          value={studyTimeLabel}
          bgColor="bg-sky-50 dark:bg-sky-950"
        />
        <OverviewCard
          icon={<Flame className="w-5 h-5 text-orange-500" />}
          label="连续学习"
          value={`${stats.streakDays} 天`}
          bgColor="bg-orange-50 dark:bg-orange-950"
        />
        <OverviewCard
          icon={<Target className="w-5 h-5 text-emerald-500" />}
          label="完成句子"
          value={`${stats.completedSentences.length} 句`}
          bgColor="bg-emerald-50 dark:bg-emerald-950"
        />
        <OverviewCard
          icon={<Trophy className="w-5 h-5 text-purple-500" />}
          label="练习均分"
          value={`${avgScore} 分`}
          bgColor="bg-purple-50 dark:bg-purple-950"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Weekly Study Time */}
        <section className="bg-card rounded-2xl border border-border p-5 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-foreground">本周学习时长</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                总计 {totalMinutes} 分钟
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          {weekly.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">
              暂无学习记录
            </div>
          ) : (
            <div className="flex items-end gap-2 h-44">
              {weekly.map((item, index) => {
                const height = (item.minutes / maxMin) * 100;
                const isToday = index === weekly.length - 1;
                return (
                  <div key={item.date} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {Math.round(item.minutes)}m
                    </span>
                    <div className="w-full relative rounded-t-lg overflow-hidden bg-muted" style={{ height: '130px' }}>
                      <div
                        className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-700 ${
                          isToday
                            ? 'bg-gradient-to-t from-sky-500 to-sky-400'
                            : 'bg-gradient-to-t from-sky-200 to-sky-100 dark:from-sky-800 dark:to-sky-700'
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className={`text-[11px] font-medium ${isToday ? 'text-sky-600' : 'text-muted-foreground'}`}>
                      {formatWeekday(item.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Practice Scores Trend */}
        <section className="bg-card rounded-2xl border border-border p-5 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-foreground">练习成绩趋势</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                平均 {avgScore} 分
              </p>
            </div>
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </div>
          {recentTop.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-muted-foreground">暂无练习记录</p>
              <Button asChild size="sm" className="gap-2 bg-sky-500 hover:bg-sky-600">
                <Link href="/">
                  <Play className="w-3.5 h-3.5" />
                  开始练习
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTop.map((r, index) => (
                <div key={`${r.timestamp}-${index}`} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-12 shrink-0">
                    {format(r.timestamp, 'MM/dd')}
                  </span>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2 ${
                        r.accuracy >= 85
                          ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                          : r.accuracy >= 70
                          ? 'bg-gradient-to-r from-sky-400 to-sky-500'
                          : 'bg-gradient-to-r from-orange-400 to-orange-500'
                      }`}
                      style={{ width: `${r.accuracy}%` }}
                    >
                      <span className="text-[10px] font-bold text-white">{r.accuracy}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    练习
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Typing Lessons */}
      <section className="bg-card rounded-2xl border border-border p-5 md:p-6">
        <h2 className="text-base font-bold text-foreground mb-4">打字课程</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-2">
          {banks.map((bank) => {
            const done = stats.completedByLesson[bank.id]?.length ?? 0;
            const unit = bank.type === 'word' ? '词' : '句';
            return (
              <div
                key={bank.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {bank.titleCn}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{bank.titleEn}</p>
                </div>
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  {done}/{bank.count} {unit}
                </Badge>
              </div>
            );
          })}
        </div>
      </section>

      {/* Achievements */}
      <section className="bg-card rounded-2xl border border-border p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">学习成就</h2>
          <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
            <Award className="w-3 h-3 mr-1" />
            {unlockedCount}/{achievements.length} 已解锁
          </Badge>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
          {achievements.map((a) => (
            <AchievementCard
              key={a.title}
              icon={a.icon}
              title={a.title}
              desc={a.desc}
              unlocked={a.unlocked}
            />
          ))}
        </div>
      </section>
      </div>
    </>
  );
}

function OverviewCard({
  icon,
  label,
  value,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className={`inline-flex p-2 rounded-xl ${bgColor} mb-3`}>{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-foreground mt-1">{value}</p>
    </div>
  );
}

function AchievementCard({
  icon,
  title,
  desc,
  unlocked = false,
}: {
  icon: string;
  title: string;
  desc: string;
  unlocked?: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-xl border text-center transition-all ${
        unlocked
          ? 'bg-card border-border hover:shadow-sm'
          : 'bg-muted border-transparent opacity-50'
      }`}
    >
      <span className={`text-2xl ${unlocked ? '' : 'grayscale'}`}>{icon}</span>
      <p className="text-xs font-semibold text-foreground mt-1.5">{title}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
      {unlocked && (
        <Badge variant="secondary" className="mt-1.5 text-[9px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          已解锁
        </Badge>
      )}
    </div>
  );
}
