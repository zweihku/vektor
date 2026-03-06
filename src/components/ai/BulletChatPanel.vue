<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useGemini } from '../../composables/useGemini'
import { useI18n } from '../../composables/useI18n'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  visible: boolean
  bulletText: string
  context: string
  sectionLabel?: string
  section?: string
}>(), {
  sectionLabel: '工作经历',
  section: '',
})

const emit = defineEmits<{
  close: []
  apply: [text: string]
}>()

const { chatAboutBullet, isConfigured } = useGemini()

interface ChatMessage {
  role: 'user' | 'ai'
  content: string
}

const messages = ref<ChatMessage[]>([])
const userInput = ref('')
const loading = ref(false)
const error = ref('')
const chatListRef = ref<HTMLElement | null>(null)

const quickCommands = computed(() => {
  if (props.section === 'summary') {
    return [
      { label: t('ai.summaryHighlightTech'), prompt: t('ai.summaryHighlightTechPrompt') },
      { label: t('ai.summaryTargetManagement'), prompt: t('ai.summaryTargetManagementPrompt') },
      { label: t('ai.summaryMoreConcise'), prompt: t('ai.summaryMoreConcisePrompt') },
      { label: t('ai.summaryCareerGoal'), prompt: t('ai.summaryCareerGoalPrompt') },
    ]
  }
  return [
    { label: t('ai.quantifyData'), prompt: t('ai.quantifyDataPrompt') },
    { label: t('ai.highlightResults'), prompt: t('ai.highlightResultsPrompt') },
    { label: t('ai.moreConcise'), prompt: t('ai.moreConcisePrompt') },
    { label: t('ai.starMethod'), prompt: t('ai.starMethodPrompt') },
  ]
})

function scrollToBottom() {
  nextTick(() => {
    if (chatListRef.value) {
      chatListRef.value.scrollTop = chatListRef.value.scrollHeight
    }
  })
}

async function sendMessage(content: string) {
  if (!content.trim() || loading.value) return

  messages.value.push({ role: 'user', content })
  userInput.value = ''
  loading.value = true
  error.value = ''
  scrollToBottom()

  try {
    const history = messages.value.map((m) => ({
      role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
      parts: m.content,
    }))

    const reply = await chatAboutBullet(history, props.context, props.sectionLabel)
    messages.value.push({ role: 'ai', content: reply })
    scrollToBottom()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : t('ai.requestFailed')
  } finally {
    loading.value = false
  }
}

function handleSend() {
  sendMessage(userInput.value)
}

function handleQuickCommand(prompt: string) {
  sendMessage(prompt)
}

function handleApply(text: string) {
  emit('apply', text)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

// Get the last AI message for highlighting the apply button
function isLastAiMessage(index: number): boolean {
  for (let i = messages.value.length - 1; i >= 0; i--) {
    if (messages.value[i]!.role === 'ai') return i === index
  }
  return false
}

// Auto-send first message when panel opens with new bullet
watch(
  () => props.visible,
  (newVal) => {
    if (newVal && props.bulletText.trim()) {
      messages.value = []
      error.value = ''
      userInput.value = ''
      sendMessage(t('ai.optimizePrompt', { section: props.sectionLabel, text: props.bulletText }))
    }
  }
)
</script>

<template>
  <Transition name="slide">
    <div
      v-if="visible"
      class="flex flex-col h-full bg-white border-l border-gray-200"
    >
      <!-- Header -->
      <div class="px-4 py-3 border-b border-gray-200 shrink-0">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
            <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {{ t('ai.assistant') }}
          </h3>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-600 transition-colors p-1"
            @click="emit('close')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="bg-gray-50 rounded-lg px-3 py-2">
          <p class="text-xs text-gray-500 mb-0.5">{{ t('ai.currentEdit') }}</p>
          <p class="text-xs text-gray-700 line-clamp-2">{{ bulletText || t('ai.empty') }}</p>
        </div>
      </div>

      <!-- Chat messages -->
      <div ref="chatListRef" class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          class="flex"
          :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <!-- AI message -->
          <div
            v-if="msg.role === 'ai'"
            class="max-w-[85%] space-y-2"
          >
            <div class="bg-gray-100 rounded-lg rounded-tl-none px-3 py-2">
              <p class="text-sm text-gray-800 whitespace-pre-wrap">{{ msg.content }}</p>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors"
              :class="isLastAiMessage(idx)
                ? 'text-white bg-blue-600 hover:bg-blue-700'
                : 'text-blue-600 bg-blue-50 hover:bg-blue-100'"
              @click="handleApply(msg.content)"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ t('ai.adoptVersion') }}
            </button>
          </div>

          <!-- User message -->
          <div
            v-else
            class="max-w-[85%]"
          >
            <div class="bg-blue-500 text-white rounded-lg rounded-tr-none px-3 py-2">
              <p class="text-sm whitespace-pre-wrap">{{ msg.content }}</p>
            </div>
          </div>
        </div>

        <!-- Loading indicator -->
        <div v-if="loading" class="flex justify-start">
          <div class="bg-gray-100 rounded-lg rounded-tl-none px-3 py-2">
            <div class="flex items-center gap-1.5">
              <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms" />
              <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms" />
              <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms" />
            </div>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="text-xs text-red-500 text-center">
          {{ error }}
          <button class="text-red-600 hover:text-red-800 underline ml-1" @click="error = ''">{{ t('ai.close') }}</button>
        </div>
      </div>

      <!-- Quick commands -->
      <div class="px-4 py-2 border-t border-gray-100 shrink-0">
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="cmd in quickCommands"
            :key="cmd.label"
            type="button"
            :disabled="loading || !isConfigured()"
            class="px-2.5 py-1 text-xs text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleQuickCommand(cmd.prompt)"
          >
            {{ cmd.label }}
          </button>
        </div>
      </div>

      <!-- Input area -->
      <div class="px-4 py-3 border-t border-gray-200 shrink-0">
        <div class="flex items-end gap-2">
          <textarea
            v-model="userInput"
            :placeholder="t('ai.inputPlaceholder')"
            rows="1"
            class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :disabled="loading || !isConfigured()"
            @keydown="handleKeydown"
          />
          <button
            type="button"
            :disabled="loading || !userInput.trim() || !isConfigured()"
            class="shrink-0 p-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            @click="handleSend"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
