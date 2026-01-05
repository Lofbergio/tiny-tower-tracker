<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <!-- Pixel-art style people/residents -->
    <!-- Person 1 (left) -->
    <circle cx="7" cy="8" r="3" :fill="personColor1" />
    <rect x="4" y="12" width="6" height="8" :fill="personColor1" rx="1" />

    <!-- Person 2 (right) -->
    <circle cx="17" cy="8" r="3" :fill="personColor2" />
    <rect x="14" y="12" width="6" height="8" :fill="personColor2" rx="1" />

    <!-- Person 3 (center, slightly back) -->
    <circle cx="12" cy="6" r="2.5" :fill="personColor3" />
    <rect x="9.5" y="9" width="5" height="6" :fill="personColor3" rx="1" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDarkMode } from '@/composables/useDarkMode'

const { size = 24 } = defineProps<{
  size?: number | string
}>()

const { isDark } = useDarkMode()

const personColor1 = computed(() => (isDark.value ? '#A78BFA' : '#8B5CF6'))
const personColor2 = computed(() => (isDark.value ? '#F472B6' : '#EC4899'))
const personColor3 = computed(() => (isDark.value ? '#FB923C' : '#F97316'))
</script>
