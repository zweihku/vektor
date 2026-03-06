// Job Analysis Result (matches server API response)
export interface JDAnalysisResult {
  jobTitle: string
  coreRequirements: string[]
  niceToHave: string[]
  atsKeywords: string[]
  matchScore: number
  missingSkills: string[]
  suggestions: {
    section: string
    index: number
    bulletIndex?: number
    original: string
    improved: string
    reason: string
  }[]
}

// Tailored Resume Suggestions
export interface TailoredResumeSuggestions {
  summary: string
  skillsToAdd: string[]
  skillsToEmphasize: string[]
  bulletModifications: {
    section: string
    index: number
    bulletIndex: number
    original: string
    suggested: string
    reason: string
  }[]
  overallStrategy: string
}

// Saved Job
export interface SavedJob {
  id: string
  jobUrl: string
  applyUrl: string | null
  jobTitle: string
  company: string
  location: string
  jdText: string
  jdHtml: string
  postedDate: string | null
  savedAt: string
  status: 'pending' | 'ready' | 'applied'
  processingState: 'idle' | 'analyzing' | 'generating_cl' | 'tailoring' | 'done' | 'error'
  analysis: JDAnalysisResult | null
  coverLetter: string | null
  tailoredSuggestions: TailoredResumeSuggestions | null
  error: string | null
}

// Extracted Job Data from LinkedIn page
export interface ExtractedJob {
  jobTitle: string
  company: string
  location: string
  jdText: string
  jdHtml: string
  jobUrl: string
  applyUrl: string | null
  postedDate: string | null
}

// Message types between content script and background
export type MessageType =
  | { type: 'ANALYZE_JOB'; payload: ExtractedJob }
  | { type: 'SAVE_JOB'; payload: ExtractedJob & { language?: string } }
  | { type: 'GET_SAVED_JOBS' }
  | { type: 'GET_JOB'; payload: { id: string } }
  | { type: 'UPDATE_JOB_STATUS'; payload: { id: string; status: SavedJob['status'] } }
  | { type: 'DELETE_JOB'; payload: { id: string } }
  | { type: 'QUICK_ANALYZE'; payload: { jdText: string; language?: string } }
  | { type: 'SYNC_TO_BUILDER'; payload: { jobId: string } }
  | { type: 'OPEN_DETAIL'; payload: { jobId: string } }

export type MessageResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }
