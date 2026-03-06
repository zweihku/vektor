import { ref } from 'vue'

/**
 * HTML5 drag-and-drop reorder within a list.
 * Returns reactive state + event handlers to bind on each draggable item.
 */
export function useDragReorder(onReorder: (from: number, to: number) => void) {
  const dragIndex = ref<number | null>(null)
  const overIndex = ref<number | null>(null)

  function onDragStart(index: number, e: DragEvent) {
    dragIndex.value = index
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', String(index))
    }
  }

  function onDragOver(index: number, e: DragEvent) {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    overIndex.value = index
  }

  function onDragLeave() {
    overIndex.value = null
  }

  function onDrop(index: number, e: DragEvent) {
    e.preventDefault()
    if (dragIndex.value !== null && dragIndex.value !== index) {
      onReorder(dragIndex.value, index)
    }
    dragIndex.value = null
    overIndex.value = null
  }

  function onDragEnd() {
    dragIndex.value = null
    overIndex.value = null
  }

  return {
    dragIndex,
    overIndex,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
  }
}
