# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server (exposed on network via --host)
npm run build      # Production build
npm run lint       # ESLint check
node screenshot.mjs  # Capture Playwright screenshots of all tabs (requires dev server running)
```

No test suite exists — `screenshot.mjs` is the primary way to visually verify UI changes. Run it after `npm run dev` and check `docs/screenshots/`.

## Architecture

**Offline-first PWA.** No backend, no auth, no sync. All data is local to the browser.

**Storage split:**
- `IndexedDB` (via Dexie 4) — `attendance` table (primary key: `date` YYYY-MM-DD, field: `status`) and `holidays` table (auto-id, `date`, `label`)
- `localStorage` — settings only (`attendance_settings` key), managed by `useSettings`
- National holidays are **never stored** — they're a static in-memory list in `utils/nationalHolidays.js` expanded for year ±2 and merged into `holidayDates` at runtime. On launch, any national holidays that may have leaked into the DB are purged.

**State management** (`useAttendance.js`):
- `useTable(fetcher)` — minimal hook that holds `[data, refresh]`. `refresh` is stable (`useCallback` with `[]` dep chain) and must be called manually after every DB write to trigger re-renders.
- All DB mutations (`markDay`, `addHoliday`, `deleteHoliday`, `clearPeriod`, `clearHolidaysPeriod`, `resetAll`) call `refreshRecords()` or `refreshHolidays()` after each write — these are fire-and-forget (not awaited), so state updates arrive asynchronously after the write completes.
- `attendanceMap` is derived on each render: `Object.fromEntries(records.map(r => [r.date, r.status]))`.
- `holidayDates` = user holidays from DB merged with the static national holiday dates.

**Tab architecture** (`App.jsx`):
All four tabs (`Dashboard`, `CalendarView`, `HolidayManager`, `Settings`) are **always mounted** — hidden via `className="hidden"` (Tailwind `display:none`), never unmounted. This means all tabs receive prop updates immediately when `attendanceMap` or `holidayDates` changes, even when not visible.

**Working day logic** (`utils/workingDays.js`):
`getWorkingDays(start, end, holidayDates)` returns Mon–Fri dates that are not in `holidayDates`. This is used everywhere attendance percentages and day counts are computed.

**CalendarView month summary:**
`presentCount`, `absentCount`, `unmarkedCount` are computed from `elapsedDays` (working days from month start up to and including today), not the full month. `workingDays.length` (the "Working" stat) is the full month. This means marking future days has no effect on the summary counts — by design.

**Dashboard cards:**
- The "Policy" card always uses the user's configured period (weekly/monthly/quarterly/yearly).
- A separate "This Month" card appears **only when the policy period is not monthly** (to avoid duplication).
- `buildCard()` computes stats identically for both, passing different `bounds`.

**Quarter logic:**
`getQuarterBounds(date, quarterStart)` supports any fiscal Q1 start month (0–11) and handles year-boundary rollovers. `quarterStart` is stored in settings.

**PWA install flow** (`utils/installPrompt.js`):
Singleton that captures the `beforeinstallprompt` event. `subscribeInstallPrompt` lets components react when the deferred prompt becomes available or is consumed.

## Key constraints

- `db.attendance` primary key is `date` (string). `db.attendance.delete(iso)` and `.put({date, status})` use this key directly.
- Dexie's `put` is upsert — safe to call even if a record already exists.
- The `clearPeriod` and `clearHolidaysPeriod` functions in `useAttendance` do string-range filtering (`r.date >= start && r.date <= end`) — ISO dates sort correctly lexicographically.
- `CalendarView` uses `holidaySetRef` (a `useRef` updated every render) inside async `applyMode`/`applyHoliday` to access the latest holiday set without stale closure issues.
