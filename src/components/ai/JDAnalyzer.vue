<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useResumeStore } from '../../stores/resumeStore'
import { useGemini } from '../../composables/useGemini'
import { useI18n } from '../../composables/useI18n'
import type { JDAnalysis } from '../../types/resume'

const { t } = useI18n()
const store = useResumeStore()
const { analyzeJD, isConfigured } = useGemini()

const jdText = ref('')
const loading = ref(false)
const error = ref('')
const analysis = ref<JDAnalysis | null>(null)
const acceptedIndices = ref<Set<number>>(new Set())

function loadCached() {
  const cached = store.getJDAnalysis(store.currentResumeId)
  if (cached) {
    jdText.value = cached.jdText
    analysis.value = cached.analysis
    acceptedIndices.value = new Set(cached.acceptedIndices)
  } else {
    jdText.value = ''
    analysis.value = null
    acceptedIndices.value = new Set()
  }
}

function saveToStore() {
  if (!analysis.value) return
  store.setJDAnalysis(store.currentResumeId, {
    jdText: jdText.value,
    analysis: analysis.value,
    acceptedIndices: [...acceptedIndices.value],
  })
}

loadCached()

watch(() => store.currentResumeId, () => {
  loadCached()
})

const canAnalyze = computed(() => jdText.value.trim().length > 0 && !loading.value)

const scoreColor = computed(() => {
  if (!analysis.value) return '#9ca3af'
  const s = analysis.value.matchScore
  if (s >= 70) return '#059669'
  if (s >= 50) return '#d97706'
  return '#dc2626'
})

const scoreLabel = computed(() => {
  if (!analysis.value) return ''
  const s = analysis.value.matchScore
  if (s >= 70) return t('jd.matchHigh')
  if (s >= 50) return t('jd.matchMedium')
  return t('jd.matchLow')
})

const circumference = 2 * Math.PI * 54

const scoreOffset = computed(() => {
  if (!analysis.value) return circumference
  return circumference - (analysis.value.matchScore / 100) * circumference
})

const resumeText = computed(() => {
  const r = store.currentResume
  if (!r) return ''
  return JSON.stringify(r).toLowerCase()
})

function isKeywordInResume(keyword: string): boolean {
  return resumeText.value.includes(keyword.toLowerCase())
}

const sectionLabels = computed<Record<string, string>>(() => ({
  workExperience: t('jd.sectionWorkExp'),
  education: t('jd.sectionEducation'),
  projects: t('jd.sectionProjects'),
  summary: t('jd.sectionSummary'),
}))

async function handleAnalyze() {
  if (!store.currentResume) return
  loading.value = true
  error.value = ''
  analysis.value = null
  acceptedIndices.value = new Set()

  try {
    analysis.value = await analyzeJD(jdText.value, store.currentResume)
    saveToStore()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : t('jd.analyzeFailed')
  } finally {
    loading.value = false
  }
}

function acceptSuggestion(index: number) {
  if (!analysis.value || !store.currentResume || acceptedIndices.value.has(index)) return
  const suggestion = analysis.value.suggestions[index]
  if (!suggestion) return

  const resume = store.currentResume

  if (suggestion.section === 'summary') {
    store.updateSummary(suggestion.improved)
  } else if (suggestion.section === 'workExperience') {
    const item = resume.workExperience[suggestion.index]
    if (item && suggestion.bulletIndex !== undefined && suggestion.bulletIndex !== null) {
      const newBullets = [...item.bullets]
      newBullets[suggestion.bulletIndex] = suggestion.improved
      store.updateWorkExperience(item.id, { bullets: newBullets })
    }
  } else if (suggestion.section === 'education') {
    const item = resume.education[suggestion.index]
    if (item && suggestion.bulletIndex !== undefined && suggestion.bulletIndex !== null) {
      const newBullets = [...item.bullets]
      newBullets[suggestion.bulletIndex] = suggestion.improved
      store.updateEducation(item.id, { bullets: newBullets })
    }
  } else if (suggestion.section === 'projects') {
    const item = resume.projects[suggestion.index]
    if (item && suggestion.bulletIndex !== undefined && suggestion.bulletIndex !== null) {
      const newBullets = [...item.bullets]
      newBullets[suggestion.bulletIndex] = suggestion.improved
      store.updateProject(item.id, { bullets: newBullets })
    }
  }

  acceptedIndices.value = new Set([...acceptedIndices.value, index])
  saveToStore()
}

