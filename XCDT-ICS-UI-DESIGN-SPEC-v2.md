# XCDT-ICS: Digital Twin Command Center
## Complete UI/UX Design Specification v2 — Enhanced with Creative Agent Directives
### For the SWaT Singapore Secure Water Treatment Plant

---

> ## ⚡ AGENT CREATIVE MANDATE — READ THIS FIRST, EVERY TIME
>
> You are not a code monkey executing instructions. You are a **world-class creative technologist**
> building the most visually stunning industrial intelligence platform ever seen.
>
> **The spec below is a floor, not a ceiling.**
>
> Every section has a `🎨 AGENT:` prompt. These are open invitations to go further. When you
> implement any component, ask yourself:
> - "Does this look like something from 2035?"
> - "Would a NASA engineer or a cybersecurity ops lead feel *respect* looking at this?"
> - "Is there a micro-detail I can add that makes someone lean forward and say 'wait, what is that?'"
>
> **Permission granted to**:
> - Deviate from the layout specs if you discover something more impressive
> - Add unrequested micro-animations, textures, or visual flourishes
> - Research and implement cutting-edge CSS/WebGL techniques not mentioned here
> - Spend 40% of your time on pure visual polish after the logic works
> - Add easter eggs, hidden depth, unexpected moments of delight
>
> **The test**: Record a 30-second screen capture. Does it need zero narration to impress?
> If yes — ship it. If no — keep going.

---

## 0. DESIGN PHILOSOPHY

### Aesthetic Direction: "Tactical Cyber-Physical Intelligence"

Think: the moment a NASA Mission Control operator leans forward at 2am during a critical maneuver.
Think: the bridge of a nuclear submarine. Think: the back-end of a hedge fund's real-time risk system.
Dense, authoritative, alive. Every pixel earns its place.

**This is NOT**: A dark-mode SaaS dashboard with teal buttons.
**This IS**: A living, breathing digital organism monitoring physical reality.

> ### 🎨 AGENT — AESTHETIC DIRECTION PROMPT:
> Before writing a single line of code, spend 10 minutes looking at:
> - `Linear.app` — how they handle density + elegance simultaneously
> - `Basement.studio` — brutal typographic confidence
> - `Resend.com` — minimal but impossibly refined
> - Rauno Figueiredo's portfolio (rauno.me) — micro-interaction mastery
> - IRL: NASA Mission Control photos, CERN control room images, Bloomberg Terminal
>
> Then ask: **how do we get 80% of that "earned complexity" feeling?**
> The answer is usually: scanlines + monospace + purposeful animation + information density.
> Figure out your own answer and encode it into the global styles before anything else.
> Your aesthetic choices here cascade everywhere.

### Design Pillars
- **Density with Clarity** — not cluttered, structured. Every element has exactly one job.
- **Alive** — nothing is static. Data flows, sensors pulse, predictions shimmer.
- **Earned** — complexity that rewards attention. The more you look, the more you see.
- **Spatial Depth** — foreground, midground, background. This screen has z-axis.
- **System Trustworthiness** — animations communicate state, not decoration.

---

## 1. GLOBAL DESIGN TOKENS

> ### 🎨 AGENT — TYPOGRAPHY PROMPT:
> The fonts below are starting points. **Your job**: make the typographic system feel engineered
> and alive simultaneously. Consider:
> - Variable font weights that shift on hover (`font-variation-settings`)
> - Tabular numbers (`font-variant-numeric: tabular-nums`) everywhere data updates
> - A custom `@keyframes` for number transitions — not just a counter, but a scramble effect
>   (cycle through random digits at 30fps before landing on real value — like a departures board)
> - Letter-spacing that's tighter than you think (Orbitron at `letter-spacing: -0.02em` hits different)
> - Consider if there's a better, more unusual font pairing — but it must feel *engineered*, not designed
>
> Look up: "departure board animation CSS", "number scramble effect JavaScript"
> Implement the scramble animation for ALL live-updating numeric values in the app.

### Typography (Base)
```
Display Font: "Orbitron" — headers, metric values, alert callouts
Data Font: "JetBrains Mono" — sensor readings, timestamps, IDs, scores
Body Font: "DM Sans" — UI labels, descriptions, paragraphs
```

> ### 🎨 AGENT — COLOR & ATMOSPHERE PROMPT:
> The palette below is intentional. But **how you apply it** is everything.
> The mistake is using neon colors everywhere. The mastery is using them almost never —
> so when they appear, they *scream*.
>
> Techniques to explore and implement:
> 1. **Noise texture overlay** on all backgrounds (SVG `feTurbulence` filter or PNG grain)
>    — gives depth, feels physical, not digital-flat
> 2. **Mesh gradient background** — CSS `radial-gradient` with multiple stops at different
>    positions, very subtly (2-3% opacity). Creates depth without being garish.
> 3. **Chromatic aberration on alerts** — when `isAlert` is true, CSS filter on the whole
>    layout: `filter: drop-shadow(-1px 0 0 rgba(255,0,0,0.3)) drop-shadow(1px 0 0 rgba(0,240,255,0.3))`
>    — it's subtle but the "screen glitching" effect is visceral and perfect for alerts
> 4. **Scanline overlay** — a CSS repeating-linear-gradient at 2px intervals, opacity 0.03
>    — makes it feel like a real control room monitor, not a website
> 5. **Color temperature shift** — normal state is cool (blue-shifted), alert state subtly
>    warms the ambient (slightly red-shifted overall background). Users feel it before they see it.

### Color System
```css
/* Backgrounds */
--bg-void:       #030508;
--bg-base:       #080C12;
--bg-surface:    #0D1117;
--bg-raised:     #111827;
--bg-glass:      rgba(13, 17, 23, 0.7);

/* Primary Neon: Cyan (use sparingly — maximum 3-4 times per view) */
--cyan-300:  #00F0FF;
--cyan-glow: 0 0 20px rgba(0,240,255,0.5), 0 0 60px rgba(0,240,255,0.15);

/* Alert: Plasma Red */
--red-300:  #FF4444;
--red-glow: 0 0 20px rgba(255,68,68,0.6), 0 0 80px rgba(220,38,38,0.2);

/* XAI: Acid Green */
--green-300: #ADFF2F;

/* Prediction: Violet */
--violet-300: #C4B5FD;

/* Warning: Electric Amber */
--amber-300: #FCD34D;

/* Borders */
--border-dim:  rgba(255,255,255,0.04);
--border-base: rgba(255,255,255,0.08);
--border-cyan: rgba(0,240,255,0.2);
```

