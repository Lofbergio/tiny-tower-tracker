<template>
  <ProgressRoot :model-value="modelValue" :max="max" :class="rootClass">
    <ProgressIndicator
      :class="indicatorClass"
      :style="{ transform: `translateX(-${100 - (modelValue / max) * 100}%)` }"
    />
  </ProgressRoot>
</template>

<script setup lang="ts">
import { ProgressIndicator, ProgressRoot } from 'radix-vue'
import { computed } from 'vue'

const props = defineProps<{
  modelValue: number
  max?: number
  variant?: 'default' | 'success' | 'info' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}>()

const max = props.max ?? 100

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3.5',
}

const variantIndicatorClasses = {
  default: 'bg-primary',
  success: 'bg-green-500 dark:bg-green-600',
  info: 'bg-blue-500 dark:bg-blue-600',
  warning: 'bg-yellow-500 dark:bg-yellow-600',
}

const rootClass = computed(() => [
  'xp-bar relative w-full overflow-hidden rounded-full',
  sizeClasses[props.size ?? 'md'],
])

const indicatorClass = computed(() => [
  'xp-bar-fill h-full w-full flex-1 transition-all duration-500 ease-out',
  variantIndicatorClasses[props.variant ?? 'default'],
  props.animated ? 'xp-bar-animated' : '',
])
</script>
