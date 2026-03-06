import type { SiteExtractor } from './types'
import { createLinkedInExtractor } from './linkedin'
import { createIndeedExtractor } from './indeed'
import { createJobsDBExtractor } from './jobsdb'
import { createCtgoodjobsExtractor } from './ctgoodjobs'
import { createZhipinExtractor } from './zhipin'

/** All registered site extractors */
const extractors: SiteExtractor[] = [
  createLinkedInExtractor(),
  createIndeedExtractor(),
  createJobsDBExtractor(),
  createCtgoodjobsExtractor(),
  createZhipinExtractor(),
]

/** Detect which site we're on and return the matching extractor */
export function detectSite(): SiteExtractor | null {
  const hostname = location.hostname
  for (const extractor of extractors) {
    if (extractor.config.hostnames.includes(hostname)) {
      return extractor
    }
  }
  return null
}
