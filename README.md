# Second Brain

A personal knowledge management webapp — track expenses, manage ideas, set reminders, take notes, build habits, and set goals.

## Tech Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend:** Express + TypeScript
- **Database:** SQLite (sql.js)
- **Deployment:** Docker

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ (v20+ recommended)
- npm (comes with Node.js)

### Install & Run

```bash
git clone https://github.com/amkai/second-brain.git
cd second-brain
npm install
npm run dev
```

Open **http://localhost:5173** in your browser. Create an account to get started.

## Auto-Start on Login

### Linux (Hyprland / Omarchy)

Add to `~/.config/hypr/autostart.lua`:

```lua
o.launch_on_start("second-brain")
```

Make sure `~/.local/bin` is in your PATH, and the script exists:

```bash
mkdir -p ~/.local/bin
cat > ~/.local/bin/second-brain << 'EOF'
#!/bin/bash
cd ~/second-brain
nohup npm run dev > /tmp/second-brain.log 2>&1 &
EOF
chmod +x ~/.local/bin/second-brain
```

### macOS (launchd)

Copy the plist file:

```bash
cp scripts/com.secondbrain.dev.plist ~/Library/LaunchAgents/
```

Load it:

```bash
launchctl load ~/Library/LaunchAgents/com.secondbrain.dev.plist
```

To stop:

```bash
launchctl unload ~/Library/LaunchAgents/com.secondbrain.dev.plist
```

### Windows (Startup Script)

A startup script is provided at `scripts/start-second-brain.bat`.

**Option 1 — Run manually:**
Double-click `scripts/start-second-brain.bat` or run it from Command Prompt.

**Option 2 — Auto-start on login:**
1. Press `Win+R`, type `shell:startup`, press Enter
2. Copy `scripts/start-second-brain.bat` into the folder that opens
3. It will run every time you log in

## Docker

```bash
docker compose up -d
```

App runs at **http://localhost:3001** (serves both API and client).

To stop:

```bash
docker compose down
```

## Deploy to Cloud (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway variables set SESSION_SECRET="$(openssl rand -hex 32)"
railway variables set NODE_ENV=production
railway up
railway domain
```

Your app will be live at the URL Railway provides — open it on your phone or any device.

## Project Structure

```
second-brain/
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Route pages
│   │   ├── stores/       # Zustand state
│   │   └── lib/          # API client, utilities
│   └── vite.config.ts
├── server/               # Express backend
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── db/           # SQLite schema
│   │   └── middleware/   # Auth
│   └── Dockerfile
├── scripts/              # Platform startup scripts
├── docker-compose.yml
└── package.json
```

## Features

- **Dashboard** — overview of expenses, habits, reminders, goals
- **Expense Tracker** — categories, budgets, recurring transactions, monthly summaries
- **Ideas Manager** — quick capture with pin/unpin
- **Reminders** — priority levels, recurring, overdue detection
- **Notes** — markdown editor with live preview
- **Habit Tracker** — streaks, 7-day view, completion tracking
- **Goal Tracking** — progress bars, deadlines, categories
- **Calendar** — unified view of expenses, reminders, and habits
- **Tags** — organize anything with labels
- **Search** — `Ctrl+K` / `⌘K` to search across all modules
- **Dark/Light Mode** — toggle in sidebar

## License

MIT
