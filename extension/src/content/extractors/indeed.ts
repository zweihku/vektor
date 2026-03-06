import type { SiteExtractor } from './types'
import type { ExtractedJob } from '../../types'
import { waitForAnySelector, textOf, selectFirst, extractJsonLd } from './base'

export function createIndeedExtractor(): SiteExtractor {
  const config = {
    name: 'Indeed',
    hostnames: ['hk.indeed.com', 'www.indeed.com', 'indeed.com'],
    isJobPage: () => {
      const path = location.pathname
      const params = new URLSearchParams(location.search)
      // Direct job page
      if (path.includes('/viewjob') || path.includes('/rc/clk')) return true
      if (params.has('vjk') || params.has('jk')) return true
      // Search results page with a selected job (side panel)
      if ((path.startsWith('/jobs') || path.startsWith('/search')) && params.has('vjk')) return true
      // Search results page -- jobs may appear in side panel
      if (path.startsWith('/jobs') || path.startsWith('/search')) return true
      return false
    },
    isSPA: true,
    navigationDelay: 2000,
  }

  // Comprehensive JD selectors covering Indeed layouts from 2023-2026
  const JD_SELECTORS = [
    // Direct job view page
    '#jobDescriptionText',
    '#jobsearch-ViewjobPaneWrapper #jobDescriptionText',
    '[data-testid="jobDescriptionText"]',

    // Search results - right pane JD
    '.jobsearch-JobComponent-description',
    '.jobsearch-jobDescriptionText',
    '#job-details',
    '[id="jobDetailsSection"]',

    // Generic class-based
    '[class*="jobDescription"]',
    '[class*="job-description"]',

    // Right-side panel on search pages
    '.jobsearch-RightPane #jobDescriptionText',
    '.jobsearch-ViewJobLayout-jobDisplay #jobDescriptionText',
    '[data-testid="jobsearch-ViewJobContent"] #jobDescriptionText',

    // Newer Indeed layouts (2025+)
    '[data-testid="job-details"]',
    '[data-testid="jobDescription"]',
    '.jobs-description__content',
    '[data-testid="full-job-details"]',

    // Indeed embedded job view
    '#mosaic-jobResults #jobDescriptionText',
    '#mosaic-provider-jobcards + div #jobDescriptionText',
    '.icl-u-xs-block [id*="jobDescription"]',

    // Broader fallback
    '.jobsearch-BodyContainer [id="jobDescriptionText"]',
    '#viewJobSSRRoot #jobDescriptionText',
    '#job_description',
  ]

  // Selectors for the right-pane wrapper (search results page)
  const RIGHT_PANE_SELECTORS = [
    '#jobsearch-ViewjobPaneWrapper',
    '.jobsearch-ViewJobLayout-jobDisplay',
    '[data-testid="jobsearch-ViewJobContent"]',
    '.jobsearch-RightPane',
    '#mosaic-provider-jobcards',
  ]

  const TITLE_SELECTORS = [
    '[data-testid="jobsearch-JobInfoHeader-title"]',
    'h1[class*="jobTitle"]',
    '.jobsearch-JobInfoHeader-title',
    'h2[data-testid="simpleHeaderTitle"]',
    'h2[data-testid="jobsearch-JobInfoHeader-title"]',
    '[data-testid="job-title"]',
    '.jcs-JobTitle span',
    'h2.jobTitle span',
    '.jobTitle > span',
    'h1',
  ]

  const COMPANY_SELECTORS = [
    '[data-testid="inlineHeader-companyName"]',
    '[data-testid="companyName"]',
    '.jobsearch-InlineCompanyRating-companyHeader a',
    '[class*="companyName"]',
    '[data-company-name]',
    '[data-testid="company-name"]',
    '.companyName',
    '[data-testid="inlineHeader-companyName"] a',
  ]

  const LOCATION_SELECTORS = [
    '[data-testid="inlineHeader-companyLocation"]',
    '[data-testid="jobsearch-JobInfoHeader-companyLocation"]',
    '[class*="companyLocation"]',
    '[data-testid="job-location"]',
    '[data-testid="inlineHeader-companyLocation"] div',
    '.companyLocation',
  ]

  async function waitForContent(timeout = 20000): Promise<void> {
    const start = Date.now()
    let iteration = 0

    console.log('[Vektor] Indeed: waitForContent started, timeout =', timeout, 'ms')
    console.log('[Vektor] Indeed: URL =', location.href)

    while (Date.now() - start < timeout) {
      iteration++

      // First check if the right-pane wrapper is present (search results page)
      let rightPaneFound = false
      for (const sel of RIGHT_PANE_SELECTORS) {
        try {
          const el = document.querySelector(sel)
          if (el) {
            rightPaneFound = true
            if (iteration <= 3 || iteration % 5 === 0) {
              console.log(`[Vektor] Indeed: Right pane found via "${sel}"`)
            }
            break
          }
        } catch { /* invalid selector */ }
      }

      // Check JD selectors
      for (const sel of JD_SELECTORS) {
        try {
          const el = document.querySelector(sel)
          if (el) {
            const len = textOf(el).length
            if (len > 50) {
              console.log(`[Vektor] Indeed: JD content found via "${sel}" (${len} chars) after ${Date.now() - start}ms`)
              return
            }
            if (iteration <= 3 || iteration % 5 === 0) {
              console.log(`[Vektor] Indeed: Selector "${sel}" matched but text too short (${len} chars)`)
            }
          }
        } catch { /* invalid selector */ }
      }

      // Check JSON-LD as early signal
      if (iteration === 1 || iteration % 10 === 0) {
        const jsonLd = extractJsonLd()
        if (jsonLd && jsonLd.jdText && jsonLd.jdText.length > 30) {
          console.log(`[Vektor] Indeed: JSON-LD with JD found (${jsonLd.jdText.length} chars) after ${Date.now() - start}ms`)
          return
        }
      }

      if (iteration <= 3 || iteration % 5 === 0) {
        console.log(`[Vektor] Indeed: waitForContent iteration ${iteration}, elapsed ${Date.now() - start}ms, rightPane=${rightPaneFound}`)
      }

      await new Promise(r => setTimeout(r, 500))
    }

    console.warn(`[Vektor] Indeed: JD content not found after ${timeout}ms timeout, attempting extraction anyway`)
  }

  function extractJobData(): ExtractedJob | null {
    console.log('[Vektor] Indeed: extractJobData() called, URL =', location.href)

    // Layer 1: JSON-LD (most reliable)
    const jsonLd = extractJsonLd()
    if (jsonLd && jsonLd.jdText && jsonLd.jdText.length > 30) {
      console.log('[Vektor] Indeed: Extracted from JSON-LD, JD length =', jsonLd.jdText.length)
      return {
        jobTitle: jsonLd.jobTitle || extractTitleFromDom() || 'Unknown Position',
        company: jsonLd.company || extractCompanyFromDom(),
        location: jsonLd.location || extractLocationFromDom(),
        jdText: jsonLd.jdText,
        jdHtml: jsonLd.jdHtml || '',
        jobUrl: window.location.href,
        applyUrl: extractApplyUrl(),
        postedDate: jsonLd.postedDate || null,
      }
    }
    console.log('[Vektor] Indeed: No usable JSON-LD found, trying DOM selectors')

    // Layer 2: DOM selectors
    const jobTitle = extractTitleFromDom()
    const company = extractCompanyFromDom()
    const jobLocation = extractLocationFromDom()

    // Try all JD selectors, keep the longest match
    let jdText = ''
    let jdHtml = ''
    let matchedSelector = ''
    for (const sel of JD_SELECTORS) {
      try {
        const el = document.querySelector(sel)
        if (el) {
          const text = textOf(el)
          if (text.length > jdText.length) {
            jdText = text
            jdHtml = el.innerHTML
            matchedSelector = sel
          }
        }
      } catch { /* invalid selector */ }
    }

    if (matchedSelector) {
      console.log(`[Vektor] Indeed: Best DOM match "${matchedSelector}" with ${jdText.length} chars`)
    }

    // Layer 3: Try to find JD inside the right pane wrapper (search results)
    if (!jdText || jdText.length < 50) {
      for (const paneSel of RIGHT_PANE_SELECTORS) {
        try {
          const pane = document.querySelector(paneSel)
          if (pane) {
            // Search within the pane for any substantial text block
            const innerDivs = pane.querySelectorAll('div, section')
            for (const div of innerDivs) {
              const text = textOf(div)
              if (text.length > jdText.length && text.length > 100) {
                const lower = text.toLowerCase()
                if (lower.includes('qualif') || lower.includes('responsib') || lower.includes('require') ||
                    lower.includes('experience') || lower.includes('skill') || lower.includes('description') ||
                    lower.includes('duties') || lower.includes('about') ||
                    lower.includes('职责') || lower.includes('要求') || lower.includes('经验')) {
                  jdText = text
                  jdHtml = div.innerHTML
                  console.log(`[Vektor] Indeed: Found JD in right pane "${paneSel}", ${text.length} chars`)
                }
              }
            }
          }
        } catch { /* skip */ }
      }
    }

    // Layer 4: Fallback -- grab the largest text block on the page
    if (!jdText || jdText.length < 50) {
      console.log('[Vektor] Indeed: JD selectors failed, trying largest text block fallback')
      const fallback = extractLargestTextBlock()
      if (fallback.length > jdText.length) {
        jdText = fallback
        jdHtml = ''
        console.log(`[Vektor] Indeed: Fallback found ${fallback.length} chars`)
      }
    }

    if (!jobTitle && !jdText) {
      console.warn('[Vektor] Indeed: No job title or JD found, returning null')
      return null
    }

    console.log(`[Vektor] Indeed: Extraction result - title="${jobTitle}", company="${company}", jdLen=${jdText.length}`)

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

  /** Fallback: find the largest text block that looks like a job description */
  function extractLargestTextBlock(): string {
    let best = ''
    const candidates = document.querySelectorAll('div, section, article')
    for (const el of candidates) {
      // Skip nav, header, footer, sidebar elements
      const tag = el.tagName.toLowerCase()
      const cls = typeof el.className === 'string' ? el.className.toLowerCase() : ''
      if (cls.includes('nav') || cls.includes('header') || cls.includes('footer') || cls.includes('sidebar')) continue
      if (cls.includes('mosaic-jobcards') || cls.includes('jobcard')) continue
      if (tag === 'nav' || tag === 'header' || tag === 'footer') continue

      const text = textOf(el)
      // JD typically has 100+ characters and contains job-related terms
      if (text.length > 100 && text.length < 15000 && text.length > best.length) {
        const lower = text.toLowerCase()
        if (lower.includes('qualif') || lower.includes('responsib') || lower.includes('require') ||
            lower.includes('experience') || lower.includes('skill') || lower.includes('description') ||
            lower.includes('duties') || lower.includes('about the role') ||
            lower.includes('职责') || lower.includes('要求') || lower.includes('经验')) {
          best = text
        }
      }
    }
    return best
  }

  function extractTitleFromDom(): string {
    const el = selectFirst(...TITLE_SELECTORS)
    return textOf(el)
  }

  function extractCompanyFromDom(): string {
    const el = selectFirst(...COMPANY_SELECTORS)
    if (el) {
      // If the element has a data-company-name attribute, prefer that
      const attrName = el.getAttribute('data-company-name')
      if (attrName) return attrName.trim()
      return textOf(el)
    }
    return ''
  }

  function extractLocationFromDom(): string {
    const el = selectFirst(...LOCATION_SELECTORS)
    return textOf(el)
  }

  function extractApplyUrl(): string | null {
    const btn = selectFirst(
      '#indeedApplyButton',
      '[data-testid="applyButton-top"]',
      'button[class*="apply"]',
      'a[class*="apply"]',
      '[data-testid="indeedApplyButton"]',
    )
    if (btn && btn.tagName === 'A') {
      return (btn as HTMLAnchorElement).href
    }
    return null
  }

  function extractPostedDate(): string | null {
    const el = selectFirst(
      '[data-testid="myJobsStateDate"]',
      '.jobsearch-HiringInsights-entry--bullet',
      '[class*="posted-date"]',
      '[data-testid="job-age"]',
    )
    return el ? textOf(el) : null
  }

  return { config, waitForContent, extractJobData }
}
