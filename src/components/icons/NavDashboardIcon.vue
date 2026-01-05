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
    <!-- Bar chart style dashboard -->
    <rect x="3" y="14" width="4" height="7" :fill="barColor1" rx="1" />
    <rect x="10" y="8" width="4" height="13" :fill="barColor2" rx="1" />
    <rect x="17" y="3" width="4" height="18" :fill="barColor3" rx="1" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDarkMode } from '@/composables/useDarkMode'

const { size = 24 } = defineProps<{
  size?: number | string
}>()

const { isDark } = useDarkMode()

const barColor1 = computed(() => (isDark.value ? '#A78BFA' : '#8B5CF6'))
const barColor2 = computed(() => (isDark.value ? '#F472B6' : '#EC4899'))
const barColor3 = computed(() => (isDark.value ? '#FB923C' : '#F97316'))
</script>
