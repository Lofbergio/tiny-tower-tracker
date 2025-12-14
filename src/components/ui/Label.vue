<template>
  <label
    :for="forProp"
    class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
  >
    <slot />
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  for?: string
}>()

const forProp = computed(() => props.for)
</script>
