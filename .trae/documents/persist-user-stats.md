# 用户学习数据浏览器持久化 + 进度页真实化

## Summary

将打字练习每完成一句产生的学习统计（用时/WPM/准确率/错误）持久化到 localStorage，下次打开任意页面都能加载该用户的真实数据；进度页 `/progress` 完全改用持久化数据渲染，删除 `learningStats` 静态 mock；新用户首次打开显示 0/空状态。范围聚焦「学习统计 + 进度页真实化」，不含「续练到具体句子位置」（首页仍从所选课程第 0 句开始）。

## Current State Analysis

- **首页** [src/app/page.tsx](file:///d:/codeup/yingyuleyuan/src/app/page.tsx)：完成一句时（`completed=true`）的 `useEffect`（L137-146）目前只调用 `addError`/`removeError` 写错题本，**未把 `timer`/`wpm`/`accuracy`/`errors` 持久化**，刷新即丢。已有 helper `findSentenceById`（L42-48）跨课按 id 查句子；`sentence`/`totalSentences`/`queueLabel`/`isErrorMode` 等状态齐全；`accuracy` 在 L212-214 完成时计算并 setState。
- **存储层** [src/lib/storage.ts](file:///d:/codeup/yingyuleyuan/src/lib/storage.ts)：已实现选课（`getSelectedLessonId`/`setSelectedLessonId`）、错题本（`getErrorBook`/`addError`/`removeError`/`clearErrorBook`）、错题练习态（`getErrorPracticeIds`/`setErrorPractice`/`clearErrorPractice`）；内部工具 `isClient`/`safeParse`/`safeRead`/`safeWrite`/`safeRemove` 可复用；SSR 安全（`typeof window` 守卫）+ try/catch 兜底。键名前缀 `eng-`。
- **进度页** [src/app/progress/page.tsx](file:///d:/codeup/yingyuleyuan/src/app/progress/page.tsx)：`'use client'`，但完全用静态 `learningStats` 渲染。消费字段：总学习时长（`totalStudyTime`，L37）、连续学习（`streakDays`，L43）、掌握词汇（`wordsLearned`，L49）、测试均分（`avgScore`，L55）、本周学习时长柱图（`weeklyData`，L76-100）、测试成绩趋势（`testScores`，L116-137）、打字课程列表（`typingLessons`，L146-161，已真实）、学习成就 8 项硬编码 3 项 unlocked（L174-218）。无 localStorage 读取。
- **数据** [src/lib/data.ts](file:///d:/codeup/yingyuleyuan/src/lib/data.ts)：`LearningStats` 接口（L4-12）+ `learningStats` 静态数据（L14-37）仅被 `progress/page.tsx` 引用（grep 确认；首页/词库/错题本均未引用），删除安全。`typingLessons`（3 课 11 句）保留。
- **依赖**：`date-fns` ^4.1.0 已装，错题本页已用 `formatDistanceToNow` + `zhCN` locale，可复用 `differenceInCalendarDays`/`format`。

## Proposed Changes

### 1. 扩展 storage.ts：新增用户学习统计模块
**文件**：`src/lib/storage.ts`（在文件末尾追加，不动现有 3 类）

新增键 `eng-user-stats`，数据模型：

```ts
export interface PracticeRecord {
  sentenceId: string;
  lessonId: string;
  wpm: number;
  accuracy: number;     // 0-100
  errors: number;
  duration: number;     // 秒
  timestamp: number;
}

export interface UserStats {
  totalStudyTime: number;                          // 累计秒
  totalErrors: number;
  completedSentences: string[];                   // 已完成句子 id（去重）
  completedByLesson: Record<string, string[]>;     // lessonId -> 句子 id 数组（去重）
  lastStudyDate: string | null;                   // 'YYYY-MM-DD'
  streakDays: number;
  weeklyMinutes: { date: string; minutes: number }[]; // 最近 7 天，含今天，今天在末尾
  recentRecords: PracticeRecord[];                // 最近 30 条，按 timestamp 倒序
}
```

新增导出函数（均 SSR 安全，复用 `safeRead`/`safeWrite`/`safeParse`）：

- `getUserStats(): UserStats` — 读取，空时返回初始化对象（`{ totalStudyTime:0, totalErrors:0, completedSentences:[], completedByLesson:{}, lastStudyDate:null, streakDays:0, weeklyMinutes: buildInitialWeekly(), recentRecords:[] }`）。
- `recordSentenceCompletion(input: { sentenceId; lessonId; wpm; accuracy; errors; duration }): UserStats` — 完成一句时调用，内部：
  1. `totalStudyTime += duration`；`totalErrors += errors`。
  2. `completedSentences` 去重 push `sentenceId`；`completedByLesson[lessonId]` 去重 push。
  3. streak 更新：`today = format(now,'yyyy-MM-dd')`；若 `today === lastStudyDate` → streak 不变；若 `differenceInCalendarDays(today, lastStudyDate) === 1` → `streakDays+1`；否则（首练或断签）→ `streakDays = 1`；`lastStudyDate = today`。
  4. weeklyMinutes：找到 `date === today` 的项 `minutes += duration/60`（向上取整到分钟？保留浮点，UI 显示取整）；若不存在则 unshift `{date:today, minutes: duration/60}` 并 cap 7（pop 末尾）；初始化为空时先 `buildInitialWeekly()` 补 7 条（今天 + 前 6 天，全 0，今天在末尾）。
  5. `recentRecords.unshift({sentenceId, lessonId, wpm, accuracy, errors, duration, timestamp: Date.now()})`，cap 30。
  6. `saveUserStats` 写回并返回最新 stats。
- `resetUserStats(): void` — 清空（供调试/未来「重置进度」用，本轮不接入 UI）。

内部 helper `buildInitialWeekly()`：返回最近 7 天 `{date, minutes:0}` 数组（今天在末尾），用 `date-fns` `subDays`/`format` 生成。内部 helper `todayStr()` 返回 `'yyyy-MM-dd'`。

### 2. 首页：完成一句时写入用户统计
**文件**：`src/app/page.tsx`

- 新增 import：`recordSentenceCompletion` from `@/lib/storage`（L22-28 已有 storage import，追加）。
- 新增 helper `findLessonIdBySentence(sentenceId: string)`：遍历 `typingLessons`，返回首个 `sentences.some(s => s.id === id)` 的 `lesson.id`（与现有 `findSentenceById` 同位置 L42-48 旁追加）。
- 修改完成 effect（L137-146）：在现有 `addError`/`removeError` 之后追加调用：
  ```ts
  recordSentenceCompletion({
    sentenceId: sentence.id,
    lessonId: findLessonIdBySentence(sentence.id),
    wpm,
    accuracy,
    errors,
    duration: timer,
  });
  ```
  依赖数组保持 `[completed]`（`wpm`/`accuracy`/`timer`/`sentence` 在 completed=true 时已是最终值；加 eslint-disable 注释如现有写法）。
- **不**改其他逻辑：续练位置、队列加载、错题记录保持现状。

### 3. 进度页：完全改用持久化真实数据
**文件**：`src/app/progress/page.tsx`（重写数据源，UI 结构保留）

- import 改：移除 `learningStats` from `@/lib/data`（保留 `typingLessons`）；新增 `getUserStats, type UserStats` from `@/lib/storage`；新增 `format` from `date-fns` + `zhCN` from `date-fns/locale`（用于 weeklyMinutes 的 date → 周几）。
- 组件改为挂载读取：
  ```ts
  const [stats, setStats] = useState<UserStats | null>(null);
  useEffect(() => setStats(getUserStats()), []);
  ```
  SSR 安全（首屏 null，挂载后填充；或用初始空对象避免 null 渲染分支）。为简洁用初始 `getUserStats()` 在 effect 内 set，渲染时若 `stats===null` 显示骨架/0。
- 字段映射（替换原 `learningStats` 全部消费点）：
  - **总学习时长**（L37）：`formatTime(stats.totalStudyTime)` —— 复用 `OverviewCard`，值 = `Math.floor(total/60)小时 + total%60分钟`（totalStudyTime 是秒，需 `/60 转分钟` 后再格式化；或直接复用首页 `formatTime` 的 mm:ss 改成「X小时Y分钟」）。
  - **连续学习**（L43）：`stats.streakDays` 天。
  - **完成句子**（L49，原「掌握词汇」改 label）：`stats.completedSentences.length` 句。
  - **练习均分**（L55，原「测试均分」改 label）：`recentRecords.length > 0 ? round(avg(accuracy)) : 0` 分。
  - **本周学习时长**（L76-100）：`stats.weeklyMinutes.map`，`isToday = index === length-1`；`day` 显示用 `format(new Date(item.date), 'EEEE', {locale: zhCN})` 得「周一」等；`totalMinutes` = `weeklyMinutes.reduce(a+b.minutes,0)` 取整；柱高按 `minutes/maxMin*100`。
  - **练习成绩趋势**（L116-137，原「测试成绩趋势」改标题）：`stats.recentRecords.slice(0,10)`（按时间倒序，最近在前）；每项 `date` 用 `format(timestamp, 'MM/dd')`、`score` 用 `accuracy`、`type` 用「练习」徽章。空数组时显示「暂无练习记录，去打字练习吧」空状态 + Link `/`。
  - **打字课程**（L146-161）：每项追加完成度徽章 `completedByLesson[lesson.id]?.length ?? 0` / `sentences.length`（替换原仅显示总句数的徽章）。
  - **学习成就**（L174-218）：8 项 `unlocked` 改为基于真实数据计算：
    1. 学习达人（连续7天）→ `streakDays >= 7`
    2. 课程先锋（完成首课）→ `typingLessons.some(l => (completedByLesson[l.id]?.length ?? 0) === l.sentences.length)`
    3. 满分王者（测试满分）→ `recentRecords.some(r => r.accuracy === 100)`
    4. 词汇大师（原 1000 词，改为「掌握 30 句」）→ `completedSentences.length >= 30`
    5. 精准射手（连续答对10题）→ `recentRecords.slice(0,10).length === 10 && recentRecords.slice(0,10).every(r => r.accuracy >= 95)`
    6. 社区之星 → 保持 `false`（无社区数据）
    7. 笔耕不辍（30天打卡）→ `streakDays >= 30`
    8. 全能选手（完成所有课程）→ `typingLessons.every(l => (completedByLesson[l.id]?.length ?? 0) === l.sentences.length)`
    顶部「X/8 已解锁」改为动态计数。
- 无数据（新用户）：总时长 0、streak 0、完成句子 0、均分 0、柱图全 0、趋势区空状态、成就 0/8 全 locked。不显示假数据。

### 4. 清理 data.ts：删除 learningStats 静态 mock
**文件**：`src/lib/data.ts`

- 删除 `LearningStats` 接口（L4-12）与 `learningStats` 数据（L14-37）。
- grep 确认仅 `progress/page.tsx` 引用过（步骤 3 已改用 storage），删除安全。
- `typingLessons`/`fingerColors`/`fingerLabels` 等保留。

## Assumptions & Decisions

1. **范围聚焦统计 + 进度页**：不含「续练到具体句子」（首页仍从所选课程第 0 句开始），与用户确认的范围一致。
2. **删除 mock 不留兜底**：进度页完全用 localStorage，新用户显示 0/空，与用户确认一致。
3. **「掌握词汇」→「完成句子」**：项目无单词词库，用句子数更诚实；UI label 同步改。
4. **「测试」→「练习」**：项目无独立测试，把 recentRecords 的 accuracy 当作「练习成绩」；label/标题同步改。
5. **streak 用日历天**：用 `differenceInCalendarDays` 跨天判断，避免时区偏差。
6. **weeklyMinutes 滑动 7 天窗**：存最近 7 天含今天（今天在末尾），每次完成补 today 分钟；显示用 date-fns `zhCN` 周几，与原 mock「周一..周日」风格一致。
7. **recentRecords cap 30**：3 课共 11 句，循环练习会产生重复记录，cap 30 足够覆盖趋势图（显示最近 10）且不无限膨胀。
8. **accuracy 来源**：复用首页完成时已算的 `accuracy` state（L212-214），无需在 storage 重算。
9. **storage.ts 不依赖 data.ts**：`recordSentenceCompletion` 由调用方（首页）传入 `lessonId`，避免 storage↔data 循环依赖。
10. **不改 gallery/error-book**：保持本轮范围；gallery 不显示完成度（避免范围蔓延）。

## Verification

1. `pnpm ts-check` —— 删 `learningStats` 后无悬空引用；新 storage/progress 类型通过。
2. `pnpm lint:build` —— ESLint 通过（无未用 import）。
3. `pnpm dev` 手测闭环：
   - 首页练完一句 → 刷新 → `/progress` 总时长/streak=1/完成句子=1/练习均分=该句 accuracy/本周柱图今天有值/趋势区 1 条记录 均显示真实值。
   - 第二句练完（同日）→ streak 仍 1，完成句子=2，本周今天分钟累加。
   - 清空 localStorage（DevTools）→ 进度页全 0 + 趋势空状态 + 成就 0/8。
   - 跨天模拟（改系统时间或手改 `lastStudyDate`）→ streak 递增/断签重置。
   - 成就：streak≥7 解锁「学习达人」；完成整门课解锁「课程先锋」「全能选手」；accuracy=100 解锁「满分王者」。
4. grep 确认 `learningStats`/`LearningStats` 在 `src` 下无残留引用（除被删的 data.ts 自身）。