// ========================================
// FILE: js/activity.js
// PURPOSE: Activity tracking system with comprehensive error handling
// DEPENDENCIES: GlobalErrorHandler, AuthManager, AppState, AirtableAPI, CRUDManager
// ========================================

/*
 * ACTIVITY TRACKING SYSTEM
 * Logs all CRM activities with dual storage (Airtable + localStorage)
 * 
 * WHY THIS IS USEFUL:
 * - Audit trail: Know who did what and when
 * - Team transparency: See what colleagues are working on
 * - Client history: Full timeline of client interactions
 * - Compliance: Required for many industries (finance, healthcare)
 * - Performance tracking: Measure team productivity
 * - Debugging: Troubleshoot issues by reviewing activity
 */

// ========================================
// DEFENSIVE DEPENDENCY WRAPPERS
// ========================================

/**
 * Safe wrapper for GlobalErrorHandler.handle()
 */
function safeHandleError(error, options = {}) {
    try {
        if (typeof GlobalErrorHandler !== 'undefined' && GlobalErrorHandler && typeof GlobalErrorHandler.handle === 'function') {
            GlobalErrorHandler.handle(error, options);
        } else {
            console.error(`[ACTIVITY ERROR] ${options.context || 'Unknown'}:`, error);
            if (options.userMessage && !options.silent) {
                console.warn(`[ACTIVITY USER MESSAGE] ${options.userMessage}`);
            }
            if (options.metadata) {
                console.info('[ACTIVITY METADATA]', options.metadata);
            }
        }
    } catch (handlerError) {
        console.error('[ACTIVITY] Error handler failed:', handlerError);
        console.error('[ACTIVITY] Original error:', error);
    }
}

/**
 * Safe wrapper for CRUDManager.showToast()
 */
function safeShowToast(message, type = 'info') {
    try {
        if (typeof CRUDManager !== 'undefined' && CRUDManager && typeof CRUDManager.showToast === 'function') {
            CRUDManager.showToast(message, type);
        } else {
            console.log(`[TOAST ${type.toUpperCase()}] ${message}`);
        }
    } catch (error) {
        console.error('[ACTIVITY] Toast failed:', error);
    }
}

/**
 * Check if AuthManager is available
 */
function isAuthManagerAvailable() {
    return typeof AuthManager !== 'undefined' && 
           AuthManager && 
           typeof AuthManager.currentUser !== 'undefined';
}

/**
 * Check if AppState is available
 */
function isAppStateAvailable() {
    return typeof AppState !== 'undefined' && 
           AppState && 
           AppState.data &&
           typeof AppState.data === 'object';
}

/**
 * Check if AirtableAPI is available and configured
 */
