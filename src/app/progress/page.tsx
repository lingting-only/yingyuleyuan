'use client';

import {
  Clock,
  BookOpen,
  Target,
  Trophy,
  Flame,
  TrendingUp,
  Award,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { learningStats, courses } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function ProgressPage() {
  const stats = learningStats;
  const avgScore = Math.round(
    stats.testScores.reduce((a, b) => a + b.score, 0) / stats.testScores.length
  );
  const totalMinutes = stats.weeklyData.reduce((a, b) => a + b.minutes, 0);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">学习进度</h1>
        <p className="text-sm text-muted-foreground mt-1">
          追踪你的学习数据，见证每一步成长
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <OverviewCard
          icon={<Clock className="w-5 h-5 text-sky-500" />}
          label="总学习时长"
          value={`${Math.floor(stats.totalStudyTime / 60)}小时${stats.totalStudyTime % 60}分钟`}
          bgColor="bg-sky-50"
        />
        <OverviewCard
          icon={<Flame className="w-5 h-5 text-orange-500" />}
          label="连续学习"
          value={`${stats.streakDays} 天`}
          bgColor="bg-orange-50"
        />
        <OverviewCard
          icon={<Target className="w-5 h-5 text-emerald-500" />}
          label="掌握词汇"
          value={`${stats.wordsLearned} 个`}
          bgColor="bg-emerald-50"
        />
        <OverviewCard
          icon={<Trophy className="w-5 h-5 text-purple-500" />}
          label="测试均分"
          value={`${avgScore} 分`}
          bgColor="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Study Time */}
        <section className="bg-white rounded-2xl border border-border p-5 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-foreground">本周学习时长</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                总计 {totalMinutes} 分钟
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" />
              +12%
            </div>
          </div>
          <div className="flex items-end gap-2 h-44">
            {stats.weeklyData.map((item, index) => {
              const maxMin = Math.max(...stats.weeklyData.map((d) => d.minutes));
              const height = (item.minutes / maxMin) * 100;
              const isToday = index === stats.weeklyData.length - 1;
              return (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {item.minutes}m
                  </span>
                  <div className="w-full relative rounded-t-lg overflow-hidden bg-slate-100" style={{ height: '130px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-700 ${
                        isToday
                          ? 'bg-gradient-to-t from-sky-500 to-sky-400'
                          : 'bg-gradient-to-t from-sky-200 to-sky-100'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-medium ${isToday ? 'text-sky-600' : 'text-muted-foreground'}`}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Test Scores Trend */}
        <section className="bg-white rounded-2xl border border-border p-5 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-foreground">测试成绩趋势</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                平均 {avgScore} 分
              </p>
            </div>
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {stats.testScores.map((test, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-12 shrink-0">{test.date}</span>
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2 ${
                      test.score >= 85
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                        : test.score >= 70
                        ? 'bg-gradient-to-r from-sky-400 to-sky-500'
                        : 'bg-gradient-to-r from-orange-400 to-orange-500'
                    }`}
                    style={{ width: `${test.score}%` }}
                  >
                    <span className="text-[10px] font-bold text-white">{test.score}</span>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {test.type}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Course Progress */}
      <section className="bg-white rounded-2xl border border-border p-5 md:p-6">
        <h2 className="text-base font-bold text-foreground mb-4">课程完成度</h2>
        <div className="space-y-4">
          {courses
            .filter((c) => c.completedLessons > 0)
            .map((course) => {
              const progress = Math.round((course.completedLessons / course.lessons) * 100);
              return (
                <div key={course.id} className="flex items-center gap-4">
                  <span className="text-2xl">{course.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-foreground truncate">
                        {course.title}
                      </h3>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {course.completedLessons}/{course.lessons} 课时
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  <span className="text-sm font-bold text-foreground w-12 text-right shrink-0">
                    {progress}%
                  </span>
                </div>
              );
            })}
        </div>
      </section>

      {/* Achievements */}
      <section className="bg-white rounded-2xl border border-border p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">学习成就</h2>
          <Badge variant="secondary" className="bg-amber-50 text-amber-700">
            <Award className="w-3 h-3 mr-1" />
            {3}/{8} 已解锁
          </Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <AchievementCard
            icon="🔥"
            title="学习达人"
            desc="连续学习7天"
            unlocked
          />
          <AchievementCard
            icon="📚"
            title="课程先锋"
            desc="完成首门课程"
            unlocked
          />
          <AchievementCard
            icon="💯"
            title="满分王者"
            desc="测试获得满分"
            unlocked
          />
          <AchievementCard
            icon="🌟"
            title="词汇大师"
            desc="掌握1000个词汇"
          />
          <AchievementCard
            icon="🎯"
            title="精准射手"
            desc="连续答对10题"
          />
          <AchievementCard
            icon="🏆"
            title="社区之星"
            desc="获得50个赞"
          />
          <AchievementCard
            icon="📝"
            title="笔耕不辍"
            desc="完成30天打卡"
          />
          <AchievementCard
            icon="🚀"
            title="全能选手"
            desc="完成所有类型练习"
          />
        </div>
      </section>
    </div>
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
    <div className="bg-white rounded-2xl border border-border p-4">
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
          ? 'bg-white border-border hover:shadow-sm'
          : 'bg-slate-50 border-transparent opacity-50'
      }`}
    >
      <span className={`text-2xl ${unlocked ? '' : 'grayscale'}`}>{icon}</span>
      <p className="text-xs font-semibold text-foreground mt-1.5">{title}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
      {unlocked && (
        <Badge variant="secondary" className="mt-1.5 text-[9px] bg-emerald-50 text-emerald-600">
          已解锁
        </Badge>
      )}
    </div>
  );
}
