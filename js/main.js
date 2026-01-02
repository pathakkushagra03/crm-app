// ========================================
// FILE: js/main.js
// PURPOSE: Main application orchestration with comprehensive error handling
// DEPENDENCIES: GlobalErrorHandler, AirtableAPI, AuthManager, CRUDManager
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
            console.error(`[MAIN ERROR] ${options.context || 'Unknown'}:`, error);
            if (options.userMessage && !options.silent) {
                console.warn(`[MAIN USER MESSAGE] ${options.userMessage}`);
            }
            if (options.metadata) {
                console.info('[MAIN METADATA]', options.metadata);
            }
        }
    } catch (handlerError) {
        console.error('[MAIN] Error handler failed:', handlerError);
        console.error('[MAIN] Original error:', error);
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
        console.error('[MAIN] Toast failed:', error);
    }
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
 * Check if AuthManager is available
 */
function isAuthManagerAvailable() {
    return typeof AuthManager !== 'undefined' && 
           AuthManager && 
           typeof AuthManager.isAuthenticated === 'function';
}

/**
 * Validate API response structure
 * @param {Object} response - API response to validate
 * @param {string} context - Context for error reporting
 * @returns {Array} records array or empty array if invalid
 */
function validateApiResponse(response, context) {
    try {
        if (!response) {
            console.warn(`[MAIN] ${context}: Response is null/undefined`);
            return [];
        }
        
        if (typeof response !== 'object') {
            console.warn(`[MAIN] ${context}: Response is not an object`);
            return [];
        }
        
        if (!Array.isArray(response.records)) {
            console.warn(`[MAIN] ${context}: Response.records is not an array`);
            return [];
        }
        
        return response.records;
    } catch (error) {
        console.error(`[MAIN] ${context}: Validation error:`, error);
        return [];
    }
}

// ========================================
// APPLICATION STATE - PROTECTED
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

/**
 * Safely set array data in AppState with validation
 */
function setAppStateData(key, value) {
    try {
        if (!AppState.data.hasOwnProperty(key)) {
            console.warn(`[MAIN] Unknown AppState.data key: ${key}`);
            return false;
        }
        
        if (!Array.isArray(value)) {
            console.error(`[MAIN] AppState.data.${key} must be an array, got:`, typeof value);
            AppState.data[key] = [];
            return false;
        }
        
        AppState.data[key] = value;
        return true;
    } catch (error) {
        console.error(`[MAIN] Error setting AppState.data.${key}:`, error);
        AppState.data[key] = [];
        return false;
    }
}

/**
 * Get AppState data array with guaranteed array return
 */
function getAppStateData(key) {
    try {
        const data = AppState.data[key];
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(`[MAIN] Error getting AppState.data.${key}:`, error);
        return [];
    }
}

// ========================================
// DATA LOADING FUNCTIONS - ENHANCED ERROR HANDLING
// ========================================

/**
 * ENHANCED: Load companies with comprehensive error handling
 */
async function loadCompanies() {
    console.log('📦 Loading companies...');
    
    try {
        if (isAirtableAvailable()) {
            console.log('🔗 Using Airtable API');
            
            try {
                const result = await Promise.race([
                    AirtableAPI.getCompanies(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('API timeout after 30 seconds')), 30000)
                    )
                ]);
                
                const records = validateApiResponse(result, 'getCompanies');
                setAppStateData('companies', records);
                
                console.log(`✅ Loaded ${AppState.data.companies.length} companies from Airtable`);
                
                if (AppState.data.companies.length === 0) {
                    console.warn('⚠️ No companies returned from Airtable');
                }
            } catch (apiError) {
                console.error('❌ Airtable API error:', apiError);
                throw new Error('Failed to fetch companies from Airtable: ' + apiError.message);
            }
        } else {
            console.log('ℹ️ Using demo companies (Airtable not configured)');
            setAppStateData('companies', getDemoCompanies());
            console.log(`✅ Loaded ${AppState.data.companies.length} demo companies`);
        }
        
        return getAppStateData('companies');
        
    } catch (error) {
        safeHandleError(error, {
            context: 'loadCompanies',
            userMessage: 'Failed to load companies. Using demo data.',
            severity: 'high',
            silent: false,
            metadata: {
                airtableAvailable: isAirtableAvailable(),
                errorType: error.name
            }
        });
        
        // Fallback to demo data
        setAppStateData('companies', getDemoCompanies());
        safeShowToast('⚠️ Using demo companies', 'warning');
        
        return getAppStateData('companies');
    }
}

/**
 * ENHANCED: Load company data with comprehensive error handling and timeouts
 */
async function loadCompanyData(companyId) {
    console.log(`📦 Loading data for company: ${companyId}`);
    
    if (!companyId || typeof companyId !== 'string') {
        const error = new Error('Valid company ID is required');
        safeHandleError(error, {
            context: 'loadCompanyData',
            userMessage: 'Invalid company selection',
            severity: 'high',
            silent: false
        });
        throw error;
    }
    
    try {
        AppState.selectedCompany = companyId;
        const isConfigured = isAirtableAvailable();
        
        // Show loading state
        if (typeof LoadingSkeleton !== 'undefined' && document.getElementById('app')) {
            console.log('⏳ Loading company data...');
        }
        
        // Helper function to load data with timeout and fallback
        const loadDataSafely = async (apiCall, demoGenerator, dataKey, label) => {
            console.log(`${label} Loading ${dataKey}...`);
            
            try {
                if (isConfigured) {
                    const result = await Promise.race([
                        apiCall(),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error(`Timeout loading ${dataKey}`)), 30000)
                        )
                    ]);
                    
                    const records = validateApiResponse(result, dataKey);
                    setAppStateData(dataKey, records);
                    console.log(`✅ Loaded ${records.length} ${dataKey} from Airtable`);
                } else {
                    const demoData = typeof demoGenerator === 'function' ? demoGenerator(companyId) : demoGenerator;
                    setAppStateData(dataKey, demoData);
                    console.log(`✅ Loaded ${demoData.length} demo ${dataKey}`);
                }
            } catch (error) {
                console.warn(`⚠️ Failed to load ${dataKey}:`, error.message);
                const demoData = typeof demoGenerator === 'function' ? demoGenerator(companyId) : demoGenerator;
                setAppStateData(dataKey, demoData);
            }
        };
        
        // Load all data with error isolation
        await loadDataSafely(
            () => AirtableAPI.getUsers(companyId),
            getDemoUsers,
            'users',
            '👥'
        );
        
        await loadDataSafely(
            () => AirtableAPI.getClients(companyId),
            getDemoClients,
            'clients',
            '💼'
        );
        
        await loadDataSafely(
            () => AirtableAPI.getLeads(companyId),
            getDemoLeads,
            'leads',
            '🎯'
        );
        
        await loadDataSafely(
            () => AirtableAPI.getGeneralTodos(),
            getDemoGeneralTodos,
            'generalTodos',
            '📋'
        );
        
        await loadDataSafely(
            () => AirtableAPI.getClientTodos(),
            getDemoClientTodos,
            'clientTodos',
            '✓'
        );
        
        await loadDataSafely(
            () => AirtableAPI.getCalendarEvents(),
            getDemoCalendarEvents,
            'calendarEvents',
            '📅'
        );
        
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
        safeHandleError(error, {
            context: 'loadCompanyData',
            userMessage: 'Failed to load company data completely',
            severity: 'high',
            silent: false,
            metadata: {
                companyId: companyId,
                airtableAvailable: isAirtableAvailable()
            }
        });
        
        throw error;
    }
}

