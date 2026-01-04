<template>
  <div
    class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted/50 bg-muted/10 py-12 text-center transition-colors hover:border-muted"
  >
    <div
      v-if="icon"
      class="mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-muted motion-reduce:animate-none"
    >
      <component :is="icon" class="h-8 w-8 text-muted-foreground" />
    </div>
    <div v-else-if="!hideIllustration" class="mb-4">
      <EmptyTowerIllustration />
    </div>
    <h3 class="mb-2 text-lg font-semibold">{{ title }}</h3>
    <p class="mb-4 max-w-sm text-sm text-muted-foreground">{{ description }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import EmptyTowerIllustration from '../EmptyTowerIllustration.vue'

const { hideIllustration = false } = defineProps<{
  title?: string
  description?: string
  icon?: any
  hideIllustration?: boolean
}>()
</script>
