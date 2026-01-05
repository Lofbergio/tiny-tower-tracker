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
    <!-- Pixel-art style storefront -->
    <!-- Awning -->
    <path d="M2 8 L12 3 L22 8 L22 10 L2 10 Z" :fill="awningColor" />

    <!-- Store body -->
    <rect x="3" y="10" width="18" height="11" :fill="storeColor" />

    <!-- Door -->
    <rect x="9" y="14" width="6" height="7" :fill="doorColor" rx="1" />

    <!-- Windows -->
    <rect x="4" y="12" width="4" height="4" :fill="windowColor" rx="0.5" />
    <rect x="16" y="12" width="4" height="4" :fill="windowColor" rx="0.5" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDarkMode } from '@/composables/useDarkMode'

const { size = 24 } = defineProps<{
  size?: number | string
}>()

const { isDark } = useDarkMode()

const awningColor = computed(() => (isDark.value ? '#F472B6' : '#EC4899'))
const storeColor = computed(() => (isDark.value ? '#A78BFA' : '#8B5CF6'))
const doorColor = computed(() => (isDark.value ? '#FB923C' : '#F97316'))
const windowColor = computed(() => (isDark.value ? '#60A5FA' : '#3B82F6'))
</script>
