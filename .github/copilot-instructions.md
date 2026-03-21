# SpotyFire Copilot Instructions

This file defines the active coding rules for this repository.
Keep instructions concise, practical, and aligned with the current codebase.

## 0) Project Snapshot

- SpotyFire is a disaster-response platform for agricultural land monitoring.
- Frontend (Next.js + TypeScript) provides dashboard, alerts, reports, maps, and subscription flows.
- Backend (FastAPI) provides auth-protected APIs for properties, alerts, reports, AI assistant, and analysis.
- Priority outcomes: stable demo behavior, reliable data flow, and maintainable code.

## 1) General Priorities

- Preserve existing behavior unless a change request explicitly asks for behavior changes.
- Prefer readability and maintainability over clever code.
- Keep changes minimal and scoped to the task.
- Validate with TypeScript/build checks after structural changes.

## 2) Frontend Architecture (Current)

### UI Styling Direction

- Maintain current eco-defense visual direction.
- Primary emphasis: green accents with slate-based surfaces and clear status colors.
- Keep styling consistent with existing Tailwind utility patterns and shadcn components.
- Preserve responsive behavior for desktop and mobile.
- Avoid ad-hoc style one-offs when a shared component/utility pattern already exists.

### Service Naming

- Service files must use `NameService.ts` naming.
- Canonical service files:
  - `src/services/apiService.ts`
  - `src/services/propertyService.ts`
  - `src/services/alertService.ts`
  - `src/services/reportService.ts`
  - `src/services/subscriptionService.ts`
- Never reintroduce legacy `name.service.ts` files.

### Responsibility Split

- `ApiService` is transport-only:
  - generic HTTP methods
  - auth/header wiring
  - centralized response/error handling
- Entity-specific logic stays in entity services:
  - endpoint-specific methods
  - payload normalization
  - entity helpers
- Hooks and components must not implement transport logic directly.

### Hook and Auth Rules

- Protected requests must wait for auth readiness.
- Do not call protected endpoints without `accessToken`.
- For unauthenticated state, hooks should:
  - avoid network calls
  - clear stale data when needed
  - set loading/error state deterministically

### Data Safety

- Never trust API payload shape blindly.
- Normalize payloads in the service layer before they reach hooks/components.
- Guard array operations (`map`, `filter`, `reduce`) with array checks.

## 3) TypeScript Rules

- Keep strict typing across services, hooks, contexts, and components.
- Use domain types from `src/types/index.ts`.
- Respect union types (`PackageType`, `ReportStatus`, etc.) and narrow before assignment.
- Mock data must satisfy interfaces fully.

## 4) Import and Path Conventions

- Use `@/` absolute imports for cross-folder references.
- Keep imports aligned with current service filenames.
- Remove stale imports and unused symbols.

## 5) Clean Code Standards

- Prefer small, focused components and functions.
- Keep business logic in services/utilities, not in UI components.
- Extract repeated logic into reusable utilities/services.
- No dead code, no temporary commented blocks, no stale TODO placeholders.
- Keep naming explicit and consistent with existing patterns.

## 6) Refactor Safety

- When renaming/moving files, update all imports in the same change.
- Do not mix legacy and current architectural styles in one feature.
- Maintain internal consistency with existing hooks/services patterns.

## 7) Backend Guardrails (Minimal)

- Keep backend code modular (`routes`, `services`, `models`).
- Preserve API contracts used by the frontend unless explicitly requested.
- Prefer deterministic behavior for demo-critical paths.

## 8) Output Quality Expectations

- Deliver production-quality code by default.
- Keep responses and code edits concise.
- Avoid unnecessary explanations in code files.
