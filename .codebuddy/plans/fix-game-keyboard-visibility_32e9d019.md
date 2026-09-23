---
name: fix-game-keyboard-visibility
overview: 修复打字游戏首页底部键盘/输入框在非运行状态下仍然显示的问题
todos:
  - id: hide-keyboard-idle
    content: 修改 game/page.tsx，底部键盘只在 running 状态显示
    status: completed
---

## 用户需求

打字游戏首页（idle 状态）不显示底部键盘，只有开始字母模式（running 状态）时才显示键盘。

## 技术方案

在 `src/app/game/page.tsx` 底部区域外层增加条件判断 `phase === 'running'`，仅当游戏运行时显示键盘。