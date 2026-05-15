# XCDT-ICS: Digital Twin Command Center — Complete UI/UX Design Specification
## For the SWaT (Secure Water Treatment) Singapore Plant
### Implementation Guide for Claude Code Agents

---

## 0. DESIGN PHILOSOPHY & VISUAL IDENTITY

### Aesthetic Direction: "Tactical Cyber-Physical Intelligence"
Not just dark mode with neons. Think: a $40M SCADA control room meets a NASA Mission Control meets
a military-grade cyber operations center. Every pixel has purpose. Dense but readable. Alive with data.
The plant is breathing on screen.

### Design Pillars
- **Density with Clarity**: Pack enormous amounts of real data, but every element has a clear visual hierarchy
- **Alive**: Nothing is static. Data flows, scores animate, sensors pulse
- **Trustworthy**: Not flashy for flash's sake — every animation communicates state
- **Spatial**: The screen has depth. Layers. Parallax. Foreground/background separation

---

## 1. GLOBAL DESIGN TOKENS

### Typography
```
Display Font: "Orbitron" (Google Fonts) — headers, metric values, alert text. Feels engineered.
Data Font: "JetBrains Mono" — ALL sensor readings, timestamps, scores, IDs. 
Body Font: "DM Sans" — descriptions, labels, UI text
Nano Font: "JetBrains Mono" 9-10px — dense data tables, micro-labels
```

### Color System
```css
/* Backgrounds — layered depth */
--bg-void:       #030508;   /* deepest black, page background */
--bg-base:       #080C12;   /* base surface */
--bg-surface:    #0D1117;   /* cards, panels */
--bg-raised:     #111827;   /* hover states, nested elements */
--bg-glass:      rgba(13, 17, 23, 0.7);  /* glassmorphism panels */

/* Borders */
--border-dim:    rgba(255,255,255,0.04);
--border-base:   rgba(255,255,255,0.08);
--border-bright: rgba(255,255,255,0.16);
--border-cyan:   rgba(0, 240, 255, 0.3);

/* Primary: Neon Cyan — normal state, data flow, active */
--cyan-900:  #001A1F;
--cyan-500:  #00B4CC;
--cyan-400:  #00D4EE;
--cyan-300:  #00F0FF;  /* PRIMARY NEON — use sparingly for highest attention */
--cyan-glow: 0 0 20px rgba(0, 240, 255, 0.5), 0 0 60px rgba(0, 240, 255, 0.15);

/* Warning: Electric Amber */
--amber-500: #F59E0B;
--amber-300: #FCD34D;
--amber-glow: 0 0 20px rgba(245, 158, 11, 0.5);

/* Critical: Plasma Red */
--red-600:   #DC2626;
--red-400:   #F87171;
--red-300:   #FF4444;
--red-glow:  0 0 20px rgba(255, 68, 68, 0.6), 0 0 80px rgba(220, 38, 38, 0.2);

/* XAI / Attribution: Acid Green */
--green-500: #22C55E;
--green-300: #ADFF2F;
--green-glow: 0 0 15px rgba(173, 255, 47, 0.4);

/* Prediction / Forecast: Violet */
--violet-500: #8B5CF6;
--violet-300: #C4B5FD;
--violet-glow: 0 0 20px rgba(139, 92, 246, 0.4);

/* Safe: Emerald */
--emerald-500: #10B981;
--emerald-300: #6EE7B7;

/* Text */
--text-primary:   rgba(255,255,255,0.95);
--text-secondary: rgba(255,255,255,0.6);
--text-tertiary:  rgba(255,255,255,0.35);
--text-disabled:  rgba(255,255,255,0.2);
--text-data:      #00F0FF;   /* sensor values, live numbers */
```

### Glassmorphism System
```css
/* Standard glass panel */
.glass-panel {
  background: rgba(13, 17, 23, 0.75);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
}

/* Elevated glass — used over 3D backgrounds */
.glass-elevated {
  background: rgba(8, 12, 18, 0.85);
  backdrop-filter: blur(32px);
  border: 1px solid rgba(0, 240, 255, 0.15);
  box-shadow: 0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06);
}

/* Alert glass — when system is in alert state */
.glass-alert {
  background: rgba(30, 0, 0, 0.85);
  border: 1px solid rgba(255, 68, 68, 0.3);
  box-shadow: 0 0 40px rgba(220, 38, 38, 0.1);
}
```

### Spacing & Layout Grid
```
Base unit: 4px
Content max-width: 1920px (designed for 27" 4K monitors)
Sidebar width: 280px (collapsed: 64px)
Top nav height: 56px
Command bar height: 40px (bottom, optional)
Panel border-radius: 8px (compact), 12px (standard), 16px (hero)
```

### Motion System
```
Micro (hover, focus): 120ms ease-out
Standard (panel open/close, tab switch): 200ms cubic-bezier(0.16,1,0.3,1)
Layout (page transition): 350ms cubic-bezier(0.16,1,0.3,1)
Alert pulse: 1200ms ease-in-out infinite alternate
Score tick: Spring — stiffness 400, damping 30
Score number: useSpring for counter animation, 600ms
Graph node expand: 250ms spring
3D camera: Lerp factor 0.05 per frame (smooth, cinematic)
```

---

## 2. ROUTE STRUCTURE

```
/                           → CommandCenter (main dashboard, the "home base")
/twin                       → DigitalTwin3D (3D plant visualization, full immersive)
/graph                      → SensorGraph (causal network, force-directed)
/replay                     → TimeTravel (forensic replay with scrubber)
/sandbox                    → AttackSandbox (red team simulation)
/incidents                  → IncidentIntelligence (list + detail views)
/incidents/[id]             → IncidentDetail (single incident deep dive)
/analytics                  → Analytics (KPIs, model performance, trends)
/calibration                → ThresholdCalibration (operator-owned thresholds)
/settings                   → Settings (system config, appearance)
```

---

## 3. GLOBAL LAYOUT SHELL (`app/layout.tsx`)

### Structure
```
┌────────────────────────────────────────────────────────────────────────┐
│ TOP NAV (56px, fixed, glass over everything)                           │
│  [⬡ XCDT-ICS]  [CommandCenter] [Twin] [Graph] [Replay] [Sandbox]     │
│                              [●LIVE] [SWaT ▾] [Alert Bell] [Settings]│
├────────┬───────────────────────────────────────────────────────────────┤
│SIDEBAR │                                                                │
│(280px) │   PAGE CONTENT AREA                                           │
│        │                                                                │
│ Nav    │                                                                │
│ Items  │                                                                │
│        │                                                                │
│ Quick  │                                                                │
│ Stats  │                                                                │
│        │                                                                │
│ System │                                                                │
│ Health │                                                                │
│        │                                                                │
└────────┴───────────────────────────────────────────────────────────────┘
```

