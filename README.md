# TravelPilot — Intelligent Trip Planning & Disruption Management Agent

> An autonomous, reliable, full-stack travel intelligence and disruption-management agent built for modern travelers.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-Backend-green.svg)](https://expressjs.com/)

---

## 🧭 Overview & Problem Statement

Travel planning tools usually break down the moment real life interferes: a high-speed train is delayed by 3 hours, a landmark attraction is closed for emergency maintenance, or severe weather forces outdoor tours indoors. Most apps either do nothing or wipe out the entire schedule, losing hotel reservations and intact bookings.

**TravelPilot** bridges this gap. It acts as an **autonomous travel agent** that:
1. Generates structured, day-by-day itineraries based on travel style, budget, group size, and destination geography.
2. Validates feasibility deterministically (zero schedule overlaps, opening hours checks, rest buffers, transit feasibility).
3. Provides **Dual-Mode Disruption Management** with minimal itinerary churn:
   - **Mode A: Local Repair** — Isolates the disruption to the affected time slot, swapping or shifting only what is broken while strictly preserving unaffected bookings and subsequent days.
   - **Mode B: Full Replan** — Broadly re-balances remaining days when severe disruptions (e.g. flight cancellations, half-day rail stoppages) render the existing structure infeasible.
4. Provides a **What-If Simulation Sandbox** allowing travelers to test hypothetical scenarios (e.g. *“What if the train is delayed 2h?”*, *“What if I cut budget by 20%?”*, *“What if max transit is 30 mins?”*) non-destructively before deciding to promote or discard changes.
5. Keeps **Human-in-the-Loop Control**: AI proposals never silently overwrite confirmed trips. Every proposal requires explicit traveler confirmation (`Accept`, `Reject`, or `Revert`).
6. Ensures **Source Transparency**: Every item in the itinerary is explicitly classified internally as **VERIFIED CURRENT DATA**, **ESTIMATED DATA**, **AI SUGGESTION**, or **USER-PROVIDED DATA**.

---

## ⚡ Key Features

### 1. Dual-Mode Disruption Engine (`/src/lib/disruptionEngine.ts`)
- **Mode A (Local Repair)**: Isolates the change window, preserves unaffected activities, replaces closed/delayed stops with contextual nearby alternatives, and calculates the exact preservation ratio (`% Itinerary Preserved`).
- **Mode B (Full Replan)**: Executes full re-balancing for cancellations and major disruptions, providing explicit justifications on why full replanning was chosen over local repair.
- **Side-by-Side Comparison Audit**: Visualizes original schedule vs revised schedule with color-coded tags (`Preserved`, `Moved`, `Removed`, `Added`).
- **One-Click Recovery Actions**: `Confirm Revision` or `Revert to Original` with zero data loss.

### 2. What-If Simulation Sandbox (`/src/lib/whatIfEngine.ts`)
- Sandbox environment to explore hypothetical decisions without altering confirmed bookings.
- Presets:
  - *Train delayed by 2 hours* (schedule cascade test)
  - *Reduce budget by 20%* (optimizes ticketed stops)
  - *Relaxed pace* (caps stops at 3/day and adds 45m rest margins)
  - *Key museum closure* (indoor swap)
  - *Add an extra day* (extends journey)
  - *Cap transit at 30 minutes*
- Side-by-side delta metrics: Budget difference, schedule changes count, and validation check.
- Actionable decision: **Promote to Confirmed Plan** or **Discard Scenario**.

### 3. Trip Plan Health & Intelligence Dashboard (`/src/components/PlanHealthView.tsx`)
- Replaces vague scores with **factual indicators**:
  - *Schedule Feasibility*: Confirms zero detected time conflicts.
  - *Budget Compliance*: Safety margin remaining in target currency.
  - *Rest & Recovery*: Minimum 10h overnight rest buffer verification.
  - *Transit Feasibility*: Intra-district transit interval checks.
- **Live Meteorology Integration**: Real-time temperature and precipitation risk via Open-Meteo Meteorology API.
- **Data Attribution Breakdown**: Real-time counts of Verified, Estimated, AI-suggested, and User-provided items.

### 4. Grounded AI Assistant with Action Proposals (`/server/geminiService.ts`)
- Answers questions grounded in the itinerary's destination, timings, and budget.
- Returns structured `AssistantActionProposal` cards with `Accept & Apply` and `Reject` controls.
- Quick prompts for common travel decisions (*"Keep budget below $1,800"*, *"Move today's museum to tomorrow"*, *"Explain activity selections"*).

### 5. Interactive Map & Route Visualizer (`/src/components/MapView.tsx`)
- Powered by Leaflet & OpenStreetMap.
- Sequential numbered stop pins with color-coded day themes.
- Dynamic route polylines connecting stops.
- Day filter toggle (*All Days* vs *Day 1*, *Day 2*, etc.).
- Responsive ResizeObserver integration.

---

## 🛠 Tech Stack & Architecture

- **Frontend**: React 18, TypeScript, Tailwind CSS v4, Lucide Icons, Leaflet.js
- **Backend / API**: Express 4, Node.js, TypeScript (`tsx` / `esbuild`)
- **AI Integration**: Google GenAI SDK (`@google/genai`) with Gemini models for contextual reasoning and disruption replanning
- **Live External Services**:
  - **Open-Meteo API**: Live weather and precipitation probability without requiring API keys
  - **Nominatim / OpenStreetMap**: Live geocoding and reverse geocoding
  - **Transit Estimation Engine**: Deterministic Haversine distance and transit mode routing

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm installed

### Installation & Launch
```bash
# Install dependencies
npm install

# Start the full-stack dev server (Express + Vite on port 3000)
npm run dev
```

Visit `http://localhost:3000` to interact with TravelPilot.

### Building for Production
```bash
npm run build
npm start
```

---

## 🔒 Security & Privacy

- **API Secrets**: All Gemini API and external service keys are handled strictly server-side in `/server/` routes.
- **Zero Hallucinated Facts**: Verified live data is never blended into synthetic claims without transparent badges.
- **Traveler Sovereignty**: The agent proposes; the traveler decides.
