//src / state / kanbanState.js
// Central state structure for Kanban app with multi-board support

// Define the default columns for all boards
export const defaultColumns = [
  { id: 'todo', name: 'To Do', order: 0 },
  { id: 'inprogress', name: 'In Progress', order: 1 },
  { id: 'done', name: 'Done', order: 2 }
];

const createColumnsCopy = () => defaultColumns.map(column => ({ ...column }));
const ALLOWED_PRIORITIES = ['low', 'medium', 'high'];
export const APP_STATE_VERSION = 1;

const createSafeId = (prefix = 'id') => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const isValidIsoDate = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
};

// Create initial board structure
export const createInitialBoard = (id, name) => ({
  id,
  name,
  columns: createColumnsCopy(),
  tasks: []
});

// Initial state with multi-board structure
export const initialState = {
  version: APP_STATE_VERSION,
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
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    return false;
  }

  if (!Array.isArray(state.boards) || state.boards.length === 0) {
    return false;
  }

  if (typeof state.activeBoardId !== 'string' || !state.activeBoardId.trim()) {
    return false;
  }

  for (const board of state.boards) {
    if (!board || typeof board !== 'object' || Array.isArray(board)) {
      return false;
    }

    if (typeof board.id !== 'string' || !board.id.trim()) {
      return false;
    }

    if (typeof board.name !== 'string' || !board.name.trim()) {
      return false;
    }

    if (!Array.isArray(board.columns) || !Array.isArray(board.tasks)) {
      return false;
    }

    for (const column of board.columns) {
      if (!column || typeof column !== 'object' || Array.isArray(column)) {
        return false;
      }

      if (typeof column.id !== 'string' || !column.id.trim()) {
        return false;
      }

      if (typeof column.name !== 'string' || !column.name.trim()) {
        return false;
      }
    }

    for (const task of board.tasks) {
      if (!task || typeof task !== 'object' || Array.isArray(task)) {
        return false;
      }

      if (typeof task.id !== 'string' || !task.id.trim()) {
        return false;
      }

      if (typeof task.title !== 'string') {
        return false;
      }

      if (typeof task.description !== 'string') {
        return false;
      }

      if (typeof task.columnId !== 'string' || !task.columnId.trim()) {
        return false;
      }

      if (task.priority != null && !ALLOWED_PRIORITIES.includes(task.priority)) {
        return false;
      }

      if (task.dueDate != null && task.dueDate !== '' && !isValidIsoDate(task.dueDate)) {
        return false;
      }

      if (task.comments != null) {
        if (!Array.isArray(task.comments)) {
          return false;
        }

        for (const comment of task.comments) {
          if (!comment || typeof comment !== 'object' || Array.isArray(comment)) {
            return false;
          }

          if (typeof comment.id !== 'string' || !comment.id.trim()) {
            return false;
          }

          if (typeof comment.text !== 'string') {
            return false;
          }

          if (typeof comment.createdAt !== 'string' || !comment.createdAt.trim()) {
            return false;
          }
        }
      }
    }
  }

  return true;
};

export const normalizeComment = (comment) => {
  if (!comment || typeof comment !== 'object' || Array.isArray(comment)) {
    return null;
  }

  const text = typeof comment.text === 'string' ? comment.text.trim() : '';
  if (!text) {
    return null;
  }

  const createdAt = isValidIsoDate(comment.createdAt) ? comment.createdAt : new Date().toISOString();

  return {
    id: typeof comment.id === 'string' && comment.id.trim() ? comment.id : createSafeId('comment'),
    text,
    createdAt
  };
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

export const normalizeColumn = (column) => {
  if (!column || typeof column !== 'object' || Array.isArray(column)) {
    return null;
  }

  return {
    id: typeof column.id === 'string' && column.id.trim() ? column.id : createSafeId('column'),
    name: typeof column.name === 'string' && column.name.trim() ? column.name.trim() : 'Untitled',
    order: Number.isFinite(column.order) ? column.order : 0
  };
};

export const normalizeTask = (task) => {
  if (!task || typeof task !== 'object' || Array.isArray(task)) {
    return null;
  }

  const comments = Array.isArray(task.comments)
    ? task.comments.map(normalizeComment).filter(Boolean)
    : [];

  return {
    id: typeof task.id === 'string' && task.id.trim() ? task.id : createSafeId('task'),
    title: typeof task.title === 'string' ? task.title : '',
    description: typeof task.description === 'string' ? task.description : '',
    columnId: typeof task.columnId === 'string' && task.columnId.trim() ? task.columnId : 'todo',
    priority: ALLOWED_PRIORITIES.includes(task.priority) ? task.priority : 'low',
    dueDate: isValidIsoDate(task.dueDate) ? task.dueDate : null,
    comments,
    createdAt: isValidIsoDate(task.createdAt) ? task.createdAt : new Date().toISOString(),
    updatedAt: isValidIsoDate(task.updatedAt) ? task.updatedAt : new Date().toISOString()
  };
};

export const normalizeBoard = (board) => {
  if (!board || typeof board !== 'object' || Array.isArray(board)) {
    return null;
  }

  const normalizedColumns = normalizeColumns(
    Array.isArray(board.columns) ? board.columns.map(normalizeColumn).filter(Boolean) : []
  );
  const validColumnIds = normalizedColumns.map(column => column.id);
  const fallbackColumnId = validColumnIds[0] || defaultColumns[0].id;
  const normalizedTasks = Array.isArray(board.tasks)
    ? board.tasks.map(normalizeTask).filter(Boolean).map(task => ({
        ...task,
        columnId: validColumnIds.includes(task.columnId) ? task.columnId : fallbackColumnId
      }))
    : [];

  return {
    id: typeof board.id === 'string' && board.id.trim() ? board.id : createSafeId('board'),
    name: typeof board.name === 'string' && board.name.trim() ? board.name.trim() : 'Untitled Board',
    columns: normalizedColumns.length > 0 ? normalizedColumns : createColumnsCopy(),
    tasks: normalizedTasks
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
  const validBoards = state.boards
    .map(normalizeBoard)
    .filter(Boolean);
  if (validBoards.length === 0) {
    return initialState;
  }
  return {
    version: Number.isFinite(state.version) ? state.version : APP_STATE_VERSION,
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
