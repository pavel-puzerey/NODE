# NODE — Notebook On Data & Equipment

Precision rifle shooter's logbook. Tracks equipment inventory, load development, range sessions, and performance analysis.

---

## Quick Start

```bash
# 1. Install dependencies (only needed once)
npm install

# 2. Start the dev server
npm run dev
```

Then open http://localhost:5173 in your browser.

---

## Project Structure

```
src/
├── App.tsx                        ← Main app, navigation, all state
├── types/
│   └── index.ts                   ← All TypeScript types (single source of truth)
├── hooks/
│   └── useLocalStorage.ts         ← Persistent state hook
├── utils/
│   ├── id.ts                      ← generateId()
│   ├── geometry.ts                ← Target analysis math
│   └── config.ts                  ← App constants
└── components/
    ├── RifleManager.tsx            ← Rifle inventory
    ├── GlassManager.tsx            ← Optics (scopes, binos, rangefinders)
    ├── Accessories.tsx             ← Shooting accessories
    ├── ReloadingGear.tsx           ← Bullets, brass, powder, primers
    ├── LoadDevelopment.tsx         ← Load recipes
    ├── RangeSession.tsx            ← Range session logger
    ├── MatchCalendar.tsx           ← Competition calendar
    ├── SessionHistory.tsx          ← Session log + CSV export
    ├── LoadAnalysis.tsx            ← Accuracy node + velocity charts
    ├── TargetAnalysis.tsx          ← Photo-based group measurement tool
    ├── LoadPerformanceChart.tsx    ← Scatter chart component
    ├── Dashboard.tsx               ← KPI summary + charts
    └── Settings.tsx                ← Profile, theme, JSON backup/restore
```

---

## Data

All data is stored in your browser's localStorage. Use **Settings → Export Backup** regularly to save a `.json` file of all your data. You can restore it with **Import Backup**.

---

## Cleanup done (vs. llamacoder export)

- Removed duplicate components: `AccessoriesManager.tsx`, `AccessoryManager.tsx`, `ReloadingGearManager.tsx`, `Glass.tsx`
- Fixed `Accessory` type — unified on `accessoryType` field (was split between `accessoryType` and `category`)
- Removed unused `scope`, `muzzleDevice`, `bipod` fields from `Rifle` type
- Wired `TargetAnalysis` into the navigation (was built but unconnected)
- Added `targetAnalyses` to localStorage state

---

## Adding your banner image

Drop `node-banner.jpg` into the `public/` folder to show it in the header.
Drop any image into Settings to set your logo/avatar.
