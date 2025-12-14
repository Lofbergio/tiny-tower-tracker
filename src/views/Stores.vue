<template>
  <div class="container mx-auto p-4 pb-20 md:pb-4">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="mb-1 text-3xl font-bold">Stores</h1>
        <p class="text-muted-foreground text-sm">Build and manage stores in your tower</p>
      </div>
      <Dialog :open="showAddDialog" @update:open="showAddDialog = $event">
        <DialogHeader>
          <DialogTitle>Add Store</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div class="space-y-4">
            <div>
              <Label class="mb-2 block">Select Store</Label>
              <Select v-model="selectedStoreId" placeholder="Choose a store...">
                <SelectItem v-for="store in availableStores" :key="store.id" :value="store.id">
                  {{ store.name }} ({{ store.category }})
                </SelectItem>
              </Select>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" @click="showAddDialog = false">Cancel</Button>
          <Button @click="handleAddStore" :disabled="!selectedStoreId">Add</Button>
        </DialogFooter>
      </Dialog>
      <Button @click="showAddDialog = true">Add Store</Button>
    </div>

    <EmptyState
      v-if="userStores.length === 0"
      title="No Stores Yet"
      description="Build stores in your tower and assign residents to work in them!"
    >
      <Button @click="showAddDialog = true">Add Your First Store</Button>
    </EmptyState>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StoreCard
        v-for="userStore in userStores"
        :key="userStore.storeId"
        :user-store="userStore"
        :residents="residents"
        @remove-store="handleRemoveStore(userStore.storeId)"
        @remove-resident="handleRemoveResident(userStore.storeId, $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import StoreCard from '@/components/StoreCard.vue'
import Button from '@/components/ui/Button.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogFooter from '@/components/ui/DialogFooter.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Label from '@/components/ui/Label.vue'
import Select from '@/components/ui/Select.vue'
import SelectItem from '@/components/ui/SelectItem.vue'
import { useResidents } from '@/composables/useResidents'
import { loadStores, useStores } from '@/composables/useStores'
import { computed, onMounted, ref } from 'vue'

const { userStores, allStores, addStore, removeStore, removeResidentFromStore } = useStores()
const { residents } = useResidents()

const showAddDialog = ref(false)
const selectedStoreId = ref('')

const availableStores = computed(() => {
  const builtStoreIds = new Set(userStores.value.map(us => us.storeId))
  return allStores.value.filter(s => !builtStoreIds.has(s.id))
})

function handleAddStore() {
  if (selectedStoreId.value) {
    addStore(selectedStoreId.value)
    selectedStoreId.value = ''
    showAddDialog.value = false
  }
}

function handleRemoveStore(storeId: string) {
  removeStore(storeId)
}

function handleRemoveResident(storeId: string, residentId: string) {
  removeResidentFromStore(storeId, residentId)
}

onMounted(async () => {
  await loadStores()
})
</script>
