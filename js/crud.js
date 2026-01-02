// ===================================================================
// FILE: js/crud.js
// PURPOSE: Task CRUD operations with comprehensive error handling
// DEPENDENCIES: GlobalErrorHandler (optional), storage operations, DOM manipulation
// ===================================================================

// ===================================================================
// PART 1: Defensive Wrappers for Dependencies
// ===================================================================

/**
 * Safe wrapper for GlobalErrorHandler.handle()
 * Falls back to console logging if GlobalErrorHandler unavailable
 */
function safeHandleError(error, options = {}) {
    try {
        if (typeof GlobalErrorHandler !== 'undefined' && GlobalErrorHandler && typeof GlobalErrorHandler.handle === 'function') {
            GlobalErrorHandler.handle(error, options);
        } else {
            // Fallback: log to console if GlobalErrorHandler not available
            console.error(`[CRUD ERROR] ${options.context || 'Unknown'}:`, error);
            if (options.userMessage && !options.silent) {
                console.warn(`[CRUD USER MESSAGE] ${options.userMessage}`);
            }
            if (options.metadata) {
                console.info('[CRUD METADATA]', options.metadata);
            }
        }
    } catch (handlerError) {
        // Ultimate fallback: basic console error
        console.error('[CRUD] Error handler failed:', handlerError);
        console.error('[CRUD] Original error:', error);
    }
}

/**
 * Safe wrapper for logActivity()
 * Prevents crashes if activity.js not loaded
 */
function safeLogActivity(activityType, task, originalTask = null) {
    try {
        if (typeof logActivity === 'function') {
            logActivity(activityType, task, originalTask);
        } else {
            console.warn('[CRUD] logActivity function not available, skipping activity log');
        }
    } catch (error) {
        console.warn('[CRUD] Failed to log activity:', error.message);
        // Don't propagate - activity logging should never break CRUD operations
    }
}

/**
 * Check if localStorage is available and functional
 * @returns {boolean} True if localStorage can be used
 */
function isLocalStorageAvailable() {
    try {
        const testKey = '__crud_storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
}

// ===================================================================
// PART 2: Core CRUD Functions with Enhanced Error Protection
// ===================================================================

/**
 * Load tasks from storage with comprehensive error handling
 * @returns {Array} Array of task objects or empty array on failure
 */
function loadTasks() {
    try {
        // Check localStorage availability
        if (!isLocalStorageAvailable()) {
            throw new Error('localStorage is not available (may be disabled in private browsing mode)');
        }

        const tasksJSON = localStorage.getItem('tasks');
        
        if (!tasksJSON) {
            console.log('[CRUD] No tasks found in storage, returning empty array');
            return [];
        }

        const tasks = JSON.parse(tasksJSON);
        
        // Validate parsed data
        if (!Array.isArray(tasks)) {
            throw new Error('Invalid tasks data structure: expected array, got ' + typeof tasks);
        }

        console.log(`[CRUD] Successfully loaded ${tasks.length} tasks`);
        return tasks;

    } catch (error) {
        const isStorageIssue = error.message.includes('localStorage') || 
                               error.name === 'QuotaExceededError' ||
                               error.name === 'SecurityError';

        safeHandleError(error, {
            context: 'loadTasks',
            userMessage: isStorageIssue 
                ? 'Unable to access browser storage. Please check your privacy settings or try a different browser.'
                : 'Unable to load your tasks. Starting with a fresh task list.',
            severity: 'medium',
            silent: false,
            metadata: {
                errorType: error.name,
                storageAvailable: isLocalStorageAvailable(),
                isStorageIssue: isStorageIssue
            }
        });
        
        // Return empty array as safe fallback
        return [];
    }
}

/**
 * Save tasks to storage with error handling and validation
 * @param {Array} tasks - Array of task objects to save
 * @returns {boolean} True if save successful, false otherwise
 */
function saveTasks(tasks) {
    try {
        // Validate input
        if (!Array.isArray(tasks)) {
            throw new Error('saveTasks: Invalid input - tasks must be an array, got ' + typeof tasks);
        }

        // Check localStorage availability
        if (!isLocalStorageAvailable()) {
            throw new Error('localStorage is not available (may be disabled in private browsing mode)');
        }

        // Validate each task object
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            if (!task || typeof task !== 'object') {
                console.warn(`[CRUD] Task at index ${i} is not a valid object:`, task);
            } else if (!task.id || !task.text || !task.category) {
                console.warn(`[CRUD] Task at index ${i} missing required fields:`, task);
            }
        }

        const tasksJSON = JSON.stringify(tasks);
        
        // Check if data size is reasonable (localStorage typically 5-10MB limit)
        const dataSize = new Blob([tasksJSON]).size;
        if (dataSize > 4000000) { // Warn at 4MB
            console.warn(`[CRUD] Task data size is large (${Math.round(dataSize / 1024)}KB), approaching storage limits`);
        }

        localStorage.setItem('tasks', tasksJSON);
        
        console.log(`[CRUD] Successfully saved ${tasks.length} tasks to storage (${Math.round(dataSize / 1024)}KB)`);
        return true;

    } catch (error) {
        const isQuotaError = error.name === 'QuotaExceededError';
        const isStorageIssue = error.message.includes('localStorage') || 
                               error.name === 'SecurityError' ||
                               isQuotaError;

        let userMessage = 'Unable to save your tasks. Your changes may not be preserved.';
        if (isQuotaError) {
            userMessage = 'Storage quota exceeded. Please delete some completed tasks or export your data.';
        } else if (isStorageIssue) {
            userMessage = 'Unable to access browser storage. Your changes cannot be saved. Check privacy settings.';
        }

        safeHandleError(error, {
            context: 'saveTasks',
            userMessage: userMessage,
            severity: 'high',
            silent: false,
            metadata: {
                taskCount: Array.isArray(tasks) ? tasks.length : 'invalid',
                storageAvailable: isLocalStorageAvailable(),
                errorType: error.name,
                isQuotaError: isQuotaError
            }
        });
        
        return false;
    }
}

