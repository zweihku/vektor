import type { JDAnalysisResult, TailoredResumeSuggestions } from './types'

const BASE_URL = 'http://localhost:5173'

export async function analyzeJD(jdText: string, resumeId?: string, language?: string): Promise<JDAnalysisResult> {
  const res = await fetch(`${BASE_URL}/api/analyze-jd`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jdText, resumeId, language }),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function generateCoverLetter(
  jdText: string,
  style?: string,
  language?: string,
  resumeId?: string,
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/generate-cover-letter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jdText, style, language, resumeId }),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  return data.coverLetter
}

export async function tailorResume(
  jdText: string,
  analysis: JDAnalysisResult,
  resumeId?: string,
  language?: string,
): Promise<TailoredResumeSuggestions> {
  const res = await fetch(`${BASE_URL}/api/tailor-resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jdText, analysis, resumeId, language }),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function pushSuggestions(data: {
  jobTitle: string
  company: string
  analysis: JDAnalysisResult | null
  tailoredSuggestions: TailoredResumeSuggestions | null
  coverLetter: string | null
  resumeId?: string
}): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/push-suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
}

export async function getResume(resumeId?: string) {
  const url = resumeId ? `${BASE_URL}/api/resume?id=${resumeId}` : `${BASE_URL}/api/resume`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function getResumes() {
  const res = await fetch(`${BASE_URL}/api/resumes`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
