# Photo Discovery — Discovery Phrase 改版开发文档

## 0. 本次改版原则

本次开发需要**基于现有 `photo_discovery` repo 调整**，不要重新搭建项目，也不要在第一阶段大规模修改数据库结构。

Repo：

```text
DavidOng122/photo_discovery
```

现有项目已经具备：

- Photo Upload
- Camera / Gallery
- Walk
- AI Provider abstraction
- Qwen Vision
- OpenAI Recommendation
- Supabase
- Google Places
- Recommendation
- Saved Places

这次主要调整：

```text
AI Analysis
↓
Discovery Generation
↓
Discovery Selection
↓
Recommendation
```

核心变化：

```text
Before

Photo
→ Feature Tags
→ 用户选择 1–3 Tags
→ Recommendation
```

改成：

```text
After

Photo
→ AI观察照片
→ 组合元素关系
→ 生成2–3个Discovery Phrase
→ 用户选择一个视角
→ AI解释
→ 根据该视角推荐东京中的下一地点
```

---

# 1. 产品核心

Photo Discovery 不再主要回答：

> 「この写真には何が写っている？」

而是：

> **「この写真を、まだどんな見方で見ることができる？」**

希望用户看到结果时产生：

> 「こういう見方もあるんだ。」

因此 AI 不能只是 Object Recognition，也不能只是生成几个普通 Tag。

AI 的价值是：

> **发现照片中多个元素之间原本不明显的关系，并把它表达成一个新的观察视角。**

---

# 2. 用户通常拍摄的内容

前期调研发现，散步 / 旅行照片大致包括：

1. 地标和代表性建筑
2. 街道和城市环境
3. 当地人的生活
4. 自然景色
5. 小细节
6. 食物、咖啡店、商店
7. 自己和同行的人
8. 意外遇到的瞬间

这些属于：

```text
Input Photo Types
```

不是 AI 最终向用户显示的 Discovery Category。

---

# 3. Discovery Lens

AI 使用三个主要观察角度：

```text
Space
Culture
Nature
```

日语显示：

```text
空間
文化
自然
```

## 3.1 Space / 空間

关注：

- 建筑
- 道路
- 小巷
- 材料
- 建筑排列
- 密度
- 高低差
- 边界
- 地形
- 人工环境
- 建筑与人的关系
- 建筑与自然的关系

例：

```text
Observation

坂道
細い路地
古い住宅
```

可能形成：

> **地形に沿って育った街のかたち**

## 3.2 Culture / 文化

关注：

- 当地人的生活
- 商店
- 招牌
- 食物
- 宗教
- 地方习惯
- 外来文化
- 社区
- 历史留下的生活痕迹
- 人与城市的互动

例如：

```text
英語表記
古い店舗
住宅街
```

形成：

> **日常に溶け込んだ異文化の痕跡**

## 3.3 Nature / 自然

关注：

- 植物
- 水
- 天空
- 光
- 天气
- 季节
- 海风
- 自然与城市的关系
- 人工空间中的自然
- 时间造成的变化

例如：

```text
植物
水辺
コンクリート
```

形成：

> **都市の隙間に戻ってくる自然**

---

# 4. 同一张照片可以产生多个视角

不要把照片强制分类为：

```text
这是一张 Culture Photo
```

而应该理解为：

```text
同一张照片
↓
可以从不同角度重新观察
```

例如横须贺街景：

### SPACE

> 港と暮らしが近すぎる街の境界

### CULTURE

> 日常に溶け込んだ異文化の痕跡

### NATURE

> 海風が街に残す時間の質感

这些不是三个“答案”。

而是三个：

> **Perspective / 見方**

---

# 5. Discovery 数量

每次照片分析：

```text
2–3 Discoveries
```

原则：

- 默认目标 3 个
- 内容不足可以只生成 2 个
- 不要求三个 Lens 必须全部出现
- 不可以为了数量强行生成质量低的内容
- 尽量让不同 Discovery 提供不同视角

---

# 6. 新 AI Flow

这是本次开发最重要的流程。