/**
 * Add a new task with comprehensive validation and error handling
 * @param {string} text - Task description
 * @param {string} category - Task category
 * @param {string} priority - Task priority level
 * @param {string|null} dueDate - Optional due date
 * @returns {Object|null} Created task object or null on failure
 */
function addTask(text, category, priority, dueDate = null) {
    try {
        // Input validation
        if (!text || typeof text !== 'string') {
            throw new Error('Task text is required and must be a string');
        }

        if (!category || typeof category !== 'string') {
            throw new Error('Task category is required and must be a string');
        }

        if (!priority || typeof priority !== 'string') {
            throw new Error('Task priority is required and must be a string');
        }

        const trimmedText = text.trim();
        if (trimmedText.length === 0) {
            throw new Error('Task text cannot be empty');
        }

        if (trimmedText.length > 500) {
            throw new Error('Task text too long (maximum 500 characters)');
        }

        // Validate category
        const validCategories = ['work', 'personal', 'shopping', 'health', 'other'];
        if (!validCategories.includes(category)) {
            console.warn(`[CRUD] Invalid category "${category}", defaulting to "other"`);
            category = 'other';
        }

        // Validate priority
        const validPriorities = ['low', 'medium', 'high'];
        if (!validPriorities.includes(priority)) {
            console.warn(`[CRUD] Invalid priority "${priority}", defaulting to "medium"`);
            priority = 'medium';
        }

        // Load existing tasks
        const tasks = loadTasks();

        // Create new task object
        const newTask = {
            id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
            text: trimmedText,
            category: category,
            priority: priority,
            completed: false,
            dueDate: dueDate,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Add to tasks array
        tasks.push(newTask);

        // Save to storage
        const saveSuccess = saveTasks(tasks);
        if (!saveSuccess) {
            throw new Error('Failed to save task to storage');
        }

        console.log('[CRUD] Task added successfully:', newTask.id);
        
        // Log activity with error protection
        safeLogActivity('add', newTask);

        return newTask;

    } catch (error) {
        safeHandleError(error, {
            context: 'addTask',
            userMessage: 'Unable to add task. ' + (error.message.includes('storage') 
                ? 'Storage is unavailable.' 
                : 'Please check your input and try again.'),
            severity: 'medium',
            silent: false,
            metadata: {
                textLength: text ? text.length : 0,
                category: category,
                priority: priority,
                storageAvailable: isLocalStorageAvailable()
            }
        });
        
        return null;
    }
}

/**
 * Update an existing task with validation and error handling
 * @param {string} taskId - ID of task to update
 * @param {Object} updates - Object containing fields to update
 * @returns {Object|null} Updated task object or null on failure
 */
function updateTask(taskId, updates) {
    try {
        // Validate inputs
        if (!taskId || typeof taskId !== 'string') {
            throw new Error('Valid task ID is required');
        }

        if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
            throw new Error('Updates must be a valid object');
        }

        if (Object.keys(updates).length === 0) {
            throw new Error('Updates object cannot be empty');
        }

        // Check localStorage availability
        if (!isLocalStorageAvailable()) {
            throw new Error('localStorage is not available');
        }

        // Load existing tasks
        const tasks = loadTasks();
        
        // Find task to update
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            throw new Error(`Task not found: ${taskId}`);
        }

        const originalTask = { ...tasks[taskIndex] };

        // Validate and apply updates
        if (updates.text !== undefined) {
            if (typeof updates.text !== 'string') {
                throw new Error('Task text must be a string');
            }
            const trimmedText = updates.text.trim();
            if (trimmedText.length === 0) {
                throw new Error('Task text cannot be empty');
            }
            if (trimmedText.length > 500) {
                throw new Error('Task text too long (maximum 500 characters)');
            }
            tasks[taskIndex].text = trimmedText;
        }

        if (updates.category !== undefined) {
            const validCategories = ['work', 'personal', 'shopping', 'health', 'other'];
            if (!validCategories.includes(updates.category)) {
                console.warn(`[CRUD] Invalid category "${updates.category}", keeping original`);
            } else {
                tasks[taskIndex].category = updates.category;
            }
        }

        if (updates.priority !== undefined) {
            const validPriorities = ['low', 'medium', 'high'];
            if (!validPriorities.includes(updates.priority)) {
                console.warn(`[CRUD] Invalid priority "${updates.priority}", keeping original`);
            } else {
                tasks[taskIndex].priority = updates.priority;
            }
        }

        if (updates.completed !== undefined) {
            if (typeof updates.completed !== 'boolean') {
                throw new Error('Completed status must be a boolean');
            }
            tasks[taskIndex].completed = updates.completed;
        }

        if (updates.dueDate !== undefined) {
            tasks[taskIndex].dueDate = updates.dueDate;
        }

        // Update timestamp
        tasks[taskIndex].updatedAt = new Date().toISOString();

        // Save to storage
        const saveSuccess = saveTasks(tasks);
        if (!saveSuccess) {
            throw new Error('Failed to save updated task to storage');
        }

        console.log('[CRUD] Task updated successfully:', taskId);

        // Log activity with error protection
        safeLogActivity('update', tasks[taskIndex], originalTask);

        return tasks[taskIndex];

    } catch (error) {
        safeHandleError(error, {
            context: 'updateTask',
            userMessage: 'Unable to update task. ' + (error.message.includes('not found') 
                ? 'Task no longer exists.' 
                : error.message.includes('storage') 
                    ? 'Storage is unavailable.' 
                    : 'Please try again.'),
            severity: 'medium',
            silent: false,
            metadata: {
                taskId: taskId,
                updateFields: updates ? Object.keys(updates) : [],
                storageAvailable: isLocalStorageAvailable()
            }
        });
        
        return null;
    }
}

