import type { SavedJob } from './types'

const JOB_PREFIX = 'jobs_'

function jobKey(id: string): string {
  return `${JOB_PREFIX}${id}`
}

export async function saveJob(job: SavedJob): Promise<void> {
  await chrome.storage.local.set({ [jobKey(job.id)]: job })
}

export async function getJob(id: string): Promise<SavedJob | null> {
  const result = await chrome.storage.local.get(jobKey(id))
  return result[jobKey(id)] ?? null
}

export async function getAllJobs(): Promise<SavedJob[]> {
  const all = await chrome.storage.local.get(null)
  const jobs: SavedJob[] = []
  for (const [key, value] of Object.entries(all)) {
    if (key.startsWith(JOB_PREFIX)) {
      jobs.push(value as SavedJob)
    }
  }
  // Sort by savedAt descending (newest first)
  jobs.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
  return jobs
}

export async function updateJob(id: string, updates: Partial<SavedJob>): Promise<SavedJob> {
  const existing = await getJob(id)
  if (!existing) throw new Error(`Job not found: ${id}`)
  const updated = { ...existing, ...updates }
  await chrome.storage.local.set({ [jobKey(id)]: updated })
  return updated
}

export async function deleteJob(id: string): Promise<void> {
  await chrome.storage.local.remove(jobKey(id))
}