```text
用户拍照 / 上传照片
        │
        ↓
Client Image Preprocessing
        │
        ↓
上传照片
        │
        ↓
读取Location（如果有）
        │
        ↓
ONE Vision AI Request
        │
        ├── Extract Observations
        │
        ├── Find Relationships
        │
        ├── Generate 2–3 Discoveries
        │
        ├── Assign Lens
        │
        └── Generate Explanation
        │
        ↓
Validate AI Output
        │
        ↓
Save Analysis
        │
        ↓
Discovery Selection Screen
        │
        ↓
用户选择一个Discovery
        │
        ↓
直接显示已生成的Explanation
        │
        ↓
用户点击
「この視点から次の場所を探す」
        │
        ↓
ONE Text AI Request
        │
        ↓
Generate 3 Tokyo Place Candidates
        │
        ↓
Google Places Verification / Enrichment
        │
        ↓
Save Recommendation Set
        │
        ↓
Display Recommendations
```

完整用户体验正常情况下最多：

```text
2 AI Requests
```

### AI Call 1

```text
Vision
```

负责：

- observations
- discoveries
- explanation

### AI Call 2

```text
Text
```

负责：

- recommendation

不要增加额外：

```text
Phrase AI Call
Explanation AI Call
Lens AI Call
```

这些必须合并到第一次 Vision Request。

---

# 7. Observation

AI 首先在后台理解照片中的具体信息。

Example：

```text
英語表記
古い商店
住宅街
坂道
錆びた金属
植物
水辺
```

Observation 必须：

- 有照片证据
- 尽量具体
- 能够参与后面的关系组合

不要主要输出：

```text
建物
道路
人
車
店
空
木
```

因为这些太 generic。

---

# 8. Observation 当前不需要直接显示

目前 UX 已经有 AI 分析动画。

所以用户不需要看到：

```text
英語表記
↓
古い店舗
↓
住宅街
↓
Processing...
```

Observation 主要留在后台，用于：

- Grounding
- Discovery generation
- Explanation
- Recommendation
- Debug
- Prompt evaluation

---

# 9. Discovery Phrase

Discovery Phrase 不是 Keyword。

它是：

> **多个 Observation 之间关系的简短表达。**

## Bad

```text
英語看板のある古い街
```

只是 Description。

## Good

```text
日常に溶け込んだ異文化の痕跡
```

这里存在：

```text
Observation
↓
Relationship
↓
Interpretation
```

---

# 10. Discovery Phrase 长度

建议：

```text
日语约10–22字
```

不用严格限制。

重点：

- 一眼读完
- 有发现感
- 不过度文学化
- 可以用于 Recommendation

例：

```text
日常に溶け込んだ異文化の痕跡

地形に沿って育った街のかたち

都市の隙間に戻ってくる自然

坂の暮らしに溶け込む小さな信仰
```

---

# 11. Good Discovery 判断标准

一个好的 Discovery 应满足：

## Grounded

必须来自照片中的真实信息。

## Combination

至少结合两个 Observation。

## Relationship

不是简单：

```text
A + B
```

而是表达：

```text
A 和 B 之间产生了什么关系
```

## Interpretation

让用户看到一个新的理解方式。

## Unexpectedness

最好产生：

> 「そういう見方もあるんだ。」

## Transferable

能够把这个视角带到另外一个地方继续探索。

例如：

```text
日常に溶け込んだ異文化の痕跡
```

比：

```text
横須賀の英語看板
```

更适合推荐系统。

---

# 12. Explanation

每个 Discovery 在第一次 Vision AI 请求中已经生成 Explanation。

不要用户点击以后再调用 AI。

Explanation：

```text
2–3句
```

回答：

1. 照片里有什么依据？
2. 这些元素为什么形成这个 Discovery？

例如：

> 英語表記や海外文化を感じる店舗が、観光地として独立しているのではなく、住宅や日常の商店と混ざっています。そこから、異文化が特別なものではなく、この街の日常の一部として根付いている様子が感じられます。

---

# 13. 人物照片

人物照片允许分析。

但 AI 不重点分析：

- 人物身份
- 性格
- 年龄
- 国籍
- 外貌特征

人物应该被理解为：

> **Environment × Human Activity**

例如：

```text
河辺
友人と座る
飲み物
開放的空間
```

可以生成：

> **水辺に生まれるゆるやかな日常**

---

# 14. Discovery Selection UI

目前：

```text
ThemeSelectionScreen.tsx
```

逻辑是：

```text
Feature Tag Selection
```

需要改成：

```text
Discovery Selection
```

## Screen Example

```text
写真から見つけた、
3つの視点


[CULTURE]

日常に溶け込んだ
異文化の痕跡


[SPACE]

港と暮らしが近すぎる
街の境界


[NATURE]

海風が街に残す
時間の質感
```