/**
 * Delete a task with error handling and cleanup
 * @param {string} taskId - ID of task to delete
 * @returns {boolean} True if deletion successful, false otherwise
 */
function deleteTask(taskId) {
    try {
        // Validate input
        if (!taskId || typeof taskId !== 'string') {
            throw new Error('Valid task ID is required');
        }

        // Check localStorage availability
        if (!isLocalStorageAvailable()) {
            throw new Error('localStorage is not available');
        }

        // Load existing tasks
        const tasks = loadTasks();
        
        // Find task to delete
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            throw new Error(`Task not found: ${taskId}`);
        }

        // Store task for activity logging
        const deletedTask = { ...tasks[taskIndex] };

        // Remove task from array
        tasks.splice(taskIndex, 1);

        // Save to storage
        const saveSuccess = saveTasks(tasks);
        if (!saveSuccess) {
            throw new Error('Failed to save after task deletion');
        }

        console.log('[CRUD] Task deleted successfully:', taskId);

        // Log activity with error protection
        safeLogActivity('delete', deletedTask);

        return true;

    } catch (error) {
        safeHandleError(error, {
            context: 'deleteTask',
            userMessage: 'Unable to delete task. ' + (error.message.includes('not found') 
                ? 'Task no longer exists.' 
                : error.message.includes('storage') 
                    ? 'Storage is unavailable.' 
                    : 'Please try again.'),
            severity: 'medium',
            silent: false,
            metadata: {
                taskId: taskId,
                storageAvailable: isLocalStorageAvailable()
            }
        });
        
        return false;
    }
}

