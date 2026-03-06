<script setup lang="ts">
import { ref } from 'vue'
import { useResumeStore } from '../../stores/resumeStore'
import { useI18n } from '../../composables/useI18n'
import { useDragReorder } from '../../composables/useDragReorder'
const { t } = useI18n()

const store = useResumeStore()
const expandedIds = ref<Set<string>>(new Set())

const { dragIndex, overIndex, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd } =
  useDragReorder((from, to) => store.reorderEducation(from, to))

function toggle(id: string) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  } else {
    expandedIds.value.add(id)
  }
}

function isExpanded(id: string) {
  return expandedIds.value.has(id)
}

function onUpdate(id: string, field: string, event: Event) {
  store.updateEducation(id, { [field]: (event.target as HTMLInputElement).value })
}

function updateBullet(id: string, bullets: string[], index: number, event: Event) {
  const newBullets = [...bullets]
  newBullets[index] = (event.target as HTMLInputElement).value
  store.updateEducation(id, { bullets: newBullets })
}

function addBullet(id: string, bullets: string[]) {
  store.updateEducation(id, { bullets: [...bullets, ''] })
}

function removeBullet(id: string, bullets: string[], index: number) {
  const newBullets = bullets.filter((_, i) => i !== index)
  store.updateEducation(id, { bullets: newBullets.length > 0 ? newBullets : [''] })
}

function addAndExpand() {
  store.addEducation()
  const items = store.currentResume?.education
  if (items && items.length > 0) {
    expandedIds.value.add(items[items.length - 1]!.id)
  }
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="(edu, idx) in store.currentResume?.education ?? []"
      :key="edu.id"
      class="border border-gray-200 rounded-lg overflow-hidden transition-all"
      :class="{
        'opacity-50': dragIndex === idx,
        'border-blue-400 border-t-2': overIndex === idx && dragIndex !== idx,
      }"
      draggable="true"
      @dragstart="onDragStart(idx, $event)"
      @dragover="onDragOver(idx, $event)"
      @dragleave="onDragLeave"
      @drop="onDrop(idx, $event)"
      @dragend="onDragEnd"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer select-none"
        @click="toggle(edu.id)"
      >
        <div class="flex items-center gap-2 min-w-0">
          <svg class="w-4 h-4 text-gray-300 cursor-grab shrink-0" viewBox="0 0 24 24" fill="currentColor"
            @mousedown.stop
          >
            <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
            <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
            <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
          </svg>
          <svg
            class="w-4 h-4 text-gray-400 transition-transform shrink-0"
            :class="isExpanded(edu.id) ? 'rotate-90' : ''"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-sm font-medium text-gray-800 truncate">
            {{ edu.school || t('education.newItem') }}
          </span>
          <span v-if="edu.degree" class="text-xs text-gray-500 truncate">
            {{ edu.degree }} {{ edu.field }}
          </span>
        </div>
        <button
          type="button"
          class="text-gray-400 hover:text-red-500 transition-colors p-1 shrink-0"
          @click.stop="store.removeEducation(edu.id)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>

      <!-- Body -->
      <div v-show="isExpanded(edu.id)" class="px-4 py-4 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('education.school') }}</label>
            <input
              :value="edu.school"
              :placeholder="t('education.schoolPlaceholder')"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @input="onUpdate(edu.id, 'school', $event)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('education.degree') }}</label>
            <input
              :value="edu.degree"
              :placeholder="t('education.degreePlaceholder')"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @input="onUpdate(edu.id, 'degree', $event)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('education.field') }}</label>
            <input
              :value="edu.field"
              :placeholder="t('education.fieldPlaceholder')"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @input="onUpdate(edu.id, 'field', $event)"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('education.startDate') }}</label>
            <input
              type="month"
              :value="edu.startDate"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @input="onUpdate(edu.id, 'startDate', $event)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('education.endDate') }}</label>
            <input
              type="month"
              :value="edu.endDate"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @input="onUpdate(edu.id, 'endDate', $event)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('education.gpa') }}</label>
            <input
              :value="edu.gpa"
              :placeholder="t('education.gpaPlaceholder')"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @input="onUpdate(edu.id, 'gpa', $event)"
            />
          </div>
        </div>

        <!-- Bullets -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('education.bullets') }}</label>
          <div class="space-y-2">
            <div
              v-for="(bullet, bIdx) in edu.bullets"
              :key="bIdx"
              class="flex items-start gap-2"
            >
              <span class="text-gray-400 text-sm mt-2 shrink-0">{{ bIdx + 1 }}.</span>
              <input
                :value="bullet"
                :placeholder="t('education.bulletPlaceholder')"
                class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                @input="updateBullet(edu.id, edu.bullets, bIdx, $event)"
              />
              <button
                v-if="edu.bullets.length > 1"
                type="button"
                class="text-gray-400 hover:text-red-500 transition-colors p-1 mt-1"
                @click="removeBullet(edu.id, edu.bullets, bIdx)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          <button
            type="button"
            class="mt-2 text-sm text-blue-500 hover:text-blue-600"
            @click="addBullet(edu.id, edu.bullets)"
          >
            {{ t('education.addBullet') }}
          </button>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
      @click="addAndExpand"
    >
      {{ t('education.addItem') }}
    </button>
  </div>
</template>
