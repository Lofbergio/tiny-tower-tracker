<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent>
      <div class="flex flex-col space-y-1.5 text-center sm:text-left">
        <DialogTitle>{{ title }}</DialogTitle>
      </div>
      <div class="space-y-4">
        <div class="max-h-[50vh] overflow-auto rounded-md border p-3">
          <p class="whitespace-pre-line text-sm text-muted-foreground">{{ message }}</p>
        </div>
      </div>
      <div class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" @click="handleCancel">{{ cancelText }}</Button>
        <Button :variant="variant" @click="handleConfirm">{{ confirmText }}</Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import Button from './Button.vue'
import Dialog from './Dialog.vue'
import DialogContent from './DialogContent.vue'
import DialogTitle from './DialogTitle.vue'

withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  }>(),
  {
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default',
  }
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
  cancel: []
}>()

function handleConfirm() {
  emit('confirm')
  emit('update:open', false)
}

function handleCancel() {
  emit('cancel')
  emit('update:open', false)
}
</script>
