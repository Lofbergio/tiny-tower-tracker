<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Food Category -->
    <g v-if="categoryKey === 'food'">
      <rect x="8" y="20" width="48" height="36" rx="4" :fill="colors.food" />
      <rect x="12" y="24" width="40" height="28" rx="2" fill="#fff" opacity="0.9" />
      <circle cx="24" cy="36" r="4" fill="#F59E0B" />
      <circle cx="40" cy="36" r="4" fill="#F59E0B" />
      <rect x="20" y="44" width="24" height="4" rx="2" fill="#F59E0B" />
      <rect x="28" y="16" width="8" height="4" rx="2" :fill="colors.food" />
    </g>

    <!-- Service Category -->
    <g v-else-if="categoryKey === 'service'">
      <rect x="8" y="20" width="48" height="36" rx="4" :fill="colors.service" />
      <rect x="12" y="24" width="40" height="28" rx="2" fill="#fff" opacity="0.9" />
      <rect x="20" y="32" width="24" height="3" rx="1.5" fill="#3B82F6" />
      <rect x="20" y="40" width="24" height="3" rx="1.5" fill="#3B82F6" />
      <rect x="20" y="48" width="18" height="3" rx="1.5" fill="#3B82F6" />
      <circle cx="50" cy="38" r="6" fill="#fff" />
      <path d="M 50 32 L 50 44 M 44 38 L 56 38" stroke="#3B82F6" stroke-width="2" />
      <rect x="28" y="16" width="8" height="4" rx="2" :fill="colors.service" />
    </g>

    <!-- Recreation Category -->
    <g v-else-if="categoryKey === 'recreation'">
      <rect x="8" y="20" width="48" height="36" rx="4" :fill="colors.recreation" />
      <rect x="12" y="24" width="40" height="28" rx="2" fill="#fff" opacity="0.9" />
      <circle cx="32" cy="38" r="8" fill="#A78BFA" />
      <circle cx="32" cy="38" r="5" fill="#fff" />
      <rect x="20" y="50" width="24" height="2" rx="1" fill="#A78BFA" />
      <rect x="28" y="16" width="8" height="4" rx="2" :fill="colors.recreation" />
    </g>

    <!-- Retail Category -->
    <g v-else-if="categoryKey === 'retail'">
      <rect x="8" y="20" width="48" height="36" rx="4" :fill="colors.retail" />
      <rect x="12" y="24" width="40" height="28" rx="2" fill="#fff" opacity="0.9" />
      <rect x="18" y="30" width="8" height="8" rx="1" fill="#EC4899" />
      <rect x="30" y="30" width="8" height="8" rx="1" fill="#EC4899" />
      <rect x="42" y="30" width="8" height="8" rx="1" fill="#EC4899" />
      <rect x="18" y="42" width="8" height="8" rx="1" fill="#EC4899" />
      <rect x="30" y="42" width="8" height="8" rx="1" fill="#EC4899" />
      <rect x="42" y="42" width="8" height="8" rx="1" fill="#EC4899" />
      <rect x="28" y="16" width="8" height="4" rx="2" :fill="colors.retail" />
    </g>

    <!-- Creative Category -->
    <g v-else-if="categoryKey === 'creative'">
      <rect x="8" y="20" width="48" height="36" rx="4" :fill="colors.creative" />
      <rect x="12" y="24" width="40" height="28" rx="2" fill="#fff" opacity="0.9" />
      <path
        d="M 20 32 Q 24 28 28 32 T 36 32 T 44 32"
        stroke="#FBBF24"
        stroke-width="3"
        fill="none"
        stroke-linecap="round"
      />
      <circle cx="24" cy="42" r="3" fill="#FBBF24" />
      <circle cx="32" cy="46" r="3" fill="#FBBF24" />
      <circle cx="40" cy="42" r="3" fill="#FBBF24" />
      <rect x="28" y="16" width="8" height="4" rx="2" :fill="colors.creative" />
    </g>

    <!-- Default/Generic Store -->
    <g v-else>
      <rect x="8" y="20" width="48" height="36" rx="4" fill="#6B7280" />
      <rect x="12" y="24" width="40" height="28" rx="2" fill="#fff" opacity="0.9" />
      <rect x="20" y="32" width="24" height="20" rx="2" fill="#9CA3AF" />
      <rect x="28" y="16" width="8" height="4" rx="2" fill="#6B7280" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { useDarkMode } from '@/composables/useDarkMode'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    category: string
    size?: number
  }>(),
  {
    size: 48,
  }
)

const { isDark } = useDarkMode()

const categoryLower = computed(() => props.category.toLowerCase())

const categoryType = computed(() => {
  const cat = categoryLower.value
  if (cat.includes('food')) return 'food'
  if (cat.includes('service')) return 'service'
  if (cat.includes('recreation')) return 'recreation'
  if (cat.includes('retail')) return 'retail'
  if (cat.includes('creative')) return 'creative'
  return 'default'
})

const colors = computed(() => {
  if (isDark.value) {
    return {
      food: '#DC2626',
      service: '#2563EB',
      recreation: '#7C3AED',
      retail: '#DB2777',
      creative: '#D97706',
    }
  }
  return {
    food: '#EF4444',
    service: '#3B82F6',
    recreation: '#A78BFA',
    retail: '#EC4899',
    creative: '#F59E0B',
  }
})

const categoryKey = computed(() => categoryType.value)
</script>
