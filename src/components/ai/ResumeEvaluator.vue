<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useResumeStore } from '../../stores/resumeStore'
import { useGemini } from '../../composables/useGemini'
import { useI18n } from '../../composables/useI18n'
import type { ResumeEvaluation } from '../../types/resume'

const { t } = useI18n()
const store = useResumeStore()
const { evaluateResume, isConfigured } = useGemini()

const loading = ref(false)
const error = ref('')
const evaluation = ref<ResumeEvaluation | null>(null)

// Load cached evaluation for current resume
function loadCached() {
  const id = store.currentResumeId
  if (id) {
    evaluation.value = store.getEvaluation(id)
  }
}
loadCached()

// Reload when switching resumes
watch(() => store.currentResumeId, () => {
  loadCached()
  error.value = ''
})

const circumference = 2 * Math.PI * 54

const scoreOffset = computed(() => {
  if (!evaluation.value) return circumference
  return circumference - (evaluation.value.overallScore / 100) * circumference
})

const scoreColor = computed(() => {
  if (!evaluation.value) return '#9ca3af'
  const s = evaluation.value.overallScore
  if (s >= 70) return '#059669'
  if (s >= 50) return '#d97706'
  return '#dc2626'
})

const scoreLabel = computed(() => {
  if (!evaluation.value) return ''
  const s = evaluation.value.overallScore
  if (s >= 80) return t('review.excellent')
  if (s >= 70) return t('review.good')
  if (s >= 50) return t('review.average')
  return t('review.needsImprovement')
})

const categoryLabels = computed<Record<string, string>>(() => ({
  content: t('review.content'),
  impact: t('review.impact'),
  completeness: t('review.completeness'),
  clarity: t('review.clarity'),
}))

function getCategoryColor(score: number): string {
  if (score >= 70) return '#059669'
  if (score >= 50) return '#d97706'
  return '#dc2626'
}

async function handleEvaluate() {
  if (!store.currentResume) return
  loading.value = true
  error.value = ''
  evaluation.value = null

  try {
    const result = await evaluateResume(store.currentResume)
    evaluation.value = result
    store.setEvaluation(store.currentResumeId, result)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : t('review.reviewFailed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto space-y-6">
    <div>
      <h2 class="text-xl font-bold text-gray-900 mb-1">{{ t('review.title') }}</h2>
      <p class="text-sm text-gray-500">{{ t('review.subtitle') }}</p>
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

    <!-- Evaluate Button -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-700">{{ t('review.currentResume') }}</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ store.currentResume?.name ?? t('review.noResume') }}</p>
        </div>
        <button
          @click="handleEvaluate"
          :disabled="loading || !isConfigured() || !store.currentResume"
          class="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          {{ loading ? t('review.reviewing') : (evaluation ? t('review.startReview') : t('review.startReview')) }}
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
          @click="handleEvaluate"
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
          <p class="text-sm font-medium text-gray-700">{{ t('review.aiReviewing') }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ t('review.pleaseWait') }}</p>
        </div>
      </div>
    </div>

    <!-- Evaluation Results -->
    <template v-if="evaluation && !loading">
      <!-- Overall Score -->
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
              <span class="text-3xl font-bold" :style="{ color: scoreColor }">{{ evaluation.overallScore }}</span>
              <span class="text-xs text-gray-400">/ 100</span>
            </div>
          </div>
          <!-- Score Summary -->
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-bold text-gray-900">{{ t('review.overallScore') }}</h3>
            <p class="text-sm mt-1" :style="{ color: scoreColor }">{{ scoreLabel }}</p>
            <div class="mt-3 grid grid-cols-2 gap-3">
              <div class="text-center p-2 bg-gray-50 rounded-lg">
                <div class="text-lg font-bold text-gray-800">{{ evaluation.strengths.length }}</div>
                <div class="text-xs text-gray-500">{{ t('review.strengthCount') }}</div>
              </div>
              <div class="text-center p-2 bg-gray-50 rounded-lg">
                <div class="text-lg font-bold text-gray-800">{{ evaluation.improvements.length }}</div>
                <div class="text-xs text-gray-500">{{ t('review.improvementCount') }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Scores -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h4 class="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {{ t('review.categoryScores') }}
        </h4>
        <div class="space-y-4">
          <div
            v-for="(score, key) in evaluation.categories"
            :key="key"
            class="flex items-center gap-3"
          >
            <span class="text-sm text-gray-600 w-28 shrink-0">{{ categoryLabels[key] || key }}</span>
            <div class="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-1000 ease-out"
                :style="{ width: `${score}%`, backgroundColor: getCategoryColor(score) }"
              />
            </div>
            <span
              class="text-sm font-semibold w-10 text-right"
              :style="{ color: getCategoryColor(score) }"
            >{{ score }}</span>
          </div>
        </div>
      </div>

      <!-- Strengths -->
      <div v-if="evaluation.strengths.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h4 class="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          {{ t('review.strengths') }}
        </h4>
        <ul class="space-y-2">
          <li v-for="(item, i) in evaluation.strengths" :key="i" class="flex items-start gap-2 text-sm">
            <svg class="w-4 h-4 mt-0.5 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span class="text-gray-700">{{ item }}</span>
          </li>
        </ul>
      </div>

      <!-- Improvements -->
      <div v-if="evaluation.improvements.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h4 class="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {{ t('review.improvements') }}
        </h4>
        <ul class="space-y-2">
          <li v-for="(item, i) in evaluation.improvements" :key="i" class="flex items-start gap-2 text-sm">
            <svg class="w-4 h-4 mt-0.5 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span class="text-gray-700">{{ item }}</span>
          </li>
        </ul>
      </div>

      <!-- Section Feedback -->
      <div v-if="evaluation.sectionFeedback.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h4 class="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          {{ t('review.sectionFeedback') }}
        </h4>
        <div class="space-y-3">
          <div
            v-for="(fb, i) in evaluation.sectionFeedback"
            :key="i"
            class="rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-800">{{ fb.section }}</span>
              <span
                class="text-xs font-semibold px-2 py-0.5 rounded"
                :style="{
                  color: getCategoryColor(fb.score),
                  backgroundColor: fb.score >= 70 ? '#ecfdf5' : fb.score >= 50 ? '#fffbeb' : '#fef2f2'
                }"
              >
                {{ fb.score }} {{ t('review.points') }}
              </span>
            </div>
            <p class="text-sm text-gray-600">{{ fb.feedback }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
