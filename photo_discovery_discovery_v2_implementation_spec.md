# Photo Discovery — Discovery Perspective V2 实施开发文档

> 状态：可实施规格（替换旧的 Tag Selection 改版文档）  
> 产品显示语言：日语  
> 本次目标：在现有 `photo_discovery` 项目中迁移，不重建项目；不改写已应用的 Supabase migration。

## 0. 给 Copilot 的执行约束

先完整阅读仓库根目录的 `AGENTS.md`，并在写 Next.js 代码前阅读本项目 `node_modules/next/dist/docs/` 中与 Route Handler、Client Component、App Router 对应的当前版本文档。项目使用 Next.js 16，不能按旧版 Next.js 约定猜测 API。

实施时遵守以下硬规则：

- 仅添加新的 migration；绝不修改 `supabase/migrations/001` 至 `018`。
- 保留现有 `walks`、`walk_photos`、`discovery_tags`、`recommendation_sets` 的物理表名，避免首版大规模数据搬迁。代码层一律使用 **discovery**，不再使用 tag/feature/theme 作为 V2 的产品概念。
- 正常一次体验只有两个逻辑 AI 阶段：一次 Vision 分析、一次 Text 推荐。Google Places 不是 AI 调用。
- 所有用户可见 AI 文案为日语；内部日志、错误码可以是英文。
- 新流程稳定、测试通过前，不删除旧组件或旧 migration。完成后再删除未引用的旧代码。
- 不记录原始图片 URL、签名 URL、图片内容、完整 Prompt 或完整模型回复到日志。

## 1. 本次改版的明确产品定义

产品不是“找照片里有什么”或“找视觉相似的地点”。它让用户从照片中得到一个可带去下一次街步的观察视角：

```text
照片 / 一次 Walk
  -> 可见观察（Observation）
  -> 元素关系（模型内部推理，不输出思维链）
  -> 2–3 个 Discovery Perspective
  -> 用户选 1 个视角并阅读解释
  -> 东京中能延续该视角的 3 个真实地点
```

本版固定决策如下，实施中不要再自行补出第二套行为：

| 项目 | V2 决策 |
| --- | --- |
| 分析单位 | 一个 `Walk`，包含 1–10 张按上传顺序排列的照片；一次 Vision 请求一起看完该 Walk 的全部分析图。 |
| Discovery 数量 | 2 或 3 个。照片证据不足时是 2 个，不能为了凑满 3 个编造。 |
| Lens | 仅 `space`、`culture`、`nature`；可重复，不要求三个 Lens 都出现。 |
| 用户选择 | 只选 1 个 Discovery；点击卡片立刻在本地展开已生成的 explanation；点击 CTA 后选择不可更改。 |
| 推荐范围 | 始终是 **Tokyo / 東京都**。`walk.location` 是照片上下文，绝不能覆盖推荐城市。 |
| 推荐数量 | 恰好 3 个通过 Google Places 验证的地点。 |
| 旧状态名 | V2 首发保留数据库 enum 的 `TAG_SELECTION`，它在产品/UI 中一律称为“Discovery Selection”。不在本版改 enum。 |
| 旧数据 | 既有 `COMPLETED` Walk 可继续浏览；不回填、不重新调用 AI。升级前尚未完成的 Walk 要求用户重新创建，不把原图无压缩地发给 Vision。 |

### 1.1 术语表

- **Observation**：照片中能直接找到的具体证据，例如“店铺招牌上的英语表记”。不直接显示给用户。
- **Discovery**：由至少两个 Observation 支持的短语、Lens 与解释；是用户选择的对象。
- **Lens**：`space`（空間）、`culture`（文化）、`nature`（自然）。它是弱标签，Phrase 才是卡片主角。
- **Phrase**：日语短语，建议 10–22 个日文字符；不强制按字符截断。它不能只是物体清单。
- **Explanation**：2–3 个简短日语句子，说明照片证据如何构成该视角。
- **Analysis image**：供 Vision 使用的压缩副本；原始上传照片仍保留作用户浏览。

