# Photo Discovery

Photo Discovery 是一个基于照片的 AI 发现应用。它的核心目标是：

- 用户上传一张或多张照片
- AI 识别照片中“可迁移的特征”，而不是只做单纯对象标签
- 用户从中选 1~3 个特征
- AI 根据这些特征推荐当前城市中相似氛围/风格/文化感的地点
- 返回结果并提供 Google Maps 跳转

当前项目已经从“数据库驱动/持久化流程”调整为“无 Supabase 运行时状态”的 stateless MVP 架构。

## 当前状态

目前的项目架构是：

1. 用户在首页选择图片
2. 前端把图片上传到 `/api/analyze`
3. Qwen Vision 对图片做特征提取，输出文化 / 风格 / 氛围类标签
4. 前端展示这些特征，用户选择 1~3 个最相关的主题
5. 前端调用 `/api/recommend`
6. OpenAI 根据选择的 feature 生成推荐地点
7. Google Places 可选增强地理信息/图片
8. 前端渲染最终推荐卡片列表

这条链路不依赖数据库、不依赖用户认证、不依赖 Supabase 运行时配置。

## 关键技术栈

- Next.js 16
- React 19
- TypeScript
- OpenAI SDK
- Qwen-compatible OpenAI client
- Google Places API（可选增强）
- App Router

## 当前架构特点

### 1. Stateless MVP

当前版本的设计目标是“完全不要求持久化”，也就是说：

- 没有用户登录流程
- 没有保存 walk / recommendation 的数据库表
- 没有 Supabase runtime 依赖
- 用户每次流程都在前端和 API 层中完成临时状态处理

这意味着本项目适合：

- 快速验证 AI 交互
- 纯前端 Demo
- 重构为更简单的照片 → 特征 → 推荐工作流

### 2. Feature-based analysis, not object tags

AI 不再简单输出“山、桥、树、建筑”这样的对象标签，而是提取更有迁移性的表达：

- culture
- style
- atmosphere

例如：

- 历史与现代共存的街景
- 花与传统建筑的和谐
- 水边与复古街灯的散步氛围

这样的输出更适合作为推荐依据。

### 3. Recommendation pipeline

推荐链路由两步构成：

- 视觉分析：Qwen 提取 feature
- 推荐生成：OpenAI 根据 selectedFeatures 生成 3 个候选地点

生成后，结果还会经过 Google Places enrichment（如果 API key 存在）以补充：

- place id
- formatted address
- photo image
- map query

## 目录结构

```bash
src/
  app/
    api/
      analyze/route.ts         # 分析照片，返回 feature
      recommend/route.ts       # 根据 selected features 推荐地点
  components/
    home/MinimalHome.tsx       # 当前主入口
    discovery/
    recommendation/
    upload/
  lib/
    ai/
      index.ts                 # AI provider router
      analyzeWalk.ts           # 图片分析入口
      generateRecommendations.ts
      providers/
      prompts/
    maps/
      googlePlaces.ts          # Google Places enrichment
  public/figma/
```

## 环境变量

复制 `.env.example` 为 `.env.local`，填写真实值：

```bash
cp .env.example .env.local
```

当前推荐的最小配置是：

```env
QWEN_API_KEY=your_qwen_key
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_VISION_MODEL=qwen-vl-plus
QWEN_TEXT_MODEL=qwen-plus

OPENAI_API_KEY=your_openai_key
OPENAI_BASE_URL=
OPENAI_RECOMMENDATION_MODEL=gpt-4o-mini

GOOGLE_PLACES_API_KEY=your_google_places_key
```

注意：

- 当前版本不要求 `NEXT_PUBLIC_SUPABASE_*` 或 `SUPABASE_*` 运行时变量
- 这部分是 legacy / transitional 配置，不属于当前主流程
- 如果没有 Google Places API key，推荐流程仍可运行，只是不会强化地图信息

## 本地开发

```bash
npm install
npm run dev
```

然后访问：

```bash
http://localhost:3000
```

## 构建验证

已验证可执行：

```bash
npm run build
```

这说明当前代码在当前的 stateless 架构下可以正常编译，且 App Router 路由和 API handler 已经接上。

## 运行流程说明

### 1) 上传照片

用户选择照片后，应用会进入分析 loading screen。

### 2) AI 分析

调用：

```http
POST /api/analyze
```

请求体：

- `FormData`
- field: `photos`

返回：

```json
{
  "features": [
    { "label": "历史与现代共存的街景", "type": "culture", "reason": "..." }
  ]
}
```

### 3) 选择特征

前端展示 1~3 个 feature，用户最终确认自己的偏好。

### 4) 生成推荐

调用：

```http
POST /api/recommend
```

请求体：

```json
{
  "selectedFeatures": [
    { "label": "历史与现代共存的街景", "type": "culture", "reason": "..." }
  ],
  "currentCity": "Tokyo",
  "originalArea": "Yokosuka"
}
```

返回：

```json
{
  "places": [
    {
      "name": "某处地标",
      "area": "Shibuya",
      "reason": "...",
      "matchedFeatures": ["历史与现代共存的街景"],
      "googleMapsUrl": "https://..."
    }
  ]
}
```

## 边界与说明

### 这不是数据库驱动应用

当前版本不是传统的 walk-based app。它并不是从数据库读取/保存 walk、auth、saved place 或 recommendation records。

它更接近：

- 一次性的照片发现 Demo
- 临时 session 级别的AI推荐体验
- 面向产品验证的最小可运行流程

### 旧代码仍保留

仓库里仍然有一些 legacy 的 Supabase / walk 代码，但它们不是当前主流程的一部分。当前主入口已经切换到新的 stateless flow。

## 未来方向

后续如果要继续扩展，可按下面顺序演进：

1. 把临时 state 改成真正的前端 session store
2. 增加推荐结果缓存
3. 若需持久化，再按“可选 persistence”拆分模块，而不是默认依赖 Supabase
4. 扩展到路线、收藏、历史记录等体验

## 总结

当前项目的真实状态是：

- 不是老的 Supabase walk app
- 是一个 Photo → Feature → Recommendation 的无状态 AI 发现应用
- 重点在于“可迁移特征识别”和“根据照片气质做地方推荐”
- 运行时无需数据库，目标是让核心流程尽可能简单、清晰、可验证
