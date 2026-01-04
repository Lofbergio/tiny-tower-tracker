<template>
  <div
    :class="[
      'overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-[box-shadow,border-color,background-color] duration-200 ease-out',
      interactive ? 'card-game cursor-pointer hover:border-primary/20 hover:shadow-md' : '',
    ]"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
const { interactive = false } = defineProps<{
  interactive?: boolean
}>()
</script>
