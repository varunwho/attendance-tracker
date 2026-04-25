# Attendance Tracker

A mobile-first progressive web app to track your office attendance against your company's policy. Fully offline — no backend, no account, no sync required.

---

## Screenshots

### Dark Mode

| Dashboard | Calendar | Holidays | Settings |
|:---------:|:--------:|:--------:|:--------:|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Calendar](docs/screenshots/calendar.png) | ![Holidays](docs/screenshots/holidays.png) | ![Settings](docs/screenshots/settings.png) |

### Light Mode

| Dashboard | Calendar | Holidays | Settings |
|:---------:|:--------:|:--------:|:--------:|
| ![Dashboard](docs/screenshots/dashboard-light.png) | ![Calendar](docs/screenshots/calendar-light.png) | ![Holidays](docs/screenshots/holidays-light.png) | ![Settings](docs/screenshots/settings-light.png) |

### Interactions

| Drag Select | Month Summary | Quarter Config |
|:-----------:|:-------------:|:--------------:|
| ![Drag Select](docs/screenshots/drag-select.png) | ![Summary](docs/screenshots/summary.png) | ![Quarter](docs/screenshots/settings-quarter.png) |

---

## Features

### Dashboard
- Single **policy card** showing attendance % or days for your configured period (weekly / monthly / quarterly / yearly)
- Always-visible **This Month** card alongside the policy card — no duplicate when policy is monthly
- Color-coded progress bar — green when on track, red when behind
- Shows present days, elapsed working days, and how many more days needed to hit the target

### Calendar
- Color-coded month grid: **green** = present, **red** = absent, **orange** = holiday / PTO, **grey** = weekend
- **Tap** a single day or **slide across** multiple days to select a range
- Floating action bar appears on selection: mark as **Present**, **Absent**, **Clear**, or **Holiday**
- Holiday marking prompts for a custom label (e.g. PTO, Sick Leave, Team Outing)
- **Month summary** below the grid — working days, present, absent, holiday, and unmarked counts with a progress bar
- Navigate freely between months with ‹ › arrows

### Holidays
- **National Holidays** section — 5 India national holidays shown as a permanent, year-agnostic list (no year, no duplicates):
  - New Year's Day · Jan 1
  - Republic Day · Jan 26
  - Labour Day · May 1
  - Independence Day · Aug 15
  - Gandhi Jayanti · Oct 2
- **Your Holidays** section — add custom holidays by date and name (Diwali, Holi, company holidays, PTO, etc.)
- Delete any user-added holiday with a single tap

### Attendance Policy
Configure your company's exact attendance rule in Settings:
- **Period** — Weekly / Monthly / Quarterly / Yearly
- **Target type** — Percentage (%) or number of Days
- **Target value** — any threshold (e.g. 75%, 15 days)
- **Quarter start month** — pick any month from Jan–Dec so the app respects your company's fiscal year (Jan, Apr, Jul, or Oct are common)

### Clear Data
Granular controls to wipe data by period:
- Clear **attendance records** for This Week / Month / Quarter / Year
- Clear **user-added holidays** for any period (national holidays are never affected)
- **Reset Everything** — wipes all attendance, all user holidays, and resets settings to defaults, with a confirmation dialog

### Add to Home Screen
- First launch shows an install prompt after 2.5 seconds
- **Android/Chrome** — native install button
- **iOS/Safari** — step-by-step Share → Add to Home Screen instructions
- Re-accessible from **Settings → Appearance** if dismissed
- Never shown when already installed

