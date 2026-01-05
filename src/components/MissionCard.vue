<template>
  <Card
    hoverable
    class="group overflow-hidden border-l-4"
    :class="[
      userMission.status === 'completed'
        ? 'border-gray-400 opacity-70'
        : isCompletable
          ? 'border-green-500 dark:border-green-500'
          : 'border-blue-500 dark:border-blue-500',
    ]"
    :glow="isCompletable && userMission.status === 'pending' ? 'success' : false"
  >
    <div class="flex flex-col gap-1.5 p-3 md:p-4">
      <div class="flex items-start justify-between gap-2">
        <h3 class="flex items-center gap-1.5 text-sm font-bold leading-tight md:text-base">
          <span
            :class="[
              'inline-block text-base',
              isCompletable && userMission.status === 'pending'
                ? 'motion-safe:animate-heartbeat'
                : '',
            ]"
          >
            {{ userMission.status === 'completed' ? '✓' : isCompletable ? '🎯' : '📋' }}
          </span>
          <span class="line-clamp-1">{{ userMission.mission.name }}</span>
        </h3>
        <Badge
          :variant="userMission.status === 'completed' ? 'secondary' : 'default'"
          :class="[
            'shrink-0 text-[10px] tabular-nums md:text-xs',
            isCompletable && userMission.status === 'pending'
              ? 'motion-safe:animate-sparkle bg-gradient-to-r from-amber-500 to-yellow-500 text-white dark:from-amber-400 dark:to-yellow-400'
              : '',
          ]"
        >
          <span class="mr-0.5">💰</span>
          <span class="coin-display">{{ userMission.mission.reward.toLocaleString() }}</span>
        </Badge>
      </div>
      <p class="line-clamp-1 text-[10px] text-muted-foreground md:text-xs">
        {{ userMission.mission.description }}
      </p>
    </div>
    <div class="space-y-2.5 p-3 pt-0 md:p-4 md:pt-0">
      <!-- Requirements list -->
      <div class="rounded-lg bg-muted/50 p-2">
        <ul class="space-y-0.5 text-[10px] md:text-xs">
          <li
            v-for="(req, index) in userMission.mission.requirements"
            :key="index"
            class="grid grid-cols-[5ch_1ch_1fr] items-baseline gap-1"
          >
            <span class="text-right font-bold tabular-nums">{{ req.quantity }}</span>
            <span class="text-muted-foreground" aria-hidden="true">×</span>
            <span class="truncate font-medium">{{ req.product }}</span>
          </li>
        </ul>
      </div>

      <!-- Ready indicator -->
      <div
        v-if="isCompletable && userMission.status === 'pending'"
        class="motion-safe:animate-slide-up flex items-center gap-2 rounded-lg bg-green-50 p-2 dark:bg-green-900/30"
      >
        <span class="text-sm motion-safe:animate-bounce-in">✨</span>
        <p class="text-xs font-semibold text-green-700 dark:text-green-300">Ready to complete!</p>
      </div>

      <!-- Actions -->
      <div class="flex gap-2">
        <Button
          v-if="userMission.status === 'pending'"
          :variant="isCompletable ? 'success' : 'default'"
          size="sm"
          class="flex-1"
          @click="$emit('complete')"
        >
          <span v-if="isCompletable" class="mr-1">🎉</span>
          Complete
        </Button>
        <Button v-else variant="outline" size="sm" class="flex-1" @click="$emit('reopen')">
          Reopen
        </Button>
        <Button variant="ghost" size="sm" class="text-muted-foreground" @click="$emit('remove')">
          ✕
        </Button>
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
