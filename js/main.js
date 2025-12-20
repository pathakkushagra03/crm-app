// ========================================
// APPLICATION STATE
// ========================================
const AppState = {
    currentView: 'login',
    selectedCompany: null,
    selectedUser: null,
    currentUser: null,
    role: null,
    data: {
        companies: [],
        users: [],
        clients: [],
        leads: [],
        generalTodos: [],
        clientTodos: [],
        calendarEvents: [] // NEW!
    }
};

// ========================================
// DATA LOADING FUNCTIONS
// ========================================

async function loadCompanies() {
    try {
        if (AirtableAPI.isConfigured()) {
            const result = await AirtableAPI.getCompanies();
            AppState.data.companies = result.records;
        } else {
            // Demo companies with new fields
            AppState.data.companies = [
                { 
                    id: '1', 
                    name: 'Acme Corp', 
                    industry: 'Technology',
                    location: 'San Francisco, CA',
                    notes: 'Leading tech innovator',
                    clients: [],
                    color: '#FF6B6B' 
                },
                { 
                    id: '2', 
                    name: 'Tech Solutions', 
                    industry: 'Consulting',
                    location: 'New York, NY',
                    notes: 'IT consulting services',
                    clients: [],
                    color: '#4ECDC4' 
                },
                { 
                    id: '3', 
                    name: 'Global Industries', 
                    industry: 'Manufacturing',
                    location: 'Chicago, IL',
                    notes: 'Manufacturing excellence',
                    clients: [],
                    color: '#45B7D1' 
                }
            ];
        }
        console.log(`✅ Loaded ${AppState.data.companies.length} companies`);
    } catch (error) {
        console.error('Error loading companies:', error);
        CRUDManager.showToast('❌ Failed to load companies', 'error');
    }
}

async function loadCompanyData(companyId) {
    try {
        AppState.selectedCompany = companyId;
        
        const isConfigured = AirtableAPI.isConfigured();
        
        // Load Users
        if (isConfigured) {
            const usersResult = await AirtableAPI.getUsers(companyId);
            AppState.data.users = usersResult.records;
        } else {
            AppState.data.users = [
                { 
                    id: 'u1', 
                    name: 'John Doe', 
                    email: 'john@demo.com', 
                    phoneNumber: '+1 (555) 123-4567',
                    role: 'Admin', 
                    status: 'Active',
                    companies: [companyId],
                    companyNames: ['Demo Company']
                },
                { 
                    id: 'u2', 
                    name: 'Jane Smith', 
                    email: 'jane@demo.com', 
                    phoneNumber: '+1 (555) 987-6543',
                    role: 'Manager', 
                    status: 'Active',
                    companies: [companyId],
                    companyNames: ['Demo Company']
                }
            ];
        }
        
        // Load Clients
        if (isConfigured) {
            const clientsResult = await AirtableAPI.getClients(companyId);
            AppState.data.clients = clientsResult.records;
        } else {
            AppState.data.clients = [
                { 
                    id: 'c1', 
                    name: 'Client A', 
                    email: 'clienta@demo.com', 
                    phoneNo: '+1 (555) 000-0001',
                    address: '123 Main St, City, State 12345',
                    status: 'Active', 
                    leadType: 'Hot',
                    assignedUser: 'u1', 
                    company: companyId, 
                    priority: 'High', 
                    dealValue: 50000, 
                    rating: 5,
                    notes: 'VIP client - high priority',
                    lastContactDate: '2024-12-15',
                    nextFollowUpDate: '2024-12-22',
                    daysSinceLastContact: 5,
                    daysUntilFollowUp: 2
                },
                { 
                    id: 'c2', 
                    name: 'Client B', 
                    email: 'clientb@demo.com', 
                    phoneNo: '+1 (555) 000-0002',
                    address: '456 Oak Ave, City, State 67890',
                    status: 'Active', 
                    leadType: 'Warm',
                    assignedUser: 'u2', 
                    company: companyId, 
                    priority: 'Medium', 
                    dealValue: 30000, 
                    rating: 4,
                    notes: 'Regular follow-ups needed',
                    lastContactDate: '2024-12-10',
                    nextFollowUpDate: '2024-12-25',
                    daysSinceLastContact: 10,
                    daysUntilFollowUp: 5
                }
            ];
        }
        
        // Load Leads
        if (isConfigured) {
            const leadsResult = await AirtableAPI.getLeads(companyId);
            AppState.data.leads = leadsResult.records;
        } else {
            AppState.data.leads = [
                { 
                    id: 'l1', 
                    name: 'Lead X', 
                    status: 'New', 
                    assignedUser: 'u1',
                    assignedUserName: 'John Doe',
                    company: companyId,
                    companyName: 'Demo Company'
                },
                { 
                    id: 'l2', 
                    name: 'Lead Y', 
                    status: 'Contacted', 
                    assignedUser: 'u2',
                    assignedUserName: 'Jane Smith',
                    company: companyId,
                    companyName: 'Demo Company'
                }
            ];
        }
        
        // Load General Todos
        if (isConfigured) {
            const generalTodosResult = await AirtableAPI.getGeneralTodos();
            AppState.data.generalTodos = generalTodosResult.records;
        } else {
            AppState.data.generalTodos = [
                { 
                    id: 'gt1', 
                    name: 'Team Meeting', 
                    description: 'Quarterly review meeting with all team members',
                    dueDate: '2024-12-25', 
                    priority: 'High', 
                    status: 'Pending', 
                    assignedUser: 'u1',
                    createdDate: '2024-12-15T10:00:00.000Z'
                }
            ];
        }
        
        // Load Client Todos
        if (isConfigured) {
            const clientTodosResult = await AirtableAPI.getClientTodos();
            AppState.data.clientTodos = clientTodosResult.records;
        } else {
            AppState.data.clientTodos = [
                { 
                    id: 'ct1', 
                    name: 'Follow up with Client A', 
                    description: 'Discuss contract renewal and pricing',
                    dueDate: '2024-12-20', 
                    priority: 'High', 
                    status: 'Pending', 
                    client: 'c1',
                    createdDate: '2024-12-15T14:30:00.000Z'
                }
            ];
        }
        
        // Load Calendar Events (NEW!)
        if (isConfigured) {
            const calendarEventsResult = await AirtableAPI.getCalendarEvents();
            AppState.data.calendarEvents = calendarEventsResult.records;
        } else {
            AppState.data.calendarEvents = [
                {
                    id: 'ce1',
                    eventTitle: 'Client Meeting - Client A',
                    eventType: 'Meeting',
                    clients: ['c1'],
                    startDateTime: '2024-12-22T10:00',
                    endDateTime: '2024-12-22T11:00',
                    location: 'Office Conference Room A',
                    description: 'Quarterly business review',
                    status: 'Scheduled',
                    createdDate: '2024-12-15T09:00:00.000Z'
                },
                {
                    id: 'ce2',
                    eventTitle: 'Follow-up Call - Client B',
                    eventType: 'Call',
                    clients: ['c2'],
                    startDateTime: '2024-12-23T14:00',
                    endDateTime: '2024-12-23T14:30',
                    location: 'Phone',
                    description: 'Discuss new product features',
                    status: 'Confirmed',
                    createdDate: '2024-12-16T11:00:00.000Z'
                }
            ];
        }
        
        console.log(`✅ Loaded data for company ${companyId}:`, {
            users: AppState.data.users.length,
            clients: AppState.data.clients.length,
            leads: AppState.data.leads.length,
            generalTodos: AppState.data.generalTodos.length,
            clientTodos: AppState.data.clientTodos.length,
            calendarEvents: AppState.data.calendarEvents.length // NEW!
        });
        
    } catch (error) {
        console.error('Error loading company data:', error);
        CRUDManager.showToast('❌ Failed to load company data', 'error');
    }
}

