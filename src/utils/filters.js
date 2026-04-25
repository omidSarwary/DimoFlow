/**
 * Centralized filter utilities for DimoFlow
 * Single source of truth for all filtering logic
 */

/**
 * Get task due date status (today, overdue, upcoming, or no-date)
 * @param {Object} task - Task object with dueDate property
 * @returns {string} - Status: 'today', 'overdue', 'upcoming', or 'no-date'
 */
export function getTaskDueStatus(task) {
    if (!task.dueDate) return 'no-date';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskDate = new Date(task.dueDate);
    if (Number.isNaN(taskDate.getTime())) return 'no-date';
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate.getTime() === today.getTime()) return 'today';
    if (taskDate.getTime() < today.getTime()) return 'overdue';
    return 'upcoming';
}

/**
 * Check if a task matches search term
 * @param {Object} task - Task object
 * @param {string} searchTerm - Search term to match
 * @returns {boolean}
 */
function matchesSearch(task, searchTerm) {
    if (!searchTerm.trim()) return true;
    const normalizedTitle = task.title.toLowerCase();
    return normalizedTitle.includes(searchTerm.trim().toLowerCase());
}

/**
 * Check if a task matches priority filter
 * @param {Object} task - Task object
 * @param {string} priorityFilter - Priority filter value
 * @returns {boolean}
 */
function matchesPriority(task, priorityFilter) {
    return priorityFilter === 'all' || task.priority === priorityFilter;
}

/**
 * Check if a task matches due date filter
 * @param {Object} task - Task object
 * @param {string} dueFilter - Due date filter value
 * @returns {boolean}
 */
function matchesDueDate(task, dueFilter) {
    return dueFilter === 'all' || getTaskDueStatus(task) === dueFilter;
}

/**
 * Check if a task matches status (column) filter
 * @param {Object} task - Task object
 * @param {string} statusFilter - Column ID to filter by
 * @returns {boolean}
 */
function matchesStatus(task, statusFilter) {
    return statusFilter === 'all' || task.columnId === statusFilter;
}

/**
 * Main filter function - centralized single source of truth
 * @param {Array} tasks - Array of task objects
 * @param {Object} filters - Filter configuration object
 * @param {string} filters.search - Search term
 * @param {string} filters.priority - Priority filter ('all', 'low', 'medium', 'high')
 * @param {string} filters.dueDate - Due date filter ('all', 'today', 'overdue', 'upcoming', 'no-date')
 * @param {string} filters.statusColumnId - Column ID filter ('all' or columnId)
 * @returns {Array} - Filtered tasks array
 */
export function getVisibleTasks(tasks, filters) {
    if (!Array.isArray(tasks)) return [];

    return tasks.filter(task => {
        return (
            matchesSearch(task, filters.search || '') &&
            matchesPriority(task, filters.priority || 'all') &&
            matchesDueDate(task, filters.dueDate || 'all') &&
            matchesStatus(task, filters.statusColumnId || 'all')
        );
    });
}

/**
 * Check if any active filters are applied
 * @param {Object} filters - Filter configuration object
 * @returns {boolean}
 */
export function hasActiveFilters(filters) {
    return (
        (filters.search || '').trim() !== '' ||
        (filters.priority || 'all') !== 'all' ||
        (filters.dueDate || 'all') !== 'all' ||
        (filters.statusColumnId || 'all') !== 'all'
    );
}

/**
 * Create default filter state
 * @returns {Object} - Default filter configuration
 */
export function createDefaultFilters() {
    return {
        search: '',
        priority: 'all',
        dueDate: 'all',
        statusColumnId: 'all'
    };
}

/**
 * Get archived tasks from a board
 * @param {Array} tasks - Array of task objects
 * @returns {Array} - Filtered array of archived tasks
 */
export function getArchivedTasks(tasks) {
    if (!Array.isArray(tasks)) return [];
    return tasks.filter(task => task.archived === true).sort((a, b) => {
        // Sort by archivedAt descending (most recent first)
        if (!a.archivedAt || !b.archivedAt) return 0;
        return new Date(b.archivedAt) - new Date(a.archivedAt);
    });
}

/**
 * Get active (non-archived) tasks from a board
 * @param {Array} tasks - Array of task objects
 * @returns {Array} - Filtered array of active tasks
 */
export function getActiveTasks(tasks) {
    if (!Array.isArray(tasks)) return [];
    return tasks.filter(task => task.archived !== true);
}
