import type { ExtractedJob } from '../../types'

/** Wait for a single CSS selector to appear in DOM */
export function waitForSelector(selector: string, timeout = 10000): Promise<Element> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(selector)
    if (existing) {
      resolve(existing)
      return
    }

    const interval = 500
    let elapsed = 0
    const timer = setInterval(() => {
      const el = document.querySelector(selector)
      if (el) {
        clearInterval(timer)
        resolve(el)
        return
      }
      elapsed += interval
      if (elapsed >= timeout) {
        clearInterval(timer)
        reject(new Error(`Timeout waiting for selector: ${selector}`))
      }
    }, interval)
  })
}

/** Wait for any of the given selectors to match an element */
export async function waitForAnySelector(selectors: string[], timeout = 15000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    for (const sel of selectors) {
      try {
        if (document.querySelector(sel)) return
      } catch {
        // invalid selector, skip
      }
    }
    await new Promise(r => setTimeout(r, 500))
  }
  console.warn('[Vektor] No known job content selector found, will attempt extraction anyway')
}

/** Get trimmed text content of an element */
export function textOf(el: Element | null): string {
  return el?.textContent?.trim() ?? ''
}

/** Return the first element matched by any of the given selectors */
export function selectFirst(...selectors: string[]): Element | null {
  for (const sel of selectors) {
    const el = document.querySelector(sel)
    if (el) return el
  }
  return null
}

/**
 * Extract structured job data from JSON-LD `JobPosting` script tags.
 * Many job sites embed schema.org structured data which is the most reliable source.
 */
export function extractJsonLd(): Partial<ExtractedJob> | null {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]')
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent || '')
      const posting = findJobPosting(data)
      if (posting) {
        return {
          jobTitle: posting.title || '',
          company: typeof posting.hiringOrganization === 'object'
            ? posting.hiringOrganization?.name || ''
            : String(posting.hiringOrganization || ''),
          location: extractJsonLdLocation(posting),
          jdText: stripHtml(posting.description || ''),
          jdHtml: posting.description || '',
          jobUrl: posting.url || window.location.href,
          postedDate: posting.datePosted || null,
        }
      }
    } catch {
      // malformed JSON-LD, skip
    }
  }
  return null
}

/** Recursively find a JobPosting object in JSON-LD data (may be nested in @graph) */
function findJobPosting(data: any): any | null {
  if (!data) return null
  if (data['@type'] === 'JobPosting') return data
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findJobPosting(item)
      if (found) return found
    }
  }
  if (data['@graph']) return findJobPosting(data['@graph'])
  return null
}

/** Extract location string from JSON-LD jobLocation */
function extractJsonLdLocation(posting: any): string {
  const loc = posting.jobLocation
  if (!loc) return ''
  if (typeof loc === 'string') return loc
  if (Array.isArray(loc)) {
    return loc.map(l => extractJsonLdLocation({ jobLocation: l })).filter(Boolean).join(', ')
  }
  const address = loc.address
  if (!address) return loc.name || ''
  if (typeof address === 'string') return address
  return [address.addressLocality, address.addressRegion, address.addressCountry]
    .filter(Boolean)
    .join(', ')
}

/** Strip HTML tags and decode entities */
function stripHtml(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent?.trim() || ''
}
