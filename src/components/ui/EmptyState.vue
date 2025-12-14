<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div v-if="icon" class="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
      <component :is="icon" class="text-muted-foreground h-8 w-8" />
    </div>
    <div v-else-if="!hideIllustration" class="mb-4">
      <EmptyTowerIllustration />
    </div>
    <h3 class="mb-2 text-lg font-semibold">{{ title }}</h3>
    <p class="text-muted-foreground mb-4 max-w-sm text-sm">{{ description }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import EmptyTowerIllustration from '../EmptyTowerIllustration.vue'

withDefaults(
  defineProps<{
    title?: string
    description?: string
    icon?: any
    hideIllustration?: boolean
  }>(),
  {
    hideIllustration: false,
  }
)
</script>
