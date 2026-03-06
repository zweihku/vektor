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
  useDragReorder((from, to) => store.reorderProjects(from, to))

const emit = defineEmits<{
  openAiChat: [payload: { expId: string; bulletIndex: number; bulletText: string; context: string; section: 'projects' }]
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
  store.updateProject(id, { [field]: (event.target as HTMLInputElement).value })
}

function updateBullet(id: string, bullets: string[], index: number, event: Event) {
  const newBullets = [...bullets]
  newBullets[index] = (event.target as HTMLInputElement).value
  store.updateProject(id, { bullets: newBullets })
}

function addBullet(id: string, bullets: string[]) {
  store.updateProject(id, { bullets: [...bullets, ''] })
}

function removeBullet(id: string, bullets: string[], index: number) {
  const newBullets = bullets.filter((_, i) => i !== index)
  store.updateProject(id, { bullets: newBullets.length > 0 ? newBullets : [''] })
}

function addAndExpand() {
  store.addProject()
  const items = store.currentResume?.projects
  if (items && items.length > 0) {
    expandedIds.value.add(items[0]!.id)
  }
}

function openChat(proj: { id: string; name: string; role: string; bullets: string[] }, bulletIndex: number) {
  const context = `${t('projects.contextProject')}：${proj.name}\n${t('projects.contextRole')}：${proj.role}\n${t('projects.contextFull')}：\n${proj.bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}`
  emit('openAiChat', {
    expId: proj.id,
    bulletIndex,
    bulletText: proj.bullets[bulletIndex] ?? '',
    context,
    section: 'projects',
  })
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="(proj, idx) in store.currentResume?.projects ?? []"
      :key="proj.id"
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
        @click="toggle(proj.id)"
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
            :class="isExpanded(proj.id) ? 'rotate-90' : ''"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-sm font-medium text-gray-800 truncate">
            {{ proj.name || t('projects.newItem') }}
          </span>
          <span v-if="proj.role" class="text-xs text-gray-500 truncate">
            {{ proj.role }}
          </span>
        </div>
        <button
          type="button"
          class="text-gray-400 hover:text-red-500 transition-colors p-1 shrink-0"
          @click.stop="store.removeProject(proj.id)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>

      <!-- Body -->
      <div v-show="isExpanded(proj.id)" class="px-4 py-4 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('projects.name') }}</label>
            <input
              :value="proj.name"
              :placeholder="t('projects.namePlaceholder')"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @input="onUpdate(proj.id, 'name', $event)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('projects.role') }}</label>
            <input
              :value="proj.role"
              :placeholder="t('projects.rolePlaceholder')"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @input="onUpdate(proj.id, 'role', $event)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('projects.link') }}</label>
            <input
              :value="proj.url"
              placeholder="https://..."
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @input="onUpdate(proj.id, 'url', $event)"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('projects.startDate') }}</label>
            <input
              type="month"
              :value="proj.startDate"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @input="onUpdate(proj.id, 'startDate', $event)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('projects.endDate') }}</label>
            <input
              type="month"
              :value="proj.endDate"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @input="onUpdate(proj.id, 'endDate', $event)"
            />
          </div>
        </div>

        <!-- Bullets -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('projects.bullets') }}</label>
          <div class="space-y-2">
            <div
              v-for="(bullet, bIdx) in proj.bullets"
              :key="bIdx"
              class="flex items-start gap-2"
            >
              <span class="text-gray-400 text-sm mt-2 shrink-0">{{ bIdx + 1 }}.</span>
              <input
                :value="bullet"
                :placeholder="t('projects.bulletPlaceholder')"
                class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                @input="updateBullet(proj.id, proj.bullets, bIdx, $event)"
              />
              <button
                type="button"
                :disabled="!isConfigured() || !bullet.trim()"
                class="text-purple-400 hover:text-purple-600 transition-colors p-1 mt-1 shrink-0 disabled:text-gray-300 disabled:cursor-not-allowed"
                :title="t('projects.aiOptimize')"
                @click="openChat(proj, bIdx)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </button>
              <button
                v-if="proj.bullets.length > 1"
                type="button"
                class="text-gray-400 hover:text-red-500 transition-colors p-1 mt-1"
                @click="removeBullet(proj.id, proj.bullets, bIdx)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          <button
            type="button"
            class="mt-2 text-sm text-blue-500 hover:text-blue-600"
            @click="addBullet(proj.id, proj.bullets)"
          >
            {{ t('projects.addBullet') }}
          </button>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
      @click="addAndExpand"
    >
      {{ t('projects.addItem') }}
    </button>
  </div>
</template>