function isAirtableAvailable() {
    return typeof AirtableAPI !== 'undefined' && 
           AirtableAPI && 
           typeof AirtableAPI.isConfigured === 'function' &&
           AirtableAPI.isConfigured();
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable() {
    try {
        const testKey = '__activity_storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Safely get current user info
 */
function getCurrentUser() {
    try {
        if (!isAuthManagerAvailable()) {
            return { id: 'system', name: 'System', role: 'Unknown' };
        }
        
        const user = AuthManager.currentUser;
        return {
            id: user?.id || 'system',
            name: user?.name || 'System',
            role: user?.role || 'Unknown'
        };
    } catch (error) {
        console.error('[ACTIVITY] Error getting current user:', error);
        return { id: 'system', name: 'System', role: 'Unknown' };
    }
}

/**
 * Safely get selected company
 */
function getSelectedCompany() {
    try {
        if (!isAppStateAvailable()) return null;
        return AppState.selectedCompany || null;
    } catch (error) {
        console.error('[ACTIVITY] Error getting selected company:', error);
        return null;
    }
}

/**
 * Validate date object
 */
function isValidDate(date) {
    try {
        return date instanceof Date && !isNaN(date.getTime());
    } catch (error) {
        return false;
    }
}

// ========================================
// ACTIVITY LOGGER CORE - ENHANCED
// ========================================

const ActivityLogger = {
    // Activity storage key for localStorage
    STORAGE_KEY: 'crm_activity_log',
    
    // Maximum activities to store in localStorage (prevent bloat)
    MAX_LOCAL_ACTIVITIES: 1000,
    
    // Airtable table name (if you create one)
    AIRTABLE_TABLE: 'Activity Log',
    
    /**
     * ENHANCED: Log an activity with comprehensive error handling
     * @param {object} activity - Activity details
     */
    async log(activity) {
        try {
            // Validate input
            if (!activity || typeof activity !== 'object') {
                throw new Error('Invalid activity object provided');
            }
            
            // Get user and company info safely
            const currentUser = getCurrentUser();
            const companyId = getSelectedCompany();
            
            // Enrich activity with metadata
            const enrichedActivity = {
                id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date().toISOString(),
                userId: currentUser.id,
                userName: currentUser.name,
                userRole: currentUser.role,
                companyId: companyId,
                type: activity.type || 'unknown',
                entityType: activity.entityType || '',
                entityName: activity.entityName || '',
                action: activity.action || 'Action',
                details: activity.details || '',
                icon: activity.icon || '📝',
                color: activity.color || '#95A5A6',
                ...activity
            };
            
            // Try to save to Airtable if configured
            if (isAirtableAvailable()) {
                try {
                    await this.saveToAirtable(enrichedActivity);
                } catch (airtableError) {
                    // Log error but don't fail the entire operation
                    safeHandleError(airtableError, {
                        context: 'ActivityLogger.log.airtable',
                        userMessage: null, // Don't show to user
                        severity: 'low',
                        silent: true,
                        metadata: {
                            activityType: enrichedActivity.type,
                            activityAction: enrichedActivity.action
                        }
                    });
                }
            }
            
            // Always save to localStorage as backup
            try {
                this.saveToLocalStorage(enrichedActivity);
            } catch (localStorageError) {
                // This is more critical - log properly
                safeHandleError(localStorageError, {
                    context: 'ActivityLogger.log.localStorage',
                    userMessage: null, // Don't interrupt user flow
                    severity: 'medium',
                    silent: true,
                    metadata: {
                        activityType: enrichedActivity.type,
                        storageAvailable: isLocalStorageAvailable()
                    }
                });
            }
            
            // Update live view if activity page is open
            try {
                this.notifyActivityUpdate(enrichedActivity);
            } catch (notifyError) {
                console.warn('[ACTIVITY] Failed to notify activity update:', notifyError);
            }
            
            return enrichedActivity;
            
        } catch (error) {
            safeHandleError(error, {
                context: 'ActivityLogger.log',
                userMessage: null, // Silent - don't interrupt user
                severity: 'medium',
                silent: true,
                metadata: {
                    activityProvided: !!activity,
                    authAvailable: isAuthManagerAvailable(),
                    storageAvailable: isLocalStorageAvailable()
                }
            });
            
            return null;
        }
    },
    
    /**
     * ENHANCED: Save activity to Airtable with error handling
     */
    async saveToAirtable(activity) {
        // NOTE: You would need to create an "Activity Log" table in Airtable with these fields:
        // - ActivityType (Single line text)
        // - EntityType (Single select: Client, Lead, Task, User, Company)
        // - EntityName (Single line text)
        // - Action (Single line text)
        // - Details (Long text)
        // - UserId (Single line text)
        // - UserName (Single line text)
        // - UserRole (Single line text)
        // - CompanyId (Link to Companies)
        // - Timestamp (Date with time)
        
        try {
            if (!isAirtableAvailable()) {
                console.log('[ACTIVITY] Airtable not configured, skipping');
                return;
            }
            
            // Validate activity has required fields
            if (!activity || !activity.action || !activity.timestamp) {
                throw new Error('Activity missing required fields for Airtable');
            }
            
            // Uncomment this when you create the Airtable table
            /*
            const fields = {
                ActivityType: activity.type || '',
                EntityType: activity.entityType || '',
                EntityName: activity.entityName || '',
                Action: activity.action,
                Details: activity.details || '',
                UserId: activity.userId,
                UserName: activity.userName,
                UserRole: activity.userRole,
                CompanyId: activity.companyId ? [activity.companyId] : [],
                Timestamp: activity.timestamp
            };
            
            await AirtableAPI.createRecord(this.AIRTABLE_TABLE, fields);
            console.log('✅ Activity logged to Airtable:', activity.action);
            */
            
            console.log('[ACTIVITY] Airtable logging is commented out - enable when table is created');
            
        } catch (error) {
            // Re-throw to be caught by caller
            throw new Error('Airtable save failed: ' + error.message);
        }
    },
    
    /**
     * ENHANCED: Save activity to localStorage with error handling
     */
    saveToLocalStorage(activity) {
        try {
            // Check localStorage availability
            if (!isLocalStorageAvailable()) {
                throw new Error('localStorage not available (may be in private browsing mode)');
            }
            
            // Validate activity
            if (!activity || typeof activity !== 'object') {
                throw new Error('Invalid activity object');
            }
            
            const activities = this.getLocalActivities();
            
            // Validate activities is an array
            if (!Array.isArray(activities)) {
                console.warn('[ACTIVITY] Invalid activities array, resetting');
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
                return;
            }
            
            activities.unshift(activity); // Add to beginning
            
            // Keep only recent activities to prevent localStorage bloat
            const trimmed = activities.slice(0, this.MAX_LOCAL_ACTIVITIES);
            
            // Save with error handling for quota
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
            } catch (quotaError) {
                if (quotaError.name === 'QuotaExceededError') {
                    // Try with fewer activities
                    const reduced = activities.slice(0, Math.floor(this.MAX_LOCAL_ACTIVITIES / 2));
                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reduced));
                    console.warn('[ACTIVITY] Reduced activity log due to quota');
                } else {
                    throw quotaError;
                }
            }
            
        } catch (error) {
            throw new Error('localStorage save failed: ' + error.message);
        }
    },
    
    /**
     * ENHANCED: Get activities from localStorage with error handling
     */
    getLocalActivities() {
        try {
            if (!isLocalStorageAvailable()) {
                console.warn('[ACTIVITY] localStorage not available');
                return [];
            }
            
            const stored = localStorage.getItem(this.STORAGE_KEY);
            
            if (!stored) {
                return [];
            }
            
            const parsed = JSON.parse(stored);
            
            // Validate parsed data
            if (!Array.isArray(parsed)) {
                console.warn('[ACTIVITY] Invalid stored activities, returning empty array');
                return [];
            }
            
            return parsed;
            
        } catch (error) {
            safeHandleError(error, {
                context: 'ActivityLogger.getLocalActivities',
                userMessage: null,
                severity: 'low',
                silent: true,
                metadata: {
                    storageAvailable: isLocalStorageAvailable()
                }
            });
            
            return [];
        }
    },
    
    /**
     * ENHANCED: Get all activities with error handling
     */
    async getActivities(options = {}) {
        try {
            const {
                companyId = getSelectedCompany(),
                entityType = null,
                userId = null,
                limit = 100,
                offset = 0
            } = options;
            
            // Validate parameters
            if (typeof limit !== 'number' || limit < 1) {
                console.warn('[ACTIVITY] Invalid limit, using 100');
                limit = 100;
            }
            
            if (typeof offset !== 'number' || offset < 0) {
                console.warn('[ACTIVITY] Invalid offset, using 0');
                offset = 0;
            }
            
            // Try Airtable first (when implemented)
            if (isAirtableAvailable()) {
                // Uncomment when table is created
                /*
                try {
                    let filter = '';
                    if (companyId) filter = `FIND('${companyId}', ARRAYJOIN({CompanyId}))`;
                    
                    const result = await AirtableAPI.fetchFromAirtable(
                        this.AIRTABLE_TABLE,
                        filter,
                        [],
                        limit,
                        offset
                    );
                    
                    return result.records || [];
                } catch (error) {
                    console.warn('[ACTIVITY] Airtable fetch failed, falling back to localStorage:', error);
                }
                */
            }
            
            // Fallback to localStorage
            let activities = this.getLocalActivities();
            
            // Validate activities is array
            if (!Array.isArray(activities)) {
                console.warn('[ACTIVITY] Invalid activities data');
                return [];
            }
            
            // Filter by company
            if (companyId) {
                activities = activities.filter(a => a && a.companyId === companyId);
            }
            
            // Filter by entity type
            if (entityType) {
                activities = activities.filter(a => a && a.entityType === entityType);
            }
            
            // Filter by user
            if (userId) {
                activities = activities.filter(a => a && a.userId === userId);
            }
            
            // Pagination
            return activities.slice(offset, offset + limit);
            
        } catch (error) {
            safeHandleError(error, {
                context: 'ActivityLogger.getActivities',
                userMessage: 'Failed to load activities',
                severity: 'medium',
                silent: true,
                metadata: {
                    options: options
                }
            });
            
            return [];
        }
    },
    
    /**
     * ENHANCED: Notify live view with error handling
     */
    notifyActivityUpdate(activity) {
        try {
            if (typeof document === 'undefined') {
                return;
            }
            
            if (!activity || typeof activity !== 'object') {
                console.warn('[ACTIVITY] Invalid activity for notification');
                return;
            }
            
            // Trigger custom event for live updates
            const event = new CustomEvent('activityLogged', { detail: activity });
            document.dispatchEvent(event);
            
        } catch (error) {
            console.warn('[ACTIVITY] Failed to dispatch activity event:', error);
        }
    },
    
    /**
     * ENHANCED: Clear all activities with confirmation
     */
    clearAll() {
        try {
            if (!confirm('⚠️ This will delete ALL activity logs. Are you sure?')) {
                return;
            }
            
            if (!isLocalStorageAvailable()) {
                safeShowToast('⚠️ Storage not available', 'error');
                return;
            }
            
            localStorage.removeItem(this.STORAGE_KEY);
            safeShowToast('🗑️ Activity log cleared', 'success');
            
            console.log('[ACTIVITY] Activity log cleared');
            
        } catch (error) {
            safeHandleError(error, {
                context: 'ActivityLogger.clearAll',
                userMessage: 'Failed to clear activity log',
                severity: 'medium',
                silent: false
            });
        }
    },
    
    /**
     * ENHANCED: Export activities to JSON with error handling
     */
    exportToJSON() {
        try {
            const activities = this.getLocalActivities();
            
            if (!Array.isArray(activities)) {
                throw new Error('Invalid activities data');
            }
            
            if (activities.length === 0) {
                safeShowToast('⚠️ No activities to export', 'warning');
                return;
            }
            
            // Create JSON content
            const jsonContent = JSON.stringify(activities, null, 2);
            
            // Create and download file
            try {
                const blob = new Blob([jsonContent], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `crm-activity-log-${Date.now()}.json`;
                link.click();
                
                // Cleanup
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                }, 100);
                
                safeShowToast(`📥 Activity log exported (${activities.length} activities)`, 'success');
                console.log('[ACTIVITY] Exported', activities.length, 'activities');
                
            } catch (downloadError) {
                throw new Error('Failed to create download: ' + downloadError.message);
            }
            
        } catch (error) {
            safeHandleError(error, {
                context: 'ActivityLogger.exportToJSON',
                userMessage: 'Failed to export activity log',
                severity: 'medium',
                silent: false,
                metadata: {
                    storageAvailable: isLocalStorageAvailable()
                }
            });
        }
    },
    
    /**
     * ENHANCED: Get activity statistics with error handling
     */
    getStats(companyId = null) {
        const defaultStats = {
            total: 0,
            today: 0,
            thisWeek: 0,
            thisMonth: 0,
            byType: {},
            byUser: {},
            topActions: {}
        };
        
        try {
            // Use provided companyId or get from AppState
            if (!companyId) {
                companyId = getSelectedCompany();
            }
            
            const allActivities = this.getLocalActivities();
            
            if (!Array.isArray(allActivities)) {
                console.warn('[ACTIVITY] Invalid activities for stats');
                return defaultStats;
            }
            
            // Filter by company if provided
            const activities = companyId ? 
                allActivities.filter(a => a && a.companyId === companyId) : 
                allActivities;
            
            const stats = { ...defaultStats };
            stats.total = activities.length;
            
            // Calculate date thresholds
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            
            activities.forEach(activity => {
                try {
                    if (!activity || !activity.timestamp) return;
                    
                    const activityDate = new Date(activity.timestamp);
                    if (!isValidDate(activityDate)) return;
                    
                    // Count by time period
                    if (activityDate >= today) stats.today++;
                    if (activityDate >= weekAgo) stats.thisWeek++;
                    if (activityDate >= monthAgo) stats.thisMonth++;
                    
                    // Count by type
                    const type = activity.entityType || 'Other';
                    stats.byType[type] = (stats.byType[type] || 0) + 1;
                    
                    // Count by user
                    const user = activity.userName || 'Unknown';
                    stats.byUser[user] = (stats.byUser[user] || 0) + 1;
                    
                    // Count by action
                    const action = activity.action || 'Unknown';
                    stats.topActions[action] = (stats.topActions[action] || 0) + 1;
                    
                } catch (activityError) {
                    console.warn('[ACTIVITY] Error processing activity in stats:', activityError);
                }
            });
            
            return stats;
            
        } catch (error) {
            safeHandleError(error, {
                context: 'ActivityLogger.getStats',
                userMessage: 'Failed to calculate activity statistics',
                severity: 'low',
                silent: true,
                metadata: {
                    companyId: companyId
                }
            });
            
            return defaultStats;
        }
    }
};

