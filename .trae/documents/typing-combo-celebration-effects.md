# 打字练习页面 - 连斩激励特效与动画方案

## 概要

为打字练习页（[src/app/page.tsx](file:///d:/gitWork/yingyuleyuan/src/app/page.tsx)）添加一套可开关、可持久化的「连斩激励特效」系统。开启后，连续零错完成句子会累积 combo，达到里程碑（3 / 5 / 10 / 20 / 50 连斩）触发分层特效。除基础激励层（浮动连斩文字、虚拟键盘波纹、屏幕闪光、彩带）外，叠加学生喜爱特效包：emoji 庆祝飞溅、combo 火焰数字 HUD、吉祥物鼓励气泡、错误击碎震动反馈。

## 当前状态分析

* 打字练习主页即首页 `src/app/page.tsx`，已存在：

  * `ParticleBurst`（[particle-burst.tsx](file:///d:/gitWork/yingyuleyuan/src/components/typing/particle-burst.tsx)）仅在**整句完成**时触发一次粒子消散。

  * 音效 `playKeyClick` / `playErrorBuzz`（[sounds.ts](file:///d:/gitWork/yingyuleyuan/src/lib/sounds.ts)）。

  * 工具栏 `practiceBar` 注入 `TopBar`，已有默写模式、重置、全屏等按钮可参考样式。

* [globals.css](file:///d:/gitWork/yingyuleyuan/src/app/globals.css) 已定义 `float` / `fade-in-up` / `progress-fill` keyframes，可继续在此追加。

* [storage.ts](file:///d:/gitWork/yingyuleyuan/src/lib/storage.ts) 已有 `safeRead` / `safeWrite` 集中持久化模式，新增偏好读写应遵循同一约定。

* **当前没有** combo 计数、激励开关、连斩特效。

## 用户决策（已确认）

1. 开关：**持久化 + 默认开启**。
2. 连击粒度：**按句子连击**（每完成一句零错 +1，错误归零）。
3. 里程碑特效（基础层）：**浮动连斩文字 + 键盘波纹 + 屏幕闪光/彩带**。不需要音效。
4. 学生喜爱特效包（叠加层）：**emoji 庆祝飞溅 + combo 火焰数字 HUD + 吉祥物鼓励气泡 + 错误击碎震动反馈**。

## 设计方案

### 里程碑分级与触发特效

| Combo | 文案           | 浮动文字 | 键盘波纹 | 屏幕闪光 | 彩带         | emoji 飞溅 | HUD 火焰等级     | 吉祥物台词   |
| ----- | ------------ | ---- | ---- | ---- | ---------- | -------- | ------------- | -------- |
| 1 零错 | —            | —    | —    | —    | —          | ✓（小）    | 0             | 微笑      |
| 3     | `3 连斩!`      | ✓    | —    | —    | —          | ✓（中）    | 1             | 「不错哦!」  |
| 5     | `5 行云流水!`    | ✓    | ✓    | —    | —          | ✓（中）    | 2             | 「好厉害!」  |
| 10    | `10 势如破竹!`   | ✓    | ✓    | ✓    | —          | ✓（大）    | 3 (火焰跳动)    | 「太强了!」  |
| 20    | `20 完美连击!`   | ✓    | ✓    | ✓    | ✓          | ✓（大）    | 4 (火焰+闪电)   | 「你是天才!」 |
| 50    | `50 神之手!`    | ✓    | ✓    | ✓    | ✓（满屏多色）   | ✓（特大）   | 5 (烈焰)       | 「封神啦!」  |

* Combo ≥ 3 始终显示浮动文字；其余特效按上表层级叠加。
* **错误输入**（不论是否完成句子）→ `combo = 0` + 触发**错误击碎震动反馈**（屏幕轻微震动 + 红色裂纹闪现 0.3s）+ 吉祥物变沮丧 0.8s。
* 句子完成但有错误 → `combo = 0`（不重复触发错误震动，因错误时已震过）。
* Combo 仅在 `celebrationEnabled === true` 时累积与触发；关闭时即使零错完成也不计数、不显示特效（保持原 `ParticleBurst` 行为不动）。
* 错误击碎震动**仅在激励特效开启时**触发；关闭时仅保留原有 `playErrorBuzz` 音效与红色字符闪烁。

### 特效展现位置与层级规划

基于页面实际布局（TopBar + 主内容垂直居中 + 底部 Stats），为 7 个特效组件精确定位：

```
┌──────────────────────────────────────────────────────┐
│  TopBar (z-30, sticky h-12)                           │
│  [Logo] [课程信息/工具栏] [导航] [主题/全屏]            │
├──────────────────────────────────────────────────────┤
│                                                      │
│                    音标/词性标签                        │
│                                                      │
│          ┌────────────────────────┐                  │
│          │   单词区 burstRef      │ ← EmojiBurst    │
│          │   new                  │   飞溅起点       │
│          │   新的                 │                  │
│          └────────────────────────┘                  │
│           ↑ ComboBanner 连斩文字                      │
│           (fixed center z-55)                         │
│                                                      │
│  ┌─ ComboHud ──┐  ┌──────────────────────┐  ┌─ Mascot ─┐
│  │ 🔥🔥🔥 7   │  │   VirtualKeyboard    │  │    😊     │
│  │ 左键旁      │  │   (relative 父容器) │  │ 右键旁     │
│  │ absolute   │  │                      │  │ absolute  │
│  └─────────────┘  └──────────────────────┘  └──────────┘
│                                                      │
│             ─── 进度条 ───                            │
│                                                      │
│          [上一题] [朗读] [下一题] ...                  │
│                                                      │
│          速度 WPM  准确率  错误  时间                 │
│                                                      │
├──────────────────────────────────────────────────────┤
│  fixed inset-0 层（全屏覆盖，pointer-events-none）      │
│  ┌────────────────────────────────────────────────┐  │
│  │  ScreenFlash 金光 (z-40)                         │  │
│  │  ErrorShake 裂纹 (z-40)                          │  │
│  │  ConfettiBurst 彩带 canvas (z-45)                │  │
│  │  ParticleBurst 原有粒子 (z-50)                   │  │
│  │  ComboBanner 连斩文字 (z-55)                     │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

**z-index 层级表**（从底到顶）：

| 层级 | 组件 | 定位方式 | 说明 |
|------|------|---------|------|
| z-10 | 主内容区 | 文档流 | 基础层 |
| z-20 | ComboHud 火焰 HUD | absolute 键盘左侧 | 键盘容器内定位 |
| z-20 | Mascot 吉祥物 | absolute 键盘右侧 | 键盘容器内定位 |
| z-30 | TopBar | sticky top-0 | 原有 |
| z-30 | 暂停遮罩 | absolute | 原有 |
| z-30 | 键盘波纹 | 键盘容器内 absolute | relative 父容器内 z-30 |
| z-40 | ScreenFlash 金光 | fixed inset-0 | 全屏渐变 |
| z-40 | ErrorShake 裂纹 | fixed inset-0 | 红色径向渐变 |
| z-45 | ConfettiBurst 彩带 | fixed inset-0 canvas | 彩带在闪光之上 |
| z-48 | EmojiBurst 飞溅 | fixed | 粒子在彩带之上 |
| z-50 | ParticleBurst 原有粒子 | fixed inset-0 canvas | 原有 |
| z-55 | ComboBanner 连斩文字 | fixed 屏幕中心 | 最高层，绝不被遮挡 |

**响应式处理**：

| 组件 | 桌面 (md+) | 移动端 |
|------|-----------|--------|
| ComboBanner | fixed center | fixed center（字号缩小为 `text-3xl`） |
| ScreenFlash | fixed inset-0 | fixed inset-0 |
| ConfettiBurst | fixed inset-0 canvas | fixed inset-0 canvas |
| EmojiBurst | fixed 复用 burstRef | fixed 复用 burstRef |
| ComboHud | absolute 键盘左侧 `left-[-72px] top-1/2 -translate-y-1/2` | **隐藏** (`hidden md:block`) |
| Mascot | absolute 键盘右侧 `right-[-72px] top-1/2 -translate-y-1/2` | **隐藏** (`hidden md:block`) |
| ErrorShake | fixed inset-0 | fixed inset-0 |
| 键盘波纹 | 键盘内 absolute | 键盘内 absolute |

**键盘两侧定位详情**：

键盘外层包裹从 `<div className="w-full max-w-3xl">` 改为 `<div className="relative w-full max-w-3xl">`，ComboHud 与 Mascot 作为该容器的绝对定位子元素：

```
屏幕宽度 1280px - 键盘 max-w-3xl (768px) = 两侧各 256px 可用空间
→ 左侧放 ComboHud（约 w-16=64px）+ 间距 8px → left-[-72px]
→ 右侧放 Mascot（约 w-12=48px）+ 间距 24px → right-[-72px]
→ 两者垂直居中于键盘：top-1/2 -translate-y-1/2
→ 移动端 hidden md:block 隐藏，键盘恢复全宽居中
```

优势：
- 贴近打字动作上下文，视觉关联更强
- 随页面滚动自然移动，不需要 fixed 漂移修正
- 不与底部按钮/Stats/TopBar 冲突
- 不需要额外计算键盘位置，relative 容器内 absolute 即可

**屏幕震动范围调整**：不作用于最外层 `<div className="h-full ...">`（避免 TopBar sticky 与 body 抖动撕裂），而是包裹主内容滚动区的 `<div className="flex-1 min-h-0 overflow-y-auto ...">`，给这个容器添加 `animate-shake-screen` class。这样 TopBar 保持稳定，只有可滚动的内容区抖动。

**EmojiBurst 起点复用**：用现有 `burstRef`（单词区容器 ref）的 `getBoundingClientRect()` 计算中心坐标，与 ParticleBurst 共享同一测量逻辑，不新增额外 ref。

### 文件改动清单

#### 1. [src/lib/storage.ts](file:///d:/gitWork/yingyuleyuan/src/lib/storage.ts) — 新增开关持久化

在文件末尾追加（沿用 `safeRead` / `safeWrite` 与默认值兜底风格）：

```ts
// ===== 激励特效开关 =====
const CELEBRATION_KEY = 'eng-celebration-enabled';

// 读取激励特效开关；默认开启（无记录视为 true）
export function getCelebrationEnabled(): boolean {
  const raw = safeRead(CELEBRATION_KEY);
  if (raw === null) return true;
  return raw === '1';
}

export function setCelebrationEnabled(enabled: boolean): void {
  safeWrite(CELEBRATION_KEY, enabled ? '1' : '0');
}
```

#### 2. [src/app/globals.css](file:///d:/gitWork/yingyuleyuan/src/app/globals.css) — 新增动画

在现有 `@keyframes progress-fill` 之后追加：

```css
/* 连斩浮动文字：从中心缩放进入、停留、上浮淡出 */
@keyframes combo-banner {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
  20%  { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
  70%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -65%) scale(1); }
}

/* 键盘波纹：从中心向外扩散光晕 */
@keyframes keyboard-ripple {
  0%   { opacity: 0.7; transform: scale(0); }
  100% { opacity: 0;   transform: scale(2.6); }
}

/* 屏幕金光一闪 */
@keyframes screen-flash {
  0%, 100% { opacity: 0; }
  10%      { opacity: 0.55; }
  40%      { opacity: 0.2; }
}

/* emoji 庆祝飞溅：从中心抛物线飞出 */
@keyframes emoji-fly {
  0%   { opacity: 1; transform: translate(-50%, -50%) scale(0.6) rotate(0deg); }
  20%  { opacity: 1; transform: translate(var(--tx), var(--ty)) scale(1.1) rotate(var(--rot)); }
  100% { opacity: 0; transform: translate(var(--tx), calc(var(--ty) + 80px)) scale(0.9) rotate(var(--rot)); }
}

/* 屏幕震动（错误击碎反馈）：左右抖动 4 次 */
@keyframes shake-screen {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-6px); }
  40%      { transform: translateX(6px); }
  60%      { transform: translateX(-4px); }
  80%      { transform: translateX(4px); }
}

/* 红色裂纹闪现（错误击碎反馈） */
@keyframes crack-flash {
  0%, 100% { opacity: 0; }
  15%, 60% { opacity: 0.7; }
}

/* combo HUD 火焰跳动（等级 ≥ 3） */
@keyframes flame-flicker {
  0%, 100% { transform: scaleY(1) translateY(0); filter: brightness(1); }
  50%      { transform: scaleY(1.15) translateY(-2px); filter: brightness(1.2); }
}

/* combo HUD 数字弹跳放大（combo 增加瞬间） */
@keyframes hud-pop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.25); }
  100% { transform: scale(1); }
}

