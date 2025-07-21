# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Spatializer AI Coder Instruction Set

## ✨ Core Concept

> **Rhythm is traced.**

Like watching a heart monitor *with mood.*

Spatializer visualizes rhythm as a spatial trail across time. One beat emitter flows left to right across an invisible grid — like a heart monitor, sequencer, or EKG. Beats are not just marked — they leave behind *feelable* trails that shape the perception of groove, timing, and anticipation. The system is minimal, visceral, and deeply tied to musical intuition.

---

## 🧠 UX Model: Echo Trails

* **X-Axis = Time** → Beats flow toward the center of the screen
* **Center of screen = NOW** → Beathead remains fixed at center X position, representing the present moment
* **Y-Axis = Beat Arrival Shape** → Vertical movement defined by easing curves, e.g. sudden arrival (spike) or swelling motion (anticipation)
* **Only one emitter (Pulsehead)** → No layered instruments yet
* **Pulsehead bobs up and down** → Movement reflects arrival feel, like EKG waveform
* **Trail is continuous** → The beathead's Y-motion literally draws out the trail — a bspline composed of continuous, discrete beat-based ease-in/out curves
* **Tick = Red Flash** → At beat moment, the head flashes red — a metronome tick and visual sync lock

### 🎨 Visual Design

* **Background**: White
* **Pulsehead**: Gray circle, flashes red at tick
* **Trail**: Lighter gray, drawn behind the head

The whole experience is the story of one rhythm *arriving* into the now, like a heartbeat visualized.

---

## 🧭 Terminology Reference: Timing & Sync Concepts

These are foundational metaphors and controls used across audio and visual sequencing platforms. They guide both internal structure and visual rhythm in Spatializer.

* **Clock** *(Defined)*: The master tempo keeper. In DAWs like Ableton, this is the heartbeat that drives timing. We are using `Tone.Transport` as our clock.
* **Transport** *(Defined)*: A system-level timeline — plays, stops, seeks. For us, `Tone.Transport` includes start/pause behavior.
* **Pulse Generator** *(Partially defined)*: A lower-level signal generator that emits regular pulses. This may become part of internal sync logic.
* **Trigger Sync** *(Partially defined)*: A modular concept. One pulse triggers another system. Useful if we modularize tick → animation pipelines.
* **Sequencer Head** *(Not yet implemented)*: Like a playhead, moves through time. We’ve inverted this — our “head” is stationary, and time moves through it.
* **Metronome Lock** *(Defined)*: The red tick. When this flashes, we know a beat has occurred.
* **Sync Pulse** *(Not yet implemented)*: Shared signal used across systems (esp. modular). Could be useful if we allow external sync later.

---

## 🔧 Tech Stack Summary

* **Frontend**: React (Vite + TypeScript)
* **State**: Local component state only (for now)
* **Styling**: No Tailwind (CSS modules or plain CSS)
* **Audio**: Tone.js (start here for precise beat scheduling)
* **Rendering**: Three.js in orthographic camera mode (no perspective distortion)
* **Backend**: Node + Express (API stubs only for now)
* **Deployment**: Render (split frontend/backend as separate services)
* **Monorepo**: Top-level folder contains `/client` and `/server`

---

## 🛠 Repo Setup Instructions

```bash
# 1. Create monorepo
mkdir spatializer && cd spatializer
git init

# 2. Set up frontend (React + Vite + TS)
mkdir client && cd client
pnpm create vite . --template react-ts
pnpm install
pnpm add tone

# 3. Basic Vite config alias
# vite.config.ts
resolve: { alias: { '@': '/src' } }

# 4. Set up backend (Node + Express)
cd ../ && mkdir server && cd server
pnpm init -y
pnpm add express cors

# 5. Add basic Express entry point
# index.ts
import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.get('/api/ping', (_, res) => res.send('pong'))

app.listen(3001, () => console.log('Server on http://localhost:3001'))
```

---

## 🔨 Common Development Commands

Once the project is set up according to the setup instructions:

