<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useResumeStore } from '../../stores/resumeStore'
import { useI18n } from '../../composables/useI18n'
import { usePrint } from '../../composables/usePrint'
import { useGemini } from '../../composables/useGemini'
import type { TemplateType } from '../../types/resume'

const store = useResumeStore()
const { t } = useI18n()
const { printResume } = usePrint()
const { parseResumeFile, isConfigured, translateResumeContent } = useGemini()

const importing = ref(false)
const translating = ref(false)

const editingName = ref(false)
const nameInput = ref('')

const resumeName = computed(() => store.currentResume?.name ?? '')

function startEditName() {
  nameInput.value = resumeName.value
  editingName.value = true
}

function saveName() {
  if (store.currentResume && nameInput.value.trim()) {
    store.currentResume.name = nameInput.value.trim()
  }
  editingName.value = false
}

const templates = computed(() => [
  { value: 'modern' as TemplateType, label: t('header.modern') },
  { value: 'classic' as TemplateType, label: t('header.classic') },
  { value: 'minimal' as TemplateType, label: t('header.minimal') },
  { value: 'creative' as TemplateType, label: t('header.creative') },
])

const presetColors = [
  '#2563eb',
  '#7c3aed',
  '#059669',
  '#dc2626',
  '#ea580c',
  '#0891b2',
  '#4f46e5',
  '#be185d',
]

const fonts = [
  'Inter, system-ui, sans-serif',
  'Georgia, serif',
  'Menlo, monospace',
  '"Noto Sans SC", sans-serif',
]

const fontLabels: Record<string, string> = {
  'Inter, system-ui, sans-serif': 'Inter',
  'Georgia, serif': 'Georgia',
  'Menlo, monospace': 'Menlo',
  '"Noto Sans SC", sans-serif': 'Noto Sans SC',
}

const showColorPicker = ref(false)
const customColor = ref(store.currentResume?.theme.primaryColor ?? '#2563eb')

watch(() => store.currentResume?.theme.primaryColor, (val) => {
  if (val) customColor.value = val
})

function setColor(color: string) {
  store.setTheme({ primaryColor: color })
  showColorPicker.value = false
}

function handleCustomColor() {
  store.setTheme({ primaryColor: customColor.value })
}

async function handleLanguageChange(lang: 'zh' | 'zh-TW' | 'en') {
  const prev = store.language
  store.setLanguage(lang)

  // Auto-convert resume content between simplified and traditional Chinese
  if (lang === 'zh-TW' && prev === 'zh') {
    store.convertResumeContent('zh-TW')
  } else if (lang === 'zh' && prev === 'zh-TW') {
    store.convertResumeContent('zh')
  }

  // Use Gemini to translate when switching to/from English
  const involvesEnglish = prev === 'en' || lang === 'en'
  const isChinese = (prev === 'zh' && lang === 'zh-TW') || (prev === 'zh-TW' && lang === 'zh')
  if (involvesEnglish && !isChinese && store.currentResume && isConfigured()) {
    // Snapshot CJK names before translating to English
    if (lang === 'en') store.saveNameSnapshot()
    translating.value = true
    try {
      const translated = await translateResumeContent(store.currentResume, lang)
      store.applyTranslatedContent(translated)
      // Restore original CJK names when coming back from English
      if (prev === 'en') store.restoreNameSnapshot()
    } catch (e) {
      alert(`${t('header.translateFailed')}${e instanceof Error ? e.message : ''}`)
    } finally {
      translating.value = false
    }
  }
}

function handleExportJSON() {
  const json = store.exportToJSON()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${resumeName.value || 'resume'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,.pdf,.docx'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'json') {
      const text = await file.text()
      try {
        store.importFromJSON(text)
      } catch {
        alert(t('header.importFailJson'))
      }
      return
    }

    if (ext === 'pdf' || ext === 'docx') {
      if (!isConfigured()) {
        alert(t('header.configureApiKey'))
        return
      }

      const mimeType = ext === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

      importing.value = true
      try {
        const buffer = await file.arrayBuffer()
        const base64 = arrayBufferToBase64(buffer)
        const json = await parseResumeFile(base64, mimeType)
        store.importFromJSON(json)
      } catch (e) {
        alert(`${t('header.importFail')}${e instanceof Error ? e.message : t('header.parseError')}`)
      } finally {
        importing.value = false
      }
      return
    }

    alert(t('header.unsupportedFormat'))
  }
  input.click()
}
</script>

