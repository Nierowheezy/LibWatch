# Product Requirements Document (PRD)

## 1. System Intent & Vision
**LibWatch** is a modern, responsive developer instrumentation dashboard engineered to monitor, analyze, and track modifiable states, versions, release frequencies, and committed updates of downstream library dependencies.

By consolidating tracking across multiple registries (including the **Node Package Manager (NPM)** and **GitHub Host Repositories**), LibWatch minimizes the friction of checking for new features, bug fixes, or performance increases, keeping development workflows safe, up-to-date, and proactive.

---

## 2. Core Objectives
- **Single-Glass Visual Control**: Bring NPM packages and GitHub repositories together in a unified, high-density, command-line-styled user interface.
- **Cross-Origin Security**: Access live downstream registries safely without browser CORS limitations using client-proxied server routers.
- **Manual & Automated Instrumentation**: Provide precise, adjustable scheduling dials alongside instant global sync controls to handle metadata refresh pacing.
- **Intuitive Organization & Prioritization**: Deliver robust filters, search queries, multi-field sorting, and manual cursor drag prioritization to structure libraries into custom critical levels.

---

## 3. Technology Stack & Architecture
- **Front-End Layer**: `React 18` paired with typesafe `TypeScript` and `Vite`.
- **Layout Animations**: Fluid animations and drawer transitions driven by `motion/react`.
- **Styling Utility**: High-performance, customized `Tailwind CSS v4` setup containing ambient slate tones and configurable color accents.
- **Analytics Visualization**: Interactive 30-day activity trend charts mapped of daily requests or commit velocity using `recharts` and `d3`.
- **Back-End API Handlers**: Server-side proxy routing (`/api/npm-update` and `/api/github-update`) running on Node.js container environments to avoid cross-origin blocking.

---

## 4. Requirement Specifications

### 4.1 Dependency Registry Trackers
- Users can input either an NPM package identifier (e.g., `lodash`, `zod`) or a GitHub repository path in `owner/repo` form (e.g., `facebook/react`).
- Custom added libraries undergo immediate server-side validation. If the item does not exist, detailed user feedback guides correction.
- Validation checks automatically update and select the added element on the fly to streamline exploration.

### 4.2 Instrumentation Timer
- Configurable interval gauges allowing users to set dynamic synchronization pacing.
- Visual auto-sync clock showing a high-precision ticking countdown, which triggers automated registry calls.
- Toggle pausing/resuming controls for flexible bandwidth and utility management.

### 4.3 Custom Priority Sort & Filter Controls
- **Filter**: Instant search string Matching against titles, descriptions, latest tag versions, or author comments.
- **Ecosystem Classification**: Segment views between NPM and GitHub.
- **Sort Priority**: Single-click toggles for Identifier Names, Ecosystems, Update Timelines, and Health States.
- **Manual Drag & Drop**: Drag row controls to arrange lists manually, instantly unlocking customizable priorities.

### 4.4 Settings Panel Drawer
- Slide-out preference sheet controlling:
  - Time value input & measurement units (Seconds, Minutes, Hours, Days).
  - Configurable Hotkeys (Focusing searches, Triggering syncs) to maximize productivity without mouse interaction.
  - Visual accent triggers (Cyan, Emerald, Violet, Orange, Rose) styling interface borders, neon markers, and highlight circles dynamically.
  - Layout density toggles reducing cell padding for advanced, multi-row overview setups.
  - Synth oscillators synthesizers allowing users to toggle audible chimes on/off.

### 4.5 Security and Persistence
- Stored states kept inside `localStorage` keys (`library_tracker_libs`, `library_tracker_settings`) allowing sessions to persist securely without unnecessary database integrations.
- API requests proxy through Node.js endpoints, protecting query sources from exposure in browser inspection consoles.
