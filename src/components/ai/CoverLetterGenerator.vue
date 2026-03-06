<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useResumeStore } from '../../stores/resumeStore'
import { useGemini } from '../../composables/useGemini'
import { useI18n } from '../../composables/useI18n'

const { t } = useI18n()
const store = useResumeStore()
const { generateCoverLetter, isConfigured } = useGemini()

const jdText = ref('')
const style = ref<'formal' | 'friendly' | 'concise'>('formal')
const language = ref<'zh' | 'en'>('zh')
const loading = ref(false)
const error = ref('')
const coverLetter = ref('')
const isEditing = ref(false)
const editText = ref('')
const copied = ref(false)

// Load cached cover letter for current resume
function loadCached() {
  const id = store.currentResumeId
  if (id) {
    const cached = store.getCoverLetter(id)
    if (cached) {
      coverLetter.value = cached.text
      jdText.value = cached.jdText
      style.value = cached.style
      language.value = cached.language
    } else {
      coverLetter.value = ''
      jdText.value = ''
      style.value = 'formal'
      language.value = 'zh'
    }
  }
}
loadCached()

// Reload when switching resumes
watch(() => store.currentResumeId, () => {
  loadCached()
  error.value = ''
  isEditing.value = false
})

function saveToStore() {
  const id = store.currentResumeId
  if (id && coverLetter.value) {
    store.setCoverLetter(id, {
      text: coverLetter.value,
      jdText: jdText.value,
      style: style.value,
      language: language.value,
    })
  }
}

const canGenerate = computed(() => jdText.value.trim().length > 0 && !loading.value)

const styles = computed(() => [
  { value: 'formal' as const, label: t('coverLetter.formal'), desc: t('coverLetter.formalDesc') },
  { value: 'friendly' as const, label: t('coverLetter.friendly'), desc: t('coverLetter.friendlyDesc') },
  { value: 'concise' as const, label: t('coverLetter.concise'), desc: t('coverLetter.conciseDesc') },
])

const languageOptions = computed(() => [
  { value: 'zh' as const, label: t('coverLetter.chinese') },
  { value: 'en' as const, label: t('coverLetter.english') },
])

async function handleGenerate() {
  if (!store.currentResume) return
  loading.value = true
  error.value = ''
  coverLetter.value = ''
  isEditing.value = false

  try {
    coverLetter.value = await generateCoverLetter(store.currentResume, jdText.value, style.value, language.value)
    saveToStore()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : t('coverLetter.generateFailed')
  } finally {
    loading.value = false
  }
}

function startEdit() {
  editText.value = coverLetter.value
  isEditing.value = true
}

function saveEdit() {
  coverLetter.value = editText.value
  isEditing.value = false
  saveToStore()
}

function cancelEdit() {
  isEditing.value = false
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(coverLetter.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Fallback
    const textarea = document.createElement('textarea')
    textarea.value = coverLetter.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

function exportAsPDF() {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const content = coverLetter.value.replace(/\n/g, '<br />')
  const name = store.currentResume?.personalInfo.fullName || ''

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cover Letter - ${name}</title>
  <style>
    body {
      font-family: 'Georgia', serif;
      max-width: 700px;
      margin: 60px auto;
      padding: 40px;
      color: #1a1a1a;
      line-height: 1.8;
      font-size: 15px;
    }
    @media print {
      body { margin: 40px; padding: 0; }
    }
  </style>
</head>
<body>${content}</body>
</html>`)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 300)
}
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto space-y-6">
    <div>
      <h2 class="text-xl font-bold text-gray-900 mb-1">{{ t('coverLetter.title') }}</h2>
      <p class="text-sm text-gray-500">{{ t('coverLetter.subtitle') }}</p>
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

    <!-- Input Section -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
      <!-- JD Input -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('coverLetter.targetJd') }}</label>
        <textarea
          v-model="jdText"
          :placeholder="t('coverLetter.jdPlaceholder')"
          rows="6"
          class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
        />
      </div>

      <!-- Style Selector -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('coverLetter.writingStyle') }}</label>
        <div class="flex gap-3">
          <label
            v-for="s in styles"
            :key="s.value"
            :class="[
              'flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border-2 cursor-pointer transition-all',
              style === s.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            ]"
          >
            <input
              type="radio"
              :value="s.value"
              v-model="style"
              class="sr-only"
            />
            <span :class="['text-sm font-medium', style === s.value ? 'text-blue-700' : 'text-gray-700']">
              {{ s.label }}
            </span>
            <span class="text-xs text-gray-400">{{ s.desc }}</span>
          </label>
        </div>
      </div>

      <!-- Language Selector -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('coverLetter.language') }}</label>
        <div class="flex gap-3">
          <label
            v-for="l in languageOptions"
            :key="l.value"
            :class="[
              'flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all',
              language === l.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            ]"
          >
            <input
              type="radio"
              :value="l.value"
              v-model="language"
              class="sr-only"
            />
            <span :class="['text-sm font-medium', language === l.value ? 'text-blue-700' : 'text-gray-700']">
              {{ l.label }}
            </span>
          </label>
        </div>
      </div>

      <!-- Generate Button -->
      <div class="flex justify-end">
        <button
          @click="handleGenerate"
          :disabled="!canGenerate || !isConfigured()"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          {{ loading ? t('coverLetter.generating') : t('coverLetter.generate') }}
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
          @click="handleGenerate"
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
          <p class="text-sm font-medium text-gray-700">{{ t('coverLetter.aiWriting') }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ t('coverLetter.aiWritingHint') }}</p>
        </div>
      </div>
    </div>

    <!-- Result Section -->
    <div v-if="coverLetter && !loading" class="space-y-4">
      <!-- Letter Display -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <!-- Toolbar -->
        <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
          <span class="text-sm font-medium text-gray-700">{{ t('coverLetter.letterTitle') }}</span>
          <div class="flex items-center gap-2">
            <button
              v-if="!isEditing"
              @click="startEdit"
              class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {{ t('coverLetter.edit') }}
            </button>
            <button
              @click="copyToClipboard"
              class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg v-if="!copied" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <svg v-else class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ copied ? t('coverLetter.copied') : t('coverLetter.copy') }}
            </button>
            <button
              @click="exportAsPDF"
              class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {{ t('coverLetter.exportPdf') }}
            </button>
          </div>
        </div>

        <!-- Letter Content -->
        <div v-if="!isEditing" class="p-8">
          <div class="prose prose-sm max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap">{{ coverLetter }}</div>
        </div>

        <!-- Edit Mode -->
        <div v-else class="p-5">
          <textarea
            v-model="editText"
            rows="16"
            class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y leading-relaxed"
          />
          <div class="flex justify-end gap-2 mt-3">
            <button
              @click="cancelEdit"
              class="px-4 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {{ t('coverLetter.cancel') }}
            </button>
            <button
              @click="saveEdit"
              class="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {{ t('coverLetter.save') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Regenerate -->
      <div class="flex justify-center">
        <button
          @click="handleGenerate"
          :disabled="loading"
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ t('coverLetter.regenerate') }}
        </button>
      </div>
    </div>
  </div>
</template>
