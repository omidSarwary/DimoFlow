/**
 * IndexedDB utility for persisting Kanban app state
 * 
 * This module handles all IndexedDB operations for the application.
 * It uses a single store with one record to store the entire application state.
 */

// Database name and store configuration
const DB_NAME = 'kanban-db';
const STORE_NAME = 'app-state';
const STORE_KEY = 'root';

/**
 * Initialize the IndexedDB database
 * Creates the database and store if they don't exist
 */
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create the store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
        console.log('Created object store:', STORE_NAME);
      }
    };
  });
};

/**
 * Save the entire application state to IndexedDB
 * @param {Object} state - The complete application state to persist
 */
const saveState = async (state) => {
  console.log("SAVE STATE CALLED:", state);
  try {
    const db = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(state, STORE_KEY);

      request.onsuccess = () => {
        console.log('State saved successfully to IndexedDB');
        resolve();
      };

      request.onerror = (event) => {
        console.error('Error saving state:', event.target.error);
        reject(new Error('Failed to save state to IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Failed to save state:', error);
    // Return false to indicate failure
    return false;
  }
};

/**
 * Load the application state from IndexedDB
 * @returns {Promise<Object>} - The stored state or null if not found
 */
const loadState = async () => {
  console.log("LOAD STATE CALLED");
  try {
    const db = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(STORE_KEY);

      request.onsuccess = (event) => {
        const result = event.target.result;
        console.log('State loaded from IndexedDB:', result ? 'Success' : 'Not found');
        console.log("LOADED STATE FROM DB:", result);
        resolve(result);
      };

      request.onerror = (event) => {
        console.error('Error loading state:', event.target.error);
        reject(new Error('Failed to load state from IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Failed to load state:', error);
    // Return null to indicate failure
    return null;
  }
};

/**
 * Delete the stored state (useful for reset functionality)
 * @returns {Promise<boolean>} - Success status
 */
const deleteState = async () => {
  try {
    const db = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(STORE_KEY);

      request.onsuccess = () => {
        console.log('State deleted successfully');
        resolve(true);
      };

      request.onerror = (event) => {
        console.error('Error deleting state:', event.target.error);
        reject(new Error('Failed to delete state'));
      };
    });
  } catch (error) {
    console.error('Failed to delete state:', error);
    return false;
  }
};

export { initDB, saveState, loadState, deleteState };