> ### 🎨 AGENT — GLASSMORPHISM DEPTH PROMPT:
> Glassmorphism is everywhere now — which means it looks generic if done wrong.
> Do it *right*:
> - Layer at least 3 panel depths: void → base → surface → raised → glass float
> - The glass itself should have a **1px inner highlight** at the top edge
>   (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.08)`) — simulates light hitting glass
> - On panels over the 3D canvas: `backdrop-filter: blur(40px) brightness(0.9) saturate(200%)`
>   — the saturation boost makes the blurred 3D scene behind glow through
> - Panels should feel like they're floating AT a specific z-level, not just layered
> - Consider: a very subtle `box-shadow` pointing DOWN (not a glow), `0 24px 64px rgba(0,0,0,0.8)`
>   — this grounds the floating panel and creates real depth

### Glassmorphism Levels
```css
.glass-base     { backdrop-filter: blur(20px) saturate(180%); }
.glass-elevated { backdrop-filter: blur(40px) brightness(0.9) saturate(200%); }
.glass-hero     { backdrop-filter: blur(60px) brightness(0.85) saturate(250%); }
/* alert state: add red tint */
.glass-alert    { backdrop-filter: blur(40px) brightness(0.9) saturate(200%) hue-rotate(-10deg); }
```

### Motion Philosophy

> ### 🎨 AGENT — ANIMATION MANDATE:
> Animation is the most important visual differentiator. Rules:
>
> 1. **Spring everywhere, ease-out never** (unless explicit exception)
>    — spring feels physically real, ease-out feels like a website
> 2. **Stagger everything** — panels entering together looks like Squarespace
>    Panels entering 40ms apart look like a NASA system booting up
> 3. **The "alive" baseline**: even in a completely static state with no data,
>    the app should feel alive. Find micro-animations for idle state:
>    - Subtle CSS `@keyframes` shimmer on panel borders
>    - The score gauge ring should barely, barely breathe (scale 1.0→1.002, 4s loop)
>    - The background mesh gradient shifts very slowly (0.5° rotation over 20s)
> 4. **Performance first** — `will-change: transform` on animated elements,
>    `transform: translateZ(0)` to force GPU layer, never animate `width/height` (use `transform: scaleX`)
> 5. **Alert choreography** is your crown jewel — design it last, spend the most time on it.
>    It should feel like a film cut, not a toast notification.
>
> Implement a global `usePrefersReducedMotion` hook and wrap ALL animations —
> respect accessibility without question.

```
Micro:    120ms  spring(stiffness:500, damping:35)
Standard: 220ms  spring(stiffness:400, damping:30)
Layout:   350ms  spring(stiffness:300, damping:28)
Alert:    600ms  spring(stiffness:200, damping:20)
3D cam:   Lerp 0.04/frame
Number scramble: 400ms total, 30fps random cycling
```

---

## 2. ROUTE STRUCTURE

```
/                  → Command Center (mission control)
/twin              → Digital Twin 3D (full immersive)
/graph             → Causal Sensor Network
/replay            → Time-Travel Forensics
/sandbox           → Attack Simulation (Red Team Mode)
/incidents         → Incident Intelligence Hub
/incidents/[id]    → Incident Deep Dive
/analytics         → Executive Analytics
/calibration       → Operator Threshold Lab
/settings          → System Configuration
```

> ### 🎨 AGENT — PAGE TRANSITIONS PROMPT:
> Next.js App Router doesn't have built-in page transitions. Implement them.
> Research: "Framer Motion Next.js App Router page transitions" — use `AnimatePresence`
> with `layout` on a shared wrapper.
>
> The transition style: **not a fade** (too gentle), **not a slide** (too mobile-app).
> Think: a very fast (150ms) vertical compression + instant swap + expand.
> Or: a horizontal scan line that wipes across the content area.
> Or: the old content scales down to 0.97 and fades out (80ms) while new content
> scales up from 1.02 and fades in (200ms) — like a camera refocusing.
>
> Pick one, implement it globally in `app/layout.tsx`. Make it feel like
> the system is switching modes, not loading a page.

---

## 3. GLOBAL LAYOUT SHELL

> ### 🎨 AGENT — LAYOUT ARCHITECTURE PROMPT:
> The layout spec below is structural. Your challenge on top of it:
>
> 1. **Background atmosphere**: the `--bg-void` background should not be flat black.
>    Implement a subtle, very slow-moving mesh gradient using multiple radial gradients.
>    Think: a deep blue-black void with barely perceptible teal and purple concentration
>    points that drift at 1px per 2 seconds. Almost invisible but felt.
>    CSS approach: multiple `radial-gradient` layers in `background`, animated with `@keyframes`
>    shifting `background-position`. Keep total opacity of color influence to <5%.
>
> 2. **Scanline texture**: a fixed, non-scrolling CSS pseudo-element on `body::after`
>    with `repeating-linear-gradient(transparent 0px, transparent 1px, rgba(0,0,0,0.08) 1px, rgba(0,0,0,0.08) 2px)`
>    This makes the entire app feel like it's rendered on a real CRT/control-room monitor.
>
> 3. **The sidebar deserves its own ambient character**: consider a very faint vertical
>    pulse that travels from top to bottom of the sidebar every 3 seconds — like a scan
>    passing over all the nav items. Just a 1px highlight sweeping down.
>
> 4. **Consider if the sidebar should even be a sidebar** — or if a horizontal command bar
>    at the top + a vertical icon rail works better at 1920px. Don't feel locked in.
>    Make the decision that looks better on a 27" monitor.

### Top Navigation

```
[⬡ XCDT-ICS  /  SWaT Plant]    [Center: route tabs with sliding indicator]    [12ms ● LIVE  SWaT▾  🔔  ⚙]
```

Height: 56px, fixed, `z-index: 100`

> ### 🎨 AGENT — TOP NAV PROMPT:
> The nav is the frame through which everything is seen. Make it exceptional.
>
> - The route tabs in center: the active tab indicator shouldn't just be a sliding pill.
>   It should have a **glow trail** — a `box-shadow` that lingers and fades as it moves.
>   Implement with Framer Motion `layoutId` + a separate animated glow layer.
> - The `[● LIVE]` indicator: when connection is active, the dot should pulse with a
>   radially expanding ring (like a radar ping, CSS `@keyframes` scale + opacity out).
>   Not just opacity blink — a real expanding ring animation.
> - The latency chip `[12ms]`: color-code it and add a tiny sparkline of last 30 latency
>   values (2px line, 40px wide). This tells operators the system health at a glance.
> - On alert: the entire nav bottom-border should do a `box-shadow` sweep —
>   a red glow that pulses from left to right along the border, not just blinks.
>   CSS animation with `background-position` on a gradient, or JS canvas overlay.
> - The logo mark `⬡` (hexagon): animate it. On system boot, it should draw itself
>   (SVG `stroke-dasharray` animation). When alert fires, it briefly glitches
>   (CSS `clip-path` or `skew` tremor, 150ms).

### Sidebar

Width: 280px expanded / 64px collapsed

> ### 🎨 AGENT — SIDEBAR PROMPT:
> The sidebar is the "brain stem" of the UI — always visible, always informative.
>
> - **Plant heartbeat line**: implement as a real SVG ECG-style animation.
>   A path that draws forward in realtime with `stroke-dashoffset` animation.
>   Actually wire it to the anomaly score — when score rises, the ECG amplitude rises.
>   This is a 60px wide × 24px tall SVG at the top of the sidebar that IS the system health.
> - **Stage health minimap**: don't use rectangles. Use the actual SWaT pipeline topology —
>   a small SVG diagram of 6 boxes connected by lines showing flow direction.
>   Each box fills with color. Flow line between boxes animates particles.
>   At 64px collapsed sidebar: this diagram compresses but stays readable.
> - **Navigation items**: the icon for each route should be a custom SVG, not unicode.
>   Design icons that feel industrial: ◈ for graph (like a sensor node),
>   ⏮ for replay, ⚔ for sandbox. Or use Lucide icons but customize their stroke.
> - **The active item glow**: don't just change background. Add a left-side indicator
>   that has a `box-shadow` bloom: `box-shadow: -4px 0 16px rgba(0,240,255,0.4)` on
>   the left border. Makes the active item literally emit light.
> - **Bottom metrics**: these should update with the scramble animation.
>   The fused score ticking up/down in real time through a number scramble effect
>   in the sidebar is one of those "wait is that live??" moments. Make it happen.

Navigation items:
```
⊞  Command Center    /
⬡  Digital Twin      /twin
◈  Sensor Graph      /graph       [51 nodes]
⏮  Time Replay       /replay
⚔  Attack Sandbox    /sandbox     [BETA]
⚑  Incidents         /incidents   [3 new]
∿  Analytics         /analytics
⊙  Calibration       /calibration
```

---

## 4. PAGE: COMMAND CENTER (`/`)

> ### 🎨 AGENT — COMMAND CENTER PHILOSOPHY PROMPT:
> This page is seen every day by operators. It must be instantly readable AND endlessly rich.
> The trap: making it look like a dashboard. The goal: making it feel like a cockpit.
>
> **Challenge yourself**: look at the layout grid below and ask — is this the most
> impressive arrangement possible? The grid is a suggestion. Bento-box layouts
> (popularized by Apple, refined by Linear) allow organic sizing where hero items
> are larger, supporting items smaller, and the whole thing feels curated rather than gridded.
>
> Consider: could the Fused Score hero card be truly LARGE — almost half the left column?
> Could the chart span dramatically wide? Does the layout breathe in the right places?
>
> Also: **the page should react visually to system state** as a whole.
> - NORMAL state: cool, calm blues, everything crisp
> - ELEVATED state: subtle amber warming, particles move slightly faster
> - ALERT state: the entire layout shifts — panels pulse borders, background warms,
>   a subtle vignette darkens corners directing focus to the alert panel
> Implement a global `data-system-state="normal|elevated|alert"` on `<body>`
> and use CSS attribute selectors to cascade the state change.

### Layout Grid (12 columns, suggestion — agent may improve)
```
┌──────────────────────────────────────────────────────────────────────┐
│  SYSTEM STATUS BAR (full width, 36px)                                │
├─────────────────┬─────────────────┬──────────────────────────────────┤
│  FUSED SCORE    │  STAGE HEALTH   │  SYSTEM TELEMETRY MARQUEE       │
│  HERO METRIC    │  HEXAGONAL MAP  │                                  │
│  (col 1-4)      │  (col 5-8)      │  (col 9-12)                     │
├─────────────────┴─────────────────┴──────────────────────────────────┤
│  LIVE ANOMALY TIMELINE CHART (full width, 220px)                     │
├──────────────────────────────────┬───────────────────────────────────┤
│  TOP CONTRIBUTING SENSORS (XAI)  │  INCIDENT FEED                   │
├──────────────────────────────────┼───────────────────────────────────┤
│  SENSOR READINGS TABLE           │  PREDICTION HORIZON              │
└──────────────────────────────────┴───────────────────────────────────┘
```

### Component A: System Status Bar

> ### 🎨 AGENT — STATUS BAR PROMPT:
> A scrolling ticker is a good start. Here's how to make it extraordinary:
>
> - Instead of plain text, each sensor entry should be a small "chip" —
>   a pill with a colored dot + sensor ID + value + status.
>   The chips themselves scroll smoothly (CSS `animation: marquee linear infinite`)
> - The bar's background should have a very subtle horizontal scan animation —
>   a faint bright line that travels left-to-right every 4 seconds (like a radar sweep)
> - On anomalous sensor: that chip should visually "jump" in size briefly,
>   its background flashes, and it appears at the FRONT of the ticker (reorder logic)
> - Consider: is a marquee the right pattern at all? Could this be a fixed-width
>   grid of status chips that animates-in the changed one? Your call.

### Component B: Fused Score Hero

> ### 🎨 AGENT — HERO METRIC PROMPT:
> This is THE number. The most important thing on the page. It should feel significant.
>
> Push beyond a circle gauge:
> 1. **The outer ring**: an SVG arc that fills clockwise 0→1, with a gradient
>    (from cyan at 0 to red at 1). The filled portion should have a glowing "head"
>    — a bright point at the current position with a `drop-shadow` bloom.
> 2. **Behind the number**: consider a very faint radial pulse — concentric rings
>    that expand outward from the number's center and fade. Like a sonar ping,
>    every 2 seconds. Just barely visible. Absolutely mesmerizing.
> 3. **The number itself**: implement the "scramble then land" animation.
>    When a new score comes in, the number rapidly cycles through random values
>    for 200ms before snapping to the real one. Like a departures board.
>    On alert crossing: the number should shake (translate tremor) AND color-shift.
> 4. **Sub-scores layout**: don't just put Mahalanobis and Collapse as text.
>    Two small horizontal gauges below the main number. Thin bars, 4px height.
>    They tell the informed user WHICH component is driving the alert.
> 5. **The status text "NORMAL/ALERT"**: when it says ALERT, don't just color it red.
>    Make it flash with a CSS animation that cycles between visible and invisible
>    (not opacity — use `visibility` or `color` + `background-color` swap for more drama).
>    And add a monospace "▮▮▮ ALERT ▮▮▮" style with flashing block cursors around it.

Layout:
```
                FUSED ANOMALY SCORE
                      0.412
         [Arc gauge ring, gradient cyan→red]
               THRESHOLD: 0.650
               STATUS: NORMAL
               Δ +0.003 / 60s
    [Mahal bar]───────●────  0.38
    [Collapse bar]──────●──  0.45