### 1.2 V2 范围与非范围

本版包含：Discovery 生成、选择与解释、固定东京推荐、图片分析副本、缓存、Google Places 验证、性能/用量记录、迁移和测试。

本版不包含：EXIF/GPS 自动读取、用户修改已确认的 Discovery、多个推荐城市、流式 token 输出、低清分析失败后自动高分辨率重试、人物身份/年龄/国籍/性格推断、模型自主生成 Google 图片 URL。

`walk.location` 仅来自现有的用户输入。若为空，模型不得猜测精确地点；若不为空，也只能当作低可信背景，不得把它当作照片事实。

## 2. 用户流程、状态与失败恢复

### 2.1 正常流程

```text
上传原图 + 客户端生成 analysis image
  -> DRAFT
  -> 原子地领取分析工作，转为 ANALYZING
  -> Vision（一次请求）生成 title + observations + discoveries
  -> 原子保存，转为 TAG_SELECTION（产品名：Discovery Selection）
  -> 用户在卡片中选择一个 Discovery，立即查看本地已有 explanation
  -> 点击「この視点から次の場所を探す」
  -> 原子保存唯一 selected discovery，转为 RECOMMENDING
  -> Text（一次请求）给出 3 个候选
  -> Google Places 分别验证并补充
  -> 原子保存推荐集，转为 COMPLETED
```

状态转换必须是：

```text
DRAFT -> ANALYZING -> TAG_SELECTION -> RECOMMENDING -> COMPLETED
```

`ANALYZING -> ANALYZING` 和 `RECOMMENDING -> RECOMMENDING` 只用于同一工作的短暂重试/轮询；不能借此启动并发模型调用。

### 2.2 并发、刷新与重试

当前 `/analyze` 允许 `ANALYZING` 再次进入，会在双击、刷新或多标签页时重复调用模型；V2 必须修复。

- 领取分析时使用条件更新：仅 `status = 'DRAFT'` 且尚无成功 `walk_analyses` 的记录才可写入 `ANALYZING` 和 `analysis_started_at`。只有更新成功的请求可调用 Vision。
- 若页面看到 `ANALYZING` 且没有结果，显示 loading 并每 1.5 秒读取 walk 状态；不再次 POST 分析。
- 分析失败：清空 `analysis_started_at`，状态恢复 `DRAFT`，界面显示“写真の分析に失敗しました。もう一度お試しください。”；用户点击后才开始新的一次逻辑分析。
- 选择 CTA 通过一个事务把唯一 Discovery 设为 `selected=true` 并转为 `RECOMMENDING`。重复提交同一个 id 是幂等成功；不同 id 返回 `409 SELECTION_ALREADY_CONFIRMED`。
- 推荐工作同样以 `recommendation_started_at` 条件更新领取。已存在完整 recommendation set 时直接返回缓存，绝不再次调用模型。
- 推荐失败保留已选择 Discovery，清空 `recommendation_started_at`，维持 `RECOMMENDING`，允许用户点击“もう一度探す”。
- 仅当 started 时间超过 15 分钟（远高于 Route Handler 超时）才允许服务端释放陈旧锁；释放和重新领取要有审计日志。

## 3. V2 数据契约

### 3.1 TypeScript 与 Zod 的唯一业务模型

在 `src/lib/ai/schemas.ts` 定义，并从此处推导类型。不要在 Provider、Route、Client 各自复制 shape。

