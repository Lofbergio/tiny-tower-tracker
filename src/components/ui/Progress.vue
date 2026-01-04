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
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
}

const variantIndicatorClasses = {
  default: 'bg-gradient-to-r from-primary via-primary/90 to-primary/80',
  success: 'bg-gradient-to-r from-green-500 via-emerald-500 to-emerald-600',
  info: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-indigo-600',
  warning: 'bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600',
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
