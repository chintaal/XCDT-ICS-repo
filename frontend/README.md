# XCDT-ICS · Frontend

Premium Next.js 16 + TypeScript dashboard for the XCDT-ICS Intelligent
Infrastructure Command Center.

## Stack

| Concern              | Choice                       |
| -------------------- | ---------------------------- |
| Framework            | Next.js 16 (App Router)      |
| Language             | TypeScript (strict)          |
| Styling              | Tailwind CSS v4 + design tokens |
| Animation            | Framer Motion                |
| State (server)       | TanStack Query v5            |
| State (client)       | Zustand                      |
| Realtime             | Native WebSocket             |
| Charts               | Recharts                     |
| Icons                | Lucide React                 |
| Toasts               | Sonner                       |
| Fonts                | Geist Sans + Geist Mono      |

## Quick start

```bash
# 1. Make sure the backend is running (on :8000)
cd ../../  # repo root
./run.sh --dataset SWaT

# 2. Boot the frontend (on :3000)
cd XCDT-ICS-repo/frontend
npm install
npm run dev
```

Open <http://localhost:3000>.

## Environment variables

| Var                       | Default                      | Purpose                |
| ------------------------- | ---------------------------- | ---------------------- |
| `NEXT_PUBLIC_API_URL`     | `http://localhost:8000`      | FastAPI base URL       |
| `NEXT_PUBLIC_WS_URL`      | `ws://localhost:8000/ws/stream` | Live record stream  |

## Architecture

```
src/
├── app/
│   ├── (app)/                 # App-shell route group
│   │   ├── layout.tsx         # Sidebar + topbar + alert banner
│   │   ├── page.tsx           # / Live Operations
│   │   ├── incidents/         # /incidents and /incidents/[id]
│   │   ├── sensor-graph/      # Process topology view
│   │   ├── datasets/          # Models & assets
│   │   ├── sandbox/           # Red-team attack injection
│   │   └── settings/          # Threshold + system info
│   ├── globals.css            # Design tokens, surfaces, motion
│   ├── layout.tsx             # Root, fonts, providers
│   └── providers.tsx          # React Query + Stream + Sonner
├── components/
│   ├── ui/                    # Primitives: button, card, badge, etc.
│   ├── shell/                 # Sidebar, topbar, command palette
│   ├── live/                  # Score gauge, chart, KPIs, top sensors
│   ├── incidents/             # (incident pages live in app/)
│   ├── graph/                 # SVG sensor topology canvas
│   └── datasets/              # Dataset card with start/stop controls
└── lib/
    ├── api/                   # Typed client + endpoint wrappers
    ├── store/                 # Zustand global store
    ├── ws/                    # WebSocket lifeline provider
    ├── hooks/                 # Custom hooks
    └── utils.ts               # cn(), formatters
```

## Design system

The look is **premium minimal dark** — Linear / Stripe / Apple, not cyberpunk.
Single accent color (cool blue), restrained semantic states. All numeric data
uses tabular nums + monospace for perfect alignment.

Key tokens live in `globals.css` under `@theme`:

- `--color-bg-{void,base,surface,elevated,hover}` — five-step background scale
- `--color-fg-{primary,secondary,tertiary,quaternary,faint}` — five-step type scale
- `--color-accent-{50..600}` — restrained blue
- `--color-state-{ok,warn,alert,critical,info}` — semantic
- `--ease-{spring,out,in-out}` — motion curves
- `--radius-{xs..xl}` — radius scale

The `<html>` element has a `data-system-state` attribute that mirrors the
Zustand `systemState` (`normal | elevated | alert`); CSS attribute selectors
use this to cascade state-driven theming without prop drilling.

## Realtime data flow

```
FastAPI /ws/stream
    │   (every emitted window — JSON record)
    ▼
StreamProvider (lib/ws/stream-provider.tsx)
    │   parses + push to Zustand
    ▼
useSystemStore.history[]   ←  ring-buffered ScorePoint[]
useSystemStore.current     ←  latest InferenceRecord
useSystemStore.systemState ←  derived: normal | elevated | alert
    │
    ▼
React components subscribe via selectors
```

Connection status is tracked separately and goes `connecting → live → stale → offline`
with exponential reconnect backoff (capped at 30s).

## Pages

- **`/` Live Operations** — Score gauge, real-time chart, top contributors, KPI strip, recent incidents, engine telemetry.
- **`/incidents`** — Filterable list of persisted alerts.
- **`/incidents/[id]`** — Detail with feedback (TP/FP/clear), top sensors, AI narrative.
- **`/sensor-graph`** — Stage-clustered process topology with live attribution overlay.
- **`/datasets`** — Per-dataset cards: assets status, configurable start/stop.
- **`/sandbox`** — Red-team attack injection: pick attack type, target sensor, magnitude, duration.
- **`/settings`** — Runtime threshold override, audio toggle, backend health.

## Build

```bash
npm run build   # Production build (Turbopack)
npm run lint    # ESLint
npx tsc --noEmit  # Strict typecheck
```

## Conventions

- All client components must declare `"use client"` at the top of the file.
- Effects must not call `setState` synchronously (React 19 strict rule). Derive from props/state in render with `useMemo`, or use the `key`-reset trick for child component state resets.
- All API calls go through `apiEndpoints.*` — never call `fetch` directly from components.
- Animations: spring curves only (`type: "spring"` in Framer); ease-out CSS transitions for hover.
- Numbers: always tabular-nums + monospace.