// ========================================
// DEMO DATA GENERATORS - SAFE
// ========================================

function getDemoCompanies() {
    return [
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
// NAVIGATION & RENDERING - ENHANCED ERROR HANDLING
// ========================================

/**
 * ENHANCED: Navigation with auth guard and error handling
 */
function navigateTo(view) {
    console.log(`🧭 Navigating to: ${view}`);
    
    try {
        // Validate view parameter
        if (!view || typeof view !== 'string') {
            throw new Error('Invalid view parameter');
        }
        
        // Auth guard - require authentication for protected views
        if (view !== 'login' && isAuthManagerAvailable()) {
            if (!AuthManager.isAuthenticated()) {
                console.warn('⚠️ Authentication required, redirecting to login');
                AppState.currentView = 'login';
                if (typeof AuthManager.showLoginForm === 'function') {
                    AuthManager.showLoginForm();
                }
                return;
            }
        }
        
        AppState.currentView = view;
        render();
        
    } catch (error) {
        safeHandleError(error, {
            context: 'navigateTo',
            userMessage: 'Navigation error occurred',
            severity: 'medium',
            silent: false,
            metadata: {
                targetView: view,
                currentView: AppState.currentView
            }
        });
    }
}

/**
 * ENHANCED: Main render function with error boundaries
 */
function render() {
    const app = document.getElementById('app');
    
    if (!app) {
        console.error('❌ App container not found');
        safeHandleError(new Error('App container not found'), {
            context: 'render',
            userMessage: 'Critical UI error - please refresh the page',
            severity: 'critical',
            silent: false
        });
        return;
    }
    
    try {
        // Check authentication for protected views
        if (isAuthManagerAvailable() && !AuthManager.isAuthenticated() && AppState.currentView !== 'login') {
            console.log('🔒 Not authenticated, showing login');
            AuthManager.showLoginForm();
            return;
        }
        
        console.log(`🎨 Rendering view: ${AppState.currentView}`);
        
        // Render appropriate view with error isolation
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
                if (isAuthManagerAvailable()) {
                    AuthManager.showLoginForm();
                } else {
                    showCriticalError('Authentication system unavailable');
                }
        }
        
    } catch (error) {
        safeHandleError(error, {
            context: 'render',
            userMessage: 'Failed to render page',
            severity: 'high',
            silent: false,
            metadata: {
                currentView: AppState.currentView
            }
        });
        
        // Show error UI
        showCriticalError(error.message || 'Rendering failed');
    }
}

/**
 * Show critical error screen
 */
function showCriticalError(message) {
    const app = document.getElementById('app');
    if (!app) return;
    
    app.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-6">
            <div class="glass-card p-12 max-w-2xl w-full text-center">
                <div class="text-6xl mb-4">⚠️</div>
                <h1 class="text-4xl font-bold text-white mb-4">System Error</h1>
                <p class="text-white text-lg opacity-75 mb-6">${message || 'An unexpected error occurred'}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    🔄 Refresh Page
                </button>
            </div>
        </div>
    `;
}

/**
 * ENHANCED: Render company selection with error handling
 */
function renderCompanySelection() {
    const app = document.getElementById('app');
    if (!app) return;
    
    try {
        const companies = getAppStateData('companies');
        
        if (companies.length === 0) {
            // Check for create permission
            const canCreateCompany = isAuthManagerAvailable() && 
                                     typeof AuthManager.hasPermission === 'function' && 
                                     AuthManager.hasPermission('create');
            
            app.innerHTML = `
                <div class="min-h-screen flex items-center justify-center p-6">
                    <div class="glass-card p-12 max-w-2xl w-full text-center fade-in">
                        <div class="text-6xl mb-4">🏢</div>
                        <h1 class="text-4xl font-bold text-white mb-4">No Companies Found</h1>
                        <p class="text-white text-lg opacity-75 mb-6">Get started by creating your first company</p>
                        ${canCreateCompany ? `
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
        
        const canCreateCompany = isAuthManagerAvailable() && 
                                 typeof AuthManager.hasPermission === 'function' && 
                                 AuthManager.hasPermission('create');
        
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
                                ${canCreateCompany ? 
                                    '<button class="btn btn-primary" onclick="CRUDManager.showAddCompanyForm()">➕ Add Company</button>' : 
                                    ''
                                }
                                ${isAuthManagerAvailable() && typeof AuthManager.getUserDisplay === 'function' ? AuthManager.getUserDisplay() : ''}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Companies Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${companies.map(company => renderCompanyCard(company)).join('')}
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        safeHandleError(error, {
            context: 'renderCompanySelection',
            userMessage: 'Failed to display companies',
            severity: 'high',
            silent: false
        });
        
        showCriticalError('Failed to load company selection');
    }
}

/**
 * Render individual company card with error handling
 */
function renderCompanyCard(company) {
    try {
        if (!company || !company.id || !company.name) {
            console.warn('[MAIN] Invalid company object:', company);
            return '';
        }
        
        const canEditCompany = isAuthManagerAvailable() && 
                               typeof AuthManager.hasPermission === 'function' && 
                               AuthManager.hasPermission('update');
        
        return `
            <div class="company-card p-6 cursor-pointer" 
                 onclick="selectCompany('${company.id}')">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-16 h-16 rounded-full flex items-center justify-center text-4xl"
                         style="background: ${company.color || '#4ECDC4'}20; color: ${company.color || '#4ECDC4'};">
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
                
                ${canEditCompany ? `
                    <div class="flex gap-2 mt-4">
                        <button class="btn btn-secondary flex-1 text-sm" 
                                onclick="event.stopPropagation(); CRUDManager.showEditCompanyForm('${company.id}')">
                            ✏️ Edit
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    } catch (error) {
        console.error('[MAIN] Error rendering company card:', error);
        return '';
    }
}

/**
 * ENHANCED: Company selection with comprehensive error handling
 */
async function selectCompany(companyId) {
    console.log(`🏢 Company selected: ${companyId}`);
    
    // Validate input
    if (!companyId || typeof companyId !== 'string') {
        safeHandleError(new Error('Invalid company ID'), {
            context: 'selectCompany',
            userMessage: 'Invalid company selection',
            severity: 'medium',
            silent: false
        });
        return;
    }
    
    // Show loading state
    const app = document.getElementById('app');
    if (app && typeof LoadingSkeleton !== 'undefined') {
        app.innerHTML = LoadingSkeleton.renderFullPage('Loading company data...');
    }
    
    try {
        // Load company data with timeout
        await Promise.race([
            loadCompanyData(companyId),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Company data load timeout')), 45000)
            )
        ]);
        
        // Store for session restoration
        try {
            localStorage.setItem('crm_last_company', companyId);
        } catch (storageError) {
            console.warn('[MAIN] Failed to save last company:', storageError);
        }
        
        // Determine navigation based on permissions
        if (isAuthManagerAvailable()) {
            if (typeof AuthManager.hasPermission === 'function' && AuthManager.hasPermission('view_all')) {
                // Admin/Manager can see all data - go directly to dashboard
                console.log('✅ User has view_all permission, navigating to dashboard');
                navigateTo('dashboard');
            } else {
                // Sales/User must select themselves or be auto-assigned
                const currentUser = AuthManager.currentUser;
                if (currentUser && currentUser.id) {
                    const users = getAppStateData('users');
                    const userInCompany = users.find(u => u.id === currentUser.id);
                    
                    if (userInCompany) {
                        AppState.selectedUser = currentUser.id;
                        console.log('✅ User found in company, navigating to dashboard');
                        navigateTo('dashboard');
                    } else {
                        console.log('ℹ️ User not in company, showing user selection');
                        navigateTo('userSelection');
                    }
                } else {
                    navigateTo('userSelection');
                }
            }
        } else {
            // Fallback if AuthManager not available
            console.warn('[MAIN] AuthManager unavailable, using fallback navigation');
            navigateTo('dashboard');
        }
        
    } catch (error) {
        safeHandleError(error, {
            context: 'selectCompany',
            userMessage: 'Failed to load company data',
            severity: 'high',
            silent: false,
            metadata: {
                companyId: companyId
            }
        });
        
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

/**
 * ENHANCED: Render user selection with error handling
 */
function renderUserSelection() {
    const app = document.getElementById('app');
    if (!app) return;
    
    try {
        const users = getAppStateData('users');
        
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
                                ${isAuthManagerAvailable() && typeof AuthManager.getUserDisplay === 'function' ? AuthManager.getUserDisplay() : ''}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Users Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${users.map(user => renderUserCard(user)).join('')}
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        safeHandleError(error, {
            context: 'renderUserSelection',
            userMessage: 'Failed to display users',
            severity: 'high',
            silent: false
        });
        
        showCriticalError('Failed to load user selection');
    }
}

/**
 * Render individual user card with error handling
 */
function renderUserCard(user) {
    try {
        if (!user || !user.id || !user.name) {
            console.warn('[MAIN] Invalid user object:', user);
            return '';
        }
        
        return `
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
                                ${user.role || 'User'}
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
                        <span class="truncate">${user.email || 'No email'}</span>
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
        `;
    } catch (error) {
        console.error('[MAIN] Error rendering user card:', error);
        return '';
    }
}

/**
 * ENHANCED: User selection with validation
 */
function selectUser(userId) {
    console.log(`👤 User selected: ${userId}`);
    
    try {
        if (!userId || typeof userId !== 'string') {
            throw new Error('Invalid user ID');
        }
        
        AppState.selectedUser = userId;
        navigateTo('dashboard');
        
    } catch (error) {
        safeHandleError(error, {
            context: 'selectUser',
            userMessage: 'Invalid user selection',
            severity: 'medium',
            silent: false,
            metadata: { userId: userId }
        });
    }
}

// ========================================
// DASHBOARD RENDERING - ENHANCED ERROR HANDLING
// ========================================

/**
 * ENHANCED: Render dashboard with comprehensive error handling
 */
function renderDashboard() {
    const app = document.getElementById('app');
    if (!app) return;
    
    try {
        const companies = getAppStateData('companies');
        const selectedCompany = companies.find(c => c.id === AppState.selectedCompany);
        
        if (!selectedCompany) {
            console.error('❌ Selected company not found');
            safeHandleError(new Error('Selected company not found'), {
                context: 'renderDashboard',
                userMessage: 'Company not found',
                severity: 'high',
                silent: false
            });
            navigateTo('companySelection');
            return;
        }
        
        console.log('📊 Rendering dashboard for company:', selectedCompany.name);
        
        const canViewAll = isAuthManagerAvailable() && 
                          typeof AuthManager.hasPermission === 'function' && 
                          AuthManager.hasPermission('view_all');
        
        // Get all data arrays safely
        let clients = getAppStateData('clients');
        let leads = getAppStateData('leads');
        let generalTodos = getAppStateData('generalTodos');
        let clientTodos = getAppStateData('clientTodos');
        let calendarEvents = getAppStateData('calendarEvents');
        const users = getAppStateData('users');
        
        // Filter data based on permissions with error handling
        try {
            if (!canViewAll && AppState.selectedUser) {
                console.log('🔒 Filtering data for user:', AppState.selectedUser);
                clients = clients.filter(c => c && c.assignedUser === AppState.selectedUser);
                leads = leads.filter(l => l && l.assignedUser === AppState.selectedUser);
                generalTodos = generalTodos.filter(t => t && t.assignedUser === AppState.selectedUser);
                
                // Client todos don't have assignedUser, filter by client ownership
                const userClientIds = clients.map(c => c.id);
                clientTodos = clientTodos.filter(t => t && userClientIds.includes(t.client));
                
                // Calendar events linked to user's clients
                calendarEvents = calendarEvents.filter(e => 
                    e && e.clients && Array.isArray(e.clients) && 
                    e.clients.some(clientId => userClientIds.includes(clientId))
                );
            }
        } catch (filterError) {
            console.error('❌ Error filtering dashboard data:', filterError);
            safeHandleError(filterError, {
                context: 'renderDashboard.filterData',
                userMessage: 'Error filtering data - showing all available',
                severity: 'medium',
                silent: true
            });
        }
        
        console.log('📊 Dashboard data counts:', {
            clients: clients.length,
            leads: leads.length,
            generalTodos: generalTodos.length,
            clientTodos: clientTodos.length,
            calendarEvents: calendarEvents.length
        });
        
        // Calculate stats with error handling
        const stats = calculateDashboardStats(clients, leads, generalTodos, clientTodos, calendarEvents);
        
        console.log('📊 Dashboard stats calculated:', stats);
        
        app.innerHTML = `
            <div class="min-h-screen">
                <!-- Navigation -->
                ${renderNavigation(selectedCompany)}
                
                <!-- Main Content -->
                <div class="p-6">
                    <div class="max-w-7xl mx-auto">
                        <!-- Stats Grid -->
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            ${renderStatCard({
                                icon: '👥',
                                label: 'Total Clients',
                                value: stats.totalClients,
                                subtitle: `${stats.activeClients} active`,
                                color: '#4ECDC4',
                                onClick: "switchTabFromCard('clients')"
                            })}
                            
                            ${renderStatCard({
                                icon: '🎯',
                                label: 'Total Leads',
                                value: stats.totalLeads,
                                subtitle: `${stats.newLeads} new`,
                                color: '#FFA07A',
                                onClick: "switchTabFromCard('leads')"
                            })}
                            
                            ${renderStatCard({
                                icon: '⏳',
                                label: 'Pending Tasks',
                                value: stats.pendingTasks,
                                subtitle: `${stats.completedTasks} completed`,
                                color: '#F7B731',
                                onClick: "switchTabFromCard('general-todos')"
                            })}
                            
                            ${renderStatCard({
                                icon: '📅',
                                label: 'Upcoming Events',
                                value: stats.upcomingEvents,
                                subtitle: 'Scheduled',
                                color: '#45B7D1',
                                onClick: "switchTabFromCard('calendar-events')"
                            })}
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
                                ${isAuthManagerAvailable() && typeof AuthManager.hasPermission === 'function' && AuthManager.hasPermission('update') ? 
                                    `<button class="tab-btn" onclick="switchTab('users')">👤 Users (${users.length})</button>` : 
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
        
    } catch (error) {
        safeHandleError(error, {
            context: 'renderDashboard',
            userMessage: 'Failed to render dashboard',
            severity: 'high',
            silent: false,
            metadata: {
                selectedCompany: AppState.selectedCompany,
                selectedUser: AppState.selectedUser
            }
        });
        
        showCriticalError('Failed to load dashboard');
    }
}

/**
 * ENHANCED: Calculate dashboard statistics with comprehensive error handling
 */
function calculateDashboardStats(clients, leads, generalTodos, clientTodos, calendarEvents) {
    const stats = {
        totalClients: 0,
        activeClients: 0,
        totalLeads: 0,
        newLeads: 0,
        pendingTasks: 0,
        completedTasks: 0,
        upcomingEvents: 0,
        totalRevenue: 0
    };
    
    try {
        // Validate all inputs are arrays
        if (!Array.isArray(clients)) clients = [];
        if (!Array.isArray(leads)) leads = [];
        if (!Array.isArray(generalTodos)) generalTodos = [];
        if (!Array.isArray(clientTodos)) clientTodos = [];
        if (!Array.isArray(calendarEvents)) calendarEvents = [];
        
        // Safe client stats calculation
        if (clients.length > 0) {
            stats.totalClients = clients.length;
            stats.activeClients = clients.filter(c => c && c.status === 'Active').length;
            
            stats.totalRevenue = clients.reduce((sum, c) => {
                try {
                    const value = parseFloat(c?.dealValue) || 0;
                    return sum + (isNaN(value) ? 0 : value);
                } catch (err) {
                    return sum;
                }
            }, 0);
        }
        
        // Safe lead stats calculation
        if (leads.length > 0) {
            stats.totalLeads = leads.length;
            stats.newLeads = leads.filter(l => l && l.status === 'New').length;
        }
        
        // Safe task stats calculation
        try {
            const allTasks = [...generalTodos, ...clientTodos];
            stats.pendingTasks = allTasks.filter(t => t && t.status === 'Pending').length;
            stats.completedTasks = allTasks.filter(t => t && t.status === 'Completed').length;
        } catch (taskError) {
            console.warn('[MAIN] Error calculating task stats:', taskError);
        }
        
        // Safe calendar event stats calculation
        if (calendarEvents.length > 0) {
            const now = new Date();
            stats.upcomingEvents = calendarEvents.filter(e => {
                if (!e || !e.startDateTime || e.status === 'Cancelled') return false;
                
                try {
                    const eventDate = new Date(e.startDateTime);
                    if (isNaN(eventDate.getTime())) return false;
                    return eventDate > now;
                } catch (dateError) {
                    return false;
                }
            }).length;
        }
        
    } catch (error) {
        safeHandleError(error, {
            context: 'calculateDashboardStats',
            userMessage: 'Error calculating statistics',
            severity: 'low',
            silent: true,
            metadata: {
                clientsCount: clients.length,
                leadsCount: leads.length
            }
        });
    }
    
    return stats;
}

/**
 * Render individual stat card with consistent styling
 */
function renderStatCard(options) {
    try {
        const {
            icon = '📊',
            label = 'Stat',
            value = 0,
            subtitle = '',
            color = '#4ECDC4',
            onClick = ''
        } = options;
        
        return `
            <div class="stat-card" ${onClick ? `onclick="${onClick}"` : ''} 
                 style="cursor: ${onClick ? 'pointer' : 'default'};">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-white text-sm opacity-75">${label}</span>
                    <span class="text-3xl" style="filter: drop-shadow(0 2px 4px ${color}40);">${icon}</span>
                </div>
                <div class="text-white text-3xl font-bold">${value}</div>
                ${subtitle ? `<div class="text-white text-sm opacity-75 mt-1">${subtitle}</div>` : ''}
            </div>
        `;
    } catch (error) {
        console.error('[MAIN] Error rendering stat card:', error);
        return '';
    }
}

/**
 * ENHANCED: Switch tab from stat card with error handling
 */
function switchTabFromCard(tabName) {
    console.log(`🔀 Switching to tab from card: ${tabName}`);
    
    try {
        // Update active tab styling
        const tabButtons = document.querySelectorAll('.tab-btn');
        if (tabButtons) {
            tabButtons.forEach(btn => btn.classList.remove('active'));
        }
        
        // Find and activate the correct tab button
        const targetButton = Array.from(tabButtons).find(btn => {
            const btnText = btn.textContent.toLowerCase();
            const searchTerm = tabName.replace('-', ' ').toLowerCase();
            return btnText.includes(searchTerm);
        });
        
        if (targetButton) {
            targetButton.classList.add('active');
            targetButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
        
        // Call the main switchTab function
        switchTab(tabName);
        
    } catch (error) {
        safeHandleError(error, {
            context: 'switchTabFromCard',
            userMessage: 'Error switching tabs',
            severity: 'low',
            silent: true,
            metadata: { tabName: tabName }
        });
    }
}

/**
 * Render navigation bar
 */
function renderNavigation(company) {
    try {
        if (!company || !company.name) {
            return '<div class="glass-card p-4 mb-6 text-white">Navigation unavailable</div>';
        }
        
        return `
            <nav class="glass-card mb-6">
                <div class="p-4 flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                             style="background: ${company.color || '#4ECDC4'}20; color: ${company.color || '#4ECDC4'};">
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
                        ${isAuthManagerAvailable() && typeof AuthManager.getUserDisplay === 'function' ? AuthManager.getUserDisplay() : ''}
                    </div>
                </div>
            </nav>
        `;
    } catch (error) {
        console.error('[MAIN] Error rendering navigation:', error);
        return '<div class="glass-card p-4 mb-6 text-white">Navigation error</div>';
    }
}

/**
 * ENHANCED: Switch tab with comprehensive error handling
 */
function switchTab(tabName) {
    console.log(`🔀 Switching to tab: ${tabName}`);
    
    try {
        // Update active tab with error handling
        try {
            const tabButtons = document.querySelectorAll('.tab-btn');
            if (tabButtons) {
                tabButtons.forEach(btn => btn.classList.remove('active'));
            }
            
            // Find the button to activate
            let clickedBtn = null;
            
            // Method 1: Check if event exists
            if (typeof event !== 'undefined' && event?.target) {
                clickedBtn = event.target.closest('.tab-btn');
            }
            
            // Method 2: Find by tab name
            if (!clickedBtn && tabButtons) {
                clickedBtn = Array.from(tabButtons).find(btn => {
                    const btnText = btn.textContent.toLowerCase();
                    const searchTerm = tabName.replace('-', ' ').toLowerCase();
                    return btnText.includes(searchTerm);
                });
            }
            
            if (clickedBtn) {
                clickedBtn.classList.add('active');
            }
        } catch (tabError) {
            console.warn('[MAIN] Error updating tab state:', tabError);
        }
        
        const content = document.getElementById('tabContent');
        if (!content) {
            throw new Error('Tab content container not found');
        }
        
        const canViewAll = isAuthManagerAvailable() && 
                          typeof AuthManager.hasPermission === 'function' && 
                          AuthManager.hasPermission('view_all');
        
        // Get and filter data safely
        let clients = getAppStateData('clients');
        let leads = getAppStateData('leads');
        let generalTodos = getAppStateData('generalTodos');
        let clientTodos = getAppStateData('clientTodos');
        let calendarEvents = getAppStateData('calendarEvents');
        let users = getAppStateData('users');
        
        // Apply user filtering with error handling
        try {
            if (!canViewAll && AppState.selectedUser) {
                clients = clients.filter(c => c && c.assignedUser === AppState.selectedUser);
                leads = leads.filter(l => l && l.assignedUser === AppState.selectedUser);
                generalTodos = generalTodos.filter(t => t && t.assignedUser === AppState.selectedUser);
                
                const userClientIds = clients.map(c => c.id);
                clientTodos = clientTodos.filter(t => t && userClientIds.includes(t.client));
                calendarEvents = calendarEvents.filter(e => 
                    e && e.clients && Array.isArray(e.clients) && 
                    e.clients.some(clientId => userClientIds.includes(clientId))
                );
            }
        } catch (filterError) {
            console.warn('[MAIN] Error filtering tab data:', filterError);
        }
        
        // Render appropriate tab with error handling
        try {
            let tabContent = '';
            
            switch (tabName) {
                case 'clients':
                    tabContent = renderClientsTab(clients);
                    break;
                case 'leads':
                    tabContent = renderLeadsTab(leads);
                    break;
                case 'calendar-events':
                    tabContent = renderCalendarEventsTab(calendarEvents);
                    break;
                case 'general-todos':
                    tabContent = renderGeneralTodosTab(generalTodos);
                    break;
                case 'client-todos':
                    tabContent = renderClientTodosTab(clientTodos);
                    break;
                case 'users':
                    tabContent = renderUsersTab(users);
                    break;
                default:
                    console.warn('[MAIN] Unknown tab:', tabName);
                    tabContent = renderClientsTab(clients);
            }
            
            content.innerHTML = tabContent;
            
            // Scroll to content
            content.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
        } catch (renderError) {
            throw new Error(`Failed to render ${tabName} tab: ${renderError.message}`);
        }
        
    } catch (error) {
        safeHandleError(error, {
            context: 'switchTab',
            userMessage: 'Error loading tab content',
            severity: 'medium',
            silent: false,
            metadata: { tabName: tabName }
        });
        
        const content = document.getElementById('tabContent');
        if (content) {
            content.innerHTML = `
                <div class="glass-card p-12 text-center">
                    <div class="text-6xl mb-4">⚠️</div>
                    <h3 class="text-white text-2xl font-bold mb-2">Error Loading Tab</h3>
                    <p class="text-white opacity-75 mb-6">Failed to render ${tabName} content</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        🔄 Reload Page
                    </button>
                </div>
            `;
        }
    }
}

// ========================================
// TAB RENDERING FUNCTIONS - WITH ERROR BOUNDARIES
// ========================================

/**
 * Note: All tab rendering functions wrapped in try-catch at switchTab level
 * These functions return HTML strings that are safe to render
 */

function renderClientsTab(clients) {
    try {
        const canCreate = isAuthManagerAvailable() && 
                         typeof AuthManager.hasPermission === 'function' && 
                         AuthManager.hasPermission('create');
        
        if (!Array.isArray(clients)) clients = [];
        
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
                                    if (!client) return '';
                                    const canEdit = isAuthManagerAvailable() && 
                                        typeof AuthManager.hasPermission === 'function' &&
                                        (AuthManager.hasPermission('update') || 
                                         (typeof AuthManager.canEditRecord === 'function' && AuthManager.canEditRecord('clients', client)));
                                    
                                    return `
                                        <tr class="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-5 transition-colors">
                                            <td class="p-3">
                                                <div class="font-semibold text-white">${client.name || 'Unknown'}</div>
                                                ${client.address ? `<div class="text-xs text-white opacity-60">📍 ${client.address.substring(0, 30)}${client.address.length > 30 ? '...' : ''}</div>` : ''}
                                            </td>
                                            <td class="p-3 text-white text-sm">${client.email || '-'}</td>
                                            <td class="p-3 text-white text-sm">${client.phoneNo || client.phone || '-'}</td>
                                            <td class="p-3">
                                                <span class="status-badge status-client-${(client.status || 'active').toLowerCase().replace(' ', '')}">${client.status || 'Active'}</span>
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
    } catch (error) {
        console.error('[MAIN] Error rendering clients tab:', error);
        return '<div class="glass-card p-6 text-white text-center">Error loading clients</div>';
    }
}

function renderLeadsTab(leads) {
    try {
        const canCreate = isAuthManagerAvailable() && 
                         typeof AuthManager.hasPermission === 'function' && 
                         AuthManager.hasPermission('create');
        
        if (!Array.isArray(leads)) leads = [];
        
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
                                    if (!lead) return '';
                                    const canEdit = isAuthManagerAvailable() && 
                                        typeof AuthManager.hasPermission === 'function' &&
                                        (AuthManager.hasPermission('update') || 
                                         (typeof AuthManager.canEditRecord === 'function' && AuthManager.canEditRecord('leads', lead)));
                                    
                                    return `
                                        <tr class="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-5 transition-colors">
                                            <td class="p-3 text-white font-semibold">${lead.name || 'Unknown'}</td>
                                            <td class="p-3">
                                                <span class="status-badge status-lead-${(lead.status || 'new').toLowerCase().replace(' ', '')}">${lead.status || 'New'}</span>
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
    } catch (error) {
        console.error('[MAIN] Error rendering leads tab:', error);
        return '<div class="glass-card p-6 text-white text-center">Error loading leads</div>';
    }
}

function renderCalendarEventsTab(events) {
    try {
        const canCreate = isAuthManagerAvailable() && 
                         typeof AuthManager.hasPermission === 'function' && 
                         AuthManager.hasPermission('create');
        
        if (!Array.isArray(events)) events = [];
        
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
                                    if (!event) return '';
                                    
                                    let formattedDate = '-';
                                    try {
                                        if (event.startDateTime) {
                                            const startDate = new Date(event.startDateTime);
                                            if (!isNaN(startDate.getTime())) {
                                                formattedDate = startDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                                            }
                                        }
                                    } catch (dateError) {
                                        console.warn('[MAIN] Date formatting error:', dateError);
                                    }
                                    
                                    const canEdit = isAuthManagerAvailable() && 
                                        typeof AuthManager.hasPermission === 'function' &&
                                        AuthManager.hasPermission('update');
                                    
                                    return `
                                        <tr class="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-5 transition-colors">
                                            <td class="p-3">
                                                <div class="text-white font-semibold">${event.eventTitle || 'Untitled Event'}</div>
                                                ${event.description ? `<div class="text-xs text-white opacity-60">${event.description.substring(0, 50)}${event.description.length > 50 ? '...' : ''}</div>` : ''}
                                            </td>
                                            <td class="p-3">
                                                <span class="status-badge badge-medium">${event.eventType || 'Event'}</span>
                                            </td>
                                            <td class="p-3 text-white text-sm">${formattedDate}</td>
                                            <td class="p-3 text-white text-sm">${event.location || '-'}</td>
                                            <td class="p-3">
                                                <span class="status-badge badge-${event.status === 'Completed' ? 'high' : event.status === 'Cancelled' ? 'low' : 'medium'}">${event.status || 'Scheduled'}</span>
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
    } catch (error) {
        console.error('[MAIN] Error rendering calendar events tab:', error);
        return '<div class="glass-card p-6 text-white text-center">Error loading calendar events</div>';
    }
}

function renderGeneralTodosTab(todos) {
    try {
        const canCreate = isAuthManagerAvailable() && 
                         typeof AuthManager.hasPermission === 'function' && 
                         AuthManager.hasPermission('create');
        
        if (!Array.isArray(todos)) todos = [];
        
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
                                    if (!task) return '';
                                    
                                    const users = getAppStateData('users');
                                    const assignedUser = users.find(u => u && u.id === task.assignedUser);
                                    const canEdit = isAuthManagerAvailable() && 
                                        typeof AuthManager.hasPermission === 'function' &&
                                        (AuthManager.hasPermission('update') || 
                                         (typeof AuthManager.canEditRecord === 'function' && AuthManager.canEditRecord('tasks', task)));
                                    
                                    return `
                                        <tr class="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-5 transition-colors">
                                            <td class="p-3">
                                                <div class="text-white font-semibold">${task.name || 'Untitled Task'}</div>
                                                ${task.description ? `<div class="text-xs text-white opacity-60">${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}</div>` : ''}
                                            </td>
                                            <td class="p-3 text-white text-sm">${task.dueDate || '-'}</td>
                                            <td class="p-3">
                                                <span class="status-badge badge-${task.priority === 'High' ? 'high' : task.priority === 'Medium' ? 'medium' : 'low'}">${task.priority || 'Medium'}</span>
                                            </td>
                                            <td class="p-3">
                                                <span class="status-badge badge-${task.status === 'Completed' ? 'completed' : task.status === 'Pending' ? 'pending' : 'in-progress'}">${task.status || 'Pending'}</span>
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
    } catch (error) {
        console.error('[MAIN] Error rendering general todos tab:', error);
        return '<div class="glass-card p-6 text-white text-center">Error loading tasks</div>';
    }
}

function renderClientTodosTab(todos) {
    try {
        const canCreate = isAuthManagerAvailable() && 
                         typeof AuthManager.hasPermission === 'function' && 
                         AuthManager.hasPermission('create');
        
        if (!Array.isArray(todos)) todos = [];
        
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
                                    if (!task) return '';
                                    
                                    const clients = getAppStateData('clients');
                                    const client = clients.find(c => c && c.id === task.client);
                                    const canEdit = isAuthManagerAvailable() && 
                                        typeof AuthManager.hasPermission === 'function' &&
                                        AuthManager.hasPermission('update');
                                    
                                    return `
                                        <tr class="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-5 transition-colors">
                                            <td class="p-3">
                                                <div class="text-white font-semibold">${task.name || 'Untitled Task'}</div>
                                                ${task.description ? `<div class="text-xs text-white opacity-60">${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}</div>` : ''}
                                            </td>
                                            <td class="p-3 text-white text-sm">${client ? client.name : 'Unknown'}</td>
                                            <td class="p-3 text-white text-sm">${task.dueDate || '-'}</td>
                                            <td class="p-3">
                                                <span class="status-badge badge-${task.priority === 'High' ? 'high' : task.priority === 'Medium' ? 'medium' : 'low'}">${task.priority || 'Medium'}</span>
                                            </td>
                                            <td class="p-3">
                                                <span class="status-badge badge-${task.status === 'Completed' ? 'completed' : task.status === 'Pending' ? 'pending' : 'in-progress'}">${task.status || 'Pending'}</span>
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
    } catch (error) {
        console.error('[MAIN] Error rendering client todos tab:', error);
        return '<div class="glass-card p-6 text-white text-center">Error loading client tasks</div>';
    }
}

function renderUsersTab(users) {
    try {
        const canCreate = isAuthManagerAvailable() && 
                         typeof AuthManager.hasPermission === 'function' && 
                         AuthManager.hasPermission('create');
        
        if (!Array.isArray(users)) users = [];
        
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
                                ${users.map(user => {
                                    if (!user) return '';
                                    
                                    const canEdit = isAuthManagerAvailable() && 
                                        typeof AuthManager.hasPermission === 'function' &&
                                        AuthManager.hasPermission('update');
                                    
                                    return `
                                    <tr class="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-5 transition-colors">
                                        <td class="p-3">
                                            <div class="flex items-center gap-3">
                                                <div class="w-10 h-10 rounded-full overflow-hidden bg-white bg-opacity-10 flex items-center justify-center">
                                                    ${user.photo ? 
                                                        `<img src="${user.photo}" alt="${user.name}" class="w-full h-full object-cover">` : 
                                                        '<span class="text-lg">👤</span>'
                                                    }
                                                </div>
                                                <span class="text-white font-semibold">${user.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td class="p-3 text-white text-sm">${user.email || '-'}</td>
                                        <td class="p-3 text-white text-sm">${user.phoneNumber || user.phone || '-'}</td>
                                        <td class="p-3">
                                            <span class="status-badge badge-${user.role === 'Admin' ? 'high' : user.role === 'Manager' ? 'medium' : 'low'}">${user.role || 'User'}</span>
                                        </td>
                                        <td class="p-3">
                                            <span class="status-badge badge-${user.status === 'Active' ? 'high' : 'low'}">${user.status || 'Active'}</span>
                                        </td>
                                        <td class="p-3">
                                            ${canEdit ? `
                                                <button class="btn btn-sm btn-secondary" onclick="CRUDManager.showEditUserForm('${user.id}')">✏️</button>
                                            ` : `
                                                <span class="text-white text-xs opacity-50">View only</span>
                                            `}
                                        </td>
                                    </tr>
                                `}).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    } catch (error) {
        console.error('[MAIN] Error rendering users tab:', error);
        return '<div class="glass-card p-6 text-white text-center">Error loading users</div>';
    }
}

// ========================================
// INITIALIZATION - ENHANCED ERROR HANDLING
// ========================================

/**
 * ENHANCED: Robust application initialization with comprehensive error handling
 */
async function initializeApp() {
    console.log('🚀 Initializing CRM Application...');
    console.log('📅 Current date:', new Date().toISOString());
    
    AppState.isInitializing = true;
    
    try {
        // Step 1: Check for stored session
        const hasStoredSession = isAuthManagerAvailable() && 
                                 typeof AuthManager.checkStoredSession === 'function' && 
                                 AuthManager.checkStoredSession();
        
        if (hasStoredSession) {
            console.log('✅ Found stored session for:', AuthManager.currentUser?.email);
            
            try {
                // Step 2: Load companies with timeout
                console.log('📦 Loading companies...');
                await Promise.race([
                    loadCompanies(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Company load timeout')), 30000)
                    )
                ]);
                console.log(`✅ Loaded ${AppState.data.companies.length} companies`);
                
                // Step 3: Check if user was in a company
                let lastCompany = null;
                try {
                    lastCompany = localStorage.getItem('crm_last_company');
                } catch (storageError) {
                    console.warn('[MAIN] Cannot access localStorage:', storageError);
                }
                
                const companies = getAppStateData('companies');
                if (lastCompany && companies.find(c => c.id === lastCompany)) {
                    console.log('🏢 Restoring last company:', lastCompany);
                    
                    try {
                        // Step 4: Load company data
                        await loadCompanyData(lastCompany);
                        console.log('✅ Company data loaded successfully');
                        
                        // Step 5: Determine navigation based on permissions
                        if (isAuthManagerAvailable()) {
                            if (typeof AuthManager.hasPermission === 'function' && AuthManager.hasPermission('view_all')) {
                                console.log('✅ User has view_all permission, navigating to dashboard');
                                navigateTo('dashboard');
                            } else {
                                const currentUser = AuthManager.currentUser;
                                if (currentUser && currentUser.id) {
                                    const users = getAppStateData('users');
                                    const userInCompany = users.find(u => u.id === currentUser.id);
                                    
                                    if (userInCompany) {
                                        AppState.selectedUser = currentUser.id;
                                        console.log('✅ User found in company, navigating to dashboard');
                                        navigateTo('dashboard');
                                    } else {
                                        console.log('ℹ️ User not in company, showing company selection');
                                        navigateTo('companySelection');
                                    }
                                } else {
                                    navigateTo('companySelection');
                                }
                            }
                        } else {
                            console.warn('[MAIN] AuthManager unavailable, using fallback');
                            navigateTo('dashboard');
                        }
                    } catch (companyError) {
                        console.error('❌ Error loading company data:', companyError);
                        safeShowToast('⚠️ Could not restore last session. Please select a company.', 'error');
                        navigateTo('companySelection');
                    }
                } else {
                    console.log('ℹ️ No last company found, showing company selection');
                    navigateTo('companySelection');
                }
            } catch (error) {
                console.error('❌ Error during initialization:', error);
                safeShowToast('⚠️ Error loading data. Some features may not work.', 'error');
                navigateTo('companySelection');
            }
        } else {
            console.log('ℹ️ No stored session found, showing login');
            
            if (isAuthManagerAvailable() && typeof AuthManager.showLoginForm === 'function') {
                AuthManager.showLoginForm();
            } else {
                showCriticalError('Authentication system unavailable');
            }
        }
    } catch (error) {
        safeHandleError(error, {
            context: 'initializeApp',
            userMessage: 'Critical initialization error',
            severity: 'critical',
            silent: false
        });
        
        showCriticalError(error.message || 'Initialization failed');
    } finally {
        AppState.isInitializing = false;
        console.log('✅ Initialization complete');
    }
}

// ========================================
// EVENT LISTENERS - ENHANCED WITH GLOBAL ERROR HANDLER
// ========================================

window.addEventListener('beforeunload', () => {
    if (AppState.selectedCompany) {
        try {
            localStorage.setItem('crm_last_company', AppState.selectedCompany);
            console.log('💾 Saved last company:', AppState.selectedCompany);
        } catch (error) {
            console.warn('[MAIN] Failed to save last company:', error);
        }
    }
});

document.addEventListener('focus', (e) => {
    if (e.target.matches('.form-input, .form-select, .form-textarea')) {
        const group = e.target.closest('.form-group');
        if (group) {
            group.classList.remove('error');
        }
    }
}, true);

window.addEventListener('error', (e) => {
    console.error('❌ Global error caught:', e.error);
    
    if (e.filename && e.filename.includes('.js')) {
        console.error('❌ Script loading error:', e.filename);
        return;
    }
    
    if (!AppState.isInitializing) {
        safeHandleError(e.error, {
            context: 'window.error',
            userMessage: 'An unexpected error occurred',
            severity: 'high',
            silent: false,
            metadata: {
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno
            }
        });
    }
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('❌ Unhandled promise rejection:', e.reason);
    
    if (!AppState.isInitializing) {
        const error = e.reason instanceof Error ? e.reason : new Error(String(e.reason));
        
        safeHandleError(error, {
            context: 'unhandledrejection',
            userMessage: error.message || 'An error occurred while processing your request',
            severity: 'high',
            silent: false
        });
    }
    
    e.preventDefault();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('👋 Page hidden');
    } else {
        console.log('👀 Page visible');
        
        if (isAuthManagerAvailable() && 
            typeof AuthManager.isAuthenticated === 'function' && 
            !AuthManager.isAuthenticated()) {
            console.warn('⚠️ Session expired while away');
            safeShowToast('⚠️ Your session has expired. Please log in again.', 'error');
            
            if (AppState.currentView !== 'login' && typeof AuthManager.showLoginForm === 'function') {
                AuthManager.showLoginForm();
            }
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM Ready');
    console.log('🌐 User Agent:', navigator.userAgent);
    console.log('📐 Screen:', window.innerWidth, 'x', window.innerHeight);
    
    const requiredGlobals = ['AirtableAPI', 'AuthManager', 'CRUDManager', 'AppState'];
    const missingGlobals = requiredGlobals.filter(name => typeof window[name] === 'undefined');
    
    if (missingGlobals.length > 0) {
        console.error('❌ Missing required globals:', missingGlobals);
        showCriticalError(`Missing components: ${missingGlobals.join(', ')}`);
        return;
    }
    
    console.log('✅ All required components loaded');
    initializeApp();
});

// ========================================
// UTILITY FUNCTIONS
// ========================================

function isDemoMode() {
    return !isAirtableAvailable();
}

function getEnvironment() {
    return isAirtableAvailable() ? 'Production (Airtable)' : 'Demo Mode';
}

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
        currentUser: isAuthManagerAvailable() && AuthManager.currentUser ? {
            id: AuthManager.currentUser.id,
            name: AuthManager.currentUser.name,
            email: AuthManager.currentUser.email,
            role: AuthManager.currentUser.role
        } : null,
        dependencies: {
            GlobalErrorHandler: typeof GlobalErrorHandler !== 'undefined',
            AirtableAPI: typeof AirtableAPI !== 'undefined',
            AuthManager: typeof AuthManager !== 'undefined',
            CRUDManager: typeof CRUDManager !== 'undefined'
        }
    };
    
    console.log('📋 Debug Info:', debugInfo);
    
    try {
        const blob = new Blob([JSON.stringify(debugInfo, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `crm-debug-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        safeShowToast('📥 Debug info exported', 'success');
    } catch (error) {
        console.error('[MAIN] Export failed:', error);
        safeShowToast('❌ Export failed', 'error');
    }
    
    return debugInfo;
}

window.exportDebugInfo = exportDebugInfo;

// ========================================
// CONSOLE BANNER
// ========================================
console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║             🚀 CRM SYSTEM - FULLY OPERATIONAL             ║
║                                                           ║
║  Version: 3.1.0 - ERROR HANDLING ENHANCED                ║
║  Status: ${getEnvironment().padEnd(48)} ║
║  GlobalErrorHandler: Integrated                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
console.log('✅ Main Application Script Loaded - ERROR HANDLING ENHANCED');
console.log('🎯 CRM System Ready');
console.log('📊 Version: 3.1.0 - Global Error Handler Integration Complete');
console.log('🔧 Environment:', getEnvironment());
console.log('');
console.log('✅ ERROR HANDLING ENHANCEMENTS:');
console.log('   ✅ GlobalErrorHandler integrated throughout');
console.log('   ✅ Defensive dependency wrappers added');
console.log('   ✅ API response validation implemented');
console.log('   ✅ State protection with type guards');
console.log('   ✅ Render error boundaries in place');
console.log('   ✅ Timeout handling for async operations');
console.log('   ✅ Graceful fallbacks for all operations');
console.log('');
console.log('🎉 Ready to use!');