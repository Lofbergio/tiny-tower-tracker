import { APP_CONSTANTS } from '@/constants'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration: number
}

const toasts = ref<Toast[]>([])

let toastIdCounter = 0

export function useToast() {
  function showToast(
    message: string,
    type: ToastType = 'info',
    duration = APP_CONSTANTS.TOAST_DURATION
  ) {
    const id = `toast-${++toastIdCounter}`
    const toast: Toast = {
      id,
      message,
      type,
      duration,
    }

    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id)
      }, duration)
    }

    return id
  }

  function dismissToast(id: string) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  function success(message: string, duration = APP_CONSTANTS.TOAST_DURATION) {
    return showToast(message, 'success', duration)
  }

  function error(message: string, duration = APP_CONSTANTS.TOAST_DURATION) {
    return showToast(message, 'error', duration)
  }

  function warning(message: string, duration = APP_CONSTANTS.TOAST_DURATION) {
    return showToast(message, 'warning', duration)
  }

  function info(message: string, duration = APP_CONSTANTS.TOAST_DURATION) {
    return showToast(message, 'info', duration)
  }

  return {
    toasts,
    showToast,
    dismissToast,
    success,
    error,
    warning,
    info,
  }
}
