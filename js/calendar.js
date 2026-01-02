// ========================================
// FILE: js/calendar.js
// PURPOSE: Calendar management with comprehensive error handling
// DEPENDENCIES: GlobalErrorHandler, AppState, render(), CRUDManager
// ========================================

// ========================================
// DEFENSIVE DEPENDENCY WRAPPERS
// ========================================

/**
 * Safe wrapper for GlobalErrorHandler.handle()
 * Falls back to console logging if GlobalErrorHandler unavailable
 */
function safeHandleError(error, options = {}) {
    try {
        if (typeof GlobalErrorHandler !== 'undefined' && GlobalErrorHandler && typeof GlobalErrorHandler.handle === 'function') {
            GlobalErrorHandler.handle(error, options);
        } else {
            console.error(`[CALENDAR ERROR] ${options.context || 'Unknown'}:`, error);
            if (options.userMessage && !options.silent) {
                console.warn(`[CALENDAR USER MESSAGE] ${options.userMessage}`);
            }
            if (options.metadata) {
                console.info('[CALENDAR METADATA]', options.metadata);
            }
        }
    } catch (handlerError) {
        console.error('[CALENDAR] Error handler failed:', handlerError);
        console.error('[CALENDAR] Original error:', error);
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
        console.error('[CALENDAR] Toast failed:', error);
    }
}

/**
 * Check if AppState is available and has data
 */
function isAppStateAvailable() {
    return typeof AppState !== 'undefined' && 
           AppState && 
           AppState.data &&
           typeof AppState.data === 'object';
}

/**
 * Safely get array from AppState.data
 */
function getAppStateData(key) {
    try {
        if (!isAppStateAvailable()) {
            console.warn('[CALENDAR] AppState not available');
            return [];
        }
        
        const data = AppState.data[key];
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(`[CALENDAR] Error getting AppState.data.${key}:`, error);
        return [];
    }
}

/**
 * Safely get selected company ID
 */
function getSelectedCompany() {
    try {
        if (!isAppStateAvailable()) return null;
        return AppState.selectedCompany || null;
    } catch (error) {
        console.error('[CALENDAR] Error getting selected company:', error);
        return null;
    }
}

/**
 * Safe wrapper for global render() function
 */
function safeRender() {
    try {
        if (typeof render === 'function') {
            render();
        } else {
            console.warn('[CALENDAR] Global render() function not available');
        }
    } catch (error) {
        safeHandleError(error, {
            context: 'safeRender',
            userMessage: 'Failed to refresh calendar display',
            severity: 'medium',
            silent: true
        });
    }
}

/**
 * Validate date object
 * @param {Date} date - Date to validate
 * @returns {boolean} True if date is valid
 */
function isValidDate(date) {
    try {
        return date instanceof Date && !isNaN(date.getTime());
    } catch (error) {
        return false;
    }
}

/**
 * Parse date string safely
 * @param {string} dateStr - Date string to parse
 * @returns {Date|null} Parsed date or null if invalid
 */
function safeParseDateString(dateStr) {
    try {
        if (!dateStr || typeof dateStr !== 'string') {
            return null;
        }
        
        const date = new Date(dateStr);
        return isValidDate(date) ? date : null;
    } catch (error) {
        console.warn('[CALENDAR] Date parsing failed:', dateStr, error);
        return null;
    }
}

// ========================================
// CALENDAR MANAGER - ENHANCED
// ========================================

