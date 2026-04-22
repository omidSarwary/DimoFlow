//src / state / kanbanState.js
// Central state structure for Kanban app with multi-board support

// Define the default columns for all boards
export const defaultColumns = [
  { id: 'todo', name: 'To Do', order: 0 },
  { id: 'inprogress', name: 'In Progress', order: 1 },
  { id: 'done', name: 'Done', order: 2 }
];

const createColumnsCopy = () => defaultColumns.map(column => ({ ...column }));

// Create initial board structure
export const createInitialBoard = (id, name) => ({
  id,
  name,
  columns: createColumnsCopy(),
  tasks: []
});

// Initial state with multi-board structure
export const initialState = {
  boards: [
    {
      id: 'default-board',
      name: 'Default Board',
      columns: createColumnsCopy(),
      tasks: []
    }
  ],
  activeBoardId: 'default-board'
};

// Action types
export const ADD_TASK = 'ADD_TASK';
export const MOVE_TASK = 'MOVE_TASK';
export const DELETE_TASK = 'DELETE_TASK';
export const ADD_TASK_COMMENT = 'ADD_TASK_COMMENT';
export const MOVE_TASK_TO_COLUMN = 'MOVE_TASK_TO_COLUMN';
export const SET_ACTIVE_BOARD = 'SET_ACTIVE_BOARD';
export const ADD_BOARD = 'ADD_BOARD';
export const DELETE_BOARD = 'DELETE_BOARD';
export const RENAME_BOARD = 'RENAME_BOARD';
export const RESET_APP = 'RESET_APP';
export const ADD_COLUMN = "ADD_COLUMN";
export const DELETE_COLUMN = "DELETE_COLUMN";
export const RENAME_COLUMN = "RENAME_COLUMN";
export const REORDER_COLUMN = "REORDER_COLUMN";
export const UPDATE_TASK = "UPDATE_TASK";

/**
 * Strict state validation function
 * Validates the entire state structure according to required schema
 * @param {Object} state - The state object to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateState = (state) => {
  // Check if state exists
  if (!state || typeof state !== 'object') {
    console.error('State is not an object:', state);
    return false;
  }

  // Check if boards array exists and is an array
  if (!state.boards || !Array.isArray(state.boards)) {
    console.error('State missing or invalid boards array:', state);
    return false;
  }

  // Check if activeBoardId exists and is a string
  if (!state.activeBoardId || typeof state.activeBoardId !== 'string') {
    console.error('State missing or invalid activeBoardId:', state);
    return false;
  }

  // Validate each board
  for (let i = 0; i < state.boards.length; i++) {
    const board = state.boards[i];

    // Check board has id
    if (!board.id || typeof board.id !== 'string') {
      console.error(`Board at index ${i} missing or invalid id:`, board);
      return false;
    }

    // Check board has name
    if (!board.name || typeof board.name !== 'string') {
      console.error(`Board at index ${i} missing or invalid name:`, board);
      return false;
    }

    // Check board has columns array
    if (!board.columns || !Array.isArray(board.columns)) {
      console.error(`Board at index ${i} missing or invalid columns:`, board);
      return false;
    }

    // Check board has tasks array
    if (!board.tasks || !Array.isArray(board.tasks)) {
      console.error(`Board at index ${i} missing or invalid tasks:`, board);
      return false;
    }
  }

  console.log('State validation passed:', state);
  return true;
};

export const getSortedColumns = (board) => {
  if (!board || !Array.isArray(board.columns)) {
    return [];
  }

  return [...board.columns].sort((a, b) => {
    const aOrder = Number.isFinite(a?.order) ? a.order : 0;
    const bOrder = Number.isFinite(b?.order) ? b.order : 0;

    if (aOrder === bOrder) {
      return String(a?.id ?? '').localeCompare(String(b?.id ?? ''));
    }

    return aOrder - bOrder;
  });
};

export const normalizeColumns = (columns) => {
  if (!Array.isArray(columns)) {
    return [];
  }

  return getSortedColumns({ columns }).map((column, index) => ({
    ...column,
    order: index
  }));
};

export const normalizeBoard = (board) => {
  if (!board) {
    return board;
  }

  return {
    ...board,
    columns: normalizeColumns(board.columns)
  };
};

export const moveTaskWithinBoard = (board, taskId, direction) => {
  if (!board || !Array.isArray(board.columns) || !Array.isArray(board.tasks)) {
    return board;
  }

  const sortedColumns = getSortedColumns(board);
  if (sortedColumns.length < 2) {
    return board;
  }

  const task = board.tasks.find(item => item.id === taskId);
  if (!task) {
    return board;
  }

  const currentColumnIndex = sortedColumns.findIndex(column => column.id === task.columnId);
  if (currentColumnIndex === -1) {
    return board;
  }

  let nextColumnIndex = currentColumnIndex;
  if (direction === 'next') {
    nextColumnIndex = Math.min(currentColumnIndex + 1, sortedColumns.length - 1);
  } else if (direction === 'previous') {
    nextColumnIndex = Math.max(currentColumnIndex - 1, 0);
  } else {
    return board;
  }

  if (nextColumnIndex === currentColumnIndex) {
    return board;
  }

  const nextColumnId = sortedColumns[nextColumnIndex]?.id;
  if (!nextColumnId) {
    return board;
  }

  return {
    ...board,
    tasks: board.tasks.map(item =>
      item.id === taskId
        ? { ...item, columnId: nextColumnId }
        : item
    )
  };
};

export const moveTaskToColumnWithinBoard = (board, taskId, targetColumnId) => {
  if (!board || !Array.isArray(board.columns) || !Array.isArray(board.tasks)) {
    return board;
  }

  const sortedColumns = getSortedColumns(board);
  const targetColumn = sortedColumns.find(column => column.id === targetColumnId);
  if (!targetColumn) {
    return board;
  }

  const taskIndex = board.tasks.findIndex(task => task.id === taskId);
  if (taskIndex === -1) {
    return board;
  }

  const task = board.tasks[taskIndex];
  if (task.columnId === targetColumnId) {
    return board;
  }

  const updatedTasks = board.tasks.map(item =>
    item.id === taskId
      ? { ...item, columnId: targetColumnId, updatedAt: new Date().toISOString() }
      : item
  );

  return {
    ...board,
    columns: normalizeColumns(board.columns),
    tasks: updatedTasks
  };
};

/**
 * Get valid state or fallback to initialState
 * This ensures app always has valid state structure
 */
