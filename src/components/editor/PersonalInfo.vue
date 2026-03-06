<script setup lang="ts">
import { computed } from 'vue'
import { useResumeStore } from '../../stores/resumeStore'
import { useI18n } from '../../composables/useI18n'
const { t } = useI18n()

const store = useResumeStore()

const fields = computed(() => [
  { key: 'fullName' as const, label: t('personalInfo.fullName'), type: 'text' as const, placeholder: t('personalInfo.fullNamePlaceholder') },
  { key: 'jobTitle' as const, label: t('personalInfo.jobTitle'), type: 'text' as const, placeholder: t('personalInfo.jobTitlePlaceholder') },
  { key: 'email' as const, label: t('personalInfo.email'), type: 'email' as const, placeholder: t('personalInfo.emailPlaceholder') },
  { key: 'phone' as const, label: t('personalInfo.phone'), type: 'tel' as const, placeholder: t('personalInfo.phonePlaceholder') },
  { key: 'location' as const, label: t('personalInfo.location'), type: 'text' as const, placeholder: t('personalInfo.locationPlaceholder') },
  { key: 'linkedin' as const, label: t('personalInfo.linkedin'), type: 'url' as const, placeholder: t('personalInfo.linkedinPlaceholder') },
  { key: 'website' as const, label: t('personalInfo.website'), type: 'url' as const, placeholder: t('personalInfo.websitePlaceholder') },
])

function onInput(key: string, event: Event) {
  const value = (event.target as HTMLInputElement).value
  store.updatePersonalInfo({ [key]: value })
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div v-for="field in fields" :key="field.key" :class="field.key === 'fullName' ? 'sm:col-span-2' : ''">
      <label class="block text-sm font-medium text-gray-700 mb-1">{{ field.label }}</label>
      <input
        :type="field.type"
        :value="store.currentResume?.personalInfo[field.key] ?? ''"
        :placeholder="field.placeholder"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        @input="onInput(field.key, $event)"
      />
    </div>
  </div>
</template>
