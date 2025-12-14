<template>
  <div class="container mx-auto p-4 pb-24 md:pb-4">
    <div class="mb-6 flex items-start justify-between md:mb-8">
      <div class="flex-1">
        <h1 class="mb-2 flex items-center gap-2 text-2xl font-bold md:text-3xl">
          <span class="text-3xl md:text-4xl">📊</span>
          Dashboard
        </h1>
        <p class="text-muted-foreground text-sm md:text-base">
          Track your tower's progress and manage your residents
        </p>
      </div>
      <div class="hidden md:block">
        <TowerIllustration :width="120" :height="180" class="opacity-50" />
      </div>
    </div>

    <div class="mb-8">
      <DataManagement />
    </div>

    <PendingChanges />
  </div>
</template>

<script setup lang="ts">
import DataManagement from '@/components/DataManagement.vue'
import PendingChanges from '@/components/PendingChanges.vue'
import TowerIllustration from '@/components/TowerIllustration.vue'
</script>
