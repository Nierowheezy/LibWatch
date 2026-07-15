# LibWatch — Registry Telemetry Analyzer

LibWatch is a streamlined, high-density telemetry dashboard engineered for software developers to track release activity, modify dates, modification tags, and activity velocities across **NPM Packages** and **GitHub Repositories**.

Designed with an aesthetic reminiscent of diagnostic terminals, LibWatch ensures you are always briefed on critical framework modifications, dependencies updates, and core repository commit trends without navigating away from your primary workflow.

---

## 💻 Visual Identity & Design Features

- **High-Contrast Dark Aesthetic**: Crafted with rich, deep-space slate palettes and dynamic primary accent colors (Cyan, Emerald, Violet, Orange, Rose) providing distinctive visual feedback.
- **Micro-Conversational Transitions**: Staggered layout entry transitions.
- **Auto-Sync Countdown Clock**: Active automated time dials checking libraries versions and repository commit pacing continuously. Handles pauses and resumes via single clicks.
- **Resource Inspector**: Monospace YAML-formatted detailed panel with instant documentation open triggers and direct endpoint querying.
- **30-Day Sparkline Analytics**: Dynamic charts representing release frequency or commits density beautifully using Area curves.
- **Manual Priority Sort**: Drag-and-drop handles allowing users to re-arrange lists dynamically, establishing custom priorities.
- **Global Keyboard Hotkeys**: Configure hotkeys inside workspace settings to trigger manual checks (`S` by default) or focus search forms (`/` by default) instantaneously.

---

## 🛠️ Architecture and Folder Structure

```text
/src
├── types.ts                     # TypeScript Type Declarations 
├── utils.ts                     # Helper date formattings & trend data generators
├── main.tsx                     # React application Entry handler
├── App.tsx                      # Main coordinating react component orchestrator
└── components/
    ├── theme.ts                 # Visual UI preset accent definitions
    ├── Tooltip.tsx              # Custom React Portal Tooltip component
    ├── Header.tsx               # Title section, countdown clock, sync control
    ├── StatsOverview.tsx        # High-level numeric dashboard stats cards
    ├── AddLibraryForm.tsx       # Package track creation selectors & toast messages
    ├── SettingsDrawer.tsx       # Sliders controls, keybind binds, tone chimes, theme accents
    ├── LibraryTable.tsx         # Sorting columns, drag handles, expand lines, sparklines
    └── SidebarInspector.tsx     # Resource inspector panel displaying YAML telemetry details
```

---

## ⚙️ Environment Configuration

Define the following environment variable inside your `.env` file for local development:

```env
# .env
PORT=3000
```

---

## 🚀 Rapid Development Commands

Install base dependencies and initialize development servers:

```bash
# Install NPM dependencies
npm install

# Run the local vite-express server
npm run dev

# Run linting check
npm run lint

# Compile and bundle code for production output
npm run build
```

---

## 🛡️ License

Built in a sandboxed developer workspace for high-productivity library monitoring.
All data is stored inside local browser files (`localStorage`), guaranteeing immediate privacy.