/**
 * Toggle task completion status with error handling
 * @param {string} taskId - ID of task to toggle
 * @returns {Object|null} Updated task object or null on failure
 */
function toggleTaskComplete(taskId) {
    try {
        // Validate input
        if (!taskId || typeof taskId !== 'string') {
            throw new Error('Valid task ID is required');
        }

        // Check localStorage availability
        if (!isLocalStorageAvailable()) {
            throw new Error('localStorage is not available');
        }

        // Load existing tasks
        const tasks = loadTasks();
        
        // Find task
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            throw new Error(`Task not found: ${taskId}`);
        }

        // Store original state
        const originalCompleted = tasks[taskIndex].completed;

        // Toggle completion status
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        tasks[taskIndex].updatedAt = new Date().toISOString();

        // Save to storage
        const saveSuccess = saveTasks(tasks);
        if (!saveSuccess) {
            throw new Error('Failed to save task completion status');
        }

        console.log('[CRUD] Task completion toggled:', taskId, tasks[taskIndex].completed);

        // Log activity with error protection
        const activityType = tasks[taskIndex].completed ? 'complete' : 'uncomplete';
        safeLogActivity(activityType, tasks[taskIndex]);

        return tasks[taskIndex];

    } catch (error) {
        safeHandleError(error, {
            context: 'toggleTaskComplete',
            userMessage: 'Unable to update task status. ' + (error.message.includes('not found') 
                ? 'Task no longer exists.' 
                : error.message.includes('storage') 
                    ? 'Storage is unavailable.' 
                    : 'Please try again.'),
            severity: 'medium',
            silent: false,
            metadata: {
                taskId: taskId,
                storageAvailable: isLocalStorageAvailable()
            }
        });
        
        return null;
    }
}

/**
 * Get a single task by ID with error handling
 * @param {string} taskId - ID of task to retrieve
 * @returns {Object|null} Task object or null if not found
 */
function getTaskById(taskId) {
    try {
        // Validate input
        if (!taskId || typeof taskId !== 'string') {
            throw new Error('Valid task ID is required');
        }

        // Load tasks
        const tasks = loadTasks();
        
        // Find task
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) {
            console.warn(`[CRUD] Task not found: ${taskId}`);
            return null;
        }

        return task;

    } catch (error) {
        safeHandleError(error, {
            context: 'getTaskById',
            userMessage: 'Unable to retrieve task.',
            severity: 'low',
            silent: true,
            metadata: {
                taskId: taskId,
                storageAvailable: isLocalStorageAvailable()
            }
        });
        
        return null;
    }
}

/**
 * Get tasks filtered by criteria with error handling
 * @param {Object} filters - Filter criteria {category, priority, completed, search}
 * @returns {Array} Filtered array of tasks
 */
function getFilteredTasks(filters = {}) {
    try {
        // Validate filters object
        if (filters && typeof filters !== 'object') {
            throw new Error('Filters must be an object');
        }

        // Load all tasks
        let tasks = loadTasks();

        // Apply category filter
        if (filters.category && filters.category !== 'all') {
            tasks = tasks.filter(task => task.category === filters.category);
        }

        // Apply priority filter
        if (filters.priority && filters.priority !== 'all') {
            tasks = tasks.filter(task => task.priority === filters.priority);
        }

        // Apply completion status filter
        if (filters.completed !== undefined && filters.completed !== null) {
            const completedFilter = filters.completed === 'true' || filters.completed === true;
            tasks = tasks.filter(task => task.completed === completedFilter);
        }

        // Apply search filter
        if (filters.search && typeof filters.search === 'string') {
            const searchLower = filters.search.toLowerCase().trim();
            if (searchLower.length > 0) {
                tasks = tasks.filter(task => 
                    task.text && task.text.toLowerCase().includes(searchLower)
                );
            }
        }

        // Apply due date filter
        if (filters.dueDate) {
            tasks = tasks.filter(task => task.dueDate === filters.dueDate);
        }

        console.log(`[CRUD] Filtered tasks: ${tasks.length} results`);
        return tasks;

    } catch (error) {
        safeHandleError(error, {
            context: 'getFilteredTasks',
            userMessage: 'Unable to filter tasks. Showing all tasks.',
            severity: 'low',
            silent: true,
            metadata: {
                filters: filters,
                storageAvailable: isLocalStorageAvailable()
            }
        });
        
        // Return all tasks as fallback
        return loadTasks();
    }
}

