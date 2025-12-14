<template>
  <div class="container mx-auto p-4 pb-24 md:pb-4">
    <div class="mb-6">
      <div class="flex-1">
        <h1 class="mb-1 flex items-center gap-2 text-2xl font-bold md:text-3xl">
          <span class="text-3xl md:text-4xl">🏪</span>
          <span
            class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400"
          >
            Stores
          </span>
        </h1>
        <p class="text-muted-foreground text-sm md:text-base">
          🍔 Food • 🛎️ Service • 🎮 Recreation • 🛍️ Retail • 🎨 Creative
        </p>
      </div>
    </div>

    <!-- Available Stores Section -->
    <div v-if="availableStores.length > 0 && userStoresWithData.length > 0" class="mb-8">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-lg font-semibold">
          <span class="text-xl">➕</span>
          <span>Add More Stores</span>
        </h2>
        <Badge variant="default">{{ availableStores.length }} available</Badge>
      </div>
      <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Card
          v-for="store in availableStores.slice(0, 6)"
          :key="store.id"
          class="group cursor-pointer overflow-hidden border-l-4 transition-all hover:scale-[1.02] hover:shadow-lg"
          :style="{ borderLeftColor: categoryColors(store.category).border }"
          @click="handleAddStore(store.id)"
        >
          <div
            class="relative flex flex-col space-y-1 p-3 md:p-4"
            :style="{ backgroundColor: categoryColors(store.category).bg }"
          >
            <div class="flex items-center gap-3">
              <StoreIcon :category="store.category" :size="40" class="shrink-0" />
              <div class="min-w-0 flex-1">
                <h3 class="text-base font-semibold leading-tight md:text-lg">
                  {{ store.name }}
                </h3>
                <p
                  class="line-clamp-1 text-xs font-medium"
                  :style="{ color: categoryColors(store.category).primary }"
                >
                  {{ store.category }}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
      <Button
        v-if="availableStores.length > 6"
        variant="outline"
        class="mt-3 w-full"
        @click="showAddDialog = true"
      >
        View All {{ availableStores.length }} Stores
      </Button>
    </div>

    <!-- First Time Experience - Show Available Stores -->
    <div v-if="userStoresWithData.length === 0 && availableStores.length > 0" class="mb-8">
      <EmptyState
        title="🏗️ No Stores Yet"
        description="Build stores in your tower and assign residents to work in them! Click any store below to add it."
      />
      <div class="mt-6">
        <h2 class="mb-3 flex items-center gap-2 text-lg font-semibold">
          <span class="text-xl">🏪</span>
          <span>Available Stores</span>
        </h2>
        <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Card
            v-for="store in availableStores.slice(0, 9)"
            :key="store.id"
            class="group cursor-pointer overflow-hidden border-l-4 transition-all hover:scale-[1.02] hover:shadow-lg"
            :style="{ borderLeftColor: categoryColors(store.category).border }"
            @click="handleAddStore(store.id)"
          >
            <div
              class="relative flex flex-col space-y-1 p-3 md:p-4"
              :style="{ backgroundColor: categoryColors(store.category).bg }"
            >
              <div class="flex items-center gap-3">
                <StoreIcon :category="store.category" :size="40" class="shrink-0" />
                <div class="min-w-0 flex-1">
                  <h3 class="text-base font-semibold leading-tight md:text-lg">
                    {{ store.name }}
                  </h3>
                  <p
                    class="line-clamp-1 text-xs font-medium"
                    :style="{ color: categoryColors(store.category).primary }"
                  >
                    {{ store.category }}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
        <Button
          v-if="availableStores.length > 9"
          variant="outline"
          class="mt-3 w-full"
          @click="showAddDialog = true"
        >
          View All {{ availableStores.length }} Stores
        </Button>
      </div>
    </div>

    <!-- Your Stores Section -->
    <div v-if="userStoresWithData.length > 0" class="mb-6">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-lg font-semibold">
          <span class="text-xl">🏢</span>
          <span>Your Stores</span>
        </h2>
        <Badge variant="secondary">{{ userStoresWithData.length }}</Badge>
      </div>
    </div>

    <div v-if="userStoresWithData.length > 0" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StoreCard
        v-for="userStore in userStoresWithData"
        :key="userStore.storeId"
        :user-store="userStore"
        :residents="residents"
        @remove-store="handleRemoveStore(userStore.storeId)"
        @remove-resident="handleRemoveResident(userStore.storeId, $event)"
        @add-resident="handleAddResidentToStore(userStore.storeId)"
      />
    </div>

    <!-- Full Store List Dialog (only shown when clicking "View All") -->
    <Dialog :open="showAddDialog" @update:open="showAddDialog = $event">
      <DialogContent>
        <div class="flex flex-col space-y-1.5 text-center sm:text-left">
          <DialogTitle>All Available Stores</DialogTitle>
        </div>
        <div class="max-h-[60vh] space-y-2 overflow-y-auto pr-2">
          <Card
            v-for="store in availableStores"
            :key="store.id"
            class="cursor-pointer overflow-hidden border-l-4 transition-all hover:scale-[1.02] hover:shadow-md"
            :style="{ borderLeftColor: categoryColors(store.category).border }"
            @click="handleAddStore(store.id)"
          >
            <div
              class="flex items-center gap-3 p-3"
              :style="{ backgroundColor: categoryColors(store.category).bg }"
            >
              <StoreIcon :category="store.category" :size="32" class="shrink-0" />
              <div class="min-w-0 flex-1">
                <h3 class="font-semibold leading-tight">{{ store.name }}</h3>
                <p
                  class="text-xs font-medium"
                  :style="{ color: categoryColors(store.category).primary }"
                >
                  {{ store.category }}
                </p>
              </div>
            </div>
          </Card>
        </div>
        <div class="mt-4">
          <Button variant="outline" class="w-full" @click="showAddDialog = false">Close</Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Confirmation Dialog -->
    <ConfirmDialog
      :open="showConfirmDialog"
      :title="confirmDialogData.title"
      :message="confirmDialogData.message"
      :variant="confirmDialogData.variant"
      :confirm-text="confirmDialogData.confirmText"
      @update:open="showConfirmDialog = $event"
      @confirm="confirmDialogData.onConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import StoreCard from '@/components/StoreCard.vue'