Lens：

```text
空間 / 文化 / 自然
```

显示在 Phrase 上方，但视觉层级弱。

Phrase 是主角。

---

# 15. User Selection

用户选择：

```text
1 Discovery
```

然后立即展示已经生成好的 Explanation。

```text
[CULTURE]

日常に溶け込んだ異文化の痕跡

Explanation...
```

CTA：

```text
この視点から次の場所を探す
```

---

# 16. Recommendation

Recommendation 范围：

```text
Tokyo
```

每次：

```text
3 places
```

---

# 17. Recommendation 不是视觉相似搜索

Bad：

```text
用户拍英文招牌
↓
推荐另外一个英文招牌
```

Good：

```text
Discovery

日常に溶け込んだ異文化の痕跡

↓

AI理解主题

外来文化如何进入普通人的日常生活

↓

东京寻找可以继续观察这个关系的地方
```

重点：

```text
same appearance ❌

same discovery perspective ✅
```

---

# 18. 推荐结果

每个地点：

```text
Name
Area
Image
Reason
Google Maps
```

Reason 必须说明：

> 为什么这个地方能够延续刚刚选择的 Discovery Perspective。

---

# 19. 新 AI Schema

建议：

```ts
type DiscoveryLens =
  | "space"
  | "culture"
  | "nature";

interface Observation {
  label: string;
  evidence: string;
}

interface DiscoveryOption {
  lens: DiscoveryLens;
  phrase: string;
  explanation: string;
  observationLabels: string[];
}

interface PhotoDiscoveryAnalysis {
  title: string;
  observations: Observation[];
  discoveries: DiscoveryOption[];
}
```

---

# 20. Example AI Output

```json
{
  "title": "横須賀の街角",
  "observations": [
    {
      "label": "英語表記",
      "evidence": "店舗の看板に英語表記が確認できる"
    },
    {
      "label": "古い商店",
      "evidence": "昔ながらの小規模店舗が並んでいる"
    },
    {
      "label": "住宅街",
      "evidence": "店舗の近くに住宅や生活道路が見られる"
    },
    {
      "label": "港町らしい景観",
      "evidence": "沿岸地域特有の街並みが確認できる"
    }
  ],
  "discoveries": [
    {
      "lens": "culture",
      "phrase": "日常に溶け込んだ異文化の痕跡",
      "explanation": "英語表記や海外文化を感じる店舗が、住宅や日常の商店と混ざっています。異文化が特別なものではなく、この街の日常の一部として根付いている様子が感じられます。",
      "observationLabels": [
        "英語表記",
        "古い商店",
        "住宅街"
      ]
    },
    {
      "lens": "space",
      "phrase": "港と暮らしが近すぎる街の境界",
      "explanation": "港町らしい空間と住宅、商店が近い距離で混ざっています。港のための空間と生活空間の境界が曖昧になっている点が特徴的です。",
      "observationLabels": [
        "住宅街",
        "港町らしい景観",
        "古い商店"
      ]
    }
  ]
}
```

---

# 21. 基于当前 Repo 的修改范围

当前主要 AI 文件：

```text
src/lib/ai/analyzeWalk.ts

src/lib/ai/generateRecommendations.ts

src/lib/ai/provider.ts

src/lib/ai/schemas.ts

src/lib/ai/prompts/analyzeWalkPrompt.ts

src/lib/ai/prompts/recommendPlacesPrompt.ts

src/lib/ai/providers/openai.ts

src/lib/ai/providers/qwen.ts
```

Discovery UI：

```text
src/components/discovery/
```

目前重点：

```text
ThemeSelectionScreen.tsx
ThemeSelectionScreen.module.css
DiscoveryTag.tsx
DiscoveryTagList.tsx
DiscoveryTagSelector.tsx
```

Recommendation：

```text
src/components/recommendation/
```

---

# 22. Current AI Architecture

目前 repo 已经分开：

```text
VISION_PROVIDER

RECOMMENDATION_PROVIDER
```

这个设计保留。

目前默认：

```text
Vision
→ Qwen

Recommendation
→ OpenAI
```

不要把两个任务重新合并到同一个 Provider。

---

# 23. 新模型职责

## Vision Model

负责：

```text
Visual Understanding
+
Observation Extraction
+
Relationship Discovery
+
Discovery Phrase
+
Lens
+
Explanation
```

全部一次完成。

## Text Model

负责：