### Appearance
- **Light / Dark mode** toggle — persists across sessions

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | [React](https://react.dev) | 19 |
| Build tool | [Vite](https://vite.dev) | 8 |
| Styling | [Tailwind CSS](https://tailwindcss.com) | 4 |
| Local database | [Dexie.js](https://dexie.org) (IndexedDB) | 4 |
| Hosting | [Vercel](https://vercel.com) | — |
| Language | JavaScript ESM | — |

---

## Project Structure

```
src/
├── components/
│   ├── Dashboard.jsx       # Policy card + monthly card
│   ├── CalendarView.jsx    # Color-coded calendar, drag-select, month summary
│   ├── HolidayManager.jsx  # National holidays (static) + user holidays (CRUD)
│   ├── Settings.jsx        # Policy config, quarter start, clear data, reset, install
│   └── InstallPrompt.jsx   # Add-to-home-screen banner (Android + iOS)
├── hooks/
│   ├── useAttendance.js    # All IndexedDB read/write + national holiday expansion
│   └── useSettings.js      # Policy + theme stored in localStorage
├── utils/
│   ├── workingDays.js      # Working day calculator, period bound helpers
│   ├── nationalHolidays.js # Static India national holidays list
│   └── installPrompt.js    # Shared beforeinstallprompt singleton
├── db.js                   # Dexie schema — attendance + holidays tables
├── App.jsx                 # Tab shell + bottom nav
└── index.css               # Tailwind import + global resets
vercel.json                 # SPA rewrite rule
screenshot.mjs              # Playwright screenshot automation
```

---

## Data Storage

All data lives in the browser's **IndexedDB** under the database name `AttendanceTracker`.

| Table | Primary Key | Fields |
|---|---|---|
| `attendance` | `date` (YYYY-MM-DD) | `status` — `"present"` or `"absent"` |
| `holidays` | `id` (auto-increment) | `date` (YYYY-MM-DD), `label` (string) |

Settings (policy + theme + quarter start) are stored in **localStorage** under the key `attendance_settings`.

National holidays are **not stored in the database** — they are a static in-memory list expanded dynamically for any year the calendar navigates to.

> Data is per-browser, per-device. There is no cross-device sync.

---

## Attendance Logic

```
workingDays(start, end, holidays[])
  = all Mon–Fri in range that are not in the holiday list

attendancePercent(present, elapsed)
  = (present / elapsed) * 100

daysNeededToHitTarget(present, totalWorkingDays, target%)
  = ceil(target/100 × totalWorkingDays) − present

daysNeededToHitTarget(present, totalWorkingDays, targetDays)
  = targetDays − present
```

`elapsed` = working days from the period start up to **today** only — the percentage reflects reality, not a future projection.

**Custom quarter support:**  
`getQuarterBounds(date, quarterStart)` computes the 3-month window relative to any fiscal Q1 start month, handling year-boundary rollovers automatically.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Run locally

```bash
git clone https://github.com/your-username/attendance-tracker.git
cd attendance-tracker
npm install
npm run dev
```

Opens at `http://localhost:5173`.

**Test on your phone** (same Wi-Fi):

```bash
# macOS — find your local IP
ipconfig getifaddr en0

# Open in your phone's browser
http://<your-ip>:5173
```

### Build for production

```bash
npm run build
# Output → dist/
```

### Capture screenshots

```bash
# With dev server already running:
node screenshot.mjs
# Output → docs/screenshots/
```

---

## Deployment

### Vercel (recommended)

**Option 1 — CLI**

```bash
npx vercel          # first deploy — interactive setup
vercel --prod       # subsequent deploys
```

**Option 2 — Git integration**

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your repo — Vercel auto-detects Vite
4. Click **Deploy**

Every push to `main` triggers a redeploy. The `vercel.json` handles SPA routing so direct URL access never 404s.

---

## National Holidays (India)

The following holidays are built into the app and shown year-agnostically — they apply every year with no manual setup required:

| Date | Holiday |
|---|---|
| Jan 1 | New Year's Day |
| Jan 26 | Republic Day |
| May 1 | Labour Day |
| Aug 15 | Independence Day |
| Oct 2 | Gandhi Jayanti |

All other holidays (Diwali, Holi, Eid, company-specific days, PTO) can be added manually from the **Holidays** tab.

---

## Roadmap

- [ ] PWA service worker + offline install (pending `vite-plugin-pwa` Vite 8 support)
- [ ] Export / import attendance as JSON
- [ ] Cross-device sync (requires a backend / Supabase)

---

## License

[MIT](LICENSE) © 2026 amrit-github