### Top Navigation (`components/TopNav.tsx`)
**Height**: 56px fixed, `z-index: 100`
**Background**: `glass-elevated` + very subtle scanline texture overlay (CSS repeating-linear-gradient)
**Left**: Hexagon logo mark `⬡` in cyan + "XCDT-ICS" in Orbitron 14px + "/" + "SWaT Plant" in DM Sans dimmed
**Center**: Route tabs — pill-style active indicator that slides between tabs (Framer Motion `layoutId`)
**Right cluster** (right to left):
  - `[⚙]` Settings icon
  - `[🔔]` Alert bell — badge count, pulses red when active alerts exist
  - `[▸ SWaT ▾]` Dataset selector dropdown — switches between SWaT / WADI / Indian
  - `[● LIVE]` — blinking green dot + "LIVE" text when WS connected; gray "OFFLINE" when disconnected
  - Connection latency chip: `12ms` in JetBrains Mono, color-coded (green <50ms, amber <200ms, red >200ms)

**Alert State**: When `is_alert=true` from backend, entire nav border-bottom flashes red (CSS animation), subtle red overlay at 3% opacity across top nav

### Sidebar (`components/Sidebar.tsx`)
**Width**: 280px expanded, 64px collapsed (icon-only)
**Background**: `#080C12` with right border `rgba(255,255,255,0.06)`
**Toggle**: Chevron button at bottom, smooth width transition 250ms

**Top section — Plant Status**:
```
SWAT PLANT                     [ONLINE]
Singapore · UTC+8              14:23:07
Uptime: 99.97%  |  Run: 847h
```
Tiny green "heartbeat" line (SVG path animation, 3-second loop)

**Navigation Items** (each 44px tall):
```
⊞  Command Center       /
⬡  Digital Twin         /twin
◈  Sensor Graph         /graph       [live node count badge]
⏮  Time Replay          /replay
⚔  Attack Sandbox       /sandbox     [BETA tag]
⚑  Incidents            /incidents   [unreviewed count badge]
∿  Analytics            /analytics
⊙  Calibration          /calibration
```
Active item: left border 3px cyan, background `rgba(0,240,255,0.06)`, text full white
Hover: background `rgba(255,255,255,0.04)`, 120ms

**Middle section — Stage Health Minimap**:
6 mini rectangles representing SWaT stages 1-6, each:
- Label: "S1" through "S6" in JetBrains Mono 10px
- Color: Green/Amber/Red based on max anomaly score in that stage's sensors
- Tooltip on hover: stage name + current max score
Click navigates to `/twin` with camera focused on that stage

**Bottom section — Quick Metrics** (always visible):
```
FUSED SCORE          0.412
─────────────────────────
THRESHOLD            0.650
ACTIVE ALERTS           0
LAST INCIDENT       2h 14m ago
```
Fused Score number animates with spring physics on every update

---

## 4. PAGE: COMMAND CENTER (`/` — `app/page.tsx`)

This is the "mission control" page. Everything important at a glance. Dense, alive, authoritative.

### Layout Grid (CSS Grid, 12-col)
```
┌──────────────────────────────────────────────────────────────────────┐
│  SYSTEM STATUS BAR (full width, 36px)                                │
├─────────────────┬─────────────────┬──────────────────────────────────┤
│  FUSED SCORE    │  STAGE HEALTH   │  SYSTEM TELEMETRY STRIP         │
│  HERO METRIC    │  HEXAGONAL MAP  │  (scrolling marquee, 36px)      │
│  (col 1-4)      │  (col 5-8)      │  (col 9-12)                     │
├─────────────────┴─────────────────┴──────────────────────────────────┤
│  LIVE ANOMALY TIMELINE CHART (full width, 220px)                     │
├──────────────────────────────────┬───────────────────────────────────┤
│  TOP CONTRIBUTING SENSORS        │  INCIDENT FEED                   │
│  (col 1-7, 280px)               │  (col 8-12, 280px)               │
├──────────────────────────────────┼───────────────────────────────────┤
│  SENSOR READINGS TABLE           │  PREDICTION HORIZON              │
│  (col 1-7, 220px)               │  (col 8-12, 220px)               │
└──────────────────────────────────┴───────────────────────────────────┘
```

### Component A: System Status Bar
**Height**: 36px, full width, `background: rgba(0,240,255,0.04)`, `border-bottom: 1px solid rgba(0,240,255,0.1)`
**Content** (scrolling ticker if too much content, else static):
```
◉ P101 RUNNING  ◉ P102 RUNNING  ◉ MV101 OPEN  ◉ MV201 OPEN  ◉ MV301 OPEN  ◉ UV401 ACTIVE  ◉ P501 RUNNING
```
Each item: icon (circle) colored by state, sensor ID in JetBrains Mono
Anomalous sensors flash their icon at 1Hz

### Component B: Fused Score Hero Metric
**Size**: col-span-4, ~280px tall glass panel
**Content**:
```
                FUSED ANOMALY SCORE

                    0.412
              ●━━━━━━━━━╸━━━━━━━━━━━○
              0                    1.0
                    THRESHOLD: 0.650

              STATUS: NORMAL
              Δ +0.003 vs 60s ago

  Mahalanobis: 0.38    Collapse: 0.45
```
- The `0.412` is in Orbitron 72px, color interpolates: green (<0.4) → amber (0.4-0.6) → red (>threshold)
- Circular progress ring behind the number (SVG, animated)
- The gauge bar: custom SVG with a neon glow cursor
- Spring animation on number change (framer-motion `useSpring`)
- STATUS text: "NORMAL" in emerald / "ALERT" in red (Orbitron, blinking when ALERT)
- Below score: two sub-scores side by side in smaller text

**Backend needs**: `GET /api/status/live` or WebSocket stream — `{anomaly_score, threshold, is_alert, mahal_score, collapse_score, delta_60s}`

### Component C: Stage Health Hexagonal Map
**Size**: col-span-4, same height as B
**Concept**: 6 hexagons arranged in SWaT pipeline order (1→6 left to right with connecting arrows)

```
[S1]──►[S2]──►[S3]──►[S4]──►[S5]──►[S6]
 ●        ●       🔴      ●       ●       ●
 RO      Dose    UF     Dechlor   RO    Permeate
 Feed    Tank   System          System  Collect
```
- Each hexagon: SVG hexagon, filled with stage color, glow on alert
- Stage name + abbreviation below
- Max anomaly score for that stage as small number inside
- Arrow between stages: animated flow particles (small dots) moving left to right; particles turn red if downstream stage anomalous
- Click: navigates to `/twin` with camera on that stage

**Backend needs**: `GET /api/stages/health` — `[{stage_id, stage_name, max_score, sensors: [{id, score}]}]`

### Component D: System Telemetry Strip
**Size**: col-span-4, 36px (same row as B and C)
**Concept**: A horizontally scrolling marquee of live readings for ALL sensors
```
FIT101: 2.441 L/s  |  LIT101: 749.3 mm  |  MV101: OPEN  |  P101: ON  |  DPIT101: 14.2 kPa  |  ...
```
Animated values update in-place with subtle flash on change.

**Backend needs**: `GET /api/sensors/all-live` — full sensor value map

### Component E: Live Anomaly Timeline Chart
**Size**: Full width, 220px, glassmorphism panel
**Library**: `uPlot` or `Recharts` (uPlot strongly preferred for performance)
**Chart Content**:
- Primary line: Fused anomaly score — cyan `#00F0FF`, line weight 2px, glow shadow
- Secondary line: Mahalanobis score — `rgba(0,240,255,0.4)` dashed
- Tertiary line: Collapse score — `rgba(173,255,47,0.4)` dashed
- Threshold line: Red `#FF4444` dashed, label "THRESH" on right axis
- Background: Subtle grid lines `rgba(255,255,255,0.04)`
- Alert regions: Red semi-transparent fills where `is_alert=true`
- X-axis: Last 5 minutes, sliding window (oldest drops off left)
- Y-axis: 0 to 1.0, right-aligned, JetBrains Mono labels
- Gradient fill: Under primary line, cyan→transparent gradient