```ts
export const DiscoveryLensSchema = z.enum(["space", "culture", "nature"]);

export const ObservationSchema = z.object({
  id: z.string().regex(/^o[1-8]$/),
  label: z.string().min(1).max(50),
  evidence: z.string().min(5).max(180),
});

export const DiscoveryOptionSchema = z.object({
  lens: DiscoveryLensSchema,
  phrase: z.string().min(5).max(80),
  explanation: z.string().min(20).max(350),
  observationIds: z.array(z.string().regex(/^o[1-8]$/)).min(2).max(5),
});

export const AnalyzeWalkOutputSchema = z.object({
  title: z.string().min(2).max(80),
  observations: z.array(ObservationSchema).min(2).max(8),
  discoveries: z.array(DiscoveryOptionSchema).min(2).max(3),
});

export const RecommendationCandidateSchema = z.object({
  name: z.string().min(1).max(100),
  area: z.string().min(1).max(100),
  reason: z.string().min(20).max(220),
  googleMapsQuery: z.string().min(1).max(200),
});

export const RecommendationOutputSchema = z.object({
  places: z.array(RecommendationCandidateSchema).length(3),
});
```

在 `analyzeWalk.ts` 做 Zod 之后的业务验证：

- Observation id、label 都唯一；label 是具体可见信息，不可全为泛称（如 `建物`、`道路`、`人`、`店`、`空`、`木`）。
- 每个 `observationIds` 都存在、数组内不重复；每个 Discovery 至少引用两个不同 Observation。
- phrase 经过 `trim`、日文空白归一化与 Unicode NFKC 后不可重复；三个 phrase 不能明显同义重复。
- explanation 不得含“照片中看不到的历史事实/人物属性”的断言。没有充分依据时模型应写成视觉层面的保守表达。
- 人物可作为环境中的活动线索，禁止身份、年龄、国籍、健康、性格等推断。

推荐模型输入改为一个明确的对象，不再保留 `selectedTags`、`selectedFeatures` 兼容分支：

```ts
interface GenerateRecommendationsInput {
  selectedDiscovery: DiscoveryOption;
  observations: Observation[];
  recommendationCity: "Tokyo";
  originalLocation?: string | null;
  excludedPlaceNames: string[];
  outputLanguage: "ja";
}
```

模型不得返回 `imageUrl`、`googlePlaceId`、`formattedAddress`、`matchedFeatures`、`sourceUrl` 或 `sourceDomain`；这些不是它能可靠证明的数据。Google Places 验证后才生成这些字段。

### 3.2 Provider 返回元数据

Provider 不能暗中 retry。每个 provider 方法只发出一次网络请求，并返回：

```ts
type AIExecutionResult<T> = {
  data: T;
  metadata: {
    provider: string;
    model: string;
    inputTokens?: number;
    outputTokens?: number;
    imageTokens?: number;
  };
};
```

`analyzeWalk.ts`、`generateRecommendations.ts` 是唯一的 retry owner。一次初始调用加最多一次 retry；所以“正常路径”为两次 AI 调用，但极端失败路径最多可有四次 provider attempt。这个区别必须写入代码注释、日志和监控，不能宣称失败时仍只有两次网络调用。

只可 retry：超时、429、临时 5xx、无效 JSON、schema/业务验证失败，或候选地点未全部通过验证。不得 retry：无图片、文件格式不支持、未登录、配置/API key 缺失、鉴权 4xx、输入不合法。

第二次模型请求要附上简短的修复要求（例如“前一次有重复 phrase，请输出 2–3 个不同且符合 schema 的完整 JSON”）；不要把模型的全文回复回灌到 prompt。删除 `QwenProvider` 内部递归 retry 和旧的 `normalizeFeatureType`。

## 4. Prompt 规格

### 4.1 Vision Prompt

更新 `src/lib/ai/prompts/analyzeWalkPrompt.ts`。Prompt 应短、明确、结构化，不把本开发文档全文塞给模型。它必须指示：

1. 将 Walk 的所有照片视为同一次体验，按传入 order 理解。
2. 生成 2–8 个有照片证据的日语 Observation；先观察，再在内部寻找关系，但不要输出思维链。
3. 生成 2–3 个彼此不同的 Discovery。每项含 `lens`、`phrase`、`explanation`、`observationIds`。
4. 每项最少两个 Observation 支撑；不强迫用完三个 Lens；不作不能由照片支持的历史、文化、地点、人物推断。
5. Phrase 是关系/解释，不能只是“英語看板のある古い街”之类描述；示例可保留两组好/坏例，但不得将示例当作照片事实。
6. 所有用户可见字段输出日语，且只输出 schema 对应 JSON。

