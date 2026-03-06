<script setup lang="ts">
import { computed } from 'vue'
import { useResumeStore } from '../../stores/resumeStore'
import { useGemini } from '../../composables/useGemini'
import { useI18n } from '../../composables/useI18n'
const { t } = useI18n()

const store = useResumeStore()
const { isConfigured } = useGemini()

const emit = defineEmits<{
  openAiChat: [payload: { bulletText: string; context: string }]
}>()

const summary = computed(() => store.currentResume?.summary ?? '')

function onInput(event: Event) {
  const value = (event.target as HTMLTextAreaElement).value
  store.updateSummary(value)
}

function openAiSummary() {
  const resume = store.currentResume
  if (!resume) return
  const context = `${t('personalInfo.fullName')}：${resume.personalInfo.fullName}\n${t('personalInfo.jobTitle')}：${resume.personalInfo.jobTitle}`
  emit('openAiChat', {
    bulletText: resume.summary,
    context,
  })
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-1">
      <label class="block text-sm font-medium text-gray-700">{{ t('summary.label') }}</label>
      <button
        type="button"
        :disabled="!isConfigured() || !summary.trim()"
        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors disabled:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
        @click="openAiSummary"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
        {{ t('summary.aiOptimize') }}
      </button>
    </div>
    <textarea
      :value="summary"
      :placeholder="t('summary.placeholder')"
      rows="4"
      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
      @input="onInput"
    />
    <div class="mt-1 text-xs text-gray-400 text-right">
      {{ summary.length }} {{ t('summary.charCount') }}
    </div>
  </div>
</template>
