<template>
  <ErrorBoundary>
    <TooltipProvider>
      <div class="relative min-h-screen bg-background">
        <div class="bg-grid-pattern pointer-events-none fixed inset-0" aria-hidden="true" />
        <div class="relative">
          <div
            v-show="isRouteNavigating"
            class="pointer-events-none fixed left-0 right-0 top-0 z-50"
          >
            <div
              class="h-0.5 w-full bg-transparent"
              role="progressbar"
              aria-label="Page loading"
              :aria-valuenow="Math.round(routeProgress)"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                class="h-full bg-gradient-to-r from-primary via-primary/80 to-primary transition-[width] duration-200 ease-out"
                :style="{ width: `${routeProgress}%` }"
              />
            </div>
          </div>
          <a
            href="#main-content"
            class="sr-only z-50 rounded-md bg-background px-3 py-2 text-sm font-medium text-foreground ring-2 ring-ring ring-offset-2 ring-offset-background focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
          >
            Skip to content
          </a>
          <nav :class="topNavClass">
            <div class="container mx-auto px-4">
              <div class="flex h-16 items-center justify-between">
                <div class="group flex select-none items-center gap-2">
                  <div aria-hidden="true" class="text-2xl motion-safe:group-hover:animate-jiggle">
                    🏢
                  </div>
                  <h1
                    class="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-xl font-bold text-transparent motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-[1.01]"
                  >
                    Tiny Tower Tracker
                  </h1>
                </div>
                <div class="flex items-center gap-2">
                  <DarkModeToggle class="md:hidden" />
                  <div class="flex gap-2 md:hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Toggle menu"
                      aria-controls="mobile-menu"
                      :aria-expanded="showMobileMenu"
                      @click="showMobileMenu = !showMobileMenu"
                    >
                      Menu
                    </Button>
                  </div>
                  <div class="hidden items-center gap-2 md:flex">
                    <DarkModeToggle />
                    <Button
                      v-for="navRoute in routes"
                      :key="navRoute.path"
                      :variant="currentRoute === navRoute.path ? 'default' : 'ghost'"
                      class="group relative"
                      @click="$router.push(navRoute.path)"
                    >
                      <span
                        aria-hidden="true"
                        class="mr-1 inline-block motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:animate-jiggle motion-safe:group-active:scale-110"
                      >
                        {{ navRoute.icon }}
                      </span>
                      {{ navRoute.name }}
                      <CountBadge
                        v-if="getPendingCount(navRoute.path) > 0"
                        :count="getPendingCount(navRoute.path)"
                        class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground"
                      />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <Transition name="mobile-menu">
              <div v-if="showMobileMenu" id="mobile-menu" class="border-t md:hidden">
                <div class="container mx-auto space-y-1 px-4 py-2">
                  <Button
                    v-for="menuRoute in routes"
                    :key="menuRoute.path"
                    variant="ghost"
                    class="group relative w-full justify-start"
                    @click="handleNavClick(menuRoute.path)"
                  >
                    <span
                      aria-hidden="true"
                      class="mr-2 inline-block motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-active:scale-110"
                    >
                      {{ menuRoute.icon }}
                    </span>
                    {{ menuRoute.name }}
                    <CountBadge
                      v-if="getPendingCount(menuRoute.path) > 0"
                      :count="getPendingCount(menuRoute.path)"
                      class="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground"
                    />
                  </Button>
                </div>
              </div>
            </Transition>
          </nav>

          <main id="main-content" tabindex="-1" class="min-h-[calc(100vh-4rem)]" :style="mainStyle">
            <div
              v-if="hasLoadError"
              class="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4"
            >
              <EmptyState
                title="⚠️ Couldn't load game data"
                description="The store/mission database didn't load. Check your connection and try again."
              >
                <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <Button class="w-full sm:w-auto" @click="retryLoad">Retry</Button>
                  <Button variant="outline" class="w-full sm:w-auto" @click="reloadPage">
                    Reload
                  </Button>
                </div>
                <p v-if="loadErrorMessage" class="mt-3 text-xs text-muted-foreground">
                  {{ loadErrorMessage }}
                </p>
              </EmptyState>
            </div>
            <div
              v-else-if="isLoading"
              class="flex min-h-[calc(100vh-4rem)] items-center justify-center"
              role="status"
              aria-live="polite"
            >
              <div class="text-center">
                <div
                  class="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent motion-reduce:animate-none"
                />
                <p class="text-muted-foreground">Loading your tower...</p>
              </div>
            </div>
            <RouterView v-else v-slot="{ Component }">
              <Transition name="page">
                <component :is="Component" :key="route.fullPath" />
              </Transition>
            </RouterView>
          </main>

          <!-- Mobile Bottom Navigation -->
          <div
            class="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-sm md:hidden"
          >
            <div class="grid grid-cols-4 gap-1 p-2">
              <button
                v-for="mobileRoute in routes"
                :key="mobileRoute.path"
                :class="[
                  'pressable group relative flex min-h-[60px] flex-col items-center justify-center rounded-md p-3 text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  currentRoute === mobileRoute.path
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground active:bg-accent',
                ]"
                :aria-label="`Navigate to ${mobileRoute.name}`"
                :aria-current="currentRoute === mobileRoute.path ? 'page' : undefined"
                @click="$router.push(mobileRoute.path)"
              >
                <span
                  aria-hidden="true"
                  class="inline-block text-base leading-none motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-active:scale-110"
                >
                  {{ mobileRoute.icon }}
                </span>
                <span>{{ mobileRoute.name }}</span>
                <CountBadge
                  v-if="getPendingCount(mobileRoute.path) > 0"
                  :count="getPendingCount(mobileRoute.path)"
                  class="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground"
                />
              </button>
            </div>
          </div>
          <div class="h-[72px] md:hidden" />
          <!-- Spacer for mobile nav -->
        </div>
        <Toast />
      </div>
    </TooltipProvider>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ErrorBoundary from './components/ErrorBoundary.vue'
