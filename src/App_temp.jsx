import React, { useReducer, useState, useEffect, useRef } from 'react';
import { initialState, getValidState, kanbanReducer, 
  ADD_TASK, MOVE_TASK, DELETE_TASK, 
  SET_ACTIVE_BOARD, ADD_BOARD, DELETE_BOARD,
  getActiveBoard
} from './state/kanbanState';
import { loadState, saveState } from './storage/kanbanDB';
import './App.css';

function App() {
  // Track if state has been loaded from IndexedDB yet
  const isHydrated = useRef(false);

  /**
   * Initialize reducer with lazy state loading from IndexedDB
   * This ensures IndexedDB is loaded BEFORE useReducer initializes
   */
  const initFunction = async () => {
    console.log('Initializing reducer with IndexedDB state...');
    const loadedState = await loadState();
    
    // Validate loaded state
    if (validateState(loadedState)) {
      console.log('State loaded from IndexedDB:', loadedState);
      isHydrated.current = true;
      return loadedState;
    } else {
      console.log('Loaded state is invalid, using initial state');
      // State is invalid, ensure default board exists
      return initialState;
    }
  };

  // Initialize reducer with loaded state
  const [state, dispatch] = useReducer(kanbanReducer, initialState, initFunction);

  // Sync state with IndexedDB AFTER hydration is complete
  useEffect(() => {
    // Only save if hydration is complete
    if (isHydrated.current) {
      console.log('State changed, saving to IndexedDB...');
      saveState(state).catch(error => {
        console.error('Failed to save state to IndexedDB:', error);
      });
    } else {
      console.log('State changed during hydration, skipping save');
    }
  }, [state]);

  const { boards, activeBoardId } = state;
  
  // Get valid state and active board
  const validState = getValidState(state);
  const activeBoard = getActiveBoard(state);
  
  // Store the current input values for the form
  // This is separate from the tasks array - it's just for the form UI
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    columnId: activeBoard?.columns[0].id
  });

  /**
   * Handle form submission
   * Only creates a task when the form is explicitly submitted
   */
  const addTask = (e) => {
    e.preventDefault();
    
    // Validate: Don't create task if title is empty
    if (!formData.title) return;

    // Dispatch ADD_TASK action with form data
    dispatch({
      type: ADD_TASK,
      payload: {
        title: formData.title,
        description: formData.description,
        columnId: formData.columnId
      }
    });

    // Reset form after successful task creation
    setFormData({
      title: '',
      description: '',
      columnId: activeBoard?.columns[0].id
    });
  };

  /**
   * Handle input changes for form fields
   * Updates local state but does NOT dispatch actions
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Handle select change for column selection
   */
  const handleColumnChange = (e) => {
    setFormData(prev => ({
      ...prev,
      columnId: e.target.value
    }));
  };

  /**
   * Handle board selection change
   */
  const handleBoardChange = (e) => {
    dispatch({
      type: SET_ACTIVE_BOARD,
      payload: {
        boardId: e.target.value
      }
    });
  };

  const moveTask = (taskId, direction) => {
    dispatch({
      type: MOVE_TASK,
      payload: {
        taskId,
        direction
      }
    });
  };

  const deleteTask = (taskId) => {
    dispatch({
      type: DELETE_TASK,
      payload: {
        taskId
      }
    });
  };

  return (
    <div className="app">
      <h1>📝 Kanban Board</h1>
      
      {/* Board Selector */}
      <div className="board-selector">
        <label htmlFor="board-select">Select Board:</label>
        <select 
          id="board-select"
          value={activeBoardId}
          onChange={handleBoardChange}
        >
          {validState?.boards?.map(board => (
            <option key={board.id} value={board.id}>
              {board.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Add Task Form */}
      <form className="add-task-form" onSubmit={addTask}>
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
        >
          {activeBoard?.columns?.map(column => (
            <option key={column.id} value={column.id}>
              {column.name}
            </option>
          ))}
        </select>
        {/* Button triggers form submission (Enter key also works) */}
        <button type="submit">Add Task</button>
      </form>

      {/* Kanban Board */}
      <div className="board">
        {activeBoard?.columns?.map(column => (
          <div key={column.id} className={`column column-${column.id}`}>
            <h2 className={`column-title column-title-${column.id}`}>
              {column.id === 'todo' && '📋 To Do'}
              {column.id === 'inprogress' && '⏳ In Progress'}
              {column.id === 'done' && '✅ Done'}
            </h2>
            
            {activeBoard?.tasks
              ?.filter(task => task.columnId === column.id)
              .map(task => (
                <div key={task.id} className="task-card">
                  <h3>{task.title}</h3>
                  <p className="task-description">{task.description}</p>
                  <div className="task-actions">
                    <button 
                      className="move-btn move-left"
                      onClick={() => moveTask(task.id, 'left')}
                      disabled={column.id === 'todo'}
                    >
                      ←
                    </button>
                    <button 
                      className="move-btn move-right"
                      onClick={() => moveTask(task.id, 'right')}
                      disabled={column.id === 'done'}
                    >
                      →
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => deleteTask(task.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;