```

Backend: `WebSocket stream → {anomaly_score, threshold, is_alert, mahal_score, collapse_score, delta_60s}`

### Component C: Stage Health Map

> ### 🎨 AGENT — STAGE MAP PROMPT:
> Six stages of the SWaT plant, connected in series. The water flows through them.
> This map should communicate the FLOW, not just the status.
>
> Design options to consider (pick whichever looks best, don't feel bound):
>
> **Option A — SVG Pipeline**: actual pipeline diagram, not hexagons. Pipes connecting
> tanks. Miniature sensor orbs at each stage. Water flow particles animated along the pipe.
> This is more work but also 10× more impressive because it SHOWS the physical system.
>
> **Option B — Hexagon grid**: the hex grid with connecting arrows.
> But: the connecting arrows should be animated SVG paths with particles flowing through them.
> And: alert propagation should visually show as the "infection" moving stage→stage.
>
> **Option C — Vertical stack with horizontal flow**: stages arranged vertically,
> flow going right between them as a river. Each stage a glass card.
>
> Pick the option that looks most impressive. Then add:
> - Each stage: click triggers camera fly-to in `/twin`
> - On alert: the affected stage has a pulsing red border AND all connecting pipes
>   to/from it change to red particles
> - Add the stage names from actual SWaT: "Raw Feed", "Chemical Dosing",
>   "Ultrafiltration", "Dechlorination", "Reverse Osmosis", "Permeate Collection"

Backend: `GET /api/stages/health → [{stage_id, name, max_score, sensor_count, sensor_states}]`

### Component D: Telemetry Marquee

> ### 🎨 AGENT — TELEMETRY STRIP PROMPT:
> A scrolling strip of all sensor readings. Here's what makes it sing:
>
> - Each sensor value in JetBrains Mono with a tiny color-dot prefix
> - Values UPDATE IN PLACE as they scroll by — if a value changes while its chip
>   is visible, it should flash white briefly before updating (no scroll position change)
> - Separate the 51 sensors into groups by type: FLOW → LEVEL → PRESSURE → ACTUATORS
>   with a small divider label between groups
> - Speed of scroll: proportional to system alertness.
>   Normal: slow (60s to complete one cycle). Alert: 2× faster.
>   This is a subtle cue that something changed.

### Component E: Live Anomaly Timeline

> ### 🎨 AGENT — CHART MASTERCLASS PROMPT:
> This chart is visible 100% of the time. It earns its real estate through excellence.
>
> Technical implementation: **uPlot** (not Recharts). uPlot renders to canvas at 60fps
> and can handle 50K data points without breaking a sweat. Install it.
>
> Visual design pushes:
> 1. **The threshold line**: don't use a dashed line.
>    Use a gradient band — a thin filled region between threshold and threshold+0.02,
>    with a subtle red glow. The "danger zone" is above this band, subtly shaded.
> 2. **Alert regions**: when `is_alert=true` for a time range, fill that region with
>    a gradient: `rgba(255,68,68,0.03)` fading to transparent. Very subtle — just enough
>    to distinguish. The leftmost edge of the alert region gets a 1px red vertical rule
>    with a small label "▼ ALERT" that appears on hover.
> 3. **The score line**: don't just draw it — give it a glow.
>    Draw the line twice: once at 3px opacity 0.3 (the glow), once at 1.5px opacity 1.0.
>    The glow effect makes it feel like an oscilloscope trace.
> 4. **Hover crosshair**: when mouse is over chart, show a vertical hairline in cyan
>    and a horizontal hairline at the y-value. The intersection point: a glowing dot.
>    Tooltip: glass panel with all 3 score values + timestamp, positioned to never clip edge.
> 5. **Click-drag selection**: draw a selection box, on release show a popup:
>    "Open this period in Replay" + time range. One click to forensic mode.
> 6. **The gradient fill**: under the score line, fill with a vertical gradient from
>    `rgba(0,240,255,0.15)` at the line to transparent at y=0.
>    This grounds the line and adds depth.

Backend: `WebSocket stream → {timestamp, fused_score, mahal_score, collapse_score, is_alert}`
         `GET /api/scores/history?minutes=60` for historical data on time range switch

### Component F: Top Contributing Sensors (XAI Panel)

> ### 🎨 AGENT — XAI PANEL PROMPT:
> This panel explains WHY the model is alerting. It must feel intelligent, not just a list.
>
> Visual ideas to push:
> 1. **The bar chart**: each bar should fill with a gradient — the most-attributed sensor's bar
>    goes from acid green `#ADFF2F` to transparent. Lower ranked bars: cyan to transparent.
>    The FILL ITSELF should animate — when a new ranking comes in, bars cross-fade smoothly.
>    Not just width change — color changes too if rank changes.
> 2. **Rank change indicator**: if FIT301 was #2 and is now #1, show a brief "↑ 1" in green
>    that floats up and fades (Framer Motion `y: 0→-20`, opacity: 1→0, 600ms).
>    If it dropped: red "↓ 1" floating down. Like a stock ticker rank change.
> 3. **The sensor row**: beyond just the bar, each row should have a mini sparkline
>    (8 latest attribution scores for that sensor, 60px × 16px, SVG). This shows if
>    the score is rising (scary) or declining (reassuring).
> 4. **Connection to graph**: each sensor row, on hover, should briefly highlight that
>    sensor's node in the Sensor Graph if the Graph is visible in the same view.
>    This cross-panel linking is a very advanced UI pattern — implement it via Zustand
>    `hoveredSensorId` state.
> 5. **The header**: add a small "updated Xms ago" timestamp that ticks up in real time.
>    When it shows ">500ms" without update: amber color. ">2s": red. Shows data freshness.

