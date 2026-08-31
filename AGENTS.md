# AGENTS.md - EngExplorer 英语探索岛

## 项目概览
一款参考探趣岛风格的英语学习网页应用，包含课程学习、互动练习、进度追踪、社区互动和个性化推荐五大模块。

## 技术栈
- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI**: shadcn/ui + Tailwind CSS 4
- **Font**: Nunito (via next/font)

## 构建与运行
```bash
pnpm dev        # 开发环境
pnpm build      # 生产构建
pnpm ts-check   # TypeScript 检查
pnpm lint       # ESLint 检查
```

## 目录结构
```
src/
├── app/
│   ├── layout.tsx          # 全局布局（侧边栏+顶栏）
│   ├── page.tsx            # 首页（学习概览+推荐）
│   ├── globals.css         # 全局样式+主题变量
│   ├── courses/
│   │   ├── page.tsx        # 课程列表页
│   │   └── [id]/page.tsx   # 课程详情页
│   ├── practice/page.tsx   # 互动练习页
│   ├── progress/page.tsx   # 学习进度页
│   └── community/page.tsx  # 社区互动页
├── components/
│   ├── layout/             # 布局组件（sidebar, header, mobile-nav）
│   └── ui/                 # shadcn/ui 组件
└── lib/
    ├── utils.ts            # 工具函数
    └── data.ts             # Mock 数据与类型定义
```

## 设计规范
- 主色：sky-500（海洋青）
- 辅助色：emerald-500（薄荷绿）、orange-500（珊瑚橙）
- 圆角统一使用 xl/2xl
- 卡片带柔和阴影，hover 时上浮
- 详见 DESIGN.md

## 关键文件
- `src/lib/data.ts` - 所有 Mock 数据和 TypeScript 类型定义
- `src/components/layout/sidebar.tsx` - 桌面端侧边导航
- `src/components/layout/mobile-nav.tsx` - 移动端导航（底部 Tab + 侧滑菜单）
- `src/app/globals.css` - CSS 变量、动画定义
