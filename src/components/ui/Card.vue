<template>
  <div :class="cardClass">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  interactive?: boolean
  hoverable?: boolean
  glow?: boolean | 'success' | 'warning'
}>()

const baseClasses =
  'overflow-hidden rounded-xl border bg-gradient-to-br from-card to-card/95 text-card-foreground shadow-sm dark:shadow-md transition-[box-shadow,border-color,background-color,transform] duration-200 ease-out'

const cardClass = computed(() => {
  const classes = [baseClasses]

  if (props.interactive) {
    // Fully clickable card - shimmer + press effect + glow
    classes.push(
      'card-game cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 dark:hover:shadow-primary/20 active:scale-[0.99]'
    )
  } else if (props.hoverable) {
    // Card with buttons inside - subtle glow effect, border highlight
    classes.push('hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 dark:hover:shadow-primary/10')
  } else {
    // Static card
    classes.push('')
  }

  if (props.glow === true) {
    classes.push('card-glow')
  } else if (props.glow === 'success') {
    classes.push('card-glow card-glow-success')
  } else if (props.glow === 'warning') {
    classes.push('card-glow card-glow-warning')
  }

  return classes
})
</script>
