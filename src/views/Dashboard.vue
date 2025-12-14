<template>
  <div class="container mx-auto p-4 pb-20 md:pb-4">
    <div class="mb-8">
      <h1 class="mb-2 text-3xl font-bold">Dashboard</h1>
      <p class="text-muted-foreground">Track your tower's progress and manage your residents</p>
    </div>
    <PendingChanges />
  </div>
</template>

<script setup lang="ts">
import PendingChanges from '@/components/PendingChanges.vue'
</script>
