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
    <!-- Mini tower building -->
    <!-- Roof -->
    <polygon points="4,8 12,3 20,8" :fill="roofColor" />

    <!-- Top floor -->
    <rect x="5" y="8" width="14" height="5" :fill="floor1Color" />
    <rect x="7" y="9.5" width="2" height="2" :fill="windowColor" rx="0.3" />
    <rect x="11" y="9.5" width="2" height="2" :fill="windowColor" rx="0.3" />
    <rect x="15" y="9.5" width="2" height="2" :fill="windowColor" rx="0.3" />

    <!-- Middle floor -->
    <rect x="5" y="13" width="14" height="5" :fill="floor2Color" />
    <rect x="7" y="14.5" width="2" height="2" :fill="windowColor" rx="0.3" />
    <rect x="11" y="14.5" width="2" height="2" :fill="windowColor" rx="0.3" />
    <rect x="15" y="14.5" width="2" height="2" :fill="windowColor" rx="0.3" />

    <!-- Bottom floor with door -->
    <rect x="5" y="18" width="14" height="5" :fill="floor3Color" />
    <rect x="10" y="19" width="4" height="4" :fill="doorColor" rx="0.5" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDarkMode } from '@/composables/useDarkMode'

const { size = 24 } = defineProps<{
  size?: number | string
}>()

const { isDark } = useDarkMode()

const roofColor = computed(() => (isDark.value ? '#6B7280' : '#8B4513'))
const floor1Color = computed(() => (isDark.value ? '#A78BFA' : '#8B5CF6'))
const floor2Color = computed(() => (isDark.value ? '#F472B6' : '#EC4899'))
const floor3Color = computed(() => (isDark.value ? '#FB923C' : '#F97316'))
const windowColor = computed(() => (isDark.value ? '#60A5FA' : '#3B82F6'))
const doorColor = computed(() => (isDark.value ? '#374151' : '#1F2937'))
</script>
