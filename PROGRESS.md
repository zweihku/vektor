# Project: Vektor

## Project Description

基于 Vue 3 + Pinia + TailwindCSS 的在线简历编辑器，支持多模板预览、AI 辅助优化（Gemini API）、JD 分析、Cover Letter 生成、简历评审等功能。支持简体中文、繁体中文、English 三语 UI 及简历内容翻译。

---

## Session Log

### 2026-03-06 Session

**Goals:**
- Chrome 插件全局 i18n（中英文界面切换）
- 修复 Indeed JD 抓取失败
- FAB 悬浮窗图标替换为品牌 "V" 标志
- 修复 `jobs.ctgoodjobs.hk` 子域名不触发插件
- 修复 `hk.jobsdb.com` 搜索结果页（`?jobId=`）插件不启动

**Discussions & Decisions:**
- i18n 采用集中式 `src/i18n.ts` 模块，所有 UI 表面共享翻译字典，locale 存储在 `chrome.storage.local`
- HTML 静态文本用 `data-i18n` 属性标记，JS 通过 `applyLocale()` 统一更新
- Indeed iframe 提取是死代码（cross-origin 永远失败），已移除，改用右侧面板 DOM 搜索
- ctgoodjobs 已迁移到 `jobs.ctgoodjobs.hk`，是 Next.js SPA，JSON-LD 数据最可靠
- JobsDB 搜索结果页通过 `?jobId=` 参数展示职位详情面板，`isJobPage()` 需匹配此模式

**Changes:**
- `extension/src/i18n.ts` — **新建** 集中式 i18n 模块（80+ 条翻译，`t()`/`getLocale()`/`setLocale()` API）
- `extension/src/content/card.ts` — 所有字符串改用 `t()`；FAB 图标从 ✨ 替换为 SVG 双层 V 标志；locale 管理改用 i18n 模块
- `extension/src/popup/index.html` — 添加 lang-toggle 按钮；列标题和空状态添加 `data-i18n`
- `extension/src/popup/main.ts` — 导入 i18n，`applyLocale()` + lang-toggle 处理；`formatState()` 用 `t()`
- `extension/src/popup/style.css` — `.lang-toggle` 样式；header flex 布局
- `extension/src/detail/index.html` — 添加 lang-toggle；16+ 标签添加 `data-i18n`
- `extension/src/detail/main.ts` — 所有动态字符串使用 `t()`
- `extension/src/detail/style.css` — `.lang-toggle` 样式
- `extension/src/content/extractors/indeed.ts` — **重写** 选择器 12→27 个；移除 iframe；新增右侧面板搜索；改进 fallback；添加调试日志
- `extension/src/content/extractors/ctgoodjobs.ts` — hostnames 添加 `jobs.ctgoodjobs.hk`；改为 SPA；`isJobPage()` 支持 `/job/ID` 和 `?current_job=`；优先 JSON-LD
- `extension/src/content/extractors/jobsdb.ts` — **重写** `isJobPage()` 支持 `?jobId=` 和 `/-jobs/` 路径；`waitForContent` 改为主动轮询 JSON-LD + DOM；扩展选择器含搜索面板；添加 `extractLargestTextBlock()` fallback 和调试日志
- `extension/src/content/index.ts` — 全局 waitForContent timeout 15s→20s
- `extension/manifest.json` — host_permissions 和 content_scripts 添加 `jobs.ctgoodjobs.hk` 和 `*.ctgoodjobs.hk`

**Open Items:**
- Indeed/JobsDB/CTgoodjobs 新选择器均需在真实页面验证
- Boss 直聘选择器仍需实际测试
- opencc-js 大 chunk (~1.1MB) 优化待处理（历史遗留）

**Next Steps:**
- 刷新插件后逐站测试：JobsDB 搜索页、Indeed、`jobs.ctgoodjobs.hk`
- 验证三个 UI 表面（悬浮卡/popup/detail）中英切换一致性
- 检查 FAB "V" 图标视觉效果

