'use client';

import { useState } from 'react';
import { Search, Filter, Star, Users, Clock, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { courses, levelLabels, levelColors } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const categories = ['全部', '口语', '语法', '词汇', '听力', '写作', '商务', '旅行', '发音', '考试'];
const levels = [
  { value: 'all', label: '全部等级' },
  { value: 'beginner', label: '入门' },
  { value: 'intermediate', label: '中级' },
  { value: 'advanced', label: '高级' },
];

export default function CoursesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');
  const [level, setLevel] = useState('all');

  const filtered = courses.filter((course) => {
    const matchSearch =
      course.title.includes(search) ||
      course.titleEn.toLowerCase().includes(search.toLowerCase()) ||
      course.description.includes(search);
    const matchCategory = category === '全部' || course.tags.includes(category);
    const matchLevel = level === 'all' || course.level === level;
    return matchSearch && matchCategory && matchLevel;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">课程中心</h1>
        <p className="text-sm text-muted-foreground mt-1">
          探索丰富的英语课程，找到最适合你的学习内容
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-border flex-1">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="搜索课程名称或关键词..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
          />
        </div>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-full md:w-[140px] bg-white">
            <SelectValue placeholder="选择等级" />
          </SelectTrigger>
          <SelectContent>
            {levels.map((l) => (
              <SelectItem key={l.value} value={l.value}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              category === cat
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-white text-muted-foreground border border-border hover:border-sky-200 hover:text-sky-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-muted-foreground text-sm">没有找到匹配的课程</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearch('');
              setCategory('全部');
              setLevel('all');
            }}
          >
            清除筛选条件
          </Button>
        </div>
      )}
    </div>
  );
}

function CourseCard({ course }: { course: (typeof courses)[0] }) {
  const progress = (course.completedLessons / course.lessons) * 100;

  return (
    <Link
      href={`/courses/${course.id}`}
      className="group bg-white rounded-2xl border border-border overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="h-28 bg-gradient-to-br from-sky-50 to-emerald-50 flex items-center justify-center relative">
        <span className="text-4xl group-hover:scale-110 transition-transform duration-300">
          {course.icon}
        </span>
        <Badge
          className={`absolute top-2.5 right-2.5 ${levelColors[course.level]}`}
          variant="secondary"
        >
          {levelLabels[course.level]}
        </Badge>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-sm text-foreground group-hover:text-sky-600 transition-colors">
          {course.title}
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">{course.titleEn}</p>
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
          {course.description}
        </p>
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {course.rating}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {course.lessons}课时
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {course.students}
          </span>
        </div>
        {progress > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>进度</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
        <div className="flex items-center gap-1 mt-3 text-[11px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>总时长 {course.duration}</span>
        </div>
      </div>
    </Link>
  );
}