**Frontend (client/):**
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
```

**Backend (server/):**
```bash
pnpm dev          # Start development server with hot reload
pnpm start        # Start production server
```

**Linting and Testing:**
```bash
# Add these commands once eslint/prettier are configured
pnpm lint         # Run linter
pnpm lint:fix     # Fix linting issues
pnpm test         # Run tests (when added)
```

---

## 🔁 Local Development

* Run backend:

  ```bash
  cd server
  pnpm dev  # or use nodemon / ts-node
  ```

* Run frontend:

  ```bash
  cd client
  pnpm dev
  ```

* Proxy `/api` requests to port 3001 via Vite config (optional)

---

## 🧪 First Proof of Concept

1. Use `Tone.Transport` to schedule a beat every 600ms
2. Emit a `beat` event with timestamp
3. React component listens to beat events
4. Render a gray pulsehead circle fixed at screen center
5. On tick, flash the pulsehead red to indicate sync
6. Animate Y-position with easing to simulate "arrival"
7. Draw trailing echo behind pulsehead using bspline formed by beatwise easing curves

---

## 🗂 Next Modules to Build

* `Pulsehead.tsx` — gray dot fixed at center X, animates Y with easing, flashes red on tick
* `TrailCanvas.tsx` — draws trailing beat shapes moving leftward in light gray
* `BeatScheduler.ts` — Tone.js abstraction
* `EaseLibrary.ts` — functions like easeInOutQuad, etc.
* `useBeatTimeline()` — hook to track and store beat data over time

---

## 🗺️ Development Roadmap

### Phase 1: Working flashing dot pulsing to preset BPM
- Tone.js Transport-based metronome
- Gray circle fixed at screen center
- Red flash on beat tick
- Configurable BPM (start with 100 BPM)

### Phase 2: Lyrics preview with beat-synced word highlighting
- Text file parser for beat-marked lyrics
- Word-by-word pulsing synchronized to beats
- Karaoke-style but with pulsing instead of bouncing ball
- THE WORDS ARE THE SYNC

### Phase 3: Trails
- Y-axis animation with easing curves
- Trailing echoes behind pulsehead
- Bspline trail rendering

---

## 📋 Workflow System

This project uses a daily workflow system:

* **TODAY.md** - Current day's PRD (Product Requirements Document). What must get done today.
* **FUTURE.md** - Upcoming phases and features roadmap (prioritized 1-5)
* **PAST.md** - Archive of completed TODAY.md files with dates
* **CLAUDE.md** - This file - permanent project guidance

## 🎉 TODAY Completion Workflow

**CRITICAL:** When TODAY.md is completed (🎉 confetti moment!):

1. **Immediately archive** - Move completed TODAY.md to PAST.md with completion date
   - **Check PAST.md first** - If today's date already exists, add the completed task to that existing date section
   - **Don't create duplicate dates** - Multiple tasks completed on the same day go under one date header
2. **Create new TODAY.md** - Prompt user to pick next task:
   - Option A: "Pick from FUTURE.md priorities (1-5)"
   - Option B: "Define new custom task"
3. **Update FUTURE.md** - Remove selected priority or adjust rankings

This ensures continuous momentum and clear task progression. Never leave without a new TODAY.md ready!

---

## 📌 Notes

* Precision is everything — visuals must stay in sync with Tone.Transport
* Eventually support importing tracks, but start with just a metronome
* Consider allowing time scrubbing later to replay past trails

## ⚡ Timing Architecture

**Critical for rhythm apps:** React state causes 16-33ms lag due to re-render cycles. This breaks audio/visual sync.

**Use React for:**
- Component structure, props, lifecycle
- UI controls (play/pause, BPM sliders)
- Non-timing-critical interactions

**Avoid React state for:**
- Beat-synchronized visuals
- Sample-accurate timing
- Real-time audio-triggered animations

**Solution:** Use direct DOM manipulation via refs for timing-critical visuals:
```typescript
pulseheadRef.current.classList.add('flashing'); // Instant, no re-render
```

This hybrid approach keeps React's clean patterns while maintaining sample-accurate timing.