/* 吉祥物弹跳（里程碑达成） */
@keyframes mascot-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  30%      { transform: translateY(-8px) scale(1.08); }
  60%      { transform: translateY(-4px) scale(1.04); }
}

/* 吉祥物沮丧（错误时） */
@keyframes mascot-sad {
  0%, 100% { transform: translateY(0) rotate(0); }
  50%      { transform: translateY(2px) rotate(-3deg); }
}

/* 鼓励气泡淡入淡出 */
@keyframes mascot-bubble {
  0%   { opacity: 0; transform: translate(0, 10px) scale(0.8); }
  15%  { opacity: 1; transform: translate(0, 0) scale(1); }
  80%  { opacity: 1; transform: translate(0, 0) scale(1); }
  100% { opacity: 0; transform: translate(0, -6px) scale(0.95); }
}

.animate-combo-banner    { animation: combo-banner 1.4s ease-out forwards; }
.animate-keyboard-ripple { animation: keyboard-ripple 0.9s ease-out forwards; }
.animate-screen-flash    { animation: screen-flash 0.7s ease-out forwards; }
.animate-emoji-fly       { animation: emoji-fly 1.2s ease-out forwards; }
.animate-shake-screen    { animation: shake-screen 0.4s ease-in-out; }
.animate-crack-flash     { animation: crack-flash 0.35s ease-out forwards; }
.animate-flame-flicker   { animation: flame-flicker 0.6s ease-in-out infinite; }
.animate-hud-pop         { animation: hud-pop 0.35s ease-out; }
.animate-mascot-bounce   { animation: mascot-bounce 0.6s ease-out; }
.animate-mascot-sad      { animation: mascot-sad 0.4s ease-in-out; }
.animate-mascot-bubble   { animation: mascot-bubble 1.6s ease-out forwards; }
```

#### 3. [src/components/typing/combo-effects.tsx](file:///d:/gitWork/yingyuleyuan/src/components/typing/combo-effects.tsx) — 新建

整合三种特效，避免分散管理。复用 `particle-burst.tsx` 的 canvas 思路实现彩带。

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';

// 里程碑文案、配色、吉祥物台词、HUD 火焰等级
const COMBO_TEXTS: Record<number, { text: string; color: string; mascot: string; flame: number }> = {
  3:  { text: '3 连斩!',       color: '#10b981', mascot: '不错哦!',  flame: 1 },
  5:  { text: '5 行云流水!',   color: '#0ea5e9', mascot: '好厉害!',  flame: 2 },
  10: { text: '10 势如破竹!',  color: '#f97316', mascot: '太强了!',  flame: 3 },
  20: { text: '20 完美连击!',  color: '#fbbf24', mascot: '你是天才!', flame: 4 },
  50: { text: '50 神之手!',    color: '#a855f7', mascot: '封神啦!',  flame: 5 },
};

// 取最近达成的里程碑（向下取整）
export function getComboMilestone(combo: number) {
  const thresholds = [50, 20, 10, 5, 3];
  const hit = thresholds.find((t) => combo >= t);
  return hit ? { threshold: hit, ...COMBO_TEXTS[hit] } : null;
}

// 取 emoji 飞溅规模档位（combo=1 小，3/5 中，10/20 大，50 特大）
function getEmojiBatch(combo: number): { count: number; emojis: string[] } {
  const POOL_SMALL = ['⭐', '✨', '💫'];
  const POOL_MID   = ['🎉', '⭐', '✨', '💫', '🎊'];
  const POOL_BIG   = ['🎉', '⭐', '✨', '💫', '🎊', '👏', '👍', '🎯'];
  const POOL_HUGE  = ['🎉', '⭐', '✨', '💫', '🎊', '👏', '👍', '🎯', '💯', '🔥', '🏆'];
  if (combo >= 50) return { count: 18, emojis: POOL_HUGE };
  if (combo >= 10) return { count: 12, emojis: POOL_BIG };
  if (combo >= 3)  return { count: 8,  emojis: POOL_MID };
  return { count: 5, emojis: POOL_SMALL }; // combo === 1
}

// ===== 子组件 =====

// 1) 浮动连斩文字（combo >= 3）
function ComboBanner({ combo, triggerKey }: { combo: number; triggerKey: number }) {
  if (triggerKey === 0) return null;
  const m = getComboMilestone(combo);
  if (!m) return null;
  return (
    <div
      key={`banner-${triggerKey}`}
      className="animate-combo-banner pointer-events-none fixed left-1/2 top-1/2 z-50 text-5xl md:text-7xl font-extrabold drop-shadow-lg"
      style={{ color: m.color, textShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
    >
      {m.text}
    </div>
  );
}

// 2) 屏幕闪光（combo >= 10）
function ScreenFlash({ triggerKey }: { triggerKey: number }) {
  if (triggerKey === 0) return null;
  return (
    <div
      key={`flash-${triggerKey}`}
      className="animate-screen-flash pointer-events-none fixed inset-0 z-40 bg-gradient-to-b from-amber-300/50 to-amber-200/20"
      aria-hidden
    />
  );
}

// 3) 彩带 confetti（combo >= 20）：canvas 顶部洒落，50 加密多色
function ConfettiBurst({ combo, triggerKey }: { combo: number; triggerKey: number }) {
  // 沿用 ParticleBurst canvas 思路，初速度向下、重力向下
  // 仅当 combo >= 20 时启动；50 数量翻倍 + 多色板
  // 单次约 1.6s 后 onFinish 清理
  return null; // 实现细节见下文「彩带 canvas 实现要点」
}

// 4) emoji 庆祝飞溅（每次零错完成都触发，规模随 combo 升档）
function EmojiBurst({ combo, triggerKey, center }: {
  combo: number; triggerKey: number; center: { x: number; y: number } | null;
}) {
  // 渲染 count 个 span，每个随机 --tx/--ty/--rot，挂 animate-emoji-fly
  // 起点 = center；终点由 CSS 变量决定，呈抛物线扩散
  return null;
}

// 5) combo 火焰数字 HUD（常驻显示于键盘左侧，absolute 定位，仅桌面端）
function ComboHud({ combo }: { combo: number }) {
  // 作为键盘容器的子元素，absolute left-[-72px] top-1/2 -translate-y-1/2
  // hidden md:block，pointer-events-none，z-20
  // combo === 0：灰色 "0"，无火焰
  // combo > 0：数字 + flame 等级对应火焰数量（flame 1~5）
  // flame >= 3：火焰 span animate-flame-flicker 无限跳动
  // combo 变化瞬间用 key={combo} 触发 animate-hud-pop
  // 数字宽度固定 w-16，避免 combo 位数变化推动键盘
  return null;
}

// 6) 吉祥物（键盘右侧常驻，absolute 定位，仅桌面端；移动端隐藏）
// 选型：用 emoji 简化（😊 平时 / 🤩 里程碑 / 😖 错误），无需图片资源
function Mascot({ combo, triggerKey, errorTriggerKey }: {
  combo: number; triggerKey: number; errorTriggerKey: number;
}) {
  // 作为键盘容器的子元素，absolute right-[-72px] top-1/2 -translate-y-1/2
  // hidden md:block，pointer-events-none，z-20
  // expression: happy / excited（里程碑）/ sad（错误）
  // bubble: getComboMilestone(combo)?.mascot 台词，里程碑时弹出
  return (
    <div className="hidden md:flex absolute right-[-72px] top-1/2 -translate-y-1/2 z-20 pointer-events-none flex-col items-end gap-1">
      {bubble && (
        <div className="animate-mascot-bubble bg-white/90 border border-sky-200 rounded-2xl px-3 py-1.5 text-sm font-bold text-sky-600 shadow-md whitespace-nowrap">
          {bubble}
        </div>
      )}
      <div className={cn('text-5xl', expression === 'excited' && 'animate-mascot-bounce', expression === 'sad' && 'animate-mascot-sad')}>
        {expression === 'happy' ? '😊' : expression === 'excited' ? '🤩' : '😖'}
      </div>
    </div>
  );
}

// 7) 错误击碎震动（包裹外层 page wrapper 触发 animate-shake-screen）
//    + 红色裂纹闪现 overlay
function ErrorShake({ triggerKey }: { triggerKey: number }) {
  if (triggerKey === 0) return null;
  return (
    <div
      key={`crack-${triggerKey}`}
      className="animate-crack-flash pointer-events-none fixed inset-0 z-40"
      style={{
        background: 'radial-gradient(circle at 50% 50%, rgba(239,68,68,0.35) 0%, transparent 60%)',
      }}
      aria-hidden
    />
  );
}

// ===== 主组件 =====
interface ComboEffectsProps {
  combo: number;
  triggerKey: number;          // 连斩 +1 时递增
  errorTriggerKey: number;      // 错误输入时递增
  enabled: boolean;
  burstCenter: { x: number; y: number } | null; // emoji 飞溅起点（复用 burstRef 测量）
  onRipple?: () => void;        // 通知外层触发键盘波纹
  onShake?: () => void;         // 通知外层给 page wrapper 添加 animate-shake-screen
}

export function ComboEffects({ combo, triggerKey, errorTriggerKey, enabled, burstCenter, onRipple, onShake }: ComboEffectsProps) {
  // 1) triggerKey 变化 → 触发对应特效（浮动文字/闪光/彩带/emoji/HUD pop/吉祥物兴奋）
  //    同时若 combo >= 5 调用 onRipple()
  // 2) errorTriggerKey 变化 → 触发 ErrorShake + 调用 onShake() + 吉祥物 sad
  // 所有特效组件均 pointer-events-none
  return (
    <>
      <ComboBanner combo={combo} triggerKey={triggerKey} />
      <ScreenFlash triggerKey={triggerKey} />
      <ConfettiBurst combo={combo} triggerKey={triggerKey} />
      <EmojiBurst combo={combo} triggerKey={triggerKey} center={burstCenter} />
      <ComboHud combo={combo} />
      <Mascot combo={combo} triggerKey={triggerKey} errorTriggerKey={errorTriggerKey} />
      <ErrorShake triggerKey={errorTriggerKey} />
    </>
  );
}
```

