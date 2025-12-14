<template>
  <svg
    width="200"
    height="200"
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="mx-auto"
    aria-hidden="true"
    focusable="false"
  >
    <!-- Construction site -->
    <rect x="50" y="120" width="100" height="60" :fill="isDark ? '#3a3a4e' : '#D4D4D8'" />

    <!-- Crane base -->
    <rect x="140" y="80" width="15" height="100" :fill="isDark ? '#6a6a7e' : '#71717A'" />

    <!-- Crane arm -->
    <rect x="90" y="75" width="80" height="5" :fill="isDark ? '#8a8a9e' : '#52525B'" />

    <!-- Crane cable -->
    <line
      x1="120"
      y1="80"
      x2="120"
      y2="110"
      :stroke="isDark ? '#6a6a7e' : '#71717A'"
      stroke-width="2"
    />

    <!-- Hook/block -->
    <rect x="115" y="110" width="10" height="15" :fill="isDark ? '#dc2626' : '#EF4444'" />

    <!-- Ground level indicator -->
    <line
      x1="0"
      y1="180"
      x2="200"
      y2="180"
      :stroke="isDark ? '#4a4a5e' : '#A1A1AA'"
      stroke-width="2"
      stroke-dasharray="5,5"
    />

    <!-- Construction signs -->
    <circle cx="30" cy="150" r="3" :fill="isDark ? '#f59e0b' : '#F59E0B'" />
    <circle cx="170" cy="150" r="3" :fill="isDark ? '#f59e0b' : '#F59E0B'" />

    <!-- Text -->
    <text
      x="100"
      y="195"
      text-anchor="middle"
      :fill="isDark ? '#9ca3af' : '#6B7280'"
      font-size="12"
      font-family="system-ui"
    >
      Your tower awaits...
    </text>
  </svg>
</template>

<script setup lang="ts">
import { useDarkMode } from '@/composables/useDarkMode'

const { isDark } = useDarkMode()
</script>
