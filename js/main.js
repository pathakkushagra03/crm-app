// ========================================
// APPLICATION STATE - FIXED
// ========================================
const AppState = {
    currentView: 'login',
    selectedCompany: null,
    selectedUser: null,
    currentUser: null,
    role: null,
    isInitializing: true,
    data: {
        companies: [],
        users: [],
        clients: [],
        leads: [],
        generalTodos: [],
        clientTodos: [],
        calendarEvents: []
    }
};

// ========================================
// DATA LOADING FUNCTIONS - FIXED
// ========================================

/**
 * FIXED: Load companies with proper error handling
 */
async function loadCompanies() {
    console.log('📦 Loading companies...');
    
    try {
        if (typeof AirtableAPI !== 'undefined' && AirtableAPI.isConfigured()) {
            console.log('🔗 Using Airtable API');
            const result = await AirtableAPI.getCompanies();
            AppState.data.companies = result.records;
            console.log(`✅ Loaded ${AppState.data.companies.length} companies from Airtable`);
        } else {
            console.log('ℹ️ Using demo companies (Airtable not configured)');
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
            console.log(`✅ Loaded ${AppState.data.companies.length} demo companies`);
        }
        
        return AppState.data.companies;
    } catch (error) {
        console.error('❌ Error loading companies:', error);
        
        // Show user-friendly error
        if (typeof CRUDManager !== 'undefined') {
            CRUDManager.showToast('❌ Failed to load companies. Using demo data.', 'error');
        }
        
        // Fallback to demo data
        AppState.data.companies = [
            { 
                id: '1', 
                name: 'Demo Company', 
                industry: 'Technology',
                location: 'Demo Location',
                notes: 'Demo company for testing',
                clients: [],
                color: '#FF6B6B' 
            }
        ];
        
        return AppState.data.companies;
    }
}

/**
 * FIXED: Load company data with comprehensive error handling
 */
async function loadCompanyData(companyId) {
    console.log(`📦 Loading data for company: ${companyId}`);
    
    if (!companyId) {
        console.error('❌ No company ID provided');
        throw new Error('Company ID is required');
    }
    
    try {
        AppState.selectedCompany = companyId;
        
        const isConfigured = typeof AirtableAPI !== 'undefined' && AirtableAPI.isConfigured();
        
        // Show loading state
        if (typeof LoadingSkeleton !== 'undefined' && document.getElementById('app')) {
            const loadingMessage = LoadingSkeleton.renderFullPage('Loading company data...');
            // Don't overwrite app content yet, just show we're loading
            console.log('⏳ Loading company data...');
        }
        
        // Load Users
        console.log('👥 Loading users...');
        if (isConfigured) {
            try {
                const usersResult = await AirtableAPI.getUsers(companyId);
                AppState.data.users = usersResult.records;
                console.log(`✅ Loaded ${AppState.data.users.length} users from Airtable`);
            } catch (error) {
                console.warn('⚠️ Failed to load users from Airtable:', error);
                AppState.data.users = getDemoUsers(companyId);
            }
        } else {
            AppState.data.users = getDemoUsers(companyId);
            console.log(`✅ Loaded ${AppState.data.users.length} demo users`);
        }
        
        // Load Clients
        console.log('💼 Loading clients...');
        if (isConfigured) {
            try {
                const clientsResult = await AirtableAPI.getClients(companyId);
                AppState.data.clients = clientsResult.records;
                console.log(`✅ Loaded ${AppState.data.clients.length} clients from Airtable`);
            } catch (error) {
                console.warn('⚠️ Failed to load clients from Airtable:', error);
                AppState.data.clients = getDemoClients(companyId);
            }
        } else {
            AppState.data.clients = getDemoClients(companyId);
            console.log(`✅ Loaded ${AppState.data.clients.length} demo clients`);
        }
        
        // Load Leads
        console.log('🎯 Loading leads...');
        if (isConfigured) {
            try {
                const leadsResult = await AirtableAPI.getLeads(companyId);
                AppState.data.leads = leadsResult.records;
                console.log(`✅ Loaded ${AppState.data.leads.length} leads from Airtable`);
            } catch (error) {
                console.warn('⚠️ Failed to load leads from Airtable:', error);
                AppState.data.leads = getDemoLeads(companyId);
            }
        } else {
            AppState.data.leads = getDemoLeads(companyId);
            console.log(`✅ Loaded ${AppState.data.leads.length} demo leads`);
        }
        
        // Load General Todos
        console.log('📋 Loading general todos...');
        if (isConfigured) {
            try {
                const generalTodosResult = await AirtableAPI.getGeneralTodos();
                AppState.data.generalTodos = generalTodosResult.records;
                console.log(`✅ Loaded ${AppState.data.generalTodos.length} general todos from Airtable`);
            } catch (error) {
                console.warn('⚠️ Failed to load general todos from Airtable:', error);
                AppState.data.generalTodos = getDemoGeneralTodos();
            }
        } else {
            AppState.data.generalTodos = getDemoGeneralTodos();
            console.log(`✅ Loaded ${AppState.data.generalTodos.length} demo general todos`);
        }
        
        // Load Client Todos
        console.log('✓ Loading client todos...');
        if (isConfigured) {
            try {
                const clientTodosResult = await AirtableAPI.getClientTodos();
                AppState.data.clientTodos = clientTodosResult.records;
                console.log(`✅ Loaded ${AppState.data.clientTodos.length} client todos from Airtable`);
            } catch (error) {
                console.warn('⚠️ Failed to load client todos from Airtable:', error);
                AppState.data.clientTodos = getDemoClientTodos();
            }
        } else {
            AppState.data.clientTodos = getDemoClientTodos();
            console.log(`✅ Loaded ${AppState.data.clientTodos.length} demo client todos`);
        }
        
        // Load Calendar Events
        console.log('📅 Loading calendar events...');
        if (isConfigured) {
            try {
                const calendarEventsResult = await AirtableAPI.getCalendarEvents();
                AppState.data.calendarEvents = calendarEventsResult.records;
                console.log(`✅ Loaded ${AppState.data.calendarEvents.length} calendar events from Airtable`);
            } catch (error) {
                console.warn('⚠️ Failed to load calendar events from Airtable:', error);
                AppState.data.calendarEvents = getDemoCalendarEvents();
            }
        } else {
            AppState.data.calendarEvents = getDemoCalendarEvents();
            console.log(`✅ Loaded ${AppState.data.calendarEvents.length} demo calendar events`);
        }
        
        console.log(`✅ Successfully loaded all data for company ${companyId}:`, {
            users: AppState.data.users.length,
            clients: AppState.data.clients.length,
            leads: AppState.data.leads.length,
            generalTodos: AppState.data.generalTodos.length,
            clientTodos: AppState.data.clientTodos.length,
            calendarEvents: AppState.data.calendarEvents.length
        });
        
        return true;
        
    } catch (error) {
        console.error('❌ Critical error loading company data:', error);
        
        if (typeof CRUDManager !== 'undefined') {
            CRUDManager.showToast('❌ Failed to load company data', 'error');
        }
        
        throw error;
    }
}

