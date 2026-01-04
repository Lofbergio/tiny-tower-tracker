import { ref } from 'vue'

export interface ConfirmDialogConfig {
  title: string
  message: string
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  confirmText: string
  onConfirm: () => void
}

const defaultConfig: ConfirmDialogConfig = {
  title: '',
  message: '',
  variant: 'default',
  confirmText: 'Confirm',
  onConfirm: () => {
    // Default no-op, overridden when confirm() is called
  },
}

export function useConfirmDialog() {
  const showConfirmDialog = ref(false)
  const confirmDialogData = ref<ConfirmDialogConfig>({ ...defaultConfig })

  function confirm(config: Partial<ConfirmDialogConfig> & { title: string; message: string }) {
    confirmDialogData.value = {
      ...defaultConfig,
      ...config,
    }
    showConfirmDialog.value = true
  }

  return {
    showConfirmDialog,
    confirmDialogData,
    confirm,
  }
}
