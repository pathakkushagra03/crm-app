/*
 * MAIN APPLICATION LOGIC
 * Updated to match new Airtable schema
 */

// ========================================
// STATE MANAGEMENT
// ========================================
const AppState = {
    currentView: 'companySelection',
    selectedCompany: null,
    selectedUser: null,
    currentUser: null,
    history: [],
    historyIndex: -1,
    loading: false,
    error: null,
    role: 'Admin',
    data: {
        companies: [],
        users: [],
        clients: [],
        leads: [],
        generalTodos: [],
        clientTodos: []
    },
    userSpecificData: null
};

if (typeof AirtableAPI === 'undefined') {
    console.warn('⚠️ AirtableAPI not loaded, creating fallback');
    window.AirtableAPI = {
        isConfigured: () => false,
        getCompanies: () => Promise.resolve({ records: [] }),
        getUsers: () => Promise.resolve({ records: [] }),
        getClients: () => Promise.resolve({ records: [] }),
        getLeads: () => Promise.resolve({ records: [] }),
        getGeneralTodos: () => Promise.resolve({ records: [] }),
        getClientTodos: () => Promise.resolve({ records: [] }),
        authenticateUser: () => Promise.resolve(null)
    };
}

// ========================================
// STATUS BADGE SYSTEM
// ========================================
const STATUS_CLASS_MAP = {
    lead: {
        'New': 'status-lead-new',
        'Contacted': 'status-lead-contacted',
        'Qualified': 'status-lead-qualified',
        'Proposal Sent': 'status-lead-proposal',
        'Won': 'status-lead-won',
        'Lost': 'status-lead-lost'
    },
    client: {
        'Active': 'status-client-active',
        'Inactive': 'status-client-inactive',
        'On Hold': 'status-client-onhold',
        'VIP': 'status-client-vip',
        'Churned': 'status-client-churned'
    }
};

const STATUS_ICONS = {
    lead: {
        'New': '🆕',
        'Contacted': '📞',
        'Qualified': '✅',
        'Proposal Sent': '📄',
        'Won': '🏆',
        'Lost': '❌'
    },
    client: {
        'Active': '✅',
        'Inactive': '⏸️',
        'On Hold': '⏳',
        'VIP': '⭐',
        'Churned': '💔'
    }
};
// ========================================
// PERMISSION HELPERS FOR UI
// ========================================

/**
 * Check if action button should be shown
 * @param {string} resource - 'companies', 'users', 'clients', 'leads', 'tasks'
 * @param {string} action - 'create', 'update', 'delete'
 * @returns {boolean}
 */
function canShowAction(resource, action) {
    if (typeof AuthManager === 'undefined' || !AuthManager.currentUser) {
        return false;
    }
    return AuthManager.hasDetailedPermission(resource, action);
}

/**
 * Render action button only if user has permission
 * @param {string} resource 
 * @param {string} action 
 * @param {string} buttonHTML - The button HTML to show
 * @returns {string} Button HTML or empty string
 */
function renderActionButton(resource, action, buttonHTML) {
    if (canShowAction(resource, action)) {
        return buttonHTML;
    }
    return ''; // Hide button
}

/**
 * Render role badge for current user
 * @returns {string} HTML badge
 */
function renderRoleBadge() {
    if (!AuthManager || !AuthManager.currentUser) return '';
    
    const role = AuthManager.currentUser.role;
    const badges = {
        'Admin': '👑 Admin',
        'Manager': '📊 Manager',
        'Sales': '💼 Sales',
        'User': '👤 User'
    };
    
    const colors = {
        'Admin': 'bg-red-500 bg-opacity-30 border-red-400',
        'Manager': 'bg-blue-500 bg-opacity-30 border-blue-400',
        'Sales': 'bg-green-500 bg-opacity-30 border-green-400',
        'User': 'bg-gray-500 bg-opacity-30 border-gray-400'
    };
    
    return `<span class="status-badge ${colors[role]}" style="font-size: 12px;">
                ${badges[role] || role}
            </span>`;
}

/**
 * Filter data based on user permissions
 * @param {string} resource 
 * @param {array} data 
 * @returns {array} Filtered data
 */