---

### 2026-03-05 Session (4)

**Goals:**
- Chrome 插件 UI 支持中英文界面切换
- 修复 Indeed 网站 JD 抓取失败问题
- 悬浮窗 FAB 图标替换为 Vektor 品牌 "V" 标志
- 修复 ctgoodjobs `jobs.ctgoodjobs.hk` 子域名不触发插件问题

**Discussions & Decisions:**
- i18n 采用集中式翻译模块 `src/i18n.ts`，所有 UI 表面共享同一翻译字典和 locale 管理
- 语言偏好存储在 `chrome.storage.local`（key: `vektor_locale`），三个 UI 表面（悬浮卡、popup、detail）同步
- HTML 静态文本使用 `data-i18n` 属性标记，JS 端通过 `applyLocale()` 统一更新
- Indeed 旧 extractor 的 iframe 提取逻辑是死代码（cross-origin 永远失败），已移除
- ctgoodjobs 已迁移到 `jobs.ctgoodjobs.hk` 子域名，旧配置未覆盖；该站为 Next.js SPA，JSON-LD 数据最可靠

**Changes:**
- `extension/src/i18n.ts` — **新建** 集中式 i18n 模块，EN/中文 完整翻译（80+ 条），`t()`/`getLocale()`/`setLocale()` API
- `extension/src/content/card.ts` — 所有硬编码字符串替换为 `t()` 调用；FAB 图标从 ✨ emoji 替换为 SVG "V" 标志（双层 V 线条设计）；locale 管理改用 i18n 模块
- `extension/src/popup/index.html` — 添加语言切换按钮；列标题和空状态文本添加 `data-i18n` 属性
- `extension/src/popup/main.ts` — 导入 i18n，添加 `applyLocale()` 和 lang-toggle 事件处理；`formatState()` 使用 `t()`
- `extension/src/popup/style.css` — 添加 `.lang-toggle` 样式；header 改为 flex 布局
- `extension/src/detail/index.html` — 添加语言切换按钮；16+ 静态标签添加 `data-i18n` 属性
- `extension/src/detail/main.ts` — 导入 i18n，所有动态字符串使用 `t()` 调用
- `extension/src/detail/style.css` — 添加 `.lang-toggle` 样式
- `extension/src/content/extractors/indeed.ts` — **重写** JD 选择器从 12 扩展到 27 个；移除无效 iframe 提取；新增右侧面板搜索策略；改进 fallback 文本块提取；添加详细 `[Vektor] Indeed:` 调试日志
- `extension/src/content/extractors/ctgoodjobs.ts` — hostnames 添加 `jobs.ctgoodjobs.hk`；改为 `isSPA: true`；`isJobPage()` 支持 `/job/数字ID` 和 `?current_job=` 参数；waitForContent 优先检测 JSON-LD
- `extension/manifest.json` — host_permissions 和 content_scripts 添加 `https://jobs.ctgoodjobs.hk/*` 和 `https://*.ctgoodjobs.hk/*`
- 重新构建插件 (`extension/dist/`)

**Open Items:**
- Indeed 新选择器需在真实页面验证（之前用户报告抓取失败，新代码未经实测）
- Boss 直聘选择器仍需实际测试验证
- opencc-js 大 chunk (~1.1MB) 优化仍待处理（历史遗留）

**Next Steps:**
- 在 Chrome 中刷新插件，测试 `jobs.ctgoodjobs.hk` 页面悬浮窗是否正常弹出
- 测试 Indeed 页面 JD 抓取是否成功
- 测试三个 UI 表面的中英切换是否一致
- 验证 FAB "V" 图标的视觉效果

---

### 2026-03-05 Session (3)

**Goals:**
- 修复 Chrome 插件 "Failed to fetch" 及 "View on LinkedIn" 硬编码问题
- 调整翻译逻辑：公司中文名 zh→en 自动翻译，en→zh 恢复原始手动输入的中文名
- 添加 Boss 直聘 (zhipin.com) 站点支持
- 新增项目默认插入到列表首位（而非末尾）
- 为所有列表板块添加拖拽排序功能

