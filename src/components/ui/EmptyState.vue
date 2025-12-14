<template>
  <div
    class="border-muted/50 bg-muted/10 hover:border-muted flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12 text-center transition-colors"
  >
    <div
      v-if="icon"
      class="bg-muted mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-full"
    >
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