// ========================================
// NAVIGATION & RENDERING
// ========================================

function navigateTo(view) {
    AppState.currentView = view;
    render();
}

function render() {
    const app = document.getElementById('app');
    
    if (!AuthManager.isAuthenticated()) {
        AuthManager.showLoginForm();
        return;
    }
    
    switch (AppState.currentView) {
        case 'companySelection':
            renderCompanySelection();
            break;
        case 'userSelection':
            renderUserSelection();
            break;
        case 'dashboard':
            renderDashboard();
            break;
        default:
            AuthManager.showLoginForm();
    }
}

function renderCompanySelection() {
    const app = document.getElementById('app');
    
    const companies = AppState.data.companies;
    
    if (companies.length === 0) {
        app.innerHTML = `
            <div class="min-h-screen flex items-center justify-center p-6">
                <div class="glass-card p-12 max-w-2xl w-full text-center fade-in">
                    <div class="text-6xl mb-4">🏢</div>
                    <h1 class="text-4xl font-bold text-white mb-4">No Companies Found</h1>
                    <p class="text-white text-lg opacity-75 mb-6">Get started by creating your first company</p>
                    <button class="btn btn-primary" onclick="CRUDManager.showAddCompanyForm()">
                        ➕ Create Company
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    app.innerHTML = `
        <div class="min-h-screen p-6">
            <div class="max-w-7xl mx-auto fade-in">
                <!-- Header -->
                <div class="glass-card p-6 mb-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <h1 class="text-3xl font-bold text-white mb-2">🏢 Select Company</h1>
                            <p class="text-white opacity-75">Choose a company to continue</p>
                        </div>
                        <div class="flex items-center gap-3">
                            ${AuthManager.hasPermission('manage_companies') ? 
                                '<button class="btn btn-primary" onclick="CRUDManager.showAddCompanyForm()">➕ Add Company</button>' : 
                                ''
                            }
                            ${AuthManager.getUserDisplay()}
                        </div>
                    </div>
                </div>
                
                <!-- Companies Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${companies.map(company => `
                        <div class="company-card p-6 cursor-pointer" 
                             onclick="selectCompany('${company.id}')">
                            <div class="flex items-center gap-4 mb-4">
                                <div class="w-16 h-16 rounded-full flex items-center justify-center text-4xl"
                                     style="background: ${company.color}20; color: ${company.color};">
                                    🏢
                                </div>
                                <div class="flex-1">
                                    <h3 class="text-white font-bold text-xl">${company.name}</h3>
                                    ${company.industry ? `
                                        <p class="text-white text-sm opacity-75">
                                            <span class="inline-flex items-center gap-1">
                                                <span>🏭</span>
                                                <span>${company.industry}</span>
                                            </span>
                                        </p>
                                    ` : ''}
                                </div>
                            </div>
                            
                            ${company.location || company.notes ? `
                                <div class="border-t border-white border-opacity-20 pt-3 mt-3 space-y-2">
                                    ${company.location ? `
                                        <div class="text-white text-sm opacity-75 flex items-center gap-2">
                                            <span>📍</span>
                                            <span>${company.location}</span>
                                        </div>
                                    ` : ''}
                                    ${company.notes ? `
                                        <div class="text-white text-xs opacity-60 italic">
                                            "${company.notes.length > 60 ? company.notes.substring(0, 60) + '...' : company.notes}"
                                        </div>
                                    ` : ''}
                                </div>
                            ` : ''}
                            
                            <div class="mt-4 pt-3 border-t border-white border-opacity-20">
                                <div class="text-white text-xs opacity-75">
                                    Click to access →
                                </div>
                            </div>
                            
                            ${AuthManager.hasPermission('manage_companies') ? `
                                <div class="flex gap-2 mt-4">
                                    <button class="btn btn-secondary flex-1 text-sm" 
                                            onclick="event.stopPropagation(); CRUDManager.showEditCompanyForm('${company.id}')">
                                        ✏️ Edit
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

async function selectCompany(companyId) {
    try {
        await loadCompanyData(companyId);
        
        // Check if role requires user selection
        if (AuthManager.hasPermission('view_all')) {
            // Admin/Manager can see all data
            navigateTo('dashboard');
        } else {
            // Sales/User must select themselves or be auto-assigned
            const currentUser = AuthManager.currentUser;
            const userInCompany = AppState.data.users.find(u => u.id === currentUser.id);
            
            if (userInCompany) {
                AppState.selectedUser = currentUser.id;
                navigateTo('dashboard');
            } else {
                navigateTo('userSelection');
            }
        }
    } catch (error) {
        console.error('Error selecting company:', error);
        CRUDManager.showToast('❌ Failed to load company', 'error');
    }
}

function renderUserSelection() {
    const app = document.getElementById('app');
    const users = AppState.data.users;
    
    app.innerHTML = `
        <div class="min-h-screen p-6">
            <div class="max-w-5xl mx-auto fade-in">
                <!-- Header -->
                <div class="glass-card p-6 mb-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <h1 class="text-3xl font-bold text-white mb-2">👤 Select User</h1>
                            <p class="text-white opacity-75">Choose your user profile</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <button class="btn btn-secondary" onclick="navigateTo('companySelection')">
                                ← Back
                            </button>
                            ${AuthManager.getUserDisplay()}
                        </div>
                    </div>
                </div>
                
                <!-- Users Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${users.map(user => `
                        <div class="company-card p-6 cursor-pointer" 
                             onclick="selectUser('${user.id}')">
                            <div class="flex items-center gap-4 mb-4">
                                <div class="w-16 h-16 rounded-full overflow-hidden bg-white bg-opacity-10 flex items-center justify-center">
                                    ${user.photo ? 
                                        `<img src="${user.photo}" alt="${user.name}" class="w-full h-full object-cover">` : 
                                        '<span class="text-3xl">👤</span>'
                                    }
                                </div>
                                <div class="flex-1">
                                    <h3 class="text-white font-bold text-xl">${user.name}</h3>
                                    <div class="flex items-center gap-2 mt-1">
                                        <span class="status-badge badge-${user.role === 'Admin' ? 'high' : user.role === 'Manager' ? 'medium' : 'low'}">
                                            ${user.role}
                                        </span>
                                        ${user.status ? `
                                            <span class="status-badge badge-${user.status === 'Active' ? 'high' : 'low'}" style="font-size: 10px;">
                                                ${user.status}
                                            </span>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                            
                            <div class="border-t border-white border-opacity-20 pt-3 mt-3 space-y-2">
                                <div class="text-white text-sm opacity-75 flex items-center gap-2">
                                    <span>📧</span>
                                    <span class="truncate">${user.email}</span>
                                </div>
                                ${user.phoneNumber || user.phone ? `
                                    <div class="text-white text-sm opacity-75 flex items-center gap-2">
                                        <span>📱</span>
                                        <span>${user.phoneNumber || user.phone}</span>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="mt-4 pt-3 border-t border-white border-opacity-20">
                                <div class="text-white text-xs opacity-75">
                                    Click to continue →
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function selectUser(userId) {
    AppState.selectedUser = userId;
    navigateTo('dashboard');
}

function renderDashboard() {
    const app = document.getElementById('app');
    
    const selectedCompany = AppState.data.companies.find(c => c.id === AppState.selectedCompany);
    const canViewAll = AuthManager.hasPermission('view_all');
    
    // Filter data based on permissions
    let clients = AppState.data.clients;
    let leads = AppState.data.leads;
    let generalTodos = AppState.data.generalTodos;
    let clientTodos = AppState.data.clientTodos;
    let calendarEvents = AppState.data.calendarEvents || [];
    
    if (!canViewAll && AppState.selectedUser) {
        clients = clients.filter(c => c.assignedUser === AppState.selectedUser);
        leads = leads.filter(l => l.assignedUser === AppState.selectedUser);
        generalTodos = generalTodos.filter(t => t.assignedUser === AppState.selectedUser);
        // Client todos don't have assignedUser, filter by client ownership
        const userClientIds = clients.map(c => c.id);
        clientTodos = clientTodos.filter(t => userClientIds.includes(t.client));
        // Calendar events linked to user's clients
        calendarEvents = calendarEvents.filter(e => 
            e.clients && e.clients.some(clientId => userClientIds.includes(clientId))
        );
    }
    
    // Calculate stats
    const stats = {
        totalClients: clients.length,
        activeClients: clients.filter(c => c.status === 'Active').length,
        totalLeads: leads.length,
        newLeads: leads.filter(l => l.status === 'New').length,
        pendingTasks: [...generalTodos, ...clientTodos].filter(t => t.status === 'Pending').length,
        completedTasks: [...generalTodos, ...clientTodos].filter(t => t.status === 'Completed').length,
        upcomingEvents: calendarEvents.filter(e => {
            const eventDate = new Date(e.startDateTime);
            const now = new Date();
            return eventDate > now && e.status !== 'Cancelled';
        }).length,
        totalRevenue: clients.reduce((sum, c) => sum + (c.dealValue || 0), 0)
    };
    
    app.innerHTML = `
        <div class="min-h-screen">
            <!-- Navigation -->
            ${renderNavigation(selectedCompany)}
            
            <!-- Main Content -->
            <div class="p-6">
                <div class="max-w-7xl mx-auto">
                    <!-- Stats Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div class="stat-card">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-white text-sm opacity-75">Total Clients</span>
                                <span class="text-3xl">👥</span>
                            </div>
                            <div class="text-white text-3xl font-bold">${stats.totalClients}</div>
                            <div class="text-white text-sm opacity-75 mt-1">${stats.activeClients} active</div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-white text-sm opacity-75">Total Leads</span>
                                <span class="text-3xl">🎯</span>
                            </div>
                            <div class="text-white text-3xl font-bold">${stats.totalLeads}</div>
                            <div class="text-white text-sm opacity-75 mt-1">${stats.newLeads} new</div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-white text-sm opacity-75">Pending Tasks</span>
                                <span class="text-3xl">⏳</span>
                            </div>
                            <div class="text-white text-3xl font-bold">${stats.pendingTasks}</div>
                            <div class="text-white text-sm opacity-75 mt-1">${stats.completedTasks} completed</div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-white text-sm opacity-75">Upcoming Events</span>
                                <span class="text-3xl">📅</span>
                            </div>
                            <div class="text-white text-3xl font-bold">${stats.upcomingEvents}</div>
                            <div class="text-white text-sm opacity-75 mt-1">Scheduled</div>
                        </div>
                    </div>
                    
                    <!-- Revenue Summary -->
                    ${stats.totalRevenue > 0 ? `
                        <div class="glass-card p-6 mb-6">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="text-white text-sm opacity-75 mb-1">Total Pipeline Value</div>
                                    <div class="text-white text-4xl font-bold">$${stats.totalRevenue.toLocaleString()}</div>
                                </div>
                                <div class="text-6xl">💰</div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Tabs -->
                    <div class="glass-card p-6 mb-6">
                        <div class="flex flex-wrap gap-2" id="dashboardTabs">
                            <button class="tab-btn active" onclick="switchTab('clients')">👥 Clients (${clients.length})</button>
                            <button class="tab-btn" onclick="switchTab('leads')">🎯 Leads (${leads.length})</button>
                            <button class="tab-btn" onclick="switchTab('calendar-events')">📅 Calendar (${calendarEvents.length})</button>
                            <button class="tab-btn" onclick="switchTab('general-todos')">📋 General To-Do (${generalTodos.length})</button>
                            <button class="tab-btn" onclick="switchTab('client-todos')">✓ Client To-Do (${clientTodos.length})</button>
                            ${AuthManager.hasPermission('manage_users') ? 
                                `<button class="tab-btn" onclick="switchTab('users')">👤 Users (${AppState.data.users.length})</button>` : 
                                ''
                            }
                        </div>
                    </div>
                    
                    <!-- Content Area -->
                    <div id="tabContent">
                        ${renderClientsTab(clients)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderNavigation(company) {
    return `
        <nav class="glass-card mb-6">
            <div class="p-4 flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                         style="background: ${company.color}20; color: ${company.color};">
                        🏢
                    </div>
                    <div>
                        <h2 class="text-white font-bold text-xl">${company.name}</h2>
                        <div class="flex items-center gap-3 text-white text-xs opacity-75">
                            ${company.industry ? `<span>🏭 ${company.industry}</span>` : ''}
                            ${company.location ? `<span>📍 ${company.location}</span>` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="flex items-center gap-3">
                    <button class="btn btn-secondary" onclick="navigateTo('companySelection')">
                        🏢 Change Company
                    </button>
                    ${AuthManager.getUserDisplay()}
                </div>
            </div>
        </nav>
    `;
}

function switchTab(tabName) {
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const content = document.getElementById('tabContent');
    
    const canViewAll = AuthManager.hasPermission('view_all');
    let clients = AppState.data.clients;
    let leads = AppState.data.leads;
    let generalTodos = AppState.data.generalTodos;
    let clientTodos = AppState.data.clientTodos;
    let calendarEvents = AppState.data.calendarEvents || [];
    let users = AppState.data.users;
    
    if (!canViewAll && AppState.selectedUser) {
        clients = clients.filter(c => c.assignedUser === AppState.selectedUser);
        leads = leads.filter(l => l.assignedUser === AppState.selectedUser);
        generalTodos = generalTodos.filter(t => t.assignedUser === AppState.selectedUser);
        const userClientIds = clients.map(c => c.id);
        clientTodos = clientTodos.filter(t => userClientIds.includes(t.client));
        calendarEvents = calendarEvents.filter(e => 
            e.clients && e.clients.some(clientId => userClientIds.includes(clientId))
        );
    }
    
    switch (tabName) {
        case 'clients':
            content.innerHTML = renderClientsTab(clients);
            break;
        case 'leads':
            content.innerHTML = renderLeadsTab(leads);
            break;
        case 'calendar-events':
            content.innerHTML = renderCalendarEventsTab(calendarEvents);
            break;
        case 'general-todos':
            content.innerHTML = renderGeneralTodosTab(generalTodos);
            break;
        case 'client-todos':
            content.innerHTML = renderClientTodosTab(clientTodos);
            break;
        case 'users':
            content.innerHTML = renderUsersTab(users);
            break;
    }
}

function renderClientsTab(clients) {
    const canCreate = AuthManager.hasPermission('create');
    
    return `
        <div class="glass-card p-6">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h3 class="text-white text-2xl font-bold mb-1">👥 Clients</h3>
                    <p class="text-white opacity-75">Manage your client relationships</p>
                </div>
                ${canCreate ? 
                    '<button class="btn btn-primary" onclick="CRUDManager.showAddClientForm()">➕ Add Client</button>' : 
                    ''
                }
            </div>
            
            ${clients.length === 0 ? `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">👥</div>
                    <h4 class="text-white text-xl font-bold mb-2">No Clients Yet</h4>
                    <p class="text-white opacity-75 mb-6">Start by adding your first client</p>
                    ${canCreate ? 
                        '<button class="btn btn-primary" onclick="CRUDManager.showAddClientForm()">➕ Add First Client</button>' : 
                        ''
                    }
                </div>
            ` : `
                <div class="overflow-x-auto">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Lead Type</th>
                                <th>Priority</th>
                                <th>Deal Value</th>
                                <th>Rating</th>
                                <th>Last Contact</th>
                                <th>Next Follow-Up</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clients.map(client => {
                                const assignedUser = AppState.data.users.find(u => u.id === client.assignedUser);
                                return `
                                    <tr>
                                        <td>
                                            <div class="font-semibold">${client.name}</div>
                                            ${client.address ? `<div class="text-xs opacity-75">📍 ${client.address.substring(0, 30)}${client.address.length > 30 ? '...' : ''}</div>` : ''}
                                        </td>
                                        <td>${client.email || '-'}</td>
                                        <td>${client.phoneNo || client.phone || '-'}</td>
                                        <td><span class="status-badge status-client-${client.status.toLowerCase().replace(' ', '')}">${client.status}</span></td>
                                        <td>${client.leadType ? `<span class="status-badge badge-${client.leadType === 'Hot' ? 'high' : client.leadType === 'Warm' ? 'medium' : 'low'}">${client.leadType}</span>` : '-'}</td>
                                        <td>${client.priority ? `<span class="status-badge badge-${client.priority === 'High' ? 'high' : client.priority === 'Medium' ? 'medium' : 'low'}">${client.priority}</span>` : '-'}</td>
                                        <td class="font-bold">$${(client.dealValue || 0).toLocaleString()}</td>
                                        <td>${'⭐'.repeat(client.rating || 0) || '-'}</td>
                                        <td>
                                            ${client.lastContactDate || '-'}
                                            ${client.daysSinceLastContact ? `<div class="text-xs opacity-75">${client.daysSinceLastContact} days ago</div>` : ''}
                                        </td>
                                        <td>
                                            ${client.nextFollowUpDate || '-'}
                                            ${client.daysUntilFollowUp ? `<div class="text-xs opacity-75">in ${client.daysUntilFollowUp} days</div>` : ''}
                                        </td>
                                        <td>
                                            <div class="flex gap-2">
                                                <button class="btn btn-sm btn-secondary" onclick="CRUDManager.showEditClientForm('${client.id}')">✏️</button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

function renderLeadsTab(leads) {
    const canCreate = AuthManager.hasPermission('create');
    
    return `
        <div class="glass-card p-6">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h3 class="text-white text-2xl font-bold mb-1">🎯 Leads</h3>
                    <p class="text-white opacity-75">Track and convert potential clients</p>
                </div>
                ${canCreate ? 
                    '<button class="btn btn-primary" onclick="CRUDManager.showAddLeadForm()">➕ Add Lead</button>' : 
                    ''
                }
            </div>
            
            ${leads.length === 0 ? `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">🎯</div>
                    <h4 class="text-white text-xl font-bold mb-2">No Leads Yet</h4>
                    <p class="text-white opacity-75 mb-6">Start by adding your first lead</p>
                    ${canCreate ? 
                        '<button class="btn btn-primary" onclick="CRUDManager.showAddLeadForm()">➕ Add First Lead</button>' : 
                        ''
                    }
                </div>
            ` : `
                <div class="overflow-x-auto">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Lead Name</th>
                                <th>Status</th>
                                <th>Assigned User</th>
                                <th>Company</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${leads.map(lead => `
                                <tr>
                                    <td class="font-semibold">${lead.name}</td>
                                    <td><span class="status-badge status-lead-${lead.status.toLowerCase().replace(' ', '')}">${lead.status}</span></td>
                                    <td>${lead.assignedUserName || '-'}</td>
                                    <td>${lead.companyName || '-'}</td>
                                    <td>
                                        <div class="flex gap-2">
                                            <button class="btn btn-sm btn-secondary" onclick="CRUDManager.showEditLeadForm('${lead.id}')">✏️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

function renderCalendarEventsTab(events) {
    const canCreate = AuthManager.hasPermission('create');
    
    return `
        <div class="glass-card p-6">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h3 class="text-white text-2xl font-bold mb-1">📅 Calendar Events</h3>
                    <p class="text-white opacity-75">Manage meetings, calls, and appointments</p>
                </div>
                ${canCreate ? 
                    '<button class="btn btn-primary" onclick="CRUDManager.showAddCalendarEventForm()">➕ Add Event</button>' : 
                    ''
                }
            </div>
            
            ${events.length === 0 ? `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">📅</div>
                    <h4 class="text-white text-xl font-bold mb-2">No Events Scheduled</h4>
                    <p class="text-white opacity-75 mb-6">Start by scheduling your first event</p>
                    ${canCreate ? 
                        '<button class="btn btn-primary" onclick="CRUDManager.showAddCalendarEventForm()">➕ Add First Event</button>' : 
                        ''
                    }
                </div>
            ` : `
                <div class="overflow-x-auto">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Event Title</th>
                                <th>Type</th>
                                <th>Start Date & Time</th>
                                <th>End Date & Time</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Clients</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${events.map(event => {
                                const startDate = new Date(event.startDateTime);
                                const endDate = new Date(event.endDateTime);
                                const clientNames = event.clients?.map(cId => {
                                    const client = AppState.data.clients.find(c => c.id === cId);
                                    return client ? client.name : 'Unknown';
                                }).join(', ') || '-';
                                
                                return `
                                    <tr>
                                        <td>
                                            <div class="font-semibold">${event.eventTitle}</div>
                                            ${event.description ? `<div class="text-xs opacity-75">${event.description.substring(0, 50)}${event.description.length > 50 ? '...' : ''}</div>` : ''}
                                        </td>
                                        <td><span class="status-badge badge-medium">${event.eventType}</span></td>
                                        <td>${startDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                        <td>${endDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                        <td>${event.location || '-'}</td>
                                        <td><span class="status-badge badge-${event.status === 'Completed' ? 'high' : event.status === 'Cancelled' ? 'low' : 'medium'}">${event.status}</span></td>
                                        <td>
                                            <div class="text-sm">${clientNames.substring(0, 30)}${clientNames.length > 30 ? '...' : ''}</div>
                                        </td>
                                        <td>
                                            <div class="flex gap-2">
                                                <button class="btn btn-sm btn-secondary" onclick="CRUDManager.showEditCalendarEventForm('${event.id}')">✏️</button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

function renderGeneralTodosTab(todos) {
    const canCreate = AuthManager.hasPermission('create');
    
    return `
        <div class="glass-card p-6">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h3 class="text-white text-2xl font-bold mb-1">📋 General To-Do List</h3>
                    <p class="text-white opacity-75">Manage general tasks and activities</p>
                </div>
                ${canCreate ? 
                    '<button class="btn btn-primary" onclick="CRUDManager.showAddTaskForm(\'general\')">➕ Add Task</button>' : 
                    ''
                }
            </div>
            
            ${todos.length === 0 ? `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">📋</div>
                    <h4 class="text-white text-xl font-bold mb-2">No Tasks Yet</h4>
                    <p class="text-white opacity-75 mb-6">Start by adding your first task</p>
                    ${canCreate ? 
                        '<button class="btn btn-primary" onclick="CRUDManager.showAddTaskForm(\'general\')">➕ Add First Task</button>' : 
                        ''
                    }
                </div>
            ` : `
                <div class="overflow-x-auto">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Task</th>
                                <th>Description</th>
                                <th>Due Date</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Assigned To</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${todos.map(task => {
                                const assignedUser = AppState.data.users.find(u => u.id === task.assignedUser);
                                return `
                                    <tr>
                                        <td class="font-semibold">${task.name}</td>
                                        <td>
                                            ${task.description ? 
                                                `<div class="text-sm opacity-75">${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}</div>` : 
                                                '-'
                                            }
                                        </td>
                                        <td>${task.dueDate || '-'}</td>
                                        <td><span class="status-badge badge-${task.priority === 'High' ? 'high' : task.priority === 'Medium' ? 'medium' : 'low'}">${task.priority}</span></td>
                                        <td><span class="status-badge badge-${task.status === 'Completed' ? 'completed' : task.status === 'Pending' ? 'pending' : 'in-progress'}">${task.status}</span></td>
                                        <td>${assignedUser ? assignedUser.name : 'Unassigned'}</td>
                                        <td>
                                            <div class="flex gap-2">
                                                <button class="btn btn-sm btn-secondary" onclick="CRUDManager.showEditTaskForm('${task.id}', 'general')">✏️</button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

function renderClientTodosTab(todos) {
    const canCreate = AuthManager.hasPermission('create');
    
    return `
        <div class="glass-card p-6">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h3 class="text-white text-2xl font-bold mb-1">✓ Client To-Do List</h3>
                    <p class="text-white opacity-75">Track client-specific tasks</p>
                </div>
                ${canCreate ? 
                    '<button class="btn btn-primary" onclick="CRUDManager.showAddTaskForm(\'client\')">➕ Add Task</button>' : 
                    ''
                }
            </div>
            
            ${todos.length === 0 ? `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">✓</div>
                    <h4 class="text-white text-xl font-bold mb-2">No Client Tasks Yet</h4>
                    <p class="text-white opacity-75 mb-6">Start by adding your first client task</p>
                    ${canCreate ? 
                        '<button class="btn btn-primary" onclick="CRUDManager.showAddTaskForm(\'client\')">➕ Add First Task</button>' : 
                        ''
                    }
                </div>
            ` : `
                <div class="overflow-x-auto">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Task</th>
                                <th>Client</th>
                                <th>Description</th>
                                <th>Due Date</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${todos.map(task => {
                                const client = AppState.data.clients.find(c => c.id === task.client);
                                return `
                                    <tr>
                                        <td class="font-semibold">${task.name}</td>
                                        <td>${client ? client.name : 'Unknown'}</td>
                                        <td>
                                            ${task.description ? 
                                                `<div class="text-sm opacity-75">${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}</div>` : 
                                                '-'
                                            }
                                        </td>
                                        <td>${task.dueDate || '-'}</td>
                                        <td><span class="status-badge badge-${task.priority === 'High' ? 'high' : task.priority === 'Medium' ? 'medium' : 'low'}">${task.priority}</span></td>
                                        <td><span class="status-badge badge-${task.status === 'Completed' ? 'completed' : task.status === 'Pending' ? 'pending' : 'in-progress'}">${task.status}</span></td>
                                        <td>
                                            <div class="flex gap-2">
                                                <button class="btn btn-sm btn-secondary" onclick="CRUDManager.showEditTaskForm('${task.id}', 'client')">✏️</button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

function renderUsersTab(users) {
    const canCreate = AuthManager.hasPermission('manage_users');
    
    return `
        <div class="glass-card p-6">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h3 class="text-white text-2xl font-bold mb-1">👤 Users</h3>
                    <p class="text-white opacity-75">Manage team members and permissions</p>
                </div>
                ${canCreate ? 
                    '<button class="btn btn-primary" onclick="CRUDManager.showAddUserForm()">➕ Add User</button>' : 
                    ''
                }
            </div>
            
            ${users.length === 0 ? `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">👤</div>
                    <h4 class="text-white text-xl font-bold mb-2">No Users Yet</h4>
                    <p class="text-white opacity-75 mb-6">Start by adding your first user</p>
                    ${canCreate ? 
                        '<button class="btn btn-primary" onclick="CRUDManager.showAddUserForm()">➕ Add First User</button>' : 
                        ''
                    }
                </div>
            ` : `
                <div class="overflow-x-auto">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(user => `
                                <tr>
                                    <td>
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 rounded-full overflow-hidden bg-white bg-opacity-10 flex items-center justify-center">
                                                ${user.photo ? 
                                                    `<img src="${user.photo}" alt="${user.name}" class="w-full h-full object-cover">` : 
                                                    '<span class="text-lg">👤</span>'
                                                }
                                            </div>
                                            <span class="font-semibold">${user.name}</span>
                                        </div>
                                    </td>
                                    <td>${user.email}</td>
                                    <td>${user.phoneNumber || user.phone || '-'}</td>
                                    <td><span class="status-badge badge-${user.role === 'Admin' ? 'high' : user.role === 'Manager' ? 'medium' : 'low'}">${user.role}</span></td>
                                    <td><span class="status-badge badge-${user.status === 'Active' ? 'high' : 'low'}">${user.status || 'Active'}</span></td>
                                    <td>
                                        <div class="flex gap-2">
                                            ${canCreate ? 
                                                `<button class="btn btn-sm btn-secondary" onclick="CRUDManager.showEditUserForm('${user.id}')">✏️</button>` : 
                                                ''
                                            }
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

// ========================================
// INITIALIZATION
// ========================================

async function initializeApp() {
    console.log('🚀 Initializing CRM Application...');
    
    // Check for stored session
    if (AuthManager.checkStoredSession()) {
        console.log('✅ Found stored session');
        
        try {
            // Load companies
            await loadCompanies();
            
            // If user was in a company, restore state
            const lastCompany = localStorage.getItem('crm_last_company');
            if (lastCompany && AppState.data.companies.find(c => c.id === lastCompany)) {
                await loadCompanyData(lastCompany);
                
                // Check permissions and navigate appropriately
                if (AuthManager.hasPermission('view_all')) {
                    navigateTo('dashboard');
                } else {
                    const currentUser = AuthManager.currentUser;
                    const userInCompany = AppState.data.users.find(u => u.id === currentUser.id);
                    
                    if (userInCompany) {
                        AppState.selectedUser = currentUser.id;
                        navigateTo('dashboard');
                    } else {
                        navigateTo('companySelection');
                    }
                }
            } else {
                navigateTo('companySelection');
            }
        } catch (error) {
            console.error('Error restoring session:', error);
            navigateTo('companySelection');
        }
    } else {
        console.log('ℹ️ No stored session found');
        AuthManager.showLoginForm();
    }
}

// Save last company for session restoration
window.addEventListener('beforeunload', () => {
    if (AppState.selectedCompany) {
        localStorage.setItem('crm_last_company', AppState.selectedCompany);
    }
});

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM Ready');
    initializeApp();
});

// Handle form input clearing errors on focus
document.addEventListener('focus', (e) => {
    if (e.target.matches('.form-input, .form-select, .form-textarea')) {
        const group = e.target.closest('.form-group');
        if (group) {
            group.classList.remove('error');
        }
    }
}, true);

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    if (typeof CRUDManager !== 'undefined') {
        CRUDManager.showToast('❌ An unexpected error occurred', 'error');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    if (typeof CRUDManager !== 'undefined') {
        CRUDManager.showToast('❌ An error occurred while processing your request', 'error');
    }
});

console.log('✅ Main Application Script Loaded - SCHEMA COMPLIANT');
console.log('🎯 CRM System Ready');
console.log('📊 Version: 2.0.0 - Schema Validated');
console.log('🔧 Environment:', AirtableAPI.isConfigured() ? 'Production (Airtable)' : 'Demo Mode');
console.log('✅ All tables implemented:');
console.log('   - Companies (with Industry, Location, Notes)');
console.log('   - Users (with PhoneNumber, Status, lookups)');
console.log('   - Clients (ALL schema fields including formulas)');
console.log('   - Leads (schema compliant with lookups)');
console.log('   - Calendar Events (NEW - fully functional)');
console.log('   - General To-Do List (with Description, CreatedDate)');
console.log('   - Client To-Do List (with Description, CreatedDate)');