Backend: `WebSocket stream → [{sensor_id, attribution_score, rank, stage, trend, sparkline_data}]`

### Component G: Incident Feed

> ### 🎨 AGENT — INCIDENT FEED PROMPT:
> Each incident in this list is a "story" — a moment when the system detected something.
> Make each entry feel significant, not like a log entry.
>
> - **Row design**: each incident is a card (not just a row), 80px tall.
>   Left accent: 4px colored border (red=active, green=TP resolved, amber=FP, gray=unknown).
>   Inside: two-line layout. Line 1: ID + severity badge + status. Line 2: time + stage + peak score.
>   Right: action buttons `[▶]` `[📋]` appear on hover (slide in from right, Framer Motion x spring).
> - **Active incident**: don't just color it. The active incident card should have
>   a subtle animated background — a slow `@keyframes` gradient sweep left-to-right,
>   like a radar scan over the card. `rgba(255,0,0,0.03)` → `rgba(255,0,0,0.08)` → transparent.
> - **New incident entering**: use `AnimatePresence`. New entries slide in from top,
>   pushing existing ones down. Not from bottom (that would shift context).
> - **The "ACTIVE" badge**: don't blink text. Use the CSS radar-ping animation —
>   a small circle that expands and fades outward from a center point. Like a heartbeat monitor.

Backend: `GET /api/incidents?limit=10` + WebSocket push on new incident creation

### Component H: Prediction Horizon

> ### 🎨 AGENT — PREDICTION PROMPT:
> "Time to threshold breach" is the most forward-looking, impressive feature on this page.
> Make it feel like the system is thinking ahead.
>
> - **The countdown**: "14m 32s" in Orbitron 48px. But as time decreases, the number
>   gets LARGER (responsive font size). At <2min: it fills more of the panel.
>   At <30sec: it's giant, red, and shaking with a CSS tremor animation.
> - **Confidence visualization**: not a bar. A small mini-chart: the predicted score
>   trajectory as a dashed line extending into the "future" (past the current time),
>   with a shaded confidence cone (`rgba(139,92,246,0.1)`). The threshold shown as red dashed line.
>   The moment the prediction cone intersects the threshold: a vertical red marker.
>   The TIME of that intersection is the countdown.
> - **Safety status segmented indicator**: not text labels. A horizontal bar divided into
>   color zones (green → amber → orange → red). A pointer on the bar shows current safety level.
>   The pointer moves smoothly (spring animation) as the prediction updates.
> - **When prediction is "SAFE > 30min"**: the panel should visually relax —
>   cooler colors, slower animations. When "CRITICAL < 2min": everything intensifies.
>   This emotional UI response to data state is the hallmark of great ops software.

Backend: `GET /api/prediction/horizon → {time_to_breach_s, confidence, trajectory: [{t, low, mid, high}]}`

### Component I: Sensor Readings Table

> ### 🎨 AGENT — DATA TABLE PROMPT:
> 51 rows of live sensor data. Every millisecond something changes.
> This table is the "ground truth" of the system. Make it feel like a real instrument.
>
> Library: `@tanstack/react-table` + `@tanstack/react-virtual` for virtualization
>
> Visual differentiation from a generic table:
> 1. **Value cells**: numbers in JetBrains Mono, right-aligned (tabular nums).
>    On change: flash white background (30ms) then fade back to transparent.
>    This "value flash" is the single most effective visual cue for live data.
> 2. **Delta column**: positive deviations red, negative green. Include a mini directional
>    arrow that appears only when delta > 1σ. Arrows animate in (scale 0→1, 200ms).
> 3. **Row status**: the entire row background shifts subtly based on status.
>    Normal: transparent. Warning: `rgba(245,158,11,0.06)`. Alert: `rgba(255,68,68,0.1)`.
>    On alert → normal transition: brief green flash (the "all clear" signal).
> 4. **Sparkline column**: the rightmost column is a 72px × 20px sparkline for each sensor.
>    SVG path, no axes. The shape ALONE tells the story.
> 5. **Row hover**: the hovered row gets a subtle left-shift of all content (2px translateX)
>    + a left accent line slides in. Feels like selection, not just highlight.
> 6. **The header**: sticky. On scroll, gets a more opaque background (transition from
>    transparent to `rgba(8,12,18,0.95)`). Classic elevated-on-scroll pattern.

Backend: `WebSocket stream → full sensor snapshot every 500ms`

---

## 5. PAGE: DIGITAL TWIN 3D (`/twin`)

> ### 🎨 AGENT — 3D TWIN PHILOSOPHY PROMPT:
> This page is your "wow moment". The one people screenshot and share.
> The ambition: when someone opens this page, their first reaction is "what IS this."
>
> **The 3D scene needs to feel physically present**. Not like a rendered model.
> Like you're WATCHING the actual plant through a camera.
>
> Key decisions to make before starting the 3D scene:
>
> 1. **Asset strategy**: Go to Spline (spline.design) first.
>    Build the SWaT plant there — even simple shapes with Spline's material system
>    look dramatically better than raw Three.js primitives. Export as React component.
>    If Spline isn't suitable for real-time color changes, fall back to R3F primitives
>    but use physically-based materials (PBR) with metalness/roughness maps.
>
> 2. **Perspective choice**: isometric feels like a game HUD. First-person feels cinematic.
>    **Recommended**: a 3/4 top-down perspective with OrbitControls capped at certain angles.
>    Not full isometric, not full 3D — something between. Find the angle that shows all 6 stages
>    simultaneously while still feeling dimensional.
>
> 3. **The atmosphere**: the 3D scene should feel like it's IN a space. Add:
>    - A faint fog (`<fog>` in R3F) that makes distant objects slightly haze
>    - A very dim, large plane below the plant geometry acting as a "floor" with
>      very faint grid lines (like a hologram projection surface)
>    - Ambient particles (dust motes or data particles floating gently, unrelated to pipe flow)
>    - A distant "starfield" or very subtle environment map for reflections on metal surfaces
>
> 4. **Post-processing must-haves** (`@react-three/postprocessing`):
>    - `Bloom`: makes emissive elements glow. ESSENTIAL. threshold 0.8, strength 1.2
>    - `ChromaticAberration`: offset [0.0005, 0.0002]. Film quality.
>    - `Vignette`: darkens corners. Focuses attention on center.
>    - `Noise`: grain 0.025. Adds physical texture.
>    - On alert: add `GlitchEffect` briefly (50ms) as the alert fires. One single glitch.
>
> 5. **Sensor orbs are the stars of the scene**: every sensor a glowing sphere.
>    Normal: `emissiveIntensity: 0.2`, barely noticeable.
>    Warning: `emissiveIntensity: 0.8`, obvious amber glow.
>    Alert: `emissiveIntensity: 3.0` + `PointLight` added dynamically. Lights up surroundings.
>    The difference between 0.2 and 3.0 emissiveIntensity is DRAMATIC with Bloom enabled.
>    This is your key visual signal system.

