<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useResumeStore } from '../../stores/resumeStore'

interface PendingSuggestion {
  id: string
  jobTitle: string
  company: string
  analysis: any
  tailoredSuggestions: any
  coverLetter: string | null
  resumeId: string
  pushedAt: string
}

const store = useResumeStore()
let pollTimer: ReturnType<typeof setInterval> | null = null

async function fetchAndSync() {
  try {
    const res = await fetch('http://localhost:5173/api/pending-suggestions')
    if (!res.ok) return
    const items: PendingSuggestion[] = await res.json()
    for (const s of items) {
      store.addSyncedJob({
        jobTitle: s.jobTitle,
        company: s.company,
        analysis: s.analysis,
        tailoredSuggestions: s.tailoredSuggestions,
        coverLetter: s.coverLetter,
        resumeId: s.resumeId,
      })
      // Clear from server after storing locally
      try {
        await fetch('http://localhost:5173/api/clear-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: s.id }),
        })
      } catch { /* silent */ }
    }
  } catch {
    // server not running, silent
  }
}

onMounted(() => {
  fetchAndSync()
  pollTimer = setInterval(fetchAndSync, 5000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <!-- Headless component: no visible DOM, background polling only -->
</template>
