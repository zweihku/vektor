<script setup lang="ts" generic="T extends Record<string, any>">
import { ref } from 'vue'

const props = defineProps<{
  items: T[]
  keyField: string
}>()

const emit = defineEmits<{
  reorder: [items: T[]]
}>()

const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

function onDragStart(index: number) {
  dragIndex.value = index
}

function onDragOver(e: DragEvent, index: number) {
  e.preventDefault()
  dragOverIndex.value = index
}

function onDragLeave() {
  dragOverIndex.value = null
}

function onDrop(index: number) {
  if (dragIndex.value === null || dragIndex.value === index) {
    dragIndex.value = null
    dragOverIndex.value = null
    return
  }
  const newItems = [...props.items]
  const [moved] = newItems.splice(dragIndex.value, 1)
  newItems.splice(index, 0, moved!)
  emit('reorder', newItems)
  dragIndex.value = null
  dragOverIndex.value = null
}

function onDragEnd() {
  dragIndex.value = null
  dragOverIndex.value = null
}
</script>

<template>
  <div>
    <div
      v-for="(item, index) in items"
      :key="(item as any)[keyField]"
      draggable="true"
      :class="[
        'transition-all duration-150',
        dragOverIndex === index ? 'border-t-2 border-blue-400' : '',
        dragIndex === index ? 'opacity-40' : '',
      ]"
      @dragstart="onDragStart(index)"
      @dragover="onDragOver($event, index)"
      @dragleave="onDragLeave"
      @drop="onDrop(index)"
      @dragend="onDragEnd"
    >
      <slot :item="item" :index="index" />
    </div>
  </div>
</template>
