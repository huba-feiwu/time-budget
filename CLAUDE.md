# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- `npm run dev` — Start Vite dev server (port 5173)
- `npm run build` — TypeScript check + Vite production build
- `npm run tauri dev` — Launch Tauri desktop app in dev mode (starts Vite + opens native window)
- `npm run tauri build` — Build release binary
- `npm run lint` — ESLint check

## Architecture

### Tech Stack
- **Desktop shell**: Tauri 2.0 (Rust backend, `src-tauri/`)
- **Frontend**: React 19 + TypeScript + Vite 8 (`src/`)
- **Database**: SQLite via `@tauri-apps/plugin-sql` (frontend-driven, no Rust command handlers)
- **No UI library** — all styling is hand-written CSS

### Key Structure
- `src/App.tsx` — Root component, manages 3 tabs (today/stats/categories). All data mutations go through `loadData()` which refreshes state after every change.
- `src/db.ts` — All database operations as exported async functions. Tables: `categories`, `records`, `budget_overrides`. No ORM — raw SQL via `@tauri-apps/plugin-sql`.
- `src-tauri/src/lib.rs` — Tauri plugin setup with SQLite migrations. Defines default categories (睡觉/工作/学习/通勤/吃饭/娱乐/运动/社交/家务/其他) and creates tables on first launch.
- `src/components/` — One file per component (Timer, RecordForm, RecordList, Calendar, Stats, CategoryManage, PieChart).

### Budget Logic
- Daily base budget: 24h
- `getAvailableBudget(date)` in `db.ts`: iterates all prior days, `available = 24 + (available - day_total)`, clamped at 0 minimum. Overrideable per-date via `budget_overrides` table.
- UI shows equation: `{budget} = 24h {+/-carryover}` in the budget card header.

### Data Flow
- Record CRUD: App.tsx handlers → db.ts functions → `loadData()` refetch → re-render
- Timer saves to today's date regardless of selected date in calendar
- Future dates: records cannot be added/edited/deleted, budget shows 24h flat

### Important Patterns
- All DB queries via `@tauri-apps/plugin-sql` — no Rust-side commands
- Tabs use `display: none` (not conditional rendering) to keep Timer running across tab switches
- Percentage calculations in category summary exclude "睡觉" category
- Dates use local time zone helpers (`getFullYear/getMonth/getDate`), not `toISOString`
