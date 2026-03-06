import type { SiteExtractor } from './types'
import type { ExtractedJob } from '../../types'
import { waitForAnySelector, textOf, selectFirst, extractJsonLd } from './base'

export function createCtgoodjobsExtractor(): SiteExtractor {
  const config = {
    name: 'CTgoodjobs',
    hostnames: ['www.ctgoodjobs.hk', 'ctgoodjobs.hk', 'jobs.ctgoodjobs.hk'],
    isJobPage: () => {
      const path = location.pathname
      const params = new URLSearchParams(location.search)
      // Direct job detail page: /job/10011717/...
      if (/^\/job\/\d+/.test(path)) return true
      // Legacy paths
      if (path.includes('/jobdetails') || path.includes('/job-listing/')) return true
      // Search/listing with selected job: ?current_job=...
      if (params.has('current_job')) return true
      // Any path with /jobs/ that might show detail
      if (path.includes('/jobs/') && params.has('current_job')) return true
      // Numeric job ID in path
      if (/\/\d{5,}/.test(path)) return true
      return false
    },
    isSPA: true,
    navigationDelay: 2000,
  }

  const JD_SELECTORS = [
    // Common job description containers
    '.job-description',
    '.job-detail-description',
    '#job-description',
    '#job-detail',
    '.job-detail',
    '[class*="job-description"]',
    '[class*="jobDescription"]',
    '[class*="job-detail"]',
    '[class*="jobDetail"]',
    // Next.js app containers
    '.main-content',
    '.mc-wrapper',
    '.content-main',
    'article',
    // Generic containers that might hold JD
    '[class*="description"]',
    '.page-body [class*="detail"]',
  ]

  async function waitForContent(timeout = 20000): Promise<void> {
    const start = Date.now()

    // First, try JSON-LD — it's the most reliable on this site
    while (Date.now() - start < timeout) {
      const jsonLd = extractJsonLd()
      if (jsonLd?.jdText && jsonLd.jdText.length > 30) {
        console.log('[Vektor] CTgoodjobs: Found job content via JSON-LD')
        return
      }

      // Also try DOM selectors
      for (const sel of JD_SELECTORS) {
        try {
          const el = document.querySelector(sel)
          if (el && textOf(el).length > 50) {
            console.log(`[Vektor] CTgoodjobs: Found content via selector: ${sel}`)
            return
          }
        } catch { /* invalid selector */ }
      }

      await new Promise(r => setTimeout(r, 500))
    }

    console.warn('[Vektor] CTgoodjobs: Content not found after timeout, attempting extraction anyway')
  }

  function extractJobData(): ExtractedJob | null {
    // Layer 1: JSON-LD (most reliable — this site has good schema.org data)
    const jsonLd = extractJsonLd()
    if (jsonLd && jsonLd.jdText && jsonLd.jdText.length > 30) {
      console.log('[Vektor] CTgoodjobs: Extracted via JSON-LD, title:', jsonLd.jobTitle)
      return {
        jobTitle: jsonLd.jobTitle || 'Unknown Position',
        company: jsonLd.company || extractCompanyFromDom(),
        location: jsonLd.location || extractLocationFromDom(),
        jdText: jsonLd.jdText,
        jdHtml: jsonLd.jdHtml || '',
        jobUrl: window.location.href,
        applyUrl: extractApplyUrl(),
        postedDate: jsonLd.postedDate || null,
      }
    }

    // Layer 2: CSS selectors
    const titleEl = selectFirst(
      '.job-title',
      '.job-detail-title',
      'h1[class*="job-title"]',
      'h1[class*="jobTitle"]',
      '.main-content h1',
      '.content-main h1',
      'h1',
    )
    const jobTitle = textOf(titleEl)

    const company = extractCompanyFromDom()
    const jobLocation = extractLocationFromDom()

    let jdText = ''
    let jdHtml = ''
    for (const sel of JD_SELECTORS) {
      try {
        const el = document.querySelector(sel)
        if (el) {
          const text = textOf(el)
          if (text.length > jdText.length) {
            jdText = text
            jdHtml = el.innerHTML
          }
        }
      } catch { /* skip */ }
    }

    // Layer 3: Fallback — find largest text block with job-related keywords
    if (!jdText || jdText.length < 50) {
      const fallback = extractLargestTextBlock()
      if (fallback.length > jdText.length) {
        jdText = fallback
        jdHtml = ''
      }
    }

    if (!jobTitle && !jdText) {
      console.warn('[Vektor] CTgoodjobs: Could not extract any job data')
      return null
    }

    console.log('[Vektor] CTgoodjobs: Extracted via DOM, title:', jobTitle, 'jd length:', jdText.length)
    return {
      jobTitle: jobTitle || 'Unknown Position',
      company: company || 'Unknown Company',
      location: jobLocation || '',
      jdText: jdText || '',
      jdHtml,
      jobUrl: window.location.href,
      applyUrl: extractApplyUrl(),
      postedDate: extractPostedDate(),
    }
  }

  function extractLargestTextBlock(): string {
    let best = ''
    const candidates = document.querySelectorAll('div, section, article')
    for (const el of candidates) {
      const cls = (typeof el.className === 'string' ? el.className : '').toLowerCase()
      if (cls.includes('nav') || cls.includes('header') || cls.includes('footer') || cls.includes('sidebar')) continue

      const text = textOf(el)
      if (text.length > 100 && text.length < 15000 && text.length > best.length) {
        const lower = text.toLowerCase()
        if (lower.includes('qualif') || lower.includes('responsib') || lower.includes('require') ||
            lower.includes('experience') || lower.includes('skill') || lower.includes('description') ||
            lower.includes('duties') || lower.includes('about the role')) {
          best = text
        }
      }
    }
    return best
  }

  function extractCompanyFromDom(): string {
    const el = selectFirst(
      '.company-name',
      '.job-company',
      '[class*="company-name"]',
      '[class*="companyName"]',
      '[class*="company"]',
      'a[class*="company"]',
    )
    return textOf(el)
  }

  function extractLocationFromDom(): string {
    const el = selectFirst(
      '.job-location',
      '.work-location',
      '[class*="job-location"]',
      '[class*="location"]',
    )
    return textOf(el)
  }

  function extractApplyUrl(): string | null {
    const btn = selectFirst(
      'a[class*="apply"]',
      'a[class*="Apply"]',
      'a[href*="apply"]',
      'button[class*="apply"]',
      '.btn-cta',
    )
    if (btn && btn.tagName === 'A') {
      return (btn as HTMLAnchorElement).href
    }
    return null
  }

  function extractPostedDate(): string | null {
    const el = selectFirst(
      '.posted-date',
      '[class*="posted-date"]',
      '[class*="post-date"]',
      'time',
    )
    if (!el) return null
    const timeEl = el.tagName === 'TIME' ? el : el.querySelector('time')
    return timeEl?.getAttribute('datetime') ?? textOf(el)
  }

  return { config, waitForContent, extractJobData }
}
