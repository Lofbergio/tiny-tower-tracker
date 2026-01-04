<template>
  <span v-if="count > 0" :key="count" class="badge-pop badge-pulse" v-bind="attrs">
    {{ displayCount }}
  </span>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'

const attrs = useAttrs()

const { count, max = 9 } = defineProps<{
  count: number
  max?: number
}>()

const displayCount = computed(() => {
  if (count > max) {
    return `${max}+`
  }
  return String(count)
})
</script>
