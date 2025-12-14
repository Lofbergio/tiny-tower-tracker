<template>
  <div :class="cn(
    'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    $attrs.class
  )">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/utils/cn'
</script>