**彩带 canvas 实现要点**：

* 仅当 `combo >= 20` 时启动；`combo >= 50` 时数量翻倍且色板扩展。

* 起点从顶部均匀分布，初速度向下 + 水平随机，重力向下。

* 颜色用主题色系：`#0ea5e9 #10b981 #f97316 #fbbf24 #a855f7 #ffffff`。

* 单次播放约 1.6s 后 `onFinish` 清理。

**emoji 飞溅实现要点**：

* 渲染 `count` 个 `<span>`，文本为随机 emoji。
* 用内联 CSS 变量 `--tx` / `--ty` / `--rot` 控制每个 emoji 的终点位置与旋转角度（围绕 center 呈 360° 扩散，半径 60-180px 随机）。
* `className="animate-emoji-fly"`，`key=triggerKey` 保证每次重渲。
* 动画结束后 span 自然留在 DOM 但 `opacity:0`，下次触发时 key 变化整体替换。

**ComboHud 火焰等级实现**：

* `flame === 0`：仅显示数字（如 "0"），灰色。
* `flame === 1-2`：数字 + 1-2 个 🔥（静态）。
* `flame >= 3`：火焰 span 加 `animate-flame-flicker` 无限跳动。
* `flame === 5`：数字本身也用紫色光晕 `textShadow`。
* combo 变化瞬间，数字 span `key={combo}` 触发 `animate-hud-pop` 弹一下。

