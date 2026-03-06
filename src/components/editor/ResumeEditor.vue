<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { useResumeStore } from '../../stores/resumeStore'
import { useI18n } from '../../composables/useI18n'
const { t } = useI18n()
import type { SectionType } from '../../types/resume'
import SectionManager from './SectionManager.vue'
import PersonalInfo from './PersonalInfo.vue'
import Summary from './Summary.vue'
import WorkExperience from './WorkExperience.vue'
import Education from './Education.vue'
import Skills from './Skills.vue'
import Projects from './Projects.vue'
import Certifications from './Certifications.vue'
import Languages from './Languages.vue'
import BulletChatPanel from '../ai/BulletChatPanel.vue'

const store = useResumeStore()
const showSectionManager = ref(false)

// AI Chat panel state
const aiPanelVisible = ref(false)
const activeBullet = ref<{
  expId: string
  bulletIndex: number
  bulletText: string
  context: string
  section: 'workExperience' | 'projects' | 'summary'
} | null>(null)

function handleOpenAiChat(payload: {
  expId: string
  bulletIndex: number
  bulletText: string
  context: string
  section?: 'workExperience' | 'projects'
}) {
  activeBullet.value = { ...payload, section: payload.section ?? 'workExperience' }
  aiPanelVisible.value = true
}

function handleOpenSummaryAiChat(payload: {
  bulletText: string
  context: string
}) {
  activeBullet.value = {
    expId: 'summary',
    bulletIndex: 0,
    bulletText: payload.bulletText,
    context: payload.context,
    section: 'summary',
  }
  aiPanelVisible.value = true
}

function handleCloseAiChat() {
  aiPanelVisible.value = false
}

function handleApplyBullet(text: string) {
  if (!activeBullet.value) return
  const { section, expId, bulletIndex } = activeBullet.value

  if (section === 'summary') {
    store.updateSummary(text)
  } else if (section === 'projects') {
    const proj = store.currentResume?.projects.find((p) => p.id === expId)
    if (!proj) return
    const newBullets = [...proj.bullets]
    newBullets[bulletIndex] = text
    store.updateProject(expId, { bullets: newBullets })
  } else {
    const exp = store.currentResume?.workExperience.find((e) => e.id === expId)
    if (!exp) return
    const newBullets = [...exp.bullets]
    newBullets[bulletIndex] = text
    store.updateWorkExperience(expId, { bullets: newBullets })
  }

  // Update the panel's bullet text reference
  activeBullet.value = { ...activeBullet.value, bulletText: text }
}

const aiSectionLabel = computed(() => {
  if (!activeBullet.value) return ''
  const s = activeBullet.value.section
  if (s === 'summary') return t('sections.summary')
  if (s === 'projects') return t('sections.projects')
  return t('sections.workExperience')
})

const sectionComponents: Record<SectionType, Component> = {
  personalInfo: PersonalInfo,
  summary: Summary,
  workExperience: WorkExperience,
  education: Education,
  skills: Skills,
  projects: Projects,
  certifications: Certifications,
  languages: Languages,
}

const sectionTitles = computed<Record<SectionType, string>>(() => ({
  personalInfo: t('sections.personalInfo'),
  summary: t('sections.summary'),
  workExperience: t('sections.workExperience'),
  education: t('sections.education'),
  skills: t('sections.skills'),
  projects: t('sections.projects'),
  certifications: t('sections.certifications'),
  languages: t('sections.languages'),
}))

const visibleSections = computed(() =>
  (store.currentResume?.sections ?? []).filter((s) => s.visible)
)
</script>

<template>
  <div class="h-full flex">
    <!-- Editor area -->
    <div
      class="h-full overflow-y-auto transition-all duration-300"
      :class="aiPanelVisible ? 'w-[60%]' : 'w-full'"
    >
      <div class="max-w-2xl mx-auto p-6 space-y-6">
        <!-- Section Manager Toggle -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200">
          <button
            type="button"
            class="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
            @click="showSectionManager = !showSectionManager"
          >
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {{ t('editor.manageSections') }}
            </div>
            <svg
              class="w-4 h-4 text-gray-400 transition-transform"
              :class="showSectionManager ? 'rotate-180' : ''"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-show="showSectionManager" class="px-4 pb-4">
            <SectionManager />
          </div>
        </div>

        <!-- Section Editors -->
        <div
          v-for="section in visibleSections"
          :key="section.type"
          class="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
        >
          <h3 class="text-base font-semibold text-gray-800 mb-4">
            {{ sectionTitles[section.type] }}
          </h3>
          <WorkExperience
            v-if="section.type === 'workExperience'"
            @open-ai-chat="handleOpenAiChat"
          />
          <Projects
            v-else-if="section.type === 'projects'"
            @open-ai-chat="handleOpenAiChat"
          />
          <Summary
            v-else-if="section.type === 'summary'"
            @open-ai-chat="handleOpenSummaryAiChat"
          />
          <component
            v-else
            :is="sectionComponents[section.type]"
          />
        </div>
      </div>
    </div>

    <!-- AI Chat side panel -->
    <div
      class="h-full shrink-0 overflow-hidden transition-all duration-300"
      :class="aiPanelVisible ? 'w-[40%]' : 'w-0'"
    >
      <BulletChatPanel
        :visible="aiPanelVisible"
        :bullet-text="activeBullet?.bulletText ?? ''"
        :context="activeBullet?.context ?? ''"
        :section-label="aiSectionLabel"
        :section="activeBullet?.section ?? ''"
        @close="handleCloseAiChat"
        @apply="handleApplyBullet"
      />
    </div>
  </div>
</template>
