# DimoFlow Security Review

## Executive Summary
DimoFlow avoids the biggest frontend security footguns like `dangerouslySetInnerHTML`, but it still has two real local-data risks: imported state is only shallowly validated, and full board state is logged to the browser console in multiple places. Both are important in a local-first app where the browser may store sensitive notes, comments, and task content.

## Findings

### 1. Shallow import/state validation can let malformed objects reach render-time logic
- **Severity:** Medium
- **Where:** `src/state/kanbanState.js:57-107`, `src/state/kanbanState.js:234-257`, `src/utils/filters.js:78-88`
- **Why it is a risk:** `validateState` only checks that `boards`, `columns`, and `tasks` are arrays, not that their entries are valid objects with the expected fields. `getValidState` also only normalizes columns, not board/task/comment items. Because the filter helpers assume each task has `title`, `priority`, `columnId`, and `dueDate`, a malformed imported backup or corrupted IndexedDB record can cause runtime errors or poisoned state to persist.
- **Fix recommendation:** Add deep schema validation and normalization for boards, columns, tasks, and comments before hydration/import. Reject or strip invalid task entries, coerce missing fields to safe defaults, and only dispatch hydrated state after the normalized structure passes a stricter validator.

### 2. Full app state is logged to the console, exposing local user data
- **Severity:** Low
- **Where:** `src/storage/kanbanDB.js:47-92`, `src/state/kanbanState.js:57-105`
- **Why it is a risk:** The app logs the entire state object when saving/loading IndexedDB and logs the full state again during validation. In a local-first app, those logs can expose private task titles, descriptions, comments, and board names to anyone with browser access or shared device access.
- **Fix recommendation:** Remove state dumps from `console.log`/`console.error` calls in production paths. Keep only short status messages or gate detailed logs behind a development flag.

## Notes
- I did not find a DOM XSS sink such as `dangerouslySetInnerHTML`.
- I did not confirm a specific dependency CVE from the repository alone; `react-scripts@5.0.1` is dated, so it should be audited regularly with the project lockfile.
