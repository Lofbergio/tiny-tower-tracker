<template>
  <AvatarRoot :class="['relative flex shrink-0 overflow-hidden rounded-full', sizeClasses[size]]">
    <AvatarImage v-if="src" :src="src" :alt="alt" class="aspect-square h-full w-full object-cover" />
    <AvatarFallback :class="['flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground', fallbackClass]">
      <slot name="fallback">
        {{ fallbackText }}
      </slot>
    </AvatarFallback>
  </AvatarRoot>
</template>

<script setup lang="ts">
import { AvatarFallback, AvatarImage, AvatarRoot } from 'radix-vue'
import { computed } from 'vue'

interface Props {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fallbackClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  src: undefined,
  alt: '',
  fallback: '',
  size: 'md',
  fallbackClass: '',
})

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

const fallbackText = computed(() => {
  if (props.fallback) return props.fallback
  if (props.alt) {
    return props.alt
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return '??'
})
</script>