**Above the chart (control row)**:
```
[Live ●]  [1m]  [5m]  [15m]  [1h]  |  [Score ✓]  [Mahal ✓]  [Collapse ✓]  |  Zoom: [+][-]
```
Time range buttons switch from live-rolling to historical fetch

**Interactions**:
- Hover: vertical hairline crosshair (cyan) + tooltip showing all three scores at that timestamp
- Click-drag: Select a time range → highlights region + "Open in Replay →" button appears
- Alert spikes: On `is_alert=true`, chart injects a faint red vertical rule + small alert icon at top

**Backend needs**: WebSocket stream `{timestamp, fused_score, mahal_score, collapse_score, is_alert}` at ~200ms intervals. `GET /api/scores/history?minutes=60` for historical

### Component F: Top Contributing Sensors (XAI Panel)
**Size**: col-span-7, 280px
**Concept**: Horizontal bar chart of top-N sensor attributions, updated every inference cycle

```
TOP CONTRIBUTING SENSORS          Last updated: 14:23:07.412

FIT301   ████████████████████████░░░░░  0.847  Stage 3  ↑ RISING
DPIT301  ██████████████░░░░░░░░░░░░░░░  0.631  Stage 3  → STABLE
LIT301   █████████░░░░░░░░░░░░░░░░░░░░  0.412  Stage 3  ↓ FALLING
FIT101   █████░░░░░░░░░░░░░░░░░░░░░░░░  0.281  Stage 1  ↑ RISING
P101     ██░░░░░░░░░░░░░░░░░░░░░░░░░░░  0.134  Stage 1  → STABLE
```
- Bar: Fills from left, color: acid green `#ADFF2F` for top contributor, fading to cyan for lower ones
- Each bar height: 32px, gap: 4px, smooth width animation (Framer Motion `width` spring)
- Stage badge: colored pill (each stage has a distinct muted color)
- Trend arrow: ↑ rising (red if score > 0.5), → stable (gray), ↓ falling (green)
- Clicking a row: opens a right-side drawer with that sensor's full mini-profile (sparkline, description, normal range, current vs baseline)

**Header controls**:
```
TOP CONTRIBUTING SENSORS  [Top 5 ▾]  [Grad-CAM ✓]  [Var-Collapse ✓]  [Fused ✓]  [?]
```

**Backend needs**: WebSocket stream or `GET /api/xai/attributions` — `[{sensor_id, score, stage, trend, method}]`

### Component G: Incident Feed
**Size**: col-span-5, 280px, right of F
**Concept**: Live-updating list of recent incidents, most recent first

```
INCIDENT FEED                               [View All →]

● #2847  ACTIVE NOW                    Stage 3 · Freeze Attack suspected
  14:23:07  Duration: 0:34  Peak: 0.891   [▶ Replay]  [📋 Report]

◈ #2846  RESOLVED  TP                  Stage 1 · Offset Attack
  11:41:22  Duration: 2:18  Peak: 0.743   [▶ Replay]  [📋 Report]

◈ #2845  RESOLVED  FP                  Stage 5 · Noise
  09:12:05  Duration: 0:08  Peak: 0.668   [▶ Replay]  [📋 Report]
```
- Active incident: red left border, subtle pulsing background
- Each row: 72px tall, glass background, hover lifts with shadow
- Status badges: `TP` (True Positive, emerald), `FP` (False Positive, amber), `?` (unreviewed, violet)
- "ACTIVE NOW" badge pulses

**Backend needs**: `GET /api/incidents?limit=10` — `[{id, status, start_time, duration, peak_score, top_stage, suspected_attack, ground_truth}]` + WebSocket push on new incident

### Component H: Prediction Horizon
**Size**: col-span-5, 220px
**Concept**: "Time to breach" forecast with confidence interval

```
PREDICTIVE HORIZON

Time to threshold breach:
         14m 32s
    ████████████████░░░░  67% confidence

[●●●●●●●●●●●●●○○○○○○○○○○○]
Safe      Caution    CRITICAL

Trend: STABLE  Model: LSTM-Mini  Horizon: ±5min
```
- Big countdown in Orbitron, color changes as time decreases
- Confidence interval visualized as shaded region on mini chart
- Segmented bar at bottom showing safety zones
- When "time to breach" < 2 minutes: transitions to urgent red, pulsing

**Backend needs**: `GET /api/prediction/horizon` — `{time_to_breach_seconds, confidence, trend, prediction_scores: [{t, score_low, score_mid, score_high}]}`

### Component I: Sensor Readings Table
**Size**: col-span-7, 220px
**Concept**: Dense live table of all 51 SWaT sensors

```
SENSOR READINGS                    [Filter by Stage ▾]  [Show Anomalous Only ✓]

SENSOR   CURRENT    BASELINE   DELTA      STAGE  STATUS
FIT101   2.441     2.438      +0.003     S1     ● NORMAL
LIT101   749.3     748.1      +1.2       S1     ● NORMAL
MV101    OPEN      OPEN       —          S1     ● NORMAL
P101     ON        ON         —          S1     ● NORMAL
FIT201   1.893     1.887      +0.006     S2     ● NORMAL
DPIT301  14.2      12.1       +2.1       S3     ⚠ WARNING
FIT301   0.000     2.441      -2.441     S3     ● ALERT
```
- Table rows: 28px compact
- CURRENT column: JetBrains Mono, live updating, flashes white for 300ms on value change
- DELTA: colored green (negative/decreasing deviation) or red (positive deviation, arrow ↑↓)
- STATUS: dot icon colored by state
- Row highlight: full-row amber background on WARNING, red on ALERT (subtle)
- Scrollable, virtualized for performance (react-virtual)
- Click row: opens sensor drawer (same as F)

**Backend needs**: WebSocket stream or polling `GET /api/sensors/all` — full sensor snapshot with current + baseline + status

---

## 5. PAGE: DIGITAL TWIN 3D (`/twin` — `app/twin/page.tsx`)

The most impressive page. This IS the digital twin. Full screen, immersive.

### Library: `@react-three/fiber` + `@react-three/drei` + `@react-three/postprocessing`

### Layout: Near-Fullscreen
```
┌──────────────────────────────────────────────────────────────────────┐
│  TOP NAV (minimal, semi-transparent over 3D)                         │
├────────────────────────────────────────────────────────┬─────────────┤
│                                                        │  SIDE PANEL │
│  3D SCENE (full canvas, ~80vw)                        │  (320px)    │
│                                                        │             │
│  [Floating control bar at bottom-left]                │  Sensor     │
│                                                        │  Details    │
│  [Stage labels floating in 3D space]                  │             │
│                                                        │  Alert      │
│  [Alert pulse ripples radiating from anomalous nodes] │  Feed       │
│                                                        │             │
└────────────────────────────────────────────────────────┴─────────────┘
```

