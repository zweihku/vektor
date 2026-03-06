export interface PersonalInfo {
  fullName: string
  email: string
  phone: string
  location: string
  linkedin: string
  website: string
  jobTitle: string
}

export interface WorkExperience {
  id: string
  company: string
  position: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  bullets: string[]
}

export interface Education {
  id: string
  school: string
  degree: string
  field: string
  startDate: string
  endDate: string
  gpa: string
  bullets: string[]
}

export interface Skill {
  id: string
  name: string
  level: number // 1-5
}

export interface Project {
  id: string
  name: string
  role: string
  url: string
  startDate: string
  endDate: string
  bullets: string[]
}

export interface Certification {
  id: string
  name: string
  issuer: string
  date: string
  url: string
}

export interface Language {
  id: string
  name: string
  proficiency: 'native' | 'fluent' | 'advanced' | 'intermediate' | 'beginner'
}

export type SectionType =
  | 'personalInfo'
  | 'summary'
  | 'workExperience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'

export interface SectionOrder {
  type: SectionType
  visible: boolean
}

export type TemplateType = 'modern' | 'classic' | 'minimal' | 'creative'

export interface ThemeConfig {
  primaryColor: string
  fontFamily: string
}

export interface Resume {
  id: string
  name: string
  updatedAt: string
  template: TemplateType
  language?: 'zh' | 'en'
  theme: ThemeConfig
  sections: SectionOrder[]
  personalInfo: PersonalInfo
  summary: string
  workExperience: WorkExperience[]
  education: Education[]
  skills: Skill[]
  projects: Project[]
  certifications: Certification[]
  languages: Language[]
}

export interface JDAnalysis {
  jobTitle: string
  coreRequirements: string[]
  niceToHave: string[]
  atsKeywords: string[]
  matchScore: number
  missingSkills: string[]
  suggestions: JDSuggestion[]
}

export interface JDSuggestion {
  section: string
  index: number
  bulletIndex?: number
  original: string
  improved: string
  reason: string
}

export interface ResumeEvaluation {
  overallScore: number
  categories: {
    content: number
    impact: number
    completeness: number
    clarity: number
  }
  strengths: string[]
  improvements: string[]
  sectionFeedback: {
    section: string
    score: number
    feedback: string
  }[]
}
