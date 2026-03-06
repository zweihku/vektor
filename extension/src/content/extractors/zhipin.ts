import type { SiteExtractor } from './types'
import type { ExtractedJob } from '../../types'
import { waitForAnySelector, textOf, selectFirst, extractJsonLd } from './base'

export function createZhipinExtractor(): SiteExtractor {
  const config = {
    name: 'Boss直聘',
    hostnames: ['www.zhipin.com'],
    isJobPage: () => {
      return location.pathname.startsWith('/job_detail/') ||
        location.pathname.includes('/job/') ||
        // SPA route for job detail inside the geek/job page
        (location.pathname.startsWith('/web/geek/job') && location.search.includes('ka='))
    },
    isSPA: true,
    navigationDelay: 2000,
  }

  async function waitForContent(timeout = 15000): Promise<void> {
    await waitForAnySelector([
      // Job detail page selectors
      '.job-detail',
      '.job-sec-text',
      '.job-detail-section',
      '.job-banner',
      '.job-box',
      // Newer SPA layout
      '[class*="job-detail"]',
      '[class*="job-sec"]',
      '.detail-content',
    ], timeout)
  }

  function extractJobData(): ExtractedJob | null {
    // Layer 1: JSON-LD (unlikely on Boss but check anyway)
    const jsonLd = extractJsonLd()
    if (jsonLd && jsonLd.jdText) {
      return {
        jobTitle: jsonLd.jobTitle || 'Unknown Position',
        company: jsonLd.company || extractCompanyFromDom(),
        location: jsonLd.location || extractLocationFromDom(),
        jdText: jsonLd.jdText,
        jdHtml: jsonLd.jdHtml || '',
        jobUrl: window.location.href,
        applyUrl: null,
        postedDate: jsonLd.postedDate || null,
      }
    }

    // Layer 2: DOM extraction
    const jobTitle = extractTitle()
    const company = extractCompanyFromDom()
    const jobLocation = extractLocationFromDom()
    const salary = extractSalary()

    // Job description
    const jdEl = selectFirst(
      '.job-sec-text',
      '.job-detail-section .text',
      '.detail-content .text',
      '.job-detail .text',
      '[class*="job-sec"] .text',
      '[class*="job-detail"] .text',
      '.job-box .text',
    )
    let jdText = textOf(jdEl)
    const jdHtml = jdEl?.innerHTML ?? ''

    // Prepend salary to JD text if available
    if (salary && jdText) {
      jdText = `薪资: ${salary}\n\n${jdText}`
    }

    if (!jobTitle && !jdText) return null

    return {
      jobTitle: jobTitle || 'Unknown Position',
      company: company || 'Unknown Company',
      location: jobLocation || '',
      jdText: jdText || '',
      jdHtml,
      jobUrl: window.location.href,
      applyUrl: null,
      postedDate: null,
    }
  }

  function extractTitle(): string {
    const el = selectFirst(
      '.job-banner .name h1',
      '.info-primary .name h1',
      '.job-title',
      '.name h1',
      '.job-banner h1',
      'h1[class*="job"]',
      '.detail-content h1',
      'h1',
    )
    return textOf(el)
  }

  function extractCompanyFromDom(): string {
    const el = selectFirst(
      '.company-info a',
      '.job-company .name a',
      '.company-name a',
      '.company-name',
      '.info-company .name a',
      '.info-company a',
      '[class*="company-info"] a',
      '[class*="company-name"]',
    )
    return textOf(el)
  }

  function extractLocationFromDom(): string {
    const el = selectFirst(
      '.job-banner .info-primary p',
      '.info-primary .text-city',
      '.location-address',
      '.job-address',
      '[class*="location"]',
      '.info-primary p',
    )
    return textOf(el)
  }

  function extractSalary(): string {
    const el = selectFirst(
      '.salary',
      '.name .salary',
      '.info-primary .salary',
      '.job-banner .salary',
      '[class*="salary"]',
    )
    return textOf(el)
  }

  return { config, waitForContent, extractJobData }
}