保留 `location` 时使用类似“用户提供的背景为…，这不是视觉证据，不得输出为照片事实”的约束。

### 4.2 Recommendation Prompt

更新 `src/lib/ai/prompts/recommendPlacesPrompt.ts`。输入只包含 selected Discovery、它引用的 Observation、可选原始地点和排除名单。

必须要求：

- 恰好三个名称不同的、可在东京继续探索 **同一关系/视角** 的实际地点；不是找相同外观、相同招牌或重复原地点。
- `reason` 用日语直接解释该地点怎样延续该 Discovery；20–220 字符。
- 不推荐明确等于原地点或排除名单中的地点；不确定真实存在时不要编造。
- `recommendationCity` 固定为 Tokyo；原始 location 只是避免过近地点的参考。
- 严格输出 `RecommendationOutputSchema` JSON。

## 5. 图片上传与分析副本

当前 `src/lib/images/compressImage.ts` 已实现 1600px WebP 压缩，但 `usePhotoUpload.ts` 没有调用它，当前实际上传并发送的是原图。这不符合 V2 性能要求。

V2 上传的每一张照片必须产生两个对象：

1. 原图：继续用于用户浏览与可恢复的原始存档。
2. analysis image：客户端在上传前生成，最长边 **1280px**，优先 WebP，quality `0.78`；浏览器不支持 WebP 时 JPEG，同样 quality `0.78`。

必须保留 EXIF 自动旋转后的视觉方向。压缩失败、canvas 不可用或生成的副本为空时，停止提交该 Walk 并提示用户重试；不得悄悄把原图作为 Vision fallback。文件输入支持范围必须与浏览器实际可解码范围一致，尤其不要承诺未转码的 HEIC 能稳定分析。

将 `walk_photos.analysis_storage_path`、`analysis_width`、`analysis_height` 存入同一私有 bucket。Route Handler 仅为这些 analysis paths 创建短效签名 URL（建议 10 分钟），并按 `sort_order` 送入一次 Vision 调用。签名 URL 只在该服务端请求中使用，不返回 Client，也不写日志。

本版不做 adaptive resolution 和二次高精度 Vision。性能验收必须分别统计 1、3、10 张图三个 cohort；10 张图达不到 P95 时先基于真实数据决定下一版的上传数限制或抽样策略，不在 V2 临时改成多次 Vision 调用。

## 6. 数据库与 migration

新增两份 migration，名称从现有 `018` 继续编号，例如：

```text
019_add_discovery_v2_storage_and_analysis.sql
020_add_discovery_v2_rpcs.sql
```

不要修改旧 migration 或用前端多次 insert 模拟事务。

### 6.1 结构变更

`walk_photos` 新增可空字段：

```text
analysis_storage_path text
analysis_width integer
analysis_height integer
```

新建 `walk_analyses`（一张 walk 一条 V2 分析缓存）：

