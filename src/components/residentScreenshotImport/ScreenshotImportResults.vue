<template>
  <Transition
    appear
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="opacity-0 translate-y-1"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
    @before-enter="onResultsBeforeEnter"
    @enter="onResultsEnter"
    @after-enter="onResultsAfterEnter"
    @before-leave="onResultsBeforeLeave"
    @leave="onResultsLeave"
  >
    <div v-if="visible" class="w-full min-w-0 space-y-3">
      <div class="rounded-md bg-muted p-3">
        <div class="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            Found <span class="font-medium">{{ candidates.length }}</span> residents. Selected
            <span class="font-medium">{{ selectedCount }}</span
            >.
          </div>
          <div class="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              class="w-full sm:w-auto"
              @click="$emit('select-all-matched')"
            >
              Select matched
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="w-full sm:w-auto"
              @click="$emit('select-none')"
            >
              Select none
            </Button>
          </div>
        </div>
      </div>

      <div class="w-full min-w-0 overflow-hidden rounded-md border">
        <TransitionGroup
          tag="div"
          class="w-full min-w-0"
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
          move-class="transition-transform duration-200"
        >
          <label
            v-for="(c, idx) in candidates"
            :key="`${c.sourceFileName}-${idx}`"
            class="flex min-w-0 items-start gap-3 border-b p-4 transition-colors duration-150 last:border-b-0 sm:p-3"
            :style="{ transitionDelay: `${Math.min(idx, 12) * 25}ms` }"
            :class="
              !c.name || !c.dreamJobStoreId
                ? 'cursor-not-allowed opacity-60'
                : c.selected
                  ? 'cursor-pointer bg-muted/40 hover:bg-muted/50 active:bg-muted/60'
                  : 'cursor-pointer hover:bg-muted/30 active:bg-muted/60'
            "
          >
            <div class="-m-2 p-2">
              <input
                :checked="c.selected"
                type="checkbox"
                class="mt-0.5 h-6 w-6 rounded border-input bg-background text-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:mt-1 sm:h-4 sm:w-4"
                :disabled="!c.name || !c.dreamJobStoreId"
                :aria-label="`Select ${c.name}`"
                @change="onToggle(idx, $event)"
              />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="break-words font-medium">{{ c.name || c.nameRaw }}</span>
                <span
                  v-if="showImportSourceFile"
                  class="min-w-0 break-all text-xs text-muted-foreground"
                  >({{ c.sourceFileName }})</span
                >
              </div>
              <div class="text-sm">
                <span class="text-muted-foreground">Dream job:</span>
                <span class="ml-1 break-words font-medium">
                  {{ c.matchedStoreName ?? c.dreamJobRaw }}
                </span>
              </div>
              <div v-if="c.currentJobRaw || c.currentJobStoreId" class="text-sm">
                <span class="text-muted-foreground">Current job:</span>
                <span class="ml-1 break-words font-medium">
                  {{ c.matchedCurrentStoreName ?? c.currentJobRaw ?? 'Unknown' }}
                </span>
              </div>
              <div v-if="c.issues.length > 0" class="mt-1 text-xs text-destructive">
                {{ c.issues[0] }}
              </div>
            </div>
          </label>
        </TransitionGroup>
      </div>

      <Button
        class="w-full"
        :disabled="selectedCount === 0 || isImporting"
        @click="$emit('import-selected')"
      >
        Import {{ selectedCount }} Residents
      </Button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import Button from '@/components/ui/Button.vue'
import type { ScreenshotResidentCandidate } from '@/utils/residentScreenshotImport'

defineProps<{
  visible: boolean
  candidates: ScreenshotResidentCandidate[]
  showImportSourceFile: boolean
  selectedCount: number
  isImporting: boolean
}>()

const emit = defineEmits<{
  (e: 'select-all-matched'): void
  (e: 'select-none'): void
  (e: 'set-selected', payload: { index: number; selected: boolean }): void
  (e: 'import-selected'): void
}>()

function onToggle(index: number, event: Event) {
  const target = event.target as HTMLInputElement
  emit('set-selected', { index, selected: target.checked })
}

function onResultsBeforeEnter(el: Element) {
  const element = el as HTMLElement
  element.style.height = '0px'
  element.style.overflow = 'hidden'
}

function onResultsEnter(el: Element, done: () => void) {
  const element = el as HTMLElement
  const targetHeight = element.scrollHeight

  requestAnimationFrame(() => {
    element.style.height = `${targetHeight}px`
  })

  element.addEventListener('transitionend', done, { once: true })
}

function onResultsAfterEnter(el: Element) {
  const element = el as HTMLElement
  element.style.height = 'auto'
  element.style.overflow = 'visible'
}

function onResultsBeforeLeave(el: Element) {
  const element = el as HTMLElement
  element.style.height = `${element.scrollHeight}px`
  element.style.overflow = 'hidden'
}

function onResultsLeave(el: Element, done: () => void) {
  const element = el as HTMLElement
  void element.offsetHeight

  requestAnimationFrame(() => {
    element.style.height = '0px'
  })

  element.addEventListener('transitionend', done, { once: true })
}
</script>
