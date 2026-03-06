import { detectSite } from './extractors/registry'
import { createCard } from './card'

const extractor = detectSite()
const siteName = extractor?.config.name ?? 'Unknown'

console.log(`[Vektor] Content script loaded on ${siteName}:`, location.href)

if (!extractor) {
  console.warn('[Vektor] No extractor found for this site, stopping')
} else {
  /** Check if extension context is still valid */
  function isContextValid(): boolean {
    try {
      return !!chrome.runtime?.id
    } catch {
      return false
    }
  }

  async function init() {
    if (!isContextValid()) {
      console.warn('[Vektor] Extension context invalidated, stopping')
      if (observer) observer.disconnect()
      return
    }

    // Prevent duplicate injection
    if (document.getElementById('rb-ext-root')) {
      console.log('[Vektor] Card already exists, skipping')
      return
    }

    try {
      await extractor.waitForContent(20000)

      const jobData = extractor.extractJobData()
      if (jobData) {
        console.log(`[Vektor] Extracted job from ${siteName}:`, jobData.jobTitle, '@', jobData.company)
        createCard(jobData)
      } else {
        console.warn(`[Vektor] Could not extract job data from ${siteName}, showing fallback card`)
        createCard({
          jobTitle: document.querySelector('h1')?.textContent?.trim() || 'Job Position',
          company: '',
          location: '',
          jdText: document.body.innerText.substring(0, 5000),
          jdHtml: '',
          jobUrl: window.location.href,
          applyUrl: null,
          postedDate: null,
        })
      }
    } catch (err) {
      console.error(`[Vektor] Error during init on ${siteName}:`, err)
      createCard({
        jobTitle: document.querySelector('h1')?.textContent?.trim() || 'Job Position',
        company: '',
        location: '',
        jdText: '',
        jdHtml: '',
        jobUrl: window.location.href,
        applyUrl: null,
        postedDate: null,
      })
    }
  }

  // Run on initial load
  init()

  // Watch for SPA navigation (URL changes without page reload) — only for SPA sites
  let observer: MutationObserver | null = null
  if (extractor.config.isSPA) {
    let lastUrl = location.href
    observer = new MutationObserver(() => {
      if (!isContextValid()) {
        observer!.disconnect()
        const existing = document.getElementById('rb-ext-root')
        if (existing) existing.remove()
        return
      }

      if (location.href !== lastUrl) {
        lastUrl = location.href
        console.log(`[Vektor] URL changed to:`, location.href)

        // Remove existing card
        const existing = document.getElementById('rb-ext-root')
        if (existing) existing.remove()

        // Re-initialize if on a job page
        if (extractor.config.isJobPage()) {
          setTimeout(init, extractor.config.navigationDelay)
        }
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }
}
