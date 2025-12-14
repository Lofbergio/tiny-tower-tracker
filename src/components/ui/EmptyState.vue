<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div v-if="icon" class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
      <component :is="icon" class="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 class="mb-2 text-lg font-semibold">{{ title }}</h3>
    <p class="mb-4 max-w-sm text-sm text-muted-foreground">{{ description }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  icon?: any
}>()
</script>