**Discussions & Decisions:**
- "Failed to fetch" 原因是开发服务器未运行，非代码问题
- 翻译 prompt 将 "company names" 从不翻译列表移至翻译列表，配合已有 `nameSnapshots` 快照机制实现双向正确行为
- Boss 直聘是 SPA 且有滑块验证反爬，自动化浏览器无法访问，CSS 选择器基于已知页面结构编写，需实际测试验证
- 拖拽排序采用 HTML5 原生 Drag & Drop API，零外部依赖，通过 `useDragReorder` composable 复用
- 新增项目用 `unshift` 代替 `push`，插入列表首位

**Changes:**
- `extension/src/detail/index.html` — "View on LinkedIn" → "View Job"
- `extension/src/detail/main.ts` — 新增 `getSiteName(url)` 动态显示站点名（LinkedIn/JobsDB/Indeed/CTgoodjobs/Boss直聘）
- `extension/src/popup/index.html` — title 和提示文字去除 LinkedIn 硬编码
- `src/composables/useGemini.ts` — 翻译 prompt 更新，允许翻译公司名/学校名/机构名
- `extension/src/content/extractors/zhipin.ts` — **新建** Boss 直聘提取器（SPA 模式，薪资拼接到 JD）
- `extension/src/content/extractors/registry.ts` — 注册 `createZhipinExtractor()`
- `extension/manifest.json` — host_permissions 和 content_scripts 添加 `zhipin.com`
- `src/stores/resumeStore.ts` — `addWorkExperience`/`addProject` 改为 `unshift`；新增 6 个 `reorder*` 方法
- `src/composables/useDragReorder.ts` — **新建** HTML5 拖拽排序 composable
- `src/components/editor/WorkExperience.vue` — 添加拖拽手柄和排序，新项展开改为 `items[0]`
- `src/components/editor/Projects.vue` — 添加拖拽手柄和排序，新项展开改为 `items[0]`
- `src/components/editor/Education.vue` — 添加拖拽手柄和排序
- `src/components/editor/Skills.vue` — 添加拖拽手柄和排序
- `src/components/editor/Certifications.vue` — 添加拖拽手柄和排序
- `src/components/editor/Languages.vue` — 添加拖拽手柄和排序
- 重新构建插件 (`extension/dist/`)

**Open Items:**
- Boss 直聘 CSS 选择器需在真实浏览器中测试验证（反爬阻止了自动化测试）
- 各新站点（Indeed、JobsDB、CTgoodjobs）的选择器仍需持续验证
- opencc-js 大 chunk (~1.1MB) 优化仍待处理（历史遗留）

**Next Steps:**
- 在 Chrome 中加载插件测试 Boss 直聘职位详情页提取
- 测试中英翻译切换流程：公司名翻译 + 恢复
- 测试各板块拖拽排序的交互体验

---

### 2026-03-05 Session (2)

**Goals:**
- 修复 Chrome 插件在 JobsDB 页面的 "Failed to fetch" 问题
- 修复插件详情页硬编码 "View on LinkedIn" 的问题
- 调整简历翻译逻辑：公司中文名翻译到英文时自动翻译，切回中文时恢复原始手动输入的中文名

**Discussions & Decisions:**
- "Failed to fetch" 原因是开发服务器 (localhost:5173) 未运行，启动后恢复正常
- 插件详情页 "View on LinkedIn" 是硬编码文本，需根据 jobUrl 动态显示站点名称
- 翻译 prompt 原本将 "company names" 列入不翻译名单，导致公司中文名切换到英文时不会被翻译
- 利用已有的 `nameSnapshots` 机制：zh→en 时先快照保存原始中文名再让 Gemini 翻译；en→zh 时恢复快照中的原始中文名，不依赖 AI 反向翻译

