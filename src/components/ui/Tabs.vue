<template>
  <div :class="cn('w-full', $attrs.class)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/utils/cn'
</script>

