---
name: 拼写模式 Spell Mode
overview: 为打字战斗游戏增加"拼写模式"：显示中文释义，玩家输入完整英文单词进行攻击。核心区别于当前"逐字母攻击"模式。
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - 星际太空
    - 发光字效
    - 玻璃拟态
    - 粒子爆发
    - 动效反馈
  fontSystem:
    fontFamily: Nunito
    heading:
      size: 36px
      weight: 800
    subheading:
      size: 18px
      weight: 600
    body:
      size: 16px
      weight: 400
  colorSystem:
    primary:
      - "#8B5CF6"
      - "#06B6D4"
      - "#F97316"
    background:
      - "#030016"
      - "#0A0A2E"
    text:
      - "#F8FAFC"
      - "#06B6D4"
    functional:
      - "#10B981"
      - "#EF4444"
      - "#F59E0B"
todos:
  - id: extend-game-types
    content: 在 src/lib/game.ts 中新增拼写模式类型定义和常量（SpellEnemy、SpellStats、SpellMode、计分常量）
    status: completed
  - id: create-spell-game-hook
    content: 新建 src/hooks/use-spell-game.ts 拼写游戏引擎 Hook，实现敌人下落、输入比对、计分、难度递增、连击系统
    status: completed
    dependencies:
      - extend-game-types
  - id: create-word-enemy-card
    content: 新建 src/components/game/word-enemy-card.tsx，展示整体单词敌人（中文大字 + 音标 + 发光边框 + 状态动画）
    status: completed
    dependencies:
      - extend-game-types
  - id: create-spell-arena
    content: 新建 src/components/game/spell-arena.tsx，拼写字战场容器（复用 GameArena 背景 + 敌人区 + 输入框层）
    status: completed
    dependencies:
      - create-word-enemy-card
      - create-spell-game-hook
  - id: create-spell-overlays
    content: 新建 src/components/game/spell-game-start.tsx 和 spell-game-over.tsx，拼写模式专用覆盖层组件
    status: completed
    dependencies:
      - create-spell-arena
  - id: refactor-game-start
    content: 重构 src/components/game/game-start.tsx，在开始界面增加字母/拼写模式选择 UI
    status: completed
    dependencies:
      - create-spell-overlays
  - id: integrate-spell-mode
    content: 改造 src/app/game/page.tsx，新增 gameMode 状态、拼写模式渲染分支、输入框逻辑
    status: completed
    dependencies:
      - refactor-game-start
      - create-spell-arena
  - id: add-spell-sounds
    content: 在 src/lib/sounds.ts 中补充拼写正确击杀音效
    status: completed
    dependencies:
      - integrate-spell-mode
  - id: test-both-modes
    content: 验证两种模式均可正常启动、击杀、暂停、结算，UI 布局美观
    status: completed
    dependencies:
      - add-spell-sounds
---

## 拼写模式 - 功能需求

在打字战斗游戏中新增「拼写模式」，与现有「字母模式」并列作为两种可选玩法。

### 核心玩法

- **显示中文意思**：战场中央以醒目大字展示当前单词的中文含义（代替逐字显示英文）
- **整体击杀**：每个单词作为一个完整敌人（不再拆分为多个字母敌人），整个单词敌人发光下压
- **输入攻击**：底部显示输入框，玩家输入完整英文单词后按 Enter 提交
- **正确击杀**：输入正确 → 消灭敌人 + 粒子爆发 + 得分奖励
- **失误扣血**：敌人越过防线或输入错误 → 扣血 + 连击重置

### 两种模式对比

| 维度 | 字母模式 | 拼写模式 |
| --- | --- | --- |
| 敌人形式 | 每个字母一个敌人 | 整个单词一个敌人 |
| 显示内容 | 音标 + 中文 + 字母进度 | 中文大字 + 音标 |
| 输入方式 | 逐字母按键 | 输入完整单词后提交 |
| 学习目标 | 指法肌肉记忆 | 拼写记忆 + 英汉对应 |


### 难度与激励

- 难度随等级提升：敌人下落速度加快、单词变长
- 连击系统保留：连续正确击杀获得连击加成
- 得分机制：单词字符数 × 单字符分 + 击杀奖励 + 连击倍数
- 粒子特效保留：击杀爆发、连击横幅、受伤震屏
- 词库复用：直接使用现有词库的中文释义，无需额外数据

### 模式选择

- 游戏开始界面增加模式选择：字母模式 / 拼写模式
- 支持中途切换词库

### 交互细节

- 输入框自动聚焦，支持 Enter 提交
- 正确提交后输入框清空并播放击杀音效
- 错误提交后输入框抖动 + 显示错误提示 + 扣能量
- 输入正确时输入框短暂变绿闪烁

## 技术方案

### 架构设计

采用「双引擎并行」架构：在同一游戏页面内，通过 `gameMode` 状态切换字母/拼写两套游戏逻辑，两套引擎完全独立，最小化耦合。