/**
 * Delete multiple tasks by IDs with error handling
 * @param {Array} taskIds - Array of task IDs to delete
 * @returns {Object} Result object with success count and failures
 */
function deleteBatchTasks(taskIds) {
    const result = {
        success: 0,
        failed: 0,
        errors: []
    };

    try {
        // Validate input
        if (!Array.isArray(taskIds)) {
            throw new Error('Task IDs must be provided as an array');
        }

        if (taskIds.length === 0) {
            console.warn('[CRUD] No task IDs provided for batch deletion');
            return result;
        }

        // Check localStorage availability
        if (!isLocalStorageAvailable()) {
            throw new Error('localStorage is not available');
        }

        // Load tasks
        const tasks = loadTasks();
        const tasksToKeep = [];
        const deletedTasks = [];

        // Filter out tasks to delete
        for (const task of tasks) {
            if (taskIds.includes(task.id)) {
                deletedTasks.push(task);
            } else {
                tasksToKeep.push(task);
            }
        }

        // Validate that we found tasks to delete
        if (deletedTasks.length === 0) {
            console.warn('[CRUD] No matching tasks found for deletion');
            return result;
        }

        // Save updated task list
        const saveSuccess = saveTasks(tasksToKeep);
        if (!saveSuccess) {
            throw new Error('Failed to save after batch deletion');
        }

        result.success = deletedTasks.length;
        console.log(`[CRUD] Batch deleted ${result.success} tasks`);

        // Log activity for each deleted task
        for (const task of deletedTasks) {
            safeLogActivity('delete', task);
        }

    } catch (error) {
        result.failed = taskIds ? taskIds.length : 0;
        result.errors.push(error.message);

        safeHandleError(error, {
            context: 'deleteBatchTasks',
            userMessage: 'Unable to delete all selected tasks. ' + (error.message.includes('storage') 
                ? 'Storage is unavailable.' 
                : 'Some deletions may have failed.'),
            severity: 'high',
            silent: false,
            metadata: {
                taskCount: taskIds ? taskIds.length : 0,
                successCount: result.success,
                storageAvailable: isLocalStorageAvailable()
            }
        });
    }

    return result;
}

/**
 * Delete all completed tasks with error handling
 * @returns {number} Number of tasks deleted, or -1 on failure
 */
function deleteCompletedTasks() {
    try {
        // Check localStorage availability
        if (!isLocalStorageAvailable()) {
            throw new Error('localStorage is not available');
        }

        // Load tasks
        const tasks = loadTasks();
        
        // Filter for completed tasks
        const completedTasks = tasks.filter(task => task.completed);
        
        if (completedTasks.length === 0) {
            console.log('[CRUD] No completed tasks to delete');
            return 0;
        }

        // Keep only incomplete tasks
        const incompleteTasks = tasks.filter(task => !task.completed);

        // Save updated task list
        const saveSuccess = saveTasks(incompleteTasks);
        if (!saveSuccess) {
            throw new Error('Failed to save after deleting completed tasks');
        }

        const deletedCount = completedTasks.length;
        console.log(`[CRUD] Deleted ${deletedCount} completed tasks`);

        // Log activity
        for (const task of completedTasks) {
            safeLogActivity('delete', task);
        }

        return deletedCount;

    } catch (error) {
        safeHandleError(error, {
            context: 'deleteCompletedTasks',
            userMessage: 'Unable to delete completed tasks. ' + (error.message.includes('storage') 
                ? 'Storage is unavailable.' 
                : 'Please try again.'),
            severity: 'medium',
            silent: false,
            metadata: {
                storageAvailable: isLocalStorageAvailable()
            }
        });
        
        return -1;
    }
}

/**
 * Get task statistics with error handling
 * @returns {Object} Statistics object with counts and percentages
 */
