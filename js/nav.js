// ========================================
// NAVIGATION UTILITIES
// ========================================

const NavigationManager = {
    
    /**
     * Breadcrumb navigation
     */
    renderBreadcrumbs() {
        const breadcrumbs = [];
        
        if (AppState.selectedCompany) {
            const company = AppState.data.companies.find(c => c.id === AppState.selectedCompany);
            if (company) {
                breadcrumbs.push({ label: company.name, view: 'dashboard' });
            }
        }
        
        const viewNames = {
            'companySelection': 'Companies',
            'dashboard': 'Dashboard',
            'clients': 'Clients',
            'leads': 'Leads',
            'tasks': 'Tasks',
            'calendar': 'Calendar',
            'userDashboard': 'User Dashboard'
        };
        
        if (AppState.currentView !== 'dashboard' && viewNames[AppState.currentView]) {
            breadcrumbs.push({ label: viewNames[AppState.currentView], view: AppState.currentView });
        }
        
        return breadcrumbs.map((crumb, index) => {
            if (index === breadcrumbs.length - 1) {
                return `<span class="text-white font-semibold">${crumb.label}</span>`;
            } else {
                return `<span class="text-white opacity-75 cursor-pointer hover:opacity-100" 
                              onclick="navigateTo('${crumb.view}', { selectedCompany: AppState.selectedCompany })">
                            ${crumb.label}
                        </span>`;
            }
        }).join(' <span class="text-white opacity-50 mx-2">/</span> ');
    },

    /**
     * Quick navigation menu
     */
    renderQuickNav() {
        if (!AppState.selectedCompany) return '';
        
        const items = [
            { icon: '💼', label: 'Clients', view: 'clients', count: AppState.data.clients.filter(c => c.company === AppState.selectedCompany).length },
            { icon: '🎯', label: 'Leads', view: 'leads', count: AppState.data.leads.filter(l => l.company === AppState.selectedCompany).length },
            { icon: '✅', label: 'Tasks', view: 'tasks', count: AppState.data.generalTodos.filter(t => t.company === AppState.selectedCompany).length }
        ];
        
        return `
            <div class="flex gap-3">
                ${items.map(item => `
                    <div class="glass-card px-4 py-2 cursor-pointer hover:scale-105 transition-transform flex items-center gap-2"
                         onclick="navigateTo('${item.view}', { selectedCompany: AppState.selectedCompany })">
                        <span class="text-2xl">${item.icon}</span>
                        <div>
                            <div class="text-white text-xs opacity-75">${item.label}</div>
                            <div class="text-white font-bold">${item.count}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Handle browser back/forward buttons
     */
    initBrowserNavigation() {
        window.addEventListener('popstate', (event) => {
            if (event.state) {
                AppState.currentView = event.state.view;
                Object.assign(AppState, event.state.data);
                render();
            }
        });
    },

    /**
     * Update browser history
     */
    updateBrowserHistory(view, data) {
        const state = { view, data };
        const title = `CRM - ${view.charAt(0).toUpperCase() + view.slice(1)}`;
        window.history.pushState(state, title, `#${view}`);
    },

    /**
     * Parse URL hash for deep linking
     */
    parseUrlHash() {
        const hash = window.location.hash.slice(1);
        if (hash && Views[hash]) {
            return hash;
        }
        return null;
    },

    /**
     * Keyboard shortcuts
     */
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt + B = Go Back
            if (e.altKey && e.key === 'b') {
                e.preventDefault();
                goBack();
            }
            
            // Alt + F = Go Forward
            if (e.altKey && e.key === 'f') {
                e.preventDefault();
                goForward();
            }
            
            // Alt + H = Go Home (Dashboard)
            if (e.altKey && e.key === 'h') {
                e.preventDefault();
                if (AppState.selectedCompany) {
                    navigateTo('dashboard', { selectedCompany: AppState.selectedCompany });
                }
            }
            
            // Alt + C = Clients
            if (e.altKey && e.key === 'c') {
                e.preventDefault();
                if (AppState.selectedCompany) {
                    navigateTo('clients', { selectedCompany: AppState.selectedCompany });
                }
            }
            
            // Alt + L = Leads
            if (e.altKey && e.key === 'l') {
                e.preventDefault();
                if (AppState.selectedCompany) {
                    navigateTo('leads', { selectedCompany: AppState.selectedCompany });
                }
            }
            
            // Alt + T = Tasks
            if (e.altKey && e.key === 't') {
                e.preventDefault();
                if (AppState.selectedCompany) {
                    navigateTo('tasks', { selectedCompany: AppState.selectedCompany });
                }
            }
        });
    },

    /**
     * Mobile menu toggle
     */
    toggleMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('mobile-open');
        }
    },

    /**
     * Search functionality
     */
    performSearch(query) {
        if (!query || query.length < 2) return [];
        
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        // Search clients
        AppState.data.clients
            .filter(c => c.company === AppState.selectedCompany)
            .forEach(client => {
                if (client.name.toLowerCase().includes(lowerQuery) || 
                    (client.email && client.email.toLowerCase().includes(lowerQuery))) {
                    results.push({
                        type: 'client',
                        icon: '💼',
                        title: client.name,
                        subtitle: client.email || 'Client',
                        action: () => CRUDManager.showEditClientForm(client.id)
                    });
                }
            });
        
        // Search leads
        AppState.data.leads
            .filter(l => l.company === AppState.selectedCompany)
            .forEach(lead => {
                if (lead.name.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        type: 'lead',
                        icon: '🎯',
                        title: lead.name,
                        subtitle: `Lead • ${lead.status}`,
                        action: () => CRUDManager.showEditLeadForm(lead.id)
                    });
                }
            });
        
        // Search tasks
        AppState.data.generalTodos
            .filter(t => t.company === AppState.selectedCompany)
            .forEach(task => {
                if (task.name.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        type: 'task',
                        icon: '✅',
                        title: task.name,
                        subtitle: `Task • ${task.status}`,
                        action: () => CRUDManager.showEditTaskForm(task.id)
                    });
                }
            });
        
        return results.slice(0, 10); // Limit to 10 results
    },

    /**
     * Show search modal
     */
    showSearchModal() {
        const modal = CRUDManager.createModal('Search', `
            <div>
                <input type="text" 
                       id="globalSearch" 
                       class="form-input" 
                       placeholder="Search clients, leads, tasks..." 
                       autofocus>
                <div id="searchResults" class="mt-4"></div>
            </div>
        `);
        
        document.body.appendChild(modal);
        
        const searchInput = document.getElementById('globalSearch');
        const resultsDiv = document.getElementById('searchResults');
        
        searchInput.addEventListener('input', (e) => {
            const results = this.performSearch(e.target.value);
            
            if (results.length === 0) {
                resultsDiv.innerHTML = '<div class="text-white opacity-75 text-center py-4">No results found</div>';
            } else {
                resultsDiv.innerHTML = results.map(result => `
                    <div class="glass-card p-3 mb-2 cursor-pointer hover:bg-white hover:bg-opacity-20 transition-all"
                         onclick="NavigationManager.handleSearchResult('${result.type}', '${result.title}')">
                        <div class="flex items-center gap-3">
                            <div class="text-2xl">${result.icon}</div>
                            <div class="flex-1">
                                <div class="text-white font-semibold">${result.title}</div>
                                <div class="text-white text-sm opacity-75">${result.subtitle}</div>
                            </div>
                        </div>
                    </div>
                `).join('');
                
                // Store results for click handling
                this.searchResults = results;
            }
        });
        
        // Ctrl/Cmd + K to close
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
            }
        });
    },

    /**
     * Handle search result click
     */
    handleSearchResult(type, title) {
        const result = this.searchResults.find(r => r.type === type && r.title === title);
        if (result) {
            result.action();
            document.querySelector('.modal-overlay').remove();
        }
    }
};

// Initialize navigation features on load
document.addEventListener('DOMContentLoaded', () => {
    NavigationManager.initBrowserNavigation();
    NavigationManager.initKeyboardShortcuts();
    
    // Global search shortcut (Ctrl/Cmd + K)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            NavigationManager.showSearchModal();
        }
    });
});

console.log('✅ Navigation Manager loaded');
console.log('💡 Keyboard shortcuts: Alt+B (Back), Alt+F (Forward), Alt+H (Home), Ctrl+K (Search)');