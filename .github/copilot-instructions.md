# GitHub Copilot Instructions for Tiny Tower Tracker

## CRITICAL: Read This First

**Before making ANY changes, suggestions, or answering questions about this project:**

1. **ALWAYS read `PROJECT-OVERVIEW.md` in the root directory first**
2. This file contains complete architecture documentation, data flow, business logic, and development patterns
3. Understanding the project structure will prevent mistakes and ensure consistency

## Agent Behavior (Don’t Miss This)

- **Keep going by default.** Implement changes end-to-end (find all instances → implement → validate/build) without asking permission at each step.
- **Do not ask “should I continue?”** If the next step is obvious, proceed.
- **Only stop to ask questions when** the request is genuinely ambiguous or risky (data loss / breaking change).

## Quick Reference

- **State Management:** Pinia stores in `src/stores/index.ts` (4 stores: app, residents, stores, missions)
- **Data Fetching:** TanStack Query for static data (stores, missions from JSON files)
- **Validation:** Zod schemas in `src/utils/validation.ts`
- **Persistence:** LocalStorage with debounced saves (500ms)
- **UI Components:** Radix Vue + Tailwind CSS
- **Code Style:** Vue 3 Composition API with `<script setup>`, TypeScript strict mode
- **Package Manager:** Yarn (use `yarn`, not `npm`; e.g. `yarn dev`, `yarn build`, `yarn lint`)

## Before You Start

1. Read `PROJECT-OVERVIEW.md` for full context
2. Check `src/types/index.ts` to understand data structures
3. Review `src/stores/index.ts` for business logic
4. Follow existing patterns and conventions

## Working Style (Important)

- **Default to completing the full sweep.** When the user asks for a change, apply it **everywhere it makes sense across the project**, not just one or two files.
- **Do not pause to ask “should I continue?”** Assume the answer is **yes**.
- **Do not ask “Do you want me to do the next obvious step?”** If the next step is clearly implied by the request (e.g., applying the same UI change in the adjacent component/view where the same UI appears), just do it end-to-end.
- **Be fully autonomous by default.** When the user says “fix it” / “fix all the things” / expresses impatience with step-by-step prompts, interpret that as: do the full end-to-end work (find all instances → implement → validate/build) without asking for permission at each intermediate step.
- Only ask a question when the request is **genuinely ambiguous**, has **multiple reasonable interpretations**, or carries **non-trivial risk** (data loss, breaking changes). Otherwise, proceed end-to-end: find all instances → implement → validate/build.
- Prefer creating small, focused components/composables over bloating existing ones.

## User Preferences (Sticky)

- **Single-user app.** Optimize for what the user personally needs day-to-day.
- **Deprioritize screen-reader/a11y-only work.** Do not spend time on ARIA/screen reader tuning or accessibility-only refinements unless it also improves the user's UX (speed, clarity, mobile ergonomics) or prevents real breakage.
- **When the user states a broad preference like this, update these instructions immediately** so it doesnt get lost.

## Common Tasks

- **Adding a feature:** Update types → validation schemas → store logic → views
- **Modifying data structures:** Update `UserData` type and Zod schemas, consider data migrations
- **Creating components:** Use Radix Vue primitives, follow Tailwind conventions
- **State changes:** Always call `appStore.saveDataDebounced()` after mutations

## Code Standards

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use Composition API with `<script setup>`
- Extract reusable logic to composables
- Validate all user input with Zod
- Use Tailwind utilities over custom CSS
- Follow mobile-first responsive design

## Vue-Specific Patterns (CRITICAL - READ THIS)

**This is a Vue 3 project. DO NOT use React patterns, conventions, or utilities.**

### ✅ DO (Vue Way):

**Styling & Classes:**
- Use `:class` with arrays and computed properties:
  ```vue
  const buttonClass = computed(() => [baseClasses, variantClasses[props.variant]])
  <button :class="buttonClass">
  ```
- **Vue automatically merges classes** - NO need for `$attrs.class` or `inheritAttrs: false`!
- Conditional classes: `{ 'active': isActive }` or ternary in arrays
- Only use `defineOptions({ inheritAttrs: false })` when you need to pass attrs to a non-root element

**Props & Events:**
- Props: Just define them normally, no `className` or special handling needed
- Events: Use `@click`, `@change`, etc. (kebab-case in templates)
- Emit events with `defineEmits<{ (e: 'update:modelValue', value: string): void }>()`