function getTaskStats() {
    const defaultStats = {
        total: 0,
        completed: 0,
        incomplete: 0,
        byCategory: {},
        byPriority: { low: 0, medium: 0, high: 0 },
        completionRate: 0,
        overdue: 0
    };

    try {
        const tasks = loadTasks();
        
        if (tasks.length === 0) {
            return defaultStats;
        }

        const stats = { ...defaultStats };
        stats.total = tasks.length;

        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today

        // Calculate statistics
        for (const task of tasks) {
            // Validate task object
            if (!task || typeof task !== 'object') {
                console.warn('[CRUD] Invalid task object in statistics calculation:', task);
                continue;
            }

            // Completion status
            if (task.completed) {
                stats.completed++;
            } else {
                stats.incomplete++;
            }

            // Category counts
            if (task.category) {
                stats.byCategory[task.category] = (stats.byCategory[task.category] || 0) + 1;
            }

            // Priority counts
            if (task.priority && stats.byPriority.hasOwnProperty(task.priority)) {
                stats.byPriority[task.priority]++;
            }

            // Overdue tasks (incomplete with past due date)
            if (!task.completed && task.dueDate) {
                try {
                    const dueDate = new Date(task.dueDate);
                    if (isNaN(dueDate.getTime())) {
                        console.warn('[CRUD] Invalid due date for task:', task.id);
                        continue;
                    }
                    dueDate.setHours(0, 0, 0, 0);
                    if (dueDate < now) {
                        stats.overdue++;
                    }
                } catch (dateError) {
                    console.warn('[CRUD] Date parsing error for task:', task.id, dateError);
                }
            }
        }

        // Calculate completion rate
        if (stats.total > 0) {
            stats.completionRate = Math.round((stats.completed / stats.total) * 100);
        }

        console.log('[CRUD] Task statistics calculated:', stats);
        return stats;

    } catch (error) {
        safeHandleError(error, {
            context: 'getTaskStats',
            userMessage: 'Unable to calculate task statistics.',
            severity: 'low',
            silent: true,
            metadata: {
                storageAvailable: isLocalStorageAvailable()
            }
        });
        
        return defaultStats;
    }
}

/**
 * Sort tasks by specified field and order with error handling
 * @param {Array} tasks - Array of tasks to sort
 * @param {string} sortBy - Field to sort by (date, priority, category, text)
 * @param {string} order - Sort order (asc, desc)
 * @returns {Array} Sorted array of tasks
 */
function sortTasks(tasks, sortBy = 'date', order = 'desc') {
    try {
        // Validate input
        if (!Array.isArray(tasks)) {
            throw new Error('Tasks must be an array, got ' + typeof tasks);
        }

        if (tasks.length === 0) {
            return tasks;
        }

        // Validate sortBy and order parameters
        if (typeof sortBy !== 'string') {
            console.warn('[CRUD] Invalid sortBy parameter, defaulting to "date"');
            sortBy = 'date';
        }

        if (typeof order !== 'string' || !['asc', 'desc'].includes(order)) {
            console.warn('[CRUD] Invalid order parameter, defaulting to "desc"');
            order = 'desc';
        }

        // Create a copy to avoid mutating original
        const sortedTasks = [...tasks];

        // Define priority order for sorting
        const priorityOrder = { high: 3, medium: 2, low: 1 };

        // Sort based on field
        sortedTasks.sort((a, b) => {
            let comparison = 0;

            // Validate task objects
            if (!a || typeof a !== 'object' || !b || typeof b !== 'object') {
                return 0;
            }

            switch (sortBy) {
                case 'date':
                    // Sort by creation date
                    try {
                        const dateA = new Date(a.createdAt || 0);
                        const dateB = new Date(b.createdAt || 0);
                        comparison = dateA - dateB;
                    } catch (dateError) {
                        console.warn('[CRUD] Date comparison error:', dateError);
                        comparison = 0;
                    }
                    break;

                case 'dueDate':
                    // Sort by due date (tasks without due date go last)
                    if (!a.dueDate && !b.dueDate) {
                        comparison = 0;
                    } else if (!a.dueDate) {
                        comparison = 1;
                    } else if (!b.dueDate) {
                        comparison = -1;
                    } else {
                        try {
                            const dueDateA = new Date(a.dueDate);
                            const dueDateB = new Date(b.dueDate);
                            comparison = dueDateA - dueDateB;
                        } catch (dateError) {
                            console.warn('[CRUD] Due date comparison error:', dateError);
                            comparison = 0;
                        }
                    }
                    break;

                case 'priority':
                    // Sort by priority level
                    const priorityA = priorityOrder[a.priority] || 0;
                    const priorityB = priorityOrder[b.priority] || 0;
                    comparison = priorityA - priorityB;
                    break;

                case 'category':
                    // Sort alphabetically by category
                    const categoryA = (a.category || '').toLowerCase();
                    const categoryB = (b.category || '').toLowerCase();
                    comparison = categoryA.localeCompare(categoryB);
                    break;

                case 'text':
                    // Sort alphabetically by text
                    const textA = (a.text || '').toLowerCase();
                    const textB = (b.text || '').toLowerCase();
                    comparison = textA.localeCompare(textB);
                    break;

                case 'status':
                    // Sort by completion status
                    comparison = (a.completed === b.completed) ? 0 : a.completed ? 1 : -1;
                    break;

                default:
                    console.warn(`[CRUD] Unknown sort field: ${sortBy}, defaulting to date`);
                    try {
                        const defaultDateA = new Date(a.createdAt || 0);
                        const defaultDateB = new Date(b.createdAt || 0);
                        comparison = defaultDateA - defaultDateB;
                    } catch (dateError) {
                        comparison = 0;
                    }
            }

            // Apply sort order
            return order === 'asc' ? comparison : -comparison;
        });

        console.log(`[CRUD] Sorted ${sortedTasks.length} tasks by ${sortBy} (${order})`);
        return sortedTasks;

    } catch (error) {
        safeHandleError(error, {
            context: 'sortTasks',
            userMessage: 'Unable to sort tasks. Showing in default order.',
            severity: 'low',
            silent: true,
            metadata: {
                sortBy: sortBy,
                order: order,
                taskCount: Array.isArray(tasks) ? tasks.length : 'invalid'
            }
        });
        
        // Return original array as fallback
        return Array.isArray(tasks) ? tasks : [];
    }
}