### SWaT Plant Scene Layout
```
Stage 1: Raw Water Feed — Left zone
  Sensor orbs: FIT101, LIT101, P101, P102, MV101-104, DPIT101

Stage 2: Chemical Dosing — Center-left
  Sensor orbs: FIT201, LIT201, P201, P202, MV201-204, DPIT201

Stage 3: Ultrafiltration — Center (most important stage visually)
  Sensor orbs: FIT301, LIT301, DPIT301, P301, P302, MV301-304, AIT301-303
  [Membrane housing: large horizontal cylinder, dominant visual element]

Stage 4: Dechlorination — Center-right
  Sensor orbs: FIT401, LIT401, P401, P402, UV401, AIT401-402, MV401-404

Stage 5: Reverse Osmosis — Right
  Sensor orbs: FIT501, LIT501, P501, P502, DPIT501-502, AIT501-504, MV501-504

Stage 6: Permeate/Collection — Far right
  Sensor orbs: FIT601-603, LIT601
```

> ### 🎨 AGENT — 3D SENSOR ORB SYSTEM PROMPT:
> 51 sensor orbs are the heartbeat of the twin. Make them extraordinary.
>
> - Use `instancedMesh` for performance (single draw call for all 51).
>   Each instance gets its own color + emissiveIntensity updated per frame.
> - The orb size: not uniform. Sensors of higher attribution rank → larger.
>   `useFrame` lerps orb scale toward target scale each frame.
> - On hover: the hovered orb ejects a drei `<Html>` label above it.
>   The label should have a subtle "beam" connecting it to the orb (SVG line, animated).
>   Label content: sensor ID, type, current value, attribution rank.
> - On click: the selected orb pulses once (scale 1.0→1.5→1.0, 400ms spring)
>   AND a ring of particles emits from it (Three.js particle burst, 20 particles,
>   physics: radial velocity, fade out over 800ms).
> - **Pipe flow system**: for each connected sensor pair, create a TubeGeometry
>   along a path between them. Move Points geometry along the tube each frame.
>   Normal flow: 200 particles/pipe, cyan color, steady pace.
>   Backflow/anomaly: particles slow, some reverse direction. Visually striking.

> ### 🎨 AGENT — 3D CAMERA SYSTEM PROMPT:
> Camera work is what separates a 3D scene from a 3D experience.
>
> - **Idle behavior**: after 20s of no interaction, begin a VERY slow orbit (0.001 rad/s)
>   with gradual up/down oscillation. Makes the scene feel continuously observed.
>   Stop immediately on any user interaction.
> - **Alert auto-focus**: when an alert fires, don't just jump to the stage.
>   Animate: slow deceleration of current orbit → smooth fly-to over 2s using lerp
>   → settle with a slight overshoot (springs naturally, no manual bounce needed).
>   The "camera rushing to the incident" has enormous dramatic power.
> - **Stage focus buttons**: each triggers `useSpring` on camera position + target.
>   Add a brief `ChromaticAberration` intensity spike during the camera transition —
>   like a lens breathing while refocusing.
> - **Debug: show camera position in a tiny HUD corner** — `[x: 24.3, y: 18.1, z: 31.2]`
>   This looks extremely technical and impressive in demos.

> ### 🎨 AGENT — 3D OVERLAY UI PROMPT:
> The floating UI over the 3D scene needs special care.
> Too much UI: hides the twin. Too little: not useful.
>
> - **Stage labels** (drei `<Html>`): floating above each stage in 3D space.
>   These should billboard (always face camera). Content: stage name + max score + status.
>   A chevron line connects label to the stage geometry (drei `<Line>`).
>   On camera zoom into a stage: other stage labels fade out (distance-based opacity).
> - **Floating control bar** (bottom-left, over canvas): glass pill, very slim.
>   Transparent until hovered, then glass-elevated. Minimizes its intrusion on the 3D.
> - **The side panel** (slides in from right): it should be OVER the canvas, not beside it.
>   The canvas dims (`opacity: 0.7` on the r3f canvas div) when side panel is open —
>   directing focus to the panel. Framer Motion transition.

Backend:
```
GET /api/twin/scene-data → sensor positions (x,y,z), current values, states for ALL 51
WebSocket → live sensor state updates per inference cycle
GET /api/sensors/{id}/details → full sensor profile
GET /api/sensors/{id}/history?minutes=5 → sparkline data
```

---

## 6. PAGE: CAUSAL SENSOR GRAPH (`/graph`)

> ### 🎨 AGENT — GRAPH PHILOSOPHY PROMPT:
> The graph is where the system's "intelligence" becomes visible.
> It shows not just WHAT is happening, but how sensors are connected and how
> an attack propagates through the system's nervous system.
>
> Library: `react-force-graph` — use the ForceGraph2D with `nodeCanvasObject`
> for full custom rendering. This is crucial: default node rendering looks generic.
> With `nodeCanvasObject` you can draw anything for each node.
>
> **The visual challenge**: 51 nodes + ~100+ edges without looking like a hairball.
> Solutions:
> - Cluster by stage (use charge group forces to keep stage nodes together)
> - Stage clusters get semi-transparent convex hull backgrounds (d3-polygon hull)
>   drawn behind the nodes — each stage cluster has its own very faint background zone
>   with the stage name as a watermark label
> - Edge opacity proportional to correlation weight (weak correlations: nearly invisible)
> - Only show edges above a correlation threshold (0.5 default), user can adjust

> ### 🎨 AGENT — NODE DESIGN PROMPT:
> With `nodeCanvasObject`, you have a canvas 2D context for each node. Use it.
>
> Each node should be a multi-ring structure:
> 1. Outer ring (thin, 1px): attribution score level indicator. More filled = higher attribution.
>    This is a progress-ring, drawn with `arc()` on canvas.
> 2. Middle fill: solid circle, colored by status (normal/warning/alert).
> 3. Inner ring: just a 1px bright circle for visual definition.
> 4. Glow: draw a `radialGradient` behind the node that extends 3× node radius.
>    On alert: the glow radius is 5× and bright red.
> 5. Sensor ID label: below node, JetBrains Mono, 9px, centered.
>    Color: white on alert, dimmed gray on normal (noise reduction).
>
> Hover state: draw a dashed outer ring that rotates (animate by rotating canvas transform per frame).
> Selected state: draw a bright solid outer ring + show label fully.