**Changes:**
- `extension/src/detail/index.html` — "View on LinkedIn" 改为 "View Job"（默认文本）
- `extension/src/detail/main.ts` — 新增 `getSiteName(url)` 函数，动态设置链接文本为 "View on LinkedIn/JobsDB/Indeed/CTgoodjobs"
- `extension/src/popup/index.html` — title 从 "LinkedIn Job Assistant" 改为 "Job Assistant"；提示文字从 "Visit a LinkedIn job page" 改为 "Visit a job page"
- `src/composables/useGemini.ts` — `translateResumeContent()` prompt 更新：将 company names 从不翻译列表移除，新增规则要求翻译公司名/学校名/机构名为目标语言的官方/惯用译名
- 重新构建插件 (`extension/dist/`)

**Open Items:**
- 各新站点（Indeed、JobsDB、CTgoodjobs）的 CSS 选择器仍需在实际页面上持续验证
- opencc-js 大 chunk (~1.1MB) 优化仍待处理（历史遗留）

**Next Steps:**
- 测试中英翻译切换流程：zh→en 公司名是否正确翻译，en→zh 是否恢复原始中文名
- 在 Chrome 中重新加载插件，验证 JobsDB 详情页链接显示

---

### 2026-03-05 Session

**Goals:**
- 安装 Apify Agent Skills 扩展 Claude Code 的网页抓取和数据提取能力
- 配置 Apify API Token 到项目环境中
- 对所有已安装 Skills 进行安全审计

**Discussions & Decisions:**
- 选择安装 Agent Skills（而非 MCP Server），通过 `npx skills add` 方式安装
- 使用 `--yes` 参数一次性安装全部 12 个技能
- API Token 写入项目 `.env` 文件（与现有 Gemini API Key 共存）
- 同时全局安装 `@apify/mcpc` CLI 工具供 Skills 查询 Actor schema 使用
- 安全审计结论：所有 Skills 评级 B 级（75/100），无严重风险，可安全使用

**Changes:**
- `.env` — 新增 `APIFY_TOKEN`
- `.agents/skills/` — **新建目录**，安装 12 个 Apify Skills（apify-actor-development、apify-actorization、apify-audience-analysis、apify-brand-reputation-monitoring、apify-competitor-intelligence、apify-content-analytics、apify-ecommerce、apify-influencer-discovery、apify-lead-generation、apify-market-research、apify-trend-analysis、apify-ultimate-scraper）
- 全局安装 `@apify/mcpc` npm 包

**Open Items:**
- `.agents/skills/` 目录尚未加入 `.gitignore`（如不想提交到仓库需添加）
- `apify-actorization` 中有 `curl | bash` 安装模式（来源 apify.com 官方，风险可控）
- opencc-js 大 chunk (~1.1MB) 优化仍待处理（历史遗留）

**Next Steps:**
- 确认 `.agents/` 和 `.env` 的 `.gitignore` 配置
- 尝试使用 Apify Skills 进行实际数据抓取任务（如 Google Maps 商家信息、社交媒体数据等）
- 可选：后续考虑添加 Apify MCP Server 以获得更深度的工具集成

---

### 2026-03-03 Session

**Goals:**
- 将 Chrome 插件的 JD 抓取从仅支持 LinkedIn 扩展到多站点（Indeed、JobsDB、CTgoodjobs）
- 采用 Strategy Pattern + Extractor Registry 架构重构 content script 层

**Discussions & Decisions:**
- 站点无关代码（card.ts、background/index.ts、api.ts、storage.ts、types.ts）保持不动，只重构 content script 层
- 使用 Strategy 模式：每个站点一个 extractor，统一接口 `SiteExtractor`（`waitForContent` + `extractJobData`）
- 提取策略采用四层 fallback：JSON-LD → 稳定属性（data-testid/data-automation）→ CSS 选择器 → 兜底降级
- SPA 站点（LinkedIn/Indeed/JobsDB）启用 MutationObserver 监听 URL 变化；传统站点（CTgoodjobs）不启用
- 各站点 `navigationDelay` 可独立配置（LinkedIn 2000ms、Indeed 1500ms、JobsDB 2000ms、CTgoodjobs 0ms）