import Button from './components/ui/Button.vue'
import CountBadge from './components/ui/CountBadge.vue'
import DarkModeToggle from './components/ui/DarkModeToggle.vue'
import EmptyState from './components/ui/EmptyState.vue'
import Toast from './components/ui/Toast.vue'
import TooltipProvider from './components/ui/TooltipProvider.vue'
import {
  useCompletableMissions,
  useMissionsQuery,
  useStoresQuery,
  useUserMissionsWithData,
} from './queries'
import { useResidentsStore } from './stores'

const router = useRouter()
const route = useRoute()
const showMobileMenu = ref(false)

const isRouteNavigating = ref(false)
const routeProgress = ref(0)
const routeNavStartedAt = ref<number | null>(null)

let progressTimer: number | null = null
let finishTimer: number | null = null

function clearRouteTimers() {
  if (progressTimer !== null) {
    window.clearInterval(progressTimer)
    progressTimer = null
  }
  if (finishTimer !== null) {
    window.clearTimeout(finishTimer)
    finishTimer = null
  }
}

function startRouteProgress() {
  clearRouteTimers()
  isRouteNavigating.value = true
  routeNavStartedAt.value = Date.now()
  routeProgress.value = 12

  progressTimer = window.setInterval(() => {
    // Ease toward 90% while navigation is pending
    const current = routeProgress.value
    if (current >= 90) return
    const next = current + (90 - current) * 0.12
    routeProgress.value = Math.min(90, Math.max(current + 0.6, next))
  }, 120)
}

function finishRouteProgress() {
  const startedAt = routeNavStartedAt.value
  const elapsed = startedAt ? Date.now() - startedAt : 0
  const minVisibleMs = 180
  const delay = Math.max(0, minVisibleMs - elapsed)

  clearRouteTimers()

  finishTimer = window.setTimeout(() => {
    routeProgress.value = 100
    window.setTimeout(() => {
      isRouteNavigating.value = false
      routeProgress.value = 0
      routeNavStartedAt.value = null
    }, 180)
  }, delay)
}

const showTopNav = ref(true)
const lastScrollY = ref(0)

const TOP_NAV_HEIGHT_PX = 64
const HIDE_AFTER_SCROLL_Y = 72
const SCROLL_DELTA_PX = 10

