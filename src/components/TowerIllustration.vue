<template>
  <svg
    :width="width"
    :height="height"
    viewBox="0 0 200 300"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="className"
  >
    <!-- Sky background -->
    <rect width="200" height="300" :fill="isDark ? '#1a1a2e' : '#87CEEB'" />

    <!-- Clouds -->
    <ellipse cx="40" cy="30" rx="15" ry="8" :fill="isDark ? '#2a2a3e' : '#fff'" opacity="0.7" />
    <ellipse cx="50" cy="30" rx="18" ry="10" :fill="isDark ? '#2a2a3e' : '#fff'" opacity="0.7" />
    <ellipse cx="160" cy="50" rx="20" ry="10" :fill="isDark ? '#2a2a3e' : '#fff'" opacity="0.6" />
    <ellipse cx="170" cy="50" rx="15" ry="8" :fill="isDark ? '#2a2a3e' : '#fff'" opacity="0.6" />

    <!-- Tower building -->
    <g>
      <!-- Base -->
      <rect x="60" y="250" width="80" height="30" :fill="isDark ? '#3a3a4e' : '#8B4513'" />

      <!-- Floor 7 (top) -->
      <rect x="70" y="220" width="60" height="30" :fill="isDark ? '#4a4a5e' : '#FFD700'" />
      <rect x="75" y="225" width="10" height="10" :fill="isDark ? '#6a6a7e' : '#FFA500'" />
      <rect x="90" y="225" width="10" height="10" :fill="isDark ? '#6a6a7e' : '#FFA500'" />
      <rect x="115" y="225" width="10" height="10" :fill="isDark ? '#6a6a7e' : '#FFA500'" />

      <!-- Floor 6 -->
      <rect x="65" y="190" width="70" height="30" :fill="isDark ? '#5a5a6e' : '#FF6B6B'" />
      <rect x="70" y="195" width="12" height="12" :fill="isDark ? '#7a7a8e' : '#FF4757'" />
      <rect x="87" y="195" width="12" height="12" :fill="isDark ? '#7a7a8e' : '#FF4757'" />
      <rect x="104" y="195" width="12" height="12" :fill="isDark ? '#7a7a8e' : '#FF4757'" />
      <rect x="121" y="195" width="12" height="12" :fill="isDark ? '#7a7a8e' : '#FF4757'" />

      <!-- Floor 5 -->
      <rect x="60" y="160" width="80" height="30" :fill="isDark ? '#4a4a5e' : '#4ECDC4'" />
      <rect x="65" y="165" width="12" height="12" :fill="isDark ? '#6a6a7e' : '#45B7AF'" />
      <rect x="82" y="165" width="12" height="12" :fill="isDark ? '#6a6a7e' : '#45B7AF'" />
      <rect x="99" y="165" width="12" height="12" :fill="isDark ? '#6a6a7e' : '#45B7AF'" />
      <rect x="116" y="165" width="12" height="12" :fill="isDark ? '#6a6a7e' : '#45B7AF'" />
      <rect x="133" y="165" width="12" height="12" :fill="isDark ? '#6a6a7e' : '#45B7AF'" />

      <!-- Floor 4 -->
      <rect x="65" y="130" width="70" height="30" :fill="isDark ? '#5a5a6e' : '#A78BFA'" />
      <rect x="70" y="135" width="12" height="12" :fill="isDark ? '#7a7a8e' : '#9333EA'" />
      <rect x="87" y="135" width="12" height="12" :fill="isDark ? '#7a7a8e' : '#9333EA'" />
      <rect x="104" y="135" width="12" height="12" :fill="isDark ? '#7a7a8e' : '#9333EA'" />
      <rect x="121" y="135" width="12" height="12" :fill="isDark ? '#7a7a8e' : '#9333EA'" />

      <!-- Floor 3 -->
      <rect x="70" y="100" width="60" height="30" :fill="isDark ? '#4a4a5e' : '#F59E0B'" />
      <rect x="75" y="105" width="10" height="10" :fill="isDark ? '#6a6a7e' : '#D97706'" />
      <rect x="90" y="105" width="10" height="10" :fill="isDark ? '#6a6a7e' : '#D97706'" />
      <rect x="105" y="105" width="10" height="10" :fill="isDark ? '#6a6a7e' : '#D97706'" />
      <rect x="115" y="105" width="10" height="10" :fill="isDark ? '#6a6a7e' : '#D97706'" />

      <!-- Floor 2 -->
      <rect x="65" y="70" width="70" height="30" :fill="isDark ? '#5a5a6e' : '#10B981'" />
      <rect x="70" y="75" width="12" height="12" :fill="isDark ? '#7a7a8e' : '#059669'" />
      <rect x="87" y="75" width="12" height="12" :fill="isDark ? '#7a7a8e' : '#059669'" />
      <rect x="104" y="75" width="12" height="12" :fill="isDark ? '#7a7a8e' : '#059669'" />
      <rect x="121" y="75" width="12" height="12" :fill="isDark ? '#7a7a8e' : '#059669'" />

      <!-- Floor 1 (Lobby) -->
      <rect x="60" y="40" width="80" height="30" :fill="isDark ? '#6a6a7e' : '#EF4444'" />
      <rect x="70" y="50" width="15" height="15" :fill="isDark ? '#8a8a9e' : '#DC2626'" />
      <rect x="90" y="50" width="20" height="15" :fill="isDark ? '#333' : '#666'" />
      <rect x="115" y="50" width="15" height="15" :fill="isDark ? '#8a8a9e' : '#DC2626'" />

      <!-- Roof -->
      <polygon points="50,40 100,15 150,40" :fill="isDark ? '#2a2a3e' : '#654321'" />

      <!-- Flag on top -->
      <rect x="98" y="5" width="4" height="20" :fill="isDark ? '#8a8a9e' : '#333'" />
      <polygon points="102,8 102,18 115,13" :fill="isDark ? '#dc2626' : '#EF4444'" />
    </g>

    <!-- Birds -->
    <path d="M 25 20 Q 30 18 35 20" stroke="#333" stroke-width="1.5" fill="none" />
    <path d="M 180 35 Q 185 33 190 35" stroke="#333" stroke-width="1.5" fill="none" />
  </svg>
</template>

<script setup lang="ts">
import { useDarkMode } from '@/composables/useDarkMode'

withDefaults(
  defineProps<{
    width?: string | number
    height?: string | number
    className?: string
  }>(),
  {
    width: '200',
    height: '300',
    className: '',
  }
)

const { isDark } = useDarkMode()
</script>
