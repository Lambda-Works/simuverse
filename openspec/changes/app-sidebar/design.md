# Design: app-sidebar

## Technical Approach

Create an `(authenticated)` route group with a shared `layout.tsx` that wraps all authenticated pages in `SidebarProvider > Sidebar + SidebarInset`. The `Sidebar` contains a role-aware `AppSidebar` component: brand header, role-specific nav items from `lib/nav-config.ts`, and (for admin) collapsible sub-groups from `lib/admin-nav.ts` backed by `lib/admin-context.tsx`. All views remove their individual `<AppNavbar>` imports. Simulation, certificate, and auth pages stay outside the group.

## Architecture Decisions

| Decision | Options | Tradeoffs | Choice |
|---|---|---|---|
| Route group pattern | `(authenticated)` group / per-page layout | Group eliminates duplication; URL-transparent in Next.js | **Route group** — `(authenticated)/layout.tsx` |
| Sidebar variant | sidebar / floating / inset | Inset requires margin/padding recalculation across all views; sidebar is simplest drop-in | **Sidebar** (default), left side, `collapsible="icon"` desktop |
| Admin sub-nav UX | Accordion / always-visible / independent collapsible | Accordion limits scanning; always-visible overwhelms. Independent groups match admin mental model | **Independent collapsible groups** with chevron; auto-expand active group; localStorage persistence |
| Mobile strategy | Sheet (shadcn native) / custom Drawer | shadcn sidebar already renders Sheet on `isMobile` | **Native Sheet** via built-in `collapsible="offcanvas"` |
| Role badge placement | Footer / header | Header competes with brand; footer groups user metadata | **Footer** — next to name/email |
| Back navigation | Sidebar header / page-level breadcrumb | Back is page-specific; sidebar header is global | **Page-level breadcrumb** via `lib/sidebar-header-context.tsx` (pages set `backTo`, header reads it) |
| Typography & color | Custom tokens / shadcn semantic | Project uses shadcn sidebar primitives with `sidebar-*` tokens | **Semantic tokens only** — `cn()` for conditionals, `size-*` for icons, `flex gap-*`, no raw colors |

## Data Flow

```
(authenticated)/layout.tsx
├── SidebarProvider
│   ├── AppSidebar (reads role from useAuth)
│   │   ├── SidebarHeader (brand + optional back breadcrumb)
│   │   ├── SidebarContent
│   │   │   ├── RoleNavItems (from nav-config.ts)
│   │   │   └── AdminSubNav (from admin-nav.ts + admin-context.tsx)
│   │   └── SidebarFooter (user, role badge, logout)
│   └── SidebarInset
│       ├── Mobile header with SidebarTrigger
│       └── {children} (page content)
```

## File Changes

| File | Action | Description | Est. Lines |
|---|---|---|---|
| `app/(authenticated)/layout.tsx` | Create | SidebarProvider + Sidebar + SidebarInset wrapper | ~40 |
| `components/AppSidebar.tsx` | Create | Role-aware sidebar; admin sub-nav groups | ~120 |
| `lib/nav-config.ts` | Create | Role-keyed top-level nav items | ~40 |
| `lib/admin-nav.ts` | Create | 6 admin groups, 19 items, distinct Lucide icons per item | ~90 |
| `lib/admin-context.tsx` | Create | Tab state + localStorage persistence | ~55 |
| `lib/sidebar-header-context.tsx` | Create | `backTo` / `backLabel` context for breadcrumb | ~35 |
| `app/dashboard/page.tsx` | Move | → `app/(authenticated)/dashboard/page.tsx` | — |
| `app/admin/page.tsx` | Move | → `app/(authenticated)/admin/page.tsx` | — |
| `app/evaluations/page.tsx` | Move | → `app/(authenticated)/evaluations/page.tsx` | — |
| `app/legajos/page.tsx` | Move | → `app/(authenticated)/legajos/page.tsx` | — |
| `app/student-ledger/[userId]/page.tsx` | Move | → `app/(authenticated)/student-ledger/[userId]/page.tsx` | — |
| `views/Dashboard.tsx` | Modify | Remove `AppNavbar` import + JSX; remove admin `rightContent` button | ~−15 |
| `views/AdminPanel.tsx` | Modify | Remove `AppNavbar` + 19-tab strip; lift tab state to `useAdmin()` | ~−190, +15 |
| `views/EvaluationsPage.tsx` | Modify | Remove `AppNavbar`; course filter stays in content | ~−15 |
| `views/LegajosPage.tsx` | Modify | Remove 3 `AppNavbar` instances (loading/error/normal) | ~−25 |
| `views/StudentLedger.tsx` | Modify | Remove `AppNavbar`; add breadcrumb row using header context | ~−15, +20 |
| `components/AppNavbar.tsx` | Delete | Replaced by sidebar | ~−269 |

## Interfaces / Contracts

```typescript
// lib/nav-config.ts
export interface NavItem { label: string; href: string; icon: LucideIcon; }
export const ROLE_NAV: Record<AppRole, NavItem[]>;

// lib/admin-nav.ts
export interface AdminNavItem  { id: string; label: string; icon: LucideIcon; }
export interface AdminNavGroup { id: string; label: string; icon: LucideIcon; items: AdminNavItem[]; }
export const ADMIN_NAV_GROUPS: AdminNavGroup[];

// lib/admin-context.tsx
interface AdminContextValue {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingCount: number;
  setPendingCount: (count: number) => void;
}

// lib/sidebar-header-context.tsx
interface SidebarHeaderContextValue {
  backTo?: string;
  backLabel?: string;
  setBackTo: (to?: string, label?: string) => void;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | `nav-config.ts` role coverage | Snapshot: every role has ≥1 item, admin has 6 groups |
| Unit | `admin-context.tsx` localStorage | Render hook, set tab, assert storage + restoration |
| Integration | `AppSidebar` per-role items | Mock `useAuth` with each role, assert DOM |
| Integration | Admin group toggle + persistence | Click chevron, reload, assert expanded state |
| E2E | Mobile Sheet opens/closes | Playwright: mobile viewport, trigger, overlay, navigate, closed |
| E2E | Keyboard shortcut `Ctrl+B` | Playwright: keypress, assert `data-state` toggles |

## Migration / Rollout

1. **PR 1 — Foundation** (~270 lines): Create all new files. No deletions. Testable by temporary import.
2. **PR 2 — Migration** (~580 lines): Move pages into `(authenticated)/`, remove `AppNavbar` from views, delete `AppNavbar.tsx`. AdminPanel consumes `useAdmin()`.

## Open Questions

- None — prior art from `feature/sidebar` validates group, context, and localStorage patterns.
