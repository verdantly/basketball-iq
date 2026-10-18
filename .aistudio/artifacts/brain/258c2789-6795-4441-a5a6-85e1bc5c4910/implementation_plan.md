# Hardwood IQ — Yahoo 9-Cat H2H AI Draft War Room

Hardwood IQ is a real-time fantasy basketball draft assistant designed specifically for Yahoo 9-Category Head-to-Head leagues. It combines multimodal AI vision (allowing the AI to "see" your live Yahoo draft room via screen share or screenshot capture) with an interactive draft board, dynamic 9-category Z-score rankings, punt strategy modeling, and instant expert pick recommendations.

### User Review & Critical Decisions

> [!IMPORTANT]
> Please review the confirmed league format and recommended war room capabilities below before we build the application.

- **Confirmed Scoring & Roster Format**: **Yahoo 9-Category Head-to-Head** (`FG%`, `FT%`, `3PTM`, `PTS`, `REB`, `AST`, `STL`, `BLK`, `TO` with Yahoo's standard 13-spot roster: `PG`, `SG`, `G`, `SF`, `PF`, `F`, `C`, `C`, `Util`, `Util`, `BN`, `BN`, `BN` plus `IL+` eligibility and multi-position tags).
- **Recommended Board Vision & Sync**: **Live Screen Share / Screenshot Vision + Interactive Draft Board** — Capture a live browser tab of your Yahoo Draft Room (via Screen Capture API) or paste/upload a screenshot at any point in the draft so Gemini Vision automatically detects drafted players and updates the board, paired with fast 1-click manual logging.
- **Recommended AI Advisor Suite**: **Category Punt Engine + Positional Scarcity + Live Pick Advisor** — Real-time recalculation of player Z-scores when you toggle punt categories (e.g., Punt FG% or Punt FT%/AST), team 9-category radar/percentile balance, Yahoo ADP value steals/reaches, and on-demand head-to-head player comparisons.

---

### 1. Overview & Core Concept

- **What It Does**: Tracks every pick in your fantasy basketball draft—either by visually reading your Yahoo draft board screen or via quick interactive logging—and dynamically re-ranks all remaining NBA players based on your current roster's 9-category strengths, positional needs (`PG`, `SG`, `G`, `SF`, `PF`, `F`, `C`, `Util`), and chosen punt strategy.
- **Target Audience / Persona**: Competitive Yahoo 9-Category H2H fantasy basketball managers who want quantitative Z-score edge, category synergy insights, and an AI co-GM watching their board in real time under a 60-second pick clock.
- **Key Value**: Eliminates manual spreadsheet cross-referencing during fast-paced drafts by letting AI read the draft board directly and surface the top 3 optimal picks tailored to your exact roster build on every turn.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Draft Setup & Strategy Calibration**: Select league size (10, 12, or 14 teams), your draft slot (snake or linear order), and active punt categories (or let the AI auto-detect your natural build after Round 2).
  2. **Board Vision Sync (Live Screen Capture or Paste)**: Connect your Yahoo draft window via live browser tab capture (`getDisplayMedia`) with a 1-click **"Scan Draft Board Now"** trigger (plus optional auto-scan interval) or paste/drop a screenshot. Gemini Vision extracts newly drafted players, updates the draft log, and advances the pick clock.
  3. **Dynamic 9-Cat Player Rankings Table**: Browse available NBA players sorted by **Adjusted Z-Score** (dynamically weighted by your active punts and category needs), complete with Yahoo ADP differential (`Steal` / `Reach` indicators), per-game projections, and category Z-score heatbars across all 9 categories.
  4. **AI Co-GM Pick Advisor & Head-to-Head Comparator**: Click **"Analyze My Next Pick"** or select 2–3 players to compare. The AI evaluates your current 9-category Z-score totals, remaining Yahoo roster slots, and upcoming positional cliffs to recommend the highest-leverage pick.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-precision sports analytics war room inspired by professional basketball front-office telemetry (Second Spectrum / Basketball-Reference meets modern dark-slate SaaS data grids).
  - *Color Palette & Mood*:
    - `--background`: Deep Court Slate (`#0B0F17`) for reduced eye strain during 2-hour draft sessions.
    - `--surface`: Elevated Tactical Slate (`#111827`) with subtle `1px solid #1E293B` structural hairlines.
    - `--primary`: Yahoo Fantasy Royal Violet (`#7C3AED`) & Hardwood Amber (`#F59E0B`) for primary CTAs and "On The Clock" focus states.
    - *9-Cat Z-Score Heatmap Scale*: Semantic diverging scale — Elite (`#10B981` Emerald `+2.0+ Z`), Above Average (`#34D399`), Neutral (`#94A3B8` Slate), Below Average (`#F87171`), Negative Outlier (`#EF4444` Crimson `-1.5 Z`), paired with explicit numeric Z-values so state is never communicated by color alone.
  - *Typography & Hierarchy*:
    - *Display & Navigation*: `Plus Jakarta Sans` (SemiBold/Bold) for crisp headers, player names, and tactical section titles.
    - *Body & Scouting Notes*: `DM Sans` (Regular/Medium) for readable AI scouting breakdowns.
    - *Data & Telemetry*: `JetBrains Mono` with strict `tabular-nums` for all 9-category projections, FG%/FT% splits, Z-scores, and ADP deltas.
  - *Component Styling & Layout*:
    - Full-viewport 1440px+ desktop war room layout with a single-row Top Bar Contract (Brand wordmark — Navigation tabs: `Draft War Room`, `Board Vision`, `My Roster & 9-Cat Build`, `Draft Grid` — Primary CTA: `"Scan Draft Board"`).
    - Compact high-density data table (`40px` row height) with sticky column headers, instant search, position eligibility filters (`All`, `PG`, `SG`, `SF`, `PF`, `C`), and 1-click **"Draft to My Team"** vs. **"Mark Taken"** actions.

- **Interactive Feedback & Motion**:
  - Instant (<150ms) Z-score recalculation and table re-sorting when toggling any of the 9 category punt switches.
  - Clean scanning overlay with extracted player confirmation toast when Gemini Vision reads a draft board frame.
  - Skeleton loading rows during AI advisor deep analysis and clear empty/reset states.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Hybrid Vision (Live Tab Capture + Screenshot Upload) + Manual Quick-Draft**
  - *Chosen Approach*: Support both browser Screen Capture (`navigator.mediaDevices.getDisplayMedia`) for zero-friction single-click frame grabs of an open Yahoo Draft tab, drag-and-drop/clipboard screenshot paste, and instant search/click manual drafting.
  - *Why*: Yahoo's live draft room runs in a separate browser window without a public real-time websocket API for unauthenticated third-party apps. Screen capture + Gemini multimodal vision lets the AI literally "see" the Yahoo draft board in real time while manual click actions provide a zero-latency fallback.
  - *Alternatives Considered*: Yahoo OAuth API only — passed over as the sole mechanism because live draft room pick state is often delayed or restricted in standard REST polling compared to visual board inspection.

- **Decision 2: Client-Side Z-Score Engine Paired with Server-Side Gemini 3.8 Flash Reasoning**
  - *Chosen Approach*: Compute mathematical 9-category Z-scores, punt re-weightings, and team category averages instantaneously on the client, and pass the structured mathematical context + board vision images to the server-side Gemini API (`gemini-3.8-flash`).
  - *Why*: Mathematical Z-score sorting must happen in <50ms when a pick is made or a punt toggle is clicked, while Gemini provides the nuanced strategic synthesis (positional scarcity, schedule/injury context, category synergy, and visual board OCR).

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TOP BAR NAVIGATION & DRAFT CLOCK                     │
│  [Hardwood IQ]   [War Room · Vision Sync · My 9-Cat Build · Snake Board]    │
└──────────────────────┬───────────────────────────────────┬──────────────────┘
                       │                                   │
        ┌──────────────▼──────────────┐     ┌──────────────▼──────────────┐
        │   CLIENT STATE & 9-CAT      │     │   BOARD VISION CAPTURE      │
        │   Z-SCORE ENGINE            │     │   (Screen Share / Paste)    │
        │  • 160+ NBA Player Pool     │     │  • Live Video Frame Grab    │
        │  • Dynamic Punt Multipliers │     │  • Clipboard / File Drop    │
        │  • Yahoo 13-Slot Roster     │     └──────────────┬──────────────┘
        └──────┬───────────────┬──────┘                    │
               │               │                           ▼
┌──────────────▼──────┐ ┌──────▼──────────────┐ ┌─────────────────────────────┐
│  PLAYER RANKINGS &  │ │  ROSTER & 9-CAT     │ │  EXPRESS SERVER API PROXY   │
│  HEATMAP GRID       │ │  RADAR SIDEBAR      │ │  • POST /api/ai/scan-board  │
│  • Pos Filter/Search│ │  • PG/SG/G/SF/PF/C  │ │  • POST /api/ai/recommend   │
│  • 9-Cat Z-Bars     │ │  • Team Cat Z-Sums  │ │  • POST /api/ai/compare     │
│  • Steal/Reach ADP  │ │  • Punt Toggles     │ │    (@google/genai SDK)      │
└─────────────────────┘ └─────────────────────┘ └─────────────────────────────┘
```

- **Data Model & State**:
  - **NBA Player Projection Entity**: `id`, `name`, `team`, `positions` (Yahoo multi-position array e.g. `['PG', 'SG']`), `yahooAdp`, `gamesPlayed`, per-game projections (`pts`, `reb`, `ast`, `tpm`, `stl`, `blk`, `fgPct`, `fga`, `ftPct`, `fta`, `to`), base category Z-scores (`zPts`, `zReb`, `zAst`, `zTpm`, `zStl`, `zBlk`, `zFg`, `zFt`, `zTo`), `status` (`available`, `my_team`, `drafted_other`), and `scoutingNote`.
  - **Draft Room State**: `leagueSize` (default 12), `userDraftSlot` (1–12), `currentPickNumber`, `puntedCategories` (Set of category keys), `rosterSlots` (Yahoo H2H 13-slot assignment map), and `draftHistory` log.

- **Interactive Component & State Mapping**:
  - **Punt Strategy Bar**: Toggling any of the 9 categories (e.g., `TO`, `FG%`, `FT%`) zeroes out that category's weight in the composite Z-score formula and immediately re-ranks all 160+ NBA players.
  - **Player Table Actions**: Clicking `Draft` assigns the player to the best open Yahoo position slot (`PG`, `SG`, `G`, `SF`, `PF`, `F`, `C`, `Util`, `BN`) on the user's roster and updates the team's 9-category Z-score profile; clicking `Taken` marks them drafted by an opponent.
  - **Board Vision Scanner**: Captures a base64 frame from an active `MediaStream` (screen share of Yahoo Draft tab) or uploaded screenshot, sends it to `/api/ai/scan-board` along with the list of currently available player names, and applies a 1-click confirmed batch update of all newly drafted players.
  - **AI Pick Advisor Panel**: Sends the top 15 available players, the user's current roster, team 9-category Z-score totals, and active punts to `/api/ai/recommend`, returning a structured JSON recommendation of the Top 3 Picks (`Best Overall Fit`, `Category Specialist`, `High-Upside Value Steal`) plus interactive Q&A comparison.

- **Key Sequences & Integrations**:
  - **Server-Side Gemini SDK (`@google/genai`)**: Initialized in the Express server using `process.env.GEMINI_API_KEY` and `gemini-3.8-flash` with structured JSON `responseSchema` for deterministic board OCR matching and structured pick advice.
  - **Local Persistence**: Full draft state, custom punt configurations, and pick history auto-save to `localStorage` so an accidental browser refresh never loses progress during a live Yahoo draft.
