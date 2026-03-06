import type { SavedJob, MessageResponse } from '../types'
import { t, getLocale, setLocale, type Locale } from '../i18n'

let locale: Locale = 'en'

const params = new URLSearchParams(window.location.search)
const jobId = params.get('id')

const loadingEl = document.getElementById('loading')!
const errorView = document.getElementById('error-view')!
const content = document.getElementById('content')!
const backBtn = document.getElementById('back-btn')!
const markAppliedBtn = document.getElementById('mark-applied-btn')!
const deleteBtn = document.getElementById('delete-btn')!
const langToggle = document.getElementById('lang-toggle')!

// Navigate back
backBtn.addEventListener('click', () => window.close())

// Language toggle
langToggle.addEventListener('click', () => {
  locale = locale === 'en' ? 'zh' : 'en'
  setLocale(locale)
  applyLocale()
})

function applyLocale() {
  langToggle.textContent = locale === 'en' ? '中文' : 'EN'
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n')!
    el.textContent = t(key as any, locale)
  })
}

// Initialize locale
getLocale().then((savedLocale) => {
  locale = savedLocale
  applyLocale()
})

if (!jobId) {
  showError(t('detail.noJobId', locale))
} else {
  loadJob(jobId)
}

async function loadJob(id: string) {
  const response = await chrome.runtime.sendMessage({
    type: 'GET_JOB',
    payload: { id },
  }) as MessageResponse<SavedJob>

  loadingEl.style.display = 'none'

  if (!response.success) {
    showError(response.error)
    return
  }

  const job = response.data
  renderJob(job)

  // Poll for updates if still processing
  if (job.processingState !== 'done' && job.processingState !== 'error' && job.processingState !== 'idle') {
    pollForUpdates(id)
  }
}

function pollForUpdates(id: string) {
  const interval = setInterval(async () => {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_JOB',
      payload: { id },
    }) as MessageResponse<SavedJob>

    if (!response.success) {
      clearInterval(interval)
      return
    }

    const job = response.data
    renderJob(job)

    if (job.processingState === 'done' || job.processingState === 'error') {
      clearInterval(interval)
    }
  }, 2000)
}

