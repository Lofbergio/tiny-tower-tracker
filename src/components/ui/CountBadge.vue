<template>
  <span v-if="count > 0" :key="count" class="badge-pop" v-bind="attrs">
    {{ displayCount }}
  </span>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'

const attrs = useAttrs()

const props = withDefaults(
  defineProps<{
    count: number
    max?: number
  }>(),
  {
    max: 9,
  }
)

const displayCount = computed(() => {
  if (props.count > props.max) {
    return `${props.max}+`
  }
  return String(props.count)
})
</script>
