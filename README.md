# DimoFlow

**Modern local-first Kanban productivity system**

🌐 Live Demo: https://dimoflow.omidium.com/


## Overview

DimoFlow is a fast, offline-first Kanban application designed for structured personal productivity. It runs entirely in the browser using a local-first architecture, with no backend or cloud dependency.

The focus is on speed, simplicity, and full data ownership, while still providing advanced workflow features such as multi-board management, custom columns, task archiving, filtering, and structured task organization.



## Features

### Workspaces (Boards)
- Multiple independent workspaces
- Create, rename, and delete workspaces
- Each workspace has its own data scope
- Workspace-specific task archive



### Column System
- Custom columns per workspace
- Create, rename, move, and delete columns
- Edit mode for structural changes
- Flexible Kanban layouts per workflow



### Task Management
- Create tasks with:
  - Title
  - Description
  - Importance (priority)
  - Auto-generated creation date
  - Optional due date
- Edit and delete tasks
- Add comments per task
- Move tasks via:
  - Drag & drop
  - Button controls



### Archive System
- Archive tasks per workspace
- Restore archived tasks
- Restored tasks return to last active column



### Filtering & Sorting
- Search tasks by title
- Filter by priority
- Filter by due date
- Filter by status



### UI & Themes
- Light theme
- Dark theme
- Midnight theme
- Responsive layout
- Collapsible sidebar navigation



### Settings & Controls
- Edit mode toggle:
  - Enables/disables board editing features
- Workspace management via sidebar
- Column management tools
- Board rename and delete options
- JSON export/import system
- Reset workspace functionality
- Built-in help section



### Keyboard Shortcuts
- `E` → Toggle edit mode
- `N` → New task
- `Esc` → Close panels / cancel actions  
- `/` → Focus search  
- `Enter` → Submit comment and changes
- `Shift + Enter` → New line in comment input  



## Data & Storage

- Fully local-first architecture
- No backend or authentication required
- Automatic saving on every change
- Persistent storage using IndexedDB
- Import/export full workspace as JSON backup



## Architecture Overview

DimoFlow is designed with a clean separation of concerns:

- Centralized reducer-based state management for tasks, columns, and boards
- Dedicated IndexedDB persistence layer
- UI layer separated from state and storage logic

Key modules:

- `src/state/kanbanState.js` → Core application state logic (reducers)
- `src/storage/kanbanDB.js` → IndexedDB persistence layer
- UI components → Rendering and interaction layer

This structure ensures predictability, scalability, and maintainability.



## Tech Stack

- React (Create React App)
- JavaScript (ES6+)
- IndexedDB (custom wrapper)
- CSS (custom styling system)


## Installation

### Clone repository
```bash
git clone https://github.com/omidSarwary/DimoFlow.git
cd DimoFlow
```
### Install dependencies
```bash
npm install
```
### Start development server
```bash
npm start
```
### Production Build
```bash
npm run build
```
## Screenshots

<img width="1877" height="714" alt="image" src="https://github.com/user-attachments/assets/f9aa9969-5986-474a-855c-424271931cdc" />

<img width="341" height="905" alt="image" src="https://github.com/user-attachments/assets/2bd408e3-0173-44e3-ac45-eeb0682139ac" />

<img width="370" height="898" alt="image" src="https://github.com/user-attachments/assets/f0cff239-537e-4c47-ad40-d97bf94655c9" />

## Project Highlights

- Fully local-first architecture (no backend dependency)
- Multi-workspace Kanban system
- Custom persistence layer with IndexedDB
- Advanced task lifecycle (create → edit → move → archive → restore)
- Clean separation of state, storage, and UI layers
- Productivity-focused UX with themes and edit mode system

## Future Improvements

- Cloud synchronization (optional future extension)
- Multi-user collaboration mode
- Mobile application version
- Cross-device sync
- Advanced analytics dashboard

## License

This project is licensed under the MIT License.

## Closing

DimoFlow was built as a personal productivity system focusing on:

- Local-first architecture
- High performance
- Clean UX design
- Scalable frontend engineering patterns



