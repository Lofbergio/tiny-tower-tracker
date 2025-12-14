<template>
  <div class="container mx-auto p-4 pb-20 md:pb-4">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="mb-1 text-3xl font-bold">Stores</h1>
        <p class="text-muted-foreground text-sm">Build and manage stores in your tower</p>
      </div>
      <Dialog :open="showAddDialog" @update:open="showAddDialog = $event">
        <DialogContent>
          <div class="flex flex-col space-y-1.5 text-center sm:text-left">
            <DialogTitle>Add Store</DialogTitle>
          </div>
          <div class="space-y-4">
            <div>
              <Label class="mb-2 block">Select Store</Label>
              <SearchableSelect
                v-model="selectedStoreId"
                :items="availableStoreItems"
                placeholder="Choose a store..."
                search-placeholder="Search stores…"
              />
            </div>
          </div>
          <div class="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button variant="outline" @click="showAddDialog = false">Cancel</Button>
            <Button :disabled="!selectedStoreId" @click="handleAddStore">Add</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Button @click="showAddDialog = true">Add Store</Button>
    </div>

    <EmptyState
      v-if="userStoresWithData.length === 0"
      title="No Stores Yet"
      description="Build stores in your tower and assign residents to work in them!"
    >
      <Button @click="showAddDialog = true">Add Your First Store</Button>
    </EmptyState>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StoreCard
        v-for="userStore in userStoresWithData"
        :key="userStore.storeId"
        :user-store="userStore"
        :residents="residents"
        @remove-store="handleRemoveStore(userStore.storeId)"
        @remove-resident="handleRemoveResident(userStore.storeId, $event)"
      />
    </div>

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
import Button from '@/components/ui/Button.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Label from '@/components/ui/Label.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import { useUserStoresWithData } from '@/queries'
import { useResidentsStore, useStoresStore } from '@/stores'
import { useToast } from '@/utils/toast'
import { computed, ref } from 'vue'

const storesStore = useStoresStore()
const residentsStore = useResidentsStore()
const { userStores: userStoresWithData, allStores } = useUserStoresWithData()
const { residents } = residentsStore
const toast = useToast()

const showAddDialog = ref(false)
const selectedStoreId = ref('')
const showConfirmDialog = ref(false)
const confirmDialogData = ref<{
  title: string
  message: string
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  confirmText: string
  onConfirm: () => void
}>({
  title: '',
  message: '',
  variant: 'default',
  confirmText: 'Confirm',
  onConfirm: () => {},
})

const availableStores = computed(() => {
  const builtStoreIds = new Set(storesStore.userStores.map((us: { storeId: string }) => us.storeId))
  return allStores.value.filter(s => !builtStoreIds.has(s.id))
})

const availableStoreItems = computed(() => {
  return availableStores.value.map(store => ({
    value: store.id,
    label: `${store.name} (${store.category})`,
  }))
})

function handleAddStore() {
  if (selectedStoreId.value) {
    const success = storesStore.addStore(selectedStoreId.value)
    if (success) {
      const storeName = allStores.value.find(s => s.id === selectedStoreId.value)?.name
      toast.success(`Added ${storeName} to your tower`)
      selectedStoreId.value = ''
      showAddDialog.value = false
    } else {
      toast.error('Store already exists')
    }
  }
}

function handleRemoveStore(storeId: string) {
  const store = userStoresWithData.value.find((us: { storeId: string }) => us.storeId === storeId)
  if (!store) {
    return
  }

  confirmDialogData.value = {
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
  }
  showConfirmDialog.value = true
}

function handleRemoveResident(storeId: string, residentId: string) {
  const resident = residents.find((r: { id: string }) => r.id === residentId)
  if (!resident) {
    return
  }

  confirmDialogData.value = {
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
  }
  showConfirmDialog.value = true
}
</script>
