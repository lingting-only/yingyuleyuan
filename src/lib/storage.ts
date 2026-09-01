// localStorage 持久化层：集中管理选课、错题本、错题练习态、用户学习统计
// 供首页 / 词库页 / 错题本页 / 进度页共享，避免 key 与结构漂移

import { differenceInCalendarDays, format, subDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const SELECTED_LESSON_KEY = 'eng-selected-lesson';
const ERROR_BOOK_KEY = 'eng-error-book';
const ERROR_PRACTICE_KEY = 'eng-error-practice';
const USER_STATS_KEY = 'eng-user-stats';

export interface ErrorBookRecord {
  id: string; // 句子 id，如 t1-1
  errorCount: number;
  lastWrongAt: number; // 时间戳
}

const isClient = () => typeof window !== 'undefined';

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const safeRead = (key: string): string | null => {
  if (!isClient()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeWrite = (key: string, value: string): void => {
  if (!isClient()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // 忽略隐私模式或配额异常
  }
};

const safeRemove = (key: string): void => {
  if (!isClient()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // 忽略
  }
};

// ===== 选课 =====
export function getSelectedLessonId(): string | null {
  const raw = safeRead(SELECTED_LESSON_KEY);
  if (!raw) return null;
  try {
    // 存储时为 JSON.stringify(id)，读取需反序列化还原纯字符串
    return JSON.parse(raw) as string;
  } catch {
    return raw; // 兼容旧的无引号存储
  }
}

export function setSelectedLessonId(id: string): void {
  safeWrite(SELECTED_LESSON_KEY, JSON.stringify(id));
}

// ===== 各词库学习进度（续学用）=====
const BANK_PROGRESS_KEY = 'eng-bank-progress';

// 读取各词库学习进度：bankId -> 已完成数（下次进入时的起始索引）
export function getBankProgress(): Record<string, number> {
  return safeParse<Record<string, number>>(safeRead(BANK_PROGRESS_KEY), {});
}

// 记录某词库学习进度
export function setBankProgress(bankId: string, index: number): void {
  const progress = getBankProgress();
  progress[bankId] = index;
  safeWrite(BANK_PROGRESS_KEY, JSON.stringify(progress));
}

// ===== 错题本 =====
export function getErrorBook(): ErrorBookRecord[] {
  return safeParse<ErrorBookRecord[]>(safeRead(ERROR_BOOK_KEY), []);
}

// 完成一句且出错时调用：upsert，errorCount++，更新时间戳
export function addError(sentenceId: string): void {
  const list = getErrorBook();
  const now = Date.now();
  const idx = list.findIndex((r) => r.id === sentenceId);
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      errorCount: Math.min(list[idx].errorCount + 1, 99),
      lastWrongAt: now,
    };
  } else {
    list.push({ id: sentenceId, errorCount: 1, lastWrongAt: now });
  }
  safeWrite(ERROR_BOOK_KEY, JSON.stringify(list));
}

// 零错完成且已在错题本时调用：掌握即清
export function removeError(sentenceId: string): void {
  const list = getErrorBook().filter((r) => r.id !== sentenceId);
  safeWrite(ERROR_BOOK_KEY, JSON.stringify(list));
}

export function clearErrorBook(): void {
  safeRemove(ERROR_BOOK_KEY);
}

// ===== 错题练习态（"练习错题"时写入，首页消费后清除）=====
export function getErrorPracticeIds(): string[] {
  return safeParse<string[]>(safeRead(ERROR_PRACTICE_KEY), []);
}

export function setErrorPractice(ids: string[]): void {
  safeWrite(ERROR_PRACTICE_KEY, JSON.stringify(ids));
}

export function clearErrorPractice(): void {
  safeRemove(ERROR_PRACTICE_KEY);
}

// ===== 用户学习统计 =====

// 单次练习完成记录（用于"练习成绩趋势"图与均分计算）
export interface PracticeRecord {
  sentenceId: string;
  lessonId: string;
  wpm: number;
  accuracy: number; // 0-100
  errors: number;
  duration: number; // 秒
  timestamp: number;
}

// 用户累计学习统计
export interface UserStats {
  totalStudyTime: number; // 累计秒
  totalErrors: number;
  completedSentences: string[]; // 已完成句子 id（去重）
  completedByLesson: Record<string, string[]>; // lessonId -> 句子 id 数组（去重）
  lastStudyDate: string | null; // 'yyyy-MM-dd'
  streakDays: number;
  weeklyMinutes: { date: string; minutes: number }[]; // 最近 7 天，含今天，今天在末尾
  recentRecords: PracticeRecord[]; // 最近 30 条，按 timestamp 倒序
}

// 返回 'yyyy-MM-dd' 格式的今天字符串
const todayStr = (d: Date = new Date()): string => format(d, 'yyyy-MM-dd');

// 初始化最近 7 天窗口：今天在末尾，全部 minutes=0
const buildInitialWeekly = (): { date: string; minutes: number }[] => {
  const today = new Date();
  const list: { date: string; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    list.push({ date: todayStr(subDays(today, i)), minutes: 0 });
  }
  return list;
};

// 空统计对象（新用户）
const emptyStats = (): UserStats => ({
  totalStudyTime: 0,
  totalErrors: 0,
  completedSentences: [],
  completedByLesson: {},
  lastStudyDate: null,
  streakDays: 0,
  weeklyMinutes: buildInitialWeekly(),
  recentRecords: [],
});

// 读取用户统计；无记录时返回初始化对象
export function getUserStats(): UserStats {
  const raw = safeRead(USER_STATS_KEY);
  if (!raw) return emptyStats();
  const parsed = safeParse<Partial<UserStats>>(raw, {});
  // 合并兜底：旧数据可能缺字段（如 weeklyMinutes），用空对象补
  const base = emptyStats();
  return {
    ...base,
    ...parsed,
    weeklyMinutes:
      Array.isArray(parsed.weeklyMinutes) && parsed.weeklyMinutes.length === 7
        ? parsed.weeklyMinutes
        : base.weeklyMinutes,
    completedByLesson:
      parsed.completedByLesson && typeof parsed.completedByLesson === 'object'
        ? parsed.completedByLesson
        : {},
    completedSentences: Array.isArray(parsed.completedSentences)
      ? parsed.completedSentences
      : [],
    recentRecords: Array.isArray(parsed.recentRecords) ? parsed.recentRecords : [],
  };
}

// 完成一句练习时调用：累加统计、更新 streak/weekly/recent，写回并返回最新统计
export function recordSentenceCompletion(input: {
  sentenceId: string;
  lessonId: string;
  wpm: number;
  accuracy: number;
  errors: number;
  duration: number; // 秒
}): UserStats {
  const stats = getUserStats();
  const today = todayStr();

  // 1. 累加总时长与错误
  stats.totalStudyTime += input.duration;
  stats.totalErrors += input.errors;

  // 2. 已完成句子去重登记（全局 + 按课程）
  if (!stats.completedSentences.includes(input.sentenceId)) {
    stats.completedSentences.push(input.sentenceId);
  }
  const lessonList = stats.completedByLesson[input.lessonId] ?? [];
  if (!lessonList.includes(input.sentenceId)) {
    lessonList.push(input.sentenceId);
  }
  stats.completedByLesson[input.lessonId] = lessonList;

  // 3. streak 更新：同日不变；昨日 +1；否则重置为 1
  if (stats.lastStudyDate === null) {
    stats.streakDays = 1;
  } else if (today === stats.lastStudyDate) {
    // 同日，不变
  } else if (differenceInCalendarDays(new Date(today), new Date(stats.lastStudyDate)) === 1) {
    stats.streakDays += 1;
  } else {
    stats.streakDays = 1; // 断签
  }
  stats.lastStudyDate = today;

  // 4. weeklyMinutes：累加今天的分钟数
  const todayIdx = stats.weeklyMinutes.findIndex((w) => w.date === today);
  const addedMinutes = input.duration / 60;
  if (todayIdx >= 0) {
    stats.weeklyMinutes[todayIdx].minutes += addedMinutes;
  } else {
    // 滑动窗口：今天的项不存在说明窗口跨天，重新构建最近 7 天并保留可对齐的旧数据
    const rebuilt = buildInitialWeekly();
    // 保留与新窗口日期匹配的旧 minutes
    for (const item of stats.weeklyMinutes) {
      const hit = rebuilt.find((r) => r.date === item.date);
      if (hit) hit.minutes = item.minutes;
    }
    // 累加今天
    const todayHit = rebuilt.find((r) => r.date === today);
    if (todayHit) todayHit.minutes += addedMinutes;
    stats.weeklyMinutes = rebuilt;
  }

  // 5. recentRecords：最新在前，cap 30
  stats.recentRecords.unshift({
    sentenceId: input.sentenceId,
    lessonId: input.lessonId,
    wpm: input.wpm,
    accuracy: input.accuracy,
    errors: input.errors,
    duration: input.duration,
    timestamp: Date.now(),
  });
  if (stats.recentRecords.length > 30) {
    stats.recentRecords = stats.recentRecords.slice(0, 30);
  }

  safeWrite(USER_STATS_KEY, JSON.stringify(stats));
  return stats;
}

// 清空用户统计（供调试/未来「重置进度」用）
export function resetUserStats(): void {
  safeRemove(USER_STATS_KEY);
}

// 工具：格式化日期串为中文周几，供进度页柱图 label 使用
export function formatWeekday(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'EEEE', { locale: zhCN });
  } catch {
    return dateStr;
  }
}