```text
walk_id uuid primary key references walks(id) on delete cascade
observations jsonb not null
analysis_version text not null                  -- 初始值 discovery-v1
vision_provider text not null
vision_model text not null
analysis_duration_ms integer not null
input_tokens integer null
output_tokens integer null
image_tokens integer null
retry_count smallint not null default 0
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

`observations` 必须是 JSON array；在 RPC 中再验证每个 `id/label/evidence`。`title` 继续存在 `walks.title`，避免双重真相。

`walks` 新增：

```text
analysis_started_at timestamptz null
recommendation_started_at timestamptz null
```

`recommendation_sets` 新增：

```text
selected_discovery_id uuid null references discovery_tags(id) on delete restrict
recommendation_version text null                -- 初始值 discovery-v1
recommendation_duration_ms integer null
input_tokens integer null
output_tokens integer null
retry_count smallint null
```

旧 `recommendation_sets` 数据允许 `selected_discovery_id IS NULL`。新 V2 RPC 必须要求它非空。

新建仅供运营统计的 `ai_request_metrics`：`id`、`walk_id`、`stage` (`vision`/`recommendation`)、`analysis_version`、`provider`、`model`、`duration_ms`、`retry_count`、三种 token 可空字段、`success`、`failure_code`、`created_at`。不存 prompt、图片 URL、图片内容或模型自然语言输出。

对 `walk_analyses` 和 `ai_request_metrics` 启用 RLS。`walk_analyses` 的 owner select policy 通过 `walks.user_id` 判断；metrics 不提供普通用户 select policy。metrics 写入由受控 `security invoker` RPC 在确认 walk owner 后执行，或由服务器的受控后端写入。为所有新外键建立必要索引。

### 6.2 复用旧表的语义映射

为降低首版迁移风险，不重命名 `discovery_tags`。V2 把它当作 `discovery_options` 使用：

| 旧字段 | V2 语义 | V2 值 |
| --- | --- | --- |
| `label` | `phrase` | Discovery 的日语短语 |
| `category` | `lens` | 小写 `space` / `culture` / `nature` |
| `reason` | `explanation` | 已预生成的日语说明 |
| `selected` | selected discovery | 每个 V2 Walk 最多一条 true |
| `selected_at` | selection timestamp | CTA 确认时写入 |

`recommended_place_tags` 物理表也先保留：一个 V2 推荐地点只连接那个唯一的 selected discovery。新 UI 不再显示“matched tags”，而显示该 Discovery 的 phrase/lens。旧 completed Walk 仍按旧展示逻辑读取。

### 6.3 数据库 RPC

新建版本化 RPC，旧 RPC 留给旧数据但新代码绝不调用：

1. `save_discovery_analysis_v2(p_walk_id, p_title, p_observations, p_discoveries, p_analysis_version, p_metrics)`：锁定 owner 的 `ANALYZING` walk；验证 JSON、Lens、2–3 条 discovery、Observation 引用与唯一 phrase；清除该 Walk 未选旧 options；插入 V2 option；upsert `walk_analyses`；更新 title，清空 `analysis_started_at`，转 `TAG_SELECTION`。全部成功或全部回滚。
2. `confirm_discovery_v2(p_walk_id, p_selected_discovery_id)`：锁定 owner 的 `TAG_SELECTION` walk；验证 id 属于该 Walk；若已经选同一项，幂等成功；否则尚未确认时先清空再只选一项，写 `selected_at`，转 `RECOMMENDING`。
3. `save_walk_recommendations_v2(p_walk_id, p_selected_discovery_id, p_places, p_metadata)`：锁定 owner 的 `RECOMMENDING` walk；验证 selected discovery 一致、恰好三条、每条含 Google 验证后的 place id/address；只创建一个 set，按 0/1/2 写正确 `sort_order`，为三条 places 连接 selected discovery，清空 `recommendation_started_at`，转 `COMPLETED`。

对 `analysis_started_at`、`recommendation_started_at` 的“领取工作/释放失败工作”可用独立 RPC 或条件 `update ... eq(...)`，但不能以“先 select 再 update”的非原子方式实现。

应用 migration 后重新生成 `src/types/database.ts`；不要手工只改其中一部分类型。更新 `src/types/domain.ts` 的领域命名，但保持数据库 `TAG_SELECTION` 兼容映射。

## 7. Google Places 验证与图片安全

当前实现把含 `GOOGLE_PLACES_API_KEY` 的照片 URL 写进 `image_url` 并发到浏览器，这是密钥泄露风险，V2 必须移除。

推荐阶段顺序为：

```text
Text model 3 candidates
  -> 并行 Google Places text search / place details
  -> 每项确认有 place_id，且格式化地址属于 東京都
  -> 存 place_id、address、photo reference（如有）
  -> 仅在 3 项全都验证时保存并展示