> ### 🎨 AGENT — EDGE ANIMATION PROMPT:
> Edges are where the network comes alive.
>
> - Implement custom edge rendering with `linkCanvasObject`.
>   Don't use the default straight lines.
> - **Normal edges**: draw as very thin lines (0.5px), color based on correlation strength.
>   Add animated particles flowing along each edge (compute particle positions per frame
>   using the link's source/target coordinates + a parameterized t value that increments).
>   Particle size: 1.5px dot. Speed: proportional to |correlation|.
> - **Attack propagation**: when alert fires, the "infection" particle set is different.
>   Red particles, larger (3px), faster, AND the edge itself briefly widens to 2px
>   with a red color for the duration of propagation.
> - **Correlation direction**: edges for sensors in the same stage flow one direction.
>   Edges between stages: always flow downstream (Stage1 → Stage2 → ...).
>   This directionality makes the system topology instantly readable.

> ### 🎨 AGENT — CAUSAL CHAIN PANEL PROMPT:
> The right panel showing "root cause → propagation path" needs to feel like
> automated intelligence, not just a formatted list.
>
> - Animate the causal chain appearance: nodes and arrows appear sequentially,
>   each with a 200ms delay after the previous. Like the system is "tracing" the path.
> - The propagation path: visualize as a vertical connected list of nodes with
>   animated connection lines drawing between them (SVG `stroke-dashoffset` animation).
>   Each connection labeled with correlation strength and estimated lag time.
> - "Counterfactual" button: clicking "Isolate FIT301" should:
>   1. In the graph: grey out FIT301 and all its outgoing edges
>   2. Show a "shadow" prediction: "If FIT301 isolated, score would be 0.31"
>   This is a very sophisticated feature — implement it as a simple graph traversal
>   that recalculates the total attribution score without the isolated node.

Backend:
```
GET /api/graph/topology → {nodes: [{id, stage, type}], edges: [{source, target, weight, type}]}
WebSocket → node state updates (attribution_score, is_alert per node)
GET /api/graph/causal-chain → {root_cause, propagation_path, recommendation}
```

---

## 7. PAGE: TIME-TRAVEL REPLAY (`/replay`)

> ### 🎨 AGENT — REPLAY PHILOSOPHY PROMPT:
> This page is forensic investigation meets cinema. An operator watching an incident
> replay should feel like they're watching a documentary of what happened.
>
> The interaction model: video player. But for industrial sensor data.
> The visual model: professional video editing software (DaVinci Resolve, Premiere)
> — but dark, industrial, not colorful.
>
> **The central challenge**: dragging the playhead should update EVERY panel simultaneously
> with ZERO lag. This means the data must be pre-loaded and accessed synchronously.
> Architecture: fetch the full incident timeline JSON on page load, store in memory.
> Playhead position → index into the pre-fetched array → no network round-trips during scrub.
> The smoothness of scrubbing is the whole feature.

> ### 🎨 AGENT — MULTI-TRACK TIMELINE PROMPT:
> This is the most complex UI component in the entire application.
> Implement it with a custom `<canvas>` element (not SVG for performance).
>
> Tracks from top to bottom:
> - Track 1 (40px): Fused score area chart — cyan gradient
> - Track 2 (24px): Top sensor 1 attribution — acid green
> - Track 3 (24px): Top sensor 2 attribution — violet
> - Track 4 (24px): Top sensor 3 attribution — amber
> - Track 5 (20px): System events — lollipop marks on a baseline
> - Playhead: vertical cyan line, draggable, with a handle at top
> - Alert regions: semi-transparent red fills spanning all tracks simultaneously
>
> All tracks share the same X-axis (time). Draw them stacked, share the canvas.
>
> On playhead drag:
> - The entire canvas re-renders at ~60fps (via `requestAnimationFrame`)
> - Below-canvas panels update via Zustand (`setReplayTimestamp(t)`)
> - The sensor table, XAI bars, and mini-graph below are all controlled by this timestamp
>
> Visual details:
> - The playhead handle: a small inverted triangle (▼) at the top of the timeline, cyan.
>   On drag: slightly larger, bright white. Cursor changes to `ew-resize`.
> - Keyframe diamonds: render as actual SVG diamonds at key moments.
>   On hover: they expand slightly + show a tooltip with the event description.
> - The time ruler above the tracks: tick marks every 10s with labels. Bold ticks at minute marks.

> ### 🎨 AGENT — PLAYER CONTROLS PROMPT:
> The player controls should feel like a professional media player, not a website button row.
>
> - Speed selector: don't use a dropdown. Use a segmented control with 7 options.
>   The active speed "glows" with a neon border. When speed > 1x, the text becomes amber.
>   When speed > 4x, it becomes red (implying you're watching very fast).
> - Play/pause button: the main action. Large (48px × 48px). The icon should animate —
>   on pause-to-play: the bars transform into a triangle (SVG path animation).
>   On play-to-pause: triangle splits into bars. Framer Motion or CSS SVG transition.
> - Jump buttons (alert start/peak/end): clicking these should smoothly scrub the playhead
>   to the target time (not teleport — visually sweep across the timeline).
> - Keyboard shortcuts displayed as `kbd` tags below controls. Press Space, it works.
>
> The entire controls row should slide up from below the fold slightly when the timeline
> is visible — adds depth to the layout.

Backend:
```
GET /api/incidents/{id}/timeline → full pre-fetchable dataset for scrubbing
GET /api/incidents → list for selector
GET /api/incidents/{id} → metadata
```

---

## 8. PAGE: ATTACK SANDBOX (`/sandbox`)

> ### 🎨 AGENT — SANDBOX PHILOSOPHY PROMPT:
> This is "Red Team Mode" — the most dramatic, gamified page in the app.
> The moment you enter this page, the visual language should shift:
>
> - Add a subtle "SIMULATION MODE" watermark/banner across the top in amber
>   (text at opacity 0.15 behind the content, or a visible banner).
>   This prevents operators from confusing simulation with real data.
> - The color accent shifts: in this page, amber/orange replaces cyan as the
>   primary accent color. This page is "warm" where the rest is "cool".
>   Implement via CSS variable override in the sandbox layout.
> - Attack injection should feel like LAUNCHING something — not clicking a button.
>   Consider: a "hold to arm" button for the inject — you hold it for 1.5s (a circular
>   progress fills) and then it fires. This prevents accidental injection AND it's dramatic.

> ### 🎨 AGENT — ATTACK CARDS PROMPT:
> Each attack type as a selectable card. Make them feel like weapon loadout cards.
>
> Each card (ideally 160px × 120px):
> - Background: very dark glass with a subtle textured inner border
> - Icon: large (48px), each attack type has a distinctive icon:
>   ❄ Freeze, ↗ Offset, ~~ Noise, ⟳ Replay, ⚔ Coordinated
>   The icon should be an SVG with a subtle animated detail (freeze icon slowly frosts over,
>   noise icon has randomly moving particles within it, etc.)
> - Attack name in Orbitron, detection rate as a small colored badge
> - Selected state: border glows amber, card scales to 1.04, shadow intensifies
> - Hover state: card tilts 2° with perspective transform (CSS `perspective` + `rotateY`)
>   This "tilt card" effect is modern, premium, and used by Linear/Vercel

> ### 🎨 AGENT — EVASION SCORE PROMPT:
> The gamification element. When an attack concludes, show the result dramatically.
>
> - Full-panel reveal animation: the score number counts up from 0 to final value (1.5s)
>   while a circular "grade" indicator draws its ring.
> - Grade display: letter grade (A+/A/B/C/D/F) in a large circle, styled like a seal.
>   A+ = emerald green + glow. F = red + glitch effect (didn't evade at all).
> - "Detected in Xs" — if faster than benchmark: red text ("CAUGHT QUICKLY").
>   If slower than benchmark: green text ("EVADED FOR Xs LONGER"). Competitive framing.
> - The mini leaderboard below: top 5 evasion attempts by attack type, with scores.
>   Each entry has an indexed position and uses the same color coding.
>
> **The whole sandbox should feel like a video game**, not a settings panel.
> If it doesn't feel fun to inject attacks, you haven't gone far enough.

Backend:
```
POST /api/sandbox/attack → {type, sensor_ids, duration, intensity, stealth}
GET /api/sandbox/result/{id} → {time_to_detect, evasion_score, grade, peak_score}
GET /api/sandbox/leaderboard → top evasion scores
```

---

## 9. PAGE: INCIDENT INTELLIGENCE (`/incidents`)

> ### 🎨 AGENT — INCIDENT PAGE PROMPT:
> An incident is a story. A narrative about something that happened to the plant.
> The detail view should feel like reading an incident report from the future —
> structured, intelligent, professional.
>
> - **The list**: each incident card should have visual weight proportional to severity.
>   Minor incidents: small cards. High severity: taller cards with more info visible.
>   Sorting by severity creates a natural visual hierarchy in the list.
> - **The Grad-CAM heatmap**: if you have it, show it prominently.
>   It's a 2D heatmap (sensors × time) showing which sensors drove the model's decision.
>   Use a proper color map: `plasma` or `inferno` (hot colors = high attribution).
>   Render it as an `<img>` or generate client-side with canvas + ImageData API.
> - **The AI Narrative card**: style this as a terminal-like output — monospace font,
>   green-on-dark, with a blinking cursor at the end while "generating".
>   Then transition to formatted readable text when done.
>   The "generating" state: text streams in character by character (typewriter effect).
>   Even if the text is pre-generated, fake the typewriter effect — it feels like
>   real intelligence being assembled.
> - **Ground truth feedback**: make this feel like an operator decision, not a form.
>   Three large buttons: [✓ True Positive], [✗ False Positive], [? Unclear].
>   After selection: a satisfying confirmation animation (check mark draws itself).
>   The button remains highlighted, showing the operator's previous judgment.

Backend:
```
GET /api/incidents → paginated list
GET /api/incidents/{id} → full detail
GET /api/incidents/{id}/heatmap → image
POST /api/incidents/{id}/feedback → {ground_truth, note}
GET /api/incidents/{id}/report → PDF
```

---

## 10. PAGE: ANALYTICS (`/analytics`)

> ### 🎨 AGENT — ANALYTICS PROMPT:
> This page is the executive summary. People see it once, in a presentation, and it needs
> to make jaws drop. Every metric should feel real and significant.
>
> **Layout inspiration**: look at Vercel Analytics, Linear Metrics, and Stripe Dashboard.
> Not to copy — to understand what "clean executive analytics" looks like at its best.
> Then go darker, denser, and more industrial.
>
> - **KPI cards**: animated entry (stagger in from bottom, 40ms apart, spring physics).
>   The number counts up from 0 on page load. Slow enough to read, fast enough to not annoy.
>   Each KPI card: beyond just number + label, include a tiny trend chart (sparkline, 30 days).
>   The sparkline's SHAPE is more informative than the number alone.
> - **The sensor-day heatmap**: this is GitHub's contribution graph, but for anomalies.
>   51 sensors × 30 days = 1530 cells. Render efficiently.
>   Color: viridis or plasma scale (0 = dark background, 1 = bright accent).
>   On hover: tooltip with sensor name + day + score + "Click to replay".
>   Click: navigates to `/replay?sensor=X&date=Y`.
> - **Precision-Recall curve**: show current operating point as a bright dot on the curve.
>   When the operator adjusts threshold in `/calibration`, this dot moves — but that's
>   a stretch goal. For now: static curve + current threshold marker.
> - **Overall feel**: this page can be slightly MORE spacious than Command Center.
>   Let the charts breathe. It's a presentation artifact, not a monitoring tool.

Backend:
```
GET /api/analytics/kpis
GET /api/analytics/incidents-over-time?days=30
GET /api/analytics/sensor-heatmap?days=30
GET /api/analytics/model-performance
```

---

## 11. PAGE: THRESHOLD CALIBRATION (`/calibration`)

> ### 🎨 AGENT — CALIBRATION PROMPT:
> This is the most technical page in the app. Operators with deep ML knowledge use it.
> Make it feel like a scientific instrument, not a settings page.
>
> - **The slider for threshold**: don't use a browser default range input.
>   Build a custom slider with a draggable thumb, a gradient track
>   (green → amber → red left-to-right), and tick marks at key values.
>   On drag: the metric preview updates LIVE with a tiny debounce (150ms).
>   The instant feedback is crucial — operators need to SEE the impact immediately.
> - **The P-R curve**: interactive. Click anywhere on the curve to set that as the
>   new threshold. The dot on the curve moves to where you clicked.
>   The threshold slider below updates to match.
>   Two-way binding between slider and curve click.
> - **Confusion matrix**: don't show it as text numbers.
>   Show it as a 2×2 color grid: TP=green, TN=dark-green, FP=amber, FN=red.
>   Each cell: large number (count) + percentage. Sizes of cells proportional to counts.
>   This visual confusion matrix is much more readable than a table.
> - **"Apply" button**: should be BIG and require confirmation.
>   A modal: "You are about to change the live detection threshold from X to Y.
>   This affects [N] currently monitored sensors."
>   [Cancel] [Confirm & Apply]
>   After apply: a success notification + the calibration page logs the change with a timestamp.

Backend:
```
GET /api/calibration/current
POST /api/calibration/preview → live metrics update
POST /api/calibration/apply
GET /api/calibration/history
```

---

## 12. SHARED COMPONENTS

> ### 🎨 AGENT — COMPONENT LIBRARY PHILOSOPHY:
> Every shared component should be built to the same standard as if you were publishing
> it to npm. Consistent, documented, zero default browser styling, fully dark-mode.
>
> Beyond what's listed below — whenever you find yourself writing the same styling twice,
> extract a component. The goal: by the end, you have a XCDT design system that could
> be published. That level of internal consistency is what makes something feel "product" vs "project".

### Alert Banner
Full-width slide-down on `is_alert=true`.

> ### 🎨 AGENT — ALERT BANNER CHOREOGRAPHY:
> This is your most important global interaction. Make it legendary.
>
> The choreography when alert fires (sequence in ~600ms total):
> 1. t=0ms: Nav border sweeps red (CSS animation, left→right, 150ms)
> 2. t=50ms: Page vignette darkens corners subtly (CSS filter)
> 3. t=100ms: Alert banner slides down from top (spring, 250ms)
>    Banner content: [⚠] [ALERT #2847] [Stage 3 · FIT301] [Score: 0.891] [View Now →]
> 4. t=200ms: Sonner toast appears bottom-right with incident summary
> 5. t=300ms: If on /twin: camera begins flying to alert stage
> 6. t=400ms: Sidebar stage minimap flashes the affected stage
> 7. t=600ms: Everything settled. The system has spoken.
>
> For sound: use Web Audio API, not an audio file.
> Generate a short, clinical alert tone: `oscillator.type = 'sine'` at 880Hz, 
> 50ms duration with fast attack and exponential decay. Not a beep — a ping.
> Toggle with a mute button in settings.

### Command Palette (`Ctrl+K`)

> ### 🎨 AGENT — COMMAND PALETTE PROMPT:
> Install `cmdk` (Command Menu for React — used by Linear, Vercel, Raycast).
> Trigger with `Ctrl+K`. It's the most "product" feature you can add.
>
> Commands available:
> - Navigate to any page
> - "Focus Stage 1-6" (triggers camera fly-to in twin)
> - "Inject attack: Freeze FIT301" (opens sandbox with pre-configured attack)
> - "Replay last incident"
> - "Export incident report"
> - "Toggle: sound / particles / labels / 3D fps counter"
> - "Set threshold to X"
>
> The palette: glass-elevated panel, centered, 600px wide.
> Items: 40px tall, icon + label + kbd shortcut right-aligned.
> Fuzzy search with highlighting of matching characters.
> This alone makes the app feel like a $200/mo SaaS product.

### Data Toast (`components/ui/DataToast.tsx`)

> Use **Sonner** (`sonner` package). It's the best React toast library.
> But override the default styles completely — they're too light-mode friendly.
> Your toast: dark glass, neon border (green for info, red for alert, amber for warning).
> Position: bottom-right. Stack up to 3 visible. Rich content (title + body + action button).

---

## 13. GLOBAL STATE ARCHITECTURE

```typescript
// lib/store.ts — Zustand
interface SystemStore {
  // Live inference data
  fusedScore: number;           // Spring-animated in components
  mahalScore: number;
  collapseScore: number;
  threshold: number;
  isAlert: boolean;
  alertId: string | null;
  systemState: 'normal' | 'elevated' | 'alert';

  // Sensor data
  topSensors: SensorAttribution[];
  allSensorValues: Record<string, SensorValue>;
  stageHealth: StageHealth[];

  // UI cross-panel state (for hover linking)
  hoveredSensorId: string | null;
  selectedSensorId: string | null;

  // Connection
  wsStatus: 'connecting' | 'live' | 'offline';
  wsLatencyMs: number;
  lastUpdateAt: number;

  // App config
  selectedDataset: 'swat' | 'wadi' | 'indian';
  soundEnabled: boolean;
  particlesEnabled: boolean;
  sidebarCollapsed: boolean;

  // Replay
  replayTimestamp: number | null;
  replaySpeed: number;
}
```

> ### 🎨 AGENT — STATE-DRIVEN THEMING PROMPT:
> Implement a global `data-system-state` attribute on `<html>` that updates with the
> Zustand systemState. Then use CSS attribute selectors for state-driven theming:
>
> ```css
> [data-system-state="alert"] body::before {
>   /* chromatic aberration overlay */
> }
> [data-system-state="alert"] .glass-panel {
>   border-color: rgba(255, 68, 68, 0.15);
> }
> [data-system-state="elevated"] {
>   --cyan-300: #FFB300;  /* shift accent to amber during elevated state */
> }
> ```
>
> This single architectural decision cascades visual state changes across the ENTIRE app
> without prop drilling. It's the most leveraged thing you can implement.

---

## 14. WEBSOCKET ARCHITECTURE

> ### 🎨 AGENT — WS IMPLEMENTATION PROMPT:
> The WebSocket connection is the lifeline of the entire application.
> Treat it with that level of care.
>
> - Single connection, managed in a React context provider wrapping the entire app
> - Reconnection: exponential backoff (500ms → 1s → 2s → 4s → 30s max)
> - On disconnect: UI immediately shows "OFFLINE" state, panels grey out slightly,
>   a system toast appears: "Connection lost. Reconnecting..."
> - On reconnect: brief "RECONNECTED" toast, panels restore. The score chart shows
>   a gap in the data where connection was lost (grey fill, not connected line).
> - Message batching: backend sends at 5Hz (200ms). Frontend batches with React's
>   `startTransition` or `flushSync` to prevent unnecessary renders.
> - Implement a WS message queue with a 50ms buffer — batch multiple messages per
>   animation frame to prevent render flooding during high-frequency updates.

---

## 15. PERFORMANCE MANDATES

> ### 🎨 AGENT — PERFORMANCE AS UX PROMPT:
> Performance IS part of the visual design. A janky 30fps chart undermines everything.
>
> Non-negotiables:
> - 3D scene: 60fps. Use `instancedMesh`. Profile with `r3f-perf` dev overlay.
> - Score chart: canvas-based (uPlot). Not SVG, not Recharts, not Chart.js.
> - Sensor table: `@tanstack/react-virtual`. Render only visible rows.
> - Force graph: `react-force-graph` with canvas rendering (not WebGL for 51 nodes).
> - All number animations: `useSpring` from Framer Motion or `react-spring`.
>   Never `setInterval` + `setState` for animations — that's unacceptable.
>
> Lighthouse targets: Performance 90+, Accessibility 90+.
> Run it. Fix issues. Ship only when green.

---

## 16. MODERN UI TECHNIQUES — RESEARCH & IMPLEMENT LIST

> ### 🎨 AGENT — TECHNIQUE CHECKLIST:
> These are modern UI techniques to research, evaluate, and implement where they add value.
> Each one is a "wow factor" that separates this from a generic dashboard.
>
> **Must implement (high ROI, low effort)**:
> - [ ] `font-variant-numeric: tabular-nums` on all data values
> - [ ] `@supports (backdrop-filter: blur())` progressive enhancement
> - [ ] CSS `@layer` for style organization
> - [ ] CSS `color-mix()` for dynamic color variants
> - [ ] Framer Motion `useInView` for scroll-triggered analytics chart entrances
> - [ ] `Intersection Observer` + stagger for table row entry animations
> - [ ] CSS `scroll-behavior: smooth` + anchor navigation for replay timeline
> - [ ] `pointer-events: none` on decorative elements (critical for performance)
>
> **Should implement (medium ROI, medium effort)**:
> - [ ] CSS `@property` for animatable custom properties (gradient angle animation)
> - [ ] `ResizeObserver` for responsive chart sizing (no hardcoded pixel sizes)
> - [ ] Web Workers for force-graph layout computation (prevents main thread block)
> - [ ] `OffscreenCanvas` for the multi-track timeline (better performance)
> - [ ] `Navigator.onLine` + WS reconnection coordination
>
> **Explore if time allows (high ROI, high effort)**:
> - [ ] WebGL shader for the background mesh gradient (more dynamic than CSS)
> - [ ] `AudioContext` generated alert tones (no audio file dependency)
> - [ ] `requestIdleCallback` for non-critical data prefetching
> - [ ] PWA: `manifest.json` + `service-worker` for installable app feel
> - [ ] Custom cursor (crosshair cursor on the 3D scene + graph pages)

---

## 17. COMPLETE BACKEND API CONTRACT

> ### 🎨 AGENT — API INTEGRATION PROMPT:
> Every API call should be wrapped in `@tanstack/react-query`.
> Benefits: automatic caching, background refetching, loading states, error boundaries.
> Never use raw `fetch` or `useEffect`+`useState` for data fetching.
>
> Error states: design them. An error in the incident feed should show a styled
> "Could not load incidents" message with a retry button — not a blank panel.
> Loading states: skeleton screens (animated shimmer), not spinners.
> The shimmer should match the EXACT layout of the data that's loading.
> This is the difference between professional and amateur.

### WebSocket: `ws://localhost:8000/ws/stream` (200ms interval)
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
    {"sensor_id": "FIT301", "score": 0.847, "stage": 3, "trend": "rising", "rank": 1},
    {"sensor_id": "DPIT301", "score": 0.631, "stage": 3, "trend": "stable", "rank": 2}
  ],
  "sensor_values": {
    "FIT101": {"value": 2.441, "status": "normal", "baseline": 2.438},
    "FIT301": {"value": 0.0, "status": "alert", "baseline": 2.441}
  }
}
```

### REST Endpoints
```
GET  /api/status/live                    → current system snapshot
GET  /api/stages/health                  → 6 stages with sensor summaries
GET  /api/sensors/all                    → all 51 values + status
GET  /api/sensors/{id}                   → detail + correlations
GET  /api/sensors/{id}/history?minutes=N → time series
GET  /api/scores/history?minutes=N       → fused/mahal/collapse series
GET  /api/xai/attributions              → current top sensor attributions
GET  /api/xai/heatmap/{incident_id}     → grad-cam image
GET  /api/graph/topology                 → nodes + edges (static, precomputed)
GET  /api/graph/node-states             → attribution per node
GET  /api/graph/causal-chain            → computed on alert
GET  /api/incidents                      → paginated list
GET  /api/incidents/{id}                 → full detail
GET  /api/incidents/{id}/timeline        → pre-fetchable scrub data
GET  /api/incidents/{id}/report          → PDF
POST /api/incidents/{id}/feedback        → {ground_truth, note}
GET  /api/prediction/horizon             → time-to-breach forecast
GET  /api/analytics/kpis
GET  /api/analytics/incidents-over-time?days=30
GET  /api/analytics/sensor-heatmap?days=30
GET  /api/analytics/model-performance
GET  /api/calibration/current
POST /api/calibration/preview            → returns metrics for threshold preview
POST /api/calibration/apply
GET  /api/calibration/history
POST /api/sandbox/attack
GET  /api/sandbox/result/{id}
GET  /api/sandbox/leaderboard
```

---

## 18. 3D ASSET SOURCES

### Immediate Options (Get Today)
1. **Spline** (spline.design) — design in browser → export React component.
   Fastest path to beautiful 3D. Their material system > raw Three.js primitives.
2. **Sketchfab** (sketchfab.com) — filter: Free + Downloadable + GLTF
   Search: "industrial pump", "water tank", "pressure vessel", "pipe manifold"
3. **Poly.pizza** — CC0 low-poly models
4. **Quaternius** (quaternius.com) — free CC0 industrial packs

### Recommended Approach
**Phase 1**: R3F primitives with good PBR materials + Bloom post-processing.
This looks 80% as good as real models with 20% of the effort.
The KEY insight: with Bloom enabled, even BoxGeometry with a cyan emissive material
looks incredible. The glow effect does the heavy lifting.

**Phase 2**: Replace primitives with Spline-designed components stage by stage.
Spline → export GLTF → `useGLTF(url)` → drop into scene. One component at a time.

---

## 19. FINAL AGENT PROMPT — BEFORE YOU SHIP

> After implementation, before marking any component complete, run this checklist:
>
> **Visual Quality Check**:
> - [ ] Open the page on a 1920×1080 screen. Does it look designed for this resolution?
> - [ ] Watch it for 30 seconds with no interaction. Is it alive? Does something move?
> - [ ] Hover over every interactive element. Does the state change feel good?
> - [ ] Trigger an alert (via sandbox). Is the choreography impressive?
> - [ ] Open the 3D twin. Does someone unfamiliar with the project immediately understand
>       what they're looking at? (The 3D should be self-explanatory)
>
> **The "1000ms rule"**: within 1 second of opening any page, a new user should be able to tell:
> 1. Is the system currently safe or in alert?
> 2. Where is the problem (if any)?
> 3. How serious is it?
>
> If they can't answer all three in 1 second: the visual hierarchy isn't working. Fix it.
>
> **The "screenshot test"**: take a screenshot of each page.
> Does it look like something you'd see in a movie's "futuristic control room" scene?
> If yes: ship it.
> If no: what's missing? Usually: either glow/depth/animation, or information density.
> Add whichever is lacking.
>
> **The "5 seconds of explanation" rule**: you should be able to explain what any panel does
> in 5 seconds to someone who's never seen the system.
> If you can't: the panel needs better labels, hierarchy, or design — not more content.
>
> You have all the tools. Build something that makes people say "what is this" the moment
> they see it — and then "this is incredible" when they start understanding it.
> That's the standard. Nothing less.

---

*XCDT-ICS UI Design Specification v2.0*
*End of document. Begin implementation at Global Design Tokens → Layout Shell → Command Center.*