#### 4. [src/components/typing/virtual-keyboard.tsx](file:///d:/gitWork/yingyuleyuan/src/components/typing/virtual-keyboard.tsx) — 添加波纹 prop

在 `VirtualKeyboardProps` 增加可选 `rippleKey?: number`，在外层容器叠加一个 ripple div，`key` 变化时触发 `animate-keyboard-ripple`：

```tsx
interface VirtualKeyboardProps {
  // ...原有
  rippleKey?: number; // 连斩里程碑触发键盘波纹
}

// 在外层 bg-gradient-to-b 容器内末尾追加：
{rippleKey && rippleKey > 0 && (
  <div
    key={`ripple-${rippleKey}`}
    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-32 h-32 rounded-full bg-sky-400/40 blur-md animate-keyboard-ripple"
    aria-hidden
  />
)}
```

#### 5. [src/app/page.tsx](file:///d:/gitWork/yingyuleyuan/src/app/page.tsx) — 主控逻辑

**新增 state**（紧邻现有 `burstKey` / `burstCenter`）：

```ts
import { Sparkles } from 'lucide-react'; // 顶部 import
import { getCelebrationEnabled, setCelebrationEnabled } from '@/lib/storage';
import { ComboEffects, getComboMilestone } from '@/components/typing/combo-effects';

// state
const [celebrationEnabled, setCelebrationState] = useState(true);
const [combo, setCombo] = useState(0);
const [comboTriggerKey, setComboTriggerKey] = useState(0);     // 连斩触发序号
const [errorTriggerKey, setErrorTriggerKey] = useState(0);     // 错误触发序号
const [rippleKey, setRippleKey] = useState(0);                  // 键盘波纹序号
const [shakeKey, setShakeKey] = useState(0);                   // 屏幕震动序号
```