### 3D Scene Architecture

#### SWaT Plant 3D Model

**Option A — Premium: Buy/Get Free 3D Assets**
- Sketchfab.com: Search "water treatment plant" (many free CC0 models)
  - "Industrial Pipes" pack: https://sketchfab.com/3d-models/industrial-pipes
  - "Water Tank" models available free
  - Convert to GLTF/GLB → use `useGLTF` from drei
- TurboSquid: Professional water treatment plant models (~$50-200)
- CGTrader: Industrial equipment models
- **Best source**: Search "water treatment plant glb free" or "industrial pump 3d model gltf"
- For a demo: Simple geometric primitives look incredible with right lighting/materials

**Option B — Procedural (Recommended for control):**
Build from R3F primitives — looks great with good materials:

```
Stage 1 (Raw Water Feed):
- Large rectangular tank (BoxGeometry, dark metal material)
- 2 cylindrical pumps P101, P102
- Flow meters FIT101 as small toroidal rings
- Level sensor LIT101 as vertical rod with float
- Pipes connecting all (CylinderGeometry, rotated)
- Motor valves MV101-MV104 as small cubic markers

Stage 2 (Dosing):
- Chemical dosing tank (CylinderGeometry, shorter)
- Pump P201, P202 (smaller cylinders)

Stage 3 (Ultrafiltration):
- UF membrane housing (longer cylinder, horizontal)
- Multiple sub-tanks
- DPIT sensors as pressure gauge circles

Stage 4 (Dechlorination):
- UV lamp housing (long horizontal cylinder, faint blue glow)
- Dosing pumps

Stage 5 (Reverse Osmosis):
- RO pressure vessels (long horizontal cylinders)
- High-pressure pump (large cylinder)
- Membrane differential pressure sensors

Stage 6 (Permeate/Collection):
- Collection tanks
- Quality sensors
```

#### Materials & Lighting
```javascript
// Metal pipes/structures
<meshStandardMaterial color="#1a2540" metalness={0.8} roughness={0.3} />

// Tanks (darker, matte)
<meshStandardMaterial color="#0d1520" metalness={0.5} roughness={0.6} />

// Sensor Orbs (the key visual element)
// Normal state:
<meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={0.3} />
// Alert state (lerp to):
<meshStandardMaterial color="#FF4444" emissive="#FF4444" emissiveIntensity={1.5} />

// Ambient lighting: very dim, bluish (#0a1520)
// Point light: cyan, low intensity, from above each stage
// Spot light: on active/alert component — dramatic
// Post-processing: Bloom effect (UnrealBloomPass) — makes neon elements glow beautifully
// Post-processing: ChromaticAberration — subtle, adds film quality
// Post-processing: Vignette — darkens corners
```