**Slots & Composition:**
- Content composition: Use `<slot />` (default) or named `<slot name="header" />`
- Scoped slots: `<slot :item="item" />` not render props
- Composables: `useMyFeature()` not HOCs or hooks

**Reactivity:**
- State: `ref()`, `reactive()`, `computed()`
- Side effects: `watch()`, `watchEffect()`, not `useEffect`
- Computed values: `computed(() => ...)` not `useMemo`

### ❌ DO NOT (React Anti-Patterns):

**NEVER use these React patterns:**
- ❌ `cn()` or any class merging utility functions → Use `:class` arrays
- ❌ `className` props → Use `class` via `$attrs`
- ❌ `children` prop → Use `<slot />`
- ❌ `onClick` props → Use `@click` directive
- ❌ camelCase event props (`onChange`, `onSubmit`) → Use `@change`, `@submit`
- ❌ `style` object props → Use `:style` binding
- ❌ Render props → Use scoped slots
- ❌ HOCs (Higher Order Components) → Use composables
- ❌ `useState`/`useEffect` → Use `ref`/`watch`/`watchEffect`
- ❌ Props drilling → Use `provide`/`inject`
- ❌ `forwardRef` → Vue template refs work differently
- ❌ `React.memo` → Use `computed()`
- ❌ `useCallback`/`useMemo` → Use `computed()`
- ❌ Fragment wrappers → Templates don't need them
- ❌ `dangerouslySetInnerHTML` → Use `v-html`
- ❌ `htmlFor` → Use `for` directly
- ❌ Manual class string concatenation → Use `:class` binding
- ❌ Spreading props like `{...props}` → Use `v-bind="$attrs"`
- ❌ Using `$attrs.class` with `inheritAttrs: false` for basic components → Vue merges classes automatically!
- ❌ Disabling `inheritAttrs` when you don't need to → Let Vue handle it naturally

### Correct Vue Examples:

**Class Binding (Study Existing Components):**
```vue
<!-- Simple: Computed class array -->
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ variant?: 'default' | 'destructive' }>()

const baseClasses = 'inline-flex items-center rounded-md'
const variantClasses = {
  default: 'bg-primary text-white',
  destructive: 'bg-red-500 text-white',
}

const buttonClass = computed(() => [
  baseClasses,
  variantClasses[props.variant ?? 'default'],
])
</script>

<template>
  <button :class="buttonClass">
    <slot />
  </button>
</template>
```

**Class Merging (Automatic in Vue!):**
```vue
<!-- Vue automatically merges parent classes with component classes -->
<template>
  <!-- Component defines base classes -->
  <div class="flex items-center gap-2">
    <slot />
  </div>
</template>

<!-- Usage: Parent passes additional classes -->
<!-- <MyComponent class="mt-4 bg-red-500" /> -->
<!-- Result: div will have "flex items-center gap-2 mt-4 bg-red-500" -->

<!-- NO $attrs.class needed! NO inheritAttrs: false needed! Vue does this automatically! -->
```

**Only use `inheritAttrs: false` when you have a non-root target:**
```vue
<!-- Example: Passing attrs to a child element, not root -->
<script setup lang="ts">
defineOptions({ inheritAttrs: false })
</script>

<template>
  <div class="wrapper">
    <!-- Attrs go here, not on wrapper -->
    <button v-bind="$attrs">
      <slot />
    </button>
  </div>
</template>
```

**Events:**
```vue
<!-- Emit properly typed events -->
<script setup lang="ts">
interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}
const emit = defineEmits<Emits>()

function handleChange(value: string) {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<template>
  <input @input="handleChange($event.target.value)" />
</template>
```

### How to Spot React Code:

**RED FLAGS - If you see ANY of these, it's React code:**
1. Function calls for class merging: `cn(...)`, `clsx(...)`, `classNames(...)`
2. Props named `className`, `onClick`, `onChange`, `children`
3. Utility functions that filter/join classes
4. Template code that looks like JSX
5. Comments mentioning React, shadcn/ui (React version), or Next.js

**When in doubt:** Look at existing components (`Button.vue`, `Badge.vue`, `Card.vue`) and follow those patterns exactly.

---

**Remember: Read PROJECT-OVERVIEW.md before making changes!**
