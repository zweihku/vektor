import type { ExtractedJob } from '../../types'

export interface SiteConfig {
  /** Human-readable site name for logging */
  name: string
  /** Hostnames this extractor handles (e.g. ['www.linkedin.com']) */
  hostnames: string[]
  /** Check if current page is a job detail page */
  isJobPage: () => boolean
  /** Whether the site uses SPA navigation (needs MutationObserver) */
  isSPA: boolean
  /** Delay (ms) after SPA navigation before re-initializing */
  navigationDelay: number
}

export interface SiteExtractor {
  config: SiteConfig
  /** Wait for job content to appear on page */
  waitForContent: (timeout?: number) => Promise<void>
  /** Extract structured job data from the page */
  extractJobData: () => ExtractedJob | null
}
