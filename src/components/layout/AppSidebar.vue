<script setup lang="ts">
import { ref, computed } from 'vue'
import { useResumeStore } from '../../stores/resumeStore'
import { useI18n } from '../../composables/useI18n'

const store = useResumeStore()
const { t } = useI18n()
const newResumeName = ref('')
const showNewInput = ref(false)

function handleCreateResume() {
  if (showNewInput.value && newResumeName.value.trim()) {
    store.createResume(newResumeName.value.trim())
    newResumeName.value = ''
    showNewInput.value = false
  } else {
    showNewInput.value = true
  }
}

function handleCancelCreate() {
  showNewInput.value = false
  newResumeName.value = ''
}

function handleDeleteResume(id: string) {
  if (store.resumes.length <= 1) return
  store.deleteResume(id)
}

const navItems = computed(() => [
  { view: 'editor' as const, label: t('sidebar.resumeEdit'), icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { view: 'jd-analyzer' as const, label: t('sidebar.jdAnalysis'), icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { view: 'resume-review' as const, label: t('sidebar.resumeReview'), icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { view: 'cover-letter' as const, label: t('sidebar.coverLetter'), icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { view: 'job-tracker' as const, label: t('sidebar.jobTracker'), icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
])

const unreadJobCount = computed(() =>
  store.syncedJobs.filter((j) => !j.appliedToResume).length
)
</script>

<template>
  <aside class="w-60 bg-gray-900 text-gray-100 flex flex-col h-screen shrink-0">
    <!-- Logo -->
    <div class="px-4 py-4 border-b border-gray-700">
      <h1 class="text-lg font-bold tracking-tight">Vektor</h1>
    </div>

    <!-- Navigation -->
    <nav class="px-2 py-3 border-b border-gray-700">
      <button
        v-for="item in navItems"
        :key="item.view"
        @click="store.setView(item.view)"
        :class="[
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          store.currentView === item.view
            ? 'bg-blue-600 text-white'
            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        ]"
      >
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
        </svg>
        {{ item.label }}
        <span
          v-if="item.view === 'job-tracker' && unreadJobCount > 0"
          class="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
        >{{ unreadJobCount }}</span>
      </button>
    </nav>

    <!-- Resume List -->
    <div class="flex-1 overflow-y-auto px-2 py-3">
      <div class="flex items-center justify-between px-2 mb-2">
        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">{{ t('sidebar.myResumes') }}</span>
        <button
          @click="handleCreateResume"
          class="text-gray-400 hover:text-white transition-colors"
          :title="t('sidebar.newResume')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <!-- New Resume Input -->
      <div v-if="showNewInput" class="px-2 mb-2">
        <input
          v-model="newResumeName"
          @keyup.enter="handleCreateResume"
          @keyup.escape="handleCancelCreate"
          :placeholder="t('sidebar.resumeNamePlaceholder')"
          class="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          autofocus
        />
      </div>

      <!-- Resume Items -->
      <div
        v-for="resume in store.resumes"
        :key="resume.id"
        @click="store.selectResume(resume.id)"
        :class="[
          'group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors mb-0.5',
          store.currentResumeId === resume.id
            ? 'bg-gray-700 text-white'
            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
        ]"
      >
        <div class="truncate flex-1">
          <div class="truncate font-medium">{{ resume.name }}</div>
          <div class="text-xs text-gray-500 mt-0.5">
            {{ new Date(resume.updatedAt).toLocaleDateString(store.language === 'en' ? 'en-US' : 'zh-TW') }}
          </div>
        </div>
        <button
          v-if="store.resumes.length > 1"
          @click.stop="handleDeleteResume(resume.id)"
          class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all ml-2 shrink-0"
          :title="t('sidebar.delete')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>
