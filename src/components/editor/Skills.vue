<script setup lang="ts">
import { useResumeStore } from '../../stores/resumeStore'
import { useI18n } from '../../composables/useI18n'
import { useDragReorder } from '../../composables/useDragReorder'
const { t } = useI18n()

const store = useResumeStore()

const { dragIndex, overIndex, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd } =
  useDragReorder((from, to) => store.reorderSkills(from, to))

function onNameInput(id: string, event: Event) {
  store.updateSkill(id, { name: (event.target as HTMLInputElement).value })
}

function onLevelChange(id: string, level: number) {
  store.updateSkill(id, { level })
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="(skill, idx) in store.currentResume?.skills ?? []"
      :key="skill.id"
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
        :value="skill.name"
        :placeholder="t('skills.namePlaceholder')"
        class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        @input="onNameInput(skill.id, $event)"
      />
      <div class="flex items-center gap-1">
        <button
          v-for="n in 5"
          :key="n"
          type="button"
          class="w-5 h-5 rounded-full transition-colors"
          :class="n <= skill.level ? 'bg-blue-500' : 'bg-gray-200'"
          @click="onLevelChange(skill.id, n)"
        />
      </div>
      <button
        type="button"
        class="text-gray-400 hover:text-red-500 transition-colors p-1"
        @click="store.removeSkill(skill.id)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    </div>

    <button
      type="button"
      class="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
      @click="store.addSkill()"
    >
      {{ t('skills.addItem') }}
    </button>
  </div>
</template>