// ========================================
// ACTIVITY TYPES & HELPERS - ENHANCED
// ========================================

/**
 * Helper functions to log specific activity types
 * All wrapped with error handling
 */
const ActivityTypes = {
    // Client activities
    clientCreated: (clientName) => {
        try {
            return ActivityLogger.log({
                type: 'create',
                entityType: 'Client',
                entityName: clientName || 'Unknown Client',
                action: 'Client Created',
                details: `New client "${clientName || 'Unknown'}" was added to the system`,
                icon: '➕',
                color: '#4ECDC4'
            });
        } catch (error) {
            console.error('[ACTIVITY] clientCreated failed:', error);
        }
    },
    
    clientUpdated: (clientName, changes) => {
        try {
            return ActivityLogger.log({
                type: 'update',
                entityType: 'Client',
                entityName: clientName || 'Unknown Client',
                action: 'Client Updated',
                details: `Client "${clientName || 'Unknown'}" was modified${changes ? ': ' + changes : ''}`,
                icon: '✏️',
                color: '#FFA07A'
            });
        } catch (error) {
            console.error('[ACTIVITY] clientUpdated failed:', error);
        }
    },
    
    clientStatusChanged: (clientName, oldStatus, newStatus) => {
        try {
            return ActivityLogger.log({
                type: 'status_change',
                entityType: 'Client',
                entityName: clientName || 'Unknown Client',
                action: 'Client Status Changed',
                details: `Client "${clientName || 'Unknown'}" status changed from ${oldStatus || 'unknown'} to ${newStatus || 'unknown'}`,
                icon: '🔄',
                color: '#45B7D1'
            });
        } catch (error) {
            console.error('[ACTIVITY] clientStatusChanged failed:', error);
        }
    },
    
    clientDeleted: (clientName) => {
        try {
            return ActivityLogger.log({
                type: 'delete',
                entityType: 'Client',
                entityName: clientName || 'Unknown Client',
                action: 'Client Deleted',
                details: `Client "${clientName || 'Unknown'}" was removed from the system`,
                icon: '🗑️',
                color: '#FF6B6B'
            });
        } catch (error) {
            console.error('[ACTIVITY] clientDeleted failed:', error);
        }
    },
    
    // Lead activities
    leadCreated: (leadName) => {
        try {
            return ActivityLogger.log({
                type: 'create',
                entityType: 'Lead',
                entityName: leadName || 'Unknown Lead',
                action: 'Lead Created',
                details: `New lead "${leadName || 'Unknown'}" was added`,
                icon: '➕',
                color: '#4ECDC4'
            });
        } catch (error) {
            console.error('[ACTIVITY] leadCreated failed:', error);
        }
    },
    
    leadStatusChanged: (leadName, oldStatus, newStatus) => {
        try {
            return ActivityLogger.log({
                type: 'status_change',
                entityType: 'Lead',
                entityName: leadName || 'Unknown Lead',
                action: 'Lead Status Changed',
                details: `Lead "${leadName || 'Unknown'}" moved from ${oldStatus || 'unknown'} to ${newStatus || 'unknown'}`,
                icon: '🎯',
                color: '#45B7D1'
            });
        } catch (error) {
            console.error('[ACTIVITY] leadStatusChanged failed:', error);
        }
    },
    
    leadConverted: (leadName, clientName) => {
        try {
            return ActivityLogger.log({
                type: 'conversion',
                entityType: 'Lead',
                entityName: leadName || 'Unknown Lead',
                action: 'Lead Converted',
                details: `Lead "${leadName || 'Unknown'}" was converted to client "${clientName || 'Unknown'}"`,
                icon: '🏆',
                color: '#2ECC71'
            });
        } catch (error) {
            console.error('[ACTIVITY] leadConverted failed:', error);
        }
    },
    
    // Task activities
    taskCreated: (taskName) => {
        try {
            return ActivityLogger.log({
                type: 'create',
                entityType: 'Task',
                entityName: taskName || 'Unknown Task',
                action: 'Task Created',
                details: `New task "${taskName || 'Unknown'}" was created`,
                icon: '➕',
                color: '#4ECDC4'
            });
        } catch (error) {
            console.error('[ACTIVITY] taskCreated failed:', error);
        }
    },
    
    taskCompleted: (taskName) => {
        try {
            return ActivityLogger.log({
                type: 'complete',
                entityType: 'Task',
                entityName: taskName || 'Unknown Task',
                action: 'Task Completed',
                details: `Task "${taskName || 'Unknown'}" was marked as completed`,
                icon: '✅',
                color: '#2ECC71'
            });
        } catch (error) {
            console.error('[ACTIVITY] taskCompleted failed:', error);
        }
    },
    
    taskAssigned: (taskName, userName) => {
        try {
            return ActivityLogger.log({
                type: 'assignment',
                entityType: 'Task',
                entityName: taskName || 'Unknown Task',
                action: 'Task Assigned',
                details: `Task "${taskName || 'Unknown'}" was assigned to ${userName || 'Unknown User'}`,
                icon: '👤',
                color: '#9B59B6'
            });
        } catch (error) {
            console.error('[ACTIVITY] taskAssigned failed:', error);
        }
    },
    
    // User activities
    userCreated: (userName) => {
        try {
            return ActivityLogger.log({
                type: 'create',
                entityType: 'User',
                entityName: userName || 'Unknown User',
                action: 'User Created',
                details: `New user "${userName || 'Unknown'}" was added to the team`,
                icon: '➕',
                color: '#4ECDC4'
            });
        } catch (error) {
            console.error('[ACTIVITY] userCreated failed:', error);
        }
    },
    
    userRoleChanged: (userName, oldRole, newRole) => {
        try {
            return ActivityLogger.log({
                type: 'role_change',
                entityType: 'User',
                entityName: userName || 'Unknown User',
                action: 'User Role Changed',
                details: `User "${userName || 'Unknown'}" role changed from ${oldRole || 'unknown'} to ${newRole || 'unknown'}`,
                icon: '👑',
                color: '#E74C3C'
            });
        } catch (error) {
            console.error('[ACTIVITY] userRoleChanged failed:', error);
        }
    },
    
    // Company activities
    companyCreated: (companyName) => {
        try {
            return ActivityLogger.log({
                type: 'create',
                entityType: 'Company',
                entityName: companyName || 'Unknown Company',
                action: 'Company Created',
                details: `New company "${companyName || 'Unknown'}" was added`,
                icon: '🏢',
                color: '#4ECDC4'
            });
        } catch (error) {
            console.error('[ACTIVITY] companyCreated failed:', error);
        }
    },
    
    // Auth activities
    userLogin: (userName) => {
        try {
            return ActivityLogger.log({
                type: 'auth',
                entityType: 'System',
                entityName: userName || 'Unknown User',
                action: 'User Logged In',
                details: `${userName || 'Unknown User'} signed in to the system`,
                icon: '🔓',
                color: '#3498DB'
            });
        } catch (error) {
            console.error('[ACTIVITY] userLogin failed:', error);
        }
    },
    
    userLogout: (userName) => {
        try {
            return ActivityLogger.log({
                type: 'auth',
                entityType: 'System',
                entityName: userName || 'Unknown User',
                action: 'User Logged Out',
                details: `${userName || 'Unknown User'} signed out`,
                icon: '🔒',
                color: '#95A5A6'
            });
        } catch (error) {
            console.error('[ACTIVITY] userLogout failed:', error);
        }
    }
};

