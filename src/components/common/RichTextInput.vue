<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
}>(), {
  placeholder: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorRef = ref<HTMLDivElement>()

function handleInput() {
  if (editorRef.value) {
    emit('update:modelValue', editorRef.value.innerText)
  }
}

onMounted(() => {
  if (editorRef.value && props.modelValue) {
    editorRef.value.innerText = props.modelValue
  }
})

watch(() => props.modelValue, (newVal) => {
  if (editorRef.value && editorRef.value.innerText !== newVal) {
    editorRef.value.innerText = newVal
  }
})
</script>

<template>
  <div
    ref="editorRef"
    contenteditable="true"
    :data-placeholder="placeholder"
    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px] empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
    @input="handleInput"
  />
</template>
