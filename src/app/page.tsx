'use client';

import {
  BookOpen,
  Flame,
  Trophy,
  Clock,
  TrendingUp,
  Star,
  ArrowRight,
  Zap,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import { courses, learningStats, recommendedCourses, levelLabels, levelColors } from '@/lib/data';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  const stats = learningStats;
  const recommended = recommendedCourses
    .map((id) => courses.find((c) => c.id === id))
    .filter(Boolean);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
      {/* Welcome Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-6 md:p-8 border border-sky-100">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Good morning, Explorer! 👋
              </h1>
              <p className="text-muted-foreground mt-2 text-sm md:text-base">
                今天又是进步的一天，继续你的英语探索之旅吧！
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-sm">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="font-semibold text-foreground">{stats.streakDays}</span>
                  <span className="text-muted-foreground">天连续学习</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Zap className="w-4 h-4 text-sky-500" />
                  <span className="font-semibold text-foreground">{stats.wordsLearned}</span>
                  <span className="text-muted-foreground">词汇已掌握</span>
                </div>
              </div>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-medium text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-500/20 shrink-0"
            >
              <BookOpen className="w-4 h-4" />
              继续学习
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 text-6xl opacity-10 select-none">🏝️</div>
        <div className="absolute bottom-4 right-20 text-4xl opacity-10 select-none">🌊</div>
      </section>

      {/* Stats Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={<Clock className="w-5 h-5 text-sky-500" />}
          label="今日学习"
          value={`${stats.todayStudyTime}分钟`}
          trend="+15%"
          bgColor="bg-sky-50"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-emerald-500" />}
          label="已完成课程"
          value={`${stats.coursesCompleted}门`}
          trend="+1"
          bgColor="bg-emerald-50"
        />
        <StatCard
          icon={<Target className="w-5 h-5 text-orange-500" />}
          label="掌握词汇"
          value={`${stats.wordsLearned}个`}
          trend="+28"
          bgColor="bg-orange-50"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-purple-500" />}
          label="测试均分"
          value={`${Math.round(stats.testScores.reduce((a, b) => a + b.score, 0) / stats.testScores.length)}分`}
          trend="+5"
          bgColor="bg-purple-50"
        />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Study Chart */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-border p-5 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-foreground">本周学习时长</h2>
              <p className="text-sm text-muted-foreground mt-0.5">每日学习时间统计</p>
            </div>
            <div className="flex items-center gap-1 text-sm text-emerald-600 font-medium">
              <TrendingUp className="w-4 h-4" />
              <span>+12%</span>
            </div>
          </div>
          <WeeklyChart data={stats.weeklyData} />
        </section>

        {/* Quick Actions */}
        <section className="bg-white rounded-2xl border border-border p-5 md:p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">快速开始</h2>
          <div className="space-y-3">
            <QuickAction
              icon="📝"
              title="每日单词"
              desc="复习20个核心词汇"
              href="/practice"
              color="bg-sky-50 hover:bg-sky-100"
            />
            <QuickAction
              icon="🎧"
              title="听力训练"
              desc="15分钟精听练习"
              href="/practice"
              color="bg-emerald-50 hover:bg-emerald-100"
            />
            <QuickAction
              icon="💬"
              title="口语打卡"
              desc="完成今日口语任务"
              href="/practice"
              color="bg-orange-50 hover:bg-orange-100"
            />
            <QuickAction
              icon="🏆"
              title="挑战活动"
              desc="7天词汇打卡进行中"
              href="/community"
              color="bg-purple-50 hover:bg-purple-100"
            />
            <QuickAction
              icon="⌨️"
              title="打字练习"
              desc="探趣岛风格指法训练"
              href="/typing"
              color="bg-indigo-50 hover:bg-indigo-100"
            />
          </div>
        </section>
      </div>

      {/* Recommended Courses */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">为你推荐</h2>
            <p className="text-sm text-muted-foreground mt-0.5">根据你的学习历史精心推荐</p>
          </div>
          <Link
            href="/courses"
            className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1"
          >
            查看全部 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommended.map((course) => course && (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="bg-white rounded-2xl border border-border p-5 md:p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">最近学习</h2>
        <div className="space-y-3">
          {courses
            .filter((c) => c.completedLessons > 0)
            .slice(0, 3)
            .map((course) => (
              <div
                key={course.id}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="text-2xl">{course.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {course.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    已完成 {course.completedLessons}/{course.lessons} 课时
                  </p>
                  <Progress
                    value={(course.completedLessons / course.lessons) * 100}
                    className="h-1.5 mt-2"
                  />
                </div>
                <Badge className={levelColors[course.level]} variant="secondary">
                  {levelLabels[course.level]}
                </Badge>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-4 hover:shadow-sm transition-shadow">
      <div className={`inline-flex p-2 rounded-xl ${bgColor} mb-3`}>{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-end justify-between mt-1">
        <p className="text-lg md:text-xl font-bold text-foreground">{value}</p>
        <span className="text-[10px] text-emerald-600 font-medium">{trend}</span>
      </div>
    </div>
  );
}

function WeeklyChart({ data }: { data: { day: string; minutes: number }[] }) {
  const maxMinutes = Math.max(...data.map((d) => d.minutes));

  return (
    <div className="flex items-end gap-2 md:gap-3 h-40">
      {data.map((item, index) => {
        const height = (item.minutes / maxMinutes) * 100;
        const isToday = index === data.length - 1;
        return (
          <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-medium">
              {item.minutes}m
            </span>
            <div className="w-full relative rounded-t-lg overflow-hidden bg-slate-100" style={{ height: '120px' }}>
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
  );
}

function QuickAction({
  icon,
  title,
  desc,
  href,
  color,
}: {
  icon: string;
  title: string;
  desc: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 p-3 rounded-xl ${color} transition-all hover:-translate-y-0.5`}
    >
      <span className="text-xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </Link>
  );
}

function CourseCard({
  course,
}: {
  course: (typeof courses)[0];
}) {
  const progress = (course.completedLessons / course.lessons) * 100;

  return (
    <Link
      href={`/courses/${course.id}`}
      className="group bg-white rounded-2xl border border-border overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="h-32 bg-gradient-to-br from-sky-50 to-emerald-50 flex items-center justify-center relative">
        <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
          {course.icon}
        </span>
        <Badge
          className={`absolute top-3 right-3 ${levelColors[course.level]}`}
          variant="secondary"
        >
          {levelLabels[course.level]}
        </Badge>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-foreground text-sm group-hover:text-sky-600 transition-colors">
          {course.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">{course.titleEn}</p>
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
          {course.description}
        </p>
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {course.rating}
          </span>
          <span>{course.lessons}课时</span>
          <span>{course.students}人在学</span>
        </div>
        {progress > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>学习进度</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
      </div>
    </Link>
  );
}
