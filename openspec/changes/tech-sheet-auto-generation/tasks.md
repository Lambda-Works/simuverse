# Tasks: Tech Sheet Auto-Generation & UI Refactor

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~550–700 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (backend pipeline) → PR 2 (frontend refactor) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Base |
|------|------|-----------|------|
| 1 | Backend pipeline steps 8–10 + config API | PR 1 | main |
| 2 | Frontend decomposition + Lucide icons + assets UI | PR 2 | main or PR 1 |

## Phase 1: Backend — Pipeline Steps 8–10

- [x] 1.1 RED: Write failing test for step 8 module gate + non-blocking failure in `analysis-pipeline.service.spec.ts`
- [x] 1.2 GREEN: Add `buildEmailsPrompt` to `DeepSeekService` + `runStep8()` to `AnalysisPipelineService` with `email_simulado` gate
- [x] 1.3 RED: Write failing test for step 9 module gate + retry-on-parse-failure
- [x] 1.4 GREEN: Add `buildSpreadsheetPrompt` to `DeepSeekService` + `runStep9()` with `hoja_calculo` gate
- [x] 1.5 RED: Write failing test for step 10 timeout resilience
- [x] 1.6 GREEN: Add `buildCrisisPrompt` to `DeepSeekService` + `runStep10()` with `crisis_engine` gate
- [x] 1.7 Modify `AnalysisPipelineService.run()`: insert steps 8–10 after step 7; update `getFailedStep()` boundaries

## Phase 2: Backend — Config API Extension

- [x] 2.1 RED: Write test for GET /config returning `step_8_emails`/`step_9_spreadsheet`/`step_10_crisis` from `pipeline_output`
- [x] 2.2 GREEN: Extend config GET handler to merge `pipeline_output` step 8–10 keys into response
- [x] 2.3 RED: Write test for PUT /config persisting edits to `step_8_emails` without removing other keys
- [x] 2.4 GREEN: Extend config PUT handler to write step 8–10 fields into `pipeline_output`

## Phase 3: Frontend — TechSheetsABM Decomposition

- [x] 3.1 RED: Write test for `TechSheetCard` rendering Lucide icons (no emoji)
- [x] 3.2 GREEN: Create `TechSheetCard.tsx` — card layout extracted from monolith, emojis → Lucide `FileText`/`Table`/`AlertTriangle`
- [x] 3.3 GREEN: Create `TechSheetForm.tsx` — create/edit form extracted from monolith
- [x] 3.4 GREEN: Create `PipelineStatus.tsx` — progress indicator for steps 1–10 with Lucide `Mail`/`BarChart3`/`ShieldAlert`
- [x] 3.5 GREEN: Create `CompetencyEditor.tsx` + `KpiEditor.tsx` — inline editors extracted from monolith
- [x] 3.6 REFACTOR: `TechSheetsABM.tsx` imports sub-components; remove extracted code; verify zero emojis

## Phase 4: Frontend — Editable Assets UI

- [x] 4.1 RED: Write test for AssetsTab rendering editable email list with save callback
- [x] 4.2 GREEN: Add AssetsTab to `ConfigureTechSheetModal` with `EmailsSection` (editable list), `SpreadsheetSection` (columns + sample data), `CrisisSection` (scenarios)
- [x] 4.3 Extend `useAnalysisProgress.ts` — add steps 8–10 to `PIPELINE_STEPS` constant

## Phase 5: Integration Verification

- [ ] 5.1 Integration test: full pipeline run with all 3 module toggles ON → verify `pipeline_output` keys
- [ ] 5.2 Integration test: all module toggles OFF → steps 8–10 skipped, `pipeline_output` absent
- [x] 5.3 Verify: `TechSheetsABM.tsx` no emojis, line count ≤300 per sub-component