function getFilteredData(resource, data) {
    if (!AuthManager || !AuthManager.currentUser) return [];
    return AuthManager.getPermittedData(resource, data);
}
function renderStatusBadge(entityType, status, options = {}) {
    if (!status) return '';
    
    const classMap = STATUS_CLASS_MAP[entityType] || {};
    const iconMap = STATUS_ICONS[entityType] || {};
    
    const badgeClass = classMap[status] || 'status-badge';
    const icon = options.showIcon !== false ? (iconMap[status] || '') : '';
    const sizeClass = options.small ? 'status-badge-small' : '';
    
    return `<span class="status-badge ${badgeClass} ${sizeClass}" 
                  title="${entityType.charAt(0).toUpperCase() + entityType.slice(1)} status: ${status}"
                  aria-label="Status: ${status}">
              ${icon ? icon + ' ' : ''}${status}
            </span>`;
}

// ========================================
// NAVIGATION SYSTEM
// ========================================
function navigateTo(view, data = {}) {
    if (view !== AppState.currentView) {
        Pagination.reset(view);
    }
    
    AppState.history = AppState.history.slice(0, AppState.historyIndex + 1);
    AppState.history.push({ view, data });
    AppState.historyIndex++;
    
    AppState.currentView = view;
    Object.assign(AppState, data);
    
    // 👉 ADD: Smooth scroll to top
    UXUtils.scrollToTop();
    
    render();
}


function goBack() {
    if (AppState.historyIndex > 0) {
        AppState.historyIndex--;
        const historyItem = AppState.history[AppState.historyIndex];
        AppState.currentView = historyItem.view;
        Object.assign(AppState, historyItem.data);
        render();
    }
}

function goForward() {
    if (AppState.historyIndex < AppState.history.length - 1) {
        AppState.historyIndex++;
        const historyItem = AppState.history[AppState.historyIndex];
        AppState.currentView = historyItem.view;
        Object.assign(AppState, historyItem.data);
        render();
    }
}

// ========================================
// DATA LOADING
// ========================================
async function loadCompanies() {
    AppState.loading = true;
    render();

    try {
        if (AirtableAPI && AirtableAPI.isConfigured()) {
            const result = await AirtableAPI.getCompanies();
            AppState.data.companies = result.records || [];
        }

        // 🚑 DEMO FALLBACK (IMPORTANT)
        if (!AppState.data.companies || AppState.data.companies.length === 0) {
            AppState.data.companies = [
                { id: '1', name: 'Demo Company', color: '#667eea' }
            ];
        }

    } catch (error) {
        console.error('Company load failed, using demo data');

        AppState.data.companies = [
            { id: '1', name: 'Demo Company', color: '#667eea' }
        ];
    } finally {
        AppState.loading = false;
        render();
    }
}

