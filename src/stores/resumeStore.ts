import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type {
  Resume,
  PersonalInfo,
  WorkExperience,
  Education,
  Skill,
  Project,
  Certification,
  Language,
  SectionOrder,
  TemplateType,
  ThemeConfig,
  ResumeEvaluation,
  JDAnalysis,
} from '../types/resume'
import { createDefaultResume, createEmptyResume } from '../utils/defaultData'
import { toTraditional, toSimplified } from '../utils/zhConvert'

const STORAGE_KEY = 'vektor-data'

export interface CoverLetterData {
  text: string
  jdText: string
  style: 'formal' | 'friendly' | 'concise'
  language: 'zh' | 'en'
}

export interface JDAnalysisData {
  jdText: string
  analysis: JDAnalysis
  acceptedIndices: number[]
}

export interface SyncedJob {
  id: string
  jobTitle: string
  company: string
  analysis: any | null
  tailoredSuggestions: any | null
  coverLetter: string | null
  resumeId: string
  syncedAt: string
  appliedToResume: boolean
}

type ViewType = 'editor' | 'jd-analyzer' | 'cover-letter' | 'resume-review' | 'job-tracker'

interface StorageData {
  resumes: Resume[]
  currentResumeId: string
  currentView: ViewType
  language?: 'zh' | 'zh-TW' | 'en'
  evaluations?: Record<string, ResumeEvaluation>
  coverLetters?: Record<string, CoverLetterData>
  jdAnalyses?: Record<string, JDAnalysisData>
  syncedJobs?: SyncedJob[]
  nameSnapshots?: Record<string, { fullName: string; companies: { id: string; v: string }[]; schools: { id: string; v: string }[] }>
}

