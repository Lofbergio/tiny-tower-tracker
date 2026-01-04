<template>
  <div :class="badgeClass" v-bind="$attrs">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success'
}>()

const baseClasses =
  'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold md:px-2.5 md:text-xs'

const variantClasses = {
  default: 'border-transparent bg-primary text-primary-foreground shadow-sm',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  destructive: 'border-transparent bg-destructive text-destructive-foreground shadow-sm',
  outline: 'border-border text-foreground',
  success: 'border-transparent bg-green-600 text-white shadow-sm dark:bg-green-700',
}

const badgeClass = computed(() => [baseClasses, variantClasses[props.variant ?? 'default']])
</script>
