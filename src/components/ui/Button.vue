<template>
  <button :class="buttonClass">
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}>()

const baseClasses =
  'pressable tap-ripple ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50'

const variantClasses = {
  default: 'btn-glow bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
  outline:
    'border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
  success:
    'btn-glow-success bg-green-600 text-white hover:bg-green-700 shadow-sm dark:bg-green-700 dark:hover:bg-green-600',
}

const sizeClasses = {
  default: 'h-11 px-5 py-2.5 min-h-[44px]',
  sm: 'h-9 rounded-md px-3.5 min-h-[36px] text-xs',
  lg: 'h-12 rounded-lg px-8 min-h-[48px] text-base',
  icon: 'h-11 w-11 min-h-[44px] min-w-[44px] rounded-lg',
}

const buttonClass = computed(() => [
  baseClasses,
  variantClasses[props.variant ?? 'default'],
  sizeClasses[props.size ?? 'default'],
])
</script>