```text
Selected Discovery
↓
Tokyo Place Recommendation
```

不需要再次看图片。

## Google Places

负责：

```text
Place Verification
Images
Address
Place ID
Map Information
```

不要让 LLM 负责 Google Places 已经能可靠完成的事情。

---

# 24. Performance & Cost Optimization

本功能是用户拍照后立即获得结果，因此：

> **Latency 是产品体验的一部分。**

不仅考虑 AI 输出质量，也必须考虑：

```text
Speed
Cost
Consistency
```

---

# 25. Performance Target

## Discovery Analysis

```text
P50 < 4 sec
P95 < 8 sec
```

## Recommendation

```text
P50 < 4 sec
P95 < 8 sec
```

## Cached Result

```text
< 500 ms
```

---

# 26. 最多两次 AI Request

一次完整用户体验：

```text
Vision Call × 1

Text Recommendation Call × 1
```

不要：

```text
Observation Call
↓
Phrase Call
↓
Explanation Call
↓
Lens Call
↓
Recommendation Call
```

否则：

- 延迟增加
- API cost 增加
- failure point 增加

---

# 27. 三个 Discovery 必须一次生成

Bad：

```text
AI Call 1 → Space

AI Call 2 → Culture

AI Call 3 → Nature
```

Good：

```text
ONE Vision Call

→ observations

→ discovery 1
→ discovery 2
→ discovery 3
```

---

# 28. 图片预处理

手机照片可能是：

```text
4000 × 3000

6000 × 4000

5–10 MB
```

没有必要直接把原图用于 Vision。

建议：

```text
Original Photo
↓
Generate Analysis Version
↓
Long Edge ≈ 1280 px
↓
JPEG / WebP
quality ≈ 70–80
```

原图可以继续保存。

AI 使用：

```text
analysis image
```

目标：

```text
约300–600KB
```

具体大小根据实际测试决定，不需要硬限制。

---

# 29. 为什么暂时选择1280px

Photo Discovery 需要分析：

- 招牌
- 建筑细节
- 材料
- 街景关系
- 小物件

512px 可能损失太多信息。

第一阶段：

```text
1280px long edge
```

之后测试：

```text
768
1024
1280
```

比较：

```text
Discovery Quality
Latency
Cost
```

---

# 30. 不要第一版做复杂 Adaptive Vision

未来可以实现：

```text
Low Resolution Analysis
↓
Insufficient?
↓
High Detail Retry
```

但 MVP 暂时不要。

先使用固定压缩规格，保证简单和稳定。

---

# 31. Prompt Optimization

开发文档可以很详细。

但 Production Prompt 不需要复制完整开发文档。

Prompt 应保持：

```text
Short
Explicit
Structured
```

避免大量：

- 重复定义
- 过多 Example
- 长篇解释

减少：

```text
input tokens
```

并降低模型 processing time。

---

# 32. Output Optimization

Vision 输出限制：

## Observations

```text
4–6
```

必要时最多：

```text
8
```

## Discoveries

```text
2–3
```

## Explanation

```text
2–3 short sentences
```

不要要求模型输出：

- Chain of thought
- 长篇分析
- 多余 metadata
- 大量候选 phrase

---

# 33. Explanation Pre-generation

Explanation 必须在第一次 Vision Request 一起生成。

```text
Vision
↓
Phrase + Explanation
```

用户点击 Discovery 时：

```text
直接展开 explanation
```

不要再请求 AI。

这样点击体验应接近即时响应。

---

# 34. Location

如果照片或用户提供：

```text
GPS / Location
```

直接作为：

```text
AnalyzeWalkInput.location
```

提供给系统。

不要要求 Vision Model：

> 根据照片猜地点。

这样：

- 更快
- 更准
- 更便宜

---

# 35. Recommendation Model

Recommendation 已经不需要处理图片。

因此使用：

```text
fast / lower-cost text model
```

即可。

不需要使用 Vision Model。

优先考虑：

```text
Consistency
Structured JSON
Speed
Cost
```

而不是模型最大推理能力。

---

# 36. Recommendation 数量固定 3 个

目前 schema 支持：

```text
3–5 places
```

新版本建议：

```text
3 places
```

原因：

- UI 更清楚
- output tokens 更少
- Google Places 请求更少
- 用户选择压力更小
- latency 更低

---

# 37. Cache

同一 Walk 分析完成后：

```text
不要再次调用AI
```

需要保存：

```text
observations
discoveries
analysisVersion
```