```
game/page.tsx
  ├── gameMode: 'letter' | 'spell'
  ├── 字母模式：复用现有 useTypingGame + GameArena + LetterEnemyCard
  └── 拼写模式：useSpellGame + SpellArena + WordEnemyCard
```

### 核心模块

#### 1. 类型定义 (game.ts)

新增拼写模式专用类型：

- `SpellEnemy`: 单词敌人 `{ id, word, meaning, phonetic, x, y, speed, status }`
- `SpellStats`: 拼写模式积分 `{ score, kills, combo, maxCombo, hp, level, correctWords, wrongWords, elapsed }`
- `SpellMode`: `'idle' | 'running' | 'paused' | 'over'`
- 计分常量：`SCORE_PER_CHAR_SPELL`（拼写模式单字符分）、`SCORE_WORD_BONUS`（单词完成奖励）

#### 2. 拼写游戏引擎 (use-spell-game.ts) — [NEW]

核心逻辑 Hook，处理：

- **游戏循环**：requestAnimationFrame 驱动敌人下落
- **敌人管理**：随机取词、生成单词敌人、控制下落速度
- **输入处理**：`handleSubmit(word: string)` 接收输入框内容进行比对
- **难度曲线**：随等级加快下落速度、减少短词出现比例
- **特效触发**：击杀/失误/连击里程碑的事件回调

#### 3. 单词敌人组件 (word-enemy-card.tsx) — [NEW]

展示整体单词敌人：

- 大号中文意思（醒目颜色 + 发光边框）
- 底部显示音标 + 词长标签
- 状态动画：idle（悬浮发光）→ dying（爆炸消散）
- 失误时抖动效果

#### 4. 拼写字战场 (spell-arena.tsx) — [NEW]

战场容器（复用 GameArena 样式主题），包含：

- 顶部信息区：当前单词中文大字 + 音标 + 输入进度（已输入/总词数）
- 敌人区域：单个 WordEnemyCard
- 底部防线（与字母模式共用）
- 输入框层：Auto-focused 英文输入框 + 提交按钮

#### 5. 拼写开始/结算覆盖层

- `SpellGameStart`: 模式说明 + 词库信息 + 开始按钮
- `SpellGameOver`: 得分/击杀/WPM/准确率/历史最高 + 重开按钮
- `GameStart` 重构：增加模式选择 tab/按钮

#### 6. 游戏页面 (page.tsx) 改造

- 新增 `gameMode` 状态：`'letter' | 'spell'`
- 模式切换：GameStart 中选择模式后 setGameMode
- 条件渲染：根据 gameMode 挂载对应 Arena 组件
- 拼写模式特有逻辑：输入框 ref + Enter 提交处理

### 数据流

```
用户输入单词 + Enter
  → useSpellGame.handleSubmit()
    → 比对 word === enemy.word
      → 正确: score++, combo++, triggerKill() → 触发击杀特效 → 延迟出下一词
      → 错误: combo=0, energy--, triggerShake() → 输入框抖动
  → 敌人越过防线 → hp-- → hp<=0 → phase='over'
```

### 复用策略

- `GameArena` 的背景样式、星云、星空、流星、网格动画 **直接复用**（通过 props 传入 children）
- `GameHud` **完全复用**（stats 接口一致）
- `ParticleBurst` / `ComboBanner` / `ScreenFlash` / `ErrorCrack` **复用**
- Web Audio 音效 **复用**，补充「拼写正确」专属上行琶音
- CSS 动画 **复用** globals.css 中的 shake / flash / pulse 类

### 性能考量

- 拼写模式敌人数量最多 1 个（vs 字母模式最多 12 个），渲染压力更低
- 游戏循环与字母模式隔离，通过独立 RAF 实现，无交叉依赖
- 输入框使用受控组件，避免不必要的 re-render

## 设计风格

继承现有星际太空主题，但为拼写模式打造更聚焦的视觉层次。核心变化在于战场中央——用超大字号中文意思作为视觉锚点，让「看到中文 → 回忆英文 → 键盘输出」的认知路径清晰可见。

### 布局结构（从上到下）

1. **信息条**：音标 + 进度（已消灭 / 总词数）
2. **中央大字区**：中文意思 + 词长标签（最醒目的视觉焦点）
3. **敌人区域**：单个发光方块（整体单词作为一个敌人）
4. **底部防线**：青色脉冲光带（与字母模式一致）
5. **输入区**：聚焦的输入框 + 提交按钮

### 视觉层次

- 中文意思：超大字（3xl-5xl）、渐变文字（蓝→青）或发光描边，背景带微光晕
- 敌人卡片：圆角矩形 + 主题色边框 + 柔和投影，hover 时轻微上浮
- 输入框：底部固定、玻璃拟态背景、聚焦时边框发光

### 交互反馈

- 正确提交：输入框绿色闪烁 + 敌人爆发消散 + 粒子扩散
- 错误提交：输入框抖动（shake） + 敌人闪烁红边
- 连击里程碑：横幅弹出 + 屏幕边缘光晕