export type Locale = 'en' | 'zh'

const STORAGE_KEY = 'vektor_locale'

const messages = {
  en: {
    // Card (floating)
    'card.language': 'Language:',
    'card.analyze': 'Analyze',
    'card.reanalyze': 'Re-analyze',
    'card.analyzing': 'Analyzing...',
    'card.save': 'Save & Process',
    'card.saving': 'Saving...',
    'card.saved': 'Saved!',
    'card.savedJobs': 'Saved Jobs',
    'card.noJobs': 'No saved jobs yet',
    'card.matchScore': 'Match Score',
    'card.analyzingJd': 'Analyzing job description...',
    'card.savingProcessing': 'Saving and processing...',
    'card.jobSaved': 'Job saved! Processing in background.',
    'card.missingSkill': 'missing skill',
    'card.missingSkills': 'missing skills',
    'card.extensionReloaded': 'Extension reloaded. Please refresh this page.',

    // States
    'state.error': 'Error',
    'state.analyzing': 'Analyzing...',
    'state.generatingCl': 'Generating CL...',
    'state.tailoring': 'Tailoring...',
    'state.ready': 'Ready',
    'state.applied': 'Applied',
    'state.pending': 'Pending',
    'state.queued': 'Queued',
    'state.writingCl': 'Writing CL...',

    // Popup
    'popup.pending': 'Pending',
    'popup.ready': 'Ready',
    'popup.applied': 'Applied',
    'popup.noJobs': 'No saved jobs yet.',
    'popup.hint': 'Visit a job page to get started.',
    'popup.markApplied': 'Applied',

    // Detail page
    'detail.back': 'Back',
    'detail.markApplied': 'Mark as Applied',
    'detail.delete': 'Delete',
    'detail.loading': 'Loading...',
    'detail.viewJob': 'View Job',
    'detail.matchScore': 'Match Score',
    'detail.jobDescription': 'Job Description',
    'detail.matchAnalysis': 'Match Analysis',
    'detail.coreRequirements': 'Core Requirements',
    'detail.missingSkills': 'Missing Skills',
    'detail.atsKeywords': 'ATS Keywords',
    'detail.niceToHave': 'Nice to Have',
    'detail.coverLetter': 'Cover Letter',
    'detail.copy': 'Copy',
    'detail.copied': 'Copied!',
    'detail.resumeSuggestions': 'Resume Suggestions',
    'detail.syncToVektor': 'Sync to Vektor',
    'detail.syncing': 'Syncing...',
    'detail.synced': 'Synced!',
    'detail.syncSuccess': 'Suggestions synced to Vektor. Open the app to review and apply.',
    'detail.syncFailed': 'Failed to connect to Vektor. Is the dev server running?',
    'detail.skillsToAdd': 'Skills to Add',
    'detail.skillsToEmphasize': 'Skills to Emphasize',
    'detail.bulletMods': 'Bullet Point Modifications',
    'detail.processing': 'Processing...',
    'detail.analyzingJd': 'Analyzing job description...',
    'detail.generatingCl': 'Generating cover letter and tailoring resume...',
    'detail.tailoring': 'Tailoring resume suggestions...',
    'detail.posted': 'Posted:',
    'detail.saved': 'Saved:',
    'detail.viewOn': 'View on',
    'detail.noJobId': 'No job ID specified.',
    'detail.deleteConfirm': 'Delete this job?',
  },
  zh: {
    // Card (floating)
    'card.language': '语言：',
    'card.analyze': '分析',
    'card.reanalyze': '重新分析',
    'card.analyzing': '分析中...',
    'card.save': '保存并处理',
    'card.saving': '保存中...',
    'card.saved': '已保存！',
    'card.savedJobs': '已保存职位',
    'card.noJobs': '暂无已保存职位',
    'card.matchScore': '匹配分数',
    'card.analyzingJd': '正在分析职位描述...',
    'card.savingProcessing': '正在保存并处理...',
    'card.jobSaved': '职位已保存！后台处理中。',
    'card.missingSkill': '项缺失技能',
    'card.missingSkills': '项缺失技能',
    'card.extensionReloaded': '插件已重新加载，请刷新页面。',

    // States
    'state.error': '错误',
    'state.analyzing': '分析中...',
    'state.generatingCl': '生成求职信...',
    'state.tailoring': '优化简历...',
    'state.ready': '就绪',
    'state.applied': '已投递',
    'state.pending': '待处理',
    'state.queued': '排队中',
    'state.writingCl': '撰写求职信...',

    // Popup
    'popup.pending': '待处理',
    'popup.ready': '就绪',
    'popup.applied': '已投递',
    'popup.noJobs': '暂无已保存职位。',
    'popup.hint': '前往招聘页面开始使用。',
    'popup.markApplied': '已投递',

    // Detail page
    'detail.back': '返回',
    'detail.markApplied': '标记为已投递',
    'detail.delete': '删除',
    'detail.loading': '加载中...',
    'detail.viewJob': '查看职位',
    'detail.matchScore': '匹配分数',
    'detail.jobDescription': '职位描述',
    'detail.matchAnalysis': '匹配分析',
    'detail.coreRequirements': '核心要求',
    'detail.missingSkills': '缺失技能',
    'detail.atsKeywords': 'ATS 关键词',
    'detail.niceToHave': '加分项',
    'detail.coverLetter': '求职信',
    'detail.copy': '复制',
    'detail.copied': '已复制！',
    'detail.resumeSuggestions': '简历建议',
    'detail.syncToVektor': '同步到 Vektor',
    'detail.syncing': '同步中...',
    'detail.synced': '已同步！',
    'detail.syncSuccess': '建议已同步到 Vektor。打开应用查看并应用。',
    'detail.syncFailed': '连接 Vektor 失败。开发服务器是否在运行？',
    'detail.skillsToAdd': '待添加技能',
    'detail.skillsToEmphasize': '需强调技能',
    'detail.bulletMods': '要点修改建议',
    'detail.processing': '处理中...',
    'detail.analyzingJd': '正在分析职位描述...',
    'detail.generatingCl': '正在生成求职信和优化简历...',
    'detail.tailoring': '正在优化简历建议...',
    'detail.posted': '发布于：',
    'detail.saved': '保存于：',
    'detail.viewOn': '在以下平台查看',
    'detail.noJobId': '未指定职位 ID。',
    'detail.deleteConfirm': '确定删除该职位？',
  },
} as const

type MessageKey = keyof typeof messages['en']

export function t(key: MessageKey, locale: Locale): string {
  return messages[locale]?.[key] ?? messages['en'][key] ?? key
}

export async function getLocale(): Promise<Locale> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY)
    return (result[STORAGE_KEY] as Locale) || 'en'
  } catch {
    return 'en'
  }
}

export function setLocale(locale: Locale): void {
  try {
    chrome.storage.local.set({ [STORAGE_KEY]: locale }).catch(() => {})
  } catch { /* not in extension context */ }
}
