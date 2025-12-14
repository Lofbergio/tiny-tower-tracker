# Tiny Tower Tracker - Project Overview

**Last Updated:** December 14, 2025

## TL;DR

- Local-first Vue 3 + TypeScript SPA for tracking Tiny Tower missions, stores, and residents.
- Static game data comes from `public/db-store.json` + `public/db-mission.json` via TanStack Query (cached forever).
- User data lives in localStorage (validated + migrated on load) and is mutated through Pinia stores.

## Development Tips for AI Agents

### Autonomy Defaults (Read This)

- Default behavior: do the full end-to-end sweep (find all instances → implement → validate/build) without pausing to ask to continue.
- Only stop to ask a question if the request is ambiguous or has meaningful risk (data loss, breaking changes).
- Keep changes small and consistent with existing patterns.

## Where Things Live (Start Here)

- Pinia business logic: `src/stores/index.ts`
- Types: `src/types/index.ts`
- Validation + migrations: `src/utils/validation.ts` and `useAppStore.loadData()`
- Static data queries + joins: `src/queries/index.ts`
- Mission logic: `src/utils/missionMatcher.ts`

## Architecture (Concise)

### Data model

- Static:
  - `Store` (id, name, category, products)
  - `Mission` (id, requirements, reward)
- User:
  - Stores: `{ storeId, residents: string[] }`
  - Residents: `{ id, name, dreamJob }`
  - Missions: `{ missionId, status, addedAt }`

Full shapes are defined in `src/types/index.ts`.

### Storage + validation

- localStorage key: `tiny-tower-tracker-data`
- Load path: `useAppStore.loadData()`
  - Parses JSON, validates via Zod, applies small migrations/cleanup.
- Save path:
  - Domain stores mutate `appStore.data` and call `appStore.saveDataDebounced()` (500ms) after changes.

### State management

- `useAppStore`: owns the `UserData` object, load/save, import/export/reset, and migrations.
- `useResidentsStore`: CRUD residents + placement helpers.
- `useStoresStore`: CRUD stores + resident assignment (enforces capacity).
- `useMissionsStore`: mission tracking + status transitions.

### Static data fetching

- TanStack Query fetches the JSON once and caches forever.
- Computed query hooks join static data with user state (see `src/queries/index.ts`).

## Core Rules / Invariants

- Max residents per store: 3 (`APP_CONSTANTS.MAX_STORE_CAPACITY`).
- Mission “completable” logic checks store presence + product mapping; it does not require staffing/stock.
- Single-user app: no accounts, no backend, no analytics.

## UI Surface (High-level)

- Pages: Dashboard, Stores, Residents, Missions (see `src/views/*`).
- Root layout + navigation live in `src/App.vue`.
- UI primitives live in `src/components/ui/*` (Radix Vue + Tailwind).

## Commands

- Dev: `yarn dev`
- Typecheck + build: `yarn build`
- Lint: `yarn lint`
- Format check: `yarn format:check`

## Related Docs

- Detailed changes/history: `IMPROVEMENTS.md`
- Mobile UX notes: `MOBILE-UX-IMPROVEMENTS.md`
- Visual polish ideas: `VISUAL-ENHANCEMENTS.md`

6. Undo/redo functionality
7. Multi-tower support (multiple save slots)
8. VIP tracking
9. Roof management
10. Floor ordering/organization

## Testing Notes

Currently **no automated tests** are implemented. Manual testing covers:

- CRUD operations for all entities
- Data persistence across page reloads
- Import/export functionality
- Dark mode toggle
- Mobile responsive design
- Error handling and validation

## Development Tips for AI Agents

### Autonomy Defaults (Read This)

- **Assume the user wants you to proceed end-to-end.** Don’t stop after analysis; implement + validate.
- **Do not ask “Should I continue?”** If the next step is the obvious continuation, just do it.
- **Apply changes everywhere they logically belong.** If a UI/logic pattern appears in multiple views/components, update all relevant instances.
- **Only ask questions when truly necessary:** ambiguous requirements, multiple valid interpretations, or real risk (data loss / breaking change).
- **When the user is terse (“yes”, “do it”, “ffs yes to all”)** interpret it as: keep going and finish the full sweep.

### When Adding Features

1. Always update TypeScript types first in `src/types/index.ts`
2. Add validation schemas in `src/utils/validation.ts`
3. Implement store logic in `src/stores/index.ts`
4. Create/update views in `src/views/`
5. Add constants to `src/constants/index.ts`
6. Update this documentation

### Code Style Preferences

- Use Composition API with `<script setup>`
- Prefer `const` over `let`
- Use TypeScript strict mode
- Extract reusable logic to composables
- Keep components focused and single-purpose
- Use Tailwind utilities over custom CSS
- Follow Vue 3 best practices
- Use Radix Vue for accessible components

### Common Patterns

**Computed State from Stores:**

```typescript
const { residents } = useResidentsStore()
const currentStore = computed(() => residentsStore.getCurrentStore(residentId))
```

**Debounced Save:**

```typescript
appStore.saveDataDebounced() // Use this in stores
```

**Toast Notifications:**

```typescript
const toast = useToast()
toast.success('Mission completed!')
toast.error('Store is full')
```

**Confirm Dialogs:**

```typescript
const { confirm } = useConfirmDialog()
const confirmed = await confirm({
  title: 'Delete Resident?',
  message: 'This action cannot be undone',
  variant: 'destructive',
})
if (confirmed) {
  /* do delete */
}
```

## Key Files to Review First

When joining this project or debugging issues, review these files in order:

1. `src/types/index.ts` - Understand data structures
2. `src/stores/index.ts` - Core business logic
3. `src/queries/index.ts` - Data fetching patterns
4. `src/constants/index.ts` - App configuration
5. `src/App.vue` - Navigation and layout
6. `src/views/Dashboard.vue` - Main user flow

---

**Project Maintained By:** AI-assisted development  
**License:** MIT  
**Game:** Tiny Tower Classic (by NimbleBit)
