<template>
  <div :class="cardClass">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  interactive?: boolean
  glow?: boolean | 'success' | 'warning'
}>()

const baseClasses =
  'overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-[box-shadow,border-color,background-color,transform] duration-200 ease-out'

const cardClass = computed(() => {
  const classes = [baseClasses]

  if (props.interactive) {
    classes.push(
      'card-game cursor-pointer hover:border-primary/20 hover:shadow-md active:scale-[0.99]'
    )
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