/**
 * Get tasks due today with error handling
 * @returns {Array} Array of tasks due today
 */
function getTasksDueToday() {
    try {
        const tasks = loadTasks();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayString = today.toISOString().split('T')[0];

        const tasksDueToday = tasks.filter(task => {
            if (!task || !task.dueDate) return false;
            
            try {
                const taskDueDate = task.dueDate.split('T')[0];
                return taskDueDate === todayString && !task.completed;
            } catch (dateError) {
                console.warn('[CRUD] Invalid due date format for task:', task.id, dateError);
                return false;
            }
        });

        console.log(`[CRUD] Found ${tasksDueToday.length} tasks due today`);
        return tasksDueToday;

    } catch (error) {
        safeHandleError(error, {
            context: 'getTasksDueToday',
            userMessage: 'Unable to retrieve tasks due today.',
            severity: 'low',
            silent: true,
            metadata: {
                storageAvailable: isLocalStorageAvailable()
            }
        });
        
        return [];
    }
}

/**
 * Get overdue tasks with error handling
 * @returns {Array} Array of overdue tasks
 */
function getOverdueTasks() {
    try {
        const tasks = loadTasks();
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const overdueTasks = tasks.filter(task => {
            if (!task || !task.dueDate || task.completed) return false;
            
            try {
                const dueDate = new Date(task.dueDate);
                if (isNaN(dueDate.getTime())) {
                    console.warn('[CRUD] Invalid due date for task:', task.id);
                    return false;
                }
                dueDate.setHours(0, 0, 0, 0);
                return dueDate < now;
            } catch (dateError) {
                console.warn('[CRUD] Date parsing error for task:', task.id, dateError);
                return false;
            }
        });

        console.log(`[CRUD] Found ${overdueTasks.length} overdue tasks`);
        return overdueTasks;

    } catch (error) {
        safeHandleError(error, {
            context: 'getOverdueTasks',
            userMessage: 'Unable to retrieve overdue tasks.',
            severity: 'low',
            silent: true,
            metadata: {
                storageAvailable: isLocalStorageAvailable()
            }
        });
        
        return [];
    }
}

/**
 * Export tasks to JSON with error handling
 * @returns {string|null} JSON string of tasks or null on failure
 */
function exportTasksToJSON() {
    try {
        const tasks = loadTasks();
        
        if (tasks.length === 0) {
            console.warn('[CRUD] No tasks to export');
            return JSON.stringify([]);
        }

        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            taskCount: tasks.length,
            tasks: tasks
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        console.log(`[CRUD] Exported ${tasks.length} tasks to JSON`);
        
        return jsonString;

    } catch (error) {
        safeHandleError(error, {
            context: 'exportTasksToJSON',
            userMessage: 'Unable to export tasks. Please try again.',
            severity: 'medium',
            silent: false,
            metadata: {
                storageAvailable: isLocalStorageAvailable()
            }
        });
        
        return null;
    }
}

/**
 * Import tasks from JSON with validation and error handling
 * @param {string} jsonString - JSON string containing tasks
 * @param {boolean} merge - Whether to merge with existing tasks or replace
 * @returns {Object} Result object with success status and counts
 */
