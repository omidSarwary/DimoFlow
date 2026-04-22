import React, { useEffect, useReducer, useRef, useState } from 'react';
import {
  initialState,
  getValidState,
  validateState,
  kanbanReducer,
  ADD_TASK,
  ADD_TASK_COMMENT,
  MOVE_TASK,
  MOVE_TASK_TO_COLUMN,
  DELETE_TASK,
  UPDATE_TASK,
  SET_ACTIVE_BOARD,
  ADD_BOARD,
  DELETE_BOARD,
  RENAME_BOARD,
  RESET_APP,
  ADD_COLUMN,
  DELETE_COLUMN,
  RENAME_COLUMN,
  REORDER_COLUMN,
  getActiveBoard,
  getSortedColumns
} from './state/kanbanState';
import { deleteState, loadState, saveState } from './storage/kanbanDB';
import './App.css';

const THEME_STORAGE_KEY = 'dimoflow-theme';

function App() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [state, dispatch] = useReducer(kanbanReducer, initialState);
  const fileInputRef = useRef(null);
  const filterRef = useRef(null);
  const toggleBtnRef = useRef(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures and keep the UI usable.
    }
  }, [theme]);

  useEffect(() => {
    if (!isSidebarOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  useEffect(() => {
    if (!isHydrated) return;

    saveState(state).catch(error => {
      console.error('Failed to save state:', error);
    });
  }, [state, isHydrated]);

  useEffect(() => {
    async function hydrate() {
      const loadedState = await loadState();
      const validState = validateState(loadedState)
        ? loadedState
        : getValidState(loadedState);

      dispatch({ type: 'HYDRATE_STATE', payload: validState });
      setIsHydrated(true);
    }

    hydrate();
  }, []);

  const safeState = getValidState(state);
  const { boards, activeBoardId } = safeState;
  const activeBoard = getActiveBoard(safeState);
  const sortedColumns = getSortedColumns(activeBoard);
  const columnSignature = sortedColumns.map(column => column.id).join('|');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    columnId: activeBoard?.columns?.[0]?.id || '',
    dueDate: '',
    priority: 'medium'
  });

  const [newColumnName, setNewColumnName] = useState('');
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [editingColumnName, setEditingColumnName] = useState('');

  const [taskSearch, setTaskSearch] = useState('');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('all');
  const [taskDueFilter, setTaskDueFilter] = useState('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isFilterBarOpen, setIsFilterBarOpen] = useState(false);

  useEffect(() => {
    if (!isFilterBarOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsFilterBarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFilterBarOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!filterRef.current || !toggleBtnRef.current) return;

      const clickedInsideFilter = filterRef.current.contains(event.target);
      const clickedToggle = toggleBtnRef.current.contains(event.target);

      if (!clickedInsideFilter && !clickedToggle) {
        setIsFilterBarOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [newBoardName, setNewBoardName] = useState('');
  const [editingBoardId, setEditingBoardId] = useState(null);
  const [editingBoardName, setEditingBoardName] = useState('');

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskData, setEditingTaskData] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dragOverColumnId, setDragOverColumnId] = useState(null);

  useEffect(() => {
    if (!activeBoard) return;

    setFormData(prev => {
      const columnExists = sortedColumns.some(column => column.id === prev.columnId);
      if (columnExists) return prev;

      return {
        ...prev,
        columnId: sortedColumns[0]?.id || ''
      };
    });
  }, [activeBoardId, activeBoard, columnSignature, sortedColumns]);

  useEffect(() => {
    if (!editingTaskId) return;

    const taskStillExists = activeBoard?.tasks?.some(task => task.id === editingTaskId);
    if (!taskStillExists) {
      cancelEditTask();
    }
  }, [activeBoardId, activeBoard, editingTaskId]);

  useEffect(() => {
    if (taskStatusFilter === 'all') return;

    const statusStillExists = sortedColumns.some(column => column.id === taskStatusFilter);
    if (!statusStillExists) {
      setTaskStatusFilter('all');
    }
  }, [activeBoardId, sortedColumns, taskStatusFilter]);

  const closeSidebar = () => setIsSidebarOpen(false);
  const openTaskModal = () => setIsTaskModalOpen(true);
  const closeTaskModal = () => setIsTaskModalOpen(false);
  const toggleFilterBar = () => setIsFilterBarOpen(prev => !prev);

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;

    dispatch({
      type: ADD_COLUMN,
      payload: { name: newColumnName.trim() }
    });

    setNewColumnName('');
  };

  const startEditColumn = (column) => {
    setEditingColumnId(column.id);
    setEditingColumnName(column.name);
  };

  const saveColumnName = () => {
    if (!editingColumnId || !editingColumnName.trim()) {
      setEditingColumnId(null);
      return;
    }

    dispatch({
      type: RENAME_COLUMN,
      payload: { columnId: editingColumnId, newName: editingColumnName.trim() }
    });
    setEditingColumnId(null);
    setEditingColumnName('');
  };

  const cancelEditColumn = () => {
    setEditingColumnId(null);
    setEditingColumnName('');
  };

  const reorderColumn = (columnId, direction) => {
    dispatch({
      type: REORDER_COLUMN,
      payload: { columnId, direction }
    });
  };

  const selectBoard = (boardId) => {
    dispatch({
      type: SET_ACTIVE_BOARD,
      payload: { boardId }
    });
    closeSidebar();
  };

  const handleCreateBoard = () => {
    if (!newBoardName.trim()) return;

    dispatch({
      type: ADD_BOARD,
      payload: { name: newBoardName.trim() }
    });

    setNewBoardName('');
  };

  const startEditBoard = (board) => {
    if (!board) return;

    setEditingBoardId(board.id);
    setEditingBoardName(board.name);
  };

  const saveBoardName = () => {
    if (!editingBoardId || !editingBoardName.trim()) {
      setEditingBoardId(null);
      return;
    }

    dispatch({
      type: RENAME_BOARD,
      payload: { boardId: editingBoardId, newName: editingBoardName.trim() }
    });
    setEditingBoardId(null);
    setEditingBoardName('');
  };

  const cancelEditBoard = () => {
    setEditingBoardId(null);
    setEditingBoardName('');
  };

  const handleDeleteBoard = (boardId) => {
    if (boards.length <= 1) {
      alert('Cannot delete the last board');
      return;
    }

    if (window.confirm('Delete this board and all its tasks?')) {
      dispatch({
        type: DELETE_BOARD,
        payload: { boardId }
      });
    }
  };

  const addTask = (e) => {
    e.preventDefault();

    if (!formData.title.trim() || sortedColumns.length === 0) return;

    dispatch({
      type: ADD_TASK,
      payload: {
        title: formData.title.trim(),
        description: formData.description,
        columnId: formData.columnId,
        dueDate: formData.dueDate || null,
        priority: formData.priority
      }
    });

    setFormData({
      title: '',
      description: '',
      columnId: sortedColumns[0]?.id || '',
      dueDate: '',
      priority: 'medium'
    });
    closeTaskModal();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleColumnChange = (e) => {
    setFormData(prev => ({
      ...prev,
      columnId: e.target.value
    }));
  };

  const moveTask = (taskId, direction) => {
    dispatch({
      type: MOVE_TASK,
      payload: { taskId, direction }
    });
  };

  const deleteTask = (taskId) => {
    dispatch({
      type: DELETE_TASK,
      payload: { taskId }
    });
  };

  const startEditTask = (task) => {
    setEditingTaskId(task.id);
    setEditingTaskData({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate || '',
      priority: task.priority || 'medium'
    });
  };

  const saveTaskEdit = () => {
    if (!editingTaskId || !editingTaskData.title.trim()) return;

    dispatch({
      type: UPDATE_TASK,
      payload: {
        taskId: editingTaskId,
        updates: {
          title: editingTaskData.title.trim(),
          description: editingTaskData.description || '',
          dueDate: editingTaskData.dueDate || null,
          priority: editingTaskData.priority || 'medium'
        }
      }
    });

    setEditingTaskId(null);
    setEditingTaskData({});
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditingTaskData({});
  };

  const handleTaskEditChange = (e) => {
    const { name, value } = e.target;
    setEditingTaskData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getTaskDueStatus = (task) => {
    if (!task.dueDate) return 'no-date';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskDate = new Date(task.dueDate);
    if (Number.isNaN(taskDate.getTime())) return 'no-date';
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate.getTime() === today.getTime()) return 'today';
    if (taskDate.getTime() < today.getTime()) return 'overdue';
    return 'upcoming';
  };

  const filteredTasks = (activeBoard?.tasks || []).filter(task => {
    const normalizedTitle = task.title.toLowerCase();
    const searchTerm = taskSearch.trim().toLowerCase();
    const matchesSearch = !searchTerm || normalizedTitle.includes(searchTerm);
    const matchesPriority =
      taskPriorityFilter === 'all' || task.priority === taskPriorityFilter;
    const matchesDueDate =
      taskDueFilter === 'all' || getTaskDueStatus(task) === taskDueFilter;
    const matchesStatus =
      taskStatusFilter === 'all' || task.columnId === taskStatusFilter;

    return matchesSearch && matchesPriority && matchesDueDate && matchesStatus;
  });

  const hasActiveFilters =
    taskSearch.trim() ||
    taskPriorityFilter !== 'all' ||
    taskDueFilter !== 'all' ||
    taskStatusFilter !== 'all';

  const addTaskComment = (taskId) => {
    const text = commentDrafts[taskId] || '';
    if (!text.trim()) return;

    dispatch({
      type: ADD_TASK_COMMENT,
      payload: { taskId, text }
    });

    setCommentDrafts(prev => ({
      ...prev,
      [taskId]: ''
    }));
  };

  const handleCommentDraftChange = (taskId, value) => {
    setCommentDrafts(prev => ({
      ...prev,
      [taskId]: value
    }));
  };

  const exportState = () => {
    const data = JSON.stringify(safeState, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kanban-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importStateFromFile = async (file) => {
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!validateState(parsed)) {
        alert('Imported file is not a valid Kanban backup.');
        return;
      }

      const normalized = getValidState(parsed);
      dispatch({ type: 'HYDRATE_STATE', payload: normalized });
      closeSidebar();
    } catch (error) {
      console.error('Failed to import backup:', error);
      alert('Could not import that file.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleResetApp = async () => {
    const confirmed = window.confirm('Reset the entire app? This will remove all boards, tasks, and comments.');
    if (!confirmed) return;

    await deleteState();
    dispatch({ type: RESET_APP });
    closeSidebar();
  };

  const canCreateTasks = sortedColumns.length > 0;

  return (
    <div className="app-shell">
      {isSidebarOpen && <div className="sidebar-scrim" onClick={closeSidebar} />}

      <header className="topbar">
        <button
          type="button"
          className="icon-button sidebar-toggle"
          onClick={() => setIsSidebarOpen(prev => !prev)}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>

        <div className="topbar-brand">
          <span className="topbar-kicker">DimoFlow</span>
          <div className="topbar-title">{activeBoard?.name || 'No active board'}</div>
        </div>

        <div className="topbar-meta">
          <span>{boards.length} boards</span>
          <span>{sortedColumns.length} columns</span>
        </div>

        <button
          type="button"
          className="topbar-primary-action"
          onClick={openTaskModal}
          disabled={!canCreateTasks}
        >
          Add Task
        </button>

        <button
          type="button"
          ref={toggleBtnRef}
          className={`topbar-filter-action ${isFilterBarOpen ? 'topbar-filter-action-active' : ''}`}
          onClick={toggleFilterBar}
          aria-label="Toggle filters"
          title="Toggle filters"
        >
          🎛
        </button>
      </header>

      <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo">DimoFlow</div>
          <div className="sidebar-tag">Focused workspaces, simplified</div>
        </div>

        <section className="sidebar-section">
          <div className="sidebar-section-title">Boards</div>
          <label className="sidebar-label" htmlFor="board-select">Select board</label>
          <select id="board-select" value={activeBoardId} onChange={(e) => selectBoard(e.target.value)}>
            {safeState?.boards?.map(board => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>
          <div className="sidebar-row">
            <input
              type="text"
              placeholder="New board name"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateBoard();
              }}
            />
            <button type="button" onClick={handleCreateBoard}>Add</button>
          </div>
          {isEditMode && (
            <div className="sidebar-mini-actions">
              {editingBoardId === activeBoardId ? (
                <div className="inline-edit">
                  <input
                    type="text"
                    value={editingBoardName}
                    onChange={(e) => setEditingBoardName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveBoardName();
                      if (e.key === 'Escape') cancelEditBoard();
                    }}
                    autoFocus
                  />
                  <button type="button" onClick={saveBoardName}>Save</button>
                  <button type="button" onClick={cancelEditBoard}>Cancel</button>
                </div>
              ) : (
                <div className="sidebar-row">
                  <button type="button" onClick={() => startEditBoard(activeBoard)}>
                    Rename board
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => handleDeleteBoard(activeBoardId)}
                    disabled={boards.length <= 1}
                  >
                    Delete board
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="sidebar-section">
          <div className="sidebar-section-title">Actions</div>
          <div className="sidebar-row">
            <input
              type="text"
              placeholder="New column name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddColumn();
              }}
            />
            <button type="button" onClick={handleAddColumn}>Add column</button>
          </div>
          <button type="button" className="sidebar-action" onClick={exportState}>Export data</button>
          <button type="button" className="sidebar-action" onClick={handleImportClick}>Import data</button>
          <button type="button" className="sidebar-action danger-button" onClick={handleResetApp}>Reset boards</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden-file-input"
            onChange={(e) => importStateFromFile(e.target.files?.[0])}
          />
        </section>

        <section className="sidebar-section">
          <div className="sidebar-section-title">Settings</div>
          <label className="sidebar-label" htmlFor="theme-select">Theme</label>
          <select id="theme-select" value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="midnight">Midnight</option>
          </select>
          <label className="toggle-row">
            <span>Edit mode</span>
            <input
              type="checkbox"
              checked={isEditMode}
              onChange={(e) => setIsEditMode(e.target.checked)}
            />
          </label>
        </section>
      </aside>

      <main
        className="main-content"
        onClick={() => {
          if (isSidebarOpen) closeSidebar();
        }}
      >
        {isTaskModalOpen && (
          <div className="modal-backdrop" onClick={closeTaskModal}>
            <div className="task-modal" onClick={(e) => e.stopPropagation()}>
              <div className="panel-header">
                <div>
                  <div className="section-kicker">Create</div>
                  <h2>Add Task</h2>
                </div>
                <button type="button" className="ghost-button" onClick={closeTaskModal}>
                  Close
                </button>
              </div>

              <form className="modal-task-form" onSubmit={addTask}>
                <input
                  type="text"
                  name="title"
                  placeholder="Task title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="text"
                  name="description"
                  placeholder="Description (optional)"
                  value={formData.description}
                  onChange={handleInputChange}
                />
                <select
                  name="columnId"
                  value={formData.columnId}
                  onChange={handleColumnChange}
                  disabled={!canCreateTasks}
                >
                  {canCreateTasks ? (
                    sortedColumns.map(column => (
                      <option key={column.id} value={column.id}>
                        {column.name}
                      </option>
                    ))
                  ) : (
                    <option value="">Create a column first</option>
                  )}
                </select>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  title="Due date"
                />
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  title="Priority"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <div className="modal-actions">
                  <button type="button" className="ghost-button" onClick={closeTaskModal}>Cancel</button>
                  <button type="submit" disabled={!canCreateTasks}>Add Task</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <section
          ref={filterRef}
          className={`filter-panel ${isFilterBarOpen ? 'filter-panel-open' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="compact-filter-bar">
            <input
              id="task-search"
              type="text"
              placeholder="Search tasks..."
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
            />
            <select
              id="priority-filter"
              value={taskPriorityFilter}
              onChange={(e) => setTaskPriorityFilter(e.target.value)}
            >
              <option value="all">Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select
              id="due-filter"
              value={taskDueFilter}
              onChange={(e) => setTaskDueFilter(e.target.value)}
            >
              <option value="all">Due date</option>
              <option value="today">Today</option>
              <option value="overdue">Overdue</option>
              <option value="upcoming">Upcoming</option>
              <option value="no-date">No due date</option>
            </select>
            <select
              id="status-filter"
              value={taskStatusFilter}
              onChange={(e) => setTaskStatusFilter(e.target.value)}
            >
              <option value="all">Status</option>
              {sortedColumns.map(column => {
                const columnTaskCount = (activeBoard?.tasks || []).filter(task => task.columnId === column.id).length;
                return (
                  <option key={column.id} value={column.id}>
                    {column.name} ({columnTaskCount})
                  </option>
                );
              })}
            </select>
            {hasActiveFilters && (
              <button
                type="button"
                className="filter-clear-icon"
                onClick={() => {
                  setTaskSearch('');
                  setTaskPriorityFilter('all');
                  setTaskDueFilter('all');
                  setTaskStatusFilter('all');
                }}
                aria-label="Clear filters"
                title="Clear filters"
              >
                ✕
              </button>
            )}
          </div>
        </section>

        <section className="board-area">
          {sortedColumns.length === 0 ? (
            <div className="empty-board-state">
              <h3>No columns yet</h3>
              <p>Add a column from the sidebar to start organizing work.</p>
            </div>
          ) : (
            <div className="board">
              {sortedColumns.map((column, index) => {
                const columnTasks = filteredTasks.filter(task => task.columnId === column.id);
                return (
                  <div
                    key={column.id}
                    className={`column column-${column.id} ${dragOverColumnId === column.id ? 'column-drop-target' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverColumnId !== column.id) setDragOverColumnId(column.id);
                    }}
                    onDragLeave={() => {
                      if (dragOverColumnId === column.id) setDragOverColumnId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!draggingTaskId) return;

                      dispatch({
                        type: MOVE_TASK_TO_COLUMN,
                        payload: {
                          taskId: draggingTaskId,
                          columnId: column.id
                        }
                      });

                      setDraggingTaskId(null);
                      setDragOverColumnId(null);
                    }}
                  >
                    <div className="column-header">
                      <div className="column-title-wrap">
                        {isEditMode && editingColumnId === column.id ? (
                          <span className="column-edit">
                            <input
                              type="text"
                              value={editingColumnName}
                              onChange={(e) => setEditingColumnName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveColumnName();
                                if (e.key === 'Escape') cancelEditColumn();
                              }}
                              autoFocus
                            />
                            <button type="button" onClick={saveColumnName}>Save</button>
                            <button type="button" onClick={cancelEditColumn}>Cancel</button>
                          </span>
                        ) : (
                          <h3 className="column-title">{column.name}</h3>
                        )}
                      </div>

                      {isEditMode && (
                        <div className="column-actions">
                          <button type="button" onClick={() => startEditColumn(column)} title="Rename">
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => reorderColumn(column.id, 'up')}
                            disabled={index === 0}
                            title="Move up"
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            onClick={() => reorderColumn(column.id, 'down')}
                            disabled={index === sortedColumns.length - 1}
                            title="Move down"
                          >
                            Down
                          </button>
                          <button
                            type="button"
                            className="danger-button"
                            onClick={() => dispatch({ type: DELETE_COLUMN, payload: { id: column.id } })}
                            title="Delete"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    {columnTasks.length === 0 ? (
                      <div className="empty-column-state">
                        <p>No tasks yet</p>
                      </div>
                    ) : (
                      columnTasks.map(task => (
                        <div
                          key={task.id}
                          className={`task-card priority-${task.priority} ${editingTaskId === task.id ? 'task-card-editing' : ''} ${draggingTaskId === task.id ? 'task-card-dragging' : ''}`}
                          draggable={editingTaskId !== task.id}
                          onDragStart={() => setDraggingTaskId(task.id)}
                          onDragEnd={() => {
                            setDraggingTaskId(null);
                            setDragOverColumnId(null);
                          }}
                        >
                          {editingTaskId === task.id ? (
                            <div className="task-edit-form">
                              <label className="task-edit-field">
                                <span>Title</span>
                                <input
                                  type="text"
                                  name="title"
                                  value={editingTaskData.title || ''}
                                  onChange={handleTaskEditChange}
                                />
                              </label>
                              <label className="task-edit-field">
                                <span>Description</span>
                                <textarea
                                  name="description"
                                  rows="3"
                                  value={editingTaskData.description || ''}
                                  onChange={handleTaskEditChange}
                                />
                              </label>
                              <label className="task-edit-field">
                                <span>Due Date</span>
                                <input
                                  type="date"
                                  name="dueDate"
                                  value={editingTaskData.dueDate || ''}
                                  onChange={handleTaskEditChange}
                                />
                              </label>
                              <label className="task-edit-field">
                                <span>Priority</span>
                                <select
                                  name="priority"
                                  value={editingTaskData.priority || 'medium'}
                                  onChange={handleTaskEditChange}
                                >
                                  <option value="low">Low</option>
                                  <option value="medium">Medium</option>
                                  <option value="high">High</option>
                                </select>
                              </label>
                              <div className="task-edit-actions">
                                <button type="button" className="edit-save-btn" onClick={saveTaskEdit}>Save</button>
                                <button type="button" className="edit-cancel-btn" onClick={cancelEditTask}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="task-card-head">
                                <h4>{task.title}</h4>
                                {isEditMode && (
                                  <button
                                    type="button"
                                    className="edit-btn"
                                    onClick={() => startEditTask(task)}
                                    title="Edit task"
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>

                              {task.description && <p className="task-description">{task.description}</p>}

                              <div className="task-meta">
                                {task.priority && (
                                  <span className={`priority-badge priority-${task.priority}`}>
                                    {task.priority}
                                  </span>
                                )}
                                {task.dueDate && (
                                  <span className="due-date" title={`Due: ${task.dueDate}`}>
                                    Due {task.dueDate}
                                  </span>
                                )}
                                {task.createdAt && (
                                  <span
                                    className="created-date"
                                    title={`Created: ${new Date(task.createdAt).toLocaleString()}`}
                                  >
                                    Created {new Date(task.createdAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>

                              <div className="task-comments">
                                <div className="task-comments-list">
                                  {(Array.isArray(task.comments) ? task.comments : []).map(comment => (
                                    <div key={comment.id} className="task-comment">
                                      <div className="task-comment-text">{comment.text}</div>
                                      <div className="task-comment-meta">
                                        {new Date(comment.createdAt).toLocaleString()}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="task-comment-form">
                                  <input
                                    type="text"
                                    value={commentDrafts[task.id] || ''}
                                    onChange={(e) => handleCommentDraftChange(task.id, e.target.value)}
                                    placeholder="Add a comment"
                                  />
                                  <button type="button" onClick={() => addTaskComment(task.id)}>
                                    Comment
                                  </button>
                                </div>
                              </div>

                              <div className="task-actions">
                                <button
                                  type="button"
                                  className="move-btn move-left"
                                  onClick={() => moveTask(task.id, 'previous')}
                                  disabled={index === 0}
                                  title="Move to previous column"
                                >
                                  &lt;
                                </button>
                                <button
                                  type="button"
                                  className="move-btn move-right"
                                  onClick={() => moveTask(task.id, 'next')}
                                  disabled={index === sortedColumns.length - 1}
                                  title="Move to next column"
                                >
                                  &gt;
                                </button>
                                {isEditMode && (
                                  <button
                                    type="button"
                                    className="delete-btn"
                                    onClick={() => deleteTask(task.id)}
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
