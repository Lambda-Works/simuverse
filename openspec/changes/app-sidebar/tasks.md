# Tasks: app-sidebar

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~850 (380 new, ~470 removed/modified) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 Foundation (~270 new) → PR 2 Migration (~580) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation — all new files, zero deletions | PR 1 | base=main; TDD for core components; ~270 lines |
| 2 | Migration — move pages, remove AppNavbar from 5 views, delete file | PR 2 | base=main (after PR 1 merged); mostly mechanical moves/deletions; ~580 lines |

## Phase 1: Foundation

- [x] 1.1 RED: Write vitest — nav-config has items for all 4 roles; admin-nav has 6 groups × 19 items
- [x] 1.2 GREEN: Create `lib/nav-config.ts` — `ROLE_NAV: Record<AppRole, NavItem[]>`
- [x] 1.3 GREEN: Create `lib/admin-nav.ts` — `ADMIN_NAV_GROUPS` (6 groups, 19 items, Lucide icons)
- [x] 1.4 RED: Write vitest — admin-context localStorage set/get/persist roundtrip + default "Courses"
- [x] 1.5 GREEN: Create `lib/admin-context.tsx` — `useAdminContext` + `AdminProvider` + localStorage
- [x] 1.6 RED: Write vitest — sidebar-header-context backTo state management
- [x] 1.7 GREEN: Create `lib/sidebar-header-context.tsx` — `SidebarHeaderProvider` + `useSidebarHeader`
- [x] 1.8 RED: Write integration — AppSidebar renders correct items per role; admin groups toggle + auto-expand
- [x] 1.9 GREEN: Create `components/AppSidebar.tsx` — role router, admin sub-nav, user footer, active state
- [x] 1.10 Create `app/(authenticated)/layout.tsx` — `SidebarProvider` > `Sidebar` + `SidebarInset`

## Phase 2: Migration

- [x] 2.1 Move pages: dashboard, admin, evaluations, legajos, student-ledger into `(authenticated)/` group
- [x] 2.2 `Dashboard.tsx` — remove `AppNavbar` import + JSX; remove admin `rightContent` button
- [x] 2.3 `EvaluationsPage.tsx` — remove `AppNavbar` import + JSX
- [x] 2.4 `LegajosPage.tsx` — remove 3 `AppNavbar` instances (loading/error/normal states)
- [x] 2.5 `StudentLedger.tsx` — remove `AppNavbar`; add breadcrumb row via `useSidebarHeader().setBackTo()`
- [x] 2.6 `AdminPanel.tsx` — strip `AppNavbar` + 19-tab strip (~190 lines removed); consume `useAdminContext()` for tab state

## Phase 3: Cleanup

- [x] 3.1 Delete `components/AppNavbar.tsx`
- [x] 3.2 Verify zero `AppNavbar` imports across all files — `rg "from.@/components/AppNavbar"` returns nothing

## Phase 4: Verify

- [x] 4.1 Run full vitest suite — all unit + integration tests pass
- [ ] 4.2 Verify manual scenarios: mobile Sheet overlay, Ctrl+B toggle, role badge + logout in footer
- [ ] 4.3 Verify simulation, certificate, auth pages load full-screen (no sidebar)
