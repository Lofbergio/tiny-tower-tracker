<template>
  <div
    class="rounded-lg border bg-card text-card-foreground shadow-sm transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:border-primary/20 hover:shadow-md motion-safe:hover:-translate-y-0.5"
  >
    <slot />
  </div>
</template>

<script setup lang="ts"></script>
