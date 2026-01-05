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
    <!-- Target/bullseye style for missions -->
    <circle cx="12" cy="12" r="9" :fill="ringColor3" />
    <circle cx="12" cy="12" r="6" :fill="ringColor2" />
    <circle cx="12" cy="12" r="3" :fill="ringColor1" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDarkMode } from '@/composables/useDarkMode'

const { size = 24 } = defineProps<{
  size?: number | string
}>()

const { isDark } = useDarkMode()

const ringColor1 = computed(() => (isDark.value ? '#F472B6' : '#EC4899'))
const ringColor2 = computed(() => (isDark.value ? '#A78BFA' : '#8B5CF6'))
const ringColor3 = computed(() => (isDark.value ? '#FB923C' : '#F97316'))
</script>
