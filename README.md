# Vektor

**AI-powered resume builder + Chrome extension for smarter job hunting.**

**AI 驱动的简历编辑器 + 浏览器插件，让求职更聪明。**

---

## Features / 功能

### Resume Editor / 简历编辑器

- **8 sections**: Personal info, summary, work experience, education, skills, projects, certifications, languages
- **4 templates**: Modern / Classic / Minimal / Creative
- **Theme customization**: 8 preset colors + custom color + 4 fonts
- **Drag & drop**: Reorder sections and items
- **Live preview**: A4 WYSIWYG preview
- **Import/Export**: PDF / Word / JSON import, PDF / JSON export

---

- **8 大板块**：个人信息、职业摘要、工作经历、教育背景、技能、项目、证书、语言
- **4 套模板**：Modern / Classic / Minimal / Creative
- **主题定制**：8 预设色 + 自定义颜色 + 4 种字体
- **拖拽排序**：板块间和条目间自由调整顺序
- **实时预览**：A4 比例所见即所得
- **导入导出**：PDF / Word / JSON 导入，PDF / JSON 导出

### AI Capabilities / AI 能力

| Feature | Description |
|---|---|
| JD Match Analysis | Match score, missing skills, ATS keywords, modification suggestions |
| Resume Review | 4-dimension scoring + section-level feedback |
| Bullet Optimization | Chat-based refinement with quick commands (quantify, STAR method, etc.) |
| Cover Letter | Generate from resume + JD, 3 styles (formal/friendly/concise), bilingual |
| Translation | CN/EN AI translation + Simplified/Traditional Chinese conversion (opencc-js) |

---

| 功能 | 说明 |
|---|---|
| JD 匹配分析 | 匹配度评分、缺失技能、ATS 关键词、逐条修改建议 |
| 简历评审 | 四维评分 + 逐章节反馈 |
| 逐条 AI 优化 | 对话式打磨工作描述，支持「量化」「STAR 方法」等快捷指令 |
| 求职信生成 | 基于简历 + JD 生成，三种风格，中英双语 |
| 智能翻译 | 中英 AI 翻译 + 简繁精确转换（opencc-js） |

### Chrome Extension / 浏览器插件

Supports **LinkedIn / Indeed / JobsDB / CTgoodjobs / Boss直聘**.

支持 **LinkedIn / Indeed / JobsDB / CTgoodjobs / Boss直聘** 五大平台。

- Auto-extract JD from job pages (no manual copy-paste)
- One-click analysis with match score
- Background pipeline: JD analysis + cover letter + resume suggestions
- Kanban job tracker (Pending / Ready / Applied)
- EN/中文 UI switching

---

- 打开职位页自动抓取 JD，无需手动复制
- 一键分析匹配度评分
- 后台流水线：JD 分析 + 生成求职信 + 简历建议
- 看板式求职追踪（待处理 / 就绪 / 已投递）
- 中英文界面切换

### Trilingual Support / 三语切换

One resume, three languages — designed for Hong Kong job seekers.

一份简历，三个语言版本 — 专为香港求职场景设计。

- **Simplified <-> Traditional Chinese**: Precise conversion via opencc-js
- **Chinese <-> English**: AI translation with proper company/school name handling
- **Name snapshot**: Restores your original Chinese names when switching back (no reverse-translation artifacts)

---

- **简体 <-> 繁体**：基于 opencc-js 精确转换
- **中文 <-> 英文**：AI 翻译，公司名/学校名使用官方译名
- **名称快照**：切回中文时恢复原始输入，不依赖 AI 反向翻译

---

## Tech Stack / 技术栈

| Layer | Tech |
|---|---|
| Frontend | Vue 3 + TypeScript + Composition API |
| State | Pinia (reactive + localStorage persistence) |
| Styling | TailwindCSS 4 |
| AI | Google Gemini API |
| Chinese conversion | opencc-js |
| Build | Vite 7 |
| Extension | Chrome Manifest V3 + esbuild |
| Storage | Pure local (localStorage), zero backend |

**Minimal footprint**: 5 production dependencies, no UI library, fully client-side, all data stays local.

**极简架构**：5 个生产依赖，无 UI 组件库，纯前端运行，数据全部存在本地。

---

## Getting Started / 快速开始

### Prerequisites / 前置要求

- Node.js >= 18
- A [Google Gemini API key](https://aistudio.google.com/apikey)

### Setup / 安装

```bash
git clone https://github.com/zweihku/vektor.git
cd vektor
npm install

# Create .env file with your API key
cp .env.example .env
# Edit .env and add your Gemini API key
```

### Development / 开发

```bash
# Start the web app
npm run dev

# Build the Chrome extension
cd extension
npm install
node build.mjs
```

### Load Chrome Extension / 加载插件

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `extension/dist/` folder
4. Visit any supported job site to see the floating card

---

## License

MIT
