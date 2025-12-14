<template>
  <Card :class="{ 'opacity-60': userMission.status === 'completed' }">
    <div class="flex flex-col space-y-1 p-4">
      <div class="flex items-center justify-between gap-2">
        <h3 class="text-lg font-semibold leading-tight">
          {{ userMission.mission.name }}
        </h3>
        <Badge
          :variant="userMission.status === 'completed' ? 'secondary' : 'default'"
          class="shrink-0"
        >
          {{ userMission.mission.reward }} Bux
        </Badge>
      </div>
      <p class="text-muted-foreground line-clamp-2 text-xs">
        {{ userMission.mission.description }}
      </p>
    </div>
    <div class="p-4 pt-0">
      <div class="space-y-3">
        <ul class="space-y-0.5 text-xs">
          <li
            v-for="(req, index) in userMission.mission.requirements"
            :key="index"
            class="flex items-center gap-1.5"
          >
            <span class="text-muted-foreground">{{ req.quantity }}x</span>
            <span>{{ req.product }}</span>
          </li>
        </ul>

        <div
          v-if="isCompletable && userMission.status === 'pending'"
          class="rounded bg-green-50 p-2 dark:bg-green-900/20"
        >
          <p class="text-xs font-medium text-green-800 dark:text-green-200">✓ Ready to complete</p>
        </div>

        <div class="flex flex-col gap-2">
          <Button
            v-if="userMission.status === 'pending'"
            variant="default"
            size="sm"
            class="w-full"
            @click="$emit('complete')"
          >
            Complete
          </Button>
          <div v-else class="flex gap-2">
            <Button variant="outline" size="sm" class="flex-1" @click="$emit('reopen')">
              Reopen
            </Button>
          </div>
          <Button variant="ghost" size="sm" class="w-full" @click="$emit('remove')">
            Remove
          </Button>
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
