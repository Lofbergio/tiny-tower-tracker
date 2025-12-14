<template>
  <Card
    class="overflow-hidden border-l-4 transition-all"
    :class="[
      userMission.status === 'completed'
        ? 'border-gray-400 opacity-60'
        : isCompletable
          ? 'border-green-500 hover:shadow-md dark:border-green-600'
          : 'border-blue-500 dark:border-blue-600',
    ]"
  >
    <div class="flex flex-col space-y-1 p-3 md:p-4">
      <div class="flex items-center justify-between gap-2">
        <h3 class="flex items-center gap-1.5 text-base font-semibold leading-tight md:text-lg">
          <span v-if="userMission.status === 'completed'">✓</span>
          <span v-else-if="isCompletable">🎯</span>
          <span v-else>📋</span>
          <span>{{ userMission.mission.name }}</span>
        </h3>
        <Badge
          :variant="userMission.status === 'completed' ? 'secondary' : 'default'"
          class="shrink-0 text-xs"
          :class="
            isCompletable && userMission.status === 'pending'
              ? 'bg-green-600 dark:bg-green-700'
              : ''
          "
        >
          💰 {{ userMission.mission.reward }}
        </Badge>
      </div>
      <p class="line-clamp-1 text-xs text-muted-foreground md:line-clamp-2">
        {{ userMission.mission.description }}
      </p>
    </div>
    <div class="p-3 pt-0 md:p-4 md:pt-0">
      <div class="space-y-2 md:space-y-3">
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
          class="rounded bg-green-50 p-1.5 dark:bg-green-900/20 md:p-2"
        >
          <p class="text-xs font-medium text-green-800 dark:text-green-200">✓ Ready to complete</p>
        </div>

        <div class="flex flex-col gap-1.5 md:gap-2">
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