```

- 验证必须检查名称匹配与东京都地址，而不是盲取 `results[0]`。无法确认、重复、非东京都或名称明显不符均视为失败。
- 若验证失败，可使用该阶段的唯一一次 Text retry，并把失败名称加入排除名单；第二次仍不足三项则不保存半套结果，显示可重试错误。
- `GOOGLE_PLACES_API_KEY` 缺失时，推荐阶段应配置错误失败；不得把未经验证的 LLM 地点当作成功。
- 在 `recommended_places` 增加 `google_place_id`、`formatted_address`、`google_photo_reference`（可空）。新 V2 不将带 key 的 Google 图片 URL 持久化。
- 增加受登录和 walk owner 验证保护的图片代理 Route，例如 `/api/recommended-places/[placeId]/image`。代理在服务器用 key 请求 Google 图片、设置 private cache header，浏览器只获得本域图片响应。无 photo reference 时显示现有 UI 的无图占位。
- Google Places 失败与 AI 失败分开记 error code/metric，便于诊断。

## 8. API、Route 与前端

### 8.1 V2 Route 合同

保留 walk scoped API，移除对 `/api/recommend` 这种由 Client 任意提交 `selectedFeatures` 的旧流程依赖。

| Route | 请求 | 成功行为 |
| --- | --- | --- |
| `POST /api/walks/[walkId]/analyze` | 无 body | 领取或读取分析；返回 V2 `discoveries` 和状态。进行中返回 `202` + state，不能启动第二次。 |
| `POST /api/walks/[walkId]/select-discovery` | `{ selectedDiscoveryId: string }` | 仅在 CTA 点击时调用 `confirm_discovery_v2`，返回 `RECOMMENDING`。 |
| `POST /api/walks/[walkId]/recommend` | 无 body | 领取或读取缓存；成功返回恰好 3 个 verified places；进行中返回 `202`。 |
| `GET /api/walks/[walkId]` | 无 | 返回包含 V2 analysis、discoveries、唯一 selected discovery 和 recommendation 的 source-of-truth 页面数据。 |

每个 route 一律先认证、再验证 walk ownership。错误使用稳定 code（例如 `ANALYSIS_IN_PROGRESS`、`INVALID_DISCOVERY_SELECTION`、`SELECTION_ALREADY_CONFIRMED`、`GOOGLE_PLACE_VERIFICATION_FAILED`），Client 用日语映射显示，不把 provider 原始错误暴露给用户。

### 8.2 Discovery Selection UI

替换 `ThemeSelectionScreen.tsx` 的多选 Tag UI：

- 标题：`写真から見つけた、{n}つの視点`。
- 每张 card 的弱层级 Lens 为 `空間` / `文化` / `自然`；Phrase 是主视觉。
- 默认未选择；点击一个 card 选中它、取消另一个选中、在同页显示其预生成 explanation。此时不调用 AI。
- CTA 为 `この視点から次の場所を探す`，未选择时 disabled；点击后防止重复提交并转推荐 loading。
- 保留 Back；进入 `RECOMMENDING` 后由 server state 重定向至 recommendations，不能返回改变已经确认的选择。
- 卡片需要语义 button、键盘操作、可见 focus、屏幕阅读器的 selected 状态；手机窄屏不截断 Phrase/Explanation。

`AnalysisLoadingScreen` 保留，但只反映真实后端状态：`写真を見ています`、`視点を探しています`、`写真の中のつながりを見つけています`。结果一到立即前进；8 秒后才显示 `もう少し写真を見ています…`，不能为了播放动画额外等待。

Walk detail、home card、saved place 相关 UI 改用一个 selected discovery 的 phrase 和 lens。`WalkSelectedTags`、`MatchedTagList` 等旧命名可在迁移期存在，但 V2 页面不得把 Phrase 渲染为 `#tag` 或显示多选 tag 列表。

### 8.3 需要改动的文件清单

