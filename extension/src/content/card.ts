import type { ExtractedJob, JDAnalysisResult, SavedJob, MessageResponse } from '../types'
import { t, getLocale, setLocale, type Locale } from '../i18n'

/** Check if the extension context is still valid (not invalidated by reload) */
function isContextValid(): boolean {
  try {
    return !!chrome.runtime?.id
  } catch {
    return false
  }
}

/** Safe wrapper around chrome.runtime.sendMessage */
async function safeSendMessage(msg: any): Promise<any> {
  if (!isContextValid()) {
    throw new Error('Extension reloaded. Please refresh this page.')
  }
  return chrome.runtime.sendMessage(msg)
}

const CARD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;700&display=swap');

  :host {
    all: initial;
    font-family: 'Inter', 'Noto Sans SC', sans-serif;
  }

  .rb-fab {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #38bdf8);
    color: #fff;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2147483647;
    transition: transform 0.2s, box-shadow 0.2s;
    font-size: 20px;
    line-height: 1;
  }

  .rb-fab-icon {
    width: 26px;
    height: 26px;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
  }

  .rb-fab:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 24px rgba(99, 102, 241, 0.5);
  }

  .rb-card {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 340px;
    max-height: 520px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(99, 102, 241, 0.08);
    z-index: 2147483647;
    overflow: hidden;
    animation: rb-slide-up 0.25s ease-out;
    display: flex;
    flex-direction: column;
  }

  @keyframes rb-slide-up {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .rb-card-header {
    background: #fff;
    color: #1e293b;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    border-bottom: 1px solid #e2e8f0;
  }

  .rb-card-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.02em;
    background: linear-gradient(135deg, #6366f1, #38bdf8);
    -webkit-background-clip: text;
    color: transparent;
  }

  .rb-collapse-btn {
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    font-size: 18px;
    padding: 0;
    line-height: 1;
    transition: color 0.15s;
  }

  .rb-collapse-btn:hover {
    color: #475569;
  }

  .rb-card-body {
    padding: 16px;
    flex-shrink: 0;
  }

  .rb-job-info {
    margin-bottom: 12px;
  }

  .rb-job-title {
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 4px;
  }

  .rb-company {
    font-size: 13px;
    color: #64748b;
    margin: 0;
  }

  .rb-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .rb-btn {
    flex: 1;
    padding: 8px 12px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    font-family: 'Inter', 'Noto Sans SC', sans-serif;
    transition: all 0.15s;
  }

  .rb-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .rb-btn-analyze {
    background: rgba(99, 102, 241, 0.06);
    color: #6366f1;
    border: 1px solid rgba(99, 102, 241, 0.15);
  }

  .rb-btn-analyze:hover:not(:disabled) {
    background: rgba(99, 102, 241, 0.12);
    border-color: rgba(99, 102, 241, 0.3);
  }

  .rb-btn-save {
    background: #6366f1;
    color: #fff;
  }

  .rb-btn-save:hover:not(:disabled) {
    background: #4f46e5;
    box-shadow: 0 0 16px rgba(99, 102, 241, 0.3);
  }

  .rb-score-section {
    text-align: center;
    padding: 12px 0;
  }

  .rb-score-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    font-size: 20px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 8px;
  }

  .rb-score-red { background: linear-gradient(135deg, #ef4444, #dc2626); }
  .rb-score-yellow { background: linear-gradient(135deg, #f59e0b, #d97706); }
  .rb-score-green { background: linear-gradient(135deg, #22c55e, #16a34a); }

  .rb-score-label {
    font-size: 12px;
    color: #64748b;
    margin: 0;
  }

  .rb-status {
    font-size: 12px;
    color: #64748b;
    text-align: center;
    padding: 8px 0;
  }

  .rb-status.error {
    color: #ef4444;
  }

  .rb-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid #e2e8f0;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: rb-spin 0.6s linear infinite;
    vertical-align: middle;
    margin-right: 6px;
  }

  @keyframes rb-spin {
    to { transform: rotate(360deg); }
  }

  /* ===== Saved Jobs List ===== */
  .rb-divider {
    height: 1px;
    background: #e2e8f0;
    margin: 0;
    flex-shrink: 0;
  }

  .rb-jobs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px 6px;
    flex-shrink: 0;
  }

  .rb-jobs-header h4 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: #334155;
  }

  .rb-jobs-count {
    font-size: 11px;
    color: #94a3b8;
    background: #f1f5f9;
    padding: 2px 8px;
    border-radius: 10px;
  }

  .rb-jobs-list {
    overflow-y: auto;
    max-height: 200px;
    padding: 0 16px 12px;
    flex: 1;
    min-height: 0;
  }

  .rb-jobs-list::-webkit-scrollbar { width: 3px; }
  .rb-jobs-list::-webkit-scrollbar-track { background: transparent; }
  .rb-jobs-list::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.25); border-radius: 2px; }

  .rb-jobs-empty {
    font-size: 12px;
    color: #94a3b8;
    text-align: center;
    padding: 12px 0;
  }

  .rb-job-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.12s;
    margin-bottom: 4px;
  }

  .rb-job-item:hover {
    background: #f8fafc;
  }

  .rb-job-item-score {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
  }

  .rb-job-item-info {
    flex: 1;
    min-width: 0;
  }

  .rb-job-item-title {
    font-size: 12px;
    font-weight: 600;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rb-job-item-meta {
    font-size: 11px;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .rb-job-item-state {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .rb-state-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .rb-state-dot.pending { background: #f59e0b; }
  .rb-state-dot.ready { background: #22c55e; }
  .rb-state-dot.applied { background: #94a3b8; }
  .rb-state-dot.error { background: #ef4444; }
  .rb-state-dot.processing { background: #6366f1; animation: rb-pulse 1s infinite; }

  @keyframes rb-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .rb-job-item-arrow {
    color: #cbd5e1;
    font-size: 14px;
    flex-shrink: 0;
  }

  /* ===== Language Toggle ===== */
  .rb-lang-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
  }

  .rb-lang-label {
    font-size: 12px;
    color: #64748b;
  }

  .rb-lang-switch {
    display: flex;
    background: #f1f5f9;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
  }

  .rb-lang-btn {
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    background: transparent;
    color: #64748b;
    font-family: 'Inter', 'Noto Sans SC', sans-serif;
    transition: all 0.15s;
  }

  .rb-lang-btn.active {
    background: #6366f1;
    color: #fff;
  }

  .rb-lang-btn:hover:not(.active) {
    background: #e2e8f0;
  }
`

export function createCard(jobData: ExtractedJob): void {
  // Prevent duplicates
  if (document.getElementById('rb-ext-root')) return

  const host = document.createElement('div')
  host.id = 'rb-ext-root'
  const shadow = host.attachShadow({ mode: 'closed' })

  const style = document.createElement('style')
  style.textContent = CARD_STYLES
  shadow.appendChild(style)

  let expanded = false
  let analysis: JDAnalysisResult | null = null
  let analyzing = false
  let saving = false
  let saved = false
  let statusMsg = ''
  let statusError = false
  let savedJobs: SavedJob[] = []
  let jobsRefreshTimer: ReturnType<typeof setInterval> | null = null
  let locale: Locale = 'en'

  // Load saved locale preference
  getLocale().then((savedLocale) => {
    locale = savedLocale
    render()
  })

  async function loadSavedJobs() {
    if (!isContextValid()) {
      stopJobsPolling()
      return
    }
    try {
      const response = await safeSendMessage({ type: 'GET_SAVED_JOBS' }) as MessageResponse<SavedJob[]>
      if (response.success) {
        savedJobs = response.data
        renderJobsList()
      }
    } catch {
      // Context likely invalidated, stop polling
      stopJobsPolling()
    }
  }

  function startJobsPolling() {
    if (jobsRefreshTimer) return
    loadSavedJobs()
    jobsRefreshTimer = setInterval(loadSavedJobs, 3000)
  }

  function stopJobsPolling() {
    if (jobsRefreshTimer) {
      clearInterval(jobsRefreshTimer)
      jobsRefreshTimer = null
    }
  }

  function renderJobsList() {
    const listContainer = shadow.querySelector('.rb-jobs-list')
    const countEl = shadow.querySelector('.rb-jobs-count')
    if (!listContainer) return

    if (countEl) countEl.textContent = String(savedJobs.length)

    listContainer.innerHTML = ''
    if (savedJobs.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'rb-jobs-empty'
      empty.textContent = t('card.noJobs', locale)
      listContainer.appendChild(empty)
      return
    }

    for (const job of savedJobs) {
      const item = document.createElement('div')
      item.className = 'rb-job-item'
      item.addEventListener('click', () => {
        if (!isContextValid()) {
          statusMsg = t('card.extensionReloaded', locale)
          statusError = true
          render()
          return
        }
        safeSendMessage({ type: 'OPEN_DETAIL', payload: { jobId: job.id } }).catch(() => {})
      })

      // Score circle
      const scoreEl = document.createElement('div')
      scoreEl.className = 'rb-job-item-score'
      if (job.analysis) {
        const s = job.analysis.matchScore
        scoreEl.style.background = s < 50 ? '#ef4444' : s < 75 ? '#f59e0b' : '#22c55e'
        scoreEl.textContent = String(s)
      } else {
        scoreEl.style.background = '#e2e8f0'
        scoreEl.style.color = '#94a3b8'
        scoreEl.textContent = '--'
      }
      item.appendChild(scoreEl)

      // Info
      const info = document.createElement('div')
      info.className = 'rb-job-item-info'

      const title = document.createElement('div')
      title.className = 'rb-job-item-title'
      title.textContent = job.jobTitle
      title.title = job.jobTitle
      info.appendChild(title)

      const meta = document.createElement('div')
      meta.className = 'rb-job-item-meta'

      const stateContainer = document.createElement('span')
      stateContainer.className = 'rb-job-item-state'

      const dot = document.createElement('span')
      dot.className = 'rb-state-dot'
      if (job.processingState === 'error') {
        dot.classList.add('error')
      } else if (job.processingState !== 'done' && job.processingState !== 'idle') {
        dot.classList.add('processing')
      } else if (job.status === 'ready') {
        dot.classList.add('ready')
      } else if (job.status === 'applied') {
        dot.classList.add('applied')
      } else {
        dot.classList.add('pending')
      }
      stateContainer.appendChild(dot)

      const stateLabel = document.createElement('span')
      stateLabel.textContent = getStateLabel(job)
      stateContainer.appendChild(stateLabel)

      meta.appendChild(stateContainer)
      if (job.company) {
        const sep = document.createElement('span')
        sep.textContent = '\u00b7'
        meta.appendChild(sep)
        const companySpan = document.createElement('span')
        companySpan.textContent = job.company
        meta.appendChild(companySpan)
      }
      info.appendChild(meta)
      item.appendChild(info)

      // Arrow
      const arrow = document.createElement('span')
      arrow.className = 'rb-job-item-arrow'
      arrow.textContent = '\u203a'
      item.appendChild(arrow)

      listContainer.appendChild(item)
    }
  }

  function getStateLabel(job: SavedJob): string {
    if (job.processingState === 'error') return t('state.error', locale)
    if (job.processingState === 'analyzing') return t('state.analyzing', locale)
    if (job.processingState === 'generating_cl') return t('state.generatingCl', locale)
    if (job.processingState === 'tailoring') return t('state.tailoring', locale)
    if (job.status === 'ready') return t('state.ready', locale)
    if (job.status === 'applied') return t('state.applied', locale)
    if (job.processingState === 'done') return t('state.ready', locale)
    return t('state.pending', locale)
  }

  function render() {
    // Remove existing content except style
    const existing = shadow.querySelector('.rb-fab, .rb-card')
    if (existing) existing.remove()

    if (!expanded) {
      stopJobsPolling()
      const fab = document.createElement('button')
      fab.className = 'rb-fab'
      fab.innerHTML = '<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="rb-fab-icon"><path d="M6 8L16 26L26 8" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 8L16 20L22 8" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      fab.title = 'Vektor'
      fab.addEventListener('click', () => {
        expanded = true
        render()
        startJobsPolling()
      })
      shadow.appendChild(fab)
      return
    }

    const card = document.createElement('div')
    card.className = 'rb-card'

    // Header
    const header = document.createElement('div')
    header.className = 'rb-card-header'
    header.innerHTML = `
      <h3>Vektor</h3>
      <button class="rb-collapse-btn">&times;</button>
    `
    header.querySelector('.rb-collapse-btn')!.addEventListener('click', () => {
      expanded = false
      render()
    })
    card.appendChild(header)

    // Body — current job actions
    const body = document.createElement('div')
    body.className = 'rb-card-body'

    // Job info
    const info = document.createElement('div')
    info.className = 'rb-job-info'
    info.innerHTML = `
      <p class="rb-job-title">${escapeHtml(jobData.jobTitle)}</p>
      <p class="rb-company">${escapeHtml(jobData.company)}</p>
    `
    body.appendChild(info)

    // Score display
    if (analysis) {
      const scoreSection = document.createElement('div')
      scoreSection.className = 'rb-score-section'
      const score = analysis.matchScore
      const colorClass = score < 50 ? 'rb-score-red' : score < 75 ? 'rb-score-yellow' : 'rb-score-green'
      scoreSection.innerHTML = `
        <div class="rb-score-badge ${colorClass}">${score}</div>
        <p class="rb-score-label">${escapeHtml(t('card.matchScore', locale))}</p>
      `
      body.appendChild(scoreSection)
    }

    // Language toggle
    const langToggle = document.createElement('div')
    langToggle.className = 'rb-lang-toggle'
    const langLabel = document.createElement('span')
    langLabel.className = 'rb-lang-label'
    langLabel.textContent = t('card.language', locale)
    langToggle.appendChild(langLabel)
    const langSwitch = document.createElement('div')
    langSwitch.className = 'rb-lang-switch'
    for (const lang of ['en', 'zh'] as const) {
      const btn = document.createElement('button')
      btn.className = `rb-lang-btn${locale === lang ? ' active' : ''}`
      btn.textContent = lang === 'en' ? 'EN' : '中文'
      btn.addEventListener('click', () => {
        locale = lang
        setLocale(lang)
        render()
      })
      langSwitch.appendChild(btn)
    }
    langToggle.appendChild(langSwitch)
    body.appendChild(langToggle)

    // Actions
    const actions = document.createElement('div')
    actions.className = 'rb-actions'

    const analyzeBtn = document.createElement('button')
    analyzeBtn.className = 'rb-btn rb-btn-analyze'
    analyzeBtn.textContent = analyzing ? t('card.analyzing', locale) : (analysis ? t('card.reanalyze', locale) : t('card.analyze', locale))
    analyzeBtn.disabled = analyzing
    analyzeBtn.addEventListener('click', handleAnalyze)
    actions.appendChild(analyzeBtn)

    const saveBtn = document.createElement('button')
    saveBtn.className = 'rb-btn rb-btn-save'
    saveBtn.textContent = saving ? t('card.saving', locale) : (saved ? t('card.saved', locale) : t('card.save', locale))
    saveBtn.disabled = saving || saved
    saveBtn.addEventListener('click', handleSave)
    actions.appendChild(saveBtn)

    body.appendChild(actions)

    // Status
    if (statusMsg) {
      const status = document.createElement('div')
      status.className = `rb-status${statusError ? ' error' : ''}`
      if (!statusError && (analyzing || saving)) {
        status.innerHTML = `<span class="rb-spinner"></span>${escapeHtml(statusMsg)}`
      } else {
        status.textContent = statusMsg
      }
      body.appendChild(status)
    }

    card.appendChild(body)

    // Divider
    const divider = document.createElement('div')
    divider.className = 'rb-divider'
    card.appendChild(divider)

    // Saved Jobs section
    const jobsHeader = document.createElement('div')
    jobsHeader.className = 'rb-jobs-header'
    jobsHeader.innerHTML = `
      <h4>${escapeHtml(t('card.savedJobs', locale))}</h4>
      <span class="rb-jobs-count">${savedJobs.length}</span>
    `
    card.appendChild(jobsHeader)

    const jobsList = document.createElement('div')
    jobsList.className = 'rb-jobs-list'
    card.appendChild(jobsList)

    shadow.appendChild(card)

    // Populate the jobs list
    renderJobsList()
  }

  async function handleAnalyze() {
    analyzing = true
    statusMsg = t('card.analyzingJd', locale)
    statusError = false
    render()

    try {
      const response = await safeSendMessage({
        type: 'QUICK_ANALYZE',
        payload: { jdText: jobData.jdText, language: locale },
      }) as MessageResponse<JDAnalysisResult>

      if (response.success) {
        analysis = response.data
        const n = analysis.missingSkills.length
        statusMsg = `Found ${n} ${t(n === 1 ? 'card.missingSkill' : 'card.missingSkills', locale)}`
      } else {
        statusMsg = response.error
        statusError = true
      }
    } catch (err) {
      statusMsg = err instanceof Error ? err.message : 'Analysis failed'
      statusError = true
    } finally {
      analyzing = false
      render()
      startJobsPolling()
    }
  }

  async function handleSave() {
    saving = true
    statusMsg = t('card.savingProcessing', locale)
    statusError = false
    render()

    try {
      const response = await safeSendMessage({
        type: 'SAVE_JOB',
        payload: { ...jobData, language: locale },
      }) as MessageResponse

      if (response.success) {
        saved = true
        statusMsg = t('card.jobSaved', locale)
      } else {
        statusMsg = response.error
        statusError = true
      }
    } catch (err) {
      statusMsg = err instanceof Error ? err.message : 'Save failed'
      statusError = true
    } finally {
      saving = false
      render()
      // Refresh jobs list to show the new job
      loadSavedJobs()
    }
  }

  render()
  document.body.appendChild(host)
}

function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
