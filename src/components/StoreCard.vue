<template>
  <Card
    hoverable
    class="group flex h-full flex-col overflow-hidden border-l-4"
    :class="
      isComplete ? 'opacity-90 motion-safe:transition-opacity motion-safe:hover:opacity-100' : ''
    "
    :style="{ borderLeftColor: categoryColors.border }"
    :glow="isComplete ? 'success' : false"
  >
    <div class="flex flex-col space-y-1 p-3 md:p-4" :style="{ backgroundColor: categoryColors.bg }">
      <div class="flex items-center justify-between gap-2">
        <h3
          class="flex min-w-0 flex-1 items-center gap-2 text-base font-bold leading-tight md:text-lg"
        >
          <StoreIcon :category="store.category" :size="28" class="shrink-0" />
          <span class="truncate">{{ store.name }}</span>
        </h3>
        <!-- Staffing indicator as mini slots -->
        <div class="flex items-center gap-0.5">
          <span
            v-for="slot in 3"
            :key="slot"
            :class="[
              'h-2.5 w-2.5 rounded-sm transition-all',
              slot <= capacity
                ? 'bg-green-500 shadow-sm shadow-green-500/30'
                : 'bg-muted-foreground/20',
            ]"
          />
        </div>
      </div>
      <p class="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground md:text-xs">
        {{ store.category }}
      </p>
    </div>
    <div class="flex flex-1 flex-col gap-3 p-3 pt-2 md:p-4 md:pt-3">
      <!-- Resident Slots -->
      <div class="space-y-1.5">
        <div class="grid gap-1.5">
          <!-- Filled slots -->
          <div
            v-for="residentId in residents"
            :key="residentId"
            class="slot-filled group/slot flex min-h-[44px] items-center gap-2.5 rounded-lg border border-green-500/20 bg-green-500/5 p-2 transition-colors"
          >
            <div class="relative">
              <Avatar
                :src="getResidentAvatarUrl(residentId)"
                :alt="getResidentName(residentId)"
                size="sm"
              />
              <span
                v-if="isResidentInDreamJob(residentId)"
                class="absolute -bottom-0.5 -right-0.5 text-[10px]"
                title="Dream job!"
              >
                ⭐
              </span>
            </div>
            <span class="min-w-0 flex-1 truncate text-sm font-medium">{{
              getResidentName(residentId)
            }}</span>
            <Button
              v-if="!isComplete"
              variant="ghost"
              size="sm"
              class="h-8 px-2 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover/slot:opacity-100"
              @click="$emit('remove-resident', residentId)"
            >
              ✕
            </Button>
          </div>
          <!-- Empty slots - match filled slot structure -->
          <button
            v-for="i in emptySlots"
            :key="`empty-${i}`"
            class="group/empty flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-2 text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5"
            @click="$emit('add-resident')"
          >
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-current opacity-50"
            >
              <span class="text-lg">+</span>
            </div>
            <span class="text-sm font-medium">Add resident</span>
          </button>
        </div>
      </div>

      <!-- Complete state -->
      <div v-if="isComplete" class="mt-auto" :class="showViewButton ? 'space-y-2' : ''">
        <div
          class="flex items-center justify-center gap-1.5 rounded-lg bg-green-500/10 py-2 text-center"
        >
          <span class="text-sm">🎉</span>
          <p class="text-xs font-bold text-green-600 dark:text-green-400">Fully staffed!</p>
        </div>
        <Button
          v-if="showViewButton"
          variant="outline"
          size="sm"
          class="w-full"
          @click="$emit('view-store')"
        >
          View
        </Button>
      </div>

      <!-- Actions for incomplete stores -->
      <div v-else-if="!isComplete && capacity > 0 && showViewButton" class="mt-auto">
        <Button variant="outline" size="sm" class="w-full" @click="$emit('view-store')">
          View
        </Button>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { useDarkMode } from '@/composables/useDarkMode'
import type { Resident, Store, UserStore } from '@/types'
import { getResidentAvatarUrl as getResidentAvatarUrlByName } from '@/utils/avatar'
import { getCategoryColors } from '@/utils/categoryColors'
import { formatResidentName } from '@/utils/residentName'
import { computed } from 'vue'
import StoreIcon from './StoreIcon.vue'
import Avatar from './ui/Avatar.vue'
import Button from './ui/Button.vue'
import Card from './ui/Card.vue'

const {
  userStore,
  residents: allResidents,
  isComplete = false,
  showViewButton = false,
} = defineProps<{
  userStore: UserStore & { store: Store }
  residents: Resident[]
  isComplete?: boolean
  showViewButton?: boolean
}>()

defineEmits<{
  'remove-resident': [residentId: string]
  'add-resident': []
  'view-store': []
}>()

const { isDark } = useDarkMode()
const store = computed(() => userStore.store)
const residents = computed(() => userStore.residents)
const capacity = computed(() => residents.value.length)
const emptySlots = computed(() => Math.max(0, 3 - capacity.value))

const residentById = computed(() => {
  const map = new Map<string, Resident>()
  for (const resident of allResidents) {
    map.set(resident.id, resident)
  }
  return map
})

const categoryColors = computed(() => getCategoryColors(store.value.category, isDark.value))

function getResidentName(residentId: string) {
  const resident = residentById.value.get(residentId)
  return resident ? formatResidentName(resident.name) : 'Unknown'
}

function getResidentAvatarUrl(residentId: string) {
  return getResidentAvatarUrlByName(getResidentName(residentId))
}

function isResidentInDreamJob(residentId: string) {
  const resident = residentById.value.get(residentId)
  return resident?.dreamJob === store.value.id
}
</script>
