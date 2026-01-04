<template>
  <AvatarRoot :class="['relative flex shrink-0 overflow-hidden rounded-full', sizeClasses[size]]">
    <AvatarImage
      v-if="src"
      :src="src"
      :alt="alt"
      class="aspect-square h-full w-full object-cover"
    />
    <AvatarFallback
      :class="[
        'flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground',
        fallbackClass,
      ]"
    >
      <slot name="fallback">
        {{ fallbackText }}
      </slot>
    </AvatarFallback>
  </AvatarRoot>
</template>

<script setup lang="ts">
import { AvatarFallback, AvatarImage, AvatarRoot } from 'radix-vue'
import { computed } from 'vue'

const {
  src,
  alt = '',
  fallback = '',
  size = 'md',
  fallbackClass = '',
} = defineProps<{
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fallbackClass?: string
}>()

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

const fallbackText = computed(() => {
  if (fallback) return fallback
  if (alt) {
    return alt
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return '??'
})
</script>
