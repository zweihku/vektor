type Lang = 'zh' | 'zh-TW' | 'en'

const _sectionLabels: Record<Lang, Record<string, string>> = {
  zh: {
    personalInfo: '联系方式',
    summary: '个人简介',
    workExperience: '工作经历',
    education: '教育背景',
    skills: '专业技能',
    projects: '项目经历',
    certifications: '证书资质',
    languages: '语言能力',
  },
  'zh-TW': {
    personalInfo: '聯絡方式',
    summary: '個人簡介',
    workExperience: '工作經歷',
    education: '教育背景',
    skills: '專業技能',
    projects: '專案經歷',
    certifications: '證書資質',
    languages: '語言能力',
  },
  en: {
    personalInfo: 'Contact',
    summary: 'Summary',
    workExperience: 'Experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    certifications: 'Certifications',
    languages: 'Languages',
  },
}

const _sectionLabelsShort: Record<Lang, Record<string, string>> = {
  zh: {
    summary: '简介',
    workExperience: '经历',
    education: '教育',
    skills: '技能',
    projects: '项目',
    certifications: '证书',
    languages: '语言',
  },
  'zh-TW': {
    summary: '簡介',
    workExperience: '經歷',
    education: '教育',
    skills: '技能',
    projects: '專案',
    certifications: '證書',
    languages: '語言',
  },
  en: {
    summary: 'Summary',
    workExperience: 'Experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    certifications: 'Certifications',
    languages: 'Languages',
  },
}

const _proficiencyLabels: Record<Lang, Record<string, string>> = {
  zh: {
    native: '母语/Native',
    fluent: '流利/Fluent',
    advanced: '高级/Advanced',
    intermediate: '中级/Intermediate',
    beginner: '初级/Beginner',
  },
  'zh-TW': {
    native: '母語/Native',
    fluent: '流利/Fluent',
    advanced: '高級/Advanced',
    intermediate: '中級/Intermediate',
    beginner: '初級/Beginner',
  },
  en: {
    native: 'Native',
    fluent: 'Fluent',
    advanced: 'Advanced',
    intermediate: 'Intermediate',
    beginner: 'Beginner',
  },
}

const _currentLabel: Record<Lang, string> = {
  zh: '至今',
  'zh-TW': '至今',
  en: 'Present',
}

export function sectionLabels(lang: Lang = 'zh'): Record<string, string> {
  return _sectionLabels[lang]
}

export function sectionLabelsShort(lang: Lang = 'zh'): Record<string, string> {
  return _sectionLabelsShort[lang]
}

export function proficiencyLabels(lang: Lang = 'zh'): Record<string, string> {
  return _proficiencyLabels[lang]
}

export function currentLabel(lang: Lang = 'zh'): string {
  return _currentLabel[lang]
}
