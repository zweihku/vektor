import type { Plugin, ViteDevServer } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env file manually since Vite doesn't expose VITE_* to process.env in middleware
function loadEnvFile() {
  try {
    const envPath = resolve(process.cwd(), '.env')
    const content = readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex === -1) continue
      const key = trimmed.slice(0, eqIndex).trim()
      const value = trimmed.slice(eqIndex + 1).trim()
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  } catch {
    // .env file not found, rely on existing env vars
  }
}
loadEnvFile()

// In-memory storage
let storedResumes: any[] = []
let storedCurrentResumeId: string = ''
let pendingSuggestions: any[] = []

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString()
        resolve(body ? JSON.parse(body) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function setCorsHeaders(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function json(res: ServerResponse, data: any, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

function getGeminiModel() {
  const apiKey = process.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set')
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })
}

function extractJson(text: string): any {
  // Gemini sometimes wraps JSON in markdown code blocks
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found in response')
  return JSON.parse(match[0])
}

function getResume(resumeId?: string) {
  if (resumeId) {
    return storedResumes.find((r) => r.id === resumeId)
  }
  return storedResumes.find((r) => r.id === storedCurrentResumeId)
}

export function apiServerPlugin(): Plugin {
  return {
    name: 'api-server',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url ?? ''

        if (!url.startsWith('/api/')) {
          return next()
        }

        setCorsHeaders(res)

        // Handle preflight
        if (req.method === 'OPTIONS') {
          res.writeHead(204)
          res.end()
          return
        }

        try {
          // POST /api/sync
          if (url === '/api/sync' && req.method === 'POST') {
            const body = await parseBody(req)
            storedResumes = body.resumes ?? []
            storedCurrentResumeId = body.currentResumeId ?? ''
            return json(res, { ok: true })
          }

          // GET /api/resume
          if (url === '/api/resume' && req.method === 'GET') {
            const resume = getResume()
            if (!resume) {
              return json(res, { error: 'No resume synced' }, 404)
            }
            return json(res, resume)
          }

          // GET /api/resumes
          if (url === '/api/resumes' && req.method === 'GET') {
            return json(res, storedResumes)
          }

          // POST /api/analyze-jd
          if (url === '/api/analyze-jd' && req.method === 'POST') {
            const body = await parseBody(req)
            const { jdText, resumeId, language = 'en' } = body
            const resume = getResume(resumeId)
            if (!resume) {
              return json(res, { error: 'No resume found' }, 404)
            }

            const model = getGeminiModel()
            const prompt = language === 'zh'
              ? `你是一位资深的招聘顾问和简历优化专家。

## 任务
分析以下 Job Description，并与候选人的简历进行对比。

## JD 内容
${jdText}

## 候选人简历
${JSON.stringify(resume, null, 2)}

## 要求
请严格输出以下 JSON 格式（不要包含 markdown 代码块标记），所有文本内容用中文：
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
              : `You are an expert recruitment consultant and resume optimization specialist.

## Task
Analyze the following Job Description and compare it with the candidate's resume.

## Job Description
${jdText}

## Candidate Resume
${JSON.stringify(resume, null, 2)}

## Requirements
Output strictly in the following JSON format (no markdown code blocks). All text content must be in English:
{
  "jobTitle": "Job Title",
  "coreRequirements": ["Core requirement 1", "Core requirement 2"],
  "niceToHave": ["Nice to have 1", "Nice to have 2"],
  "atsKeywords": ["ATS keyword 1", "ATS keyword 2"],
  "matchScore": 85,
  "missingSkills": ["Missing skill 1"],
  "suggestions": [
    {
      "section": "workExperience",
      "index": 0,
      "bulletIndex": 0,
      "original": "Original text",
      "improved": "Improved text",
      "reason": "Reason for improvement"
    }
  ]
}

Notes:
- matchScore is an integer from 0-100
- section can be: workExperience, education, projects, summary
- Provide bulletIndex when modifying a bullet point
- Give specific, actionable optimization suggestions`

            const result = await model.generateContent(prompt)
            const text = result.response.text()
            const analysis = extractJson(text)
            return json(res, analysis)
          }

          // POST /api/generate-cover-letter
          if (url === '/api/generate-cover-letter' && req.method === 'POST') {
            const body = await parseBody(req)
            const { jdText, style = 'formal', language = 'en', resumeId } = body
            const resume = getResume(resumeId)
            if (!resume) {
              return json(res, { error: 'No resume found' }, 404)
            }

            const model = getGeminiModel()
            const prompt = language === 'zh'
              ? `你是一位专业的求职信撰写专家。

## 任务
根据候选人简历和目标岗位，撰写一封有针对性的求职信。

## 候选人简历
${JSON.stringify(resume, null, 2)}

## 目标岗位 JD
${jdText}

## 风格: ${{ formal: '正式专业', friendly: '友好亲切', concise: '简洁有力' }[style] ?? '正式专业'}

## 要求
- 开头有力，说明申请岗位和核心优势
- 中间段落用具体经历匹配 JD 要求（2-3个亮点）
- 结尾表达热情和期待
- 总长度控制在 300-400 字
- 避免空泛的套话，突出个人特色
- 直接输出求职信内容，不要包含任何额外说明或标记`
              : `You are an expert cover letter writer.

## Task
Write a targeted cover letter based on the candidate's resume and the target job posting.

## Candidate Resume
${JSON.stringify(resume, null, 2)}

## Target Job Description
${jdText}

## Style: ${{ formal: 'Professional and formal', friendly: 'Warm and personable', concise: 'Direct and impactful' }[style] ?? 'Professional and formal'}

## Requirements
- Open with a strong hook stating the position and core strengths
- Middle paragraphs should match specific experiences to JD requirements (2-3 highlights)
- Close with enthusiasm and a call to action
- Keep the total length between 250-350 words
- Avoid generic phrases, highlight unique qualities
- Output only the cover letter text, no extra commentary or formatting`

            const result = await model.generateContent(prompt)
            const coverLetter = result.response.text()
            return json(res, { coverLetter })
          }

          // POST /api/tailor-resume
          if (url === '/api/tailor-resume' && req.method === 'POST') {
            const body = await parseBody(req)
            const { jdText, analysis, resumeId, language = 'en' } = body
            const resume = getResume(resumeId)
            if (!resume) {
              return json(res, { error: 'No resume found' }, 404)
            }

            const model = getGeminiModel()
            const prompt = language === 'zh'
              ? `你是一位资深的简历定制专家。

## 任务
根据以下 JD 和匹配分析结果，生成具体的简历定制建议。

## JD 内容
${jdText}

## 匹配分析
${JSON.stringify(analysis, null, 2)}

## 候选人简历
${JSON.stringify(resume, null, 2)}

## 要求
请严格输出以下 JSON 格式（不要包含 markdown 代码块标记），所有文本内容用中文：
{
  "summary": "建议的新个人摘要",
  "skillsToAdd": ["建议添加的技能1", "建议添加的技能2"],
  "skillsToEmphasize": ["需要突出的现有技能1"],
  "bulletModifications": [
    {
      "section": "workExperience",
      "index": 0,
      "bulletIndex": 0,
      "original": "原始内容",
      "suggested": "建议修改后的内容",
      "reason": "修改原因"
    }
  ],
  "overallStrategy": "整体定制策略说明"
}`
              : `You are an expert resume tailoring specialist.

## Task
Based on the following JD and match analysis, generate specific resume tailoring suggestions.

## Job Description
${jdText}

## Match Analysis
${JSON.stringify(analysis, null, 2)}

## Candidate Resume
${JSON.stringify(resume, null, 2)}

## Requirements
Output strictly in the following JSON format (no markdown code blocks). All text content must be in English:
{
  "summary": "Suggested new professional summary",
  "skillsToAdd": ["Skill to add 1", "Skill to add 2"],
  "skillsToEmphasize": ["Existing skill to emphasize 1"],
  "bulletModifications": [
    {
      "section": "workExperience",
      "index": 0,
      "bulletIndex": 0,
      "original": "Original content",
      "suggested": "Suggested modified content",
      "reason": "Reason for modification"
    }
  ],
  "overallStrategy": "Overall tailoring strategy description"
}`

            const result = await model.generateContent(prompt)
            const text = result.response.text()
            const tailoring = extractJson(text)
            return json(res, tailoring)
          }

          // POST /api/push-suggestions — extension pushes suggestions to server
          if (url === '/api/push-suggestions' && req.method === 'POST') {
            const body = await parseBody(req)
            const { jobTitle, company, analysis, tailoredSuggestions, coverLetter, resumeId } = body
            pendingSuggestions.push({
              id: Date.now().toString(),
              jobTitle: jobTitle ?? '',
              company: company ?? '',
              analysis: analysis ?? null,
              tailoredSuggestions: tailoredSuggestions ?? null,
              coverLetter: coverLetter ?? null,
              resumeId: resumeId ?? storedCurrentResumeId,
              pushedAt: new Date().toISOString(),
            })
            return json(res, { ok: true })
          }

          // GET /api/pending-suggestions — Vektor polls for pending suggestions
          if (url === '/api/pending-suggestions' && req.method === 'GET') {
            return json(res, pendingSuggestions)
          }

          // POST /api/clear-suggestions — Vektor clears after applying
          if (url === '/api/clear-suggestions' && req.method === 'POST') {
            const body = await parseBody(req)
            if (body.id) {
              pendingSuggestions = pendingSuggestions.filter((s: any) => s.id !== body.id)
            } else {
              pendingSuggestions = []
            }
            return json(res, { ok: true })
          }

          // Unknown API route
          json(res, { error: 'Not found' }, 404)
        } catch (err: any) {
          console.error('API error:', err)
          json(res, { error: err.message ?? 'Internal server error' }, 500)
        }
      })
    },
  }
}