| 范围 | 文件 |
| --- | --- |
| AI schemas/types | `src/lib/ai/schemas.ts`, `src/lib/ai/provider.ts`, `src/types/domain.ts`, regenerated `src/types/database.ts` |
| AI orchestration | `src/lib/ai/analyzeWalk.ts`, `src/lib/ai/generateRecommendations.ts`, `src/lib/ai/index.ts` |
| Providers/prompts | `src/lib/ai/providers/qwen.ts`, `src/lib/ai/providers/openai.ts`, `src/lib/ai/prompts/analyzeWalkPrompt.ts`, `src/lib/ai/prompts/recommendPlacesPrompt.ts` |
| Persistence/API | `src/app/api/walks/[walkId]/analyze/route.ts`, new `select-discovery/route.ts`, `recommend/route.ts`, `[walkId]/route.ts`, new image proxy route, migration 019/020 |
| Images | `src/lib/images/compressImage.ts`, `src/hooks/usePhotoUpload.ts`, `src/lib/images/uploadWalkPhoto.ts`, `src/lib/images/getSignedImageUrl.ts`, `src/constants/images.ts` |
| Discovery/recommendation UI | `src/app/walk/[walkId]/discover/page.tsx`, `ThemeSelectionScreen.tsx/.module.css`, `AnalysisLoadingScreen.tsx/.module.css`, `src/app/walk/[walkId]/recommendations/page.tsx`, recommendation cards |
| History/home | `src/lib/walks/getWalkDetail.ts`, `getWalks.ts`, `WalkSelectedTags.tsx`, `WalkRecommendations.tsx`, `WalkCard.tsx`, saved-place mapping |
| Tests/scripts | `scripts/validate-e2e.ts`, `scripts/retry-walk*.ts`, `scripts/get-walk-id.ts`, relevant integration fixtures |

在初次上线后，确认 `rg` 没有 V2 运行时引用后，清理：`DiscoveryTagSelector`、`DiscoveryTagList`、旧 `confirm-tags` route、旧 `/api/recommend`、`selectedTags`/`selectedFeatures` 兼容分支、`normalizeFeatureType`、旧 prompt 示例和未使用的旧 search flow。不要删除仍为旧 completed Walk 页面所需的读取兼容代码。

## 9. 性能、日志与隐私

目标是在真实生产样本上衡量，而不是做假进度条：

| 阶段 | P50 | P95 | 缓存 |
| --- | --- | --- |
| Vision analysis | < 4 秒 | < 8 秒 | 已保存 analysis < 500ms |
| Text + Places recommendation | < 4 秒 | < 8 秒 | 已保存 recommendation < 500ms |

每个 attempt 用结构化日志和 `ai_request_metrics` 记录：stage、analysis/recommendation version、provider、model、photoCount、durationMs、retryCount、success、failureCode、input/output/image tokens。成本由 provider usage 与按 model/version 配置的价目计算；缺失 usage 保持 `null`，不能伪造为零。

分析/推荐成功结果另在 `walk_analyses` / `recommendation_sets` 保留版本、provider、model、duration、token 摘要，保证重开页面不重新调用 AI。日志不得带有用户 location 原文、Prompt、签名图 URL 或模型全文。

图片会被发送给选择的 Vision provider；产品隐私文案应明确这一点。图片只存私有 Supabase bucket，签名 URL 短效、不可暴露到浏览器，Google key 只存在服务器环境变量。

## 10. 测试与验收

### 10.1 自动测试

- Schema/validator：id 引用、重复 phrase、泛化 Observation、无依据/重复 Lens 输出、固定三地点等边界。
- Prompt/provider mock：每个 provider 单次调用；顶层最多两次 attempt；Qwen 不会嵌套 retry。
- Route：未登录、非 owner、重复点击、双标签并发、刷新后的 202/poll、失败重试、缓存命中、不能从 `walk.location` 改写 Tokyo。
- Google：名称不匹配、非东京都、无候选、重复候选、无图片、key 缺失；严禁把 key 放入浏览器响应。
- RPC/integration：RLS、所有权、每个 V2 Walk 只选一项、恰好三地点、错误时回滚、正确 `sort_order`。
- Regression：旧 `COMPLETED` Walk 能打开、saved place 仍可保存/取消保存、上传 1/3/10 张照片都按顺序进入一次 Vision 请求。

