'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  Headphones,
  FileText,
  CheckCircle2,
  Circle,
  Clock,
  Users,
  Star,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { courses, lessons, levelLabels, levelColors } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, React.ReactNode> = {
  video: <Play className="w-4 h-4 text-sky-500" />,
  audio: <Headphones className="w-4 h-4 text-emerald-500" />,
  text: <FileText className="w-4 h-4 text-orange-500" />,
};

const typeLabels: Record<string, string> = {
  video: '视频课程',
  audio: '音频课程',
  text: '文本课程',
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const course = courses.find((c) => c.id === courseId);
  const courseLessons = lessons.filter((l) => l.courseId === courseId);
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons'>('overview');

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-4xl mb-3">📚</div>
        <p className="text-muted-foreground">课程未找到</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/courses')}>
          返回课程列表
        </Button>
      </div>
    );
  }

  const progress = (course.completedLessons / course.lessons) * 100;
  const completedCount = courseLessons.filter((l) => l.completed).length;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        href="/courses"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回课程列表
      </Link>

      {/* Course Header */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="h-40 md:h-48 bg-gradient-to-br from-sky-50 via-white to-emerald-50 flex items-center justify-center relative">
          <span className="text-7xl">{course.icon}</span>
          <Badge
            className={`absolute top-4 right-4 ${levelColors[course.level]}`}
            variant="secondary"
          >
            {levelLabels[course.level]}
          </Badge>
        </div>
        <div className="p-5 md:p-6">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">{course.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{course.titleEn}</p>
          <p className="text-sm text-muted-foreground mt-3">{course.description}</p>

          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {course.rating} 评分
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {course.lessons} 课时
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {course.duration}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {course.students} 人在学
            </span>
          </div>

          {progress > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>学习进度</span>
                <span>{Math.round(progress)}% ({completedCount}/{courseLessons.length} 课时)</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="flex gap-3 mt-5">
            <Button className="bg-sky-500 hover:bg-sky-600 text-white">
              {progress > 0 ? '继续学习' : '开始学习'}
            </Button>
            <Button variant="outline">收藏课程</Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-border p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
            activeTab === 'overview'
              ? 'bg-sky-50 text-sky-700'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          课程概览
        </button>
        <button
          onClick={() => setActiveTab('lessons')}
          className={cn(
            'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
            activeTab === 'lessons'
              ? 'bg-sky-50 text-sky-700'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          课程目录
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-2xl border border-border p-5 md:p-6 space-y-5">
          <div>
            <h3 className="font-bold text-foreground mb-2">课程介绍</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {course.description} 本课程由资深英语教学团队精心打造，结合多媒体教学方式，
              通过视频讲解、音频练习和文本阅读，帮助你全面提升英语能力。课程内容丰富有趣，
              配有大量实例和练习，让你在实践中掌握英语。
            </p>
          </div>
          <div>
            <h3 className="font-bold text-foreground mb-3">你将学到</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                '掌握核心词汇和短语',
                '提升听说读写综合能力',
                '理解语法结构和用法',
                '培养英语思维和表达习惯',
                '增强实际场景应用能力',
                '建立系统的知识体系',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-foreground mb-2">适合人群</h3>
            <p className="text-sm text-muted-foreground">
              本课程适合{levelLabels[course.level]}水平的学习者，无论你是想系统提升英语能力，
              还是针对特定场景进行强化训练，都能在这里找到合适的内容。
            </p>
          </div>
        </div>
      )}

      {activeTab === 'lessons' && (
        <div className="bg-white rounded-2xl border border-border p-5 md:p-6">
          <div className="space-y-2">
            {courseLessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className={cn(
                  'flex items-center gap-4 p-3 rounded-xl transition-colors cursor-pointer',
                  lesson.completed
                    ? 'bg-emerald-50/50 hover:bg-emerald-50'
                    : 'hover:bg-slate-50'
                )}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-xs font-bold text-muted-foreground shrink-0">
                  {lesson.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={cn(
                    'text-sm font-medium',
                    lesson.completed ? 'text-emerald-700' : 'text-foreground'
                  )}>
                    {index + 1}. {lesson.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{lesson.titleEn}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {typeIcons[lesson.type]}
                    <span className="hidden sm:inline">{typeLabels[lesson.type]}</span>
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {lesson.duration}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
