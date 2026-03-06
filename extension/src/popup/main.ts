import type { SavedJob, MessageResponse } from '../types'
import { t, getLocale, setLocale, type Locale } from '../i18n'

const colPending = document.getElementById('col-pending')!
const colReady = document.getElementById('col-ready')!
const colApplied = document.getElementById('col-applied')!
const countPending = document.getElementById('count-pending')!
const countReady = document.getElementById('count-ready')!
const countApplied = document.getElementById('count-applied')!
const emptyState = document.getElementById('empty-state')!
const kanban = document.getElementById('kanban')!
const langToggle = document.getElementById('lang-toggle')!

let locale: Locale = 'en'

function applyLocale() {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n as Parameters<typeof t>[0]
    el.textContent = t(key, locale)
  })
  langToggle.textContent = locale === 'en' ? '中文' : 'EN'
}

langToggle.addEventListener('click', () => {
  locale = locale === 'en' ? 'zh' : 'en'
  setLocale(locale)
  applyLocale()
  loadJobs()
})

async function loadJobs() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_SAVED_JOBS' }) as MessageResponse<SavedJob[]>
  if (!response.success) return

  const jobs = response.data
  if (jobs.length === 0) {
    kanban.style.display = 'none'
    emptyState.style.display = 'block'
    return
  }

  kanban.style.display = 'flex'
  emptyState.style.display = 'none'

  const pending = jobs.filter(j => j.status === 'pending')
  const ready = jobs.filter(j => j.status === 'ready')
  const applied = jobs.filter(j => j.status === 'applied')

  countPending.textContent = String(pending.length)
  countReady.textContent = String(ready.length)
  countApplied.textContent = String(applied.length)

  colPending.innerHTML = ''
  colReady.innerHTML = ''
  colApplied.innerHTML = ''

  pending.forEach(j => colPending.appendChild(createJobCard(j)))
  ready.forEach(j => colReady.appendChild(createJobCard(j)))
  applied.forEach(j => colApplied.appendChild(createJobCard(j)))
}

function createJobCard(job: SavedJob): HTMLElement {
  const card = document.createElement('div')
  card.className = 'job-card'
  card.addEventListener('click', () => openDetail(job.id))

  const title = document.createElement('div')
  title.className = 'job-card-title'
  title.textContent = job.jobTitle
  title.title = job.jobTitle
  card.appendChild(title)

  const company = document.createElement('div')
  company.className = 'job-card-company'
  company.textContent = job.company
  company.title = job.company
  card.appendChild(company)

  const footer = document.createElement('div')
  footer.className = 'job-card-footer'

  // Score badge
  if (job.analysis) {
    const score = job.analysis.matchScore
    const badge = document.createElement('span')
    badge.className = `score-badge ${score < 50 ? 'score-red' : score < 75 ? 'score-yellow' : 'score-green'}`
    badge.textContent = `${score}%`
    footer.appendChild(badge)
  }

  // Processing indicator or action button
  if (job.status === 'pending') {
    const indicator = document.createElement('span')
    if (job.processingState === 'error') {
      indicator.className = 'processing-indicator error'
      indicator.textContent = t('state.error', locale)
    } else if (job.processingState !== 'done') {
      indicator.className = 'processing-indicator'
      indicator.innerHTML = '<span class="spinner"></span>' + formatState(job.processingState)
    }
    footer.appendChild(indicator)
  } else if (job.status === 'ready') {
    const btn = document.createElement('button')
    btn.className = 'mark-applied-btn'
    btn.textContent = t('popup.markApplied', locale)
    btn.addEventListener('click', async (e) => {
      e.stopPropagation()
      await chrome.runtime.sendMessage({
        type: 'UPDATE_JOB_STATUS',
        payload: { id: job.id, status: 'applied' },
      })
      loadJobs()
    })
    footer.appendChild(btn)
  }

  card.appendChild(footer)
  return card
}

function formatState(state: SavedJob['processingState']): string {
  switch (state) {
    case 'analyzing': return t('state.analyzing', locale)
    case 'generating_cl': return t('state.writingCl', locale)
    case 'tailoring': return t('state.tailoring', locale)
    case 'idle': return t('state.queued', locale)
    default: return state
  }
}

function openDetail(jobId: string) {
  chrome.tabs.create({
    url: chrome.runtime.getURL(`detail.html?id=${jobId}`),
  })
}

// Listen for storage changes to auto-refresh
chrome.storage.onChanged.addListener(() => {
  loadJobs()
})

// Initial load
;(async () => {
  locale = await getLocale()
  applyLocale()
  loadJobs()
})()
