# app-sidebar Specification

## Purpose

Defines behavioral requirements for replacing the per-page `AppNavbar` with a persistent shadcn/ui `Sidebar` wrapping all authenticated pages. Covers shared layout, role-aware navigation, admin sub-groups, mobile/desktop behavior, user footer, back navigation, active state, tab persistence, and full-screen exclusion.

---

## Requirements

### Requirement: Authenticated Route Group Layout

The system SHALL provide a `(authenticated)` route group layout wrapping all authenticated pages with `SidebarProvider` > `Sidebar` + `SidebarInset`. Pages under `/simulation/*`, `/certificate/*`, and `/auth/*` SHALL NOT be wrapped.

#### Scenario: Authenticated page renders with sidebar

- GIVEN an authenticated user navigates to `/dashboard`
- WHEN the page renders
- THEN the `Sidebar` SHALL be visible alongside page content within `SidebarInset`

#### Scenario: Simulation page renders without sidebar

- GIVEN any user navigates to `/simulation/SEGUROS_01`
- WHEN the page renders
- THEN no `Sidebar` SHALL be present — the page SHALL render full-screen

#### Scenario: Certificate page renders without sidebar

- GIVEN any user navigates to `/certificate/abc123`
- WHEN the page renders
- THEN no `Sidebar` SHALL be present — the page SHALL render full-screen

---

### Requirement: Role-Aware Navigation Items

The system SHALL display navigation items based on the authenticated user's role.

| Role | Items |
|------|-------|
| student | Dashboard |
| teacher | Dashboard, Evaluations, Legajos |
| admin | Dashboard, Admin, Evaluations, Legajos + 19 admin sub-tabs |
| ministerio | Dashboard, Evaluations, Legajos |

#### Scenario: Student sees 1 item

- GIVEN a user with role `student`
- WHEN the sidebar renders
- THEN exactly 1 navigation item SHALL be visible: Dashboard

#### Scenario: Teacher sees 3 items

- GIVEN a user with role `teacher`
- WHEN the sidebar renders
- THEN exactly 3 items SHALL be visible: Dashboard, Evaluations, Legajos

#### Scenario: Admin sees main items plus sub-nav

- GIVEN a user with role `admin`
- WHEN the sidebar renders
- THEN 4 main items SHALL be visible (Dashboard, Admin, Evaluations, Legajos)
- AND the Admin item SHALL expand to reveal 19 sub-tabs in 6 collapsible groups

#### Scenario: Ministerio sees 3 items

- GIVEN a user with role `ministerio`
- WHEN the sidebar renders
- THEN exactly 3 items SHALL be visible: Dashboard, Evaluations, Legajos

---

### Requirement: Admin Sub-Navigation Groups

The system SHALL organize 19 admin sub-tabs into 6 collapsible groups.

| Group | Items |
|-------|-------|
| Content & Config | Courses, Categories, Scenarios, Templates, Documents, Tech Sheets |
| AI & Simulation | Prompt Templates, Sessions |
| Users & Access | Users, Roles, Groups, Requests |
| Operations | Assignments, Calendar |
| Analysis | Reports, Stats |
| Organization | Companies, Foundation, Endorsers |

#### Scenario: All 19 tabs accessible via groups

- GIVEN the admin sidebar is rendered
- WHEN all 6 groups are expanded
- THEN all 19 admin sub-tabs SHALL be visible as clickable items

#### Scenario: Group collapse hides children

- GIVEN the "AI & Simulation" group is expanded
- WHEN the user clicks the group header
- THEN the 2 child items SHALL be hidden

---

### Requirement: Mobile Sheet Overlay

On viewports below the mobile breakpoint, the sidebar SHALL render as a Sheet overlay (`collapsible="offcanvas"`). The Sheet SHALL close automatically on navigation.

#### Scenario: Mobile opens sidebar as Sheet

- GIVEN viewport is below mobile breakpoint
- WHEN the user taps the sidebar trigger
- THEN the sidebar SHALL slide in as a Sheet overlay with dimmed backdrop

#### Scenario: Mobile Sheet closes on item selection

- GIVEN the mobile Sheet is open
- WHEN the user selects a navigation item
- THEN the Sheet SHALL close and the selected page SHALL render

---

### Requirement: User Info Footer

The `SidebarFooter` SHALL display the user's name, email, role badge, and a logout button.

#### Scenario: Footer shows user info

- GIVEN an authenticated user "Maria Lopez" with role `teacher`
- WHEN the sidebar renders
- THEN the footer SHALL display "Maria Lopez", her email, a "Docente" badge, and a logout button

#### Scenario: Logout triggers sign out

- GIVEN the sidebar footer is visible
- WHEN the user clicks logout
- THEN `signOut()` SHALL be called and the user SHALL be redirected to `/auth`

---

### Requirement: Back Navigation Breadcrumb

When a page provides `backTo` context, the `SidebarHeader` SHALL render a breadcrumb with a back link.

#### Scenario: Breadcrumb shows back link

- GIVEN the user navigates to `/student-ledger/user-123`
- WHEN the sidebar renders
- THEN a breadcrumb SHALL display with "Legajos" as a clickable link to `/legajos`

---

### Requirement: Active State Highlighting

The active navigation item SHALL be visually distinguished. For admin sub-tabs, the group containing the active item SHALL auto-expand.

#### Scenario: Active item highlighted

- GIVEN the user is on `/evaluations`
- WHEN the sidebar renders
- THEN the "Evaluations" item SHALL have active styling

#### Scenario: Admin group auto-expands for active item

- GIVEN the user navigates to the "Roles" admin tab
- WHEN the sidebar renders
- THEN the "Users & Access" group SHALL auto-expand

---

### Requirement: Admin Tab State Persistence

The selected admin tab SHALL persist in `localStorage`. On reload, the last active tab SHALL be restored.

#### Scenario: Tab persists across reload

- GIVEN the admin is on the "Companies" tab
- WHEN the page is reloaded
- THEN the "Companies" tab SHALL remain active

#### Scenario: First visit defaults to Courses

- GIVEN no stored admin tab state
- WHEN the admin visits `/admin` for the first time
- THEN the "Courses" tab SHALL be active

---

### Requirement: Keyboard Shortcut

The sidebar SHALL toggle via Ctrl+B (Cmd+B on Mac) using the shadcn `SidebarProvider` built-in.

#### Scenario: Ctrl+B toggles sidebar

- GIVEN the sidebar is expanded
- WHEN the user presses Ctrl+B
- THEN the sidebar SHALL collapse

---

### Requirement: AppNavbar Removal

After migration, `AppNavbar.tsx` SHALL be deleted with zero remaining imports.

#### Scenario: Zero AppNavbar imports

- GIVEN the migration is complete
- WHEN the codebase is searched for `AppNavbar` imports
- THEN zero results SHALL be found
