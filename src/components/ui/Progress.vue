<template>
  <ProgressRoot
    :model-value="modelValue"
    :max="max"
    :class="['relative h-2 w-full overflow-hidden rounded-full bg-muted', $attrs.class]"
  >
    <ProgressIndicator
      class="h-full w-full flex-1 bg-primary transition-all duration-300 ease-in-out"
      :style="{ transform: `translateX(-${100 - (modelValue / max) * 100}%)` }"
    />
  </ProgressRoot>
</template>

<script setup lang="ts">
import { ProgressIndicator, ProgressRoot } from 'radix-vue'

interface Props {
  modelValue: number
  max?: number
}

withDefaults(defineProps<Props>(), {
  max: 100,
})

defineOptions({
  inheritAttrs: false,
})
</script>