用户重新打开 Walk：

```text
Database
↓
Render
```

---

# 38. Recommendation Cache

用户已经选择一个 Discovery 并生成 recommendation 后：

```text
保存 Recommendation Set
```

重新进入时：

```text
DB
↓
Display
```

不要重新调用 Recommendation AI。

---

# 39. Prompt / Analysis Version

建议保存：

```ts
analysisVersion: "discovery-v1"
```

未来修改 prompt：

```text
discovery-v2
discovery-v3
```

这样方便测试：

- 哪个版本生成效果好
- 哪个版本变慢
- 哪个版本成本增加
- 哪个版本错误更多

---

# 40. Retry Policy

当前代码需要注意：

```text
analyzeWalk.ts
```

存在 retry。

同时：

```text
QwenProvider
```

内部也存在 retry。

这样可能出现：

```text
Outer retry
×
Provider retry
```

导致一次请求实际执行多次模型调用。

需要调整。

推荐 Retry 只保留一层。

例如统一放：

```text
analyzeWalk.ts
```

规则：

```text
Initial request
+
maximum 1 retry
```

即：

```text
最多2次
```

---

# 41. 什么情况可以 Retry

可以 retry：

```text
Invalid JSON

Schema validation failure

Temporary API error

Timeout
```

---

# 42. 什么情况不要 Retry

例如：

```text
Missing image

Unsupported file

Invalid input

Authentication error

Permanent configuration error
```

不要无意义消耗 API。

---

# 43. Latency Logging

需要新增 timing measurement。

至少记录：

```text
analysisDurationMs

recommendationDurationMs
```

同时记录：

```text
provider

model

photoCount

retryCount

success

failureReason
```

---

# 44. AI Cost / Usage Logging

如果 Provider API 返回 usage，记录：

```text
inputTokens

outputTokens
```

以及可能的：

```text
imageTokens
```

最终希望能够计算：

```text
Average Cost Per Analysis

Average Cost Per Recommendation

Average Cost Per Full Session
```

---

# 45. 为什么需要记录 Cost

不要一开始过早优化模型价格。

先测真实数据：

```text
Quality
Latency
Cost
```

然后比较不同模型。

---

# 46. Loading Animation

现有分析动画继续使用。

可以让 Loading 状态表达真正正在发生的事情：

```text
写真を見ています

↓

視点を探しています

↓

写真の中のつながりを見つけています
```

不要显示：

```text
AI Processing 48%
```

除非真的有 Progress Data。

---

# 47. Animation 不可以故意延迟

Backend Result Ready：

```text
→ immediately move forward
```

不要为了播放完整动画强制等待。

Loading Animation：

```text
follows backend
```

而不是：

```text
backend waits animation
```

---

# 48. Error / Slow Response UX

如果正常：

```text
0–8s
```

显示分析动画。

如果明显过慢：

```text
仍保持当前画面
+
轻量提示
```

例如：

```text
もう少し写真を見ています…
```

真正失败后才显示：

```text
写真の分析に失敗しました。
もう一度お試しください。
```

---

# 49. Performance Monitoring

测试阶段至少收集：

```text
20–50 analyses
```

观察：

```text
average latency

P50

P95

retry rate

validation failure rate

average token usage
```

不要只测试一两张照片判断速度。

---

# 50. AI Quality Test Set

建立固定测试照片集。

建议包含：

```text
建筑
普通街道
自然
商店
招牌
人物
食物
地标
小细节
夜景
意外事件
复杂街景
```

每次换：

```text
Prompt
Model
Image Resolution
```

都跑同一组照片。

这样才能真正比较。

---

# 51. AI Evaluation Criteria

每个结果评估：

### Grounding
是否真的来自照片。

### Discovery
是否有新的观察角度。

### Diversity
2–3 个 Discovery 是否不同。

### Phrase Quality
是否自然、简洁、有意思。

### Explanation
是否合理解释 Phrase。

### Recommendation Transferability
是否能够用于寻找其他地点。

### Latency
生成多久。

### Cost
一次调用成本。

---

# 52. 新 Analyze Prompt 核心方向

文件：

```text
src/lib/ai/prompts/analyzeWalkPrompt.ts
```

核心需要改成：

