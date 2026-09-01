# 词库模块 JSON 化 + 山东小学【人教版 PEP】词库

## Summary

将词库模块从「TS 硬编码」改为「JSON 索引 + 每词库独立 JSON」：新建 `src/lib/wordbanks/` 目录，`index.json` 作为词库/课程列表索引（gallery 数据源），每个词库/课程独立 JSON 文件。新增山东小学【人教版 PEP】(三年级起点) 词库，覆盖三年级至六年级共 4 个词库，每个年级上下册单词合并去重、按课本单元顺序排列（全量词表）。PEP 词库为**单词练习**：首页复用现有打字管线，把单词转换为单字句形式（音标+词性+中文释义），并隐藏无意义的「拆句/整句」切换。现有 3 门句子课程一并迁移为 JSON。错题本/进度页做单词感知适配。

## Current State Analysis

* **词库内容硬编码在 TS**：[src/lib/data.ts](file:///d:/codeup/yingyuleyuan/src/lib/data.ts) 中的 `typingLessons`（3 门句子课程 t1-t3，共 11 句）被 [gallery/page.tsx](file:///d:/codeup/yingyuleyuan/src/app/gallery/page.tsx)（列表渲染）、[page.tsx](file:///d:/codeup/yingyuleyuan/src/app/page.tsx)（练习队列 `loadQueue`、`findSentenceById`、`findLessonIdBySentence`）、[progress/page.tsx](file:///d:/codeup/yingyuleyuan/src/app/progress/page.tsx)（课程列表+成就）引用。

* **练习引擎围绕** **`TypingSentence`（句子）**：[page.tsx](file:///d:/codeup/yingyuleyuan/src/app/page.tsx) 的 `practiceQueue: TypingSentence[]`，逐字输入、错误闪现、完成卡片（音标+词性+翻译）、拆句/整句切换、粒子消散、虚拟键盘。单词可复用此管线：把单词转成「1 个词的句子」即得「音标+词性+中文释义」完成卡片。

* **错题本** [error-book/page.tsx](file:///d:/codeup/yingyuleyuan/src/app/error-book/page.tsx) 用 `findSentenceById`（仅搜 `typingLessons`）按 id 查详情；统计 [storage.ts](file:///d:/codeup/yingyuleyuan/src/lib/storage.ts) 的 `recordSentenceCompletion` 用字符串 id，对单词 id 天然兼容（无需改 storage）。

* **JSON 支持**：tsconfig `resolveJsonModule: true`（JSON 可静态导入）；Next 16 无特殊配置，`@/*` 别名到 `src/*`。

## Proposed Changes

### 1. 新建 `src/lib/wordbanks/index.json` — 词库/课程列表索引（JSON）

**文件**：`src/lib/wordbanks/index.json`（新建）

gallery 列表的唯一数据源，7 个条目（4 PEP 单词词库 + 3 句子课程），按展示顺序排列：

```json
[
  { "id": "pep-3", "type": "word",  "grade": "三年级", "titleCn": "人教版PEP 三年级", "titleEn": "PEP Grade 3",   "description": "上下册全部单词，按课本单元顺序" },
  { "id": "pep-4", "type": "word",  "grade": "四年级", "titleCn": "人教版PEP 四年级", "titleEn": "PEP Grade 4",   "description": "上下册全部单词，按课本单元顺序" },
  { "id": "pep-5", "type": "word",  "grade": "五年级", "titleCn": "人教版PEP 五年级", "titleEn": "PEP Grade 5",   "description": "上下册全部单词，按课本单元顺序" },
  { "id": "pep-6", "type": "word",  "grade": "六年级", "titleCn": "人教版PEP 六年级", "titleEn": "PEP Grade 6",   "description": "上下册全部单词，按课本单元顺序" },
  { "id": "t1", "type": "sentence", "grade": "", "titleCn": "第一课：早晨起床", "titleEn": "Morning Wake-Up", "description": "日常起居入门句子" },
  { "id": "t2", "type": "sentence", "grade": "", "titleCn": "第二课：在学校",   "titleEn": "At School",       "description": "校园场景入门句子" },
  { "id": "t3", "type": "sentence", "grade": "", "titleCn": "第三课：日常活动", "titleEn": "Daily Activities", "description": "日常活动入门句子" }
]
```

`count`/`preview` 不在 JSON 里写死，由 loader 从内容文件实时计算，避免漂移。

### 2. 新建 4 个 PEP 单词词库 JSON（内容主体）

**文件**：`src/lib/wordbanks/pep-3.json`、`pep-4.json`、`pep-5.json`、`pep-6.json`（新建）

统一结构（单词条目标题 `words` 数组，按课本学习顺序）：

```json
{
  "id": "pep-3",
  "words": [
    { "id": "pep3-001", "word": "hello", "phonetic": "/həˈləʊ/", "pos": "感叹词", "meaning": "你好；喂" }
  ]
}
```

* **内容来源**：人教版 PEP（三年级起点）经典教材单元词汇，三年级上册→六年级下册合并去重，**不区分上下册**，按单元顺序排列。

  * 三年级：上册 Unit1 Hello! 打招呼/Unit2 Colours 颜色/Unit3 Look at me! 身体部位/Unit4 We love animals 动物/Unit5 Let's eat! 食物/Unit6 Happy birthday! 数字；下册 Unit1 Welcome back to school! 国家与问候/Unit2 My family 家庭/Unit3 At the zoo 形容词/Unit4 Where is my car? 方位/Unit5 Do you like pears? 水果/Unit6 How many? 数字。

  * 四年级：上册 Unit1 My classroom/Unit2 My schoolbag/Unit3 My friends/Unit4 My home/Unit5 Dinner's ready/Unit6 Meet my family!；下册 Unit1 My school/Unit2 What time is it?/Unit3 Weather/Unit4 At the farm/Unit5 My clothes/Unit6 Shopping。

  * 五年级：上册 Unit1 What's he like?/Unit2 My week/Unit3 What would you like?/Unit4 What can you do?/Unit5 There is a big bed/Unit6 In a nature park；下册 Unit1 My day/Unit2 My favourite season/Unit3 My school calendar/Unit4 When is the art show?/Unit5 Whose dog is it?/Unit6 Work quietly!。

  * 六年级：上册 Unit1 How can I get there?/Unit2 Ways to go to school/Unit3 My weekend plan/Unit4 I have a pen pal/Unit5 What does he do?/Unit6 How do you feel?；下册 Unit1 How tall are you?/Unit2 Last weekend/Unit3 Where did you go?/Unit4 Then and now。

* **每词字段**：`id`（如 `pep3-001`，年级内递增）、`word`（小写，词性短语如 "get up" 保留空格）、`phonetic`（IPA 英式音标）、`pos`（中文词性，如 名词/动词/形容词）、`meaning`（简洁中文释义）。

* **规模**：每年级约 100-130 词（上下册合并去重后），4 个文件共约 400-500 词。

* **说明**：词汇依据人教版 PEP 经典教材单元知识整理，以「按单元顺序」为排序原则；音标为通用 IPA，供练习使用。

### 3. 新建 `src/lib/wordbanks.ts` — 加载器（类型化 JSON 入口）

**文件**：`src/lib/wordbanks.ts`（新建）

静态导入 `index.json` + 全部 7 个内容 JSON，集中提供类型化访问，供 gallery / 首页 / 错题本 / 进度页共享：

```ts
import indexJson from './wordbanks/index.json';
import pep3 from './wordbanks/pep-3.json';
// ... pep4/5/6, t1/t2/t3

export interface WordBankItem { id: string; word: string; phonetic: string; pos: string; meaning: string; }
export interface WordBankMeta { id: string; type: 'word' | 'sentence'; grade: string; titleCn: string; titleEn: string; description?: string; count: number; preview?: string; }
```

导出：

* `wordBankIndex: WordBankMeta[]` — 由 `indexJson` 映射，`count` 从内容实时计算（word 用 `words.length`、sentence 用 `sentences.length`），word 词库 `preview` = 前 3 个词、sentence = 首句。

* `getBankContent(id): { type:'word'; words: WordBankItem[] } | { type:'sentence'; sentences: TypingSentence[] } | undefined`。

* `isWordBankId(id): boolean`、`isWordItemId(id): boolean`（是否属于某个 word 词库）。

* `findPracticeById(id): TypingSentence | undefined` — 句子课程里按 id 查句；word 词库里按 id 查词并转换为单字句（合并查，供错题本/错题练习/统计反查）。

* `findBankIdByItem(id): string` — 反查所属词库/课程 id（替换首页 `findLessonIdBySentence`）。

* `wordToSentence(item: WordBankItem): TypingSentence` — 单词→单字句转换（见下）。

* `bankToPracticeQueue(id): TypingSentence[] | undefined` — sentence 词库直接返回 `sentences`；word 词库把 `words` 逐词 `wordToSentence` 转换后返回。

* 模块级 `const LETTER_FINGER: Record<string, FingerType>` — 标准触打指法（26 字母→手指），供 `wordToSentence` 设置 `words[0].finger`（首字母）。实现时若 [virtual-keyboard.tsx](file:///d:/codeup/yingyuleyuan/src/components/typing/virtual-keyboard.tsx) 已有字母→手指映射则直接复用，否则在 wordbanks.ts 内定义。

`wordToSentence` 转换规则（复用句子管线，产出「音标+词性+中文释义」完成卡片）：

```ts
function wordToSentence(item: WordBankItem): TypingSentence {
  return {
    id: item.id,
    sentence: item.word,
    translation: item.meaning,
    grammar: '',
    grammarRole: item.pos,
    phonetics: [{ text: item.word, phonetic: item.phonetic, pos: item.pos }],
    words: [{ text: item.word, finger: LETTER_FINGER[item.word[0]?.toLowerCase()] ?? 'thumb', grammar: item.pos }],
  };
}
```

### 4. 迁移现有句子课程到 JSON

**文件**：`src/lib/wordbanks/t1.json`、`t2.json`、`t3.json`（新建）；`src/lib/data.ts`（修改）

* 把 [data.ts](file:///d:/codeup/yingyuleyuan/src/lib/data.ts) 中 `typingLessons` 的 3 门课程完整内容迁入 `t1/t2/t3.json`（结构 `{ "id": "t1", "sentences": [ ...原 TypingSentence 对象... ] }`），内容逐字段照搬。

* data.ts 删除 `typingLessons` 数组与 `TypingLesson` 接口；保留 `FingerType`/`TypingWord`/`WordPhonetic`/`TypingSentence` 类型与 `fingerColors`/`fingerLabels`（wordbanks.ts 依赖它们做转换与配色）。

### 5. 改造首页练习引擎 [src/app/page.tsx](file:///d:/codeup/yingyuleyuan/src/app/page.tsx)

* **import**：`typingLessons` → `from '@/lib/wordbanks'` 导入 `wordBankIndex`/`bankToPracticeQueue`/`findPracticeById`/`findBankIdByItem`/`isWordItemId`/`getBankContent`；删除 `typingLessons` import（`fingerColors`/`TypingSentence` 仍从 data.ts）。

* **新增** **`isWordBank`** **state**：word 词库练习时为 true（用于隐藏拆句/整句切换、顶栏可显示「单词」标记）。

* **初始 state**：`practiceQueue` 初值从 `typingLessons[0]?.sentences ?? []` 改为 `[]`（挂载后 `loadQueue` 填充）。

* **`loadQueue`** **改造**：

  * 错题模式：`ids.map(findPracticeById).filter(Boolean)` 构造队列（单词 id 自动转单字句）；`isWordBank = ids.length>0 && ids.every(id => isWordItemId(id))`；`queueLabel='错题练习'`。

  * 常规：`getSelectedLessonId()` → 若命中 word 词库（`isWordBankId`）→ `bankToPracticeQueue`，`isWordBank=true`；若句子课程 → 其 `sentences`，`isWordBank=false`；否则默认 `wordBankIndex[0]`（pep-3）。

  * `queueLabel` 用 `wordBankIndex` 对应 `titleCn`。

* **`findLessonIdBySentence`** **替换**：改为调用 `findBankIdByItem(sentence.id)`。

* **渲染**：`isWordBank` 时隐藏 Secondary Bar 的「拆句练习/整句练习」两个按钮（整句模式对单词即默认）；其余（完成卡片显示音标+词性+`grammarRole`(词性)+翻译(释义)）自动生效，无需改。

### 6. 改造词库页 [src/app/gallery/page.tsx](file:///d:/codeup/yingyuleyuan/src/app/gallery/page.tsx)

* **import**：`typingLessons` → `from '@/lib/wordbanks'` 导入 `wordBankIndex`/`getBankContent`。

* **渲染改为 JSON 索引驱动**：分两组——

  * 「PEP 单词词库」：`wordBankIndex.filter(b => b.type === 'word')`，卡片显示 `titleCn`/`titleEn` + 年级徽章 + `count` 词 + 前 3 词预览（`preview`），主题色循环沿用 THEME\_COLORS。

  * 「句子课程」：`filter(b => b.type === 'sentence')`，显示 `count` 句 + 首句预览。

  * 统一复用现有卡片样式（渐变头部/序号/当前角标/开始练习）；「开始练习」仍 `setSelectedLessonId(id)` + `router.push('/')`。

* 当前选中高亮仍用 `getSelectedLessonId()`。

### 7. 错题本页单词感知 [src/app/error-book/page.tsx](file:///d:/codeup/yingyuleyuan/src/app/error-book/page.tsx)

* `findSentenceById` 改为从 `@/lib/wordbanks` 导入 `findPracticeById`（单词记录自动转单字句），列表渲染不变（英文句=单词、翻译=释义、音标=单词语音）。空/移除/练习错题逻辑不变。

### 8. 进度页适配 [src/app/progress/page.tsx](file:///d:/codeup/yingyuleyuan/src/app/progress/page.tsx)

* `typingLessons` → `wordBankIndex`（含 4 单词词库 + 3 句子课程）。

* 「打字课程」区块：`wordBankIndex.map`，完成数用 `completedByLesson[item.id]?.length ?? 0` / `item.count`。

* 成就「课程先锋」「全能选手」的判断对象由 `typingLessons` 改为 `wordBankIndex`（任一/全部 `count` 完成）。

### 9. 数据文件 data.ts 收敛

* 删除 `typingLessons`/`TypingLesson`，保留类型与 finger 映射（见步骤 4）。grep 确认 `typingLessons` 无残留引用。

## Assumptions & Decisions

1. **练习单元=单词**：PEP 词库为单词练习；通过「单词→单字句」转换复用现有句子练习管线，避免大规模重写练习引擎，UI 完成卡片天然展示音标+词性+中文释义（与用户确认的方案一致）。
2. **年级范围**：三年级起点，`pep-3`\~`pep-6` 共 4 词库（与用户确认一致）。
3. **内容规模**：上下册全量单词合并去重，按课本单元顺序（与用户确认一致）。词表依据人教版 PEP 经典教材单元词汇整理，尽力贴近课本顺序，但**无法保证与实体教材逐字 100% 一致**（无官方词表源），作为练习词库使用。
4. **词库列表=JSON 索引**：`index.json` 是 gallery 唯一数据源；句子课程也一并迁入 JSON，`data.ts` 不再承载任何词库内容。
5. **loader 计算派生字段**：`count`/`preview` 由 loader 实时计算，避免索引与内容不同步。
6. **storage 不改**：错题/统计用字符串 id，单词 id（`pep3-001`）天然兼容。
7. **不做**：不改虚拟键盘/粒子特效/完成卡片布局；不新增独立"单词模式"路由（首页内通过 `isWordBank` 收敛）；gallery 不新增筛选/搜索 UI（保持现状卡片网格）。

## Verification

1. `pnpm ts-check` —— 迁移后无 `typingLessons` 悬空引用、JSON 类型通过。
2. `pnpm lint:build` —— ESLint 通过（无未用 import）。
3. `pnpm dev` 冒烟（Invoke-WebRequest 验证 `/`、`/gallery`、`/error-book`、`/progress` 均 200）。
4. grep：`typingLessons` 在 `src` 下仅存于 `wordbanks/*.json` 的数据迁移无关处（应无残留；`data.ts` 无）。
5. 手测闭环（浏览器）：

   * `/gallery` 显示 4 个 PEP 词库卡（年级+词数+预览）+ 3 个句子课程卡；当前选中高亮正确。

   * 点 pep-3「开始练习」→ 首页进入单词练习：顶栏标题「人教版PEP 三年级」、无拆句/整句按钮；逐词输入，完成卡片显示单词+音标+词性+中文释义；完成计数正确。

   * 出错单词 → 错题本按单词记录；「练习错题」回首页练错题。

   * `/progress`「打字课程」列出 7 项，PEP 词库完成数为已完成单词数/总数。

   * 刷新后选课/错题/统计仍保留。