async function loadCompanyData(companyId) {
    AppState.loading = true;
    
    // 👉 ADD: Show loading skeletons immediately
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="glass-card p-6">
                <div class="skeleton-line skeleton-title mb-6"></div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    ${LoadingSkeleton.renderCards(6)}
                </div>
            </div>
        `;
    }
    
    try {
        // 👉 ADD: Wrap with error handler
        await ErrorHandler.wrap(async () => {
            const [clients, leads, tasks] = await Promise.all([
                AirtableAPI.getClients(companyId),
                AirtableAPI.getLeads(companyId),
                AirtableAPI.getGeneralTodos(companyId)
            ]);
            
            AppState.data.clients = clients.records;
            AppState.data.leads = leads.records;
            AppState.data.generalTodos = tasks.records;
            
            // 👉 ADD: Show success toast
            ToastManager.loaded('company data');
            
        }, 'Loading company data');
        
    } catch (error) {
        // Error already handled by ErrorHandler.wrap()
        // Show error state in UI
        if (mainContent) {
            mainContent.innerHTML = EmptyState.error(
                'Failed to load company data. Please try again.'
            );
        }
    } finally {
        AppState.loading = false;
        render();
    }
}

async function loadUserData(userId) {
    AppState.loading = true;
    render();
    
    try {
        if (typeof AirtableAPI !== 'undefined' && AirtableAPI.isConfigured()) {
            const [clients, leads, todos] = await Promise.all([
                AirtableAPI.getUserClients(userId),
                AirtableAPI.getUserLeads(userId),
                AirtableAPI.getUserGeneralTodos(userId)
            ]);
            
            AppState.userSpecificData = {
                clients: clients.records,
                leads: leads.records,
                todos: todos.records
            };
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        AppState.error = 'Failed to load user data';
    } finally {
        AppState.loading = false;
        render();
    }
}

function generateDemoData() {
    AppState.data.companies = [
        { id: '1', name: 'Acme Corp', color: '#FF6B6B' },
        { id: '2', name: 'TechStart Inc', color: '#4ECDC4' },
        { id: '3', name: 'Global Solutions', color: '#45B7D1' }
    ];

    AppState.data.users = [
        { id: '1', name: 'John Doe', email: 'john@acme.com', phone: '555-0101', role: 'Admin', companies: ['1'], password: 'admin' },
        { id: '2', name: 'Jane Smith', email: 'jane@acme.com', phone: '555-0102', role: 'User', companies: ['1'], password: 'user' }
    ];

    AppState.data.clients = [
        { 
            id: '1', 
            name: 'Client Alpha', 
            status: 'Active', 
            email: 'alpha@test.com', 
            phone: '555-1001', 
            assignedUser: '1', 
            company: '1',
            priority: 'High',
            dealValue: 50000,
            rating: 5
        },
        { 
            id: '2', 
            name: 'Client Beta', 
            status: 'VIP', 
            email: 'beta@test.com', 
            phone: '555-1002', 
            assignedUser: '1', 
            company: '1',
            priority: 'Medium',
            dealValue: 75000,
            rating: 4
        }
    ];

    AppState.data.leads = [
        { id: '1', name: 'Lead A', status: 'New', assignedUser: '1', company: '1', priority: 'High', source: 'Website' },
        { id: '2', name: 'Lead B', status: 'Contacted', assignedUser: '2', company: '1', priority: 'Medium', source: 'Referral' }
    ];

    AppState.data.generalTodos = [
        { id: '1', name: 'Task 1', status: 'Pending', priority: 'High', dueDate: '2024-12-25', assignedUser: '1', company: '1' },
        { id: '2', name: 'Task 2', status: 'In Progress', priority: 'Medium', dueDate: '2024-12-26', assignedUser: '2', company: '1' }
    ];
    
    AppState.data.clientTodos = [
        { id: '1', name: 'Follow up with Client Alpha', status: 'Pending', priority: 'High', dueDate: '2024-12-20', assignedUser: '1', company: '1', client: '1' }
    ];
}

// ========================================
// VIEWS
// ========================================
const Views = {
    companySelection: () => {
    if (AppState.loading) {
        return `
            <div class="min-h-screen flex items-center justify-center">
                <div class="glass-card p-12 text-center fade-in">
                    <div class="text-white text-2xl">Loading...</div>
                </div>
            </div>
        `;
    }

    return `
        <div class="min-h-screen flex items-center justify-center p-6">
            <div class="glass-card p-12 max-w-4xl w-full fade-in">
                <div class="flex items-center justify-between mb-8">
                    <div>
                        <h1 class="text-4xl font-bold text-white fade-in">
                            Select Your Company
                        </h1>
                        ${renderRoleBadge()}
                    </div>
                    ${AuthManager.getUserDisplay()}
                </div>
                
                <!-- Show Add Company button ONLY if user has permission -->
                ${renderActionButton('companies', 'create', `
                    <div class="text-center mb-8">
                        <button class="btn btn-primary" onclick="if(typeof CRUDManager !== 'undefined') CRUDManager.showAddCompanyForm()">
                            ➕ Add Company
                        </button>
                    </div>
                `)}

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    ${AppState.data.companies.map((company, index) => `
                        <div class="company-card p-6 text-center fade-in relative group" 
                             style="animation-delay: ${index * 0.1}s">
                            <!-- Edit and Delete Buttons - ONLY for admins -->
                            ${canShowAction('companies', 'update') || canShowAction('companies', 'delete') ? `
                                <div class="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    ${renderActionButton('companies', 'update', `
                                        <button class="btn btn-secondary btn-sm p-2 text-xs" 
                                                onclick="event.stopPropagation(); CRUDManager.showEditCompanyForm('${company.id}')"
                                                title="Edit Company">
                                            ✏️
                                        </button>
                                    `)}
                                    ${renderActionButton('companies', 'delete', `
                                        <button class="btn btn-danger btn-sm p-2 text-xs" 
                                                onclick="event.stopPropagation(); CRUDManager.deleteCompany('${company.id}')"
                                                title="Delete Company">
                                            🗑️
                                        </button>
                                    `)}
                                </div>
                            ` : ''}
                            
                            <!-- Company Card Content (clickable to select) -->
                            <div onclick="selectCompany('${company.id}')">
                                ${company.photo ? 
                                    `<div class="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-white bg-opacity-10">
                                        <img src="${company.photo}" alt="${company.name}" class="w-full h-full object-cover">
                                    </div>` : 
                                    '<div class="text-5xl mb-4">🏢</div>'
                                }
                                <h3 class="text-white text-xl font-bold">${company.name}</h3>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
},
    dashboard: () => {
    const company = AppState.data.companies.find(c => c.id === AppState.selectedCompany);
    if (!company) return '<div class="text-white">Company not found</div>';
    
    // Filter data based on permissions
    const users = AppState.data.users.filter(u => 
        u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany)
    );
    const clients = getFilteredData('clients', AppState.data.clients.filter(c => c.company === AppState.selectedCompany));
    const leads = getFilteredData('leads', AppState.data.leads.filter(l => l.company === AppState.selectedCompany));
    const todos = getFilteredData('tasks', AppState.data.generalTodos.filter(t => t.company === AppState.selectedCompany));

    return `
        ${renderSidebar(company, 'dashboard')}
        ${renderTopbar(company, 'Dashboard')}

        <div class="main-content">
            <!-- Role Badge Display -->
            <div class="mb-4">
                ${renderRoleBadge()}
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="stat-card fade-in" onclick="navigateTo('clients', { selectedCompany: AppState.selectedCompany })">
                    <div class="text-white text-3xl mb-2">💼</div>
                    <div class="text-white text-4xl font-bold">${clients.length}</div>
                    <div class="text-white text-sm opacity-75">
                        ${AuthManager.hasDetailedPermission('clients', 'viewAll') ? 'Total' : 'My'} Clients
                    </div>
                </div>
                <div class="stat-card fade-in" onclick="navigateTo('leads', { selectedCompany: AppState.selectedCompany })">
                    <div class="text-white text-3xl mb-2">🎯</div>
                    <div class="text-white text-4xl font-bold">${leads.length}</div>
                    <div class="text-white text-sm opacity-75">
                        ${AuthManager.hasDetailedPermission('leads', 'viewAll') ? 'Total' : 'My'} Leads
                    </div>
                </div>
                <div class="stat-card fade-in" onclick="navigateTo('tasks', { selectedCompany: AppState.selectedCompany })">
                    <div class="text-white text-3xl mb-2">✅</div>
                    <div class="text-white text-4xl font-bold">${todos.length}</div>
                    <div class="text-white text-sm opacity-75">
                        ${AuthManager.hasDetailedPermission('tasks', 'viewAll') ? 'Total' : 'My'} Tasks
                    </div>
                </div>
            </div>

            <!-- Only show charts if user has analytics permission -->
            ${AuthManager.hasDetailedPermission('system', 'viewAnalytics') ? `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div class="glass-card p-6 fade-in">
                        <canvas id="clientsChart"></canvas>
                    </div>
                    <div class="glass-card p-6 fade-in">
                        <canvas id="leadsChart"></canvas>
                    </div>
                    <div class="glass-card p-6 fade-in">
                        <canvas id="tasksChart"></canvas>
                    </div>
                </div>
            ` : `
                <div class="glass-card p-6 mb-8 text-center fade-in">
                    <div class="text-white text-3xl mb-2">📊</div>
                    <div class="text-white opacity-75">
                        Analytics available for Managers and Admins
                    </div>
                </div>
            `}

            <!-- Team Members Section - Only for users who can manage users -->
            ${AuthManager.hasDetailedPermission('users', 'read') ? `
                <div class="glass-card p-6 fade-in">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-white text-2xl font-bold">Team Members</h3>
                        ${renderActionButton('users', 'create', `
                            <button class="btn btn-primary" onclick="if(typeof CRUDManager !== 'undefined') CRUDManager.showAddUserForm()">
                                ➕ Add Member
                            </button>
                        `)}
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        ${users.map(user => `
                            <div class="glass-card p-4 ${canShowAction('users', 'update') ? 'cursor-pointer hover:scale-105' : ''} transition-transform"
                                 ${canShowAction('users', 'update') ? `onclick="if(typeof CRUDManager !== 'undefined') CRUDManager.showEditUserForm('${user.id}')"` : ''}>
                                <div class="text-3xl mb-2">👤</div>
                                <div class="text-white font-bold">${user.name}</div>
                                <div class="text-white text-sm opacity-75">${user.email}</div>
                                <div class="text-white text-xs opacity-60 mt-1">${user.role}</div>
                                ${!canShowAction('users', 'update') ? '<div class="text-white text-xs opacity-50 mt-1">View Only</div>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            <!-- Recent Activity Feed -->
<div id="dashboardActivityFeed">
    <div class="text-white text-center py-8">Loading activity feed...</div>
</div>
        </div>
    `;
},

    clients: () => {
    const company = AppState.data.companies.find(c => c.id === AppState.selectedCompany);
    if (!company) return '<div class="text-white">Company not found</div>';
    
    // Get all clients
    const allClients = AppState.data.clients.filter(c => c.company === AppState.selectedCompany);
    const filteredClients = getFilteredData('clients', allClients);
    
    // 👇 ADD PAGINATION
    const paginatedResult = Pagination.getPage(filteredClients, 'clients');
    const clients = paginatedResult.data;
    
    return `
        ${renderSidebar(company, 'clients')}
        ${renderTopbar(company, 'Clients')}

        <div class="main-content">
            <div class="glass-card p-6 fade-in">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h2 class="text-white text-2xl font-bold">
                            ${AuthManager.hasDetailedPermission('clients', 'viewAll') ? 'All' : 'My'} Clients
                        </h2>
                    </div>
                    ${renderActionButton('clients', 'create', `
                        <button class="btn btn-primary" onclick="if(typeof CRUDManager !== 'undefined') CRUDManager.showAddClientForm()">
                            ➕ Add Client
                        </button>
                    `)}
                </div>

                ${clients.length === 0 ? 
                    // 👇 USE EMPTY STATE
                    EmptyState.noClients()
                : `
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        ${clients.map((client, index) => `
                            <div class="glass-card p-4 fade-in stagger-${Math.min(index + 1, 6)} cursor-pointer hover:scale-105 transition-transform"
                                 ${canEdit ? `onclick="CRUDManager.showEditClientForm('${client.id}')"` : ''}>
                                <!-- Your existing client card content -->
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- 👇 ADD LOAD MORE BUTTON -->
                    ${Pagination.renderLoadMoreButton('clients', 
                        paginatedResult.currentCount, 
                        paginatedResult.totalCount)}
                `}
            </div>
        </div>
    `;
},

    leads: () => {
    const company = AppState.data.companies.find(c => c.id === AppState.selectedCompany);
    if (!company) return '<div class="text-white">Company not found</div>';
    
    // Filter leads based on user permissions
    const allLeads = AppState.data.leads.filter(l => l.company === AppState.selectedCompany);
    const leads = getFilteredData('leads', allLeads);
    
    const users = AppState.data.users.filter(u => 
        u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany)
    );

    return `
        ${renderSidebar(company, 'leads')}
        ${renderTopbar(company, 'Leads')}

        <div class="main-content">
            <div class="glass-card p-6 fade-in">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h2 class="text-white text-2xl font-bold">
                            ${AuthManager.hasDetailedPermission('leads', 'viewAll') ? 'All' : 'My'} Leads (${leads.length})
                        </h2>
                        ${!AuthManager.hasDetailedPermission('leads', 'viewAll') && allLeads.length > leads.length ? `
                            <p class="text-white text-sm opacity-75 mt-1">
                                Showing ${leads.length} of ${allLeads.length} total leads
                            </p>
                        ` : ''}
                    </div>
                    ${renderActionButton('leads', 'create', `
                        <button class="btn btn-primary" onclick="if(typeof CRUDManager !== 'undefined') CRUDManager.showAddLeadForm()">
                            ➕ Add Lead
                        </button>
                    `)}
                </div>

                ${leads.length === 0 ? `
                    <div class="text-center text-white opacity-75 py-12">
                        <div class="text-6xl mb-4">🎯</div>
                        <h3 class="text-xl font-bold mb-2">No Leads ${AuthManager.hasDetailedPermission('leads', 'viewAll') ? 'Yet' : 'Assigned to You'}</h3>
                        <p>${canShowAction('leads', 'create') ? 'Click "Add Lead" to get started' : 'Contact your manager to get leads assigned'}</p>
                    </div>
                ` : `
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        ${leads.map((lead, index) => {
                            const assignedUser = users.find(u => u.id === lead.assignedUser);
                            const canEdit = AuthManager.canEditRecord('leads', lead);
                            
                            return `
                                <div class="glass-card p-4 fade-in ${canEdit ? 'cursor-pointer hover:scale-105' : 'opacity-75'} transition-transform"
                                     style="animation-delay: ${index * 0.05}s"
                                     ${canEdit ? `onclick="if(typeof CRUDManager !== 'undefined') CRUDManager.showEditLeadForm('${lead.id}')"` : ''}>
                                    <h3 class="text-white font-bold text-lg mb-2">${lead.name}</h3>
                                    ${lead.description ? `<p class="text-white text-sm opacity-75 mb-2">${lead.description.substring(0, 50)}${lead.description.length > 50 ? '...' : ''}</p>` : ''}
                                    <div class="mb-2">
                                        ${renderStatusBadge('lead', lead.status, { showIcon: true })}
                                        ${lead.priority ? `<span class="status-badge ml-2">${lead.priority}</span>` : ''}
                                    </div>
                                    ${lead.source ? `<p class="text-white text-sm opacity-75 mb-1">📍 Source: ${lead.source}</p>` : ''}
                                    ${lead.dueDate ? `<p class="text-white text-sm opacity-75 mb-1">📅 Due: ${new Date(lead.dueDate).toLocaleDateString()}</p>` : ''}
                                    ${assignedUser ? `<p class="text-white text-sm opacity-75">👤 ${assignedUser.name}</p>` : ''}
                                    ${!canEdit ? '<div class="text-white text-xs opacity-50 mt-2">🔒 View Only</div>' : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        </div>
    `;
},
    tasks: () => {
    const company = AppState.data.companies.find(c => c.id === AppState.selectedCompany);
    if (!company) return '<div class="text-white">Company not found</div>';
    
    // Filter tasks based on user permissions
    const allTodos = AppState.data.generalTodos.filter(t => t.company === AppState.selectedCompany);
    const todos = getFilteredData('tasks', allTodos);
    
    const users = AppState.data.users.filter(u => 
        u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany)
    );

    return `
        ${renderSidebar(company, 'tasks')}
        ${renderTopbar(company, 'Tasks')}

        <div class="main-content">
            <div class="glass-card p-6 fade-in">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h2 class="text-white text-2xl font-bold">
                            ${AuthManager.hasDetailedPermission('tasks', 'viewAll') ? 'All' : 'My'} Tasks (${todos.length})
                        </h2>
                        ${!AuthManager.hasDetailedPermission('tasks', 'viewAll') && allTodos.length > todos.length ? `
                            <p class="text-white text-sm opacity-75 mt-1">
                                Showing ${todos.length} of ${allTodos.length} total tasks
                            </p>
                        ` : ''}
                    </div>
                    ${renderActionButton('tasks', 'create', `
                        <button class="btn btn-primary" onclick="if(typeof CRUDManager !== 'undefined') CRUDManager.showAddTaskForm()">
                            ➕ Add Task
                        </button>
                    `)}
                </div>

                ${todos.length === 0 ? `
                    <div class="text-center text-white opacity-75 py-12">
                        <div class="text-6xl mb-4">✅</div>
                        <h3 class="text-xl font-bold mb-2">No Tasks ${AuthManager.hasDetailedPermission('tasks', 'viewAll') ? 'Yet' : 'Assigned to You'}</h3>
                        <p>${canShowAction('tasks', 'create') ? 'Click "Add Task" to get started' : 'Your task list is empty!'}</p>
                    </div>
                ` : `
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        ${todos.map((task, index) => {
                            const assignedUser = users.find(u => u.id === task.assignedUser);
                            const canEdit = AuthManager.canEditRecord('tasks', task);
                            
                            return `
                                <div class="glass-card p-4 fade-in ${canEdit ? 'cursor-pointer hover:scale-105' : 'opacity-75'} transition-transform"
                                     style="animation-delay: ${index * 0.05}s"
                                     ${canEdit ? `onclick="if(typeof CRUDManager !== 'undefined') CRUDManager.showEditTaskForm('${task.id}')"` : ''}>
                                    <h3 class="text-white font-bold text-lg mb-2">${task.name}</h3>
                                    <div class="flex gap-2 mb-2">
                                        <span class="status-badge ${task.priority === 'High' ? 'badge-high' : task.priority === 'Medium' ? 'badge-medium' : 'badge-low'}">${task.priority}</span>
                                        <span class="status-badge">${task.status}</span>
                                    </div>
                                    ${task.dueDate ? `<p class="text-white text-sm opacity-75 mb-1">📅 Due: ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
                                    ${assignedUser ? `<p class="text-white text-sm opacity-75">👤 ${assignedUser.name}</p>` : ''}
                                    ${!canEdit ? '<div class="text-white text-xs opacity-50 mt-2">🔒 View Only</div>' : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        </div>
    `;
},
    calendar: () => {
        const company = AppState.data.companies.find(c => c.id === AppState.selectedCompany);
        if (!company) return '<div class="text-white">Company not found</div>';

        return `
            ${renderSidebar(company, 'calendar')}
            ${renderTopbar(company, 'Calendar')}

            <div class="main-content">
                <div class="glass-card fade-in">
                    ${typeof CalendarManager !== 'undefined' ? CalendarManager.renderCalendar() : '<div class="text-white p-6">Calendar loading...</div>'}
                </div>
            </div>
        `;
    }
};
activities: () => {
    const company = AppState.data.companies.find(c => c.id === AppState.selectedCompany);
    if (!company) return '<div class="text-white">Company not found</div>';
    
    return `
        ${renderSidebar(company, 'activities')}
        ${renderTopbar(company, 'Activities')}

        <div class="main-content" id="activitiesView">
            <!-- 👉 ADD: Show loading skeleton initially -->
            <div class="glass-card p-6">
                <div class="skeleton-line skeleton-title mb-6"></div>
                ${LoadingSkeleton.renderListItems(5)}
            </div>
        </div>
    `;
}
// ========================================
// HELPER FUNCTIONS
// ========================================
function renderSidebar(company, activeView) {
    return `
        <div class="sidebar">
            <div class="p-6">
                <h2 class="text-white text-2xl font-bold">${company.name}</h2>
                <p class="text-white text-sm opacity-75">CRM Dashboard</p>
            </div>
            <nav class="mt-8">
                <div class="sidebar-item ${activeView === 'dashboard' ? 'active' : ''}" 
                     onclick="navigateTo('dashboard', { selectedCompany: AppState.selectedCompany })">
                    📊 Dashboard
                </div>
                <div class="sidebar-item ${activeView === 'clients' ? 'active' : ''}" 
                     onclick="navigateTo('clients', { selectedCompany: AppState.selectedCompany })">
                    💼 Clients
                </div>
                <div class="sidebar-item ${activeView === 'leads' ? 'active' : ''}" 
                     onclick="navigateTo('leads', { selectedCompany: AppState.selectedCompany })">
                    🎯 Leads
                </div>
                <div class="sidebar-item ${activeView === 'tasks' ? 'active' : ''}" 
                     onclick="navigateTo('tasks', { selectedCompany: AppState.selectedCompany })">
                    ✅ Tasks
                </div>
                <div class="sidebar-item ${activeView === 'calendar' ? 'active' : ''}" 
                     onclick="navigateTo('calendar', { selectedCompany: AppState.selectedCompany })">
                    📅 Calendar
                </div>
                <div class="sidebar-item" 
                     onclick="navigateTo('companySelection', { selectedCompany: null })">
                    🏢 Switch Company
                </div>
                <div class="sidebar-item ${activeView === 'activities' ? 'active' : ''}" 
     onclick="navigateTo('activities', { selectedCompany: AppState.selectedCompany })">
    📋 Activities
</div>
            </nav>
        </div>
    `;
}

function renderTopbar(company, pageTitle) {
    return `
        <div class="topbar">
            <div class="flex items-center gap-4">
                <button class="btn btn-primary" onclick="goBack()" ${AppState.historyIndex <= 0 ? 'disabled' : ''}>
                    ← Back
                </button>
                <button class="btn btn-primary" onclick="goForward()" ${AppState.historyIndex >= AppState.history.length - 1 ? 'disabled' : ''}>
                    Forward →
                </button>
            </div>
            <div class="text-white text-lg font-semibold">
                ${company.name} • ${pageTitle}
            </div>
            ${AuthManager.getUserDisplay()}
        </div>
    `;
}

// ========================================
// USER ACTIONS
// ========================================
async function selectCompany(companyId) {
    AppState.selectedCompany = companyId;
    await loadCompanyData(companyId);
    navigateTo('dashboard', { selectedCompany: companyId });
}

async function selectUser(userId) {
    AppState.selectedUser = userId;
    await loadUserData(userId);
    navigateTo('userDashboard', { selectedCompany: AppState.selectedCompany, selectedUser: userId });
}

// ========================================
// RENDER ENGINE
// ========================================
function render() {
    const app = document.getElementById('app');
    if (!app) {
        console.error('App container not found');
        return;
    }

    const viewFn = Views[AppState.currentView];
    if (viewFn) {
        app.innerHTML = viewFn();
        
        // Load charts for dashboard
        if (AppState.currentView === 'dashboard') {
            setTimeout(() => {
                if (typeof updateCharts === 'function') {
                    updateCharts();
                }
            }, 100);
        }
        // In render() function, update dashboard section:
if (AppState.currentView === 'dashboard') {
    setTimeout(async () => {
        if (typeof updateCharts === 'function') {
            updateCharts();
        }
        
        // Load activity feed - ADD THIS
        const feedContainer = document.getElementById('dashboardActivityFeed');
        if (feedContainer && typeof ActivityFeed !== 'undefined') {
            feedContainer.innerHTML = await ActivityFeed.renderWidget(5);
        }
    }, 100);
}
        // Load activities for activities view - ADD THIS
        if (AppState.currentView === 'activities') {
    setTimeout(async () => {
        const container = document.getElementById('activitiesView');
        if (container && typeof ActivityTimeline !== 'undefined') {
            // Get paginated activities
            const allActivities = await ActivityLogger.getActivities();
            const paginatedResult = Pagination.getPage(allActivities, 'activities');
            
            container.innerHTML = `
                <div class="glass-card p-6">
                    <h2 class="text-white text-2xl font-bold mb-6">
                        Activity Timeline
                    </h2>
                    
                    ${paginatedResult.data.length === 0 ? 
                        EmptyState.noActivities()
                    : `
                        <div class="space-y-4">
                            ${paginatedResult.data.map(a => 
                                ActivityTimeline.renderActivityItem(a)
                            ).join('')}
                        </div>
                        
                        ${Pagination.renderLoadMoreButton('activities', 
                            paginatedResult.currentCount, 
                            paginatedResult.totalCount)}
                    `}
                </div>
            `;
        }
    }, 100);
}
    }
}

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 CRM initializing...');
    
    // Check if user is already authenticated
    if (typeof AuthManager !== 'undefined') {
        const hasSession = AuthManager.checkStoredSession();
        
        if (hasSession) {
            console.log('✅ User session found:', AuthManager.currentUser.name);
            await loadCompanies();
            navigateTo('companySelection');
        } else {
            console.log('🔐 No session found, showing login');
            AuthManager.showLoginForm();
        }
    } else {
        console.warn('⚠️ AuthManager not loaded, showing login');
        setTimeout(() => {
            if (typeof AuthManager !== 'undefined') {
                AuthManager.showLoginForm();
            } else {
                document.getElementById('app').innerHTML = `
                    <div class="min-h-screen flex items-center justify-center">
                        <div class="glass-card p-12 text-center">
                            <div class="text-white text-2xl">⚠️ Authentication system not loaded</div>
                            <button class="btn btn-primary mt-4" onclick="location.reload()">Reload</button>
                        </div>
                    </div>
                `;
            }
        }, 100);
    }
});

console.log('✅ Main app logic loaded');