**挂载读取偏好**：在现有 `initWordBanks` 的 `useEffect` 里追加或新增：

```ts
useEffect(() => {
  setCelebrationState(getCelebrationEnabled());
}, []);
```

**切换开关**（在 `practiceBar` 末尾、移动端主题按钮前添加，与现有 Tooltip/Button 风格一致）：

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button
      variant="ghost"
      size="icon-sm"
      className={cn(celebrationEnabled && 'bg-amber-100 text-amber-600 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400')}
      onClick={() => {
        const next = !celebrationEnabled;
        setCelebrationState(next);
        setCelebrationEnabled(next);
        if (!next) setCombo(0); // 关闭时清零连斩
      }}
    >
      <Sparkles className="w-4 h-4" />
      <span className="sr-only">激励特效</span>
    </Button>
  </TooltipTrigger>
  <TooltipContent side="bottom">{celebrationEnabled ? '关闭激励特效' : '开启激励特效'}</TooltipContent>
</Tooltip>
```

**combo 计数与触发**（修改 `handleKeyPress` 与 `useEffect(completed)`）：

* 在 `handleKeyPress` **错误分支**（`else` 块开头，紧接 `setErrors((prev) => prev + 1);` 之后、`playErrorBuzz();` 之前）：

  ```ts
  if (celebrationEnabled) {
    setCombo(0);
    setErrorTriggerKey((k) => k + 1); // 触发错误击碎震动 + 吉祥物沮丧 + 红色裂纹
    setShakeKey((k) => k + 1);         // 让 page wrapper 添加 animate-shake-screen
  }
  ```

* 句子完成零错的 combo 累积放在 `useEffect(completed)` 中统一处理（修改该 effect，在 `if (!completed || !sentence) return;` 之后、`addError` 之前）：

  ```ts
  if (celebrationEnabled) {
    if (errors === 0) {
      const newCombo = comboRef.current + 1;
      setCombo(newCombo);
      const milestone = getComboMilestone(newCombo);
      if (milestone) {
        setComboTriggerKey((k) => k + 1); // 触发浮动文字/闪光/彩带/emoji/HUD pop/吉祥物兴奋
        if (newCombo >= 5) setRippleKey((k) => k + 1); // 键盘波纹阈值 5+
      }
    } else {
      // 句子完成但有错误：combo 已在错误输入时归零，这里不重复触发震动
      setCombo(0);
    }
  }
  ```

  注意：`combo` 与 `celebrationEnabled` 不能直接加入该 effect 的依赖（会因 combo 变化重跑导致切换句子副作用误触发）。**推荐用 ref**：

  ```ts
  const comboRef = useRef(0);
  const celebrationRef = useRef(true);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { celebrationRef.current = celebrationEnabled; }, [celebrationEnabled]);
  ```

  effect 内读 ref；依赖数组保持 `[completed]` 不变（沿用现有 `eslint-disable` 注释风格）。

**屏幕震动实现**：不作用于最外层 wrapper（避免 TopBar sticky 视觉撕裂），而是给**主内容滚动区**添加条件 class。

外层 wrapper 保持原样：
```tsx
<div className="h-full bg-gradient-to-b from-background to-muted flex flex-col">
```

主内容滚动区添加条件抖动：
```tsx
<div className={cn(
  'flex-1 min-h-0 overflow-y-auto scrollbar-hidden flex flex-col items-center justify-center px-4 py-6 md:py-10 gap-3 md:gap-4',
  celebrationEnabled && shakeKey > 0 && 'animate-shake-screen'
)}>
```

并在 `useEffect` 监听 `shakeKey` 变化后 450ms 清除（确保动画完整播放一次后重置 class，下次 key 变化能重新触发）：
```tsx
useEffect(() => {
  if (shakeKey === 0) return;
  const t = setTimeout(() => setShakeKey(0), 450);
  return () => clearTimeout(t);
}, [shakeKey]);
```

**重置 combo**：在 `loadQueue` 与 `handleReset`、`handlePrevSentence` / `handleNextSentence` 中追加 `setCombo(0)`，与 `setErrors(0)` 等并列。

**渲染特效**（紧邻现有 `<ParticleBurst .../>`）：

全屏覆盖层（ScreenFlash / ConfettiBurst / EmojiBurst / ParticleBurst / ComboBanner / ErrorShake）仍在 page.tsx 根层渲染。但 ComboHud 和 Mascot 需要放进键盘容器内，改用组合式渲染：

```tsx
// ComboEffects 拆两部分渲染：
// 1. page.tsx 根层：全屏覆盖组件（ComboBanner / ScreenFlash / ConfettiBurst / EmojiBurst / ErrorShake / ParticleBurst）
// 2. 键盘容器内：ComboHud + Mascot（absolute 定位）
```

键盘容器从 `<div className="w-full max-w-3xl">` 改为：
```tsx
<div className="relative w-full max-w-3xl">
  {/* 左侧 ComboHud */}
  {celebrationEnabled && (
    <ComboHud combo={combo} />
  )}
  {/* 中间键盘 */}
  <VirtualKeyboard ... rippleKey={rippleKey} />
  {/* 右侧 Mascot */}
  {celebrationEnabled && (
    <Mascot combo={combo} triggerKey={comboTriggerKey} errorTriggerKey={errorTriggerKey} />
  )}