<template>
  <header class="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shrink-0">
    <!-- Resume Name -->
    <div class="flex items-center gap-2 min-w-0">
      <template v-if="editingName">
        <input
          v-model="nameInput"
          @keyup.enter="saveName"
          @blur="saveName"
          class="text-base font-semibold bg-gray-50 border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:border-blue-500"
          autofocus
        />
      </template>
      <template v-else>
        <h2
          @click="startEditName"
          class="text-base font-semibold text-gray-800 truncate cursor-pointer hover:text-blue-600 transition-colors"
          :title="t('header.clickToEditName')"
        >
          {{ resumeName }}
        </h2>
      </template>
    </div>

    <div class="flex-1" />

    <!-- Template Selector -->
    <div class="flex items-center gap-1.5">
      <label class="text-xs text-gray-500">{{ t('header.template') }}</label>
      <select
        :value="store.currentTemplate"
        @change="store.setTemplate(($event.target as HTMLSelectElement).value as TemplateType)"
        class="text-sm bg-gray-50 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
      >
        <option v-for="t in templates" :key="t.value" :value="t.value">{{ t.label }}</option>
      </select>
    </div>

    <!-- Language Selector -->
    <div class="flex items-center gap-1.5">
      <label class="text-xs text-gray-500">{{ t('header.language') }}</label>
      <select
        :value="store.language"
        @change="handleLanguageChange(($event.target as HTMLSelectElement).value as 'zh' | 'zh-TW' | 'en')"
        class="text-sm bg-gray-50 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
      >
        <option value="zh">简体中文</option>
        <option value="zh-TW">繁體中文</option>
        <option value="en">English</option>
      </select>
    </div>

    <!-- Color Picker -->
    <div class="relative flex items-center gap-1.5">
      <label class="text-xs text-gray-500">{{ t('header.themeColor') }}</label>
      <button
        @click="showColorPicker = !showColorPicker"
        class="w-6 h-6 rounded-full border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
        :style="{ backgroundColor: store.currentResume?.theme.primaryColor ?? '#2563eb' }"
      />
      <div
        v-if="showColorPicker"
        class="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50"
      >
        <div class="flex gap-1.5 mb-2">
          <button
            v-for="color in presetColors"
            :key="color"
            @click="setColor(color)"
            class="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform"
            :style="{ backgroundColor: color }"
          />
        </div>
        <div class="flex items-center gap-2">
          <input
            v-model="customColor"
            @change="handleCustomColor"
            type="color"
            class="w-8 h-6 cursor-pointer"
          />
          <span class="text-xs text-gray-500">{{ t('header.custom') }}</span>
        </div>
      </div>
    </div>

    <!-- Font Selector -->
    <div class="flex items-center gap-1.5">
      <label class="text-xs text-gray-500">{{ t('header.font') }}</label>
      <select
        :value="store.currentResume?.theme.fontFamily"
        @change="store.setTheme({ fontFamily: ($event.target as HTMLSelectElement).value })"
        class="text-sm bg-gray-50 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
      >
        <option v-for="f in fonts" :key="f" :value="f">{{ fontLabels[f] || f }}</option>
      </select>
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center gap-1.5">
      <button
        @click="printResume"
        class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        {{ t('header.exportPdf') }}
      </button>
      <button
        @click="handleExportJSON"
        class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        :title="t('header.exportJsonTitle')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {{ t('header.exportJson') }}
      </button>
      <button
        @click="handleImport"
        :disabled="importing"
        class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :title="t('header.importTitle')"
      >
        <svg v-if="importing" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {{ importing ? t('header.parsing') : t('header.import') }}
      </button>
    </div>

    <!-- Translating indicator -->
    <div v-if="translating" class="flex items-center gap-1.5 text-sm text-purple-600">
      <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {{ t('header.translating') }}
    </div>
  </header>
</template>