```text
You analyze photos from a walking experience.

Your goal is not simply to identify objects.

First identify meaningful visible observations.

Then find interesting relationships between those observations.

Generate 2–3 different Discovery Perspectives.

Each Discovery must have:

- lens
- phrase
- explanation
- supporting observation labels

Allowed lenses:

space
culture
nature

Do not force every lens.

A good Discovery should make the user feel:

"I had not thought about my photo in that way."

BAD:

英語看板のある古い街
神社のある坂道

GOOD:

日常に溶け込んだ異文化の痕跡
坂の暮らしに溶け込む小さな信仰
都市の隙間に戻ってくる自然

Every Discovery must be supported by at least two observations.

Do not make unsupported historical or cultural claims.

Return structured JSON only.
```

实际 Production Prompt 可以在实现时进一步压缩。

---

# 53. 新 Schema

文件：

```text
src/lib/ai/schemas.ts
```

建议：

```ts
export const DiscoveryLensSchema = z.enum([
  "space",
  "culture",
  "nature",
]);

export const ObservationSchema = z.object({
  label: z.string().min(1).max(50),
  evidence: z.string().min(5).max(180),
});

export const DiscoveryOptionSchema = z.object({
  lens: DiscoveryLensSchema,

  phrase: z
    .string()
    .min(5)
    .max(80),

  explanation: z
    .string()
    .min(20)
    .max(350),

  observationLabels: z
    .array(z.string())
    .min(2)
    .max(5),
});

export const AnalyzeWalkOutputSchema = z.object({
  title: z.string().min(2).max(80),

  observations: z
    .array(ObservationSchema)
    .min(2)
    .max(8),

  discoveries: z
    .array(DiscoveryOptionSchema)
    .min(2)
    .max(3),
});
```

---

# 54. analyzeWalk.ts 修改

当前文件：

```text
src/lib/ai/analyzeWalk.ts
```

旧逻辑主要验证：

```text
tags
duplicate labels
generic labels
```

新逻辑：

### Validate Discoveries

- 2–3 个
- phrase 不重复
- lens 合法
- explanation 非空
- 每个 Discovery 至少引用 2 个 Observation

### Validate Observations

- observationLabels 必须真的存在
- 不要全部都是 generic object

---

# 55. provider.ts 修改

当前：

```text
src/lib/ai/provider.ts
```

旧：

```text
DiscoveryFeature
selectedFeatures
selectedTags
```

新分析部分改成：

```ts
export interface Observation {
  label: string;
  evidence: string;
}

export interface DiscoveryOption {
  lens: "space" | "culture" | "nature";
  phrase: string;
  explanation: string;
  observationLabels: string[];
}
```

---

# 56. Recommendation Input

Recommendation 改成：

```ts
interface GenerateRecommendationsInput {
  selectedDiscovery: {
    lens: "space" | "culture" | "nature";
    phrase: string;
    explanation: string;
    observationLabels: string[];
  };

  observations: Observation[];

  currentCity?: string | null;

  originalLocation?: string | null;

  excludedPlaceNames?: string[];

  outputLanguage: "ja";
}
```

---

# 57. Recommendation Prompt

文件：

```text
src/lib/ai/prompts/recommendPlacesPrompt.ts
```

核心：

```text
The user selected:

Lens:
${lens}

Discovery Phrase:
${phrase}

Explanation:
${explanation}

Supporting observations:
${observations}

Recommend exactly 3 real places in Tokyo.

Do NOT simply find visually similar places.

Find places where the user can continue exploring the same relationship, theme, or perspective.

Each recommendation must clearly explain why this place extends the selected Discovery.

Return structured JSON only.
```

---

# 58. Qwen Provider 修改注意

当前：

```text
src/lib/ai/providers/qwen.ts
```

里面仍然存在：

```text
tags
features
normalizeFeatureType
```

新版本需要删除 / 替换这套 normalization。

改成对应：

```text
observations
discoveries
lens
phrase
explanation
```

同时：

> 不要在 Provider 内再做额外 retry。

Retry 统一到上层。

---

# 59. OpenAI Provider

当前：

```text
src/lib/ai/providers/openai.ts
```

使用：

```text
zodResponseFormat
```

这个结构可以继续保留。

只需要换新的：

```text
AnalyzeWalkOutputSchema
```

Recommendation 同理。

---

# 60. Frontend 修改

主要：

```text
src/components/discovery/ThemeSelectionScreen.tsx
```

从：

```text
Tag Selector
```

改成：

```text
Discovery Cards
```

旧：

```text
MAX_SELECTIONS = 3
```

不再需要。

因为：