function importTasksFromJSON(jsonString, merge = false) {
    const result = {
        success: false,
        imported: 0,
        skipped: 0,
        errors: []
    };

    try {
        // Validate input
        if (!jsonString || typeof jsonString !== 'string') {
            throw new Error('Invalid import data: must be a JSON string');
        }

        if (jsonString.trim().length === 0) {
            throw new Error('Import data is empty');
        }

        // Check localStorage availability
        if (!isLocalStorageAvailable()) {
            throw new Error('localStorage is not available');
        }

        // Parse JSON
        let importData;
        try {
            importData = JSON.parse(jsonString);
        } catch (parseError) {
            throw new Error('Invalid JSON format: ' + parseError.message);
        }

        // Handle different import formats
        let importedTasks = [];
        if (Array.isArray(importData)) {
            importedTasks = importData;
        } else if (importData && typeof importData === 'object' && Array.isArray(importData.tasks)) {
            importedTasks = importData.tasks;
        } else {
            throw new Error('Invalid import format: expected array of tasks or object with tasks property');
        }

        if (importedTasks.length === 0) {
            console.warn('[CRUD] No tasks found in import data');
            result.success = true; // Not an error, just empty
            return result;
        }

        // Validate and process imported tasks
        const validatedTasks = [];
        const timestamp = Date.now();
        
        for (let i = 0; i < importedTasks.length; i++) {
            const task = importedTasks[i];
            
            try {
                // Validate task is an object
                if (!task || typeof task !== 'object') {
                    throw new Error(`Task ${i}: not a valid object`);
                }

                // Validate required fields
                if (!task.text || typeof task.text !== 'string') {
                    throw new Error(`Task ${i}: missing or invalid text field`);
                }

                if (!task.category || typeof task.category !== 'string') {
                    throw new Error(`Task ${i}: missing or invalid category field`);
                }

                // Validate text length
                const trimmedText = task.text.trim();
                if (trimmedText.length === 0) {
                    throw new Error(`Task ${i}: text cannot be empty`);
                }

                if (trimmedText.length > 500) {
                    throw new Error(`Task ${i}: text too long (maximum 500 characters)`);
                }

                // Create validated task with new ID to avoid conflicts
                const validatedTask = {
                    id: timestamp.toString() + '_' + i + '_' + Math.random().toString(36).substr(2, 9),
                    text: trimmedText,
                    category: task.category,
                    priority: task.priority || 'medium',
                    completed: Boolean(task.completed),
                    dueDate: task.dueDate || null,
                    createdAt: task.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                validatedTasks.push(validatedTask);
                result.imported++;

            } catch (validationError) {
                console.warn(`[CRUD] Skipping invalid task at index ${i}:`, validationError.message);
                result.skipped++;
                result.errors.push(validationError.message);
            }
        }

        if (validatedTasks.length === 0) {
            throw new Error('No valid tasks found in import data after validation');
        }

        // Load existing tasks and merge or replace
        let finalTasks;
        if (merge) {
            const existingTasks = loadTasks();
            finalTasks = [...existingTasks, ...validatedTasks];
            console.log(`[CRUD] Merging ${validatedTasks.length} tasks with ${existingTasks.length} existing tasks`);
        } else {
            finalTasks = validatedTasks;
            console.log(`[CRUD] Replacing all tasks with ${validatedTasks.length} imported tasks`);
        }

        // Save tasks
        const saveSuccess = saveTasks(finalTasks);
        if (!saveSuccess) {
            throw new Error('Failed to save imported tasks to storage');
        }

        result.success = true;
        console.log(`[CRUD] Import completed: ${result.imported} imported, ${result.skipped} skipped`);

    } catch (error) {
        result.errors.push(error.message);
        
        let userMessage = 'Unable to import tasks. ';
        if (error.message.includes('JSON')) {
            userMessage += 'The file format is invalid.';
        } else if (error.message.includes('storage')) {
            userMessage += 'Storage is unavailable.';
        } else if (error.message.includes('No valid tasks')) {
            userMessage += 'No valid tasks found in the import file.';
        } else {
            userMessage += 'Please check the file and try again.';
        }

        safeHandleError(error, {
            context: 'importTasksFromJSON',
            userMessage: userMessage,
            severity: 'high',
            silent: false,
            metadata: {
                imported: result.imported,
                skipped: result.skipped,
                merge: merge,
                storageAvailable: isLocalStorageAvailable(),
                dataLength: jsonString ? jsonString.length : 0
            }
        });
    }

    return result;
}

// ===================================================================
// END OF FILE: js/crud.js
// ===================================================================