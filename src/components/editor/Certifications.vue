<script setup lang="ts">
import { useResumeStore } from '../../stores/resumeStore'
import { useI18n } from '../../composables/useI18n'
import { useDragReorder } from '../../composables/useDragReorder'

const { t } = useI18n()
const store = useResumeStore()

const { dragIndex, overIndex, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd } =
  useDragReorder((from, to) => store.reorderCertifications(from, to))

function onUpdate(id: string, field: string, event: Event) {
  store.updateCertification(id, { [field]: (event.target as HTMLInputElement).value })
}
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="(cert, idx) in store.currentResume?.certifications ?? []"
      :key="cert.id"
      class="border border-gray-200 rounded-lg p-4 space-y-3 transition-all"
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
      <div class="flex items-start justify-between">
        <div class="flex items-start gap-2 flex-1">
          <svg class="w-4 h-4 text-gray-300 cursor-grab shrink-0 mt-2" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
            <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
            <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
          </svg>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('certs.name') }}</label>
              <input
                :value="cert.name"
                placeholder="AWS Solutions Architect"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                @input="onUpdate(cert.id, 'name', $event)"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('certs.issuer') }}</label>
              <input
                :value="cert.issuer"
                placeholder="Amazon"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                @input="onUpdate(cert.id, 'issuer', $event)"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('certs.date') }}</label>
              <input
                type="month"
                :value="cert.date"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                @input="onUpdate(cert.id, 'date', $event)"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('certs.link') }}</label>
              <input
                :value="cert.url"
                placeholder="https://..."
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                @input="onUpdate(cert.id, 'url', $event)"
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          class="ml-3 text-gray-400 hover:text-red-500 transition-colors p-1 shrink-0"
          @click="store.removeCertification(cert.id)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>

    <button
      type="button"
      class="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
      @click="store.addCertification()"
    >
      {{ t('certs.addItem') }}
    </button>
  </div>
</template>