const topNavClass = computed(() => [
  'top-0 z-40 border-b bg-background md:bg-background/80 md:backdrop-blur-sm',
  // Fixed so we can animate it away without leaving a layout gap
  'fixed inset-x-0',
  // Slide away on scroll-down, reappear on scroll-up
  'transform-gpu transition-transform duration-200 ease-out',
  showTopNav.value ? 'translate-y-0' : '-translate-y-full',
])

const mainStyle = computed(() => {
  return {
    paddingTop: `${TOP_NAV_HEIGHT_PX}px`,
  }
})

// Preload data using Vue Query
const {
  isLoading: storesLoading,
  isError: storesIsError,
  error: storesError,
  refetch: refetchStores,
} = useStoresQuery()
const {
  isLoading: missionsLoading,
  isError: missionsIsError,
  error: missionsError,
  refetch: refetchMissions,
} = useMissionsQuery()

const isLoading = computed(() => storesLoading.value || missionsLoading.value)
const hasLoadError = computed(() => Boolean(storesIsError.value || missionsIsError.value))

const loadErrorMessage = computed(() => {
  const err = (storesError.value ?? missionsError.value) as unknown
  if (!err) return ''
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message
  try {
    return JSON.stringify(err)
  } catch {
    return ''
  }
})

function retryLoad() {
  refetchStores()
  refetchMissions()
}

function reloadPage() {
  window.location.reload()
}

function handleScroll() {
  if (showMobileMenu.value) {
    showTopNav.value = true
    lastScrollY.value = window.scrollY
    return
  }

  const currentY = window.scrollY
  const delta = currentY - lastScrollY.value

  if (currentY <= 0) {
    showTopNav.value = true
    lastScrollY.value = currentY
    return
  }

  if (Math.abs(delta) < SCROLL_DELTA_PX) return

  // Scrolling down
  if (delta > 0 && currentY > HIDE_AFTER_SCROLL_Y) {
    showTopNav.value = false
  }

  // Scrolling up
  if (delta < 0) {
    showTopNav.value = true
  }

  lastScrollY.value = currentY
}

watch(showMobileMenu, isOpen => {
  if (isOpen) showTopNav.value = true
})

onMounted(() => {
  lastScrollY.value = window.scrollY
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const removeBeforeEach = router.beforeEach((to, from) => {
  if (to.fullPath !== from.fullPath) {
    startRouteProgress()
  }
  return true
})

const removeAfterEach = router.afterEach(() => {
  finishRouteProgress()
})

router.onError(() => {
  finishRouteProgress()
})

// Get pending counts for navigation badges
const { pendingMissions } = useUserMissionsWithData()
const { completableMissions } = useCompletableMissions()
const residentsStore = useResidentsStore()

const routes = [
  { path: '/', name: 'Dashboard', icon: '📊' },
  { path: '/missions', name: 'Missions', icon: '🎯' },
  { path: '/residents', name: 'Residents', icon: '👥' },
  { path: '/stores', name: 'Stores', icon: '🏪' },
]

const currentRoute = computed(() => route.path)

watch(
  () => route.path,
  () => {
    showMobileMenu.value = false
  }
)

function handleGlobalKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    showMobileMenu.value = false
  }
}

function handleGlobalPointerDown(event: PointerEvent) {
  if (!showMobileMenu.value) return
  const target = event.target as HTMLElement | null
  if (!target) return
  // Close when clicking outside the mobile menu region and menu button.
  if (target.closest('#mobile-menu') || target.closest('[aria-controls="mobile-menu"]')) {
    return
  }
  showMobileMenu.value = false
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('pointerdown', handleGlobalPointerDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('pointerdown', handleGlobalPointerDown)
  removeBeforeEach()
  removeAfterEach()
  clearRouteTimers()
})

const residentsNeedingPlacementCount = computed(
  () => residentsStore.getResidentsNotInDreamJob().length
)

const pendingCountByPath = computed<Record<string, number>>(() => {
  return {
    '/missions': pendingMissions.value.length,
    '/residents': residentsNeedingPlacementCount.value,
    '/': completableMissions.value.length + residentsNeedingPlacementCount.value,
  }
})

function getPendingCount(path: string): number {
  return pendingCountByPath.value[path] ?? 0
}

function handleNavClick(path: string) {
  router.push(path)
  showMobileMenu.value = false
}
</script>