export function getValidState(state) {
  if (
    !state ||
    !Array.isArray(state.boards) ||
    state.boards.length === 0
  ) {
    return initialState;
  }
  const validBoards = state.boards.filter(board =>
    board &&
    Array.isArray(board.columns) &&
    Array.isArray(board.tasks)
  ).map(normalizeBoard);
  if (validBoards.length === 0) {
    return initialState;
  }
  return {
    boards: validBoards,
    activeBoardId:
      state.activeBoardId &&
        validBoards.find(b => b.id === state.activeBoardId)
        ? state.activeBoardId
        : validBoards[0].id
  };
}

// Reducer function with strict state handling
export const kanbanReducer = (state, action) => {
  // On first render, state might be undefined - return initialState
  if (state === undefined) {
    return initialState;
  }

  switch (action.type) {
    case ADD_TASK:
      // Safety check for boards array - must exist and be valid
      if (!state.boards || !Array.isArray(state.boards) || state.boards.length === 0) {
        console.error('Cannot ADD_TASK: Invalid boards in state:', state);
        return initialState;
      }

      const now = new Date().toISOString();
      return {
        ...state,
        boards: state.boards.map(board => {
          // Only add task to active board
          if (board.id === state.activeBoardId) {
            return {
              ...board,
              columns: normalizeColumns(board.columns),
              tasks: [
                ...board.tasks,
                {
                  id: Date.now().toString(),
                  title: action.payload.title,
                  description: action.payload.description || '',
                  columnId: action.payload.columnId,
                  dueDate: action.payload.dueDate || null,
                  priority: action.payload.priority || 'medium',
                  comments: [],
                  createdAt: now,
                  updatedAt: now
                }
              ]
            };
          }
          return board;
        })
      };

    case MOVE_TASK: {
      const { taskId, direction } = action.payload;

      return {
        ...state,
        boards: state.boards.map(board => {
          if (board.id !== state.activeBoardId) return board;

          return moveTaskWithinBoard(board, taskId, direction);
        })
      };
    }

    case DELETE_TASK:
      // Safety check for boards array - must exist and be valid
      if (!state.boards || !Array.isArray(state.boards) || state.boards.length === 0) {
        console.error('Cannot DELETE_TASK: Invalid boards in state:', state);
        return initialState;
      }

      return {
        ...state,
        boards: state.boards.map(board => {
          if (board.id !== state.activeBoardId) {
            return board;
          }

          return {
            ...board,
            tasks: board.tasks.filter(task => task.id !== action.payload.taskId)
          };
        })
      };

    case UPDATE_TASK: {
      const { taskId, updates } = action.payload;
      return {
        ...state,
        boards: state.boards.map(board => {
          if (board.id !== state.activeBoardId) return board;

          return {
            ...board,
            tasks: board.tasks.map(task =>
              task.id === taskId
                ? { ...task, ...updates, updatedAt: new Date().toISOString() }
                : task
            )
          };
        })
      };
    }

    case ADD_TASK_COMMENT: {
      const { taskId, text } = action.payload;
      const trimmedText = typeof text === 'string' ? text.trim() : '';
      if (!trimmedText) {
        return state;
      }

      const createdAt = new Date().toISOString();

      return {
        ...state,
        boards: state.boards.map(board => {
          if (board.id !== state.activeBoardId) return board;

          return {
            ...board,
            tasks: board.tasks.map(task =>
              task.id === taskId
                ? {
                    ...task,
                    comments: [
                      ...(Array.isArray(task.comments) ? task.comments : []),
                      {
                        id: Date.now().toString(),
                        text: trimmedText,
                        createdAt
                      }
                    ],
                    updatedAt: createdAt
                  }
                : task
            )
          };
        })
      };
    }

    case MOVE_TASK_TO_COLUMN: {
      const { taskId, columnId } = action.payload;

      return {
        ...state,
        boards: state.boards.map(board => {
          if (board.id !== state.activeBoardId) return board;

          return moveTaskToColumnWithinBoard(board, taskId, columnId);
        })
      };
    }

    case SET_ACTIVE_BOARD:
      return {
        ...state,
        activeBoardId: action.payload.boardId
      };

    case ADD_BOARD:
      // Safety check for boards array - must exist and be valid
      if (!state.boards || !Array.isArray(state.boards) || state.boards.length === 0) {
        console.error('Cannot ADD_BOARD: Invalid boards in state:', state);
        return initialState;
      }

      return {
        ...state,
        boards: [
          ...state.boards,
          {
            id: Date.now().toString(),
            name: action.payload.name,
            columns: normalizeColumns(createColumnsCopy()),
            tasks: []
          }
        ]
      };

    case DELETE_BOARD:
      // Safety check for boards array - must exist and be valid
      if (!state.boards || !Array.isArray(state.boards) || state.boards.length === 0) {
        console.error('Cannot DELETE_BOARD: Invalid boards in state:', state);
        return initialState;
      }

      const remainingBoards = state.boards.filter(board => board.id !== action.payload.boardId);

      if (remainingBoards.length === 0) {
        return initialState;
      }

      return {
        ...state,
        boards: remainingBoards,
        activeBoardId: remainingBoards.some(board => board.id === state.activeBoardId)
          ? state.activeBoardId
          : remainingBoards[0].id
      };

    case RENAME_BOARD: {
      const { boardId, newName } = action.payload;
      return {
        ...state,
        boards: state.boards.map(board =>
          board.id === boardId
            ? { ...board, name: newName }
            : board
        )
      };
    }

    case ADD_COLUMN: {
      return {
        ...state,
        boards: state.boards.map(board => {
          if (board.id !== state.activeBoardId) return board;

          const newColumn = {
            id: Date.now().toString(),
            name: action.payload.name,
            order: Math.max(0, ...board.columns.map(c => c.order)) + 1
          };

          return {
            ...board,
            columns: normalizeColumns([...board.columns, newColumn])
          };
        })
      };
    }

    case DELETE_COLUMN: {
      return {
        ...state,
        boards: state.boards.map(board => {
          if (board.id !== state.activeBoardId) return board;

          return {
            ...board,
            columns: normalizeColumns(board.columns.filter(col => col.id !== action.payload.id)),
            tasks: board.tasks.filter(task => task.columnId !== action.payload.id)
          };
        })
      };
    }

    case RENAME_COLUMN: {
      const { columnId, newName } = action.payload;
      return {
        ...state,
        boards: state.boards.map(board => {
          if (board.id !== state.activeBoardId) return board;

          return {
            ...board,
            columns: normalizeColumns(board.columns.map(col =>
              col.id === columnId
                ? { ...col, name: newName }
                : col
            ))
          };
        })
      };
    }

    case REORDER_COLUMN: {
      const { columnId, direction } = action.payload;
      return {
        ...state,
        boards: state.boards.map(board => {
          if (board.id !== state.activeBoardId) return board;

          const sortedColumns = getSortedColumns(board);
          const currentIndex = sortedColumns.findIndex(c => c.id === columnId);
          if (currentIndex === -1) return board;

          // Calculate new index with boundary protection
          let newIndex = currentIndex;
          if (direction === 'up') {
            newIndex = Math.max(currentIndex - 1, 0);
          } else if (direction === 'down') {
            newIndex = Math.min(currentIndex + 1, sortedColumns.length - 1);
          }

          // If no actual change, return unchanged
          if (newIndex === currentIndex) return board;

          // Swap orders between current and new position
          const newColumns = sortedColumns.map((col, idx) => {
            if (col.id === columnId) {
              return { ...col, order: sortedColumns[newIndex].order };
            }
            if (idx === newIndex) {
              return { ...col, order: sortedColumns[currentIndex].order };
            }
            return col;
          });

          return {
            ...board,
            columns: normalizeColumns(newColumns)
          };
        })
      };
    }

    case 'HYDRATE_STATE':
      return getValidState(action.payload);

    case RESET_APP:
      return initialState;

    default:
      return state;
  }
};

// Helper function to get active board with safety checks
export const getActiveBoard = (state) => {
  // Get valid state first
  const validState = getValidState(state);

  if (!validState || !validState.boards || !Array.isArray(validState.boards)) {
    console.error('Cannot getActiveBoard: Invalid state structure:', state);
    return null;
  }

  const board = validState.boards.find(board => board.id === validState.activeBoardId);
  return board || null;
};
