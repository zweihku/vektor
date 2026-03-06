<script setup lang="ts">
import { ref, computed } from 'vue'
import { useResumeStore } from '../../stores/resumeStore'
import { useI18n } from '../../composables/useI18n'
import type { SyncedJob } from '../../stores/resumeStore'

const store = useResumeStore()
const { t } = useI18n()

const selectedId = ref<string | null>(null)
const applying = ref(false)
const copiedCl = ref(false)
const appliedResult = ref<{ jobId: string; summary: boolean; skills: string[]; bullets: number; coverLetter: boolean; jdAnalysis: boolean } | null>(null)

const sortedJobs = computed(() =>
  [...store.syncedJobs].sort((a, b) => new Date(b.syncedAt).getTime() - new Date(a.syncedAt).getTime())
)

const selectedJob = computed<SyncedJob | null>(() =>
  selectedId.value ? store.syncedJobs.find((j) => j.id === selectedId.value) ?? null : null
)

function selectJob(id: string) {
  selectedId.value = id
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function scoreColor(score: number): string {
  if (score >= 75) return 'text-green-600 bg-green-50 border-green-200'
  if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

function scoreBg(score: number): string {
  if (score >= 75) return 'bg-green-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

async function applySuggestion(job: SyncedJob) {
  applying.value = true
  appliedResult.value = null
  const resume = store.currentResume
  if (!resume) { applying.value = false; return }

  let didSummary = false
  const addedSkills: string[] = []
  let bulletCount = 0
  let didCoverLetter = false
  let didJdAnalysis = false

  const ts = job.tailoredSuggestions
  if (ts) {
    if (ts.summary) {
      store.updateSummary(ts.summary)
      didSummary = true
    }
    if (ts.skillsToAdd?.length) {
      for (const skillName of ts.skillsToAdd) {
        const exists = resume.skills.some(
          (sk) => sk.name.toLowerCase() === skillName.toLowerCase()
        )
        if (!exists) {
          store.addSkill()
          const newSkill = resume.skills[resume.skills.length - 1]
          if (newSkill) {
            store.updateSkill(newSkill.id, { name: skillName })
            addedSkills.push(skillName)
          }
        }
      }
    }
    if (ts.bulletModifications?.length) {
      for (const mod of ts.bulletModifications) {
        if (mod.section === 'workExperience' && typeof mod.index === 'number') {
          const exp = resume.workExperience[mod.index]
          if (exp && typeof mod.bulletIndex === 'number' && exp.bullets[mod.bulletIndex] !== undefined) {
            const bullets = [...exp.bullets]
            bullets[mod.bulletIndex] = mod.suggested
            store.updateWorkExperience(exp.id, { bullets })
            bulletCount++
          }
        } else if (mod.section === 'projects' && typeof mod.index === 'number') {
          const proj = resume.projects[mod.index]
          if (proj && typeof mod.bulletIndex === 'number' && proj.bullets[mod.bulletIndex] !== undefined) {
            const bullets = [...proj.bullets]
            bullets[mod.bulletIndex] = mod.suggested
            store.updateProject(proj.id, { bullets })
            bulletCount++
          }
        } else if (mod.section === 'education' && typeof mod.index === 'number') {
          const edu = resume.education[mod.index]
          if (edu && typeof mod.bulletIndex === 'number' && edu.bullets[mod.bulletIndex] !== undefined) {
            const bullets = [...edu.bullets]
            bullets[mod.bulletIndex] = mod.suggested
            store.updateEducation(edu.id, { bullets })
            bulletCount++
          }
        }
      }
    }
  }

  if (job.coverLetter && job.analysis) {
    store.setCoverLetter(resume.id, {
      text: job.coverLetter,
      jdText: '',
      style: 'formal',
      language: 'en',
    })
    didCoverLetter = true
  }

  if (job.analysis) {
    store.setJDAnalysis(resume.id, {
      jdText: '',
      analysis: job.analysis,
      acceptedIndices: [],
    })
    didJdAnalysis = true
  }

  store.markSyncedJobApplied(job.id)
  applying.value = false
  appliedResult.value = {
    jobId: job.id,
    summary: didSummary,
    skills: addedSkills,
    bullets: bulletCount,
    coverLetter: didCoverLetter,
    jdAnalysis: didJdAnalysis,
  }
}

function goToEditor() {
  store.setView('editor')
}

function dismiss(job: SyncedJob) {
  if (selectedId.value === job.id) {
    selectedId.value = null
  }
  store.removeSyncedJob(job.id)
}

async function copyCoverLetter(text: string) {
  await navigator.clipboard.writeText(text)
  copiedCl.value = true
  setTimeout(() => { copiedCl.value = false }, 2000)
}
</script>

<template>
  <div class="flex h-full bg-white">
    <!-- Left: Job List -->
    <div class="w-80 border-r border-gray-200 flex flex-col shrink-0">
      <div class="px-4 py-4 border-b border-gray-200">
        <h2 class="text-lg font-bold text-gray-900">{{ t('jobTracker.title') }}</h2>
      </div>

      <div class="flex-1 overflow-y-auto">
        <!-- Empty state -->
        <div v-if="sortedJobs.length === 0" class="flex flex-col items-center justify-center h-full px-6 text-center">
          <svg class="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p class="text-sm font-medium text-gray-500 mb-1">{{ t('jobTracker.emptyTitle') }}</p>
          <p class="text-xs text-gray-400">{{ t('jobTracker.emptyDescription') }}</p>
        </div>

        <!-- Job items -->
        <div
          v-for="job in sortedJobs"
          :key="job.id"
          @click="selectJob(job.id)"
          :class="[
            'px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors',
            selectedId === job.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-gray-50'
          ]"
        >
          <div class="flex items-start gap-3">
            <!-- Score badge -->
            <div
              v-if="job.analysis?.matchScore != null"
              :class="['shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center text-sm font-bold', scoreColor(job.analysis.matchScore)]"
            >
              {{ job.analysis.matchScore }}
            </div>
            <div v-else class="shrink-0 w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-sm font-bold">
              —
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ job.jobTitle }}</p>
              <p class="text-xs text-gray-500 truncate">{{ job.company }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-gray-400">{{ formatTimeAgo(job.syncedAt) }}</span>
                <span
                  v-if="job.appliedToResume"
                  class="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded"
                >Applied</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right: Job Detail -->
    <div class="flex-1 overflow-y-auto">
      <!-- No selection state -->
      <div v-if="!selectedJob" class="flex flex-col items-center justify-center h-full text-gray-400">
        <svg class="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
        <p class="text-sm">Select a job to view details</p>
      </div>

      <!-- Detail view -->
      <div v-else class="p-6 max-w-3xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-xl font-bold text-gray-900">{{ selectedJob.jobTitle }}</h2>
            <p class="text-sm text-gray-500 mt-0.5">@ {{ selectedJob.company }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ t('jobTracker.syncedAgo') }} {{ formatTimeAgo(selectedJob.syncedAt) }}</p>
          </div>
          <!-- Score circle -->
          <div
            v-if="selectedJob.analysis?.matchScore != null"
            class="shrink-0 flex flex-col items-center"
          >
            <div class="relative w-16 h-16">
              <svg class="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#e5e7eb" stroke-width="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  :stroke="selectedJob.analysis.matchScore >= 75 ? '#22c55e' : selectedJob.analysis.matchScore >= 50 ? '#f59e0b' : '#ef4444'"
                  stroke-width="3"
                  :stroke-dasharray="`${selectedJob.analysis.matchScore}, 100`"
                  stroke-linecap="round"
                />
              </svg>
              <span class="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
                {{ selectedJob.analysis.matchScore }}
              </span>
            </div>
            <span class="text-xs text-gray-500 mt-1">{{ t('jobTracker.matchScore') }}</span>
          </div>
        </div>

        <!-- Analysis Section -->
        <details v-if="selectedJob.analysis" class="group border border-gray-200 rounded-lg" open>
          <summary class="px-4 py-3 cursor-pointer flex items-center gap-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 rounded-lg">
            <svg class="w-4 h-4 text-gray-400 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            {{ t('jobTracker.analysis') }}
          </summary>
          <div class="px-4 pb-4 space-y-4">
            <!-- Core Requirements -->
            <div v-if="selectedJob.analysis.coreRequirements?.length">
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{{ t('jobTracker.coreRequirements') }}</h4>
              <ul class="space-y-1">
                <li v-for="(req, i) in selectedJob.analysis.coreRequirements" :key="i" class="text-sm text-gray-700 flex items-start gap-2">
                  <span class="text-green-500 mt-0.5 shrink-0">&#10003;</span>
                  {{ typeof req === 'string' ? req : req.requirement || req.text || JSON.stringify(req) }}
                </li>
              </ul>
            </div>
            <!-- Missing Skills -->
            <div v-if="selectedJob.analysis.missingSkills?.length">
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{{ t('jobTracker.missingSkills') }}</h4>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="(skill, i) in selectedJob.analysis.missingSkills" :key="i" class="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full border border-red-200">
                  {{ typeof skill === 'string' ? skill : skill.skill || skill.name || JSON.stringify(skill) }}
                </span>
              </div>
            </div>
            <!-- ATS Keywords -->
            <div v-if="selectedJob.analysis.atsKeywords?.length">
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{{ t('jobTracker.atsKeywords') }}</h4>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="(kw, i) in selectedJob.analysis.atsKeywords" :key="i" class="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full border border-blue-200">
                  {{ typeof kw === 'string' ? kw : kw.keyword || kw.text || JSON.stringify(kw) }}
                </span>
              </div>
            </div>
            <!-- Nice to Have -->
            <div v-if="selectedJob.analysis.niceToHave?.length">
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{{ t('jobTracker.niceToHave') }}</h4>
              <ul class="space-y-1">
                <li v-for="(item, i) in selectedJob.analysis.niceToHave" :key="i" class="text-sm text-gray-600 flex items-start gap-2">
                  <span class="text-amber-400 mt-0.5 shrink-0">&#9733;</span>
                  {{ typeof item === 'string' ? item : item.requirement || item.text || JSON.stringify(item) }}
                </li>
              </ul>
            </div>
          </div>
        </details>

        <!-- Cover Letter Section -->
        <details v-if="selectedJob.coverLetter" class="group border border-gray-200 rounded-lg">
          <summary class="px-4 py-3 cursor-pointer flex items-center gap-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 rounded-lg">
            <svg class="w-4 h-4 text-gray-400 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            {{ t('jobTracker.coverLetter') }}
          </summary>
          <div class="px-4 pb-4">
            <div class="relative">
              <pre class="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-4 border border-gray-100">{{ selectedJob.coverLetter }}</pre>
              <button
                @click="copyCoverLetter(selectedJob.coverLetter!)"
                class="absolute top-2 right-2 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors"
                :class="copiedCl ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'"
              >
                {{ copiedCl ? t('jobTracker.copied') : t('jobTracker.copyCl') }}
              </button>
            </div>
          </div>
        </details>

        <!-- Resume Suggestions Section -->
        <details v-if="selectedJob.tailoredSuggestions" class="group border border-gray-200 rounded-lg">
          <summary class="px-4 py-3 cursor-pointer flex items-center gap-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 rounded-lg">
            <svg class="w-4 h-4 text-gray-400 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            {{ t('jobTracker.suggestions') }}
          </summary>
          <div class="px-4 pb-4 space-y-4">
            <!-- Overall Strategy -->
            <div v-if="selectedJob.tailoredSuggestions.overallStrategy">
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{{ t('jobTracker.overallStrategy') }}</h4>
              <p class="text-sm text-gray-700 bg-blue-50 rounded-lg p-3 border border-blue-100">
                {{ selectedJob.tailoredSuggestions.overallStrategy }}
              </p>
            </div>
            <!-- Skills to Add -->
            <div v-if="selectedJob.tailoredSuggestions.skillsToAdd?.length">
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{{ t('jobTracker.skillsToAdd') }}</h4>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="skill in selectedJob.tailoredSuggestions.skillsToAdd"
                  :key="skill"
                  class="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200 font-medium"
                >+ {{ skill }}</span>
              </div>
            </div>
            <!-- Bullet Modifications -->
            <div v-if="selectedJob.tailoredSuggestions.bulletModifications?.length">
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{{ t('jobTracker.bulletModifications') }}</h4>
              <div class="space-y-2">
                <div
                  v-for="(mod, i) in selectedJob.tailoredSuggestions.bulletModifications"
                  :key="i"
                  class="border border-gray-100 rounded-lg p-3 text-sm"
                >
                  <div class="text-xs text-gray-400 mb-1.5">
                    {{ mod.section }} [{{ mod.index }}] &middot; bullet {{ mod.bulletIndex }}
                  </div>
                  <div v-if="mod.original" class="text-gray-500 line-through mb-1">{{ mod.original }}</div>
                  <div class="text-gray-800">{{ mod.suggested }}</div>
                </div>
              </div>
            </div>
          </div>
        </details>

        <!-- Applied Success Banner -->
        <div
          v-if="appliedResult && appliedResult.jobId === selectedJob.id"
          class="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div class="flex items-center gap-2 mb-2">
            <svg class="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-sm font-semibold text-green-800">{{ t('jobTracker.appliedSuccess') }}</span>
          </div>
          <ul class="text-xs text-green-700 space-y-1 ml-7">
            <li v-if="appliedResult.summary">{{ t('jobTracker.changedSummary') }}</li>
            <li v-if="appliedResult.skills.length">{{ t('jobTracker.changedSkills', { count: String(appliedResult.skills.length), skills: appliedResult.skills.join(', ') }) }}</li>
            <li v-if="appliedResult.bullets > 0">{{ t('jobTracker.changedBullets', { count: String(appliedResult.bullets) }) }}</li>
            <li v-if="appliedResult.coverLetter">{{ t('jobTracker.changedCoverLetter') }}</li>
            <li v-if="appliedResult.jdAnalysis">{{ t('jobTracker.changedJdAnalysis') }}</li>
          </ul>
          <button
            @click="goToEditor"
            class="mt-3 ml-7 inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {{ t('jobTracker.viewResume') }}
          </button>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-2">
          <button
            v-if="!selectedJob.appliedToResume"
            @click="applySuggestion(selectedJob)"
            :disabled="applying"
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ applying ? t('jobTracker.applying') : t('jobTracker.applyToResume') }}
          </button>
          <button
            v-if="selectedJob.appliedToResume"
            @click="goToEditor"
            class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {{ t('jobTracker.viewResume') }}
          </button>
          <button
            @click="dismiss(selectedJob)"
            class="px-4 py-2 text-gray-600 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {{ t('jobTracker.dismiss') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
