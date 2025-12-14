<template>
  <div :class="cn('mt-4', $attrs.class)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/utils/cn'
</script>

