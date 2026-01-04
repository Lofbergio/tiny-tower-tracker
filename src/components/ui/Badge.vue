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
  'pressable focus:ring-ring inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold transition-[transform,background-color,color,border-color,opacity] duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] md:px-2.5 md:text-xs'

const variantClasses = {
  default: 'border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/80',
  secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
  destructive:
    'border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/80',
  outline: 'border-border text-foreground',
  success:
    'border-transparent bg-green-600 text-white shadow-sm hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600',
}

const badgeClass = computed(() => [baseClasses, variantClasses[props.variant ?? 'default']])
</script>