</div>
```

全屏特效组件仍在 page.tsx 底部、ParticleBurst 紧邻位置：
```tsx
<ComboBanner combo={combo} triggerKey={comboTriggerKey} />
<ScreenFlash triggerKey={comboTriggerKey} />
<ConfettiBurst combo={combo} triggerKey={comboTriggerKey} />
<EmojiBurst combo={combo} triggerKey={comboTriggerKey} center={burstCenter} />
<ErrorShake triggerKey={errorTriggerKey} />
<ParticleBurst burstKey={burstKey} center={burstCenter} />
```

为简化，也可把 ComboHud + Mascot 仍作为 ComboEffects 的子组件，只在 ComboEffects 内部提供两种渲染模式（inline 传入容器 vs overlay）。但更直接的做法是直接 import 两个小组件，避免 props 穿透。

**VirtualKeyboard 传入 rippleKey**：

```tsx
<VirtualKeyboard
  nextKey={keyHint}
  typedText={typedText}
  targetText={sentence?.sentence || ''}
  onKeyPress={handleKeyPress}
  showFingerGuide={showFingerGuide}
  rippleKey={rippleKey}
/>
```

**Stats 行 combo 显示**：底部 Stats 行追加连斩显示，启用时显示，关闭时隐藏：

```tsx
{celebrationEnabled && (
  <span>连斩: <strong className="text-amber-500">{combo}</strong></span>
)}
```

注：ComboHud 组件已在 ComboEffects 内部渲染于屏幕固定位置（更醒目），Stats 行的简单文字是辅助显示。

## 假设与决策

* 默认开启激励特效（新用户即体验到），但开关持久化，关闭后跨会话保持关闭。
* 连斩仅按「整句零错完成」计数；句子完成但有错误 → 归零；切换句子、重置、退出错题模式 → 归零。
* 关闭激励特效时：
  * 不累积 combo（即使零错完成也不计数）。
  * 不显示连斩特效、键盘波纹、屏幕闪光、彩带、emoji 飞溅、HUD 火焰、吉祥物、错误震动。
  * **保留**原有 `ParticleBurst` 句子完成粒子消散与 `playErrorBuzz` 音效（基础反馈，不属于「激励」范畴）。
* 不扩展音效系统（用户未选「配合音效」）；学生喜爱特效全部为纯视觉。
* combo 与 `celebrationEnabled` 通过 ref 解耦，避免 `completed` effect 依赖数组膨胀导致切换句子副作用重跑。
* 特效组件均 `pointer-events-none`，不拦截键盘/鼠标交互。
* 吉祥物用 emoji（😊/🤩/😖）而非图片资源，零依赖；后续如需可替换为 SVG 角色。
* ComboHud 和 Mascot 用 absolute 定位在键盘容器两侧（左 HUD / 右 Mascot），随滚动自然移动，不与底部按钮/Stats/TopBar 冲突；移动端 `hidden md:block` 隐藏。
* 屏幕震动幅度 ±6px，时长 0.4s，4 次抖动，避免引发晕动不适；如需更轻可在 globals.css 调整 `--shake-amplitude`。

## 验证步骤

1. `pnpm ts-check` 通过类型检查。
2. `pnpm lint` 通过 ESLint。
3. `pnpm dev` 启动开发环境，手动验证：
   * 首次进入：激励特效默认开启（按钮高亮琥珀色），键盘左侧出现 ComboHud `0` + 右侧吉祥物 😊。
   * 连续零错完成 3 句：屏幕中央弹出「3 连斩!」浮动文字 + 8 个 emoji 飞溅 + 吉祥物变 🤩 弹「不错哦!」气泡。
   * 5 句：键盘中心扩散天蓝色波纹。
   * 10 句：全屏金光一闪 + HUD 火焰跳动 + 「太强了!」。
   * 20 句：顶部彩带洒落 + 「你是天才!」。
   * 50 句：满屏多色彩带 + 「50 神之手!」大字 + 「封神啦!」。
   * 故意打错一句：屏幕震动 0.4s + 红色裂纹闪现 0.35s + 吉祥物变 😖 抖动 0.4s + combo 归零。
   * HUD 数字：combo 增加瞬间弹一下（hud-pop）；combo ≥ 10 火焰无限跳动；combo ≥ 50 数字紫色光晕。
   * 点击 Sparkles 按钮关闭：HUD + Mascot 隐藏，再连续完成句子不再有任何连斩特效（原有粒子消散与音效仍在）。
   * 刷新页面：开关状态与上次一致（持久化生效）。
   * 切换上一题/下一题/重置/退出错题：combo 归零。
4. 键盘两侧定位验证：
   * 桌面端：ComboHud 在键盘左侧（left-[-72px]）、Mascot 在右侧（right-[-72px]），垂直居中对齐键盘。
   * 1280px 屏：键盘 768px + 两侧各 256px 空间，72px 偏移不溢出、不遮挡其他内容。
   * 移动端 (md 以下)：HUD + Mascot 隐藏，键盘恢复全宽居中，不受两侧定位影响。
5. 移动端窄屏：浮动文字、波纹、闪光、emoji 不溢出、不阻挡键盘交互；震动幅度在窄屏保持一致。

