<template>
  <div :class="cn('animate-pulse rounded-md bg-muted', className)" />
</template>

<script setup lang="ts">
interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: '',
})

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
</script>
