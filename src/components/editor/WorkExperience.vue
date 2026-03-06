<script setup lang="ts">
import { ref } from 'vue'
import { useResumeStore } from '../../stores/resumeStore'
import { useGemini } from '../../composables/useGemini'
import { useI18n } from '../../composables/useI18n'
import { useDragReorder } from '../../composables/useDragReorder'
const { t } = useI18n()

const store = useResumeStore()
const { isConfigured } = useGemini()
const expandedIds = ref<Set<string>>(new Set())

const { dragIndex, overIndex, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd } =
  useDragReorder((from, to) => store.reorderWorkExperience(from, to))

const emit = defineEmits<{
  openAiChat: [payload: { expId: string; bulletIndex: number; bulletText: string; context: string }]
}>()

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
  store.updateWorkExperience(id, { [field]: (event.target as HTMLInputElement).value })
}

function onCurrentChange(id: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  store.updateWorkExperience(id, { current: checked, endDate: checked ? '' : '' })
}

function updateBullet(id: string, bullets: string[], index: number, event: Event) {
  const newBullets = [...bullets]
  newBullets[index] = (event.target as HTMLInputElement).value
  store.updateWorkExperience(id, { bullets: newBullets })
}

function addBullet(id: string, bullets: string[]) {
  store.updateWorkExperience(id, { bullets: [...bullets, ''] })
}

function removeBullet(id: string, bullets: string[], index: number) {
  const newBullets = bullets.filter((_, i) => i !== index)
  store.updateWorkExperience(id, { bullets: newBullets.length > 0 ? newBullets : [''] })
}

function addAndExpand() {
  store.addWorkExperience()
  const items = store.currentResume?.workExperience
  if (items && items.length > 0) {
    expandedIds.value.add(items[0]!.id)
  }
}

function openChat(exp: { id: string; company: string; position: string; bullets: string[] }, bulletIndex: number) {
  const context = `${t('workExp.contextCompany')}：${exp.company}\n${t('workExp.contextPosition')}：${exp.position}\n${t('workExp.contextFull')}：\n${exp.bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}`
  emit('openAiChat', {
    expId: exp.id,
    bulletIndex,
    bulletText: exp.bullets[bulletIndex] ?? '',
    context,
  })
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="(exp, idx) in store.currentResume?.workExperience ?? []"
      :key="exp.id"
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
        @click="toggle(exp.id)"
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
            :class="isExpanded(exp.id) ? 'rotate-90' : ''"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-sm font-medium text-gray-800 truncate">
            {{ exp.position || exp.company || t('workExp.newItem') }}
          </span>
          <span v-if="exp.company && exp.position" class="text-xs text-gray-500 truncate">
            @ {{ exp.company }}
          </span>
        </div>
        <button
          type="button"
          class="text-gray-400 hover:text-red-500 transition-colors p-1 shrink-0"
          @click.stop="store.removeWorkExperience(exp.id)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>

      <!-- Body -->
      <div v-show="isExpanded(exp.id)" class="px-4 py-4 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('workExp.company') }}</label>
            <input
              :value="exp.company"
              :placeholder="t('workExp.companyPlaceholder')"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @input="onUpdate(exp.id, 'company', $event)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('workExp.position') }}</label>
            <input
              :value="exp.position"
              :placeholder="t('workExp.positionPlaceholder')"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @input="onUpdate(exp.id, 'position', $event)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('workExp.location') }}</label>
            <input
              :value="exp.location"
              :placeholder="t('workExp.locationPlaceholder')"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @input="onUpdate(exp.id, 'location', $event)"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('workExp.startDate') }}</label>
            <input
              type="month"
              :value="exp.startDate"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @input="onUpdate(exp.id, 'startDate', $event)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('workExp.endDate') }}</label>
            <input
              type="month"
              :value="exp.endDate"
              :disabled="exp.current"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              @input="onUpdate(exp.id, 'endDate', $event)"
            />
          </div>
          <div class="flex items-center gap-2 pb-2">
            <input
              type="checkbox"
              :checked="exp.current"
              class="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              @change="onCurrentChange(exp.id, $event)"
            />
            <label class="text-sm text-gray-700">{{ t('workExp.current') }}</label>
          </div>
        </div>

        <!-- Bullets -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('workExp.bullets') }}</label>
          <div class="space-y-2">
            <div
              v-for="(bullet, bIdx) in exp.bullets"
              :key="bIdx"
              class="flex items-start gap-2"
            >
              <span class="text-gray-400 text-sm mt-2 shrink-0">{{ bIdx + 1 }}.</span>
              <input
                :value="bullet"
                :placeholder="t('workExp.bulletPlaceholder')"
                class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                @input="updateBullet(exp.id, exp.bullets, bIdx, $event)"
              />
              <button
                type="button"
                :disabled="!isConfigured() || !bullet.trim()"
                class="text-purple-400 hover:text-purple-600 transition-colors p-1 mt-1 shrink-0 disabled:text-gray-300 disabled:cursor-not-allowed"
                :title="t('workExp.aiOptimize')"
                @click="openChat(exp, bIdx)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </button>
              <button
                v-if="exp.bullets.length > 1"
                type="button"
                class="text-gray-400 hover:text-red-500 transition-colors p-1 mt-1"
                @click="removeBullet(exp.id, exp.bullets, bIdx)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          <button
            type="button"
            class="mt-2 text-sm text-blue-500 hover:text-blue-600"
            @click="addBullet(exp.id, exp.bullets)"
          >
            {{ t('workExp.addBullet') }}
          </button>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
      @click="addAndExpand"
    >
      {{ t('workExp.addItem') }}
    </button>
  </div>
</template>
