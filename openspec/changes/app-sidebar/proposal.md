# Proposal: app-sidebar

## Intent

Replace the horizontal `AppNavbar` with a persistent shadcn/ui `Sidebar` for all authenticated roles. Currently every page renders its own `<AppNavbar>` individually with no shared layout — this creates duplication, limits navigation hierarchy (admin's 19 tabs overflow horizontally), and provides no structural foundation for future nav features. A sidebar gives persistent navigation, collapsible admin sub-tabs in logical groups, and a consistent shell across all roles.

## Scope

### In Scope
- Shared `(authenticated)` route group with `layout.tsx` wrapping `SidebarProvider` + `Sidebar` + `SidebarInset`
- Role-aware `AppSidebar` component: student (2 items), teacher (3), admin (4 main + 19 sub-tabs in 6 groups), ministerio (3)
- Admin's 19 tabs organized in collapsible sidebar groups (reuse `admin-nav.ts` from `feature/sidebar`)
- Mobile: Sheet overlay (built into shadcn sidebar `collapsible="offcanvas"`)
- Preserve: user info display, role badge, logout, back-to navigation (via `SidebarHeader` breadcrumb)
- Exclude full-screen pages: `/simulation/*`, `/certificate/*` remain outside the route group
- Delete `AppNavbar.tsx` after migration

### Out of Scope
- Visual redesign of individual page content areas
- Changes to simulation/certificate full-screen experiences
- Auth page modifications
- Multi-role support (pre-existing `hasRole` limitation)
- Typography/font changes (separate design system effort)

## Capabilities

### New Capabilities
- `app-sidebar`: Shared sidebar layout shell — `SidebarProvider`, role-aware nav, user footer, mobile Sheet, keyboard shortcut (Ctrl+B)
- `admin-subnav`: Admin's 19 tabs organized in 6 collapsible sidebar groups with localStorage persistence

### Modified Capabilities
_None — no existing openspec/specs to modify._

## Approach

1. **Route group**: Create `app/(authenticated)/layout.tsx` with `SidebarProvider` > `Sidebar` + `SidebarInset`. Move 5 page directories into `(authenticated)/`. Simulation, certificate, auth stay outside.
2. **AppSidebar component**: Single component receiving `role` from `useAuth()`. Renders role-specific `SidebarMenu` items. Admin role gets `AdminSubNav` with collapsible groups.
3. **Nav config**: `lib/nav-config.ts` — role-keyed nav items. Admin sub-nav reuses `ADMIN_NAV_GROUPS` from `feature/sidebar` branch with improved icons (distinct per item, not reused).
4. **User footer**: `SidebarFooter` with avatar, name, email, role badge, logout button.
5. **Back-to support**: `SidebarHeader` renders breadcrumb when page provides `backTo` prop (e.g., StudentLedger → Legajos).
6. **Page migration**: Remove `<AppNavbar>` from all 5 views. LegajosPage's 3 AppNavbar instances (loading/error/normal) collapse to zero — layout handles nav.
7. **Cleanup**: Delete `AppNavbar.tsx`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/(authenticated)/layout.tsx` | New | Shared sidebar layout wrapping all authenticated pages |
| `app/(authenticated)/*/page.tsx` | Modified | 5 page directories moved into route group |
| `components/AppSidebar.tsx` | New | Role-aware sidebar with nav groups + user footer |
| `lib/nav-config.ts` | New | Role-keyed nav item configuration |
| `lib/admin-nav.ts` | New | Admin 19-tab group config (from feature/sidebar) |
| `lib/admin-context.tsx` | New | Tab state context + localStorage persistence |
| `components/AppNavbar.tsx` | Removed | Replaced entirely by sidebar |
| `views/Dashboard.tsx` | Modified | Remove AppNavbar import + JSX |
| `views/AdminPanel.tsx` | Modified | Remove AppNavbar + 19-tab strip (~180 lines) |
| `views/EvaluationsPage.tsx` | Modified | Remove AppNavbar, move course filter to content area |
| `views/LegajosPage.tsx` | Modified | Remove 3 AppNavbar instances |
| `views/StudentLedger.tsx` | Modified | Remove AppNavbar, backTo becomes breadcrumb |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Route group restructuring breaks bookmarks/links | Low | Next.js `(group)` is URL-transparent — no URL changes |
| LegajosPage 3-instance consolidation misses edge case | Med | Test loading/error/normal states explicitly |
| TooltipProvider nesting causes duplicate tooltips | Low | shadcn pattern is documented-safe; test if issues arise |
| Admin tab state lost during migration | Low | Reuse `admin-context.tsx` with localStorage from feature/sidebar |
| Mobile UX regression (DropdownMenu → Sheet) | Med | Sheet is standard shadcn pattern; validate on real devices |

## Rollback Plan

1. Revert `(authenticated)` route group — move pages back to original paths
2. Restore `AppNavbar.tsx` and re-add imports to all 5 views
3. Delete `AppSidebar.tsx`, `nav-config.ts`, `admin-nav.ts`, `admin-context.tsx`
4. Git revert of the full commit chain

## Dependencies

- shadcn/ui `Sidebar` component (already installed)
- `feature/sidebar` branch artifacts: `admin-nav.ts`, `admin-context.tsx`, `AdminSidebar.tsx` (cherry-pick or recreate)
- `useIsMobile` hook (already exists at `hooks/use-mobile.tsx`)

## Success Criteria

- [ ] All 4 roles see correct sidebar items (student: 2, teacher: 3, admin: 4+19, ministerio: 3)
- [ ] Admin's 19 tabs accessible via collapsible sidebar groups
- [ ] Mobile: sidebar opens as Sheet overlay, closes on navigation
- [ ] User info, role badge, logout visible in sidebar footer
- [ ] Back-to navigation works (StudentLedger → Legajos)
- [ ] Simulation and certificate pages remain full-screen (no sidebar)
- [ ] `AppNavbar.tsx` deleted, zero imports remaining
- [ ] Keyboard shortcut Ctrl+B toggles sidebar
- [ ] All existing tests pass

## Review Workload Forecast

| Metric | Estimate |
|--------|----------|
| New files | ~6 (layout, AppSidebar, nav-config, admin-nav, admin-context, admin layout update) |
| Modified files | ~5 (views) + route group moves |
| Deleted files | 1 (AppNavbar.tsx) |
| Estimated additions | ~350 lines |
| Estimated deletions | ~500 lines |
| Total changed lines | ~850 |
| 400-line budget risk | **High** |
| Chained PRs recommended | **Yes** |

**Suggested PR chain:**
1. **PR 1 — Foundation** (~270 lines): New files only — `layout.tsx`, `AppSidebar.tsx`, `nav-config.ts`, `admin-nav.ts`, `admin-context.tsx`. No deletions. Testable with manual import.
2. **PR 2 — Migration** (~580 lines): Move pages to `(authenticated)/`, remove AppNavbar from all views, delete `AppNavbar.tsx`. Clean diff against PR 1.
