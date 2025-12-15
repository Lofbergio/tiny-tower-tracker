<template>
  <button :class="buttonClass">
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}>()

const baseClasses =
  'pressable ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50'

const variantClasses = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
}

const sizeClasses = {
  default: 'h-10 px-4 py-2 min-h-[44px]',
  sm: 'h-9 rounded-md px-3 min-h-[36px]',
  lg: 'h-11 rounded-md px-8 min-h-[48px]',
  icon: 'h-10 w-10 min-h-[44px] min-w-[44px]',
}

const buttonClass = computed(() => [
  baseClasses,
  variantClasses[props.variant ?? 'default'],
  sizeClasses[props.size ?? 'default'],
])
</script>
