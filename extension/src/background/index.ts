import { analyzeJD, generateCoverLetter, tailorResume, pushSuggestions } from '../api'
import { saveJob, getJob, getAllJobs, updateJob, deleteJob } from '../storage'
import type { ExtractedJob, SavedJob, MessageType, MessageResponse } from '../types'

chrome.runtime.onMessage.addListener((message: MessageType, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse)
  return true // keep channel open for async response
})

async function handleMessage(msg: MessageType): Promise<MessageResponse> {
  try {
    switch (msg.type) {
      case 'QUICK_ANALYZE': {
        const result = await analyzeJD(msg.payload.jdText, undefined, msg.payload.language)
        return { success: true, data: result }
      }

      case 'SAVE_JOB': {
        const language = msg.payload.language
        const job = createSavedJob(msg.payload)
        await saveJob(job)
        // Start background processing (non-blocking)
        processJob(job.id, language)
        return { success: true, data: { id: job.id } }
      }

      case 'GET_SAVED_JOBS': {
        const jobs = await getAllJobs()
        return { success: true, data: jobs }
      }

      case 'GET_JOB': {
        const job = await getJob(msg.payload.id)
        if (!job) return { success: false, error: 'Job not found' }
        return { success: true, data: job }
      }

      case 'UPDATE_JOB_STATUS': {
        const updated = await updateJob(msg.payload.id, { status: msg.payload.status })
        return { success: true, data: updated }
      }

      case 'DELETE_JOB': {
        await deleteJob(msg.payload.id)
        return { success: true, data: null }
      }

      case 'ANALYZE_JOB': {
        const job = createSavedJob(msg.payload)
        await saveJob(job)
        processJob(job.id)
        return { success: true, data: { id: job.id } }
      }

      case 'SYNC_TO_BUILDER': {
        const job = await getJob(msg.payload.jobId)
        if (!job) return { success: false, error: 'Job not found' }
        await pushSuggestions({
          jobTitle: job.jobTitle,
          company: job.company,
          analysis: job.analysis,
          tailoredSuggestions: job.tailoredSuggestions,
          coverLetter: job.coverLetter,
        })
        return { success: true, data: null }
      }

      case 'OPEN_DETAIL': {
        const url = chrome.runtime.getURL(`detail.html?id=${msg.payload.jobId}`)
        await chrome.tabs.create({ url })
        return { success: true, data: null }
      }

      default:
        return { success: false, error: 'Unknown message type' }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

function createSavedJob(extracted: ExtractedJob): SavedJob {
  return {
    id: crypto.randomUUID(),
    jobUrl: extracted.jobUrl,
    applyUrl: extracted.applyUrl,
    jobTitle: extracted.jobTitle,
    company: extracted.company,
    location: extracted.location,
    jdText: extracted.jdText,
    jdHtml: extracted.jdHtml,
    postedDate: extracted.postedDate,
    savedAt: new Date().toISOString(),
    status: 'pending',
    processingState: 'idle',
    analysis: null,
    coverLetter: null,
    tailoredSuggestions: null,
    error: null,
  }
}

async function processJob(jobId: string, language?: string): Promise<void> {
  try {
    // Step 1: Analyze JD
    await updateJob(jobId, { processingState: 'analyzing', error: null })
    const job = await getJob(jobId)
    if (!job) return

    const analysis = await analyzeJD(job.jdText, undefined, language)
    await updateJob(jobId, { analysis, processingState: 'generating_cl' })

    // Step 2: Generate cover letter (always English) + tailor resume in parallel
    const [coverLetter, tailoredSuggestions] = await Promise.all([
      generateCoverLetter(job.jdText, 'formal', 'en').catch((err) => {
        console.error('[Vektor] Cover letter generation failed:', err)
        return null
      }),
      tailorResume(job.jdText, analysis, undefined, language).catch((err) => {
        console.error('[Vektor] Resume tailoring failed:', err)
        return null
      }),
    ])

    // Step 3: Save results
    await updateJob(jobId, {
      coverLetter,
      tailoredSuggestions,
      processingState: 'done',
      status: 'ready',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Processing failed'
    console.error('[Vektor] Processing error:', err)
    await updateJob(jobId, {
      processingState: 'error',
      error: message,
    }).catch(() => {})
  }
}
