import type { SiteExtractor } from './types'
import type { ExtractedJob } from '../../types'
import { waitForAnySelector, textOf, selectFirst, extractJsonLd } from './base'

export function createJobsDBExtractor(): SiteExtractor {
  const config = {
    name: 'JobsDB',
    hostnames: ['hk.jobsdb.com', 'www.jobsdb.com', 'jobsdb.com'],
    isJobPage: () => {
      const path = location.pathname
      const params = new URLSearchParams(location.search)
      // Direct job page: /job/12345/...
      if (path.startsWith('/job/')) return true
      // Legacy path patterns
      if (path.includes('/job-')) return true
      // Numeric job ID at end of path
      if (/\/\d{5,}$/.test(path)) return true
      // Search results with selected job: ?jobId=12345
      if (params.has('jobId')) return true
      // Any *-jobs listing path (may show job detail in side panel)
      if (/-jobs/.test(path)) return true
      return false
    },
    isSPA: true,
    navigationDelay: 2000,
  }

  const JD_SELECTORS = [
    // SEEK/JobsDB data-automation attributes
    '[data-automation="jobDescription"]',
    '[data-automation="jobAdDetails"]',
    '[data-automation="jobDescription"] [data-automation="jobAdDetails"]',
    // Search results page - job detail panel (right side)
    '[data-automation="jobDetailsPage"]',
    '[data-automation="jobListing"] [data-automation="jobAdDetails"]',
    // Class-based selectors
    '[class*="job-description"]',
    '[class*="jobDescription"]',
    '[class*="job-detail"]',
    '[class*="jobDetail"]',
    // SEEK platform specific
    '[data-testid="job-details--content"]',
    '[data-testid="job-details"]',
    // Generic fallback
    'article[role="main"]',
    '#contentContainer',
    '#job-description',
  ]

  async function waitForContent(timeout = 20000): Promise<void> {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      // Check JSON-LD first
      const jsonLd = extractJsonLd()
      if (jsonLd?.jdText && jsonLd.jdText.length > 30) {
        console.log('[Vektor] JobsDB: Found content via JSON-LD')
        return
      }

      // Check DOM selectors
      for (const sel of JD_SELECTORS) {
        try {
          const el = document.querySelector(sel)
          if (el && textOf(el).length > 50) {
            console.log(`[Vektor] JobsDB: Found content via selector: ${sel}`)
            return
          }
        } catch { /* invalid selector */ }
      }

      await new Promise(r => setTimeout(r, 500))
    }
    console.warn('[Vektor] JobsDB: Content not found after timeout, attempting extraction anyway')
  }

  function extractJobData(): ExtractedJob | null {
    // Layer 1: JSON-LD (most reliable for SEEK platform)
    const jsonLd = extractJsonLd()
    if (jsonLd && jsonLd.jdText && jsonLd.jdText.length > 30) {
      console.log('[Vektor] JobsDB: Extracted via JSON-LD, title:', jsonLd.jobTitle)
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

    // Layer 2: data-automation attributes (SEEK convention)
    const titleEl = selectFirst(
      '[data-automation="job-detail-title"]',
      '[data-automation="jobTitle"]',
      'h1[data-automation]',
      'h1[class*="job-title"]',
      'h1[class*="jobTitle"]',
      // Search results panel title
      '[data-automation="jobDetailsPage"] h1',
      '[data-automation="job-details--title"]',
      'h1',
    )
    const jobTitle = textOf(titleEl)

    const company = extractCompanyFromDom()
    const jobLocation = extractLocationFromDom()

    // Layer 3: DOM selectors for job description
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

    // Layer 4: Fallback — find largest text block with job-related keywords
    if (!jdText || jdText.length < 50) {
      const fallback = extractLargestTextBlock()
      if (fallback.length > jdText.length) {
        jdText = fallback
        jdHtml = ''
      }
    }

    if (!jobTitle && !jdText) {
      console.warn('[Vektor] JobsDB: Could not extract any job data')
      return null
    }

    console.log('[Vektor] JobsDB: Extracted via DOM, title:', jobTitle, 'jd length:', jdText.length)
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
      if (cls.includes('jobcard') || cls.includes('job-card')) continue

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
      '[data-automation="advertiser-name"]',
      '[data-automation="jobCompany"]',
      'a[data-automation="jobCompany"]',
      '[data-automation="jobDetailsPage"] [data-automation="advertiser-name"]',
      '[class*="advertiser-name"]',
      '[class*="company-name"]',
      '[class*="companyName"]',
    )
    return textOf(el)
  }

  function extractLocationFromDom(): string {
    const el = selectFirst(
      '[data-automation="job-detail-location"]',
      '[data-automation="jobLocation"]',
      '[data-automation="jobDetailsPage"] [data-automation="job-detail-location"]',
      '[class*="job-location"]',
      '[class*="jobLocation"]',
      'span[class*="location"]',
    )
    return textOf(el)
  }

  function extractApplyUrl(): string | null {
    const btn = selectFirst(
      '[data-automation="job-detail-apply"]',
      'a[data-automation="applyButton"]',
      'a[class*="apply-button"]',
      'a[class*="applyButton"]',
      'button[data-automation="job-detail-apply"]',
    )
    if (btn && btn.tagName === 'A') {
      return (btn as HTMLAnchorElement).href
    }
    return null
  }

  function extractPostedDate(): string | null {
    const el = selectFirst(
      '[data-automation="job-detail-date"]',
      '[data-automation="jobListingDate"]',
      '[class*="posted-date"]',
      '[class*="listing-date"]',
      'time',
    )
    if (!el) return null
    const timeEl = el.tagName === 'TIME' ? el : el.querySelector('time')
    return timeEl?.getAttribute('datetime') ?? textOf(el)
  }

  return { config, waitForContent, extractJobData }
}
