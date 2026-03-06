import type { SiteExtractor } from './types'
import type { ExtractedJob } from '../../types'
import { waitForAnySelector, textOf, selectFirst } from './base'

export function createLinkedInExtractor(): SiteExtractor {
  const config = {
    name: 'LinkedIn',
    hostnames: ['www.linkedin.com'],
    isJobPage: () => location.pathname.startsWith('/jobs/view/'),
    isSPA: true,
    navigationDelay: 2000,
  }

  async function waitForContent(timeout = 15000): Promise<void> {
    await waitForAnySelector([
      '.jobs-description__content',
      '#job-details',
      '.jobs-description',
      '.job-view-layout',
      '.jobs-unified-top-card',
      '.job-details-jobs-unified-top-card',
      '[class*="jobs-description"]',
      '[class*="job-details"]',
      '[class*="jobs-unified"]',
    ], timeout)
  }

  function extractJobData(): ExtractedJob | null {
    // ============ Job title ============
    const titleEl = selectFirst(
      '.job-details-jobs-unified-top-card__job-title h1',
      '.job-details-jobs-unified-top-card__job-title a',
      '.job-details-jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title h1',
      '.jobs-unified-top-card__job-title a',
      '.jobs-unified-top-card__job-title',
      '.t-24.t-bold.inline',
      '[class*="top-card"] h1',
      '[class*="topcard"] h1',
      'h1.t-24',
      'h1',
    )
    const jobTitle = textOf(titleEl)

    // ============ Company ============
    const companyEl = selectFirst(
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.job-details-jobs-unified-top-card__primary-description-container a',
      '.jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__subtitle-primary-grouping a',
      '[class*="top-card"] [class*="company"] a',
      '[class*="topcard"] [class*="company"] a',
      '[class*="top-card__company"]',
    )
    const company = textOf(companyEl)

    // ============ Location ============
    const locationEl = selectFirst(
      '.job-details-jobs-unified-top-card__bullet',
      '.job-details-jobs-unified-top-card__workplace-type',
      '.jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__workplace-type',
      '.jobs-unified-top-card__subtitle-secondary-grouping .t-black--light',
      '[class*="top-card"] [class*="bullet"]',
      '[class*="top-card"] [class*="location"]',
      '[class*="top-card"] [class*="workplace"]',
    )
    const jobLocation = textOf(locationEl)

    // ============ Job description ============
    const jdEl = selectFirst(
      '.jobs-description__content .jobs-box__html-content',
      '.jobs-description__content',
      '#job-details',
      '.jobs-description',
      '.jobs-box__html-content',
      '[class*="jobs-description"] [class*="html-content"]',
      '[class*="jobs-description"]',
      'article[class*="jobs"]',
    )
    const jdText = textOf(jdEl)
    const jdHtml = jdEl?.innerHTML ?? ''

    // ============ Apply URL ============
    let applyUrl: string | null = null
    const applyBtn = selectFirst(
      '.jobs-apply-button',
      '.jobs-apply-button--top-card',
      '[class*="jobs-apply-button"]',
      '[class*="apply-button"]',
    )
    if (applyBtn && applyBtn.tagName === 'A') {
      applyUrl = (applyBtn as HTMLAnchorElement).href
    }

    // ============ Posted date ============
    const dateEl = selectFirst(
      '.job-details-jobs-unified-top-card__posted-date',
      '.jobs-unified-top-card__posted-date',
      '[class*="posted-date"]',
      '[class*="top-card"] time',
    )
    let postedDate: string | null = null
    if (dateEl) {
      const timeEl = dateEl.querySelector('time')
      postedDate = timeEl?.getAttribute('datetime') ?? textOf(dateEl)
    }

    if (!jobTitle && !jdText) return null

    return {
      jobTitle: jobTitle || 'Unknown Position',
      company: company || 'Unknown Company',
      location: jobLocation || '',
      jdText: jdText || '',
      jdHtml,
      jobUrl: window.location.href,
      applyUrl,
      postedDate,
    }
  }

  return { config, waitForContent, extractJobData }
}