**Changes:**
- `extension/src/content/extractors/types.ts` — **新建** `SiteExtractor` 接口 + `SiteConfig` 类型
- `extension/src/content/extractors/base.ts` — **新建** 共享工具（`waitForSelector`、`waitForAnySelector`、`textOf`、`selectFirst`、`extractJsonLd`）
- `extension/src/content/extractors/registry.ts` — **新建** 站点检测 + 注册表
- `extension/src/content/extractors/linkedin.ts` — **新建** 从旧 extractor.ts 迁移 LinkedIn 选择器逻辑
- `extension/src/content/extractors/indeed.ts` — **新建** Indeed 提取器（JSON-LD → data-testid → CSS）
- `extension/src/content/extractors/jobsdb.ts` — **新建** JobsDB/SEEK 提取器（JSON-LD → data-automation → CSS）
- `extension/src/content/extractors/ctgoodjobs.ts` — **新建** CTgoodjobs 提取器（JSON-LD → CSS，isSPA=false）
- `extension/src/content/index.ts` — **重构** 为站点无关调度器，调用 `detectSite()` 获取 extractor
- `extension/src/content/card.ts` — FAB title 从 `'LinkedIn Job Assistant'` 改为 `'Job Assistant'`
- `extension/manifest.json` — name 改为 `"Job Assistant"`，host_permissions 和 content_scripts.matches 扩展到所有站点
- `extension/src/content/extractor.ts` — **删除**（逻辑已迁移到 extractors/linkedin.ts）

**Open Items:**
- 各新站点（Indeed、JobsDB、CTgoodjobs）的 CSS 选择器需要在实际页面上测试验证并调整
- CTgoodjobs 的 DOM 结构未实际确认，选择器基于常见模式推测
- opencc-js 大 chunk (~1.1MB) 优化仍待处理（历史遗留）

**Next Steps:**
- 在 Chrome 中加载 `extension/dist/` 并逐站测试：LinkedIn（回归）、Indeed、JobsDB、CTgoodjobs
- 根据实际 DOM 结构调整各站点选择器
- 可选：添加更多站点支持（Glassdoor、Monster 等）

---

### 2026-02-27 Session

**Goals:**
- 完成上次遗留的 3 项待办事项：JD 分析结果持久化、Gemini 翻译 prompt 优化、Summary 专属快捷指令

**Discussions & Decisions:**
- JD 分析持久化完全复用 evaluations/coverLetters 的模式（store 中 Record + get/set + 组件 loadCached/saveToStore）
- `acceptedIndices` 在 store 中以 `number[]` 存储（JSON 可序列化），在组件中恢复为 `Set<number>`
- 翻译 prompt 改为明确列出不翻译项（公司名、品牌、技术名词、专有名词、邮箱、URL、日期），并要求职位/学位使用目标语言的惯用翻译
- Summary 快捷指令通过新增 `section` prop 传入 BulletChatPanel，根据 section 值动态切换指令集

**Changes:**
- `src/stores/resumeStore.ts` — 新增 `JDAnalysisData` 导出类型、`jdAnalyses` state/StorageData/load/save/watch/delete/get/set 全套持久化支持
- `src/components/ai/JDAnalyzer.vue` — 添加 `loadCached()`/`saveToStore()` 函数，初始化和 resumeId 切换时加载缓存，分析成功和采纳建议后保存
- `src/composables/useGemini.ts` — `translateResumeContent()` prompt 优化，明确保留专有名词、技术术语等不翻译
- `src/components/ai/BulletChatPanel.vue` — 新增 `section` prop，`quickCommands` 根据 section 区分 summary 专属/通用指令
- `src/components/editor/ResumeEditor.vue` — 向 BulletChatPanel 传递 `:section` prop
- `src/utils/i18n.ts` — 三语新增 8 个 summary 快捷指令键（summaryHighlightTech/Prompt、summaryTargetManagement/Prompt、summaryMoreConcise/Prompt、summaryCareerGoal/Prompt）

