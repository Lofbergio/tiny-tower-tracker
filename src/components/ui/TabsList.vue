<template>
  <TabsList
    :orientation="orientation"
    :class="[
      'bg-muted text-muted-foreground inline-flex h-10 items-center justify-center rounded-md p-1',
      orientation === 'vertical' && 'h-auto flex-col',
    ]"
  >
    <slot />
  </TabsList>
</template>

<script setup lang="ts">
import { TabsList } from 'radix-vue'

defineProps<{
  orientation?: 'horizontal' | 'vertical'
}>()
</script>
