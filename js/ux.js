/*
 * UX & PERFORMANCE IMPROVEMENTS
 * Makes your CRM feel fast, smooth, and professional
 * 
 * WHAT THIS FILE DOES (In Simple Terms):
 * 
 * 1. PAGINATION - Instead of loading 1000 clients at once (slow!),
 *    load 25 at a time with "Load More" button (fast!)
 * 
 * 2. LOADING SKELETONS - Show gray placeholder boxes while data loads
 *    (like YouTube does before videos appear)
 * 
 * 3. EMPTY STATES - Beautiful screens when there's no data yet
 *    (instead of just blank pages)
 * 
 * 4. ERROR HANDLING - Catch all errors gracefully, show helpful messages
 *    (no more scary error screens!)
 * 
 * 5. TOAST MESSAGES - Consistent success/error notifications
 *    (standardized "✅ Saved!" or "❌ Failed" messages)
 */

// ========================================
// 1. PAGINATION SYSTEM
// ========================================

/*
 * WHAT IS PAGINATION?
 * 
 * Imagine a phonebook with 10,000 names. Would you load ALL 10,000 names
 * at once? NO! That would be slow and overwhelming.
 * 
 * Instead, you show 25 names at a time with a "Show More" button.
 * 
 * BENEFITS:
 * - Faster loading (25 items loads quicker than 1000!)
 * - Less memory usage (browser doesn't choke)
 * - Better user experience (not overwhelming)
 */

const Pagination = {
    // How many items to show per page
    DEFAULT_PAGE_SIZE: 25,
    
    // Current state for each view
    state: {
        clients: { page: 1, pageSize: 25, hasMore: true },
        leads: { page: 1, pageSize: 25, hasMore: true },
        tasks: { page: 1, pageSize: 25, hasMore: true },
        activities: { page: 1, pageSize: 50, hasMore: true }
    },
    
    /**
     * Get paginated data
     * 
     * SIMPLE EXPLANATION:
     * You have 100 clients. Page 1 shows clients 1-25.
     * Page 2 shows clients 26-50. And so on.
     * 
     * @param {array} allData - All your data (e.g., all clients)
     * @param {string} viewType - Which view (clients, leads, tasks)
     * @returns {object} - The data for current page + info about more pages
     */
    getPage(allData, viewType) {
        const state = this.state[viewType];
        if (!state) return { data: allData, hasMore: false };
        
        const startIndex = 0;
        const endIndex = state.page * state.pageSize;
        
        const pageData = allData.slice(startIndex, endIndex);
        const hasMore = endIndex < allData.length;
        
        // Update state
        state.hasMore = hasMore;
        
        return {
            data: pageData,
            hasMore: hasMore,
            currentCount: pageData.length,
            totalCount: allData.length,
            page: state.page
        };
    },
    
    /**
     * Load next page (when user clicks "Load More")
     */
    loadMore(viewType) {
        const state = this.state[viewType];
        if (state && state.hasMore) {
            state.page++;
            render(); // Re-render to show more items
        }
    },
    
    /**
     * Reset pagination (when switching views)
     */
    reset(viewType) {
        if (this.state[viewType]) {
            this.state[viewType].page = 1;
            this.state[viewType].hasMore = true;
        }
    },
    
    /**
     * Reset all pagination
     */
    resetAll() {
        Object.keys(this.state).forEach(key => {
            this.state[key].page = 1;
            this.state[key].hasMore = true;
        });
    },
    
    /**
     * Render "Load More" button
     * 
     * SIMPLE EXPLANATION:
     * Shows a button at the bottom of the list that says "Load More (75 remaining)"
     * Only shows if there's more data to load
     */
    renderLoadMoreButton(viewType, currentCount, totalCount) {
        if (!this.state[viewType]?.hasMore) {
            return `
                <div class="text-center text-white opacity-75 py-4">
                    <p>✅ Showing all ${totalCount} items</p>
                </div>
            `;
        }
        
        const remaining = totalCount - currentCount;
        
        return `
            <div class="text-center py-6">
                <button class="btn btn-primary" onclick="Pagination.loadMore('${viewType}')">
                    📥 Load More (${remaining} remaining)
                </button>
                <p class="text-white text-sm opacity-75 mt-2">
                    Showing ${currentCount} of ${totalCount}
                </p>
            </div>
        `;
    }
};

