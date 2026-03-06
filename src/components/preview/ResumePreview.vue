<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, type Component } from 'vue'
import { useResumeStore } from '../../stores/resumeStore'
import ModernTemplate from '../templates/ModernTemplate.vue'
import ClassicTemplate from '../templates/ClassicTemplate.vue'
import MinimalTemplate from '../templates/MinimalTemplate.vue'
import CreativeTemplate from '../templates/CreativeTemplate.vue'

const store = useResumeStore()

const templateMap: Record<string, Component> = {
  modern: ModernTemplate,
  classic: ClassicTemplate,
  minimal: MinimalTemplate,
  creative: CreativeTemplate,
}

const templateComponent = computed(() => {
  return templateMap[store.currentTemplate] || ModernTemplate
})

// Scaling logic
const containerRef = ref<HTMLElement | null>(null)
const scale = ref(1)

// A4 dimensions in mm -> we use px at 96dpi for screen
// 210mm = 793.7px, 297mm = 1122.5px
const A4_WIDTH_PX = 793.7
const A4_HEIGHT_PX = 1122.5

function updateScale() {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  // Add some padding around the preview
  const padding = 32
  const availW = rect.width - padding * 2
  const availH = rect.height - padding * 2
  const scaleX = availW / A4_WIDTH_PX
  const scaleY = availH / A4_HEIGHT_PX
  scale.value = Math.min(scaleX, scaleY, 1)
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  updateScale()
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateScale()
    })
    resizeObserver.observe(containerRef.value)
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<template>
  <div ref="containerRef" class="preview-container">
    <div v-if="store.currentResume" class="preview-scaler">
      <div
        id="resume-preview"
        class="preview-page"
        :style="{ transform: `scale(${scale})` }"
      >
        <component :is="templateComponent" :resume="store.currentResume" />
      </div>
    </div>
    <div v-else class="preview-empty">
      <span>No resume selected</span>
    </div>
  </div>
</template>

<style scoped>
.preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow: auto;
  padding: 16px;
  box-sizing: border-box;
}

.preview-scaler {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex-shrink: 0;
}

.preview-page {
  width: 210mm;
  min-height: 297mm;
  transform-origin: top center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  background: #ffffff;
  flex-shrink: 0;
}

.preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  color: #999;
  font-size: 14px;
}

@media print {
  .preview-container {
    padding: 0 !important;
    overflow: visible !important;
  }

  .preview-scaler {
    transform: none !important;
  }

  .preview-page {
    width: 100% !important;
    min-height: auto !important;
    box-shadow: none !important;
    transform: none !important;
  }
}
</style>
