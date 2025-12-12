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
    AppState.history = AppState.history.slice(0, AppState.historyIndex + 1);
    AppState.history.push({ view, data });
    AppState.historyIndex++;
    
    AppState.currentView = view;
    Object.assign(AppState, data);
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
        if (typeof AirtableAPI !== 'undefined' && AirtableAPI.isConfigured()) {
            const result = await AirtableAPI.getCompanies();
            AppState.data.companies = result.records || [];
        } else {
            console.warn('Airtable not configured, using demo data');
            generateDemoData();
        }
    } catch (error) {
        console.error('Error loading companies:', error);
        AppState.error = 'Failed to load companies';
        generateDemoData();
    } finally {
        AppState.loading = false;
        render();
    }
}

async function loadCompanyData(companyId) {
    AppState.loading = true;
    render();
    
    try {
        if (typeof AirtableAPI !== 'undefined' && AirtableAPI.isConfigured()) {
            const [users, clients, leads, generalTodos, clientTodos] = await Promise.all([
                AirtableAPI.getUsers(companyId),
                AirtableAPI.getClients(companyId),
                AirtableAPI.getLeads(companyId),
                AirtableAPI.getGeneralTodos(companyId),
                AirtableAPI.getClientTodos(companyId)
            ]);
            
            AppState.data.users = users.records;
            AppState.data.clients = clients.records;
            AppState.data.leads = leads.records;
            AppState.data.generalTodos = generalTodos.records;
            AppState.data.clientTodos = clientTodos.records;
        } else {
            console.warn('Airtable not configured, using demo data');
        }
    } catch (error) {
        console.error('Error loading company data:', error);
        AppState.error = 'Failed to load company data';
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
                        <h1 class="text-4xl font-bold text-white fade-in">
                            Select Your Company
                        </h1>
                        ${AuthManager.getUserDisplay()}
                    </div>
                    
                    <div class="text-center mb-8">
                        <button class="btn btn-primary" onclick="if(typeof CRUDManager !== 'undefined') CRUDManager.showAddCompanyForm()">
                            ➕ Add Company
                        </button>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        ${AppState.data.companies.map((company, index) => `
                            <div class="company-card p-6 text-center fade-in" 
                                 style="animation-delay: ${index * 0.1}s"
                                 onclick="selectCompany('${company.id}')">
                                <div class="text-5xl mb-4">🏢</div>
                                <h3 class="text-white text-xl font-bold">${company.name}</h3>
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
        
        const users = AppState.data.users.filter(u => 
            u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany)
        );
        const clients = AppState.data.clients.filter(c => c.company === AppState.selectedCompany);
        const leads = AppState.data.leads.filter(l => l.company === AppState.selectedCompany);
        const todos = AppState.data.generalTodos.filter(t => t.company === AppState.selectedCompany);

        return `
            ${renderSidebar(company, 'dashboard')}
            ${renderTopbar(company, 'Dashboard')}

            <div class="main-content">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div class="stat-card fade-in" onclick="navigateTo('clients', { selectedCompany: AppState.selectedCompany })">
                        <div class="text-white text-3xl mb-2">💼</div>
                        <div class="text-white text-4xl font-bold">${clients.length}</div>
                        <div class="text-white text-sm opacity-75">Total Clients</div>
                    </div>
                    <div class="stat-card fade-in" onclick="navigateTo('leads', { selectedCompany: AppState.selectedCompany })">
                        <div class="text-white text-3xl mb-2">🎯</div>
                        <div class="text-white text-4xl font-bold">${leads.length}</div>
                        <div class="text-white text-sm opacity-75">Total Leads</div>
                    </div>
                    <div class="stat-card fade-in" onclick="navigateTo('tasks', { selectedCompany: AppState.selectedCompany })">
                        <div class="text-white text-3xl mb-2">✅</div>
                        <div class="text-white text-4xl font-bold">${todos.length}</div>
                        <div class="text-white text-sm opacity-75">Total Tasks</div>
                    </div>
                </div>

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

                <div class="glass-card p-6 fade-in">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-white text-2xl font-bold">Team Members</h3>
                        <button class="btn btn-primary" onclick="if(typeof CRUDManager !== 'undefined') CRUDManager.showAddUserForm()">
                            ➕ Add Member
                        </button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        ${users.map(user => `
                            <div class="glass-card p-4 cursor-pointer hover:scale-105 transition-transform"
                                 onclick="if(typeof CRUDManager !== 'undefined') CRUDManager.showEditUserForm('${user.id}')">
                                <div class="text-3xl mb-2">👤</div>
                                <div class="text-white font-bold">${user.name}</div>
                                <div class="text-white text-sm opacity-75">${user.email}</div>
                                <div class="text-white text-xs opacity-60 mt-1">${user.role}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    clients: () => {
        const company = AppState.data.companies.find(c => c.id === AppState.selectedCompany);
        if (!company) return '<div class="text-white">Company not found</div>';
        
        const clients = AppState.data.clients.filter(c => c.company === AppState.selectedCompany);
        const users = AppState.data.users.filter(u => 
            u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany)
        );

        return `
            ${renderSidebar(company, 'clients')}
            ${renderTopbar(company, 'Clients')}

            <div class="main-content">
                <div class="glass-card p-6 fade-in">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-white text-2xl font-bold">All Clients (${clients.length})</h2>
                        <button class="btn btn-primary" onclick="if(typeof CRUDManager !== 'undefined') CRUDManager.showAddClientForm()">
                            ➕ Add Client
                        </button>
                    </div>

                    ${clients.length === 0 ? `
                        <div class="text-center text-white opacity-75 py-12">
                            <div class="text-6xl mb-4">💼</div>
                            <h3 class="text-xl font-bold mb-2">No Clients Yet</h3>
                            <p>Click "Add Client" to get started</p>
                        </div>
                    ` : `
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            ${clients.map((client, index) => {
                                const assignedUser = users.find(u => u.id === client.assignedUser);
                                return `
                                    <div class="glass-card p-4 fade-in cursor-pointer hover:scale-105 transition-transform"
                                         style="animation-delay: ${index * 0.05}s"
                                         onclick="if(typeof CRUDManager !== 'undefined') CRUDManager.showEditClientForm('${client.id}')">
                                        <div class="flex items-start justify-between mb-2">
                                            <h3 class="text-white font-bold text-lg">${client.name}</h3>
                                            ${client.rating ? `<div class="text-yellow-400">${'⭐'.repeat(client.rating)}</div>` : ''}
                                        </div>
                                        <p class="text-white text-sm opacity-75 mb-1">${client.email || 'No email'}</p>
                                        <p class="text-white text-sm opacity-75 mb-2">${client.phone || 'No phone'}</p>
                                        <div class="mb-2">
                                            ${renderStatusBadge('client', client.status, { showIcon: true })}
                                            ${client.priority ? `<span class="status-badge ml-2">${client.priority}</span>` : ''}
                                        </div>
                                        ${client.dealValue ? `<p class="text-white text-sm mb-1">💰 $${client.dealValue.toLocaleString()}</p>` : ''}
                                        ${assignedUser ? `<p class="text-white text-sm opacity-75">👤 ${assignedUser.name}</p>` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    leads: () => {
        const company = AppState.data.companies.find(c => c.id === AppState.selectedCompany);
        if (!company) return '<div class="text-white">Company not found</div>';
        
        const leads = AppState.data.leads.filter(l => l.company === AppState.selectedCompany);
        const users = AppState.data.users.filter(u => 
            u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany)
        );

        return `
            ${renderSidebar(company, 'leads')}
            ${renderTopbar(company, 'Leads')}

            <div class="main-content">
                <div class="glass-card p-6 fade-in">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-white text-2xl font-bold">All Leads (${leads.length})</h2>
                        <button class="btn btn-primary" onclick="if(typeof CRUDManager !== 'undefined') CRUDManager.showAddLeadForm()">
                            ➕ Add Lead
                        </button>
                    </div>

                    ${leads.length === 0 ? `
                        <div class="text-center text-white opacity-75 py-12">
                            <div class="text-6xl mb-4">🎯</div>
                            <h3 class="text-xl font-bold mb-2">No Leads Yet</h3>
                            <p>Click "Add Lead" to get started</p>
                        </div>
                    ` : `
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            ${leads.map((lead, index) => {
                                const assignedUser = users.find(u => u.id === lead.assignedUser);
                                return `
                                    <div class="glass-card p-4 fade-in cursor-pointer hover:scale-105 transition-transform"
                                         style="animation-delay: ${index * 0.05}s"
                                         onclick="if(typeof CRUDManager !== 'undefined') CRUDManager.showEditLeadForm('${lead.id}')">
                                        <h3 class="text-white font-bold text-lg mb-2">${lead.name}</h3>
                                        ${lead.description ? `<p class="text-white text-sm opacity-75 mb-2">${lead.description.substring(0, 50)}${lead.description.length > 50 ? '...' : ''}</p>` : ''}
                                        <div class="mb-2">
                                            ${renderStatusBadge('lead', lead.status, { showIcon: true })}
                                            ${lead.priority ? `<span class="status-badge ml-2">${lead.priority}</span>` : ''}
                                        </div>
                                        ${lead.source ? `<p class="text-white text-sm opacity-75 mb-1">📍 Source: ${lead.source}</p>` : ''}
                                        ${lead.dueDate ? `<p class="text-white text-sm opacity-75 mb-1">📅 Due: ${new Date(lead.dueDate).toLocaleDateString()}</p>` : ''}
                                        ${assignedUser ? `<p class="text-white text-sm opacity-75">👤 ${assignedUser.name}</p>` : ''}
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
        
        const todos = AppState.data.generalTodos.filter(t => t.company === AppState.selectedCompany);
        const users = AppState.data.users.filter(u => 
            u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany)
        );

        return `
            ${renderSidebar(company, 'tasks')}
            ${renderTopbar(company, 'Tasks')}

            <div class="main-content">
                <div class="glass-card p-6 fade-in">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-white text-2xl font-bold">All Tasks (${todos.length})</h2>
                        <button class="btn btn-primary" onclick="if(typeof CRUDManager !== 'undefined') CRUDManager.showAddTaskForm()">
                            ➕ Add Task
                        </button>
                    </div>

                    ${todos.length === 0 ? `
                        <div class="text-center text-white opacity-75 py-12">
                            <div class="text-6xl mb-4">✅</div>
                            <h3 class="text-xl font-bold mb-2">No Tasks Yet</h3>
                            <p>Click "Add Task" to get started</p>
                        </div>
                    ` : `
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            ${todos.map((task, index) => {
                                const assignedUser = users.find(u => u.id === task.assignedUser);
                                return `
                                    <div class="glass-card p-4 fade-in cursor-pointer hover:scale-105 transition-transform"
                                         style="animation-delay: ${index * 0.05}s"
                                         onclick="if(typeof CRUDManager !== 'undefined') CRUDManager.showEditTaskForm('${task.id}')">
                                        <h3 class="text-white font-bold text-lg mb-2">${task.name}</h3>
                                        <div class="flex gap-2 mb-2">
                                            <span class="status-badge ${task.priority === 'High' ? 'badge-high' : task.priority === 'Medium' ? 'badge-medium' : 'badge-low'}">${task.priority}</span>
                                            <span class="status-badge">${task.status}</span>
                                        </div>
                                        ${task.dueDate ? `<p class="text-white text-sm opacity-75 mb-1">📅 Due: ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
                                        ${assignedUser ? `<p class="text-white text-sm opacity-75">👤 ${assignedUser.name}</p>` : ''}
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
        
        if (AppState.currentView === 'dashboard') {
            setTimeout(() => {
                if (typeof updateCharts === 'function') {
                    updateCharts();
                }
            }, 100);
        }
    } else {
        console.error('View not found:', AppState.currentView);
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