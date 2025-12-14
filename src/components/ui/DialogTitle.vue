<template>
  <h2 :class="cn('text-lg font-semibold leading-none tracking-tight', $attrs.class)">
    <slot />
  </h2>
</template>

<script setup lang="ts">
import { cn } from '@/utils/cn'
</script>

