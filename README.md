# DimoFlow

Modern local-first Kanban productivity system

DimoFlow is a clean, offline-ready Kanban app built for structured personal productivity. It uses a local-first architecture, supports multiple boards, and keeps the experience fast, simple, and predictable.

## Demo / Preview

Add screenshot here

Works fully offline in the browser.

## Features

### Core Features

- Boards (workspaces)
- Custom columns per board
- Task management: create, move, delete
- Task filtering system

### Productivity Features

- Search with debounce
- Priority + due date filtering
- Keyboard shortcuts
- Theme switching

### Data & Persistence

- Fully local-first
- IndexedDB storage
- Auto-save state
- Import / export JSON backup

### UX Features

- First-time onboarding screen
- Responsive design
- Collapsible sidebar & filters

## Tech Stack

- React
- JavaScript
- IndexedDB via a custom wrapper
- CSS

## Architecture Overview

DimoFlow uses a reducer-based state model for predictable updates and easier scaling.

- `src/state/kanbanState.js` holds the centralized board, column, and task logic.
- `src/storage/kanbanDB.js` handles IndexedDB persistence through a small wrapper.
- UI, state, and storage are kept separate so the app stays easier to maintain and extend.

## Installation Instructions

Recommended: Node.js LTS

```bash
git clone https://github.com/omidSarwary/DimoFlow.git
cd dimoflow
npm install
npm start
```

Build for production:

```bash
npm run build
```

## Usage Guide

1. Create a board to organize a workspace.
2. Add tasks to a board column.
3. Move tasks between columns with drag and drop or button controls.
4. Use filters to search by title, priority, due date, or status.
5. Switch themes for a preferred visual style.
6. Your changes auto-save locally in the browser.

### Keyboard Shortcuts

- `/` Search
- `N` New task
- `E` Edit mode
- `Esc` Close panels


## Key Design Decisions

- Local-first keeps the app offline-friendly and fast.
- IndexedDB removes any backend dependency while still persisting user data.
- Reducer-based state makes behavior more predictable and easier to extend across boards, columns, and tasks.

## Project Highlights

Why this project stands out:

- Full local-first architecture
- Scalable multi-board system
- Custom persistence layer
- Production-style UX with onboarding, themes, and filters

## Future Improvements

- Drag and drop improvements
- Cloud sync
- Collaboration mode
- Mobile app version

## Closing

Built as a portfolio project focusing on frontend architecture and UX design.
