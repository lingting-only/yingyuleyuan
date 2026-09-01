# 简化项目功能 & 重新设计首页（参照 qwerty-learner）

## Summary

将 EngExplorer 从"6 模块仪表盘式应用"简化为聚焦「打字背单词」核心闭环的应用，参照 qwerty-learner「落地即练 + 词库选择 + 错题本」的练习循环。最终保留 4 个模块：**打字练习（首页，落地即练）、词库/句子选择、错题本、学习进度**。删除课程、互动练习、社区三个原模块。练习沿用现有句子模式（复用 `typingLessons`）。

> 说明：qwerty-learner 的 gallery 与 error-book 为 SPA 客户端渲染，参考站点静态抓取仅得营销落地页；本计划依据 qwerty-learner 仓库 README 描述的 gallery（词库/章节选择，点选后回到练习）与 error-book（记录错词、可重练、可清空）语义实现。因本项目用句子练习，gallery 落地为"句子课程选择"，错题本记录"出错的句子"。

## Current State Analysis

- **首页** [src/app/page.tsx](file:///d:/codeup/yingyuleyuan/src/app/page.tsx)：仪表盘式，与 qwerty 思路不符，将整体重写为打字练习界面。
- **打字页** [src/app/typing/page.tsx](file:///d:/codeup/yingyuleyuan/src/app/typing/page.tsx)：已是 qwerty 风格（逐字输入、空格标点自动补全、错误闪现、WPM/准确率/错误、整句/拆句、朗读、粒子消散、虚拟键盘、完成卡片、快捷键）。将迁移为首页内容并删除原 /typing 路由。
- **进度页** [src/app/progress/page.tsx](file:///d:/codeup/yingyuleyuan/src/app/progress/page.tsx)：依赖 `learningStats`（保留）与 `courses`（"课程完成度"区块需改造为打字课程列表）。
- **导航** [sidebar.tsx](file:///d:/codeup/yingyuleyuan/src/components/layout/sidebar.tsx) / [mobile-nav.tsx](file:///d:/codeup/yingyuleyuan/src/components/layout/mobile-nav.tsx)：6 项，将精简为 4 项。
- **数据** [src/lib/data.ts](file:///d:/codeup/yingyuleyuan/src/lib/data.ts)：保留 `typingLessons`/`fingerColors`/`fingerLabels`/`learningStats` 及相关类型；删除 courses/lessons/practiceItems/communityPosts/recommendedCourses/levelLabels/levelColors 及对应类型。
- **grep 确认**：待删数据仅被 page/practice/community/courses/progress 引用，改造进度页后删除安全。

## Proposed Changes

### 1. 新首页：落地即练打字界面（含课程选择 / 错题模式 / 错题记录）
**文件**：`src/app/page.tsx`（整体重写）

将 `src/app/typing/page.tsx` 的打字逻辑迁移为首页，并做以下增强与精简。

**核心交互完全保留**：逐字输入、空格/标点自动补全、错误闪现（350ms 自动消失）、WPM/准确率/错误统计、整句/拆句模式切换、显示图片开关、朗读（Ctrl+A）、隐藏答案（空格）、上下题（Shift+←/→）、重置（Ctrl+;）、完成卡片（音标+词性+翻译+语法角色）、粒子消散、虚拟键盘、进度条。

**改造点**：
1. **队列化练习源**：新增 `practiceQueue: TypingSentence[]` 与 `queueLabel: string` 状态。默认 `practiceQueue = selectedLesson.sentences`、`queueLabel = lesson.titleCn`。`sentence = practiceQueue[sentenceIndex]`、`totalSentences = practiceQueue.length`（替换原 `lesson.sentences[sentenceIndex]` 索引）。导航/统计/渲染全部基于队列。
2. **挂载时读取选课与错题模式**（`useEffect` 首次执行）：
   - 读 URL `searchParams.get('mode') === 'error'` → 从 `getErrorPracticeIds()` 取 id 列表，跨 `typingLessons` 查找句子构造队列，`queueLabel = '错题练习'`。
   - 否则读 `getSelectedLessonId()` → 若命中则定位到该课、队列为其句子；否则默认第 0 课。
3. **错题自动记录**：`completed` 变 true 时，若 `errors > 0` → `addError(sentence.id)`（upsert，errorCount++，lastWrongAt=now）；若 `errors === 0` 且该句已在错题本 → `removeError(sentence.id)`（自动清除已掌握）。
4. **顶部栏精简**：移除「返回」「设置」「切换模式」「学习内容」「个性化」「报错」等无功能/冗余按钮；保留「重置进度」「全屏」；新增「词库」按钮（Link → `/gallery`，用于切换课程）。错题模式下额外显示「退出错题」按钮（清错题练习态并 `router.replace('/')`）。
5. **队列末尾完成**：最后一题完成且点「下一题」时，展示完成汇总并给出「去错题本」「回词库」入口，不再越界。

依赖不变：`@/lib/sounds`（`playKeyClick`/`playErrorBuzz`）、`@/components/typing/virtual-keyboard`、`@/components/typing/particle-burst`、`@/components/ui/{button,badge}`、`@/lib/utils`（`cn`）、`@/lib/data`（`typingLessons`/`fingerColors`/类型）、`@/lib/storage`（新增）、`next/navigation`（`useRouter`/`useSearchParams`）。

### 2. 新增：词库/句子选择页 `/gallery`
**文件**：`src/app/gallery/page.tsx`（新建）

- `'use client'`。读取 `typingLessons` 与当前 `getSelectedLessonId()`。
- 页面结构：标题区（"选择课程" + 副标题）+ 课程卡片网格（`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`）。
- 每张卡片：`titleCn` 主标题、`titleEn` 副标题、`sentences.length` 句子数、首句预览（`sentences[0].sentence` + `translation`）、主题色渐变头部（复用 sky/emerald/orange 主题）。当前选中课程高亮（sky 边框 + "当前"角标）。
- 「开始练习」按钮 → `setSelectedLessonId(id)` → `router.push('/')`。
- 顶部返回首页链接。
- 空数据兜底（typingLessons 暂仅 3 课，仍正常展示）。

### 3. 新增：错题本页 `/error-book`
**文件**：`src/app/error-book/page.tsx`（新建）

- `'use client'`。挂载读取 `getErrorBook()`（仅 `{id, errorCount, lastWrongAt}` 轻量记录），按 `lastWrongAt` 倒序。句子详情（英文/翻译/音标）通过 `typingLessons` 跨课按 id 查找。
- **空状态**：图标 + "还没有错题，去练习吧" + Link → `/`。
- **列表项**：英文句子（大号）、翻译、音标（小号 mono）、`errorCount`（"错 N 次"红色徽章）、`lastWrongAt`（相对时间，如"2 小时前"，用 `date-fns` `formatDistanceToNow`）。每项右侧「移除」按钮（`removeError(id)` + 本地刷新）。
- **顶部操作**：「练习错题」（`setErrorPractice(ids)` → `router.push('/?mode=error')`）、「清空错题本」（`clearErrorBook()` + 二次确认用 `AlertDialog`）。
- 返回首页链接。

### 4. 新增：localStorage 共享模块
**文件**：`src/lib/storage.ts`（新建）

集中管理 3 个页面共享的持久化状态，避免 key/结构漂移。SSR 安全（`typeof window === 'undefined'` 兜底）。

```ts
export interface ErrorBookRecord { id: string; errorCount: number; lastWrongAt: number; }
// 选课
getSelectedLessonId(): string | null
setSelectedLessonId(id: string): void
// 错题本
getErrorBook(): ErrorBookRecord[]
addError(sentenceId: string): void          // upsert，errorCount++，cap 99
removeError(sentenceId: string): void
clearErrorBook(): void
// 错题练习态（"练习错题"时写入，首页消费后清除）
getErrorPracticeIds(): string[]
setErrorPractice(ids: string[]): void
clearErrorPractice(): void
```

键名：`eng-selected-lesson` / `eng-error-book` / `eng-error-practice`。所有读写均 try/catch 兜底解析失败。

### 5. 删除冗余页面与路由
删除文件：`src/app/typing/page.tsx`（并入首页）、`src/app/courses/page.tsx`、`src/app/courses/[id]/page.tsx`、`src/app/practice/page.tsx`、`src/app/community/page.tsx`。删除空目录。

### 6. 更新导航（4 项）
**文件**：`src/components/layout/sidebar.tsx`、`src/components/layout/mobile-nav.tsx`

```ts
const navItems = [
  { href: '/', label: '打字练习', labelEn: 'Typing', icon: Keyboard },
  { href: '/gallery', label: '词库', labelEn: 'Gallery', icon: Library },
  { href: '/error-book', label: '错题本', labelEn: 'Error Book', icon: BookX },
  { href: '/progress', label: '学习进度', labelEn: 'Progress', icon: BarChart3 },
];
```
- 清理未用 icon import（BookOpen/Dumbbell/Users/Home 等）。
- 桌面侧栏、移动顶部滑出菜单、移动底部 Tab 三处同步精简。

### 7. 改造进度页
**文件**：`src/app/progress/page.tsx`

- import 由 `{ learningStats, courses }` 改为 `{ learningStats, typingLessons }`。
- **替换"课程完成度"区块（L146-L174）** 为"打字课程"区块：列出 `typingLessons`，每项 `titleCn`/`titleEn` + 句子数 `sentences.length`，简洁列表样式（白底圆角卡片 + border），不伪造完成百分比。
- 其余区块（概览统计、本周时长、测试成绩趋势、成就徽章）保持不变。
- 该区块原用 `Progress` 组件，改造后不再需要 → 移除 `import { Progress }`（避免未用 import lint 报错）。

### 8. 清理 data.ts
**文件**：`src/lib/data.ts`

删除不再被引用的导出与类型：类型 `Course`/`Lesson`/`PracticeItem`/`CommunityPost`；数据 `courses`/`lessons`/`practiceItems`/`communityPosts`/`recommendedCourses`/`levelLabels`/`levelColors`。
保留：`LearningStats` 类型 + `learningStats` 数据；`FingerType`/`TypingWord`/`WordPhonetic`/`TypingSentence`/`TypingLesson` 类型 + `typingLessons`/`fingerColors`/`fingerLabels` 数据。

## Assumptions & Decisions

1. **首页 = 打字界面**：用户选"落地即练"，首页直接渲染打字练习，无仪表盘。
2. **保留句子模式**：用户选沿用 `typingLessons` 句子练习；gallery 落地为"句子课程选择"，不引入单词词库。
3. **gallery / error-book 为独立路由页**（`/gallery`、`/error-book`），与 qwerty-learner 的路由语义一致；首页顶栏「词库」按钮与错题本「练习错题」按钮串起闭环。
4. **持久化用 localStorage**：项目已有 Supabase 依赖但相关页面未接通后端，错题/选课属个人本地学习态，用 localStorage 最简且跨会话保留；封装到 `src/lib/storage.ts` 供 3 页共享。
5. **错题自动记录与自动清除**：完成一句若出错则入错题本（errorCount++），若零错且已在错题本则自动移除（掌握即清），与 qwerty「避免错误肌肉记忆 + 巩固」理念一致。
6. **进度页不造假数据**：删除 courses 后用真实 `typingLessons` 列表替代伪造完成度。
7. **Header 不动**：全局 Header（搜索/通知/用户）保留，属次要范围。
8. **删 /typing 路由**：内容并入首页，避免重复；导航不再指向它。

## Verification

1. `pnpm ts-check` —— 删除类型/数据后无悬空引用、无未用 import 报错；新文件类型通过。
2. `pnpm lint:build` —— ESLint 通过。
3. `pnpm dev` 手动验证闭环：
   - `/` 直接进入打字练习（无仪表盘）；逐字输入推进，完成弹出音标+翻译卡片，回车下一题；出错时该句入错题本。
   - 顶栏「词库」→ `/gallery` 列出 3 门课程，点「开始练习」回 `/` 且切换到该课。
   - `/error-book` 显示错题列表；点「练习错题」→ `/` 进入错题模式（标题"错题练习"、仅练错题、显示"退出错题"）；零错完成自动从错题本移除。
   - 桌面侧栏 + 移动底部 Tab 仅 4 项；`/courses`、`/practice`、`/community`、`/typing` 404。
   - `/progress` 正常渲染，"打字课程"区块列出 3 门课及句子数。
4. 刷新页面后选课与错题仍保留（localStorage 持久化）。