const CalendarManager = {
    currentDate: new Date(),
    selectedDate: null,
    view: 'month', // 'month', 'week', 'day'
    
    /**
     * ENHANCED: Main calendar render function with error handling
     */
    renderCalendar() {
        try {
            // Validate current date
            if (!isValidDate(this.currentDate)) {
                console.warn('[CALENDAR] Invalid currentDate, resetting to today');
                this.currentDate = new Date();
            }
            
            const monthName = this.currentDate.toLocaleString('default', { 
                month: 'long', 
                year: 'numeric' 
            });
            
            return `
                <div class="calendar-container p-6">
                    <!-- Calendar Header -->
                    <div class="flex items-center justify-between mb-6">
                        <div>
                            <h2 class="text-white text-3xl font-bold">${monthName}</h2>
                            <p class="text-white text-sm opacity-75">View all events and tasks</p>
                        </div>
                        <div class="flex gap-3">
                            <button class="btn btn-secondary" onclick="CalendarManager.previousMonth()">
                                ← Previous
                            </button>
                            <button class="btn btn-primary" onclick="CalendarManager.goToToday()">
                                Today
                            </button>
                            <button class="btn btn-secondary" onclick="CalendarManager.nextMonth()">
                                Next →
                            </button>
                        </div>
                    </div>
                    
                    <!-- Calendar Grid -->
                    ${this.renderMonthView()}
                    
                    <!-- Event List for Selected Date -->
                    ${this.renderEventList()}
                </div>
            `;
        } catch (error) {
            safeHandleError(error, {
                context: 'CalendarManager.renderCalendar',
                userMessage: 'Failed to render calendar',
                severity: 'high',
                silent: false,
                metadata: {
                    currentDate: this.currentDate?.toISOString(),
                    selectedDate: this.selectedDate?.toISOString()
                }
            });
            
            return `
                <div class="calendar-container p-6">
                    <div class="glass-card p-12 text-center">
                        <div class="text-6xl mb-4">⚠️</div>
                        <h3 class="text-white text-2xl font-bold mb-2">Calendar Error</h3>
                        <p class="text-white opacity-75">Unable to render calendar</p>
                    </div>
                </div>
            `;
        }
    },
    
    /**
     * ENHANCED: Render month view calendar grid with error handling
     */
    renderMonthView() {
        try {
            // Validate current date
            if (!isValidDate(this.currentDate)) {
                throw new Error('Invalid current date');
            }
            
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth();
            
            // Validate year and month
            if (typeof year !== 'number' || typeof month !== 'number' || 
                month < 0 || month > 11) {
                throw new Error('Invalid year or month');
            }
            
            // Get first day of month and number of days
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            
            if (!isValidDate(firstDay) || !isValidDate(lastDay)) {
                throw new Error('Failed to calculate month boundaries');
            }
            
            const daysInMonth = lastDay.getDate();
            const startingDayOfWeek = firstDay.getDay();
            
            // Get events for this month
            const events = this.getEventsForMonth(year, month);
            
            // Build calendar grid
            let html = `
                <div class="calendar-grid">
                    <!-- Day headers -->
                    <div class="grid grid-cols-7 gap-2 mb-4">
                        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `
                            <div class="text-center text-white font-semibold py-2">${day}</div>
                        `).join('')}
                    </div>
                    
                    <!-- Calendar days -->
                    <div class="grid grid-cols-7 gap-2">
            `;
            
            // Empty cells for days before month starts
            for (let i = 0; i < startingDayOfWeek; i++) {
                html += `<div class="calendar-day-empty"></div>`;
            }
            
            // Days of the month
            for (let day = 1; day <= daysInMonth; day++) {
                try {
                    const date = new Date(year, month, day);
                    if (!isValidDate(date)) {
                        console.warn(`[CALENDAR] Invalid date: ${year}-${month}-${day}`);
                        continue;
                    }
                    
                    const dateStr = this.formatDate(date);
                    const dayEvents = events.filter(e => e && e.date === dateStr);
                    const isToday = this.isToday(date);
                    const isSelected = this.selectedDate && 
                                      isValidDate(this.selectedDate) && 
                                      this.formatDate(this.selectedDate) === dateStr;
                    
                    html += `
                        <div class="calendar-day ${isToday ? 'calendar-day-today' : ''} ${isSelected ? 'calendar-day-selected' : ''}"
                             onclick="CalendarManager.selectDate(new Date(${year}, ${month}, ${day}))">
                            <div class="calendar-day-number">${day}</div>
                            ${dayEvents.length > 0 ? `
                                <div class="calendar-day-events">
                                    ${dayEvents.slice(0, 3).map(event => `
                                        <div class="calendar-event" style="background: ${event.color || 'rgba(155, 89, 182, 0.8)'}">
                                            ${event.icon || '📅'} ${event.title || 'Event'}
                                        </div>
                                    `).join('')}
                                    ${dayEvents.length > 3 ? `
                                        <div class="text-white text-xs opacity-75 mt-1">
                                            +${dayEvents.length - 3} more
                                        </div>
                                    ` : ''}
                                </div>
                            ` : ''}
                        </div>
                    `;
                } catch (dayError) {
                    console.warn(`[CALENDAR] Error rendering day ${day}:`, dayError);
                }
            }
            
            html += `
                    </div>
                </div>
            `;
            
            return html;
            
        } catch (error) {
            safeHandleError(error, {
                context: 'CalendarManager.renderMonthView',
                userMessage: 'Failed to render calendar grid',
                severity: 'high',
                silent: true,
                metadata: {
                    currentDate: this.currentDate?.toISOString()
                }
            });
            
            return '<div class="text-white text-center p-6">Calendar grid unavailable</div>';
        }
    },
    
    /**
     * ENHANCED: Render event list for selected date with error handling
     */
    renderEventList() {
        try {
            if (!this.selectedDate || !isValidDate(this.selectedDate)) {
                return '';
            }
            
            const dateStr = this.formatDate(this.selectedDate);
            const events = this.getEventsForDate(dateStr);
            
            const formattedDate = this.selectedDate.toLocaleDateString('default', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            return `
                <div class="mt-8 glass-card p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-white text-xl font-bold">
                            Events for ${formattedDate}
                        </h3>
                        <button class="btn btn-primary btn-sm" onclick="CalendarManager.clearSelection()">
                            Clear Selection
                        </button>
                    </div>
                    
                    ${events.length === 0 ? `
                        <div class="text-center text-white opacity-75 py-8">
                            <div class="text-4xl mb-2">📅</div>
                            <p>No events scheduled for this day</p>
                        </div>
                    ` : `
                        <div class="space-y-3">
                            ${events.map(event => {
                                if (!event) return '';
                                return `
                                    <div class="glass-card p-4 cursor-pointer hover:bg-white hover:bg-opacity-10 transition-all"
                                         ${event.action ? `onclick="${event.action}"` : ''}>
                                        <div class="flex items-start gap-3">
                                            <div class="text-3xl">${event.icon || '📅'}</div>
                                            <div class="flex-1">
                                                <h4 class="text-white font-semibold">${event.title || 'Untitled Event'}</h4>
                                                <p class="text-white text-sm opacity-75">${event.description || 'No description'}</p>
                                                <div class="flex gap-2 mt-2">
                                                    <span class="status-badge" style="background: ${event.color || 'rgba(155, 89, 182, 0.8)'}">
                                                        ${event.type || 'Event'}
                                                    </span>
                                                    ${event.priority ? `
                                                        <span class="status-badge ${
                                                            event.priority === 'High' ? 'badge-high' : 
                                                            event.priority === 'Medium' ? 'badge-medium' : 'badge-low'
                                                        }">${event.priority}</span>
                                                    ` : ''}
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
                context: 'CalendarManager.renderEventList',
                userMessage: 'Failed to render event list',
                severity: 'medium',
                silent: true,
                metadata: {
                    selectedDate: this.selectedDate?.toISOString()
                }
            });
            
            return '';
        }
    },
    
    /**
     * ENHANCED: Get all events for a specific month with error handling
     */
    getEventsForMonth(year, month) {
        const events = [];
        
        try {
            // Validate inputs
            if (typeof year !== 'number' || typeof month !== 'number') {
                throw new Error('Invalid year or month parameters');
            }
            
            if (month < 0 || month > 11) {
                throw new Error('Month must be between 0 and 11');
            }
            
            const selectedCompany = getSelectedCompany();
            if (!selectedCompany) {
                console.warn('[CALENDAR] No company selected');
                return events;
            }
            
            // Get tasks with due dates
            try {
                const allTasks = getAppStateData('generalTodos');
                const tasks = allTasks.filter(t => 
                    t && t.company === selectedCompany && t.dueDate
                );
                
                tasks.forEach(task => {
                    try {
                        const taskDate = safeParseDateString(task.dueDate);
                        if (!taskDate) {
                            console.warn('[CALENDAR] Invalid task due date:', task.dueDate);
                            return;
                        }
                        
                        if (taskDate.getFullYear() === year && taskDate.getMonth() === month) {
                            events.push({
                                date: this.formatDate(taskDate),
                                title: task.name || 'Untitled Task',
                                description: `Task: ${task.name || 'Untitled'}`,
                                type: 'Task',
                                icon: '✅',
                                color: task.priority === 'High' ? 'rgba(255, 107, 107, 0.8)' : 
                                       task.priority === 'Low' ? 'rgba(46, 204, 113, 0.8)' : 
                                       'rgba(247, 183, 49, 0.8)',
                                priority: task.priority,
                                action: task.id ? `CRUDManager.showEditTaskForm('${task.id}', 'general')` : null
                            });
                        }
                    } catch (taskError) {
                        console.warn('[CALENDAR] Error processing task:', taskError);
                    }
                });
            } catch (tasksError) {
                console.warn('[CALENDAR] Error loading tasks:', tasksError);
            }
            
            // Get leads with due dates
            try {
                const allLeads = getAppStateData('leads');
                const leads = allLeads.filter(l => 
                    l && l.company === selectedCompany && l.dueDate
                );
                
                leads.forEach(lead => {
                    try {
                        const leadDate = safeParseDateString(lead.dueDate);
                        if (!leadDate) {
                            console.warn('[CALENDAR] Invalid lead due date:', lead.dueDate);
                            return;
                        }
                        
                        if (leadDate.getFullYear() === year && leadDate.getMonth() === month) {
                            events.push({
                                date: this.formatDate(leadDate),
                                title: lead.name || 'Untitled Lead',
                                description: `Lead: ${lead.name || 'Untitled'}`,
                                type: 'Lead',
                                icon: '🎯',
                                color: 'rgba(52, 152, 219, 0.8)',
                                priority: lead.priority,
                                action: lead.id ? `CRUDManager.showEditLeadForm('${lead.id}')` : null
                            });
                        }
                    } catch (leadError) {
                        console.warn('[CALENDAR] Error processing lead:', leadError);
                    }
                });
            } catch (leadsError) {
                console.warn('[CALENDAR] Error loading leads:', leadsError);
            }
            
            // Get clients with follow-up dates
            try {
                const allClients = getAppStateData('clients');
                const clients = allClients.filter(c => 
                    c && c.company === selectedCompany && c.nextFollowUpDate
                );
                
                clients.forEach(client => {
                    try {
                        const followUpDate = safeParseDateString(client.nextFollowUpDate);
                        if (!followUpDate) {
                            console.warn('[CALENDAR] Invalid client follow-up date:', client.nextFollowUpDate);
                            return;
                        }
                        
                        if (followUpDate.getFullYear() === year && followUpDate.getMonth() === month) {
                            events.push({
                                date: this.formatDate(followUpDate),
                                title: client.name || 'Untitled Client',
                                description: `Follow-up: ${client.name || 'Untitled'}`,
                                type: 'Follow-up',
                                icon: '💼',
                                color: 'rgba(155, 89, 182, 0.8)',
                                action: client.id ? `CRUDManager.showEditClientForm('${client.id}')` : null
                            });
                        }
                    } catch (clientError) {
                        console.warn('[CALENDAR] Error processing client:', clientError);
                    }
                });
            } catch (clientsError) {
                console.warn('[CALENDAR] Error loading clients:', clientsError);
            }
            
            // Sort events by date
            try {
                return events.sort((a, b) => {
                    try {
                        const dateA = new Date(a.date);
                        const dateB = new Date(b.date);
                        return dateA - dateB;
                    } catch (sortError) {
                        return 0;
                    }
                });
            } catch (sortError) {
                console.warn('[CALENDAR] Error sorting events:', sortError);
                return events;
            }
            
        } catch (error) {
            safeHandleError(error, {
                context: 'CalendarManager.getEventsForMonth',
                userMessage: 'Failed to load calendar events',
                severity: 'medium',
                silent: true,
                metadata: {
                    year: year,
                    month: month,
                    selectedCompany: getSelectedCompany()
                }
            });
            
            return events;
        }
    },
    
    /**
     * ENHANCED: Get events for a specific date with error handling
     */
    getEventsForDate(dateStr) {
        try {
            if (!dateStr || typeof dateStr !== 'string') {
                console.warn('[CALENDAR] Invalid date string provided');
                return [];
            }
            
            const date = safeParseDateString(dateStr);
            if (!date) {
                console.warn('[CALENDAR] Failed to parse date string:', dateStr);
                return [];
            }
            
            const year = date.getFullYear();
            const month = date.getMonth();
            
            const allEvents = this.getEventsForMonth(year, month);
            return allEvents.filter(event => event && event.date === dateStr);
            
        } catch (error) {
            safeHandleError(error, {
                context: 'CalendarManager.getEventsForDate',
                userMessage: 'Failed to load events for selected date',
                severity: 'low',
                silent: true,
                metadata: {
                    dateStr: dateStr
                }
            });
            
            return [];
        }
    }
};

// ========================================
    // NAVIGATION METHODS - ENHANCED
    // ========================================
    
    /**
     * ENHANCED: Navigate to previous month with error handling
     */
    previousMonth() {
        try {
            if (!isValidDate(this.currentDate)) {
                console.warn('[CALENDAR] Invalid currentDate, resetting to today');
                this.currentDate = new Date();
            }
            
            // Create new date to avoid mutation issues
            const newDate = new Date(this.currentDate);
            newDate.setMonth(newDate.getMonth() - 1);
            
            if (!isValidDate(newDate)) {
                throw new Error('Failed to calculate previous month');
            }
            
            this.currentDate = newDate;
            safeRender();
            
            console.log('[CALENDAR] Navigated to previous month:', this.currentDate.toISOString());
            
        } catch (error) {
            safeHandleError(error, {
                context: 'CalendarManager.previousMonth',
                userMessage: 'Failed to navigate to previous month',
                severity: 'medium',
                silent: false,
                metadata: {
                    currentDate: this.currentDate?.toISOString()
                }
            });
        }
    },
    
    /**
     * ENHANCED: Navigate to next month with error handling
     */
    nextMonth() {
        try {
            if (!isValidDate(this.currentDate)) {
                console.warn('[CALENDAR] Invalid currentDate, resetting to today');
                this.currentDate = new Date();
            }
            
            // Create new date to avoid mutation issues
            const newDate = new Date(this.currentDate);
            newDate.setMonth(newDate.getMonth() + 1);
            
            if (!isValidDate(newDate)) {
                throw new Error('Failed to calculate next month');
            }
            
            this.currentDate = newDate;
            safeRender();
            
            console.log('[CALENDAR] Navigated to next month:', this.currentDate.toISOString());
            
        } catch (error) {
            safeHandleError(error, {
                context: 'CalendarManager.nextMonth',
                userMessage: 'Failed to navigate to next month',
                severity: 'medium',
                silent: false,
                metadata: {
                    currentDate: this.currentDate?.toISOString()
                }
            });
        }
    },
    
    /**
     * ENHANCED: Go to today with error handling
     */
    goToToday() {
        try {
            this.currentDate = new Date();
            this.selectedDate = new Date();
            
            if (!isValidDate(this.currentDate) || !isValidDate(this.selectedDate)) {
                throw new Error('Failed to set today\'s date');
            }
            
            safeRender();
            
            console.log('[CALENDAR] Navigated to today');
            
        } catch (error) {
            safeHandleError(error, {
                context: 'CalendarManager.goToToday',
                userMessage: 'Failed to navigate to today',
                severity: 'medium',
                silent: false
            });
        }
    },
    
    /**
     * ENHANCED: Select date with error handling
     */
    selectDate(date) {
        try {
            if (!date) {
                throw new Error('No date provided');
            }
            
            // Ensure date is a Date object
            if (!(date instanceof Date)) {
                console.warn('[CALENDAR] Converting to Date object');
                date = new Date(date);
            }
            
            if (!isValidDate(date)) {
                throw new Error('Invalid date provided');
            }
            
            this.selectedDate = date;
            safeRender();
            
            console.log('[CALENDAR] Date selected:', date.toISOString());
            
        } catch (error) {
            safeHandleError(error, {
                context: 'CalendarManager.selectDate',
                userMessage: 'Failed to select date',
                severity: 'low',
                silent: true,
                metadata: {
                    date: date?.toString()
                }
            });
        }
    },
    
    /**
     * ENHANCED: Clear selection with error handling
     */
    clearSelection() {
        try {
            this.selectedDate = null;
            safeRender();
            
            console.log('[CALENDAR] Selection cleared');
            
        } catch (error) {
            safeHandleError(error, {
                context: 'CalendarManager.clearSelection',
                userMessage: 'Failed to clear selection',
                severity: 'low',
                silent: true
            });
        }
    },
    
    // ========================================
    // HELPER METHODS - ENHANCED
    // ========================================
    
    /**
     * ENHANCED: Format date as YYYY-MM-DD with error handling
     */
    formatDate(date) {
        try {
            if (!date) {
                throw new Error('No date provided');
            }
            
            if (!(date instanceof Date)) {
                date = new Date(date);
            }
            
            if (!isValidDate(date)) {
                throw new Error('Invalid date');
            }
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
            
        } catch (error) {
            console.error('[CALENDAR] Date formatting failed:', error);
            return '1970-01-01'; // Safe fallback
        }
    },
    
    /**
     * ENHANCED: Check if date is today with error handling
     */
    isToday(date) {
        try {
            if (!date || !(date instanceof Date)) {
                return false;
            }
            
            if (!isValidDate(date)) {
                return false;
            }
            
            const today = new Date();
            
            return date.getDate() === today.getDate() &&
                   date.getMonth() === today.getMonth() &&
                   date.getFullYear() === today.getFullYear();
                   
        } catch (error) {
            console.error('[CALENDAR] isToday check failed:', error);
            return false;
        }
    },
    
    // ========================================
    // EXPORT & ADVANCED FEATURES - ENHANCED
    // ========================================
    
    /**
     * ENHANCED: Export calendar to iCal format with error handling
     */
    exportToICal() {
        try {
            if (!isValidDate(this.currentDate)) {
                throw new Error('Invalid current date');
            }
            
            const events = this.getEventsForMonth(
                this.currentDate.getFullYear(), 
                this.currentDate.getMonth()
            );
            
            if (events.length === 0) {
                safeShowToast('⚠️ No events to export for this month', 'warning');
                return;
            }
            
            // Build iCal content
            let ical = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//CRM Dashboard//EN\n';
            
            events.forEach(event => {
                try {
                    if (!event || !event.date) return;
                    
                    ical += 'BEGIN:VEVENT\n';
                    ical += `DTSTART:${event.date.replace(/-/g, '')}\n`;
                    ical += `SUMMARY:${(event.title || 'Untitled Event').replace(/\n/g, ' ')}\n`;
                    ical += `DESCRIPTION:${(event.description || 'No description').replace(/\n/g, ' ')}\n`;
                    ical += 'END:VEVENT\n';
                } catch (eventError) {
                    console.warn('[CALENDAR] Failed to export event:', eventError);
                }
            });
            
            ical += 'END:VCALENDAR';
            
            // Create and download file
            try {
                const blob = new Blob([ical], { type: 'text/calendar' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `calendar-${this.formatDate(this.currentDate)}.ics`;
                link.click();
                
                // Cleanup
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                }, 100);
                
                console.log('[CALENDAR] Calendar exported successfully');
                safeShowToast(`✅ Calendar exported: ${events.length} events`, 'success');
                
            } catch (downloadError) {
                throw new Error('Failed to create download: ' + downloadError.message);
            }
            
        } catch (error) {
            safeHandleError(error, {
                context: 'CalendarManager.exportToICal',
                userMessage: 'Failed to export calendar. Please try again.',
                severity: 'medium',
                silent: false,
                metadata: {
                    currentDate: this.currentDate?.toISOString()
                }
            });
        }
    },
    
    /**
     * ENHANCED: Get upcoming events with error handling
     */
    getUpcomingEvents(days = 7) {
        try {
            // Validate days parameter
            if (typeof days !== 'number' || days < 1 || days > 365) {
                console.warn('[CALENDAR] Invalid days parameter, using default 7');
                days = 7;
            }
            
            const today = new Date();
            const futureDate = new Date();
            futureDate.setDate(today.getDate() + days);
            
            if (!isValidDate(today) || !isValidDate(futureDate)) {
                throw new Error('Failed to calculate date range');
            }
            
            const allEvents = [];
            
            // Iterate through date range
            for (let d = new Date(today); d <= futureDate; d.setDate(d.getDate() + 1)) {
                try {
                    const dateStr = this.formatDate(d);
                    const events = this.getEventsForDate(dateStr);
                    
                    if (Array.isArray(events) && events.length > 0) {
                        allEvents.push(...events);
                    }
                } catch (dateError) {
                    console.warn('[CALENDAR] Error processing date in range:', dateError);
                }
            }
            
            console.log(`[CALENDAR] Found ${allEvents.length} upcoming events in next ${days} days`);
            return allEvents;
            
        } catch (error) {
            safeHandleError(error, {
                context: 'CalendarManager.getUpcomingEvents',
                userMessage: 'Failed to load upcoming events',
                severity: 'low',
                silent: true,
                metadata: {
                    days: days
                }
            });
            
            return [];
        }
    },
    
    /**
     * Reset calendar to initial state
     */
    reset() {
        try {
            this.currentDate = new Date();
            this.selectedDate = null;
            this.view = 'month';
            
            console.log('[CALENDAR] Reset to initial state');
            
        } catch (error) {
            console.error('[CALENDAR] Reset failed:', error);
        }
    },
    
    /**
     * Validate calendar state
     */
    validateState() {
        const validation = {
            valid: true,
            errors: [],
            warnings: []
        };
        
        try {
            // Check current date
            if (!isValidDate(this.currentDate)) {
                validation.valid = false;
                validation.errors.push('Invalid current date');
            }
            
            // Check selected date if set
            if (this.selectedDate && !isValidDate(this.selectedDate)) {
                validation.warnings.push('Invalid selected date');
                this.selectedDate = null;
            }
            
            // Check AppState
            if (!isAppStateAvailable()) {
                validation.warnings.push('AppState not available');
            }
            
            // Check selected company
            if (!getSelectedCompany()) {
                validation.warnings.push('No company selected');
            }
            
        } catch (error) {
            validation.valid = false;
            validation.errors.push('Error during validation: ' + error.message);
        }
        
        return validation;
    }
};

// ========================================
// STYLE INJECTION - ENHANCED
// ========================================

/**
 * Inject calendar styles safely
 */
function injectCalendarStyles() {
    try {
        // Check if styles already injected
        if (document.getElementById('calendar-styles')) {
            console.log('[CALENDAR] Styles already injected');
            return;
        }
        
        const calendarStyles = `
        <style id="calendar-styles">
        .calendar-grid {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 20px;
        }

        .calendar-day {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 12px;
            min-height: 120px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .calendar-day:hover {
            background: rgba(255, 255, 255, 0.15);
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }

        .calendar-day-empty {
            min-height: 120px;
        }

        .calendar-day-today {
            background: rgba(52, 152, 219, 0.3);
            border-color: rgba(52, 152, 219, 0.6);
            box-shadow: 0 0 20px rgba(52, 152, 219, 0.4);
        }

        .calendar-day-selected {
            background: rgba(155, 89, 182, 0.3);
            border-color: rgba(155, 89, 182, 0.6);
            box-shadow: 0 0 20px rgba(155, 89, 182, 0.4);
        }

        .calendar-day-number {
            color: white;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 8px;
        }

        .calendar-day-events {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .calendar-event {
            color: white;
            font-size: 11px;
            padding: 4px 6px;
            border-radius: 6px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        @media (max-width: 768px) {
            .calendar-day {
                min-height: 80px;
                padding: 8px;
            }
            
            .calendar-day-number {
                font-size: 14px;
            }
            
            .calendar-event {
                font-size: 9px;
                padding: 2px 4px;
            }
        }
        </style>
        `;
        
        // Check if document and head exist
        if (!document || !document.head) {
            throw new Error('Document or document.head not available');
        }
        
        document.head.insertAdjacentHTML('beforeend', calendarStyles);
        console.log('[CALENDAR] Styles injected successfully');
        
    } catch (error) {
        console.error('[CALENDAR] Failed to inject styles:', error);
        // Don't throw - calendar can work without custom styles
    }
}

// ========================================
// INITIALIZATION - ENHANCED
// ========================================

/**
 * Initialize calendar with validation
 */
function initializeCalendar() {
    try {
        console.log('[CALENDAR] Initializing Calendar Manager...');
        
        // Validate initial state
        const validation = CalendarManager.validateState();
        
        if (!validation.valid) {
            console.error('[CALENDAR] Calendar state invalid:', validation.errors);
            CalendarManager.reset();
        }
        
        if (validation.warnings.length > 0) {
            console.warn('[CALENDAR] Calendar warnings:', validation.warnings);
        }
        
        // Inject styles
        injectCalendarStyles();
        
        console.log('[CALENDAR] Calendar initialized successfully');
        return true;
        
    } catch (error) {
        safeHandleError(error, {
            context: 'initializeCalendar',
            userMessage: 'Failed to initialize calendar',
            severity: 'medium',
            silent: false
        });
        return false;
    }
}

// ========================================
// EVENT LISTENERS
// ========================================

// Inject styles when DOM is ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectCalendarStyles();
        });
    } else {
        // DOM already loaded
        injectCalendarStyles();
    }
}

// ========================================
// GLOBAL EXPOSURE
// ========================================

// Expose CalendarManager globally
if (typeof window !== 'undefined') {
    window.CalendarManager = CalendarManager;
    window.initializeCalendar = initializeCalendar;
}

// ========================================
// INITIALIZATION
// ========================================

console.log('✅ Calendar Manager loaded - Enhanced Error Handling');
console.log('📅 AppState available:', isAppStateAvailable());
console.log('📋 Current date:', CalendarManager.currentDate.toISOString());

// ========================================
// END OF FILE: js/calendar.js
// ========================================