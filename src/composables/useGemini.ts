import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Resume, JDAnalysis, ResumeEvaluation } from '../types/resume'

export function useGemini() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string

  function isConfigured(): boolean {
    return !!apiKey && apiKey !== 'your_api_key_here'
  }

  function getModel() {
    const genAI = new GoogleGenerativeAI(apiKey)
    return genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })
  }

  async function analyzeJD(jd: string, resume: Resume): Promise<JDAnalysis> {
    const model = getModel()
    const prompt = `你是一位资深的招聘顾问和简历优化专家。

## 任务
分析以下 Job Description，并与候选人的简历进行对比。

## JD 内容
${jd}

## 候选人简历
${JSON.stringify(resume, null, 2)}

## 要求
请严格输出以下 JSON 格式（不要包含 markdown 代码块标记）：
{
  "jobTitle": "岗位名称",
  "coreRequirements": ["核心要求1", "核心要求2"],
  "niceToHave": ["加分项1", "加分项2"],
  "atsKeywords": ["ATS关键词1", "ATS关键词2"],
  "matchScore": 85,
  "missingSkills": ["缺失技能1"],
  "suggestions": [
    {
      "section": "workExperience",
      "index": 0,
      "bulletIndex": 0,
      "original": "原文",
      "improved": "改进后的文字",
      "reason": "改进原因"
    }
  ]
}

注意：
- matchScore 是 0-100 的整数
- suggestions 中的 section 可以是: workExperience, education, projects, summary
- 如果是修改 bullet point, 提供 bulletIndex
- 给出具体、可操作的优化建议`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Failed to parse AI response')
    return JSON.parse(jsonMatch[0]) as JDAnalysis
  }

  async function generateCoverLetter(
    resume: Resume,
    jd: string,
    style: 'formal' | 'friendly' | 'concise',
    language: 'zh' | 'en'
  ): Promise<string> {
    const model = getModel()

    const styleMap = { formal: '正式专业', friendly: '友好亲切', concise: '简洁有力' }
    const langMap = { zh: '中文', en: '英文' }

    const prompt = `你是一位专业的求职信撰写专家。

## 任务
根据候选人简历和目标岗位，撰写一封有针对性的求职信。

## 候选人简历
${JSON.stringify(resume, null, 2)}

## 目标岗位 JD
${jd}

## 风格: ${styleMap[style]}
## 语言: ${langMap[language]}

## 要求
- 开头有力，说明申请岗位和核心优势
- 中间段落用具体经历匹配 JD 要求（2-3个亮点）
- 结尾表达热情和期待
- 总长度控制在 300-400 字
- 避免空泛的套话，突出个人特色
- 直接输出求职信内容，不要包含任何额外说明或标记`

    const result = await model.generateContent(prompt)
    return result.response.text()
  }

  async function chatAboutBullet(
    messages: { role: 'user' | 'model', parts: string }[],
    context: string,
    sectionLabel: string = '工作经历'
  ): Promise<string> {
    const model = getModel()

    const isSummary = sectionLabel === '个人简介' || sectionLabel === '個人簡介' || sectionLabel === 'Summary'
    const systemText = isSummary
      ? `你是一位资深的简历优化专家。你的任务是帮助用户优化简历中的个人简介/职业摘要。

## 背景信息
${context}

## 规则
- 突出核心竞争力和职业亮点
- 简洁有力，控制在 3-5 句话
- 包含关键技能和年限
- 体现职业目标和价值主张
- 每次回复只输出优化后的文字，不要包含额外说明或标记
- 根据用户的追加需求调整优化方向`
      : `你是一位资深的简历优化专家。你的任务是帮助用户优化简历中的${sectionLabel}描述。

## 背景信息
${context}

## 规则
- 使用 STAR 方法（情境-任务-行动-结果）
- 尽量加入具体数据和量化指标
- 以动词开头，简洁有力
- 控制在 1-2 句话
- 每次回复只输出优化后的文字，不要包含额外说明或标记
- 根据用户的追加需求调整优化方向`

    const chat = model.startChat({
      history: messages.slice(0, -1).map((m) => ({
        role: m.role,
        parts: [{ text: m.parts }],
      })),
      systemInstruction: {
        role: 'user' as const,
        parts: [{ text: systemText }],
      },
    })

    const lastMessage = messages[messages.length - 1]!
    const result = await chat.sendMessage(lastMessage.parts)
    return result.response.text().trim()
  }

  async function optimizeBulletPoint(original: string, context: string): Promise<string> {
    const model = getModel()
    const prompt = `你是一位简历优化专家。请优化以下简历要点，使其更加具体、量化、有影响力。

## 原文
${original}

## 上下文
${context}

## 要求
- 使用 STAR 方法（情境-任务-行动-结果）
- 尽量加入具体数据和量化指标
- 以动词开头
- 控制在 1-2 句话
- 直接输出优化后的文字，不要包含任何额外说明`

    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  }

  async function parseResumeFile(base64Data: string, mimeType: string): Promise<string> {
    const model = getModel()

    const prompt = `你是一位专业的简历解析器。请从以下文件中提取简历信息，并严格按照以下 JSON 格式输出（不要包含 markdown 代码块标记）：

{
  "name": "简历名称（通常是候选人姓名）",
  "template": "modern",
  "theme": { "primaryColor": "#2563eb", "fontFamily": "Inter, system-ui, sans-serif" },
  "sections": [
    { "type": "personalInfo", "visible": true },
    { "type": "summary", "visible": true },
    { "type": "workExperience", "visible": true },
    { "type": "education", "visible": true },
    { "type": "skills", "visible": true },
    { "type": "projects", "visible": true },
    { "type": "certifications", "visible": true },
    { "type": "languages", "visible": true }
  ],
  "personalInfo": {
    "fullName": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "website": "",
    "jobTitle": ""
  },
  "summary": "个人简介/职业摘要",
  "workExperience": [
    {
      "company": "公司名",
      "position": "职位",
      "location": "地点",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM",
      "current": false,
      "bullets": ["工作描述1", "工作描述2"]
    }
  ],
  "education": [
    {
      "school": "学校名",
      "degree": "学位",
      "field": "专业",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM",
      "gpa": "",
      "bullets": []
    }
  ],
  "skills": [
    { "name": "技能名", "level": 3 }
  ],
  "projects": [
    {
      "name": "项目名",
      "role": "角色",
      "url": "",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM",
      "bullets": ["项目描述"]
    }
  ],
  "certifications": [
    { "name": "证书名", "issuer": "颁发机构", "date": "YYYY-MM", "url": "" }
  ],
  "languages": [
    { "name": "语言", "proficiency": "fluent" }
  ]
}

注意：
- 不要包含 id 字段，系统会自动生成
- 如果文件中没有某项信息，使用空字符串或空数组
- proficiency 只能是: native, fluent, advanced, intermediate, beginner
- level 是 1-5 的整数
- 日期格式使用 YYYY-MM
- 尽量从文件中提取所有可用信息`

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ])

    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('无法从 AI 响应中解析 JSON')

    const parsed = JSON.parse(jsonMatch[0])

    // Assign UUIDs to all sub-items
    const arrayFields = ['workExperience', 'education', 'skills', 'projects', 'certifications', 'languages'] as const
    for (const field of arrayFields) {
      if (Array.isArray(parsed[field])) {
        parsed[field] = parsed[field].map((item: Record<string, unknown>) => ({
          ...item,
          id: crypto.randomUUID(),
        }))
      } else {
        parsed[field] = []
      }
    }

    // Ensure safe defaults
    parsed.template = parsed.template || 'modern'
    parsed.theme = parsed.theme || { primaryColor: '#2563eb', fontFamily: 'Inter, system-ui, sans-serif' }
    parsed.theme.primaryColor = parsed.theme.primaryColor || '#2563eb'
    parsed.theme.fontFamily = parsed.theme.fontFamily || 'Inter, system-ui, sans-serif'
    parsed.sections = parsed.sections || [
      { type: 'personalInfo', visible: true },
      { type: 'summary', visible: true },
      { type: 'workExperience', visible: true },
      { type: 'education', visible: true },
      { type: 'skills', visible: true },
      { type: 'projects', visible: true },
      { type: 'certifications', visible: true },
      { type: 'languages', visible: true },
    ]
    parsed.personalInfo = parsed.personalInfo || {
      fullName: '', email: '', phone: '', location: '', linkedin: '', website: '', jobTitle: '',
    }
    parsed.summary = parsed.summary || ''
    parsed.name = parsed.name || parsed.personalInfo.fullName || '导入的简历'

    // Remove id if AI included it
    delete parsed.id
    delete parsed.updatedAt

    return JSON.stringify(parsed)
  }

  async function evaluateResume(resume: Resume): Promise<ResumeEvaluation> {
    const model = getModel()
    const prompt = `你是一位资深的简历评审专家。请对以下简历进行全面评审。

## 简历内容
${JSON.stringify(resume, null, 2)}

## 评审维度
1. **内容质量 (content)**: 描述是否具体、专业，是否展现了核心能力
2. **影响力与量化 (impact)**: 是否有量化数据、业务影响、具体成果
3. **完整性 (completeness)**: 各章节是否完整，关键信息是否缺失
4. **表达清晰度 (clarity)**: 语言是否简洁有力，逻辑是否清晰

## 要求
请严格输出以下 JSON 格式（不要包含 markdown 代码块标记）：
{
  "overallScore": 75,
  "categories": {
    "content": 80,
    "impact": 60,
    "completeness": 85,
    "clarity": 70
  },
  "strengths": [
    "优势描述1",
    "优势描述2",
    "优势描述3"
  ],
  "improvements": [
    "改进建议1",
    "改进建议2",
    "改进建议3"
  ],
  "sectionFeedback": [
    {
      "section": "章节名称",
      "score": 80,
      "feedback": "具体反馈内容"
    }
  ]
}

注意：
- 所有分数都是 0-100 的整数
- strengths 给出 3-5 条优势
- improvements 给出 3-5 条具体可操作的改进建议
- sectionFeedback 对每个有内容的章节给出反馈
- 评价要客观、具体、有建设性`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('无法解析 AI 评审结果')
    return JSON.parse(jsonMatch[0]) as ResumeEvaluation
  }

  async function translateResumeContent(resume: Resume, targetLang: 'zh' | 'zh-TW' | 'en'): Promise<Record<string, unknown>> {
    const model = getModel()

    const langNames: Record<string, string> = { zh: '简体中文', 'zh-TW': '繁體中文', en: 'English' }
    const targetName = langNames[targetLang] ?? targetLang

    const content = {
      name: resume.name,
      summary: resume.summary,
      personalInfo: {
        fullName: resume.personalInfo.fullName,
        jobTitle: resume.personalInfo.jobTitle,
        location: resume.personalInfo.location,
      },
      workExperience: resume.workExperience.map((w) => ({
        id: w.id,
        company: w.company,
        position: w.position,
        location: w.location,
        bullets: w.bullets,
      })),
      education: resume.education.map((e) => ({
        id: e.id,
        school: e.school,
        degree: e.degree,
        field: e.field,
        bullets: e.bullets,
      })),
      skills: resume.skills.map((s) => ({ id: s.id, name: s.name })),
      projects: resume.projects.map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        bullets: p.bullets,
      })),
      certifications: resume.certifications.map((c) => ({
        id: c.id,
        name: c.name,
        issuer: c.issuer,
      })),
      languages: resume.languages.map((l) => ({ id: l.id, name: l.name })),
    }

    const prompt = `You are a professional resume translator. Translate the text fields in the following JSON to ${targetName}.

Rules:
- Keep the JSON structure and all id fields exactly the same
- Translate company names, school names, and organization names to their conventional/official name in the target language (e.g., "腾讯" → "Tencent", "北京大学" → "Peking University", "中国银行" → "Bank of China")
- Do NOT translate: brand names of products, programming languages, frameworks, tools, technologies, and technical proper nouns (e.g., "React", "AWS", "PMP", "Docker")
- For job titles and degree names, use the conventional translation in the target language
- Keep email addresses, phone numbers, URLs, and dates unchanged
- Output ONLY the translated JSON, no markdown code blocks or other text

${JSON.stringify(content, null, 2)}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Failed to parse translation result')
    return JSON.parse(jsonMatch[0]) as Record<string, unknown>
  }

  return { analyzeJD, generateCoverLetter, optimizeBulletPoint, chatAboutBullet, evaluateResume, isConfigured, parseResumeFile, translateResumeContent }
}