```text
用户只能选择一个Discovery
```

---

# 61. 不要立即删除旧 Component

第一阶段先保留：

```text
DiscoveryTag
DiscoveryTagList
DiscoveryTagSelector
```

等新 flow 完成且测试稳定后，再 cleanup。

避免同时：

```text
Feature Rewrite
+
Major Deletion
```

导致 Debug 困难。

---

# 62. Implementation Plan

## Phase 1 — AI Schema

修改：

```text
schemas.ts
provider.ts
```

建立新的数据结构。

## Phase 2 — Vision Analysis

修改：

```text
analyzeWalkPrompt.ts
analyzeWalk.ts
openai.ts
qwen.ts
```

目标：

```text
Photo
↓
Observation
↓
2–3 Discoveries
```

先通过 console / server logs 验证。

暂时不要急着修改 UI。

## Phase 3 — Performance

加入：

```text
image preprocessing
latency logging
retry cleanup
usage logging
```

确认：

```text
Vision call only once
```

## Phase 4 — Discovery UI

修改：

```text
ThemeSelectionScreen.tsx
ThemeSelectionScreen.module.css
```

完成：

```text
Lens
+
Phrase
+
Selection
+
Explanation
```

## Phase 5 — Recommendation Input

修改：

```text
generateRecommendations.ts
recommendPlacesPrompt.ts
provider.ts
```

从：

```text
selectedTags
```

迁移到：

```text
selectedDiscovery
```

## Phase 6 — Google Places

保留当前 enrichment。

确认：

```text
LLM gives candidate places
↓
Google Places verifies
↓
UI renders
```

## Phase 7 — Cache

分析完成：

```text
Save Analysis
```

推荐完成：

```text
Save Recommendation Set
```

重新进入时不重复调用 AI。

## Phase 8 — Cleanup

确认新版本稳定以后：

删除或移除旧：

```text
selectedTags

selectedFeatures

MAX_SELECTIONS

旧DiscoveryTag selection flow

旧Prompt logic
```

---

# 63. MVP Success Criteria

测试至少：

```text
10–20种照片
```

最好逐步扩展到：

```text
30–50张
```

## Product Quality

用户是否觉得：

> 「こういう見方もあるんだ。」

## AI Quality

Discovery：

- 有依据
- 不是 object detection
- 有关系
- 不胡说
- 2–3 个有差异

## Recommendation Quality

地点：

- 真实存在
- 东京范围
- 能延续 Discovery
- 不只是外观相似

## Performance

目标：

```text
Vision

P50 < 4s
P95 < 8s
```

```text
Recommendation

P50 < 4s
P95 < 8s
```

## Cost

能够记录：

```text
cost / analysis

cost / recommendation

cost / session
```

---

# 64. 最终系统架构

```text
                 ┌─────────────────┐
                 │   User Photo    │
                 └────────┬────────┘
                          │
                          ▼
                 Image Compression
                    ≈ 1280px
                          │
                          ▼
                  Upload / Storage
                          │
                          ▼
                Location Context
                          │
                          ▼
               ┌──────────────────┐
               │   Vision Model   │
               └────────┬─────────┘
                        │
             ┌──────────┼──────────┐
             ▼          ▼          ▼
       Observations  Discoveries Explanation
                        │
                        ▼
                 Save Analysis
                        │
                        ▼
              Discovery Selection
                        │
                        ▼
               Selected Discovery
                        │
                        ▼
               ┌─────────────────┐
               │   Text Model    │
               └────────┬────────┘
                        │
                        ▼
                3 Tokyo Places
                        │
                        ▼
                 Google Places
                        │
                 Verify + Enrich
                        │
                        ▼
             Save Recommendation
                        │
                        ▼
                    Display
```

---

# 65. 最终产品定义

Photo Discovery 不只是：

> 写真から場所を推薦するサービス

而是：

> **何気ない写真から、まだ気づいていなかった「見方」を見つけ、その視点を次の街歩きにつなげるサービス。**

AI Flow 最核心的是：

```text
SEE
↓
CONNECT
↓
INTERPRET
↓
DISCOVER
↓
EXPLORE
```

即：

```text
照片中看到了什么
↓
这些东西之间有什么关系
↓
这个关系可以怎样理解
↓
形成一个新的Discovery
↓
把这个视角带去另一个地方
```

这次开发应始终围绕这条流程，而不是重新变回：

```text
Photo
→ Tags
→ Similar Places
```