export const useResumeStore = defineStore('resume', () => {
  // State
  const resumes = ref<Resume[]>([])
  const currentResumeId = ref<string>('')
  const currentView = ref<ViewType>('editor')
  const language = ref<'zh' | 'zh-TW' | 'en'>('zh')
  const evaluations = ref<Record<string, ResumeEvaluation>>({})
  const coverLetters = ref<Record<string, CoverLetterData>>({})
  const jdAnalyses = ref<Record<string, JDAnalysisData>>({})
  const syncedJobs = ref<SyncedJob[]>([])
  const nameSnapshots = ref<Record<string, { fullName: string; companies: { id: string; v: string }[]; schools: { id: string; v: string }[] }>>({})

  // Getters
  const currentResume = computed<Resume | undefined>(() =>
    resumes.value.find((r) => r.id === currentResumeId.value)
  )

  const currentTemplate = computed<TemplateType>(
    () => currentResume.value?.template ?? 'modern'
  )

  // Actions
  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data: StorageData = JSON.parse(raw)
        resumes.value = data.resumes
        currentResumeId.value = data.currentResumeId
        currentView.value = data.currentView || 'editor'
        language.value = data.language || 'zh'
        evaluations.value = data.evaluations || {}
        coverLetters.value = data.coverLetters || {}
        jdAnalyses.value = data.jdAnalyses || {}
        syncedJobs.value = data.syncedJobs || []
        nameSnapshots.value = data.nameSnapshots || {}
      }
    } catch {
      // ignore parse errors
    }

    // Ensure at least one resume exists
    if (resumes.value.length === 0) {
      const defaultResume = createDefaultResume()
      resumes.value.push(defaultResume)
      currentResumeId.value = defaultResume.id
    } else if (
      !currentResumeId.value ||
      !resumes.value.find((r) => r.id === currentResumeId.value)
    ) {
      currentResumeId.value = resumes.value[0]!.id
    }
  }

  function syncToServer() {
    fetch('http://localhost:5173/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumes: resumes.value,
        currentResumeId: currentResumeId.value,
      }),
    }).catch(() => {})  // fire-and-forget, silent error
  }

  function saveToStorage() {
    const data: StorageData = {
      resumes: resumes.value,
      currentResumeId: currentResumeId.value,
      currentView: currentView.value,
      language: language.value,
      evaluations: evaluations.value,
      coverLetters: coverLetters.value,
      jdAnalyses: jdAnalyses.value,
      syncedJobs: syncedJobs.value,
      nameSnapshots: nameSnapshots.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    syncToServer()
  }

  // Debounced auto-save
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  function debouncedSave() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => saveToStorage(), 500)
  }

  watch(
    () => [resumes.value, currentResumeId.value, currentView.value, language.value, evaluations.value, coverLetters.value, jdAnalyses.value, syncedJobs.value, nameSnapshots.value],
    () => debouncedSave(),
    { deep: true }
  )

  function touchResume() {
    const resume = currentResume.value
    if (resume) {
      resume.updatedAt = new Date().toISOString()
    }
  }

  function createResume(name: string) {
    const resume = createEmptyResume(name)
    resumes.value.push(resume)
    currentResumeId.value = resume.id
  }

  function deleteResume(id: string) {
    const index = resumes.value.findIndex((r) => r.id === id)
    if (index === -1) return

    resumes.value.splice(index, 1)
    delete evaluations.value[id]
    delete coverLetters.value[id]
    delete jdAnalyses.value[id]

    if (currentResumeId.value === id) {
      if (resumes.value.length > 0) {
        currentResumeId.value = resumes.value[0]!.id
      } else {
        const defaultResume = createDefaultResume()
        resumes.value.push(defaultResume)
        currentResumeId.value = defaultResume.id
      }
    }
  }

  function selectResume(id: string) {
    if (resumes.value.find((r) => r.id === id)) {
      currentResumeId.value = id
    }
  }

  // Personal Info
  function updatePersonalInfo(info: Partial<PersonalInfo>) {
    const resume = currentResume.value
    if (!resume) return
    Object.assign(resume.personalInfo, info)
    touchResume()
  }

  // Summary
  function updateSummary(summary: string) {
    const resume = currentResume.value
    if (!resume) return
    resume.summary = summary
    touchResume()
  }

  // Work Experience
  function addWorkExperience() {
    const resume = currentResume.value
    if (!resume) return
    const exp: WorkExperience = {
      id: crypto.randomUUID(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      bullets: [''],
    }
    resume.workExperience.unshift(exp)
    touchResume()
  }

  function updateWorkExperience(id: string, data: Partial<WorkExperience>) {
    const resume = currentResume.value
    if (!resume) return
    const item = resume.workExperience.find((w) => w.id === id)
    if (item) {
      Object.assign(item, data)
      touchResume()
    }
  }

  function removeWorkExperience(id: string) {
    const resume = currentResume.value
    if (!resume) return
    resume.workExperience = resume.workExperience.filter((w) => w.id !== id)
    touchResume()
  }

  // Education
  function addEducation() {
    const resume = currentResume.value
    if (!resume) return
    const edu: Education = {
      id: crypto.randomUUID(),
      school: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      gpa: '',
      bullets: [''],
    }
    resume.education.push(edu)
    touchResume()
  }

  function updateEducation(id: string, data: Partial<Education>) {
    const resume = currentResume.value
    if (!resume) return
    const item = resume.education.find((e) => e.id === id)
    if (item) {
      Object.assign(item, data)
      touchResume()
    }
  }

  function removeEducation(id: string) {
    const resume = currentResume.value
    if (!resume) return
    resume.education = resume.education.filter((e) => e.id !== id)
    touchResume()
  }

  // Skills
  function addSkill() {
    const resume = currentResume.value
    if (!resume) return
    const skill: Skill = {
      id: crypto.randomUUID(),
      name: '',
      level: 3,
    }
    resume.skills.push(skill)
    touchResume()
  }

  function updateSkill(id: string, data: Partial<Skill>) {
    const resume = currentResume.value
    if (!resume) return
    const item = resume.skills.find((s) => s.id === id)
    if (item) {
      Object.assign(item, data)
      touchResume()
    }
  }

  function removeSkill(id: string) {
    const resume = currentResume.value
    if (!resume) return
    resume.skills = resume.skills.filter((s) => s.id !== id)
    touchResume()
  }

  // Projects
  function addProject() {
    const resume = currentResume.value
    if (!resume) return
    const project: Project = {
      id: crypto.randomUUID(),
      name: '',
      role: '',
      url: '',
      startDate: '',
      endDate: '',
      bullets: [''],
    }
    resume.projects.unshift(project)
    touchResume()
  }

  function updateProject(id: string, data: Partial<Project>) {
    const resume = currentResume.value
    if (!resume) return
    const item = resume.projects.find((p) => p.id === id)
    if (item) {
      Object.assign(item, data)
      touchResume()
    }
  }

  function removeProject(id: string) {
    const resume = currentResume.value
    if (!resume) return
    resume.projects = resume.projects.filter((p) => p.id !== id)
    touchResume()
  }

  // Certifications
  function addCertification() {
    const resume = currentResume.value
    if (!resume) return
    const cert: Certification = {
      id: crypto.randomUUID(),
      name: '',
      issuer: '',
      date: '',
      url: '',
    }
    resume.certifications.push(cert)
    touchResume()
  }

  function updateCertification(id: string, data: Partial<Certification>) {
    const resume = currentResume.value
    if (!resume) return
    const item = resume.certifications.find((c) => c.id === id)
    if (item) {
      Object.assign(item, data)
      touchResume()
    }
  }

  function removeCertification(id: string) {
    const resume = currentResume.value
    if (!resume) return
    resume.certifications = resume.certifications.filter((c) => c.id !== id)
    touchResume()
  }

  // Languages
  function addLanguage() {
    const resume = currentResume.value
    if (!resume) return
    const lang: Language = {
      id: crypto.randomUUID(),
      name: '',
      proficiency: 'intermediate',
    }
    resume.languages.push(lang)
    touchResume()
  }

  function updateLanguage(id: string, data: Partial<Language>) {
    const resume = currentResume.value
    if (!resume) return
    const item = resume.languages.find((l) => l.id === id)
    if (item) {
      Object.assign(item, data)
      touchResume()
    }
  }

  function removeLanguage(id: string) {
    const resume = currentResume.value
    if (!resume) return
    resume.languages = resume.languages.filter((l) => l.id !== id)
    touchResume()
  }

  // Reorder items within a section
  function reorderArray<T>(arr: T[], from: number, to: number) {
    const item = arr.splice(from, 1)[0]!
    arr.splice(to, 0, item)
  }

  function reorderWorkExperience(from: number, to: number) {
    const resume = currentResume.value
    if (!resume) return
    reorderArray(resume.workExperience, from, to)
    touchResume()
  }

  function reorderEducation(from: number, to: number) {
    const resume = currentResume.value
    if (!resume) return
    reorderArray(resume.education, from, to)
    touchResume()
  }

  function reorderProjects(from: number, to: number) {
    const resume = currentResume.value
    if (!resume) return
    reorderArray(resume.projects, from, to)
    touchResume()
  }

  function reorderSkills(from: number, to: number) {
    const resume = currentResume.value
    if (!resume) return
    reorderArray(resume.skills, from, to)
    touchResume()
  }

  function reorderCertifications(from: number, to: number) {
    const resume = currentResume.value
    if (!resume) return
    reorderArray(resume.certifications, from, to)
    touchResume()
  }

  function reorderLanguages(from: number, to: number) {
    const resume = currentResume.value
    if (!resume) return
    reorderArray(resume.languages, from, to)
    touchResume()
  }

  // Sections
  function updateSections(sections: SectionOrder[]) {
    const resume = currentResume.value
    if (!resume) return
    resume.sections = sections
    touchResume()
  }

  // Name snapshot — saves CJK names before en translation, restores when switching back
  function saveNameSnapshot() {
    const resume = currentResume.value
    if (!resume) return
    nameSnapshots.value[currentResumeId.value] = {
      fullName: resume.personalInfo.fullName,
      companies: resume.workExperience.map((w) => ({ id: w.id, v: w.company })),
      schools: resume.education.map((e) => ({ id: e.id, v: e.school })),
    }
  }

  function restoreNameSnapshot() {
    const resume = currentResume.value
    if (!resume) return
    const snap = nameSnapshots.value[currentResumeId.value]
    if (!snap) return
    resume.personalInfo.fullName = snap.fullName
    for (const c of snap.companies) {
      const exp = resume.workExperience.find((w) => w.id === c.id)
      if (exp) exp.company = c.v
    }
    for (const s of snap.schools) {
      const edu = resume.education.find((e) => e.id === s.id)
      if (edu) edu.school = s.v
    }
  }

  // Template & Theme
  function setTemplate(template: TemplateType) {
    const resume = currentResume.value
    if (!resume) return
    resume.template = template
    touchResume()
  }

  function setLanguage(lang: 'zh' | 'zh-TW' | 'en') {
    language.value = lang
  }

  async function convertResumeContent(target: 'zh-TW' | 'zh') {
    const resume = currentResume.value
    if (!resume) return
    const convert = target === 'zh-TW' ? toTraditional : toSimplified

    // Personal Info
    const pi = resume.personalInfo
    pi.fullName = await convert(pi.fullName)
    pi.jobTitle = await convert(pi.jobTitle)
    pi.location = await convert(pi.location)

    // Summary
    resume.summary = await convert(resume.summary)

    // Work Experience
    for (const exp of resume.workExperience) {
      exp.company = await convert(exp.company)
      exp.position = await convert(exp.position)
      exp.location = await convert(exp.location)
      exp.bullets = await Promise.all(exp.bullets.map((b) => convert(b)))
    }

    // Education
    for (const edu of resume.education) {
      edu.school = await convert(edu.school)
      edu.degree = await convert(edu.degree)
      edu.field = await convert(edu.field)
      edu.bullets = await Promise.all(edu.bullets.map((b) => convert(b)))
    }

    // Skills
    for (const skill of resume.skills) {
      skill.name = await convert(skill.name)
    }

    // Projects
    for (const proj of resume.projects) {
      proj.name = await convert(proj.name)
      proj.role = await convert(proj.role)
      proj.bullets = await Promise.all(proj.bullets.map((b) => convert(b)))
    }

    // Certifications
    for (const cert of resume.certifications) {
      cert.name = await convert(cert.name)
      cert.issuer = await convert(cert.issuer)
    }

    // Languages
    for (const lang of resume.languages) {
      lang.name = await convert(lang.name)
    }

    // Resume name
    resume.name = await convert(resume.name)

    touchResume()
  }

  // Evaluation cache
  function getEvaluation(resumeId: string): ResumeEvaluation | null {
    return evaluations.value[resumeId] ?? null
  }

  function setEvaluation(resumeId: string, evaluation: ResumeEvaluation) {
    evaluations.value[resumeId] = evaluation
  }

  // Cover letter cache
  function getCoverLetter(resumeId: string): CoverLetterData | null {
    return coverLetters.value[resumeId] ?? null
  }

  function setCoverLetter(resumeId: string, data: CoverLetterData) {
    coverLetters.value[resumeId] = data
  }

  // JD analysis cache
  function getJDAnalysis(resumeId: string): JDAnalysisData | null {
    return jdAnalyses.value[resumeId] ?? null
  }

  function setJDAnalysis(resumeId: string, data: JDAnalysisData) {
    jdAnalyses.value[resumeId] = data
  }

  function applyTranslatedContent(translated: Record<string, unknown>) {
    const resume = currentResume.value
    if (!resume) return

    // Apply top-level fields
    if (typeof translated.name === 'string') resume.name = translated.name
    if (typeof translated.summary === 'string') resume.summary = translated.summary

    // Personal Info
    const pi = translated.personalInfo as Record<string, string> | undefined
    if (pi) {
      if (pi.fullName) resume.personalInfo.fullName = pi.fullName
      if (pi.jobTitle) resume.personalInfo.jobTitle = pi.jobTitle
      if (pi.location) resume.personalInfo.location = pi.location
    }

    // Array sections - match by id
    const workArr = translated.workExperience as { id: string; company?: string; position?: string; location?: string; bullets?: string[] }[] | undefined
    if (workArr) {
      for (const tw of workArr) {
        const item = resume.workExperience.find((w) => w.id === tw.id)
        if (!item) continue
        if (tw.company) item.company = tw.company
        if (tw.position) item.position = tw.position
        if (tw.location) item.location = tw.location
        if (tw.bullets) item.bullets = tw.bullets
      }
    }

    const eduArr = translated.education as { id: string; school?: string; degree?: string; field?: string; bullets?: string[] }[] | undefined
    if (eduArr) {
      for (const te of eduArr) {
        const item = resume.education.find((e) => e.id === te.id)
        if (!item) continue
        if (te.school) item.school = te.school
        if (te.degree) item.degree = te.degree
        if (te.field) item.field = te.field
        if (te.bullets) item.bullets = te.bullets
      }
    }

    const skillArr = translated.skills as { id: string; name?: string }[] | undefined
    if (skillArr) {
      for (const ts of skillArr) {
        const item = resume.skills.find((s) => s.id === ts.id)
        if (item && ts.name) item.name = ts.name
      }
    }

    const projArr = translated.projects as { id: string; name?: string; role?: string; bullets?: string[] }[] | undefined
    if (projArr) {
      for (const tp of projArr) {
        const item = resume.projects.find((p) => p.id === tp.id)
        if (!item) continue
        if (tp.name) item.name = tp.name
        if (tp.role) item.role = tp.role
        if (tp.bullets) item.bullets = tp.bullets
      }
    }

    const certArr = translated.certifications as { id: string; name?: string; issuer?: string }[] | undefined
    if (certArr) {
      for (const tc of certArr) {
        const item = resume.certifications.find((c) => c.id === tc.id)
        if (!item) continue
        if (tc.name) item.name = tc.name
        if (tc.issuer) item.issuer = tc.issuer
      }
    }

    const langArr = translated.languages as { id: string; name?: string }[] | undefined
    if (langArr) {
      for (const tl of langArr) {
        const item = resume.languages.find((l) => l.id === tl.id)
        if (item && tl.name) item.name = tl.name
      }
    }

    touchResume()
  }

  function setTheme(theme: Partial<ThemeConfig>) {
    const resume = currentResume.value
    if (!resume) return
    Object.assign(resume.theme, theme)
    touchResume()
  }

  // Synced Jobs
  function addSyncedJob(job: Omit<SyncedJob, 'id' | 'syncedAt' | 'appliedToResume'>) {
    syncedJobs.value.push({
      ...job,
      id: crypto.randomUUID(),
      syncedAt: new Date().toISOString(),
      appliedToResume: false,
    })
  }

  function removeSyncedJob(id: string) {
    syncedJobs.value = syncedJobs.value.filter((j) => j.id !== id)
  }

  function markSyncedJobApplied(id: string) {
    const job = syncedJobs.value.find((j) => j.id === id)
    if (job) job.appliedToResume = true
  }

  function getSyncedJob(id: string): SyncedJob | undefined {
    return syncedJobs.value.find((j) => j.id === id)
  }

  // View
  function setView(view: ViewType) {
    currentView.value = view
  }

  // Export / Import
  function exportToJSON(): string {
    const resume = currentResume.value
    if (!resume) return '{}'
    return JSON.stringify(resume, null, 2)
  }

  function importFromJSON(json: string) {
    try {
      const data = JSON.parse(json) as Resume
      // Assign a new ID to avoid conflicts
      data.id = crypto.randomUUID()
      data.updatedAt = new Date().toISOString()
      resumes.value.push(data)
      currentResumeId.value = data.id
    } catch {
      throw new Error('Invalid JSON format')
    }
  }

  // Initialize
  loadFromStorage()

  return {
    // State
    resumes,
    currentResumeId,
    currentView,
    language,
    // Getters
    currentResume,
    currentTemplate,
    // Caches
    getEvaluation,
    setEvaluation,
    getCoverLetter,
    setCoverLetter,
    jdAnalyses,
    getJDAnalysis,
    setJDAnalysis,
    // Synced Jobs
    syncedJobs,
    addSyncedJob,
    removeSyncedJob,
    markSyncedJobApplied,
    getSyncedJob,
    // Name snapshot
    saveNameSnapshot,
    restoreNameSnapshot,
    // Actions
    loadFromStorage,
    saveToStorage,
    createResume,
    deleteResume,
    selectResume,
    updatePersonalInfo,
    updateSummary,
    addWorkExperience,
    updateWorkExperience,
    removeWorkExperience,
    addEducation,
    updateEducation,
    removeEducation,
    addSkill,
    updateSkill,
    removeSkill,
    addProject,
    updateProject,
    removeProject,
    addCertification,
    updateCertification,
    removeCertification,
    addLanguage,
    updateLanguage,
    removeLanguage,
    updateSections,
    reorderWorkExperience,
    reorderEducation,
    reorderProjects,
    reorderSkills,
    reorderCertifications,
    reorderLanguages,
    setTemplate,
    setLanguage,
    convertResumeContent,
    applyTranslatedContent,
    setTheme,
    setView,
    exportToJSON,
    importFromJSON,
  }
})
