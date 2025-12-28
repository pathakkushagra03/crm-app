// ========================================
// CENTRALIZED ERROR HANDLING SYSTEM
// Provides consistent error handling across the entire application
// ========================================

/**
 * Global Error Handler
 * Catches, logs, and displays errors in a user-friendly way
 */
const GlobalErrorHandler = {
    // Error types for categorization
    ErrorTypes: {
        NETWORK: 'network',
        API: 'api',
        AUTH: 'auth',
        PERMISSION: 'permission',
        VALIDATION: 'validation',
        STORAGE: 'storage',
        RENDER: 'render',
        UNKNOWN: 'unknown'
    },

    // Error severity levels
    Severity: {
        CRITICAL: 'critical',  // App cannot continue
        HIGH: 'high',          // Major feature broken
        MEDIUM: 'medium',      // Minor feature issue
        LOW: 'low'             // Cosmetic or non-blocking
    },

    // Store recent errors for debugging
    errorLog: [],
    maxLogSize: 100,

    /**
     * Main error handler - call this for all errors
     */
    handle(error, context = {}) {
        const errorInfo = this.categorizeError(error, context);
        
        // Log to console for developers
        this.logToConsole(errorInfo);
        
        // Store in error log
        this.addToLog(errorInfo);
        
        // Show to user if appropriate
        if (errorInfo.showToUser) {
            this.showToUser(errorInfo);
        }
        
        // Handle critical errors
        if (errorInfo.severity === this.Severity.CRITICAL) {
            this.handleCriticalError(errorInfo);
        }
        
        // Track analytics if available
        this.trackError(errorInfo);
        
        return errorInfo;
    },

    /**
     * Categorize and enrich error information
     */
    categorizeError(error, context) {
        const errorInfo = {
            timestamp: new Date().toISOString(),
            message: error?.message || 'Unknown error',
            originalError: error,
            context: context,
            type: this.ErrorTypes.UNKNOWN,
            severity: this.Severity.MEDIUM,
            showToUser: true,
            userMessage: '',
            suggestions: [],
            recoverable: true
        };

        // Determine error type and appropriate response
        const message = errorInfo.message.toLowerCase();

        // Network Errors
        if (message.includes('fetch') || message.includes('network') || 
            message.includes('failed to fetch') || error?.name === 'NetworkError') {
            errorInfo.type = this.ErrorTypes.NETWORK;
            errorInfo.severity = this.Severity.HIGH;
            errorInfo.userMessage = 'Network connection issue';
            errorInfo.suggestions = [
                'Check your internet connection',
                'Try refreshing the page',
                'Wait a moment and try again'
            ];
        }
        // API Errors (Airtable)
        else if (message.includes('airtable') || message.includes('api') || 
                 message.includes('401') || message.includes('403') || message.includes('404')) {
            errorInfo.type = this.ErrorTypes.API;
            errorInfo.severity = this.Severity.HIGH;
            
            if (message.includes('401')) {
                errorInfo.userMessage = 'Authentication failed - Invalid API token';
                errorInfo.suggestions = [
                    'Check your Airtable API token',
                    'Verify token has not expired',
                    'Ensure token has correct permissions'
                ];
            } else if (message.includes('403')) {
                errorInfo.userMessage = 'Access denied - Insufficient permissions';
                errorInfo.suggestions = [
                    'Check your Airtable base permissions',
                    'Verify API token has correct scopes',
                    'Contact your Airtable administrator'
                ];
            } else if (message.includes('404')) {
                errorInfo.userMessage = 'Data not found';
                errorInfo.suggestions = [
                    'The requested data may have been deleted',
                    'Check if base ID is correct',
                    'Verify table names match Airtable'
                ];
            } else {
                errorInfo.userMessage = 'Server connection issue';
                errorInfo.suggestions = [
                    'Airtable API may be temporarily unavailable',
                    'Check Airtable status page',
                    'Data is cached locally when possible'
                ];
            }
        }
        // Authentication Errors
        else if (message.includes('auth') || message.includes('login') || 
                 message.includes('session') || message.includes('token')) {
            errorInfo.type = this.ErrorTypes.AUTH;
            errorInfo.severity = this.Severity.CRITICAL;
            errorInfo.userMessage = 'Authentication error';
            errorInfo.suggestions = [
                'Your session may have expired',
                'Try logging out and back in',
                'Clear browser cache and cookies'
            ];
            errorInfo.recoverable = true; // Can recover by re-authenticating
        }
        // Permission Errors
        else if (message.includes('permission') || message.includes('access denied') ||
                 message.includes('not allowed') || message.includes('forbidden')) {
            errorInfo.type = this.ErrorTypes.PERMISSION;
            errorInfo.severity = this.Severity.MEDIUM;
            errorInfo.userMessage = 'You don\'t have permission for this action';
            errorInfo.suggestions = [
                'Check your user role and permissions',
                'Contact your administrator for access',
                'Some features require higher permissions'
            ];
        }
        // Validation Errors
        else if (message.includes('required') || message.includes('invalid') ||
                 message.includes('validation') || message.includes('must')) {
            errorInfo.type = this.ErrorTypes.VALIDATION;
            errorInfo.severity = this.Severity.LOW;
            errorInfo.userMessage = 'Please check your input';
            errorInfo.suggestions = [
                'Ensure all required fields are filled',
                'Check data format is correct',
                'Review any highlighted error messages'
            ];
        }
        // Storage Errors
        else if (message.includes('storage') || message.includes('localstorage') ||
                 message.includes('quota')) {
            errorInfo.type = this.ErrorTypes.STORAGE;
            errorInfo.severity = this.Severity.MEDIUM;
            errorInfo.userMessage = 'Storage error';
            errorInfo.suggestions = [
                'Browser storage may be full',
                'Try clearing old data',
                'Check browser storage settings'
            ];
        }
        // Render/UI Errors
        else if (message.includes('render') || message.includes('undefined') ||
                 message.includes('null') || context.operation === 'render') {
            errorInfo.type = this.ErrorTypes.RENDER;
            errorInfo.severity = this.Severity.MEDIUM;
            errorInfo.userMessage = 'Display error';
            errorInfo.suggestions = [
                'Try refreshing the page',
                'Clear browser cache',
                'Some data may not display correctly'
            ];
        }
        // Unknown/Generic Errors
        else {
            errorInfo.type = this.ErrorTypes.UNKNOWN;
            errorInfo.severity = this.Severity.MEDIUM;
            errorInfo.userMessage = 'Something went wrong';
            errorInfo.suggestions = [
                'Try refreshing the page',
                'If problem persists, contact support',
                'Check browser console for details'
            ];
        }

        return errorInfo;
    },

    /**
     * Log error to console with formatting
     */
    logToConsole(errorInfo) {
        const prefix = errorInfo.severity === this.Severity.CRITICAL ? '🔴' :
                      errorInfo.severity === this.Severity.HIGH ? '🟠' :
                      errorInfo.severity === this.Severity.MEDIUM ? '🟡' : '🔵';
        
        console.group(`${prefix} Error [${errorInfo.type}] - ${errorInfo.severity.toUpperCase()}`);
        console.error('Message:', errorInfo.message);
        console.error('User Message:', errorInfo.userMessage);
        console.error('Context:', errorInfo.context);
        console.error('Original Error:', errorInfo.originalError);
        if (errorInfo.suggestions.length > 0) {
            console.info('Suggestions:', errorInfo.suggestions);
        }
        console.error('Stack:', errorInfo.originalError?.stack);
        console.groupEnd();
    },

    /**
     * Add error to log for debugging
     */
    addToLog(errorInfo) {
        this.errorLog.unshift({
            ...errorInfo,
            // Don't store the full error object (can be large)
            originalError: errorInfo.originalError?.message
        });
        
        // Keep log size manageable
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(0, this.maxLogSize);
        }
    },

    /**
     * Show error to user
     */
    showToUser(errorInfo) {
        const icon = errorInfo.severity === this.Severity.CRITICAL ? '🔴' :
                    errorInfo.severity === this.Severity.HIGH ? '⚠️' : '❌';
        
        const message = `${icon} ${errorInfo.userMessage}`;
        
        // Use toast for non-critical errors
        if (errorInfo.severity !== this.Severity.CRITICAL && typeof CRUDManager !== 'undefined') {
            CRUDManager.showToast(message, 'error');
        }
        // Use modal for critical errors
        else if (typeof CRUDManager !== 'undefined') {
            const suggestionsHtml = errorInfo.suggestions.length > 0 ? `
                <div class="mt-4 text-left">
                    <div class="text-white text-sm font-semibold mb-2">💡 Try these:</div>
                    <ul class="text-white text-sm opacity-75 space-y-1">
                        ${errorInfo.suggestions.map(s => `<li>• ${s}</li>`).join('')}
                    </ul>
                </div>
            ` : '';
            
            const modal = CRUDManager.createModal(
                `${icon} Error`,
                `
                    <div class="text-white text-center">
                        <p class="text-lg mb-4">${errorInfo.userMessage}</p>
                        ${suggestionsHtml}
                    </div>
                `,
                `<button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Understood</button>`
            );
            document.body.appendChild(modal);
        }
        // Fallback to alert
        else {
            alert(message);
        }
    },

    /**
     * Handle critical errors that prevent app from functioning
     */
    handleCriticalError(errorInfo) {
        console.error('🔴 CRITICAL ERROR - Application may not function properly');
        
        // If auth error, redirect to login
        if (errorInfo.type === this.ErrorTypes.AUTH) {
            console.warn('🔐 Auth error detected, clearing session...');
            
            // Clear auth state
            localStorage.removeItem('crm_user');
            localStorage.removeItem('crm_user_expiry');
            sessionStorage.removeItem('crm_user');
            
            // Redirect to login after short delay
            setTimeout(() => {
                if (typeof AuthManager !== 'undefined' && typeof AuthManager.showLoginForm === 'function') {
                    AuthManager.showLoginForm();
                } else {
                    location.reload();
                }
            }, 2000);
        }
    },

    /**
     * Track error for analytics (placeholder for future implementation)
     */
    trackError(errorInfo) {
        // In production, send to error tracking service like Sentry
        // For now, just log
        if (window.errorTracking) {
            window.errorTracking.track(errorInfo);
        }
    },

    /**
     * Wrap async function with error handling
     */
    async wrap(asyncFn, context = {}) {
        try {
            return await asyncFn();
        } catch (error) {
            this.handle(error, context);
            return null; // Return null on error
        }
    },

    /**
     * Wrap sync function with error handling
     */
    wrapSync(syncFn, context = {}) {
        try {
            return syncFn();
        } catch (error) {
            this.handle(error, context);
            return null;
        }
    },

    /**
     * Create retry wrapper for network operations
     */
    async retry(asyncFn, options = {}) {
        const {
            maxAttempts = 3,
            delay = 1000,
            exponentialBackoff = true,
            context = {}
        } = options;

        let lastError;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await asyncFn();
            } catch (error) {
                lastError = error;
                
                console.warn(`⚠️ Attempt ${attempt}/${maxAttempts} failed:`, error.message);
                
                // Don't retry on certain errors
                if (error.message.includes('401') || error.message.includes('403')) {
                    throw error; // Auth errors shouldn't be retried
                }
                
                // Wait before retrying (except on last attempt)
                if (attempt < maxAttempts) {
                    const waitTime = exponentialBackoff ? delay * Math.pow(2, attempt - 1) : delay;
                    console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }
        
        // All attempts failed
        throw lastError;
    },

    /**
     * Get error log for debugging
     */
    getErrorLog() {
        return this.errorLog;
    },

    /**
     * Export error log
     */
    exportErrorLog() {
        const data = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            errors: this.errorLog
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `crm-error-log-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        console.log('📥 Error log exported');
    },

    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
        console.log('🗑️ Error log cleared');
    }
};

// ========================================
// GLOBAL ERROR LISTENERS
// ========================================

/**
 * Catch all unhandled errors
 */
window.addEventListener('error', (event) => {
    console.error('🔴 Unhandled error caught globally:', event.error);
    
    GlobalErrorHandler.handle(event.error, {
        type: 'unhandled',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
    
    // Prevent default browser error handling for better UX
    event.preventDefault();
});

/**
 * Catch all unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('🔴 Unhandled promise rejection:', event.reason);
    
    GlobalErrorHandler.handle(event.reason, {
        type: 'unhandled_promise',
        promise: event.promise
    });
    
    // Prevent default browser handling
    event.preventDefault();
});

// ========================================
// CONSOLE SHORTCUTS
// ========================================

// Make error log accessible from console
window.getErrorLog = () => GlobalErrorHandler.getErrorLog();
window.exportErrorLog = () => GlobalErrorHandler.exportErrorLog();
window.clearErrorLog = () => GlobalErrorHandler.clearErrorLog();

console.log('✅ Global Error Handler loaded');
console.log('🔍 Debug commands:');
console.log('   - getErrorLog() - View recent errors');
console.log('   - exportErrorLog() - Download error log');
console.log('   - clearErrorLog() - Clear error history');