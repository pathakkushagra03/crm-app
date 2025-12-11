// ========================================
// CALENDAR MANAGEMENT
// ========================================

const CalendarManager = {
    currentDate: new Date(),
    selectedDate: null,
    view: 'month', // 'month', 'week', 'day'
    
    /**
     * Main calendar render function
     */
    renderCalendar() {
        const monthName = this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        
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
    },
    
    /**
     * Render month view calendar grid
     */
    renderMonthView() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
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
            const date = new Date(year, month, day);
            const dateStr = this.formatDate(date);
            const dayEvents = events.filter(e => e.date === dateStr);
            const isToday = this.isToday(date);
            const isSelected = this.selectedDate && this.formatDate(this.selectedDate) === dateStr;
            
            html += `
                <div class="calendar-day ${isToday ? 'calendar-day-today' : ''} ${isSelected ? 'calendar-day-selected' : ''}"
                     onclick="CalendarManager.selectDate(new Date(${year}, ${month}, ${day}))">
                    <div class="calendar-day-number">${day}</div>
                    ${dayEvents.length > 0 ? `
                        <div class="calendar-day-events">
                            ${dayEvents.slice(0, 3).map(event => `
                                <div class="calendar-event" style="background: ${event.color}">
                                    ${event.icon} ${event.title}
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
        }
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    },
    
    /**
     * Render event list for selected date
     */
    renderEventList() {
        if (!this.selectedDate) return '';
        
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
                        ${events.map(event => `
                            <div class="glass-card p-4 cursor-pointer hover:bg-white hover:bg-opacity-10 transition-all"
                                 onclick="${event.action}">
                                <div class="flex items-start gap-3">
                                    <div class="text-3xl">${event.icon}</div>
                                    <div class="flex-1">
                                        <h4 class="text-white font-semibold">${event.title}</h4>
                                        <p class="text-white text-sm opacity-75">${event.description}</p>
                                        <div class="flex gap-2 mt-2">
                                            <span class="status-badge" style="background: ${event.color}">
                                                ${event.type}
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
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    },
    
    /**
     * Get all events for a specific month
     */
    getEventsForMonth(year, month) {
        const events = [];
        
        if (!AppState.selectedCompany) return events;
        
        // Get tasks with due dates
        const tasks = AppState.data.generalTodos.filter(t => 
            t.company === AppState.selectedCompany && t.dueDate
        );
        
        tasks.forEach(task => {
            const taskDate = new Date(task.dueDate);
            if (taskDate.getFullYear() === year && taskDate.getMonth() === month) {
                events.push({
                    date: this.formatDate(taskDate),
                    title: task.name,
                    description: `Task: ${task.name}`,
                    type: 'Task',
                    icon: '✅',
                    color: task.priority === 'High' ? 'rgba(255, 107, 107, 0.8)' : 
                           task.priority === 'Low' ? 'rgba(46, 204, 113, 0.8)' : 
                           'rgba(247, 183, 49, 0.8)',
                    priority: task.priority,
                    action: `CRUDManager.showEditTaskForm('${task.id}')`
                });
            }
        });
        
        // Get leads with due dates
        const leads = AppState.data.leads.filter(l => 
            l.company === AppState.selectedCompany && l.dueDate
        );
        
        leads.forEach(lead => {
            const leadDate = new Date(lead.dueDate);
            if (leadDate.getFullYear() === year && leadDate.getMonth() === month) {
                events.push({
                    date: this.formatDate(leadDate),
                    title: lead.name,
                    description: `Lead: ${lead.name}`,
                    type: 'Lead',
                    icon: '🎯',
                    color: 'rgba(52, 152, 219, 0.8)',
                    priority: lead.priority,
                    action: `CRUDManager.showEditLeadForm('${lead.id}')`
                });
            }
        });
        
        // Get clients with follow-up dates
        const clients = AppState.data.clients.filter(c => 
            c.company === AppState.selectedCompany && c.nextFollowUpDate
        );
        
        clients.forEach(client => {
            const followUpDate = new Date(client.nextFollowUpDate);
            if (followUpDate.getFullYear() === year && followUpDate.getMonth() === month) {
                events.push({
                    date: this.formatDate(followUpDate),
                    title: client.name,
                    description: `Follow-up: ${client.name}`,
                    type: 'Follow-up',
                    icon: '💼',
                    color: 'rgba(155, 89, 182, 0.8)',
                    action: `CRUDManager.showEditClientForm('${client.id}')`
                });
            }
        });
        
        return events.sort((a, b) => new Date(a.date) - new Date(b.date));
    },
    
    /**
     * Get events for a specific date
     */
    getEventsForDate(dateStr) {
        const year = new Date(dateStr).getFullYear();
        const month = new Date(dateStr).getMonth();
        const allEvents = this.getEventsForMonth(year, month);
        
        return allEvents.filter(event => event.date === dateStr);
    },
    
    /**
     * Navigation methods
     */
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        render();
    },
    
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        render();
    },
    
    goToToday() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        render();
    },
    
    selectDate(date) {
        this.selectedDate = date;
        render();
    },
    
    clearSelection() {
        this.selectedDate = null;
        render();
    },
    
    /**
     * Helper methods
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    },
    
    /**
     * Export calendar to iCal format
     */
    exportToICal() {
        const events = this.getEventsForMonth(
            this.currentDate.getFullYear(), 
            this.currentDate.getMonth()
        );
        
        let ical = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//CRM Dashboard//EN\n';
        
        events.forEach(event => {
            ical += 'BEGIN:VEVENT\n';
            ical += `DTSTART:${event.date.replace(/-/g, '')}\n`;
            ical += `SUMMARY:${event.title}\n`;
            ical += `DESCRIPTION:${event.description}\n`;
            ical += 'END:VEVENT\n';
        });
        
        ical += 'END:VCALENDAR';
        
        const blob = new Blob([ical], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'calendar.ics';
        link.click();
        URL.revokeObjectURL(url);
    },
    
    /**
     * Get upcoming events (next 7 days)
     */
    getUpcomingEvents(days = 7) {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);
        
        const allEvents = [];
        for (let d = new Date(today); d <= futureDate; d.setDate(d.getDate() + 1)) {
            const events = this.getEventsForDate(this.formatDate(d));
            allEvents.push(...events);
        }
        
        return allEvents;
    }
};

// Add calendar-specific CSS styles dynamically
const calendarStyles = `
<style>
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

// Inject styles on load
document.addEventListener('DOMContentLoaded', () => {
    document.head.insertAdjacentHTML('beforeend', calendarStyles);
});

console.log('✅ Calendar Manager loaded');