#### Sensor Orbs (`components/twin/SensorOrb.tsx`)
Every sensor rendered as a small sphere (radius 0.15 units) above its physical location:
- Normal: dim cyan glow (`emissiveIntensity: 0.3`)
- Warning: amber, pulsing (`useFrame` to lerp emissiveIntensity between 0.5-1.5`)
- Alert: red, rapid pulse + `PointLight` added dynamically with high intensity + bloom
- On hover: scale to 1.3 + label appears (Html component from drei)
- On click: camera animates to focus + side panel slides open

#### Pipe Flow Particles
Use `Points` geometry along pipe path curves:
- 200 particles per pipe, moving along tube path
- Normal: tiny cyan dots
- Attack scenario: particles turn red, move erratically
- When a valve closes: particles stop, then accumulate at valve position

#### Camera System
```javascript
// OrbitControls from drei — always enabled
// Stage focus: on stage click, use useSpring to lerp camera target + position
// Auto-rotate: very slow (0.0005 rad/s) when idle >30s, stops on interaction
// Alert auto-focus: when is_alert fires, camera smoothly moves to alert stage
```

#### Post-Processing (`@react-three/postprocessing`)
```
EffectComposer:
  - Bloom: threshold 0.8, strength 1.5, radius 0.4 (makes emissive glow)
  - ChromaticAberration: offset [0.0005, 0.0005] (subtle film quality)
  - Vignette: darkness 0.6, offset 0.1
  - Noise: opacity 0.03 (adds texture, feels engineered not digital)
```

#### Floating Stage Labels (drei `Html`)
Each stage gets a floating label in 3D space:
```
[  STAGE 3 — ULTRAFILTRATION  ]
   ● 24 Sensors Active
   Max Score: 0.847
   Status: ⚠ WARNING
```
Glass-styled, pointer-events enabled, fades on camera angle

### Floating Control Bar (bottom-left, over canvas)
```glass-elevated panel, 48px tall, horizontal pill```
```
[Stage 1] [Stage 2] [Stage 3] [Stage 4] [Stage 5] [Stage 6]  |  [Reset Camera]  [Auto-Focus ◉]  [Particles ◉]  [Labels ◉]
```
Click stage: camera flies to that stage

### Side Panel (`components/twin/SensorDetailPanel.tsx`)
Opens when sensor orb clicked. 320px wide, full height, glass panel sliding in from right (Framer Motion `x` spring).

```
╔══════════════════════════════╗
║ FIT301                   [✕] ║
║ Flow Indicator Transmitter   ║
║ Stage 3 — Ultrafiltration    ║
╠══════════════════════════════╣
║  CURRENT VALUE               ║
║    0.000  L/s    ⚠ ALERT    ║
║                              ║
║  BASELINE: 2.441 L/s         ║
║  DEVIATION: -2.441 (100%)    ║
╠══════════════════════════════╣
║  SPARKLINE (last 5 min)      ║
║  ~~~⌒⌒⌒⌒_______             ║
╠══════════════════════════════╣
║  ATTRIBUTION SCORE           ║
║  ████████████████ 0.847      ║
║  Rank: #1 of 51 sensors      ║
╠══════════════════════════════╣
║  CORRELATIONS                ║
║  DPIT301  ████  0.82 corr   ║
║  LIT301   ████  0.71 corr   ║
╠══════════════════════════════╣
║  NORMAL RANGE                ║
║  Min: 1.8 L/s  Max: 3.1 L/s ║
║  Std Dev: 0.18 L/s           ║
╠══════════════════════════════╣
║  [View in Graph]  [Replay]   ║
╚══════════════════════════════╝
```

**Backend needs**:
- `GET /api/twin/scene-data` — all sensor positions (x,y,z mapped to plant layout), current values, states
- WebSocket stream for live sensor states
- `GET /api/sensors/{id}/details` — full sensor profile including baseline, correlations
- `GET /api/sensors/{id}/history?minutes=5` — sparkline data

---

## 6. PAGE: SENSOR CAUSAL GRAPH (`/graph` — `app/graph/page.tsx`)

### Library: `react-force-graph` (ForceGraph2D + ForceGraph3D toggle)

### Layout
```
┌──────────────────────────────────────────────────────────────────────┐
│  [2D / 3D Toggle]  [Filter: Stage ▾]  [Show Edges: All / Attack /   │
│   Physical]  [Node Size: Attribution / Degree / Uniform]  [Freeze]  │
├─────────────────────────────────────────────────┬────────────────────┤
│                                                  │ GRAPH LEGEND       │
│  FORCE-DIRECTED GRAPH CANVAS                     │ & CONTROLS         │
│  (full width minus legend, full height)         │ (280px)            │
│                                                  │                    │
│  Nodes: sensors as circles                       │ Legend:            │
│  Edges: correlations as lines                    │ Node color key     │
│  Attack propagation: animated particles          │ Edge weight key    │
│                                                  │                    │
│                                                  │ Selected Node      │
│                                                  │ Details            │
│                                                  │                    │
│                                                  │ Causal Chain       │
│                                                  │ Panel              │
│                                                  │                    │
└─────────────────────────────────────────────────┴────────────────────┘
```

### Graph Visual Design

**Nodes**:
- **Size**: Proportional to attribution score (min 6px, max 20px radius)
- **Color**: 
  - Green: normal (attribution < 0.3)
  - Amber: elevated (0.3-0.6)
  - Red + glow: alert (> threshold)
  - Stroke: white 1px on normal, red 2px on alert
- **Label**: Sensor ID in JetBrains Mono 9px, below node
- **Stage grouping**: Nodes cluster loosely by stage (force charge adjusted), stage boundary shown as faint circle outline

**Edges**:
- **Thickness**: Proportional to correlation strength
- **Color**:
  - Physical connections (pipes, electrical): `rgba(0,240,255,0.4)` solid
  - Learned correlations: `rgba(0,240,255,0.15)` dashed
  - Under attack: `rgba(255,68,68,0.6)` — the "infected" edge
- **Animated particles on edges**: 
  - Normal: tiny cyan dots flowing
  - Attack propagation: red dots flowing from root cause outward
  - Particle speed proportional to correlation strength

**Attack Propagation Animation**:
When alert fires:
1. Root cause node pulses red brightly
2. Particles emit from root cause node along correlated edges
3. Each neighbor node "receives" the infection at delay proportional to edge weight
4. Visual ripple effect — concentric rings emit from each affected node
5. Timeline at bottom shows propagation sequence

### Graph Controls (top bar)
```
[● 2D]  [⬡ 3D]  |  Stages: [ALL] [S1] [S2] [S3] [S4] [S5] [S6]  |  
Edge: [Physical] [Learned] [Both]  |  Node Size: [Attribution ▾]  |
[Freeze Layout]  [Reset]  [Export PNG]
```

### Right Panel — Causal Chain Analysis
When a node is selected OR when alert active, shows automated causal chain:
```
╔══════════════════════════════╗
║ CAUSAL CHAIN ANALYSIS        ║
╠══════════════════════════════╣
║ ROOT CAUSE (suspected)       ║
║  FIT301 ──── Stage 3        ║
║  Attack Type: Freeze         ║
║  First detected: 14:23:07   ║
╠══════════════════════════════╣
║ PROPAGATION PATH             ║
║  FIT301                      ║
║    ↓ 0.82 corr (0.3s lag)  ║
║  DPIT301                     ║
║    ↓ 0.71 corr (0.8s lag)  ║
║  LIT301                      ║
║    ↓ 0.55 corr (1.4s lag)  ║
║  P301                        ║
╠══════════════════════════════╣
║ ISOLATION RECOMMENDATION     ║
║ Isolate: MV301 (Stage 3 in) ║
║ Monitor: P501 (downstream)   ║
╠══════════════════════════════╣
║ [Replay Attack Path ▶]       ║
║ [Counterfactual: Isolate FIT301]║
╚══════════════════════════════╝
```

**Backend needs**:
- `GET /api/graph/topology` — `{nodes: [{id, stage, sensor_type, position_hint}], edges: [{source, target, weight, type}]}`
- `GET /api/graph/node-states` (or WebSocket) — `{sensor_id, value, attribution_score, is_alert}` for all nodes
- `GET /api/graph/causal-chain` — computed when alert fires: `{root_cause, propagation_path, recommendation}`
- Edge weights computed from Mahalanobis covariance matrix (precomputed, static)

---

## 7. PAGE: TIME-TRAVEL REPLAY (`/replay` — `app/replay/page.tsx`)

### Library: `framer-motion` for scrubber, `uPlot` for timeline charts

### Layout
```
┌──────────────────────────────────────────────────────────────────────┐
│  INCIDENT SELECTOR  [< Prev Incident] [Incident #2847 ▾] [Next >]   │
├──────────────────────────────────────────────────────────────────────┤
│  MULTI-TRACK TIMELINE (full width, 200px)                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Score  ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∩∩∩∩∩∩∩∩∩∩∩∩∩∩∩∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿ │   │
│  │ FIT301 ────────────────│░░░░░░░░░░░░│─────────────────────  │   │
│  │ DPIT301 ───────────────│░░░░░░░░│───────────────────────── │   │
│  │ Events ●login ●thresh  ●ALERT ●operator●resolved           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ⠀⠀⠀▲ PLAYHEAD (draggable, cyan vertical line)                      │
├──────────────────────────────────────────────────────────────────────┤
│  PLAYER CONTROLS                                                      │
│  [|◀] [◀◀] [▶/⏸] [▶▶] [▶|]  0.25x 0.5x [1x] 2x 4x 8x  |          │
│  [Jump to: Alert Start] [Alert Peak] [Alert End]                      │
├─────────────────────────────┬──────────────────────────────┬─────────┤
│  SENSOR STATE at playhead   │  XAI ATTRIBUTION at playhead │ MINI   │
│  (same as table, frozen     │  (bar chart, frozen state)   │ GRAPH  │
│   at playhead time)         │                              │ STATE  │
│                             │                              │        │
└─────────────────────────────┴──────────────────────────────┴─────────┘
```

### Multi-Track Timeline Component (`components/replay/MultiTrackTimeline.tsx`)

This is the most complex component. Uses custom SVG rendering for performance.

**Track 1: Fused Score** (40px tall)
- Area chart, cyan fill with gradient
- Alert region: semi-transparent red fill overlay
- Threshold line: red dashed

**Track 2-4: Top 3 Sensor Attributions** (24px each)
- Thin area charts, each a different color (acid green, violet, amber)
- Shows how attribution changed over time

**Track 5: System Events** (24px)
- Lollipop marks at timestamp positions
- Event types: `alert_start` (red), `alert_end` (green), `operator_action` (blue), `threshold_cross` (amber)
- On hover: tooltip with event description

**Playhead**:
- Vertical cyan line, `cursor: ew-resize` on grab
- Dragging updates all "frozen" panels below in real time
- Snaps to keyframes when near (<5px)

**Keyframe Markers** (above timeline):
- Diamond shapes at: alert start, alert peak, alert end
- Labeled: "Alert Start ▼", "Peak 0.891 ▼"

### Player Controls Bar (`components/replay/PlayerControls.tsx`)
```
[⏮]  [⏭]  [▶]  [⏭]  [⏭]  |  Speed: [0.25x] [0.5x] [●1x] [2x] [4x] [8x]  |  [Loop ○]
Jump: [Alert Start] [Peak] [Alert End]  |  [Export Clip]  [Share Link 🔗]
```
- Play/pause with Space hotkey (keyboard shortcut shown: `Space`)
- Speed: Framer Motion `animate` speed factor
- "Export Clip": generates JSON of timestamp range + context
- "Share Link": encodes `?incident=2847&t=14:23:07` in URL hash

### Frozen Panels (update as playhead moves):
These show the system state at the exact playhead timestamp — not live.

**Sensor State at Playhead**: Same table as dashboard, but values from history
**XAI Attribution at Playhead**: Bar chart from stored attribution snapshots
**Mini Graph State**: Small force-graph showing which edges were "active" at that moment

**Backend needs**:
- `GET /api/incidents/{id}` — full incident metadata
- `GET /api/incidents/{id}/timeline` — `{scores: [{t,score}], attributions: [{t, sensors:[{id,score}]}], events: [{t, type, description}]}`
- `GET /api/incidents/{id}/sensors-at?timestamp=...` — sensor values at specific time
- `GET /api/incidents` — list for selector dropdown

---

## 8. PAGE: ATTACK SANDBOX (`/sandbox` — `app/sandbox/page.tsx`)

### Layout: Split — Left 60% (Preview), Right 40% (Attack Builder)
```
┌──────────────────────────────────┬──────────────────────────────────┐
│  LIVE SYSTEM PREVIEW             │  ATTACK BUILDER                  │
│  (mini dashboard — anomaly       │                                  │
│   score chart + top sensors)     │  ┌──────────────────────────┐   │
│                                  │  │  ATTACK LIBRARY          │   │
│  Status: ◉ MONITORING           │  │  [Freeze] [Offset]       │   │
│                                  │  │  [Noise]  [Replay]       │   │
│  [3D Mini Twin View]             │  │  [Coordinated]           │   │
│   (same R3F scene, smaller)      │  └──────────────────────────┘   │
│                                  │                                  │
│                                  │  ┌──────────────────────────┐   │
│                                  │  │  ATTACK CONFIG           │   │
│                                  │  │  Target: [FIT301 ▾]      │   │
│                                  │  │  Duration: [30s ───●───] │   │
│                                  │  │  Intensity: [●──────────]│   │
│                                  │  │  Stealth: [LOW    HIGH]  │   │
│                                  │  └──────────────────────────┘   │
│                                  │                                  │
│                                  │  [▶ INJECT ATTACK]              │
│                                  │  [⏹ STOP]  [↺ RESET]          │
│                                  │                                  │
│                                  │  DETECTION METRICS              │
│                                  │  Time to Detect: 2.34s          │
│                                  │  Evasion Score: 34%             │
│                                  │  Peak Score: 0.847              │
└──────────────────────────────────┴──────────────────────────────────┘
```

### Attack Cards (`components/sandbox/AttackCard.tsx`)
Each attack type as a large card (120px × 80px), selectable:

```
┌──────────────────────┐
│  ❄  FREEZE           │
│  Hold sensor at      │
│  constant value      │
│                      │
│  Detection Rate: 98% │
└──────────────────────┘
```
Colors: Freeze=blue, Offset=amber, Noise=purple, Replay=green, Coordinated=red

### Attack Config Panel
Dynamic based on attack type:
- **Target Sensor**: Searchable dropdown of all 51 SWaT sensors with stage grouping
- **Duration**: Slider (5s to 300s)  
- **Intensity**: For offset: `+/- X std deviations`. For noise: sigma multiplier
- **Stealth Mode**: Slider — affects how gradual/subtle the attack is
- **Multi-sensor (Coordinated)**: Drag multiple sensors in, set delays between them

### Evasion Score Gamification
```
EVASION SCORE

████████████░░░░░░░░  34%

Detection in: 2.34s (benchmark: 3.1s)
Rating: ● DETECTED FAST
Leaderboard: Rank #7 of 23 attempts
```
After attack ends: animated score reveal with letter grade (A-F)

**Backend needs**:
- `POST /api/sandbox/attack` — `{type, sensor_ids, duration, intensity, stealth}`
- Backend modifies the inference stream to inject synthetic attack data
- `GET /api/sandbox/result/{attack_id}` — `{time_to_detect, evasion_score, peak_score, detection_timeline}`
- `GET /api/sandbox/leaderboard` — top evasion scores by attack type

---

## 9. PAGE: INCIDENT INTELLIGENCE (`/incidents` — `app/incidents/page.tsx`)

### Layout: Left sidebar list + Right detail panel
```
┌──────────────────────┬───────────────────────────────────────────────┐
│  INCIDENT LIST       │  INCIDENT DETAIL (Incident #2847)             │
│  (340px)             │                                               │
│  ┌──────────────────┐│  ┌─────────────────────────────────────────┐ │
│  │ Filters:         ││  │ HEADER: ID / Time / Duration / Severity │ │
│  │ [All] [TP] [FP]  ││  └─────────────────────────────────────────┘ │
│  │ [Unreviewed]     ││                                               │
│  └──────────────────┘│  [SCORE CHART]  [XAI HEATMAP]  [GRAPH]      │
│                       │                                               │
│  Sorted by: Latest ▾ │  ┌─────────────────────────────────────────┐ │
│                       │  │ AI NARRATIVE                            │ │
│  ● #2847  ACTIVE      │  │ "A coordinated attack targeting..."     │ │
│  ◈ #2846  TP   ⭐    │  └─────────────────────────────────────────┘ │
│  ◈ #2845  FP         │                                               │
│  ◈ #2844  ?          │  [True Positive] [False Positive] [Unclear]  │
│  ◈ #2843  TP         │                                               │
│  ...                  │  [▶ Open in Replay]  [📋 Export Report]      │
└──────────────────────┴───────────────────────────────────────────────┘
```

### Incident Detail View
**Header Card**: Incident ID in Orbitron, timestamp, duration, peak score (large), severity badge

**Three tabs**: `Score Timeline` | `Sensor Attribution` | `Causal Graph`

**Score Timeline tab**: Same as replay mini-view, pre-loaded for this incident

**Sensor Attribution tab**:
```
GRAD-CAM HEATMAP
[Sensor IDs across X-axis] × [Time across Y-axis]
Color: Cold (blue=low) → Hot (red=high attribution)
Colormap: plasma or inferno
```
Display from existing `runs/heatmaps/` images OR generate via backend endpoint
Overlay on top: threshold crossing line

**AI Narrative Card** (mock, or real GPT integration):
Formatted text card, icon + "AI Analysis" label:
```
╔═══════════════════════════════════════════════════════╗
║ ✦ AI INCIDENT ANALYSIS                               ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║ A freeze attack pattern was detected targeting        ║
║ sensor FIT301 (Stage 3, Ultrafiltration) at           ║
║ 14:23:07 UTC. The sensor maintained an invariant      ║
║ value of 0.000 L/s for 34 seconds while the          ║
║ surrounding system continued to evolve normally.      ║
║                                                       ║
║ Affected downstream: DPIT301, LIT301, P301            ║
║                                                       ║
║ Recommended Actions:                                  ║
║ 1. Manually verify FIT301 physical state              ║
║ 2. Check MV301 actuator for unauthorized commands     ║
║ 3. Review network access logs 14:20-14:25 UTC         ║
╚═══════════════════════════════════════════════════════╝
```

**Ground Truth Feedback** (below narrative):
```
OPERATOR FEEDBACK
[✓ True Positive]  [✗ False Positive]  [? Unclear]  [Add Note...]
```
Saves to DB. Marked incidents get star indicator in list

**Backend needs**:
- `GET /api/incidents` — paginated list with filters
- `GET /api/incidents/{id}` — full detail with attribution, scores, narrative
- `GET /api/incidents/{id}/heatmap` — heatmap image URL or base64
- `POST /api/incidents/{id}/feedback` — `{ground_truth, note}`
- `GET /api/incidents/{id}/report` — PDF export

---

## 10. PAGE: ANALYTICS (`/analytics` — `app/analytics/page.tsx`)

### Layout: Executive KPI strip + Chart grid
```
┌──────────────────────────────────────────────────────────────────────┐
│  KPI STRIP (full width, 100px, animated counters)                    │
│  [Uptime 99.97%]  [MTTD 1.24s]  [Incidents 47]  [True Pos Rate 94%]│
│  [FP Rate 6%]  [Avg Peak Score 0.712]  [Cost Saved $2.4M*]          │
├───────────────────────────┬──────────────────────────────────────────┤
│  INCIDENTS OVER TIME      │  ATTACK TYPE DISTRIBUTION                │
│  (bar chart, 30 days)     │  (donut chart)                          │
├───────────────────────────┼──────────────────────────────────────────┤
│  DETECTION ACCURACY       │  SENSOR ANOMALY HEATMAP                 │
│  Precision/Recall curve   │  Calendar heatmap (GitHub style)        │
│  F1 vs Threshold slider   │  X: days, Y: sensors, Z: avg score      │
├───────────────────────────┴──────────────────────────────────────────┤
│  MODEL PERFORMANCE OVER TIME (line charts: F1, precision, recall)    │
└──────────────────────────────────────────────────────────────────────┘
```

### KPI Cards (`components/analytics/KpiCard.tsx`)
Each: 160px wide, glass panel, animated counter (useSpring) on page load
Icon + metric name + big number in Orbitron + delta vs last period (↑↓ colored)

### Sensor-Day Heatmap
Like GitHub contribution graph but:
- Y-axis: 51 sensor IDs (grouped by stage)
- X-axis: Last 30 days
- Cell color: Average anomaly score for that sensor that day (0=dark, 1=bright red)
- Hover: tooltip with exact value + day
- Clicking cell: opens replay for that day filtered to that sensor

**Backend needs**:
- `GET /api/analytics/kpis` — all KPI values
- `GET /api/analytics/incidents-over-time?days=30` — daily incident counts
- `GET /api/analytics/attack-types` — distribution data
- `GET /api/analytics/sensor-heatmap?days=30` — matrix data
- `GET /api/analytics/model-performance` — F1/precision/recall time series

---

## 11. PAGE: THRESHOLD CALIBRATION (`/calibration`)

### Layout: Full-width calibration workspace
```
┌──────────────────────────────────────────────────────────────────────┐
│  CALIBRATION MODE  ⚠ Changes affect live detection                  │
├────────────────────────┬─────────────────────────────────────────────┤
│  PARAMETERS            │  IMPACT PREVIEW                             │
│                        │                                             │
│  Global Threshold      │  F1 Score:    0.912 → 0.934 ↑             │
│  [━━━━━━━●━━━━━] 0.650 │  Precision:   0.924 → 0.891 ↓             │
│                        │  Recall:      0.901 → 0.979 ↑             │
│  Fusion Weight α       │  FP Rate:     0.062 → 0.041 ↓ ✓          │
│  [━━━━━━━━━━●━] 0.7   │                                             │
│                        │  ┌─────────────────────────────────────┐  │
│  Cooldown (seconds)    │  │ PRECISION-RECALL CURVE              │  │
│  [●━━━━━━━━━━━] 30    │  │ (live updates as slider moves)      │  │
│                        │  │ Current threshold marked            │  │
│  Per-Stage Overrides   │  └─────────────────────────────────────┘  │
│  S1: [default]         │                                             │
│  S2: [default]         │  On validation set: 1000 windows           │
│  S3: [●─────] 0.580   │  TP: 847  FP: 51  FN: 23  TN: 79         │
│  S4: [default]         │                                             │
│                        │  [Preview on Last 24h Data]                │
│  [Apply to Live ▶]     │  [Rollback to Last ↩]                     │
│  [Save as Preset]      │                                             │
└────────────────────────┴─────────────────────────────────────────────┘
```

**Backend needs**:
- `GET /api/calibration/current` — current threshold, alpha, cooldown settings
- `POST /api/calibration/preview` — compute metrics for proposed threshold (returns F1, P, R, confusion matrix)
- `POST /api/calibration/apply` — apply new settings to live system
- `GET /api/calibration/history` — previous threshold settings with timestamps

---

## 12. SHARED/REUSABLE COMPONENTS

### `components/ui/LiveIndicator.tsx`
Blinking dot — WebSocket connection status. Used in top nav.
```
● LIVE    (green, blinking)
● OFFLINE (gray, static)
● ALERT   (red, fast blink)
```

### `components/ui/SensorBadge.tsx`
Compact sensor reference chip used everywhere.
```
[FIT301 ⚠]  — amber border, stage color dot
```

### `components/ui/ScoreGauge.tsx`
Reusable circular gauge for anomaly score.
Parametrized: size, showLabel, animated.

### `components/ui/AlertBanner.tsx`
Full-width slide-down banner on alert:
```
╔══════════════════════════════════════════════════════════════════╗
║  ⚠ ALERT #2847  ·  Stage 3 Ultrafiltration  ·  Score: 0.891   ║
║  FIT301, DPIT301, LIT301 affected  ·  Started 14:23:07         ║
║  [▶ View Now]                             [Dismiss for 5min]   ║
╚══════════════════════════════════════════════════════════════════╝
```
Framer Motion `AnimatePresence` + `y` spring from -100 to 0.
Red pulse background, border glow.

### `components/ui/SensorDrawer.tsx`
Right-side drawer for sensor details. Used across pages.
Framer Motion slide-in from right. `useClickOutside` to close.

### `components/ui/Tooltip.tsx`
Custom tooltip (not browser default). Dark glass style.
JetBrains Mono for data values inside.

### `components/ui/DataTable.tsx`
Virtualized table (react-virtual). Used for sensor readings.
Configurable columns, sort, filter. Compact 28px rows.

### `components/ui/SparklineChart.tsx`
Tiny inline chart (60px × 24px). Used inside table cells and drawer.
SVG path, no axes, just the shape. Cyan or red based on trend.

---

## 13. GLOBAL STATE (`lib/store.ts` — Zustand)

```typescript
interface SystemStore {
  // Live data
  fusedScore: number;
  mahalScore: number;
  collapseScore: number;
  threshold: number;
  isAlert: boolean;
  alertId: string | null;
  topSensors: SensorAttribution[];
  allSensorValues: Record<string, SensorValue>;
  
  // Connection
  wsStatus: 'connecting' | 'live' | 'offline';
  lastUpdateAt: number;
  
  // UI state
  selectedDataset: 'swat' | 'wadi' | 'indian';
  selectedSensorId: string | null;
  sidebarCollapsed: boolean;
  
  // Replay
  replayIncidentId: string | null;
  replayTimestamp: number | null;
  isReplaying: boolean;
  replaySpeed: number;
}
```

---

## 14. WEBSOCKET CLIENT (`lib/wsClient.ts`)

Single WebSocket connection, persistent across navigation.
Reconnects with exponential backoff (500ms → 30s max).
Dispatches to Zustand store on every message.

Message types from backend:
```typescript
type WsMessage = 
  | { type: 'score_update'; data: ScorePayload }
  | { type: 'alert_start'; data: AlertPayload }
  | { type: 'alert_end'; data: { alert_id: string } }
  | { type: 'sensor_update'; data: SensorSnapshot }
  | { type: 'attribution_update'; data: AttributionPayload }
```

---

## 15. ANIMATIONS CHOREOGRAPHY

### Page Enter Transition (every page)
1. Background fades in (200ms, opacity 0→1)
2. Top nav items stagger in from top (150ms each, 30ms stagger)
3. Grid panels stagger in from bottom (200ms each, 40ms stagger, y: 20→0)
4. Data starts populating after panels settle

### Alert State Transition
When `isAlert` becomes true:
1. Sidebar stage minimap: affected stage pulses red (0ms)
2. Top nav: border-bottom switches to red flash animation (0ms)
3. Alert banner slides down from top (250ms spring)
4. Toast notification appears bottom-right (Sonner)
5. Anomaly timeline chart: threshold line glows brighter (300ms)
6. If on /twin: camera begins smooth pan to alert stage (1000ms lerp)
7. If on /graph: alert propagation animation triggers (staggered, 200ms per edge)

### Score Number Animation
Every incoming score: useSpring lerp from old to new, displayed with 3 decimal places.
On threshold breach: additional scale punch 1.0→1.15→1.0 (100ms).

---

## 16. PERFORMANCE CONSIDERATIONS

- **3D scene**: Target 60fps. Use `instancedMesh` for sensor orbs (single draw call for all 51 sensors)
- **Score chart**: `uPlot` renders via canvas, not SVG — handles 10K+ points smoothly
- **Sensor table**: `@tanstack/react-virtual` — only render visible rows
- **Force graph**: `react-force-graph` with `nodeCanvasObject` (canvas rendering, not DOM nodes)
- **WS throttle**: Backend sends at max 5Hz (200ms intervals). Frontend batches state updates with `startTransition`
- **Code splitting**: Each page lazy-loaded. 3D libs only load on `/twin`

---

## 17. COMPLETE BACKEND API CONTRACT

### WebSocket: `ws://localhost:8000/ws/stream`
Emits every 200ms:
```json
{
  "type": "score_update",
  "timestamp": "2025-01-15T14:23:07.412Z",
  "anomaly_score": 0.412,
  "mahal_score": 0.38,
  "collapse_score": 0.45,
  "is_alert": false,
  "threshold": 0.650,
  "top_sensors": [
    {"sensor_id": "FIT301", "score": 0.847, "stage": 3, "trend": "rising"},
    {"sensor_id": "DPIT301", "score": 0.631, "stage": 3, "trend": "stable"}
  ],
  "sensor_values": {
    "FIT101": {"value": 2.441, "status": "normal"},
    "LIT101": {"value": 749.3, "status": "normal"},
    "FIT301": {"value": 0.0, "status": "alert"}
  }
}
```

### REST Endpoints Summary
```
GET  /api/status/live              → Current system state snapshot
GET  /api/stages/health            → All 6 stages with sensor summaries
GET  /api/sensors/all              → All 51 sensor values + status
GET  /api/sensors/{id}             → Single sensor detail + history
GET  /api/sensors/{id}/history     → ?minutes=N, returns time series
GET  /api/scores/history           → ?minutes=N, returns score time series
GET  /api/xai/attributions         → Current top sensor attributions
GET  /api/xai/heatmap/{incident}   → Grad-CAM heatmap image
GET  /api/graph/topology           → Node + edge definitions (static)
GET  /api/graph/node-states        → Current attribution per sensor
GET  /api/graph/causal-chain       → Computed on-demand during alert
GET  /api/incidents                → List, filterable + paginated
GET  /api/incidents/{id}           → Full detail
GET  /api/incidents/{id}/timeline  → Score/attribution/event time series
GET  /api/incidents/{id}/report    → PDF export
POST /api/incidents/{id}/feedback  → {ground_truth, note}
GET  /api/prediction/horizon       → Time-to-breach forecast
GET  /api/analytics/kpis           → All KPI values
GET  /api/analytics/incidents-over-time → Daily counts
GET  /api/analytics/sensor-heatmap → Matrix for calendar heatmap
GET  /api/calibration/current      → Current threshold settings
POST /api/calibration/preview      → Returns metrics for proposed threshold
POST /api/calibration/apply        → Applies new settings live
POST /api/sandbox/attack           → Inject synthetic attack
GET  /api/sandbox/result/{id}      → Attack detection results
GET  /api/sandbox/leaderboard      → Evasion score rankings
```

---

## 18. 3D ASSET SOURCES

### Free Resources (Get Immediately)
1. **Sketchfab** (sketchfab.com) — search: "industrial pipe", "water pump", "pressure vessel", "industrial tank"
   - Filter: Free + Downloadable + GLTF format
   - Many CC0 licensed industrial assets available

2. **KitBash3D** — "Sci-Fi" or "Industrial" packs (~$40-100, worth it for demo quality)

3. **Poly.pizza** — CC0 low-poly assets, good for stylized look

4. **Quaternius (quaternius.com)** — Free CC0 low-poly industrial assets

5. **NASA 3D Resources** (nasa3d.arc.nasa.gov) — science/engineering models, CC0

6. **Spline (spline.design)** — Design in browser, export as React component or GLTF
   - Fastest way to build custom plant model with good materials

### Recommended Approach
Start with Spline: design each SWaT stage as simple but good-looking 3D composition,
export as `.splinecode` and use `@splinetool/react-spline` to embed.
This gives you designer-quality 3D with zero Three.js modeling effort.

For a code-only approach (no external assets): R3F primitives with good materials and bloom post-processing look stunning. See: drei `<RoundedBox>`, `<Cylinder>`, `<Torus>` for industrial components.

---

## 19. KEYBOARD SHORTCUTS

```
Space           — Play/Pause (on /replay)
L               — Toggle live/historical mode
A               — Jump to active alert
F               — Full screen current panel
1-6             — Focus on Stage 1-6 (on /twin)
R               — Reset camera (on /twin)
G               — Toggle graph edge display
Esc             — Close open drawer/modal
Ctrl+K          — Open command palette (quick navigate)
```

Show keyboard hints as `kbd` elements, bottom-right corner of relevant pages.

---

## 20. RESPONSIVE BREAKPOINTS

Primary target: `1920×1080` or larger (command center context)
Secondary: `1440×900` (laptop presentations)
Minimum: `1280×800` (functional but compressed)

Not mobile-responsive (intentional — industrial operators use large displays).
Use `min-width: 1280px` guard with "Best experienced on desktop" message below.

---

*End of XCDT-ICS UI Design Specification v1.0*
*This document is the complete implementation brief for Claude Code agents.*
*Every component, interaction, color, and backend contract is specified.*
*Begin implementation at the Global Layout Shell and work down.*
