<script setup lang="ts">
import { computed, ref } from 'vue'
import { useResumeStore } from '../../stores/resumeStore'
import type { SectionType } from '../../types/resume'
import { useI18n } from '../../composables/useI18n'
const { t } = useI18n()

const store = useResumeStore()

const sectionLabels = computed<Record<SectionType, string>>(() => ({
  personalInfo: t('sections.personalInfo'),
  summary: t('sections.summary'),
  workExperience: t('sections.workExperience'),
  education: t('sections.education'),
  skills: t('sections.skills'),
  projects: t('sections.projects'),
  certifications: t('sections.certifications'),
  languages: t('sections.languages'),
}))

const sections = computed(() => store.currentResume?.sections ?? [])

const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

function toggleVisibility(index: number) {
  const newSections = sections.value.map((s, i) =>
    i === index ? { ...s, visible: !s.visible } : { ...s }
  )
  store.updateSections(newSections)
}

function onDragStart(index: number) {
  dragIndex.value = index
}

function onDragOver(e: DragEvent, index: number) {
  e.preventDefault()
  dragOverIndex.value = index
}

function onDragLeave() {
  dragOverIndex.value = null
}

function onDrop(index: number) {
  if (dragIndex.value === null || dragIndex.value === index) {
    dragIndex.value = null
    dragOverIndex.value = null
    return
  }
  const newSections = [...sections.value.map((s) => ({ ...s }))]
  const [moved] = newSections.splice(dragIndex.value, 1)
  newSections.splice(index, 0, moved!)
  store.updateSections(newSections)
  dragIndex.value = null
  dragOverIndex.value = null
}

function onDragEnd() {
  dragIndex.value = null
  dragOverIndex.value = null
}
</script>

<template>
  <div class="space-y-1">
    <div
      v-for="(section, index) in sections"
      :key="section.type"
      draggable="true"
      class="flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-grab active:cursor-grabbing"
      :class="[
        dragOverIndex === index ? 'border-t-2 border-blue-400' : 'border-t-2 border-transparent',
        dragIndex === index ? 'opacity-40' : '',
        'hover:bg-gray-50',
      ]"
      @dragstart="onDragStart(index)"
      @dragover="onDragOver($event, index)"
      @dragleave="onDragLeave"
      @drop="onDrop(index)"
      @dragend="onDragEnd"
    >
      <!-- Drag handle -->
      <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
      </svg>

      <!-- Section name -->
      <span class="flex-1 text-sm" :class="section.visible ? 'text-gray-800' : 'text-gray-400'">
        {{ sectionLabels[section.type] }}
      </span>

      <!-- Visibility toggle -->
      <button
        type="button"
        class="p-1 transition-colors"
        :class="section.visible ? 'text-blue-500 hover:text-blue-600' : 'text-gray-300 hover:text-gray-400'"
        @click="toggleVisibility(index)"
      >
        <svg v-if="section.visible" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
        </svg>
      </button>
    </div>
  </div>
</template>
