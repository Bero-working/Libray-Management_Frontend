# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Preferred package manager and common commands

- Use `npm`. A root `package-lock.json` is committed.
- Install dependencies: `npm ci`
- Start dev server: `npm run dev`
- Build production app: `npm run build`
- Run lint: `npm run lint`
- Start production server: `npm run start`
- There is currently no project test runner configured in `package.json`, so there is no project-level `npm test` or single-test command yet.

## What is actually the source of truth

- `README.md` is still the default create-next-app README. Do not treat it as the product or architecture spec.
- The real application contract currently lives in:
  - `docs/SRS.md` — requirements, actors, FR/BR, MVP scope
  - `docs/API_REFERENCE.md` — backend API contract, RBAC, request/response shapes
  - `docs/DATABASE_SCHEMA.md` — domain model, entity relations, enums, deletion constraints
  - `docs/PLANNING.md` — phased frontend implementation roadmap

## Current codebase state

- This repository is still close to the default Next.js scaffold.
- The root application uses the App Router in `app/` with no `src/` directory.
- `app/layout.tsx` loads global fonts and styles.
- `app/page.tsx` is still placeholder scaffold content and should not be treated as the real app structure.
- Styling uses Tailwind CSS v4 via `@import "tailwindcss"` in `app/globals.css`.
- `tsconfig.json` is strict and defines the alias `@/* -> ./*`.
- `next.config.ts` is currently empty.
- There are no real feature folders, API helpers, shared component libraries, or route handlers implemented yet.

## Standardized frontend stack

Use this stack consistently for new frontend work:

- Tailwind CSS for styling, layout, spacing, and design tokens
- shadcn/ui for shared UI primitives and composed application components
- TanStack Query for client-side server state, mutations, cache invalidation, and API loading/error handling
- Zod for runtime validation of forms and frontend input boundaries

Repo state to remember:

- Tailwind CSS is already present and configured in `package.json` and `app/globals.css`
- TanStack Query, shadcn/ui, and Zod were selected as the standard stack but may need installation/configuration in early foundation work

## Intended application architecture

The intended product is a university library management system with these core domains:

- auth
- readers (`DOC_GIA`)
- majors (`CHUYEN_NGANH`)
- titles (`DAU_SACH`)
- copies (`BAN_SAO_SACH`)
- search
- loans (`PHIEU_MUON`)
- reports
- staff
- accounts

When implementing the app, prefer this separation:

- `app/` for routes, layouts, loading/error boundaries, and route-level protection
- `features/` for domain-specific UI and data logic
- `shared/` for reusable UI primitives, tables, dialogs, pagination, and status badges
- `lib/` for API client, auth/session helpers, permission helpers, enum mappers, and query param adapters

## Next.js 16 rules that matter in this repo

- This project is on Next.js `16.2.0`. Read the relevant guide in `node_modules/next/dist/docs/` before making framework-level changes.
- App Router is the active model here.
- Route handlers must live in `app/**/route.ts`.
- Do not place `page.tsx` and `route.ts` in the same route segment.
- Pages and layouts are Server Components by default. Keep routes server-first and add `"use client"` only to interactive leaf components.
- Keep server-only logic from leaking into client components when backend/token helpers are introduced.

## API and integration assumptions

- Base API namespace: `/api/v1`
- Auth mechanism: Bearer token
- Internal roles:
  - `ADMIN`
  - `LIBRARIAN`
  - `LEADER`

### Standard paginated success shape

```json
{
  "success": true,
  "data": {
    "items": [],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### Standard error shape

```json
{
  "success": false,
  "error": {
    "code": "BR_04_ACTIVE_LOAN_EXISTS",
    "message": "Độc giả đang có phiếu mượn chưa trả",
    "details": {}
  }
}
```

### Integration caveats

- The library-card print endpoint returns `application/pdf`, not the JSON envelope.
- Do not assume all list endpoints use identical query parameter names. `docs/API_REFERENCE.md` mixes `page_size` and `limit`.
- Centralize response parsing and error normalization early instead of duplicating it per feature.

## Business rules that must be visible in UI behavior

These rules should shape routing, forms, disabled states, dialogs, and error messages:

- Users must be authenticated before using protected routes.
- Navigation and actions must be role-gated.
- A reader can have at most one active/unreturned loan at a time.
- Only copies with `AVAILABLE` status can be borrowed.
- Delete actions can be blocked by active business relations:
  - reader with unreturned loan
  - copy currently borrowed or tied to an unfinished loan
  - title with dependent copies/transactions
- Borrowing must update the copy status to `BORROWED`.
- Return flow must update both loan status and copy status consistently.
- Top-borrowed reporting aggregates by title, not by individual copy.

## Enums used across UI and API

- `ReaderStatus`: `ACTIVE`, `LOCKED`, `INACTIVE`
- `Gender`: `MALE`, `FEMALE`, `OTHER`
- `BookCopyStatus`: `AVAILABLE`, `BORROWED`, `DAMAGED`, `LOST`, `NEEDS_REVIEW`
- `LoanStatus`: `BORROWED`, `RETURNED`, `NEEDS_REVIEW`
- `AccountRole`: `ADMIN`, `LIBRARIAN`, `LEADER`

## Practical implementation notes

- The first meaningful frontend work should start with shared foundations: app shell, auth/session handling, permissions, API client, shared UI states, and enum/status mapping.
- Build business modules in dependency order: readers -> majors -> titles -> copies -> search -> loans -> reports -> staff/accounts.
- If a future task conflicts with scaffold code in `app/page.tsx`, follow the docs in `docs/` rather than preserving the scaffold.
