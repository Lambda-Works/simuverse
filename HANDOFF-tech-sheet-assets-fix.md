# Handoff — Fix ConfigureTechSheetModal (Assets tab)

**Date**: Jul 21, 2026
**Branch**: `feature/agent-fix-and-ui-polish`
**File**: `apps/web/src/components/ConfigureTechSheetModal.tsx` (~1117 lines)

---

## Context

The analysis pipeline now successfully generates steps 8-10 (emails, spreadsheet, crisis scenarios). The data flows correctly from backend to frontend after recent fixes (commit `cc3c60f`). However, the UI rendering in the config modal has two issues.

This is a **frontend-only task** — no backend changes needed.

---

## Bug 1 — Modal closes when switching from Assets tab

**Steps to reproduce**:
1. Open "Configurar Ficha Tecnica" modal
2. Go to "Assets" tab
3. Click any other tab (Prompts, KPIs, etc.)
4. Modal closes

**Root cause**: Line 287 has `overflow-auto` on the overlay div:
```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto" onClick={onClose}>
```

When Assets tab content is tall (many emails + spreadsheet + crisis scenarios), `overflow-auto` makes the overlay scrollable. When the tab changes (content shrinks), the card shifts position and the click lands on the overlay div → `onClick={onClose}` fires → modal closes.

**Fix**:
1. Remove `overflow-auto` from the overlay div (line 287)
2. Add `max-h-[90vh] overflow-auto` to the Card (line 288):
```tsx
<Card className="w-full max-w-4xl m-4 p-6 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
```

---

## Bug 2 — Assets tab content is too small

The Assets tab compresses 3 sections (Emails, Spreadsheet, Crisis) into one tab. Each inner list has `max-h-64 overflow-auto`, making everything cramped.

**Fix**: Split into dedicated sections (see Restructure below).

---

## Restructure — Replace "Assets" with "Contenido" + 3 sub-tabs

### Current state (6-column grid)
```
Competencias | KPIs | Tareas | Prompts | Assets | Resumen
```

Inside Assets tab: 3 sections stacked vertically, each with `max-h-64`.

### Target state (6-column grid, same layout)
```
Competencias | KPIs | Tareas | Prompts | Contenido | Resumen
```

Inside Contenido tab: a nested Tabs component with 3 sub-tabs:
```
Emails (7) | Hoja Calculo | Crisis (5)
```
Each sub-tab uses full available width, no `max-h-64`.

---

## Implementation Plan

### Step 1 — Fix closing bug

Line 287: Remove `overflow-auto` from overlay div.
Line 288: Add `max-h-[90vh] overflow-auto` to Card.

### Step 2 — Rename Assets to Contenido

- Line 328: `<TabsTrigger value="assets">Assets</TabsTrigger>` → `<TabsTrigger value="contenido">Contenido</TabsTrigger>`
- Line 713: `<TabsContent value="assets">` → `<TabsContent value="contenido">`

### Step 3 — Replace Assets content with nested sub-tabs

Replace the current Assets `TabsContent` block (lines 713-1048) with:

```tsx
{/* CONTENIDO */}
<TabsContent value="contenido" className="space-y-4 mt-4">
  <h3 className="font-semibold text-lg flex items-center gap-2">
    <Package className="w-5 h-5" />
    Contenido Generado por Pipeline
  </h3>

  <Tabs defaultValue="emails" className="w-full">
    <TabsList className="grid w-full grid-cols-3">
      <TabsTrigger value="emails">
        <Mail className="w-4 h-4 mr-1" /> Emails ({config.assets.emails.length})
      </TabsTrigger>
      <TabsTrigger value="spreadsheet">
        <BarChart3 className="w-4 h-4 mr-1" /> Hoja Calculo
      </TabsTrigger>
      <TabsTrigger value="crisis">
        <ShieldAlert className="w-4 h-4 mr-1" /> Crisis ({config.assets.crisis.scenarios.length})
      </TabsTrigger>
    </TabsList>

    {/* EMAILS SUB-TAB */}
    <TabsContent value="emails" className="mt-4">
      {/* MOVE email section here (currently lines 720-821) */}
      {/* REMOVE the outer <div className="space-y-3"> wrapper — keep only the inner content */}
      {/* REMOVE <h4>Emails Simulados</h4> — sub-tab trigger already shows this */}
      {/* CHANGE max-h-64 to max-h-[55vh] or remove it entirely */}
    </TabsContent>

    {/* SPREADSHEET SUB-TAB */}
    <TabsContent value="spreadsheet" className="mt-4">
      {/* MOVE spreadsheet section here (currently lines 823-891) */}
      {/* REMOVE outer wrapper and h4 */}
      {/* CHANGE overflow-auto max-h from 64 to 55vh */}
    </TabsContent>

    {/* CRISIS SUB-TAB */}
    <TabsContent value="crisis" className="mt-4">
      {/* MOVE crisis section here (currently lines 893-1047) */}
      {/* REMOVE outer wrapper and h4 */}
      {/* CHANGE max-h-64 to max-h-[55vh] */}
    </TabsContent>
  </Tabs>
</TabsContent>
```

### Step 4 — Content section adjustments

For each of the 3 sections (Emails, Spreadsheet, Crisis), move the inner content into its sub-tab but:

1. **Remove the outer wrapper**: Delete the `<div className="space-y-3">` and `<h4>` for each section (sub-tab trigger already shows title + count)
2. **Remove `max-h-64` constraint**: Replace with `max-h-[55vh]` so content uses full space
3. **Keep ALL editing functionality intact**: add/remove buttons, Input/Textarea fields, onChange handlers
4. **Keep empty state messages**: "No hay emails generados..." cards

### Step 5 — Add Package icon import

In the lucide-react import (line ~7), add `Package`:
```tsx
import { ..., Mail, Package, ... } from 'lucide-react';
```

### Step 6 — Update Resumen tab (optional polish)

In the Resumen tab (lines 1050-1085), add cards showing email/spreadsheet/crisis counts alongside existing competency/KPI/task/prompt counts.

---

## Files to modify

| File | Changes |
|------|---------|
| `apps/web/src/components/ConfigureTechSheetModal.tsx` | All changes in this single file |

---

## Do NOT change

- `config.assets` state shape
- `fetchConfig()` logic (lines 173-239)
- `handleSaveConfig()` logic (lines 241-260)
- `mapSpreadsheet()` / `mapCrisis()` / `unmapAssets()` helpers (lines 105-146)
- Any backend files

---

## Testing

### Automated
```bash
docker compose exec web npx vitest run src/components/__tests__/ConfigureTechSheetModal.assets.test.tsx
```

May need minor test updates if the test checks for "assets" tab trigger by text. The test currently checks for lucide-react imports and emoji count — those should still pass.

### Manual
1. Start the app: `docker compose up -d`
2. Go to Fichas Técnicas
3. Open "Configurar" on any analyzed sheet
4. Switch to "Contenido" tab → verify sub-tabs render
5. Click each sub-tab → verify content displays correctly
6. Switch from Contenido to Prompts → verify modal does NOT close
7. Switch from Contenido to KPIs → verify modal does NOT close
8. Click "Editar" → verify inline editing works in all 3 sub-tabs
9. Click "Guardar Cambios" → verify save succeeds

---

## Key interfaces (for reference)

```ts
// Email config — array of these in config.assets.emails
interface EmailConfig {
  subject: string;
  body: string;
  trigger_condition: string;
  timing_minutes: number;
}

// Spreadsheet config — config.assets.spreadsheet
interface SpreadsheetColumn { header: string; type: string; }
interface SpreadsheetConfig { columns: SpreadsheetColumn[]; sample_data: unknown[]; }

// Crisis config — config.assets.crisis
interface CrisisScenario {
  trigger: string;
  description: string;
  resolution_options: string[];
}
interface CrisisConfig { scenarios: CrisisScenario[]; }
```