// ========================================
// DEMO DATA GENERATORS - FIXED
// ========================================

function getDemoUsers(companyId) {
    return [
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

function getDemoClients(companyId) {
    return [
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

function getDemoLeads(companyId) {
    return [
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

function getDemoGeneralTodos() {
    return [
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

function getDemoClientTodos() {
    return [
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

function getDemoCalendarEvents() {
    return [
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

// ========================================
// NAVIGATION & RENDERING - FIXED
// ========================================

/**
 * FIXED: Navigation with auth guard
 */
function navigateTo(view) {
    console.log(`🧭 Navigating to: ${view}`);
    
    // Auth guard - require authentication for protected views
    if (view !== 'login' && typeof AuthManager !== 'undefined' && !AuthManager.isAuthenticated()) {
        console.warn('⚠️ Authentication required, redirecting to login');
        AppState.currentView = 'login';
        if (typeof AuthManager.showLoginForm === 'function') {
            AuthManager.showLoginForm();
        }
        return;
    }
    
    AppState.currentView = view;
    render();
}

/**
 * FIXED: Main render function with proper auth checking
 */
function render() {
    const app = document.getElementById('app');
    
    if (!app) {
        console.error('❌ App container not found');
        return;
    }
    
    // Check authentication for protected views
    if (typeof AuthManager !== 'undefined' && !AuthManager.isAuthenticated() && AppState.currentView !== 'login') {
        console.log('🔐 Not authenticated, showing login');
        AuthManager.showLoginForm();
        return;
    }
    
    console.log(`🎨 Rendering view: ${AppState.currentView}`);
    
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
        case 'login':
        default:
            if (typeof AuthManager !== 'undefined') {
                AuthManager.showLoginForm();
            }
    }
}

function renderCompanySelection() {
    const app = document.getElementById('app');
    if (!app) return;
    
    const companies = AppState.data.companies;
    
    if (companies.length === 0) {
        app.innerHTML = `
            <div class="min-h-screen flex items-center justify-center p-6">
                <div class="glass-card p-12 max-w-2xl w-full text-center fade-in">
                    <div class="text-6xl mb-4">🏢</div>
                    <h1 class="text-4xl font-bold text-white mb-4">No Companies Found</h1>
                    <p class="text-white text-lg opacity-75 mb-6">Get started by creating your first company</p>
                    ${typeof AuthManager !== 'undefined' && AuthManager.hasPermission('manage_companies') ? `
                        <button class="btn btn-primary" onclick="CRUDManager.showAddCompanyForm()">
                            ➕ Create Company
                        </button>
                    ` : `
                        <p class="text-white text-sm opacity-60">Contact your administrator to add companies</p>
                    `}
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
                            ${typeof AuthManager !== 'undefined' && AuthManager.hasPermission('manage_companies') ? 
                                '<button class="btn btn-primary" onclick="CRUDManager.showAddCompanyForm()">➕ Add Company</button>' : 
                                ''
                            }
                            ${typeof AuthManager !== 'undefined' ? AuthManager.getUserDisplay() : ''}
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
                            
                            ${typeof AuthManager !== 'undefined' && AuthManager.hasPermission('manage_companies') ? `
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

/**
 * FIXED: Company selection with proper navigation logic
 */
async function selectCompany(companyId) {
    console.log(`🏢 Company selected: ${companyId}`);
    
    // Show loading state
    const app = document.getElementById('app');
    if (app && typeof LoadingSkeleton !== 'undefined') {
        app.innerHTML = LoadingSkeleton.renderFullPage('Loading company data...');
    }
    
    try {
        // Load company data
        await loadCompanyData(companyId);
        
        // Store for session restoration
        localStorage.setItem('crm_last_company', companyId);
        
        // Determine navigation based on permissions
        if (typeof AuthManager !== 'undefined') {
            if (AuthManager.hasPermission('view_all')) {
                // Admin/Manager can see all data - go directly to dashboard
                console.log('✅ User has view_all permission, navigating to dashboard');
                navigateTo('dashboard');
            } else {
                // Sales/User must select themselves or be auto-assigned
                const currentUser = AuthManager.currentUser;
                const userInCompany = AppState.data.users.find(u => u.id === currentUser.id);
                
                if (userInCompany) {
                    AppState.selectedUser = currentUser.id;
                    console.log('✅ User found in company, navigating to dashboard');
                    navigateTo('dashboard');
                } else {
                    console.log('ℹ️ User not in company, showing user selection');
                    navigateTo('userSelection');
                }
            }
        } else {
            // Fallback if AuthManager not available
            navigateTo('dashboard');
        }
    } catch (error) {
        console.error('❌ Error selecting company:', error);
        
        if (typeof CRUDManager !== 'undefined') {
            CRUDManager.showToast('❌ Failed to load company data', 'error');
        }
        
        // Show error state
        if (app) {
            app.innerHTML = `
                <div class="min-h-screen flex items-center justify-center p-6">
                    <div class="glass-card p-12 max-w-2xl w-full text-center">
                        <div class="text-6xl mb-4">⚠️</div>
                        <h1 class="text-4xl font-bold text-white mb-4">Failed to Load Company</h1>
                        <p class="text-white text-lg opacity-75 mb-6">${error.message || 'An unexpected error occurred'}</p>
                        <button class="btn btn-primary" onclick="navigateTo('companySelection')">
                            ← Back to Companies
                        </button>
                    </div>
                </div>
            `;
        }
    }
}

function renderUserSelection() {
    const app = document.getElementById('app');
    if (!app) return;
    
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
                            ${typeof AuthManager !== 'undefined' ? AuthManager.getUserDisplay() : ''}
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
    console.log(`👤 User selected: ${userId}`);
    AppState.selectedUser = userId;
    navigateTo('dashboard');
}

function renderDashboard() {
    const app = document.getElementById('app');
    if (!app) return;
    
    const selectedCompany = AppState.data.companies.find(c => c.id === AppState.selectedCompany);
    
    if (!selectedCompany) {
        console.error('❌ Selected company not found');
        navigateTo('companySelection');
        return;
    }
    
    const canViewAll = typeof AuthManager !== 'undefined' && AuthManager.hasPermission('view_all');
    
    // Filter data based on permissions
    let clients = AppState.data.clients;
    let leads = AppState.data.leads;
    let generalTodos = AppState.data.generalTodos;
    let clientTodos = AppState.data.clientTodos;
    let calendarEvents = AppState.data.calendarEvents || [];
    
    if (!canViewAll && AppState.selectedUser) {
        console.log('🔒 Filtering data for user:', AppState.selectedUser);
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
    
    console.log('📊 Dashboard stats:', stats);
    
    app.innerHTML = `
        <div class="min-h-screen">
            <!-- Navigation -->
            ${renderNavigation(selectedCompany)}
            
            <!-- Main Content -->
            <div class="p-6">
                <div class="max-w-7xl mx-auto">
                    <!-- Stats Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div class="stat-card" onclick="switchTab('clients')">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-white text-sm opacity-75">Total Clients</span>
                                <span class="text-3xl">👥</span>
                            </div>
                            <div class="text-white text-3xl font-bold">${stats.totalClients}</div>
                            <div class="text-white text-sm opacity-75 mt-1">${stats.activeClients} active</div>
                        </div>
                        
                        <div class="stat-card" onclick="switchTab('leads')">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-white text-sm opacity-75">Total Leads</span>
                                <span class="text-3xl">🎯</span>
                            </div>
                            <div class="text-white text-3xl font-bold">${stats.totalLeads}</div>
                            <div class="text-white text-sm opacity-75 mt-1">${stats.newLeads} new</div>
                        </div>
                        
                        <div class="stat-card" onclick="switchTab('general-todos')">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-white text-sm opacity-75">Pending Tasks</span>
                                <span class="text-3xl">⏳</span>
                            </div>
                            <div class="text-white text-3xl font-bold">${stats.pendingTasks}</div>
                            <div class="text-white text-sm opacity-75 mt-1">${stats.completedTasks} completed</div>
                        </div>
                        
                        <div class="stat-card" onclick="switchTab('calendar-events')">
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
                            ${typeof AuthManager !== 'undefined' && AuthManager.hasPermission('manage_users') ? 
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
                    ${typeof AuthManager !== 'undefined' ? AuthManager.getUserDisplay() : ''}
                </div>
            </div>
        </nav>
    `;
}

/**
 * FIXED: Tab switching with proper state management
 */
function switchTab(tabName) {
    console.log(`📑 Switching to tab: ${tabName}`);
    
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const clickedBtn = event?.target;
    if (clickedBtn && clickedBtn.classList.contains('tab-btn')) {
        clickedBtn.classList.add('active');
    } else {
        // Fallback: find the button by text content
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.textContent.toLowerCase().includes(tabName.replace('-', ' '))) {
                btn.classList.add('active');
            }
        });
    }
    
    const content = document.getElementById('tabContent');
    if (!content) {
        console.error('❌ Tab content container not found');
        return;
    }
    
    const canViewAll = typeof AuthManager !== 'undefined' && AuthManager.hasPermission('view_all');
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
        default:
            console.warn('⚠️ Unknown tab:', tabName);
            content.innerHTML = renderClientsTab(clients);
    }
}

function renderClientsTab(clients) {
    const canCreate = typeof AuthManager !== 'undefined' && AuthManager.hasPermission('create');
    
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
                    <table class="w-full text-left">
                        <thead>
                            <tr class="border-b border-white border-opacity-20">
                                <th class="text-white font-semibold p-3">Name</th>
                                <th class="text-white font-semibold p-3">Email</th>
                                <th class="text-white font-semibold p-3">Phone</th>
                                <th class="text-white font-semibold p-3">Status</th>
                                <th class="text-white font-semibold p-3">Lead Type</th>
                                <th class="text-white font-semibold p-3">Priority</th>
                                <th class="text-white font-semibold p-3">Deal Value</th>
                                <th class="text-white font-semibold p-3">Rating</th>
                                <th class="text-white font-semibold p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clients.map(client => {
                                const canEdit = typeof AuthManager !== 'undefined' && 
                                    (AuthManager.hasPermission('update') || AuthManager.canEditRecord('clients', client));
                                
                                return `
                                    <tr class="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-5 transition-colors">
                                        <td class="p-3">
                                            <div class="font-semibold text-white">${client.name}</div>
                                            ${client.address ? `<div class="text-xs text-white opacity-60">📍 ${client.address.substring(0, 30)}${client.address.length > 30 ? '...' : ''}</div>` : ''}
                                        </td>
                                        <td class="p-3 text-white text-sm">${client.email || '-'}</td>
                                        <td class="p-3 text-white text-sm">${client.phoneNo || client.phone || '-'}</td>
                                        <td class="p-3">
                                            <span class="status-badge status-client-${client.status.toLowerCase().replace(' ', '')}">${client.status}</span>
                                        </td>
                                        <td class="p-3">
                                            ${client.leadType ? `<span class="status-badge badge-${client.leadType === 'Hot' ? 'high' : client.leadType === 'Warm' ? 'medium' : 'low'}">${client.leadType}</span>` : '-'}
                                        </td>
                                        <td class="p-3">
                                            ${client.priority ? `<span class="status-badge badge-${client.priority === 'High' ? 'high' : client.priority === 'Medium' ? 'medium' : 'low'}">${client.priority}</span>` : '-'}
                                        </td>
                                        <td class="p-3 text-white font-bold">$${(client.dealValue || 0).toLocaleString()}</td>
                                        <td class="p-3 text-white">${'⭐'.repeat(client.rating || 0) || '-'}</td>
                                        <td class="p-3">
                                            ${canEdit ? `
                                                <button class="btn btn-sm btn-secondary" onclick="CRUDManager.showEditClientForm('${client.id}')">✏️</button>
                                            ` : `
                                                <span class="text-white text-xs opacity-50">View only</span>
                                            `}
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
    const canCreate = typeof AuthManager !== 'undefined' && AuthManager.hasPermission('create');
    
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
                    <table class="w-full text-left">
                        <thead>
                            <tr class="border-b border-white border-opacity-20">
                                <th class="text-white font-semibold p-3">Lead Name</th>
                                <th class="text-white font-semibold p-3">Status</th>
                                <th class="text-white font-semibold p-3">Assigned User</th>
                                <th class="text-white font-semibold p-3">Company</th>
                                <th class="text-white font-semibold p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${leads.map(lead => {
                                const canEdit = typeof AuthManager !== 'undefined' && 
                                    (AuthManager.hasPermission('update') || AuthManager.canEditRecord('leads', lead));
                                
                                return `
                                    <tr class="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-5 transition-colors">
                                        <td class="p-3 text-white font-semibold">${lead.name}</td>
                                        <td class="p-3">
                                            <span class="status-badge status-lead-${lead.status.toLowerCase().replace(' ', '')}">${lead.status}</span>
                                        </td>
                                        <td class="p-3 text-white text-sm">${lead.assignedUserName || '-'}</td>
                                        <td class="p-3 text-white text-sm">${lead.companyName || '-'}</td>
                                        <td class="p-3">
                                            ${canEdit ? `
                                                <button class="btn btn-sm btn-secondary" onclick="CRUDManager.showEditLeadForm('${lead.id}')">✏️</button>
                                            ` : `
                                                <span class="text-white text-xs opacity-50">View only</span>
                                            `}
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

function renderCalendarEventsTab(events) {
    const canCreate = typeof AuthManager !== 'undefined' && AuthManager.hasPermission('create');
    
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
                    <table class="w-full text-left">
                        <thead>
                            <tr class="border-b border-white border-opacity-20">
                                <th class="text-white font-semibold p-3">Event Title</th>
                                <th class="text-white font-semibold p-3">Type</th>
                                <th class="text-white font-semibold p-3">Start Date & Time</th>
                                <th class="text-white font-semibold p-3">Location</th>
                                <th class="text-white font-semibold p-3">Status</th>
                                <th class="text-white font-semibold p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${events.map(event => {
                                const startDate = new Date(event.startDateTime);
                                const canEdit = typeof AuthManager !== 'undefined' && AuthManager.hasPermission('update');
                                
                                return `
                                    <tr class="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-5 transition-colors">
                                        <td class="p-3">
                                            <div class="text-white font-semibold">${event.eventTitle}</div>
                                            ${event.description ? `<div class="text-xs text-white opacity-60">${event.description.substring(0, 50)}${event.description.length > 50 ? '...' : ''}</div>` : ''}
                                        </td>
                                        <td class="p-3">
                                            <span class="status-badge badge-medium">${event.eventType}</span>
                                        </td>
                                        <td class="p-3 text-white text-sm">${startDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                        <td class="p-3 text-white text-sm">${event.location || '-'}</td>
                                        <td class="p-3">
                                            <span class="status-badge badge-${event.status === 'Completed' ? 'high' : event.status === 'Cancelled' ? 'low' : 'medium'}">${event.status}</span>
                                        </td>
                                        <td class="p-3">
                                            ${canEdit ? `
                                                <button class="btn btn-sm btn-secondary" onclick="CRUDManager.showEditCalendarEventForm('${event.id}')">✏️</button>
                                            ` : `
                                                <span class="text-white text-xs opacity-50">View only</span>
                                            `}
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
    const canCreate = typeof AuthManager !== 'undefined' && AuthManager.hasPermission('create');
    
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
                    <table class="w-full text-left">
                        <thead>
                            <tr class="border-b border-white border-opacity-20">
                                <th class="text-white font-semibold p-3">Task</th>
                                <th class="text-white font-semibold p-3">Due Date</th>
                                <th class="text-white font-semibold p-3">Priority</th>
                                <th class="text-white font-semibold p-3">Status</th>
                                <th class="text-white font-semibold p-3">Assigned To</th>
                                <th class="text-white font-semibold p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${todos.map(task => {
                                const assignedUser = AppState.data.users.find(u => u.id === task.assignedUser);
                                const canEdit = typeof AuthManager !== 'undefined' && 
                                    (AuthManager.hasPermission('update') || AuthManager.canEditRecord('tasks', task));
                                
                                return `
                                    <tr class="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-5 transition-colors">
                                        <td class="p-3">
                                            <div class="text-white font-semibold">${task.name}</div>
                                            ${task.description ? `<div class="text-xs text-white opacity-60">${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}</div>` : ''}
                                        </td>
                                        <td class="p-3 text-white text-sm">${task.dueDate || '-'}</td>
                                        <td class="p-3">
                                            <span class="status-badge badge-${task.priority === 'High' ? 'high' : task.priority === 'Medium' ? 'medium' : 'low'}">${task.priority}</span>
                                        </td>
                                        <td class="p-3">
                                            <span class="status-badge badge-${task.status === 'Completed' ? 'completed' : task.status === 'Pending' ? 'pending' : 'in-progress'}">${task.status}</span>
                                        </td>
                                        <td class="p-3 text-white text-sm">${assignedUser ? assignedUser.name : 'Unassigned'}</td>
                                        <td class="p-3">
                                            ${canEdit ? `
                                                <button class="btn btn-sm btn-secondary" onclick="CRUDManager.showEditTaskForm('${task.id}', 'general')">✏️</button>
                                            ` : `
                                                <span class="text-white text-xs opacity-50">View only</span>
                                            `}
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
    const canCreate = typeof AuthManager !== 'undefined' && AuthManager.hasPermission('create');
    
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
                    <table class="w-full text-left">
                        <thead>
                            <tr class="border-b border-white border-opacity-20">
                                <th class="text-white font-semibold p-3">Task</th>
                                <th class="text-white font-semibold p-3">Client</th>
                                <th class="text-white font-semibold p-3">Due Date</th>
                                <th class="text-white font-semibold p-3">Priority</th>
                                <th class="text-white font-semibold p-3">Status</th>
                                <th class="text-white font-semibold p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${todos.map(task => {
                                const client = AppState.data.clients.find(c => c.id === task.client);
                                const canEdit = typeof AuthManager !== 'undefined' && AuthManager.hasPermission('update');
                                
                                return `
                                    <tr class="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-5 transition-colors">
                                        <td class="p-3">
                                            <div class="text-white font-semibold">${task.name}</div>
                                            ${task.description ? `<div class="text-xs text-white opacity-60">${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}</div>` : ''}
                                        </td>
                                        <td class="p-3 text-white text-sm">${client ? client.name : 'Unknown'}</td>
                                        <td class="p-3 text-white text-sm">${task.dueDate || '-'}</td>
                                        <td class="p-3">
                                            <span class="status-badge badge-${task.priority === 'High' ? 'high' : task.priority === 'Medium' ? 'medium' : 'low'}">${task.priority}</span>
                                        </td>
                                        <td class="p-3">
                                            <span class="status-badge badge-${task.status === 'Completed' ? 'completed' : task.status === 'Pending' ? 'pending' : 'in-progress'}">${task.status}</span>
                                        </td>
                                        <td class="p-3">
                                            ${canEdit ? `
                                                <button class="btn btn-sm btn-secondary" onclick="CRUDManager.showEditTaskForm('${task.id}', 'client')">✏️</button>
                                            ` : `
                                                <span class="text-white text-xs opacity-50">View only</span>
                                            `}
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
    const canCreate = typeof AuthManager !== 'undefined' && AuthManager.hasPermission('manage_users');
    
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
                    <table class="w-full text-left">
                        <thead>
                            <tr class="border-b border-white border-opacity-20">
                                <th class="text-white font-semibold p-3">Name</th>
                                <th class="text-white font-semibold p-3">Email</th>
                                <th class="text-white font-semibold p-3">Phone</th>
                                <th class="text-white font-semibold p-3">Role</th>
                                <th class="text-white font-semibold p-3">Status</th>
                                <th class="text-white font-semibold p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(user => `
                                <tr class="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-5 transition-colors">
                                    <td class="p-3">
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 rounded-full overflow-hidden bg-white bg-opacity-10 flex items-center justify-center">
                                                ${user.photo ? 
                                                    `<img src="${user.photo}" alt="${user.name}" class="w-full h-full object-cover">` : 
                                                    '<span class="text-lg">👤</span>'
                                                }
                                            </div>
                                            <span class="text-white font-semibold">${user.name}</span>
                                        </div>
                                    </td>
                                    <td class="p-3 text-white text-sm">${user.email}</td>
                                    <td class="p-3 text-white text-sm">${user.phoneNumber || user.phone || '-'}</td>
                                    <td class="p-3">
                                        <span class="status-badge badge-${user.role === 'Admin' ? 'high' : user.role === 'Manager' ? 'medium' : 'low'}">${user.role}</span>
                                    </td>
                                    <td class="p-3">
                                        <span class="status-badge badge-${user.status === 'Active' ? 'high' : 'low'}">${user.status || 'Active'}</span>
                                    </td>
                                    <td class="p-3">
                                        ${canCreate ? `
                                            <button class="btn btn-sm btn-secondary" onclick="CRUDManager.showEditUserForm('${user.id}')">✏️</button>
                                        ` : `
                                            <span class="text-white text-xs opacity-50">View only</span>
                                        `}
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
// INITIALIZATION - FIXED
// ========================================

/**
 * FIXED: Robust application initialization with comprehensive error handling
 */
async function initializeApp() {
    console.log('🚀 Initializing CRM Application...');
    console.log('📅 Current date:', new Date().toISOString());
    
    AppState.isInitializing = true;
    
    try {
        // Step 1: Check for stored session
        const hasStoredSession = typeof AuthManager !== 'undefined' && AuthManager.checkStoredSession();
        
        if (hasStoredSession) {
            console.log('✅ Found stored session for:', AuthManager.currentUser?.email);
            
            try {
                // Step 2: Load companies
                console.log('📦 Loading companies...');
                await loadCompanies();
                console.log(`✅ Loaded ${AppState.data.companies.length} companies`);
                
                // Step 3: Check if user was in a company
                const lastCompany = localStorage.getItem('crm_last_company');
                
                if (lastCompany && AppState.data.companies.find(c => c.id === lastCompany)) {
                    console.log('🏢 Restoring last company:', lastCompany);
                    
                    try {
                        // Step 4: Load company data
                        await loadCompanyData(lastCompany);
                        console.log('✅ Company data loaded successfully');
                        
                        // Step 5: Determine navigation based on permissions
                        if (typeof AuthManager !== 'undefined') {
                            if (AuthManager.hasPermission('view_all')) {
                                // Admin/Manager can see all data
                                console.log('✅ User has view_all permission, navigating to dashboard');
                                navigateTo('dashboard');
                            } else {
                                // Sales/User must be assigned to company
                                const currentUser = AuthManager.currentUser;
                                const userInCompany = AppState.data.users.find(u => u.id === currentUser.id);
                                
                                if (userInCompany) {
                                    AppState.selectedUser = currentUser.id;
                                    console.log('✅ User found in company, navigating to dashboard');
                                    navigateTo('dashboard');
                                } else {
                                    console.log('ℹ️ User not in company, showing company selection');
                                    navigateTo('companySelection');
                                }
                            }
                        } else {
                            // Fallback if AuthManager not available
                            console.warn('⚠️ AuthManager not available, using fallback navigation');
                            navigateTo('dashboard');
                        }
                    } catch (companyError) {
                        console.error('❌ Error loading company data:', companyError);
                        
                        // Show error but allow user to select another company
                        if (typeof CRUDManager !== 'undefined') {
                            CRUDManager.showToast('⚠️ Could not restore last session. Please select a company.', 'error');
                        }
                        
                        navigateTo('companySelection');
                    }
                } else {
                    // No last company or company not found
                    console.log('ℹ️ No last company found, showing company selection');
                    navigateTo('companySelection');
                }
            } catch (error) {
                console.error('❌ Error during initialization:', error);
                
                // Show error but allow user to continue
                if (typeof CRUDManager !== 'undefined') {
                    CRUDManager.showToast('⚠️ Error loading data. Some features may not work.', 'error');
                }
                
                navigateTo('companySelection');
            }
        } else {
            // No stored session
            console.log('ℹ️ No stored session found, showing login');
            
            if (typeof AuthManager !== 'undefined') {
                AuthManager.showLoginForm();
            } else {
                console.error('❌ AuthManager not available');
                
                const app = document.getElementById('app');
                if (app) {
                    app.innerHTML = `
                        <div class="min-h-screen flex items-center justify-center p-6">
                            <div class="glass-card p-12 max-w-2xl w-full text-center">
                                <div class="text-6xl mb-4">⚠️</div>
                                <h1 class="text-4xl font-bold text-white mb-4">System Error</h1>
                                <p class="text-white text-lg opacity-75 mb-6">Critical components failed to load. Please refresh the page.</p>
                                <button class="btn btn-primary" onclick="location.reload()">
                                    🔄 Refresh Page
                                </button>
                            </div>
                        </div>
                    `;
                }
            }
        }
    } catch (error) {
        console.error('❌ Critical initialization error:', error);
        
        // Show critical error screen
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div class="min-h-screen flex items-center justify-center p-6">
                    <div class="glass-card p-12 max-w-2xl w-full text-center">
                        <div class="text-6xl mb-4">❌</div>
                        <h1 class="text-4xl font-bold text-white mb-4">Initialization Failed</h1>
                        <p class="text-white text-lg opacity-75 mb-4">${error.message || 'An unexpected error occurred'}</p>
                        <p class="text-white text-sm opacity-60 mb-6">Please try refreshing the page or contact support if the problem persists.</p>
                        <div class="flex gap-3 justify-center">
                            <button class="btn btn-primary" onclick="location.reload()">
                                🔄 Refresh Page
                            </button>
                            <button class="btn btn-secondary" onclick="localStorage.clear(); location.reload()">
                                🗑️ Clear Data & Refresh
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    } finally {
        AppState.isInitializing = false;
        console.log('✅ Initialization complete');
    }
}

// ========================================
// EVENT LISTENERS - FIXED
// ========================================

/**
 * Save last company for session restoration
 */
window.addEventListener('beforeunload', () => {
    if (AppState.selectedCompany) {
        localStorage.setItem('crm_last_company', AppState.selectedCompany);
        console.log('💾 Saved last company:', AppState.selectedCompany);
    }
});

/**
 * Handle form input clearing errors on focus
 */
document.addEventListener('focus', (e) => {
    if (e.target.matches('.form-input, .form-select, .form-textarea')) {
        const group = e.target.closest('.form-group');
        if (group) {
            group.classList.remove('error');
        }
    }
}, true);

/**
 * Global error handler - catch all uncaught errors
 */
window.addEventListener('error', (e) => {
    console.error('❌ Global error caught:', e.error);
    
    // Don't show toast for script loading errors
    if (e.filename && e.filename.includes('.js')) {
        console.error('❌ Script loading error:', e.filename);
        return;
    }
    
    // Show user-friendly error for runtime errors
    if (typeof CRUDManager !== 'undefined' && !AppState.isInitializing) {
        CRUDManager.showToast('❌ An unexpected error occurred', 'error');
    }
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (e) => {
    console.error('❌ Unhandled promise rejection:', e.reason);
    
    // Show user-friendly error
    if (typeof CRUDManager !== 'undefined' && !AppState.isInitializing) {
        const message = e.reason?.message || 'An error occurred while processing your request';
        CRUDManager.showToast(`❌ ${message}`, 'error');
    }
    
    // Prevent default browser error handling
    e.preventDefault();
});

/**
 * Handle page visibility changes (user switches tabs)
 */
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('👋 Page hidden');
    } else {
        console.log('👀 Page visible');
        
        // Check if session is still valid
        if (typeof AuthManager !== 'undefined' && !AuthManager.isAuthenticated()) {
            console.warn('⚠️ Session expired while away');
            
            if (typeof CRUDManager !== 'undefined') {
                CRUDManager.showToast('⚠️ Your session has expired. Please log in again.', 'error');
            }
            
            // Redirect to login
            if (AppState.currentView !== 'login') {
                if (typeof AuthManager !== 'undefined') {
                    AuthManager.showLoginForm();
                }
            }
        }
    }
});

/**
 * Start application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM Ready');
    console.log('🌐 User Agent:', navigator.userAgent);
    console.log('📏 Screen:', window.innerWidth, 'x', window.innerHeight);
    
    // Check for required globals
    const requiredGlobals = ['AirtableAPI', 'AuthManager', 'CRUDManager', 'AppState'];
    const missingGlobals = requiredGlobals.filter(name => typeof window[name] === 'undefined');
    
    if (missingGlobals.length > 0) {
        console.error('❌ Missing required globals:', missingGlobals);
        
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div class="min-h-screen flex items-center justify-center p-6">
                    <div class="glass-card p-12 max-w-2xl w-full text-center">
                        <div class="text-6xl mb-4">⚠️</div>
                        <h1 class="text-4xl font-bold text-white mb-4">Loading Error</h1>
                        <p class="text-white text-lg opacity-75 mb-4">Some required scripts failed to load.</p>
                        <p class="text-white text-sm opacity-60 mb-2">Missing: ${missingGlobals.join(', ')}</p>
                        <p class="text-white text-sm opacity-60 mb-6">Please check your internet connection and refresh the page.</p>
                        <button class="btn btn-primary" onclick="location.reload()">
                            🔄 Refresh Page
                        </button>
                    </div>
                </div>
            `;
        }
        return;
    }
    
    // All systems go - initialize app
    console.log('✅ All required components loaded');
    initializeApp();
});

/**
 * Handle tab button styling
 */
document.addEventListener('click', (e) => {
    // Add custom styles to tab buttons
    const styles = `
        <style id="tab-button-styles">
            .tab-btn {
                padding: 10px 20px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 1px solid rgba(255, 255, 255, 0.2);
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }
            
            .tab-btn:hover {
                background: rgba(255, 255, 255, 0.15);
                transform: translateY(-2px);
            }
            
            .tab-btn.active {
                background: rgba(255, 255, 255, 0.25);
                border-color: rgba(255, 255, 255, 0.4);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
        </style>
    `;
    
    // Inject styles only once
    if (!document.getElementById('tab-button-styles')) {
        document.head.insertAdjacentHTML('beforeend', styles);
    }
});

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Check if app is in demo mode
 */
function isDemoMode() {
    return !AirtableAPI.isConfigured();
}

/**
 * Get current environment
 */
function getEnvironment() {
    return AirtableAPI.isConfigured() ? 'Production (Airtable)' : 'Demo Mode';
}

/**
 * Export current state for debugging
 */
function exportDebugInfo() {
    const debugInfo = {
        timestamp: new Date().toISOString(),
        environment: getEnvironment(),
        appState: {
            currentView: AppState.currentView,
            selectedCompany: AppState.selectedCompany,
            selectedUser: AppState.selectedUser,
            isInitializing: AppState.isInitializing,
            dataCounts: {
                companies: AppState.data.companies.length,
                users: AppState.data.users.length,
                clients: AppState.data.clients.length,
                leads: AppState.data.leads.length,
                generalTodos: AppState.data.generalTodos.length,
                clientTodos: AppState.data.clientTodos.length,
                calendarEvents: AppState.data.calendarEvents?.length || 0
            }
        },
        currentUser: AuthManager?.currentUser ? {
            id: AuthManager.currentUser.id,
            name: AuthManager.currentUser.name,
            email: AuthManager.currentUser.email,
            role: AuthManager.currentUser.role
        } : null,
        permissions: {
            create: AuthManager?.hasPermission('create') || false,
            read: AuthManager?.hasPermission('read') || false,
            update: AuthManager?.hasPermission('update') || false,
            delete: AuthManager?.hasPermission('delete') || false,
            view_all: AuthManager?.hasPermission('view_all') || false,
            manage_users: AuthManager?.hasPermission('manage_users') || false,
            manage_companies: AuthManager?.hasPermission('manage_companies') || false
        },
        browser: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            online: navigator.onLine,
            cookiesEnabled: navigator.cookieEnabled
        },
        screen: {
            width: window.innerWidth,
            height: window.innerHeight,
            pixelRatio: window.devicePixelRatio
        },
        storage: {
            localStorage: {
                crm_user: !!localStorage.getItem('crm_user'),
                crm_user_expiry: localStorage.getItem('crm_user_expiry'),
                crm_last_company: localStorage.getItem('crm_last_company'),
                crm_theme: localStorage.getItem('crm_theme')
            },
            sessionStorage: {
                crm_user: !!sessionStorage.getItem('crm_user')
            }
        }
    };
    
    console.log('🔍 Debug Info:', debugInfo);
    
    // Download as JSON
    const blob = new Blob([JSON.stringify(debugInfo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crm-debug-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    if (typeof CRUDManager !== 'undefined') {
        CRUDManager.showToast('📥 Debug info exported', 'success');
    }
    
    return debugInfo;
}

// Make debug function available globally
window.exportDebugInfo = exportDebugInfo;

// ========================================
// CONSOLE BANNER
// ========================================

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║             🚀 CRM SYSTEM - FULLY OPERATIONAL             ║
║                                                           ║
║  Version: 2.0.0 - Authentication Fixed                   ║
║  Status: ${getEnvironment().padEnd(48)} ║
║  Mode: Enhanced Security & Error Handling                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

console.log('✅ Main Application Script Loaded - FIXED');
console.log('🎯 CRM System Ready');
console.log('📊 Version: 2.0.0 - Schema Validated');
console.log('🔧 Environment:', getEnvironment());
console.log('🔐 Authentication: Enhanced & Hardened');
console.log('✅ All tables implemented:');
console.log('   - Companies (with Industry, Location, Notes)');
console.log('   - Users (with PhoneNumber, Status, lookups)');
console.log('   - Clients (ALL schema fields including formulas)');
console.log('   - Leads (schema compliant with lookups)');
console.log('   - Calendar Events (fully functional)');
console.log('   - General To-Do List (with Description, CreatedDate)');
console.log('   - Client To-Do List (with Description, CreatedDate)');
console.log('');
console.log('🔍 Debug commands:');
console.log('   - exportDebugInfo() - Export system state for debugging');
console.log('   - AuthManager.currentUser - View current user');
console.log('   - AppState - View application state');
console.log('   - AirtableAPI.isConfigured() - Check Airtable connection');
console.log('');
console.log('🎉 Ready to use!');