defineExpose({ jdText })
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto space-y-6">
    <div>
      <h2 class="text-xl font-bold text-gray-900 mb-1">{{ t('jd.title') }}</h2>
      <p class="text-sm text-gray-500">{{ t('jd.subtitle') }}</p>
    </div>

    <!-- API Key Warning -->
    <div v-if="!isConfigured()" class="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          <h3 class="text-sm font-semibold text-amber-800">{{ t('jd.apiKeyNotConfigured') }}</h3>
          <p class="text-sm text-amber-700 mt-1">{{ t('jd.apiKeyHint') }}</p>
        </div>
      </div>
    </div>

    <!-- JD Input -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('jd.jdLabel') }}</label>
      <textarea
        v-model="jdText"
        :placeholder="t('jd.jdPlaceholder')"
        rows="8"
        class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
      />
      <div class="flex items-center justify-between mt-3">
        <span class="text-xs text-gray-400">{{ jdText.length }} {{ t('jd.chars') }}</span>
        <button
          @click="handleAnalyze"
          :disabled="!canAnalyze || !isConfigured()"
          class="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          {{ loading ? t('jd.analyzing') : t('jd.analyze') }}
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm text-red-700">{{ error }}</span>
        </div>
        <button
          @click="handleAnalyze"
          class="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          {{ t('jd.retry') }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <div class="text-center">
          <p class="text-sm font-medium text-gray-700">{{ t('jd.aiAnalyzing') }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ t('jd.pleaseWait') }}</p>
        </div>
      </div>
    </div>

    <!-- Analysis Results -->
    <template v-if="analysis && !loading">
      <!-- Score Card -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center gap-6">
          <!-- Circular Score -->
          <div class="relative w-32 h-32 shrink-0">
            <svg class="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" stroke-width="8" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                :stroke="scoreColor"
                stroke-width="8"
                stroke-linecap="round"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="scoreOffset"
                class="transition-all duration-1000 ease-out"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-3xl font-bold" :style="{ color: scoreColor }">{{ analysis.matchScore }}</span>
              <span class="text-xs text-gray-400">/ 100</span>
            </div>
          </div>
          <!-- Score Details -->
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-bold text-gray-900">{{ analysis.jobTitle }}</h3>
            <p class="text-sm mt-1" :style="{ color: scoreColor }">{{ scoreLabel }}</p>
            <div class="mt-3 grid grid-cols-3 gap-3">
              <div class="text-center p-2 bg-gray-50 rounded-lg">
                <div class="text-lg font-bold text-gray-800">{{ analysis.coreRequirements.length }}</div>
                <div class="text-xs text-gray-500">{{ t('jd.coreRequirements') }}</div>
              </div>
              <div class="text-center p-2 bg-gray-50 rounded-lg">
                <div class="text-lg font-bold text-gray-800">{{ analysis.atsKeywords.length }}</div>
                <div class="text-xs text-gray-500">{{ t('jd.atsKeywords') }}</div>
              </div>
              <div class="text-center p-2 bg-gray-50 rounded-lg">
                <div class="text-lg font-bold text-gray-800">{{ analysis.suggestions.length }}</div>
                <div class="text-xs text-gray-500">{{ t('jd.suggestions') }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Core Requirements -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h4 class="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ t('jd.coreRequirements') }}
        </h4>
        <ul class="space-y-2">
          <li v-for="(req, i) in analysis.coreRequirements" :key="i" class="flex items-start gap-2 text-sm">
            <svg class="w-4 h-4 mt-0.5 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span class="text-gray-700">{{ req }}</span>
          </li>
        </ul>
      </div>

      <!-- Nice to Have -->
      <div v-if="analysis.niceToHave.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h4 class="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          {{ t('jd.niceToHave') }}
        </h4>
        <ul class="space-y-2">
          <li v-for="(item, i) in analysis.niceToHave" :key="i" class="flex items-start gap-2 text-sm">
            <svg class="w-4 h-4 mt-0.5 shrink-0 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span class="text-gray-700">{{ item }}</span>
          </li>
        </ul>
      </div>

      <!-- ATS Keywords -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h4 class="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <svg class="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          {{ t('jd.atsKeywords') }}
        </h4>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(kw, i) in analysis.atsKeywords"
            :key="i"
            :class="[
              'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
              isKeywordInResume(kw)
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            ]"
          >
            <svg v-if="isKeywordInResume(kw)" class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {{ kw }}
          </span>
        </div>
      </div>

      <!-- Missing Skills -->
      <div v-if="analysis.missingSkills.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h4 class="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {{ t('jd.missingSkills') }}
        </h4>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(skill, i) in analysis.missingSkills"
            :key="i"
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
          >
            {{ skill }}
          </span>
        </div>
      </div>

      <!-- Optimization Suggestions -->
      <div v-if="analysis.suggestions.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h4 class="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {{ t('jd.suggestions') }}
        </h4>
        <div class="space-y-4">
          <div
            v-for="(suggestion, i) in analysis.suggestions"
            :key="i"
            :class="[
              'rounded-lg border p-4',
              acceptedIndices.has(i) ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
            ]"
          >
            <!-- Header -->
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {{ sectionLabels[suggestion.section] || suggestion.section }}
                </span>
                <span v-if="suggestion.bulletIndex !== undefined && suggestion.bulletIndex !== null" class="text-xs text-gray-400">
                  #{{ suggestion.index + 1 }} - {{ t('jd.itemIndex', { n: suggestion.bulletIndex + 1 }) }}
                </span>
              </div>
              <button
                v-if="!acceptedIndices.has(i)"
                @click="acceptSuggestion(i)"
                class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ t('jd.adopt') }}
              </button>
              <span v-else class="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ t('jd.adopted') }}
              </span>
            </div>
            <!-- Diff View -->
            <div class="space-y-2 text-sm">
              <div class="flex gap-2">
                <span class="shrink-0 w-8 text-center text-red-500 font-mono text-xs leading-6">-</span>
                <div class="flex-1 bg-red-50 border border-red-100 rounded px-3 py-1.5 text-red-700 line-through">
                  {{ suggestion.original }}
                </div>
              </div>
              <div class="flex gap-2">
                <span class="shrink-0 w-8 text-center text-green-500 font-mono text-xs leading-6">+</span>
                <div class="flex-1 bg-green-50 border border-green-100 rounded px-3 py-1.5 text-green-700">
                  {{ suggestion.improved }}
                </div>
              </div>
            </div>
            <!-- Reason -->
            <p class="text-xs text-gray-500 mt-2 pl-10">{{ suggestion.reason }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
