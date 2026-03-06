<script setup lang="ts">
import { useResumeStore } from './stores/resumeStore'
import AppSidebar from './components/layout/AppSidebar.vue'
import AppHeader from './components/layout/AppHeader.vue'
import ResumeEditor from './components/editor/ResumeEditor.vue'
import ResumePreview from './components/preview/ResumePreview.vue'
import JDAnalyzer from './components/ai/JDAnalyzer.vue'
import ResumeEvaluator from './components/ai/ResumeEvaluator.vue'
import CoverLetterGenerator from './components/ai/CoverLetterGenerator.vue'
import SuggestionsBanner from './components/ai/SuggestionsBanner.vue'
import JobTracker from './components/ai/JobTracker.vue'

const store = useResumeStore()
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-gray-50">
    <!-- Left Sidebar -->
    <AppSidebar />

    <!-- Main Content Area -->
    <div class="flex flex-1 flex-col min-w-0">
      <!-- Header -->
      <AppHeader />

      <!-- Content -->
      <div class="flex flex-1 min-h-0">
        <!-- Job Tracker: full-width layout -->
        <template v-if="store.currentView === 'job-tracker'">
          <JobTracker class="flex-1" />
        </template>
        <!-- Normal: Editor + Preview split -->
        <template v-else>
          <!-- Center Panel: Editor / JD Analyzer / Cover Letter -->
          <div class="flex-1 overflow-y-auto border-r border-gray-200 min-w-0">
            <ResumeEditor v-if="store.currentView === 'editor'" />
            <JDAnalyzer v-else-if="store.currentView === 'jd-analyzer'" />
            <ResumeEvaluator v-else-if="store.currentView === 'resume-review'" />
            <CoverLetterGenerator v-else-if="store.currentView === 'cover-letter'" />
          </div>

          <!-- Right Panel: Preview -->
          <div class="flex-1 overflow-y-auto bg-gray-100 min-w-0">
            <ResumePreview />
          </div>
        </template>
      </div>
    </div>

    <!-- Extension suggestions sync banner -->
    <SuggestionsBanner />
  </div>
</template>
