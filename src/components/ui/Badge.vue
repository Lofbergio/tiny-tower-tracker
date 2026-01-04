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
  'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold md:px-2.5 md:text-xs transition-all duration-200'

const variantClasses = {
  default:
    'border-transparent bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  destructive: 'border-transparent bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-sm',
  outline: 'border-border text-foreground',
  success:
    'border-transparent bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-sm shadow-green-500/20',
}

const badgeClass = computed(() => [baseClasses, variantClasses[props.variant ?? 'default']])
</script>
