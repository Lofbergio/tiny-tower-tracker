<template>
  <Card :class="{ 'opacity-60': userMission.status === 'completed' }">
    <div class="flex flex-col space-y-1.5 p-6">
      <div class="flex items-center justify-between">
        <h3 class="text-2xl font-semibold leading-none tracking-tight">
          {{ userMission.mission.name }}
        </h3>
        <Badge :variant="userMission.status === 'completed' ? 'secondary' : 'default'">
          {{ userMission.status === 'completed' ? 'Completed' : 'Pending' }}
        </Badge>
      </div>
      <p class="text-sm text-muted-foreground">{{ userMission.mission.description }}</p>
    </div>
    <div class="p-6 pt-0">
      <div class="space-y-2">
        <p class="text-sm font-medium">Requirements:</p>
        <ul class="space-y-1 text-sm">
          <li
            v-for="(req, index) in userMission.mission.requirements"
            :key="index"
            class="flex items-center gap-2"
          >
            <span>{{ req.quantity.toLocaleString() }}x</span>
            <span class="font-medium">{{ req.product }}</span>
            <span class="text-muted-foreground">({{ req.store }})</span>
          </li>
        </ul>
        <div class="mt-4 flex items-center justify-between">
          <p class="text-sm font-medium">Reward: {{ userMission.mission.reward }} Bux</p>
          <div class="flex gap-2">
            <Button
              v-if="userMission.status === 'pending'"
              variant="default"
              size="sm"
              @click="$emit('complete')"
            >
              Mark Complete
            </Button>
            <Button v-else variant="outline" size="sm" @click="$emit('reopen')"> Reopen </Button>
            <Button variant="ghost" size="sm" @click="$emit('remove')"> Remove </Button>
          </div>
        </div>
        <div
          v-if="isCompletable && userMission.status === 'pending'"
          class="rounded-md bg-green-50 p-2 dark:bg-green-900/20"
        >
          <p class="text-sm font-medium text-green-800 dark:text-green-200">
            ✓ Can be completed with current stores
          </p>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import type { Mission, UserMission } from '@/types'
import Badge from './ui/Badge.vue'
import Button from './ui/Button.vue'
import Card from './ui/Card.vue'

defineProps<{
  userMission: UserMission & { mission: Mission }
  isCompletable?: boolean
}>()

defineEmits<{
  complete: []
  reopen: []
  remove: []
}>()
</script>