// ========================================
// ACTIVITY TIMELINE RENDERER - ENHANCED
// ========================================

const ActivityTimeline = {
    /**
     * ENHANCED: Render activity timeline view with error handling
     */
    async render(options = {}) {
        try {
            const {
                limit = 50,
                entityType = null,
                showFilters = true
            } = options;
            
            const activities = await ActivityLogger.getActivities({ limit, entityType });
            const stats = ActivityLogger.getStats();
            
            if (!Array.isArray(activities)) {
                throw new Error('Invalid activities data');
            }
            
            return `
                <!-- Activity Statistics -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="glass-card p-4">
                        <div class="text-white text-sm opacity-75 mb-1">Total Activities</div>
                        <div class="text-white text-3xl font-bold">${stats.total || 0}</div>
                    </div>
                    <div class="glass-card p-4">
                        <div class="text-white text-sm opacity-75 mb-1">Today</div>
                        <div class="text-white text-3xl font-bold">${stats.today || 0}</div>
                    </div>
                    <div class="glass-card p-4">
                        <div class="text-white text-sm opacity-75 mb-1">This Week</div>
                        <div class="text-white text-3xl font-bold">${stats.thisWeek || 0}</div>
                    </div>
                    <div class="glass-card p-4">
                        <div class="text-white text-sm opacity-75 mb-1">This Month</div>
                        <div class="text-white text-3xl font-bold">${stats.thisMonth || 0}</div>
                    </div>
                </div>
                
                ${showFilters ? this.renderFilters() : ''}
                
                <!-- Activity Timeline -->
                <div class="glass-card p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-white text-2xl font-bold">Activity Timeline</h3>
                        <div class="flex gap-2">
                            <button class="btn btn-secondary btn-sm" onclick="ActivityLogger.exportToJSON()">
                                📥 Export
                            </button>
                            ${isAuthManagerAvailable() && AuthManager.currentUser?.role === 'Admin' ? `
                                <button class="btn btn-danger btn-sm" onclick="ActivityLogger.clearAll()">
                                    🗑️ Clear All
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    ${activities.length === 0 ? `
                        <div class="text-center text-white opacity-75 py-12">
                            <div class="text-6xl mb-4">📋</div>
                            <h3 class="text-xl font-bold mb-2">No Activity Yet</h3>
                            <p>Activities will appear here as your team works</p>
                        </div>
                    ` : `
                        <div class="space-y-4" id="activityTimelineContainer">
                            ${activities.map(activity => this.renderActivityItem(activity)).join('')}
                        </div>
                    `}
                </div>
                
                <!-- Activity Distribution Charts -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div class="glass-card p-6">
                        <h4 class="text-white text-xl font-bold mb-4">Activity by Type</h4>
                        ${this.renderTypeDistribution(stats.byType || {})}
                    </div>
                    <div class="glass-card p-6">
                        <h4 class="text-white text-xl font-bold mb-4">Top Contributors</h4>
                        ${this.renderUserDistribution(stats.byUser || {})}
                    </div>
                </div>
            `;
        } catch (error) {
            safeHandleError(error, {
                context: 'ActivityTimeline.render',
                userMessage: 'Failed to render activity timeline',
                severity: 'high',
                silent: false,
                metadata: {
                    options: options
                }
            });
            
            return `
                <div class="glass-card p-12 text-center">
                    <div class="text-6xl mb-4">⚠️</div>
                    <h3 class="text-white text-2xl font-bold mb-2">Activity Timeline Error</h3>
                    <p class="text-white opacity-75">Unable to load activity timeline</p>
                </div>
            `;
        }
    },
    
    /**
     * ENHANCED: Render individual activity item with validation
     */
    renderActivityItem(activity) {
        try {
            if (!activity || typeof activity !== 'object') {
                return '';
            }
            
            const timeAgo = this.getTimeAgo(new Date(activity.timestamp));
            const icon = activity.icon || '📝';
            const color = activity.color || '#95A5A6';
            const action = activity.action || 'Activity';
            const details = activity.details || 'No details';
            const userName = activity.userName || 'Unknown User';
            const userRole = activity.userRole || 'Unknown';
            const entityType = activity.entityType || '';
            
            return `
                <div class="glass-card p-4 hover:scale-102 transition-transform activity-item fade-in"
                     style="border-left: 4px solid ${color}">
                    <div class="flex items-start gap-4">
                        <div class="text-4xl flex-shrink-0">${icon}</div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between gap-2 mb-2">
                                <h4 class="text-white font-bold text-lg">${action}</h4>
                                <span class="text-white text-xs opacity-75 whitespace-nowrap">${timeAgo}</span>
                            </div>
                            <p class="text-white text-sm opacity-75 mb-2">${details}</p>
                            <div class="flex items-center gap-3 text-xs">
                                <span class="text-white opacity-60">
                                    👤 ${userName}
                                </span>
                                <span class="text-white opacity-60">
                                    👑 ${userRole}
                                </span>
                                ${entityType ? `
                                    <span class="status-badge" style="font-size: 10px;">
                                        ${entityType}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('[ACTIVITY] Error rendering activity item:', error);
            return '';
        }
    },
    
    /**
     * ENHANCED: Render filter controls with safe data access
     */
    renderFilters() {
        try {
            // Safely get users array
            let users = [];
            if (isAppStateAvailable() && Array.isArray(AppState.data.users)) {
                users = AppState.data.users;
            }
            
            return `
                <div class="glass-card p-4 mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="form-label">Filter by Type</label>
                            <select class="form-select" id="activityTypeFilter" onchange="ActivityTimeline.applyFilters()">
                                <option value="">All Types</option>
                                <option value="Client">Clients</option>
                                <option value="Lead">Leads</option>
                                <option value="Task">Tasks</option>
                                <option value="User">Users</option>
                                <option value="Company">Companies</option>
                                <option value="System">System</option>
                            </select>
                        </div>
                        <div>
                            <label class="form-label">Filter by User</label>
                            <select class="form-select" id="activityUserFilter" onchange="ActivityTimeline.applyFilters()">
                                <option value="">All Users</option>
                                ${users.map(u => u ? `
                                    <option value="${u.id || ''}">${u.name || 'Unknown'}</option>
                                ` : '').join('')}
                            </select>
                        </div>
                        <div>
                            <label class="form-label">Date Range</label>
                            <select class="form-select" id="activityDateFilter" onchange="ActivityTimeline.applyFilters()">
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('[ACTIVITY] Error rendering filters:', error);
            return '';
        }
    },
    
    /**
     * ENHANCED: Apply filters and re-render with error handling
     */
    async applyFilters() {
        try {
            const typeFilter = document.getElementById('activityTypeFilter')?.value || '';
            const userFilter = document.getElementById('activityUserFilter')?.value || '';
            const dateFilter = document.getElementById('activityDateFilter')?.value || 'all';
            
            // Get filtered activities
            const activities = await ActivityLogger.getActivities({
                entityType: typeFilter || null,
                userId: userFilter || null
            });
            
            if (!Array.isArray(activities)) {
                throw new Error('Invalid activities data');
            }
            
            // Apply date filter
            let filtered = activities;
            if (dateFilter !== 'all') {
                const now = new Date();
                let cutoffDate;
                
                if (dateFilter === 'today') {
                    cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                } else if (dateFilter === 'week') {
                    cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                } else if (dateFilter === 'month') {
                    cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                }
                
                if (cutoffDate) {
                    filtered = activities.filter(a => {
                        try {
                            const activityDate = new Date(a.timestamp);
                            return isValidDate(activityDate) && activityDate >= cutoffDate;
                        } catch (error) {
                            return false;
                        }
                    });
                }
            }
            
            // Re-render timeline
            const container = document.getElementById('activityTimelineContainer');
            if (container) {
                container.innerHTML = filtered.length === 0 ? `
                    <div class="text-center text-white opacity-75 py-12">
                        <div class="text-4xl mb-2">🔍</div>
                        <p>No activities match your filters</p>
                    </div>
                ` : filtered.map(a => this.renderActivityItem(a)).join('');
            }
            
        } catch (error) {
            safeHandleError(error, {
                context: 'ActivityTimeline.applyFilters',
                userMessage: 'Failed to apply filters',
                severity: 'medium',
                silent: false
            });
        }
    },
    
    /**
     * ENHANCED: Render type distribution chart with validation
     */
    renderTypeDistribution(byType) {
        try {
            if (!byType || typeof byType !== 'object') {
                return '<div class="text-white opacity-75 text-center py-4">No data available</div>';
            }
            
            const entries = Object.entries(byType);
            if (entries.length === 0) {
                return '<div class="text-white opacity-75 text-center py-4">No activity types yet</div>';
            }
            
            const total = Object.values(byType).reduce((sum, count) => sum + (count || 0), 0);
            
            if (total === 0) {
                return '<div class="text-white opacity-75 text-center py-4">No activities recorded</div>';
            }
            
            return `
                <div class="space-y-3">
                    ${entries
                        .sort((a, b) => (b[1] || 0) - (a[1] || 0))
                        .slice(0, 5)
                        .map(([type, count]) => {
                            const percentage = ((count / total) * 100).toFixed(1);
                            return `
                                <div>
                                    <div class="flex items-center justify-between text-white text-sm mb-1">
                                        <span>${type || 'Unknown'}</span>
                                        <span class="font-bold">${count || 0} (${percentage}%)</span>
                                    </div>
                                    <div class="w-full bg-white bg-opacity-10 rounded-full h-2">
                                        <div class="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full"
                                             style="width: ${percentage}%"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                </div>
            `;
        } catch (error) {
            console.error('[ACTIVITY] Error rendering type distribution:', error);
            return '<div class="text-white opacity-75 text-center py-4">Error loading chart</div>';
        }
    },
    
    /**
     * ENHANCED: Render user distribution chart with validation
     */
    renderUserDistribution(byUser) {
        try {
            if (!byUser || typeof byUser !== 'object') {
                return '<div class="text-white opacity-75 text-center py-4">No data available</div>';
            }
            
            const entries = Object.entries(byUser);
            if (entries.length === 0) {
                return '<div class="text-white opacity-75 text-center py-4">No user activity yet</div>';
            }
            
            const total = Object.values(byUser).reduce((sum, count) => sum + (count || 0), 0);
            
            if (total === 0) {
                return '<div class="text-white opacity-75 text-center py-4">No activities recorded</div>';
            }
            
            return `
                <div class="space-y-3">
                    ${entries
                        .sort((a, b) => (b[1] || 0) - (a[1] || 0))
                        .slice(0, 5)
                        .map(([user, count]) => {
                            const percentage = ((count / total) * 100).toFixed(1);
                            return `
                                <div>
                                    <div class="flex items-center justify-between text-white text-sm mb-1">
                                        <span>👤 ${user || 'Unknown'}</span>
                                        <span class="font-bold">${count || 0} (${percentage}%)</span>
                                    </div>
                                    <div class="w-full bg-white bg-opacity-10 rounded-full h-2">
                                        <div class="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
                                             style="width: ${percentage}%"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                </div>
            `;
        } catch (error) {
            console.error('[ACTIVITY] Error rendering user distribution:', error);
            return '<div class="text-white opacity-75 text-center py-4">Error loading chart</div>';
        }
    },
    
    /**
     * ENHANCED: Get human-readable time ago with validation
     */
    getTimeAgo(date) {
        try {
            if (!date || !isValidDate(date)) {
                return 'Unknown time';
            }
            
            const seconds = Math.floor((new Date() - date) / 1000);
            
            if (isNaN(seconds) || seconds < 0) {
                return 'Just now';
            }
            
            if (seconds < 60) return 'Just now';
            if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
            if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
            if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
            
            return date.toLocaleDateString();
            
        } catch (error) {
            console.error('[ACTIVITY] Error calculating time ago:', error);
            return 'Unknown time';
        }
    }
};

// ========================================
// LIVE ACTIVITY FEED (Dashboard Widget) - ENHANCED
// ========================================

const ActivityFeed = {
    /**
     * ENHANCED: Render recent activities widget with error handling
     */
    async renderWidget(limit = 5) {
        try {
            // Validate limit
            if (typeof limit !== 'number' || limit < 1) {
                limit = 5;
            }
            
            const activities = await ActivityLogger.getActivities({ limit });
            
            if (!Array.isArray(activities)) {
                throw new Error('Invalid activities data');
            }
            
            return `
                <div class="glass-card p-6 fade-in">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-white text-xl font-bold">📋 Recent Activity</h3>
                        <button class="btn btn-secondary btn-sm" 
                                onclick="navigateTo('activities', { selectedCompany: AppState.selectedCompany })">
                            View All
                        </button>
                    </div>
                    
                    ${activities.length === 0 ? `
                        <div class="text-center text-white opacity-75 py-8">
                            <div class="text-4xl mb-2">💤</div>
                            <p class="text-sm">No recent activity</p>
                        </div>
                    ` : `
                        <div class="space-y-3">
                            ${activities.map(activity => {
                                if (!activity) return '';
                                return `
                                    <div class="glass-card p-3 hover:bg-white hover:bg-opacity-10 transition-all">
                                        <div class="flex items-start gap-3">
                                            <div class="text-2xl">${activity.icon || '📝'}</div>
                                            <div class="flex-1 min-w-0">
                                                <div class="text-white font-semibold text-sm">${activity.action || 'Activity'}</div>
                                                <div class="text-white text-xs opacity-75 truncate">${activity.details || 'No details'}</div>
                                                <div class="text-white text-xs opacity-60 mt-1">
                                                    ${ActivityTimeline.getTimeAgo(new Date(activity.timestamp))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>
            `;
        } catch (error) {
            safeHandleError(error, {
                context: 'ActivityFeed.renderWidget',
                userMessage: 'Failed to load recent activity',
                severity: 'low',
                silent: true,
                metadata: {
                    limit: limit
                }
            });
            
            return `
                <div class="glass-card p-6 fade-in">
                    <h3 class="text-white text-xl font-bold mb-4">📋 Recent Activity</h3>
                    <div class="text-center text-white opacity-75 py-8">
                        <div class="text-4xl mb-2">⚠️</div>
                        <p class="text-sm">Unable to load activity</p>
                    </div>
                </div>
            `;
        }
    },
    
    /**
     * ENHANCED: Initialize live updates with error handling
     */
    initLiveUpdates() {
        try {
            if (typeof document === 'undefined') {
                console.warn('[ACTIVITY] Document not available for live updates');
                return;
            }
            
            document.addEventListener('activityLogged', (e) => {
                try {
                    console.log('📢 New activity:', e.detail);
                    // You could show a toast notification here
                    // or update the activity feed in real-time
                } catch (error) {
                    console.error('[ACTIVITY] Error handling activity event:', error);
                }
            });
            
            console.log('[ACTIVITY] Live updates initialized');
            
        } catch (error) {
            console.error('[ACTIVITY] Failed to initialize live updates:', error);
        }
    }
};

// ========================================
// INITIALIZATION - ENHANCED
// ========================================

/**
 * Initialize activity tracking system
 */
function initializeActivityTracking() {
    try {
        console.log('[ACTIVITY] Initializing Activity Tracking System...');
        
        // Initialize live updates
        ActivityFeed.initLiveUpdates();
        
        // Log system start
        if (isAuthManagerAvailable() && AuthManager.currentUser) {
            ActivityLogger.log({
                type: 'system',
                entityType: 'System',
                action: 'System Initialized',
                details: 'Activity tracking system started',
                icon: '🚀',
                color: '#3498DB'
            });
        }
        
        console.log('[ACTIVITY] Activity tracking initialized successfully');
        return true;
        
    } catch (error) {
        console.error('[ACTIVITY] Failed to initialize activity tracking:', error);
        return false;
    }
}

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeActivityTracking();
        });
    } else {
        // DOM already loaded
        initializeActivityTracking();
    }
}

// ========================================
// GLOBAL EXPOSURE
// ========================================

// Expose modules globally
if (typeof window !== 'undefined') {
    window.ActivityLogger = ActivityLogger;
    window.ActivityTypes = ActivityTypes;
    window.ActivityTimeline = ActivityTimeline;
    window.ActivityFeed = ActivityFeed;
    window.initializeActivityTracking = initializeActivityTracking;
}

// ========================================
// INITIALIZATION LOGGING
// ========================================

console.log('✅ Activity Tracking System loaded - Enhanced Error Handling');
console.log('📊 Storage: Airtable (if configured) + localStorage fallback');
console.log('📢 Real-time activity logging enabled');
console.log('🔒 localStorage available:', isLocalStorageAvailable());
console.log('🔑 AuthManager available:', isAuthManagerAvailable());

// ========================================
// END OF FILE: js/activity.js
// ========================================