// ========================================
// 2. LOADING SKELETONS
// ========================================

/*
 * WHAT ARE LOADING SKELETONS?
 * 
 * You know when you open YouTube and see gray rectangles that "shimmer"
 * before the real videos load? Those are loading skeletons!
 * 
 * THEY MAKE YOUR APP FEEL FASTER because:
 * - Users see SOMETHING immediately (not a blank screen)
 * - The shimmer animation shows "we're working on it"
 * - Feels more professional and polished
 * 
 * COMPARISON:
 * ❌ Without skeleton: White screen → 3 seconds → Data appears (feels slow)
 * ✅ With skeleton: Gray boxes → 3 seconds → Data appears (feels faster!)
 */

const LoadingSkeleton = {
    /**
     * Render card skeleton (for clients, leads, tasks)
     * 
     * SIMPLE EXPLANATION:
     * Shows a gray box that looks like a card, with a pulsing animation
     */
    renderCard() {
        return `
            <div class="glass-card p-4 skeleton-card">
                <div class="skeleton-line skeleton-title mb-3"></div>
                <div class="skeleton-line skeleton-text mb-2"></div>
                <div class="skeleton-line skeleton-text mb-2"></div>
                <div class="flex gap-2 mt-3">
                    <div class="skeleton-badge"></div>
                    <div class="skeleton-badge"></div>
                </div>
            </div>
        `;
    },
    
    /**
     * Render multiple card skeletons
     */
    renderCards(count = 6) {
        return Array(count).fill(this.renderCard()).join('');
    },
    
    /**
     * Render list item skeleton (for activity timeline)
     */
    renderListItem() {
        return `
            <div class="glass-card p-4 skeleton-card mb-3">
                <div class="flex items-start gap-4">
                    <div class="skeleton-avatar"></div>
                    <div class="flex-1">
                        <div class="skeleton-line skeleton-title mb-2"></div>
                        <div class="skeleton-line skeleton-text mb-2"></div>
                        <div class="skeleton-line skeleton-text-small"></div>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Render multiple list items
     */
    renderListItems(count = 5) {
        return Array(count).fill(this.renderListItem()).join('');
    },
    
    /**
     * Render stat card skeleton (for dashboard)
     */
    renderStatCard() {
        return `
            <div class="stat-card skeleton-card">
                <div class="skeleton-icon mb-3"></div>
                <div class="skeleton-line skeleton-title mb-2"></div>
                <div class="skeleton-line skeleton-text"></div>
            </div>
        `;
    },
    
    /**
     * Render full page loading state
     */
    renderFullPage(message = 'Loading...') {
        return `
            <div class="min-h-screen flex items-center justify-center">
                <div class="glass-card p-12 text-center">
                    <div class="skeleton-spinner mb-4"></div>
                    <div class="text-white text-xl">${message}</div>
                </div>
            </div>
        `;
    }
};

// ========================================
// 3. EMPTY STATES
// ========================================

/*
 * WHAT ARE EMPTY STATES?
 * 
 * When you have NO data yet (no clients, no leads), what should you show?
 * NOT a blank page! Show a beautiful, helpful screen instead.
 * 
 * GOOD EMPTY STATE includes:
 * - Big friendly icon (emoji or illustration)
 * - Clear message ("No clients yet")
 * - Action button ("Add your first client")
 * - Optional: Tips or help text
 * 
 * EXAMPLE:
 * Instead of showing nothing, show:
 * "📋 No clients yet! Click 'Add Client' to get started."
 */

const EmptyState = {
    /**
     * Generic empty state renderer
     * 
     * @param {object} options - Configuration
     * @returns {string} HTML for empty state
     */
    render(options) {
        const {
            icon = '📋',
            title = 'No Data Yet',
            message = 'Get started by adding your first item',
            actionText = null,
            actionClick = null,
            tips = []
        } = options;
        
        return `
            <div class="text-center text-white py-16 px-6 fade-in">
                <div class="text-8xl mb-6 animate-bounce-slow">${icon}</div>
                <h3 class="text-3xl font-bold mb-3">${title}</h3>
                <p class="text-lg opacity-75 mb-6 max-w-md mx-auto">${message}</p>
                
                ${actionText && actionClick ? `
                    <button class="btn btn-primary btn-lg" onclick="${actionClick}">
                        ${actionText}
                    </button>
                ` : ''}
                
                ${tips.length > 0 ? `
                    <div class="mt-8 glass-card p-6 max-w-lg mx-auto text-left">
                        <h4 class="text-white font-bold mb-3 flex items-center gap-2">
                            <span>💡</span>
                            <span>Quick Tips</span>
                        </h4>
                        <ul class="space-y-2">
                            ${tips.map(tip => `
                                <li class="text-white text-sm opacity-75 flex items-start gap-2">
                                    <span class="text-green-400 mt-1">✓</span>
                                    <span>${tip}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    },
    
    // Predefined empty states for common scenarios
    
    noClients() {
        return this.render({
            icon: '💼',
            title: 'No Clients Yet',
            message: 'Start building your client base by adding your first client',
            actionText: '➕ Add Your First Client',
            actionClick: 'CRUDManager.showAddClientForm()',
            tips: [
                'Import clients from a spreadsheet to get started quickly',
                'Add basic info now, complete details later',
                'Use tags to organize clients by category'
            ]
        });
    },
    
    noLeads() {
        return this.render({
            icon: '🎯',
            title: 'No Leads Yet',
            message: 'Leads are potential clients. Track them here as you work to convert them!',
            actionText: '➕ Add Your First Lead',
            actionClick: 'CRUDManager.showAddLeadForm()',
            tips: [
                'Add leads as soon as you hear about them',
                'Track their status from New → Won',
                'Set follow-up dates to stay organized'
            ]
        });
    },
    
    noTasks() {
        return this.render({
            icon: '✅',
            title: 'No Tasks Yet',
            message: 'Tasks help you stay organized and never miss important work',
            actionText: '➕ Create Your First Task',
            actionClick: 'CRUDManager.showAddTaskForm()',
            tips: [
                'Break big projects into smaller tasks',
                'Set due dates to stay on track',
                'Assign tasks to team members'
            ]
        });
    },
    
    noActivities() {
        return this.render({
            icon: '📊',
            title: 'No Activity Yet',
            message: 'As you work in the CRM, all actions will be logged here automatically',
            tips: [
                'Create, update, or delete any item to see it logged',
                'Great for tracking team productivity',
                'Use filters to find specific activities'
            ]
        });
    },
    
    noResults(searchTerm) {
        return this.render({
            icon: '🔍',
            title: 'No Results Found',
            message: `We couldn't find anything matching "${searchTerm}"`,
            tips: [
                'Try different keywords',
                'Check your spelling',
                'Use fewer words for broader results'
            ]
        });
    },
    
    noPermission() {
        return this.render({
            icon: '🔒',
            title: 'Access Restricted',
            message: 'You don\'t have permission to view this content. Contact your administrator if you need access.',
            tips: [
                'Your current role may not have these permissions',
                'Ask your admin to upgrade your access',
                'Check if you\'re looking at the right company'
            ]
        });
    },
    
    error(errorMessage) {
        return this.render({
            icon: '⚠️',
            title: 'Something Went Wrong',
            message: errorMessage || 'An unexpected error occurred. Please try again.',
            actionText: '🔄 Reload Page',
            actionClick: 'location.reload()',
            tips: [
                'Try refreshing the page',
                'Check your internet connection',
                'If problem persists, contact support'
            ]
        });
    }
};

// ========================================
// 4. ERROR HANDLER
// ========================================

/*
 * WHAT IS ERROR HANDLING?
 * 
 * Things go wrong! Internet cuts out, server is down, user types wrong data.
 * 
 * BAD: App crashes, shows scary error codes
 * GOOD: App catches error, shows friendly message, offers solutions
 * 
 * ANALOGY:
 * Imagine a restaurant. Bad service: "KITCHEN ERROR 500!"
 * Good service: "Sorry, we're out of that dish. May I suggest this instead?"
 * 
 * This error handler does the "good service" approach.
 */

const ErrorHandler = {
    /**
     * Handle any error gracefully
     * 
     * SIMPLE EXPLANATION:
     * When something breaks, this function:
     * 1. Logs the technical error (for developers)
     * 2. Shows a friendly message (for users)
     * 3. Offers solutions or recovery options
     */
    handle(error, context = '') {
        // Log for developers (in browser console)
        console.error(`[${context}] Error:`, error);
        
        // Determine user-friendly message
        let userMessage = 'Something went wrong. Please try again.';
        let suggestions = [];
        
        // Network errors
        if (error.message.includes('fetch') || error.message.includes('network')) {
            userMessage = 'Network error. Check your internet connection.';
            suggestions = [
                'Check if you\'re connected to the internet',
                'Try refreshing the page',
                'Wait a moment and try again'
            ];
        }
        // Airtable errors
        else if (error.message.includes('Airtable') || error.message.includes('API')) {
            userMessage = 'Server connection issue. Your data might not be saved.';
            suggestions = [
                'Check your Airtable configuration',
                'Verify your API token is valid',
                'Data is saved locally as backup'
            ];
        }
        // Permission errors
        else if (error.message.includes('permission') || error.message.includes('access')) {
            userMessage = 'You don\'t have permission for this action.';
            suggestions = [
                'Check your user role',
                'Contact your administrator',
                'Try logging out and back in'
            ];
        }
        // Validation errors
        else if (error.message.includes('required') || error.message.includes('invalid')) {
            userMessage = 'Please check your input and try again.';
            suggestions = [
                'Fill in all required fields',
                'Check for any red error messages',
                'Ensure data is in correct format'
            ];
        }
        
        // Show error to user
        this.showError(userMessage, suggestions);
        
        // Log to activity system if available
        if (typeof ActivityLogger !== 'undefined') {
            ActivityLogger.log({
                type: 'error',
                entityType: 'System',
                entityName: context,
                action: 'Error Occurred',
                details: `${error.message} (${context})`,
                icon: '⚠️',
                color: '#E74C3C'
            });
        }
        
        return false; // Indicate failure
    },
    
    /**
     * Show error to user with suggestions
     */
    showError(message, suggestions = []) {
        const suggestionsHtml = suggestions.length > 0 ? `
            <div class="mt-4 text-left">
                <div class="text-white text-sm font-semibold mb-2">💡 Try these:</div>
                <ul class="text-white text-sm opacity-75 space-y-1">
                    ${suggestions.map(s => `<li>• ${s}</li>`).join('')}
                </ul>
            </div>
        ` : '';
        
        if (typeof CRUDManager !== 'undefined') {
            CRUDManager.showToast(`❌ ${message}`, 'error');
            
            // Also show modal for critical errors
            if (suggestions.length > 0) {
                const modal = CRUDManager.createModal(
                    '⚠️ Error',
                    `
                        <div class="text-white text-center">
                            <p class="text-lg mb-4">${message}</p>
                            ${suggestionsHtml}
                        </div>
                    `,
                    `<button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Got it</button>`
                );
                document.body.appendChild(modal);
            }
        } else {
            alert(message);
        }
    },
    
    /**
     * Wrap async function with error handling
     * 
     * SIMPLE EXPLANATION:
     * Instead of writing try-catch everywhere, wrap your function once!
     * 
     * BEFORE:
     * try { await loadClients(); } catch(e) { handle error... }
     * 
     * AFTER:
     * ErrorHandler.wrap(() => loadClients(), 'Loading Clients')
     */
    async wrap(asyncFunction, context = '') {
        try {
            return await asyncFunction();
        } catch (error) {
            return this.handle(error, context);
        }
    }
};

// ========================================
// 5. TOAST MESSAGE SYSTEM
// ========================================

/*
 * WHAT ARE TOAST MESSAGES?
 * 
 * Those little notifications that pop up and disappear:
 * "✅ Saved successfully!" or "❌ Failed to delete"
 * 
 * Called "toast" because they pop up like toast from a toaster!
 * 
 * CONSISTENCY MATTERS:
 * - All success messages should look the same
 * - All errors should look the same
 * - Same position, same animation, same timing
 */

const ToastManager = {
    // Standardized messages for common actions
    messages: {
        // Create actions
        created: (itemType) => `✅ ${itemType} created successfully!`,
        createFailed: (itemType) => `❌ Failed to create ${itemType}`,
        
        // Update actions
        updated: (itemType) => `✅ ${itemType} updated!`,
        updateFailed: (itemType) => `❌ Failed to update ${itemType}`,
        
        // Delete actions
        deleted: (itemType) => `✅ ${itemType} deleted!`,
        deleteFailed: (itemType) => `❌ Failed to delete ${itemType}`,
        
        // Save actions
        saved: () => `✅ Changes saved!`,
        saveFailed: () => `❌ Failed to save changes`,
        
        // Load actions
        loaded: (itemType) => `✅ ${itemType} loaded successfully`,
        loadFailed: (itemType) => `❌ Failed to load ${itemType}`,
        
        // Generic
        success: (message) => `✅ ${message}`,
        error: (message) => `❌ ${message}`,
        info: (message) => `ℹ️ ${message}`,
        warning: (message) => `⚠️ ${message}`
    },
    
    /**
     * Show standardized toast
     */
    show(message, type = 'success', duration = 4000) {
        if (typeof CRUDManager !== 'undefined') {
            CRUDManager.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    },
    
    // Convenience methods for common actions
    created(itemType) { this.show(this.messages.created(itemType), 'success'); },
    createFailed(itemType) { this.show(this.messages.createFailed(itemType), 'error'); },
    updated(itemType) { this.show(this.messages.updated(itemType), 'success'); },
    updateFailed(itemType) { this.show(this.messages.updateFailed(itemType), 'error'); },
    deleted(itemType) { this.show(this.messages.deleted(itemType), 'success'); },
    deleteFailed(itemType) { this.show(this.messages.deleteFailed(itemType), 'error'); },
    saved() { this.show(this.messages.saved(), 'success'); },
    saveFailed() { this.show(this.messages.saveFailed(), 'error'); },
    loaded(itemType) { this.show(this.messages.loaded(itemType), 'success'); },
    loadFailed(itemType) { this.show(this.messages.loadFailed(itemType), 'error'); },
    success(message) { this.show(this.messages.success(message), 'success'); },
    error(message) { this.show(this.messages.error(message), 'error'); },
    info(message) { this.show(this.messages.info(message), 'info'); },
    warning(message) { this.show(this.messages.warning(message), 'warning'); }
};

// ========================================
// 6. UX UTILITIES
// ========================================

const UXUtils = {
    /**
     * Smooth scroll to top
     * SIMPLE EXPLANATION: Gently scrolls page to top (not instant jump)
     */
    scrollToTop(smooth = true) {
        window.scrollTo({
            top: 0,
            behavior: smooth ? 'smooth' : 'auto'
        });
    },
    
    /**
     * Scroll to element
     */
    scrollToElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    },
    
    /**
     * Show loading indicator on button
     * SIMPLE EXPLANATION: Button says "Loading..." with spinner while working
     */
    setButtonLoading(buttonElement, loading = true) {
        if (!buttonElement) return;
        
        if (loading) {
            buttonElement.disabled = true;
            buttonElement.dataset.originalText = buttonElement.textContent;
            buttonElement.innerHTML = '⏳ Loading...';
        } else {
            buttonElement.disabled = false;
            buttonElement.textContent = buttonElement.dataset.originalText || 'Submit';
        }
    },
    
    /**
     * Debounce function (prevent spam clicking)
     * SIMPLE EXPLANATION: If user clicks 10 times fast, only act on last click
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    },
    
    /**
     * Format number with commas
     * SIMPLE EXPLANATION: 1000000 becomes 1,000,000
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    /**
     * Truncate long text
     * SIMPLE EXPLANATION: "This is a very long..." instead of full text
     */
    truncate(text, maxLength = 50) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
};

console.log('✅ UX & Performance improvements loaded');
console.log('📦 Features: Pagination, Loading Skeletons, Empty States, Error Handling, Toast System');