import StoreIcon from '@/components/StoreIcon.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { useDarkMode } from '@/composables/useDarkMode'
import { useUserStoresWithData } from '@/queries'
import { useResidentsStore, useStoresStore } from '@/stores'
import type { Resident, Store, UserStore } from '@/types'
import { getCategoryColors } from '@/utils/categoryColors'
import { useToast } from '@/utils/toast'
import { computed, ref } from 'vue'

const storesStore = useStoresStore()
const residentsStore = useResidentsStore()
const { userStores: userStoresWithData, allStores } = useUserStoresWithData()
const { residents } = residentsStore
const toast = useToast()
const { showConfirmDialog, confirmDialogData, confirm } = useConfirmDialog()
const { isDark } = useDarkMode()

const showAddDialog = ref(false)

const categoryColors = computed(() => (category: string) => getCategoryColors(category, isDark.value))

const availableStores = computed(() => {
  const builtStoreIds = new Set(storesStore.userStores.map((us: UserStore) => us.storeId))
  return allStores.value.filter(s => !builtStoreIds.has(s.id))
})

function handleAddStore(storeId: string) {
  const success = storesStore.addStore(storeId)
  if (success) {
    const store = allStores.value.find(s => s.id === storeId)
    toast.success(`✓ Added ${store?.name} (${store?.category})`)
    showAddDialog.value = false
  } else {
    toast.error('Store already exists')
  }
}

function handleRemoveStore(storeId: string) {
  const store = userStoresWithData.value.find((us: UserStore & { store: Store }) => us.storeId === storeId)
  if (!store) {
    return
  }

  confirm({
    title: 'Remove Store',
    message: `Are you sure you want to remove ${store.store.name}? This will also remove all residents from this store.`,
    variant: 'destructive',
    confirmText: 'Remove',
    onConfirm: () => {
      const success = storesStore.removeStore(storeId)
      if (success) {
        toast.success(`Removed ${store.store.name}`)
      } else {
        toast.error('Failed to remove store')
      }
    },
  })
}

function handleAddResidentToStore(storeId: string) {
  // Find available residents (not in this store, ideally with this as dream job)
  const store = allStores.value.find(s => s.id === storeId)
  const availableResidents = residents.filter((r: Resident) => {
    const inThisStore = userStoresWithData.value
      .find((us: UserStore & { store: Store }) => us.storeId === storeId)
      ?.residents.includes(r.id)
    return !inThisStore
  })

  if (availableResidents.length === 0) {
    toast.info('No available residents to assign')
    return
  }

  // Prefer residents with this as dream job
  const dreamJobResidents = availableResidents.filter(
    (r: Resident) => r.dreamJob === storeId
  )
  const residentToAdd = dreamJobResidents.length > 0 ? dreamJobResidents[0] : availableResidents[0]

  const result = storesStore.addResidentToStore(storeId, residentToAdd.id)
  if (result.success) {
    toast.success(`Added ${residentToAdd.name} to ${store?.name}`)
  } else {
    toast.error(result.error ?? 'Failed to add resident')
  }
}

function handleRemoveResident(storeId: string, residentId: string) {
  const resident = residents.find((r: Resident) => r.id === residentId)
  if (!resident) {
    return
  }

  confirm({
    title: 'Remove Resident',
    message: `Are you sure you want to remove ${resident.name} from this store?`,
    variant: 'destructive',
    confirmText: 'Remove',
    onConfirm: () => {
      const success = storesStore.removeResidentFromStore(storeId, residentId)
      if (success) {
        toast.success(`Removed ${resident.name} from store`)
      } else {
        toast.error('Failed to remove resident')
      }
    },
  })
}
</script>
