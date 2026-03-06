<script setup lang="ts">
import { ref } from 'vue'
import { useGemini } from '../../composables/useGemini'

const props = defineProps<{
  original: string
  context: string
}>()

const emit = defineEmits<{
  accept: [value: string]
}>()

const { optimizeBulletPoint, isConfigured } = useGemini()

const loading = ref(false)
const error = ref('')
const optimized = ref('')
const showResult = ref(false)

async function handleOptimize() {
  if (!props.original.trim()) return
  loading.value = true
  error.value = ''
  optimized.value = ''
  showResult.value = false

  try {
    optimized.value = await optimizeBulletPoint(props.original, props.context)
    showResult.value = true
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '优化失败'
  } finally {
    loading.value = false
  }
}

function handleAccept() {
  emit('accept', optimized.value)
  showResult.value = false
  optimized.value = ''
}

function handleReject() {
  showResult.value = false
  optimized.value = ''
}
</script>

<template>
  <div class="inline-flex flex-col">
    <!-- Trigger Button -->
    <button
      v-if="!showResult"
      @click="handleOptimize"
      :disabled="loading || !isConfigured() || !original.trim()"
      class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed"
      title="AI 优化"
    >
      <svg v-if="loading" class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
      {{ loading ? '优化中...' : 'AI 优化' }}
    </button>

    <!-- Error -->
    <div v-if="error" class="text-xs text-red-500 mt-1">
      {{ error }}
      <button @click="handleOptimize" class="text-red-600 hover:text-red-800 underline ml-1">重试</button>
    </div>

    <!-- Result -->
    <div v-if="showResult" class="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
      <p class="text-xs font-medium text-blue-700 mb-1">AI 建议</p>
      <p class="text-sm text-gray-800 mb-3">{{ optimized }}</p>
      <div class="flex gap-2">
        <button
          @click="handleAccept"
          class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          采纳
        </button>
        <button
          @click="handleReject"
          class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          忽略
        </button>
      </div>
    </div>
  </div>
</template>
