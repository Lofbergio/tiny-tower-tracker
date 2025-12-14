<template>
  <Card :class="{ 'opacity-60': userMission.status === 'completed' }">
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle>{{ mission.name }}</CardTitle>
        <Badge :variant="userMission.status === 'completed' ? 'secondary' : 'default'">
          {{ userMission.status === 'completed' ? 'Completed' : 'Pending' }}
        </Badge>
      </div>
      <p class="text-sm text-muted-foreground">{{ mission.description }}</p>
    </CardHeader>
    <CardContent>
      <div class="space-y-2">
        <p class="text-sm font-medium">Requirements:</p>
        <ul class="space-y-1 text-sm">
          <li
            v-for="(req, index) in mission.requirements"
            :key="index"
            class="flex items-center gap-2"
          >
            <span>{{ req.quantity.toLocaleString() }}x</span>
            <span class="font-medium">{{ req.product }}</span>
            <span class="text-muted-foreground">({{ req.store }})</span>
          </li>
        </ul>
        <div class="mt-4 flex items-center justify-between">
          <p class="text-sm font-medium">Reward: {{ mission.reward }} Bux</p>
          <div class="flex gap-2">
            <Button
              v-if="userMission.status === 'pending'"
              variant="default"
              size="sm"
              @click="$emit('complete')"
            >
              Mark Complete
            </Button>
            <Button
              v-else
              variant="outline"
              size="sm"
              @click="$emit('reopen')"
            >
              Reopen
            </Button>
            <Button
              variant="ghost"
              size="sm"
              @click="$emit('remove')"
            >
              Remove
            </Button>
          </div>
        </div>
        <div v-if="isCompletable && userMission.status === 'pending'" class="rounded-md bg-green-50 dark:bg-green-900/20 p-2">
          <p class="text-sm font-medium text-green-800 dark:text-green-200">
            ✓ Can be completed with current stores
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import Card from './ui/Card.vue'
import CardHeader from './ui/CardHeader.vue'
import CardTitle from './ui/CardTitle.vue'
import CardContent from './ui/CardContent.vue'
import Badge from './ui/Badge.vue'
import Button from './ui/Button.vue'
import type { Mission, UserMission } from '@/types'

interface Props {
  userMission: UserMission & { mission: Mission }
  isCompletable?: boolean
}

defineProps<Props>()

defineEmits<{
  complete: []
  reopen: []
  remove: []
}>()
</script>

