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
- A **Plan card** always appears after the above cards. It counts `presentFull` — all working days in the full period marked present, including future pre-marked days — and shows progress toward the configured target.
- `buildCard()` returns both `present` (elapsed days only) used by the Policy/Monthly cards and `presentFull` (full period, including future) used by the Plan card.
- `PERIOD_SUFFIX` is a lowercase label map (e.g. `'this month'`) used in the Plan card description text.

**Quarter logic:**
`getQuarterBounds(date, quarterStart)` supports any fiscal Q1 start month (0–11) and handles year-boundary rollovers. `quarterStart` is stored in settings.

**PWA install flow** (`utils/installPrompt.js`):
Singleton that captures the `beforeinstallprompt` event. `subscribeInstallPrompt` lets components react when the deferred prompt becomes available or is consumed.

## CalendarView — holiday interaction

`CalendarView` receives `holidays` (full DB array with `{id, date, label}`) and `deleteHoliday` from `App.jsx` in addition to `holidayDates` (the merged ISO string array).

Two derived maps are built each render:
- `holidayIdMap` — `date → id` for user-added holidays only (national holidays have no DB id)
- `holidayLabelMap` — `date → label` for user-added holidays

**Selecting a holiday cell:**
- `applyMode('clear')` — deletes user holidays whose dates appear in `selected` (via `holidayIdMap`) in addition to clearing attendance records. National holidays cannot be cleared.
- `applyHoliday()` — for already-holiday dates in `selected`, deletes the old DB entry first then re-adds with the new label (label update). National holidays are skipped (not in `holidayIdMap`). For new dates, adds them as holidays directly.
- `openHolidayStep()` — when a single user-holiday cell is selected, pre-fills `holLabel` with the existing holiday label so the user doesn't have to retype it. The label input step header and confirm button also switch to "Update" language.

**Holiday cell initials** (`getHolidayInitials` in `CalendarView.jsx`):
Displays abbreviated label in the cell instead of a generic "HOL". Matching is case-insensitive substring:

| Contains | Shows |
|---|---|
| `sick` | SL |
| `annual` | AL |
| `casual` | CL |
| `float` | FL |
| `thank` | TH |
| anything else / national | HOL |

## HolidayManager — accordion layout

User-added holidays are sorted descending (latest first) and grouped by month (`YYYY-MM`). Each month group renders as a collapsible accordion card with a distinct header (`bg-gray-50 dark:bg-gray-700`). All months start expanded. `closedMonths` (a `Set`) tracks which groups the user has collapsed.

## Settings — Developer card

A "Developer" section appears at the top of Settings, above Appearance. It renders a gradient card (`from-indigo-500 via-purple-600 to-pink-500`) with Amrit Suman's initials avatar, name, title, and platform pills (iOS · Android · Web).

## Sarcastic messages (`utils/sarcasticMessages.js`)

100 messages across 5 tiers, each a function `(data) => string`. Tier is selected by `pct / targetPct` ratio:

| Ratio | Tier |
|---|---|
| ≥ 1.15 | `EXCELLENT` |
| ≥ 1.0 | `ONTRACK` |
| ≥ 0.85 | `CLOSE` |
| ≥ 0.6 | `BEHIND` |
| < 0.6 | `WAYBEHIND` |

`data` shape: `{ pct, targetPct, present, absent, unmarked, elapsed, total, remaining }`.

`getSarcasticMessage(data, idx)` returns `pool[idx % pool.length](data)`.

In `CalendarView`, `msgIdx` state is re-randomised via `useEffect` whenever `msgSig` (`"${year}-${month}-${elapsedPresent}-${absentCount}"`) changes — i.e. on month navigation or any attendance mark/unmark. The message is only rendered when the month has at least one present or absent marking (`hasMarkings`). It appears at the bottom of the month summary card, separated by a top border.

**Message guidelines:** No personal relationship references (family, etc.) — workplace and professional sarcasm only. Friends-as-figures-of-speech are acceptable.

## Key constraints

- `db.attendance` primary key is `date` (string). `db.attendance.delete(iso)` and `.put({date, status})` use this key directly.
- Dexie's `put` is upsert — safe to call even if a record already exists.
- The `clearPeriod` and `clearHolidaysPeriod` functions in `useAttendance` do string-range filtering (`r.date >= start && r.date <= end`) — ISO dates sort correctly lexicographically.
- `CalendarView` uses `holidaySetRef` (a `useRef` updated every render) inside async `applyMode`/`applyHoliday` to access the latest holiday set without stale closure issues.
- `holidayIdMap` only contains user-added holidays — national holidays are excluded intentionally so they can never be deleted or overridden via the calendar UI.