function renderJob(job: SavedJob) {
  content.style.display = 'block'

  // Header
  document.getElementById('job-title')!.textContent = job.jobTitle
  document.getElementById('job-company')!.textContent = job.company
  document.getElementById('job-location')!.textContent = job.location

  const dateEl = document.getElementById('job-date')!
  dateEl.textContent = job.postedDate
    ? `${t('detail.posted', locale)} ${job.postedDate}`
    : `${t('detail.saved', locale)} ${new Date(job.savedAt).toLocaleDateString()}`

  const urlEl = document.getElementById('job-url') as HTMLAnchorElement
  urlEl.href = job.jobUrl
  urlEl.textContent = `${t('detail.viewOn', locale)} ${getSiteName(job.jobUrl)}`

  // Mark applied button
  if (job.status === 'ready') {
    markAppliedBtn.style.display = 'inline-block'
    markAppliedBtn.addEventListener('click', async () => {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_JOB_STATUS',
        payload: { id: job.id, status: 'applied' },
      })
      markAppliedBtn.style.display = 'none'
    }, { once: true })
  }

  // Delete button
  deleteBtn.addEventListener('click', async () => {
    if (confirm(t('detail.deleteConfirm', locale))) {
      await chrome.runtime.sendMessage({
        type: 'DELETE_JOB',
        payload: { id: job.id },
      })
      window.close()
    }
  }, { once: true })

  // JD section
  document.getElementById('jd-text')!.textContent = job.jdText

  // Collapsible toggle
  const toggleBtn = document.querySelector('.section-toggle') as HTMLButtonElement
  const jdContent = document.getElementById('jd-content')!
  const toggleIcon = toggleBtn.querySelector('.toggle-icon')!
  toggleBtn.addEventListener('click', () => {
    const collapsed = jdContent.classList.toggle('collapsed')
    toggleIcon.textContent = collapsed ? '+' : '-'
  })

  // Score
  if (job.analysis) {
    const scoreSection = document.getElementById('score-section')!
    scoreSection.style.display = 'block'
    const scoreBadge = document.getElementById('score-badge')!
    const score = job.analysis.matchScore
    scoreBadge.textContent = String(score)
    scoreBadge.className = `score-circle ${score < 50 ? 'score-red' : score < 75 ? 'score-yellow' : 'score-green'}`
  }

  // Analysis
  if (job.analysis) {
    const section = document.getElementById('analysis-section')!
    section.style.display = 'block'

    renderList('core-reqs', job.analysis.coreRequirements)
    renderList('missing-skills', job.analysis.missingSkills)
    renderList('nice-to-have', job.analysis.niceToHave)
    renderTags('ats-keywords', job.analysis.atsKeywords)
  }

  // Cover Letter
  if (job.coverLetter) {
    const section = document.getElementById('cl-section')!
    section.style.display = 'block'
    document.getElementById('cover-letter')!.textContent = job.coverLetter

    document.getElementById('copy-cl-btn')!.addEventListener('click', () => {
      navigator.clipboard.writeText(job.coverLetter!).then(() => {
        const btn = document.getElementById('copy-cl-btn')!
        btn.textContent = t('detail.copied', locale)
        setTimeout(() => { btn.textContent = t('detail.copy', locale) }, 2000)
      })
    }, { once: true })
  }

  // Resume Suggestions
  if (job.tailoredSuggestions) {
    const section = document.getElementById('suggestions-section')!
    section.style.display = 'block'

    document.getElementById('strategy')!.textContent = job.tailoredSuggestions.overallStrategy
    renderTags('skills-add', job.tailoredSuggestions.skillsToAdd)
    renderTags('skills-emphasize', job.tailoredSuggestions.skillsToEmphasize)

    // Sync to Vektor button
    const syncBtn = document.getElementById('sync-btn')!
    const syncStatus = document.getElementById('sync-status')!
    syncBtn.addEventListener('click', async () => {
      syncBtn.textContent = t('detail.syncing', locale)
      syncBtn.setAttribute('disabled', 'true')
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'SYNC_TO_BUILDER',
          payload: { jobId: job.id },
        }) as { success: boolean; error?: string }
        if (response.success) {
          syncBtn.textContent = t('detail.synced', locale)
          syncStatus.style.display = 'block'
          syncStatus.textContent = t('detail.syncSuccess', locale)
          syncStatus.className = 'sync-status success'
        } else {
          syncBtn.textContent = t('detail.syncToVektor', locale)
          syncBtn.removeAttribute('disabled')
          syncStatus.style.display = 'block'
          syncStatus.textContent = response.error ?? 'Sync failed'
          syncStatus.className = 'sync-status error'
        }
      } catch (err) {
        syncBtn.textContent = t('detail.syncToVektor', locale)
        syncBtn.removeAttribute('disabled')
        syncStatus.style.display = 'block'
        syncStatus.textContent = t('detail.syncFailed', locale)
        syncStatus.className = 'sync-status error'
      }
    }, { once: true })

    // Bullet modifications
    const modsContainer = document.getElementById('bullet-mods')!
    modsContainer.innerHTML = ''
    if (job.tailoredSuggestions.bulletModifications.length > 0) {
      const heading = document.createElement('h3')
      heading.textContent = t('detail.bulletMods', locale)
      heading.style.cssText = 'font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #475569;'
      modsContainer.appendChild(heading)

      for (const mod of job.tailoredSuggestions.bulletModifications) {
        const div = document.createElement('div')
        div.className = 'bullet-mod'
        div.innerHTML = `
          <div class="bullet-mod-label">${escapeHtml(mod.section)}</div>
          <div class="bullet-mod-original">${escapeHtml(mod.original)}</div>
          <div class="bullet-mod-suggested">${escapeHtml(mod.suggested)}</div>
          <div class="bullet-mod-reason">${escapeHtml(mod.reason)}</div>
        `
        modsContainer.appendChild(div)
      }
    }
  }

  // Processing state
  const processingSection = document.getElementById('processing-section')!
  const errorSection = document.getElementById('error-section')!

  if (job.processingState === 'error') {
    errorSection.style.display = 'block'
    document.getElementById('error-text')!.textContent = job.error ?? 'An error occurred'
    processingSection.style.display = 'none'
  } else if (job.processingState !== 'done' && job.processingState !== 'idle') {
    processingSection.style.display = 'block'
    document.getElementById('processing-text')!.textContent = formatProcessingState(job.processingState)
    errorSection.style.display = 'none'
  } else {
    processingSection.style.display = 'none'
    errorSection.style.display = 'none'
  }
}

function formatProcessingState(state: string): string {
  switch (state) {
    case 'analyzing': return t('detail.analyzingJd', locale)
    case 'generating_cl': return t('detail.generatingCl', locale)
    case 'tailoring': return t('detail.tailoring', locale)
    default: return t('detail.processing', locale)
  }
}

function renderList(containerId: string, items: string[]) {
  const el = document.getElementById(containerId)!
  el.innerHTML = ''
  for (const item of items) {
    const li = document.createElement('li')
    li.textContent = item
    el.appendChild(li)
  }
}

function renderTags(containerId: string, items: string[]) {
  const el = document.getElementById(containerId)!
  el.innerHTML = ''
  for (const item of items) {
    const tag = document.createElement('span')
    tag.className = 'tag'
    tag.textContent = item
    el.appendChild(tag)
  }
}

function showError(msg: string) {
  loadingEl.style.display = 'none'
  errorView.style.display = 'block'
  errorView.textContent = msg
}

function getSiteName(url: string): string {
  try {
    const hostname = new URL(url).hostname
    if (hostname.includes('linkedin.com')) return 'LinkedIn'
    if (hostname.includes('jobsdb.com')) return 'JobsDB'
    if (hostname.includes('indeed.com')) return 'Indeed'
    if (hostname.includes('ctgoodjobs.hk')) return 'CTgoodjobs'
    if (hostname.includes('zhipin.com')) return 'Boss直聘'
    return hostname
  } catch {
    return 'Job Site'
  }
}

function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
