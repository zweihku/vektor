<script setup lang="ts">
import { computed } from 'vue'
import { useResumeStore } from '../../stores/resumeStore'
import { useI18n } from '../../composables/useI18n'
import { useDragReorder } from '../../composables/useDragReorder'

const { t } = useI18n()
const store = useResumeStore()

const { dragIndex, overIndex, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd } =
  useDragReorder((from, to) => store.reorderLanguages(from, to))

const proficiencyOptions = computed(() => [
  { value: 'native' as const, label: t('languages.native') },
  { value: 'fluent' as const, label: t('languages.fluent') },
  { value: 'advanced' as const, label: t('languages.advanced') },
  { value: 'intermediate' as const, label: t('languages.intermediate') },
  { value: 'beginner' as const, label: t('languages.beginner') },
])

function onNameInput(id: string, event: Event) {
  store.updateLanguage(id, { name: (event.target as HTMLInputElement).value })
}

function onProficiencyChange(id: string, event: Event) {
  store.updateLanguage(id, {
    proficiency: (event.target as HTMLSelectElement).value as any,
  })
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="(lang, idx) in store.currentResume?.languages ?? []"
      :key="lang.id"
      class="flex items-center gap-3 transition-all"
      :class="{
        'opacity-50': dragIndex === idx,
        'border-l-2 border-blue-400 pl-1': overIndex === idx && dragIndex !== idx,
      }"
      draggable="true"
      @dragstart="onDragStart(idx, $event)"
      @dragover="onDragOver(idx, $event)"
      @dragleave="onDragLeave"
      @drop="onDrop(idx, $event)"
      @dragend="onDragEnd"
    >
      <svg class="w-4 h-4 text-gray-300 cursor-grab shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
        <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
        <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
      </svg>
      <input
        :value="lang.name"
        :placeholder="t('languages.namePlaceholder')"
        class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        @input="onNameInput(lang.id, $event)"
      />
      <select
        :value="lang.proficiency"
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        @change="onProficiencyChange(lang.id, $event)"
      >
        <option v-for="opt in proficiencyOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <button
        type="button"
        class="text-gray-400 hover:text-red-500 transition-colors p-1"
        @click="store.removeLanguage(lang.id)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    </div>

    <button
      type="button"
      class="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
      @click="store.addLanguage()"
    >
      {{ t('languages.addItem') }}
    </button>
  </div>
</template>