### 10.2 人工质量集

建立 30–50 张拥有使用权的固定照片集，至少包括建筑、普通街道、自然、商店、招牌、人物、食物、地标、小细节、夜景、意外瞬间与复杂街景。每次改 Prompt、模型或压缩参数，都跑同一集合并标记：

- grounding（有无照片证据）
- Discovery 的新视角、差异性与日语可读性
- Explanation 是否不越过可见证据
- 东京三地点是否真实、已验证、且延续关系而不是外观
- duration、retry rate、validation failure rate、token/cost

上线门槛：每条测试 Walk 得到 2–3 个可验证 Discovery；所有成功推荐恰好三条已验证东京地点；正常路径不超过一次 Vision + 一次 Text；缓存不触发模型；P95 目标按 1/3/10 图 cohort 报告。

## 11. 实施顺序与提交检查点

1. **先建数据基础**：添加 019/020 migration、RLS/RPC、生成 TypeScript 数据库类型；用 Supabase integration test 验证事务与旧数据兼容。
2. **再改 AI 契约**：schemas、provider interface、两个 prompts、OpenAI/Qwen 单次请求、顶层 validation/retry/metrics；先用 fixture 在 server 侧验证 JSON。
3. **接入分析图片与 API 锁**：上传双对象、短效 analysis URL、原子领取/缓存/错误恢复；测 1/3/10 图。
4. **改 Discovery UI**：单选 card、Explanation、CTA 与 loading/error/poll 状态。此阶段不能调用旧 `confirm-tags`。
5. **改推荐与 Places**：selected discovery 输入、固定东京、严格 Google 验证、服务器图片代理、原子 recommendation cache。
6. **更新历史与回归**：detail/home/saved rendering、scripts、lint/build/integration/E2E、质量集与性能记录。
7. **最后清理**：只有测试、日志和 `rg` 证明没有 V2 引用后，删除旧多选与旧公共 API。

每一阶段单独提交，提交信息应说明可回滚边界。完成前必须运行项目现有 lint/build，以及 migration/integration 验证；不能只凭 TypeScript 编译通过宣布完成。

## 12. 对原始开发文档的审计结论

原文的产品方向、2–3 个视角、一次 Vision 中预生成 explanation、东京三地点、压缩、缓存和质量评估是正确的，应保留。本规格补足了原文无法让 Copilot 安全落地的部分：

- 原文在“单张 Photo”和现有 1–10 张 Walk 之间没有决定分析单位与性能边界。
- 它要求保存 observations/version/cache，却没有定义数据库表、migration、RPC、RLS、生成类型和旧数据策略。
- 它没有处理当前分析/推荐 route 的双击、刷新、多标签并发导致的重复模型调用和状态卡死。
- “最多两次 AI request”与“每阶段可 retry 一次”本身矛盾；本规格明确区分逻辑阶段和实际 attempt。
- 当前 `compressImage` 未接入上传，原文没有规定原图与分析副本怎样存、怎样给 provider。
- 现有代码会让 `walk.location` 覆盖 Tokyo 推荐范围；原文没有把这一冲突写成硬约束。
- Google Places 现状只是取第一个结果且会将 API key 拼进图片 URL。原文要求验证/enrichment，但没有验证规则、失败策略或密钥保护方案。
- 旧文的 schema 用 Observation label 作为引用，容易重名；V2 使用稳定的 `observationIds`。
- 它列出少量 AI/UI 文件，却遗漏真正决定流程的 Route Handler、Supabase function、generated DB type、history/home/saved UI 与测试脚本。
- 原文多处重复“不是 Tag”“一次调用”“三条 Discovery”等产品宣言；已在本文件集中为产品定义、非功能约束和验收条件，避免 Copilot 从重复表述中推导出冲突实现。

