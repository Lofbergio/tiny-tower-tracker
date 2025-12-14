<template>
  <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div class="flex-1">
      <h1 class="mb-1 flex items-center gap-2 text-2xl font-bold md:text-3xl">
        <span v-if="icon" class="text-3xl md:text-4xl" aria-hidden="true">{{ icon }}</span>
        <slot name="title" />
      </h1>
      <p v-if="$slots.subtitle" class="text-sm text-muted-foreground md:text-base">
        <slot name="subtitle" />
      </p>
    </div>

    <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-start sm:gap-4">
      <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        <slot name="actions" />
      </div>
      <div v-if="$slots.aside" class="hidden md:block">
        <slot name="aside" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string
}>()
</script>