**Open Items:**
- opencc-js 大 chunk (~1.1MB) 仅首次繁简转换时加载，可考虑进一步优化
- Gemini 翻译在不同简历内容量下的效果和响应时间有待测试验证

**Next Steps:**
- 运行 `npm run dev` 实际测试三项功能的完整流程
- 可选：考虑为 Education section 的 bullets 也添加 AI 优化入口
- 可选：进一步优化 opencc-js chunk 体积

---

### 2026-02-24 Session

**Goals:**
- 为个人简介（Summary）添加 AI 优化功能
- 实现基于 Gemini 的中英文简历内容翻译（语言切换时自动触发）
- 保留简历评审和 Cover Letter 生成的结果（导航切换后不丢失）

**Discussions & Decisions:**
- Summary AI 优化复用 BulletChatPanel 组件，但为 summary 定制了不同的系统提示词（强调核心竞争力、3-5 句话，而非 STAR 方法）
- 中英翻译采用 Gemini API 整体翻译 resume JSON，通过 id 匹配回写字段，保留 opencc-js 处理繁简转换
- 评审和 Cover Letter 结果持久化方案：在 store 中添加 `evaluations` 和 `coverLetters` 两个 `Record<string, Data>` 映射（按 resumeId），纳入 localStorage 自动保存
- 遇到 `store.applyTranslatedContent is not a function` 错误，原因是浏览器 HMR 缓存了旧 store 模块，通过 `vite --force` 重启解决

**Changes:**
- `src/utils/i18n.ts` — 添加 `summary.aiOptimize`、`header.translating`、`header.translateFailed` 三语翻译键
- `src/components/editor/Summary.vue` — 添加 AI 优化按钮，emit `openAiChat` 事件
- `src/components/editor/ResumeEditor.vue` — 扩展 `activeBullet` 类型支持 `'summary'` section，新增 `handleOpenSummaryAiChat` 处理器，`handleApplyBullet` 支持 summary 分支
- `src/composables/useGemini.ts` — `chatAboutBullet` 为 summary 定制系统提示词；新增 `translateResumeContent()` 函数（Gemini 翻译整个简历 JSON）
- `src/components/layout/AppHeader.vue` — `handleLanguageChange` 在切换涉及 English 时调用 Gemini 翻译，添加 translating 加载指示器
- `src/stores/resumeStore.ts` — 新增 `applyTranslatedContent()`、`evaluations/coverLetters` 缓存 state、`getEvaluation/setEvaluation`、`getCoverLetter/setCoverLetter` 操作、`CoverLetterData` 类型导出；`deleteResume` 清理关联缓存；`StorageData` / `loadFromStorage` / `saveToStorage` / watch 全部更新
- `src/components/ai/ResumeEvaluator.vue` — 初始化时从 store 加载缓存评审结果，评审完成后写入 store，watch currentResumeId 切换
- `src/components/ai/CoverLetterGenerator.vue` — 初始化时从 store 加载缓存 cover letter（含 jdText/style/language），生成和编辑保存后写入 store

**Open Items:**
- JD 分析结果同样未持久化（目前仅评审和 Cover Letter 已处理）
- Gemini 翻译的 prompt 可进一步优化（如保留专有名词不翻译）
- opencc-js 大 chunk（~1.1MB）仅在首次繁简转换时加载，但仍可考虑进一步优化

**Next Steps:**
- 考虑将 JD 分析结果也纳入 store 持久化
- 测试 Gemini 翻译在不同简历内容量下的效果和响应时间
- 可选：AI 面板支持 summary 的专属快捷指令（如"突出技术栈"、"面向管理岗"等）
