// ========================================
// AUTHENTICATION MANAGER - WITH COMPREHENSIVE ERROR HANDLING
// ========================================

console.warn("⚠️ DEMO MODE: Client-side auth is NOT secure for production.");

// ========================================
// THEME MANAGER - WITH ERROR HANDLING
// ========================================
const ThemeManager = {
    currentTheme: 'dark',
    
    /**
     * FIXED: Initialize theme with error handling
     */
    init() {
        try {
            const savedTheme = localStorage.getItem('crm_theme') || 'auto';
            this.applyTheme(savedTheme);
            
            // Listen for system theme changes
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                    if (this.currentTheme === 'auto') {
                        this.applyTheme('auto');
                    }
                });
            }
            
            console.log('✅ Theme Manager initialized:', savedTheme);
        } catch (error) {
            console.error('❌ Error initializing theme:', error);
            GlobalErrorHandler.handle(error, { operation: 'ThemeManager.init' });
            // Apply default theme as fallback
            this.applyTheme('dark');
        }
    },
    
    /**
     * FIXED: Set theme with error handling
     */
    setTheme(theme) {
        try {
            this.currentTheme = theme;
            localStorage.setItem('crm_theme', theme);
            this.applyTheme(theme);
            
            // Refresh UI if settings modal is open
            const settingsForm = document.getElementById('settingsForm');
            if (settingsForm && typeof AuthManager !== 'undefined') {
                AuthManager.showSettings();
            }
            
            console.log('✅ Theme changed to:', theme);
        } catch (error) {
            console.error('❌ Error setting theme:', error);
            GlobalErrorHandler.handle(error, { operation: 'ThemeManager.setTheme', theme: theme });
        }
    },
    
    /**
     * FIXED: Apply theme with error handling
     */
    applyTheme(theme) {
        try {
            const body = document.body;
            let actualTheme = theme;
            
            if (theme === 'auto') {
                actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            
            if (actualTheme === 'light') {
                body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                body.classList.add('theme-light');
                body.classList.remove('theme-dark');
            } else {
                body.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
                body.classList.add('theme-dark');
                body.classList.remove('theme-light');
            }
        } catch (error) {
            console.error('❌ Error applying theme:', error);
            GlobalErrorHandler.handle(error, { operation: 'ThemeManager.applyTheme', theme: theme });
        }
    },
    
    getThemeIcon(theme) {
        return {
            'light': '☀️',
            'dark': '🌙',
            'auto': '🔄'
        }[theme] || '🔄';
    }
};

// ========================================
// DROPDOWN MANAGER - WITH ERROR HANDLING
// ========================================
const DropdownManager = {
    activeDropdown: null,
    
    /**
     * FIXED: Open dropdown with error handling
     */
    open(dropdownId) {
        try {
            this.closeAll();
            const dropdown = document.getElementById(dropdownId);
            if (dropdown) {
                dropdown.classList.remove('hidden');
                this.activeDropdown = dropdownId;
            } else {
                console.warn('⚠️ Dropdown not found:', dropdownId);
            }
        } catch (error) {
            console.error('❌ Error opening dropdown:', error);
            GlobalErrorHandler.handle(error, { operation: 'DropdownManager.open', dropdownId: dropdownId });
        }
    },
    
    /**
     * FIXED: Close dropdown with error handling
     */
    close(dropdownId) {
        try {
            const dropdown = document.getElementById(dropdownId);
            if (dropdown) {
                dropdown.classList.add('hidden');
                if (this.activeDropdown === dropdownId) {
                    this.activeDropdown = null;
                }
            }
        } catch (error) {
            console.error('❌ Error closing dropdown:', error);
            GlobalErrorHandler.handle(error, { operation: 'DropdownManager.close', dropdownId: dropdownId });
        }
    },
    
    /**
     * FIXED: Close all dropdowns with error handling
     */
    closeAll() {
        try {
            document.querySelectorAll('[id$="Menu"]').forEach(menu => {
                menu.classList.add('hidden');
            });
            this.activeDropdown = null;
        } catch (error) {
            console.error('❌ Error closing all dropdowns:', error);
            GlobalErrorHandler.handle(error, { operation: 'DropdownManager.closeAll' });
        }
    },
    
    /**
     * FIXED: Toggle dropdown with error handling
     */
    toggle(dropdownId) {
        try {
            const dropdown = document.getElementById(dropdownId);
            if (dropdown && dropdown.classList.contains('hidden')) {
                this.open(dropdownId);
            } else {
                this.close(dropdownId);
            }
        } catch (error) {
            console.error('❌ Error toggling dropdown:', error);
            GlobalErrorHandler.handle(error, { operation: 'DropdownManager.toggle', dropdownId: dropdownId });
        }
    }
};

// ========================================
// ENHANCED AUTHENTICATION SYSTEM - WITH ERROR HANDLING
// ========================================
const AuthManager = {
    currentUser: null,
    
    // Demo users configuration (always available)
    DEMO_USERS: {
        'admin@demo.com': { 
            role: 'Admin', 
            password: 'admin123',
            name: 'Admin User',
            phone: '+1 (555) 000-0001',
            id: 'demo-admin'
        },
        'manager@demo.com': { 
            role: 'Manager', 
            password: 'manager123',
            name: 'Manager User',
            phone: '+1 (555) 000-0002',
            id: 'demo-manager'
        },
        'sales@demo.com': { 
            role: 'Sales', 
            password: 'sales123',
            name: 'Sales User',
            phone: '+1 (555) 000-0003',
            id: 'demo-sales'
        },
        'user@demo.com': { 
            role: 'User', 
            password: 'user123',
            name: 'Regular User',
            phone: '+1 (555) 000-0004',
            id: 'demo-user'
        }
    },
    
    /**
     * FIXED: Initialize with error handling
     */
    init() {
        try {
            ThemeManager.init();
            console.log('🔐 AuthManager initialized');
            console.log('✅ Permission system: Admin-first with complete permission map');
        } catch (error) {
            console.error('❌ Error initializing AuthManager:', error);
            GlobalErrorHandler.handle(error, { operation: 'AuthManager.init' });
        }
    },
    
    /**
     * Normalize role string for consistent comparison
     */
    normalizeRole(role) {
        try {
            if (!role) return 'User';
            const normalized = role.trim().charAt(0).toUpperCase() + role.trim().slice(1).toLowerCase();
            return normalized;
        } catch (error) {
            console.error('❌ Error normalizing role:', error);
            return 'User'; // Default fallback
        }
    },
    
    /**
     * FIXED: Synchronize auth state with error handling
     */
    syncAuthState(user) {
        try {
            this.currentUser = user;
            if (typeof AppState !== 'undefined') {
                AppState.currentUser = user;
                AppState.role = user ? this.normalizeRole(user.role) : null;
            }
            
            console.log('✅ Auth state synchronized:', {
                userId: user?.id,
                role: user?.role,
                email: user?.email
            });
        } catch (error) {
            console.error('❌ Error syncing auth state:', error);
            GlobalErrorHandler.handle(error, { operation: 'AuthManager.syncAuthState' });
        }
    },
    
    /**
     * FIXED: Create user session object with error handling
     */
    createUserSession(userData) {
        try {
            return {
                id: userData.id || `user-${Date.now()}`,
                name: userData.name || userData.UserName || 'Unknown User',
                email: userData.email || userData.Email || '',
                phone: userData.phone || userData.phoneNumber || userData.PhoneNumber || '',
                role: this.normalizeRole(userData.role || userData.Role || 'User'),
                companies: userData.companies || userData.Companies || ['1'],
                status: userData.status || userData.Status || 'Active',
                loginTime: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error creating user session:', error);
            GlobalErrorHandler.handle(error, { operation: 'AuthManager.createUserSession' });
            throw error;
        }
    },
    
    /**
     * FIXED: Show login form with error handling
     */
    showLoginForm() {
        try {
            const content = `
                <div class="text-center mb-8">
                    <div class="text-6xl mb-4">🔐</div>
                    <h1 class="text-4xl font-bold text-white mb-2">Welcome to CRM</h1>
                    <p class="text-white text-lg opacity-75">Sign in to continue to your workspace</p>
                </div>
                
                <form id="loginForm" autocomplete="on">
                    <div class="form-group">
                        <label class="form-label required">Email</label>
                        <input type="email" 
                               name="email" 
                               class="form-input" 
                               placeholder="your@email.com" 
                               autocomplete="email"
                               required 
                               autofocus>
                        <div class="form-error">Valid email is required</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label required">Password</label>
                        <div class="relative">
                            <input type="password" 
                                   id="passwordInput"
                                   name="password" 
                                   class="form-input" 
                                   placeholder="Enter your password"
                                   autocomplete="current-password"
                                   required>
                            <button type="button"
                                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-white opacity-75 hover:opacity-100 transition-opacity"
                                    onclick="AuthManager.togglePasswordVisibility()">
                                <span id="passwordToggleIcon">👁️</span>
                            </button>
                        </div>
                        <div class="form-error">Password is required</div>
                    </div>
                    
                    <div class="form-group mb-6">
                        <label class="flex items-center text-white cursor-pointer">
                            <input type="checkbox" name="remember" class="mr-2" checked>
                            <span class="text-sm">Remember me for 30 days</span>
                        </label>
                    </div>
                    
                    <button type="submit" class="btn btn-primary w-full mb-4" id="loginButton">
                        <span id="loginButtonText">🚀 Sign In</span>
                    </button>
                    
                    <div class="text-center mb-4">
                        <button type="button" 
                                class="text-white text-sm opacity-75 hover:opacity-100 underline"
                                onclick="AuthManager.showDemoCredentials()">
                            📋 View Demo Credentials
                        </button>
                    </div>
                </form>
                
                <div class="mt-6 pt-6 border-t border-white border-opacity-20">
                    <div class="text-white text-sm opacity-75 mb-3 text-center font-semibold">
                        🎨 Theme Preference
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <button type="button" class="btn ${ThemeManager.currentTheme === 'light' ? 'btn-primary' : 'btn-secondary'}" 
                                onclick="ThemeManager.setTheme('light')">
                            ☀️ Light
                        </button>
                        <button type="button" class="btn ${ThemeManager.currentTheme === 'dark' ? 'btn-primary' : 'btn-secondary'}" 
                                onclick="ThemeManager.setTheme('dark')">
                            🌙 Dark
                        </button>
                        <button type="button" class="btn ${ThemeManager.currentTheme === 'auto' ? 'btn-primary' : 'btn-secondary'}" 
                                onclick="ThemeManager.setTheme('auto')">
                            🔄 Auto
                        </button>
                    </div>
                </div>
            `;

            const app = document.getElementById('app');
            if (!app) {
                console.error('❌ App container not found');
                return;
            }
            
            app.innerHTML = `
                <div class="min-h-screen flex items-center justify-center p-6">
                    <div class="glass-card p-12 max-w-md w-full fade-in">
                        ${content}
                    </div>
                </div>
            `;

            const form = document.getElementById('loginForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleLogin();
                });
            }
        } catch (error) {
            console.error('❌ Error showing login form:', error);
            GlobalErrorHandler.handle(error, { operation: 'AuthManager.showLoginForm' });
        }
    },

    /**
     * FIXED: Toggle password visibility with error handling
     */
    togglePasswordVisibility() {
        try {
            const input = document.getElementById('passwordInput');
            const icon = document.getElementById('passwordToggleIcon');
            
            if (input && icon) {
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.textContent = '🙈';
                } else {
                    input.type = 'password';
                    icon.textContent = '👁️';
                }
            }
        } catch (error) {
            console.error('❌ Error toggling password visibility:', error);
            GlobalErrorHandler.handle(error, { operation: 'AuthManager.togglePasswordVisibility' });
        }
    },

    /**
     * FIXED: Show demo credentials with error handling
     */
    showDemoCredentials() {
        try {
            const demoInfo = `
                <div class="text-center mb-4">
                    <div class="text-4xl mb-3">🔑</div>
                    <h3 class="text-white text-xl font-bold mb-2">Demo Credentials</h3>
                    <p class="text-white text-sm opacity-75 mb-4">Use these credentials to test different roles</p>
                </div>
                
                <div class="space-y-3 mb-6">
                    <div class="glass-card p-4 hover:scale-105 transition-transform cursor-pointer"
                         onclick="AuthManager.fillLoginForm('admin@demo.com', 'admin123')">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="text-2xl">👑</div>
                            <div class="text-white font-bold text-lg">Admin Account</div>
                        </div>
                        <div class="text-white font-mono text-sm opacity-75">📧 admin@demo.com</div>
                        <div class="text-white font-mono text-sm opacity-75">🔒 admin123</div>
                        <div class="text-white text-xs opacity-60 mt-2">Full access to all features</div>
                    </div>
                    
                    <div class="glass-card p-4 hover:scale-105 transition-transform cursor-pointer"
                         onclick="AuthManager.fillLoginForm('manager@demo.com', 'manager123')">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="text-2xl">📊</div>
                            <div class="text-white font-bold text-lg">Manager Account</div>
                        </div>
                        <div class="text-white font-mono text-sm opacity-75">📧 manager@demo.com</div>
                        <div class="text-white font-mono text-sm opacity-75">🔒 manager123</div>
                        <div class="text-white text-xs opacity-60 mt-2">Manage team and resources</div>
                    </div>
                    
                    <div class="glass-card p-4 hover:scale-105 transition-transform cursor-pointer"
                         onclick="AuthManager.fillLoginForm('sales@demo.com', 'sales123')">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="text-2xl">💼</div>
                            <div class="text-white font-bold text-lg">Sales Account</div>
                        </div>
                        <div class="text-white font-mono text-sm opacity-75">📧 sales@demo.com</div>
                        <div class="text-white font-mono text-sm opacity-75">🔒 sales123</div>
                        <div class="text-white text-xs opacity-60 mt-2">Create and update records</div>
                    </div>
                    
                    <div class="glass-card p-4 hover:scale-105 transition-transform cursor-pointer"
                         onclick="AuthManager.fillLoginForm('user@demo.com', 'user123')">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="text-2xl">👤</div>
                            <div class="text-white font-bold text-lg">User Account</div>
                        </div>
                        <div class="text-white font-mono text-sm opacity-75">📧 user@demo.com</div>
                        <div class="text-white font-mono text-sm opacity-75">🔒 user123</div>
                        <div class="text-white text-xs opacity-60 mt-2">Read and update access</div>
                    </div>
                </div>
                
                <div class="glass-card p-4 bg-blue-500 bg-opacity-20 border-blue-400">
                    <div class="text-white text-sm">
                        <span class="font-bold">💡 Tip:</span> In demo mode, any email/password combination works!
                    </div>
                </div>
            `;

            const footer = `
                <button class="btn btn-primary w-full" onclick="this.closest('.modal-overlay').remove()">
                    Got it! 👍
                </button>
            `;

            if (typeof CRUDManager !== 'undefined') {
                const modal = CRUDManager.createModal('🔐 Demo Credentials', demoInfo, footer);
                document.body.appendChild(modal);
            }
        } catch (error) {
            console.error('❌ Error showing demo credentials:', error);
            GlobalErrorHandler.handle(error, { operation: 'AuthManager.showDemoCredentials' });
        }
    },

    /**
     * FIXED: Fill login form with error handling
     */
    fillLoginForm(email, password) {
        try {
            const modal = document.querySelector('.modal-overlay');
            if (modal) modal.remove();
            
            setTimeout(() => {
                const emailInput = document.querySelector('input[name="email"]');
                const passwordInput = document.querySelector('input[name="password"]');
                
                if (emailInput && passwordInput) {
                    emailInput.value = email;
                    passwordInput.value = password;
                    emailInput.focus();
                    
                    if (typeof CRUDManager !== 'undefined') {
                        CRUDManager.showToast(`Credentials filled for ${email}`, 'success');
                    }
                }
            }, 100);
        } catch (error) {
            console.error('❌ Error filling login form:', error);
            GlobalErrorHandler.handle(error, { operation: 'AuthManager.fillLoginForm' });
        }
    },

    /**
     * FIXED: Handle login with comprehensive error handling
     */
    async handleLogin() {
        const form = document.getElementById('loginForm');
        const loginButton = document.getElementById('loginButton');
        const loginButtonText = document.getElementById('loginButtonText');
        
        if (!form) {
            console.error('❌ Login form not found');
            GlobalErrorHandler.handle(new Error('Login form not found'), { 
                operation: 'AuthManager.handleLogin' 
            });
            return;
        }
        
        // Validate form
        if (typeof CRUDManager !== 'undefined' && !CRUDManager.validateForm(form)) {
            return;
        }

        const data = typeof CRUDManager !== 'undefined' 
            ? CRUDManager.getFormData(form) 
            : { 
                email: form.querySelector('[name="email"]').value,
                password: form.querySelector('[name="password"]').value,
                remember: form.querySelector('[name="remember"]').checked
            };

        // Show loading state
        if (loginButton) loginButton.disabled = true;
        if (loginButtonText) loginButtonText.textContent = '⏳ Signing in...';

        try {
            console.log('🔐 Starting authentication for:', data.email);
            
            let user = null;
            let authMethod = 'unknown';
            
            // STEP 1: Try demo credentials first
            const demoUser = this.DEMO_USERS[data.email.toLowerCase()];
            
            if (demoUser && demoUser.password === data.password) {
                console.log('✅ Demo user authenticated:', data.email);
                user = this.createUserSession({
                    id: demoUser.id,
                    name: demoUser.name,
                    email: data.email,
                    phone: demoUser.phone,
                    role: demoUser.role,
                    companies: ['1']
                });
                authMethod = 'demo';
            } 
            // STEP 2: Try Airtable authentication
            else if (typeof AirtableAPI !== 'undefined' && AirtableAPI.isConfigured()) {
                console.log('🔍 Attempting Airtable authentication...');
                
                try {
                    const airtableUser = await AirtableAPI.authenticateUser(data.email, data.password);
                    
                    if (airtableUser) {
                        console.log('✅ Airtable user authenticated:', data.email);
                        user = this.createUserSession(airtableUser);
                        authMethod = 'airtable';
                    } else {
                        console.warn('⚠️ Airtable authentication returned null');
                        
                        // Show error with retry option
                        if (typeof CRUDManager !== 'undefined') {
                            CRUDManager.showToast('❌ Invalid credentials. Please try again.', 'error');
                        }
                        
                        return;
                    }
                } catch (airtableError) {
                    console.warn('⚠️ Airtable authentication failed:', airtableError.message);
                    
                    // Handle specific Airtable errors
                    if (airtableError.message.includes('401')) {
                        GlobalErrorHandler.handle(airtableError, {
                            operation: 'AuthManager.handleLogin',
                            context: 'Airtable authentication',
                            email: data.email
                        });
                        return;
                    }
                    
                    // For other errors, show generic message
                    if (typeof CRUDManager !== 'undefined') {
                        CRUDManager.showToast('❌ Authentication failed. Check your credentials.', 'error');
                    }
                    
                    return;
                }
            }
            // STEP 3: Pure demo mode fallback
            else {
                console.log('ℹ️ Using demo mode fallback (Airtable not configured)');
                user = this.createUserSession({
                    id: 'demo-user-' + Date.now(),
                    name: data.email.split('@')[0].charAt(0).toUpperCase() + data.email.split('@')[0].slice(1),
                    email: data.email,
                    phone: '',
                    role: 'Admin',
                    companies: ['1']
                });
                authMethod = 'demo-fallback';
            }

            // STEP 4: Validate authentication result
            if (!user || !user.id) {
                throw new Error('Authentication failed: Invalid user object returned');
            }

            console.log('✅ Authentication successful:', {
                method: authMethod,
                userId: user.id,
                role: user.role,
                email: user.email
            });

            // STEP 5: Store authentication
            this.syncAuthState(user);

            if (data.remember) {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30);
                localStorage.setItem('crm_user', JSON.stringify(user));
                localStorage.setItem('crm_user_expiry', expiryDate.toISOString());
                console.log('💾 Session saved to localStorage (30 days)');
            } else {
                sessionStorage.setItem('crm_user', JSON.stringify(user));
                console.log('💾 Session saved to sessionStorage (browser session)');
            }

            // STEP 6: Log activity
            this.logActivity('login', { 
                email: user.email, 
                role: user.role,
                method: authMethod,
                time: new Date().toISOString()
            });

            // STEP 7: Show success message
            if (typeof CRUDManager !== 'undefined') {
                CRUDManager.showToast(`🎉 Welcome back, ${user.name}!`, 'success');
            }
            
            // STEP 8: Load companies and proceed
            console.log('📦 Loading companies...');
            
            if (typeof loadCompanies === 'function') {
                await loadCompanies();
            } else {
                console.warn('⚠️ loadCompanies function not found');
            }
            
            // STEP 9: Navigate based on role and permissions
            if (typeof navigateTo === 'function') {
                navigateTo('companySelection');
            } else if (typeof AppState !== 'undefined') {
                AppState.currentView = 'companySelection';
                if (typeof render === 'function') render();
            }

        } catch (error) {
            console.error('❌ Login error:', error);
            
            // Clear auth state on error
            this.syncAuthState(null);
            
            // Handle with global error handler
            GlobalErrorHandler.handle(error, {
                operation: 'AuthManager.handleLogin',
                email: data.email
            });
            
        } finally {
            // Reset button state
            if (loginButton) loginButton.disabled = false;
            if (loginButtonText) loginButtonText.textContent = '🚀 Sign In';
        }
    },

    /**
     * FIXED: Logout with error handling
     */
    logout() {
        try {
            if (typeof CRUDManager !== 'undefined') {
                CRUDManager.showConfirmDialog(
                    '🚪 Sign Out',
                    'Are you sure you want to sign out?',
                    () => this.performLogout()
                );
            } else {
                if (confirm('Are you sure you want to sign out?')) {
                    this.performLogout();
                }
            }
        } catch (error) {
            console.error('❌ Error showing logout confirmation:', error);
            GlobalErrorHandler.handle(error, { operation: 'AuthManager.logout' });
            // Proceed with logout anyway
            this.performLogout();
        }
    },
    
    /**
     * FIXED: Perform logout with error handling
     */
    performLogout() {
        try {
            console.log('🚪 Performing logout...');
            
            // Log activity before clearing user
            if (this.currentUser) {
                this.logActivity('logout', { 
                    email: this.currentUser.email,
                    time: new Date().toISOString()
                });
            }

            // Clear auth state
            this.syncAuthState(null);
            
            if (typeof AppState !== 'undefined') {
                AppState.selectedCompany = null;
                AppState.selectedUser = null;
                AppState.data = {
                    companies: [],
                    users: [],
                    clients: [],
                    leads: [],
                    generalTodos: [],
                    clientTodos: [],
                    calendarEvents: []
                };
            }
            
            // Clear storage
            localStorage.removeItem('crm_user');
            localStorage.removeItem('crm_user_expiry');
            localStorage.removeItem('crm_last_company');
            sessionStorage.removeItem('crm_user');
            
            console.log('✅ Logout complete');
            
            if (typeof CRUDManager !== 'undefined') {
                CRUDManager.showToast('👋 Signed out successfully', 'success');
            }
            
            // Show login form
            this.showLoginForm();
            
        } catch (error) {
            console.error('❌ Error performing logout:', error);
            GlobalErrorHandler.handle(error, { operation: 'AuthManager.performLogout' });
            
            // Force reload as fallback
            setTimeout(() => location.reload(), 1000);
        }
    },

    /**
     * FIXED: Check if authenticated with error handling
     */
    isAuthenticated() {
        try {
            const authenticated = this.currentUser !== null && this.currentUser.id;
            return authenticated;
        } catch (error) {
            console.error('❌ Error checking authentication:', error);
            GlobalErrorHandler.handle(error, { operation: 'AuthManager.isAuthenticated' });
            return false;
        }
    },

    /**
     * FIXED: Check stored session with error handling
     */
    checkStoredSession() {
        console.log('🔍 Checking for stored session...');
        
        try {
            // Try localStorage first (remember me)
            const stored = localStorage.getItem('crm_user');
            const expiry = localStorage.getItem('crm_user_expiry');
            
            if (stored && expiry) {
                const expiryDate = new Date(expiry);
                const now = new Date();
                
                if (expiryDate > now) {
                    try {
                        const user = JSON.parse(stored);
                        
                        // Validate user object
                        if (user && user.id && user.email && user.role) {
                            console.log('✅ Valid localStorage session found:', user.email);
                            this.syncAuthState(user);
                            return true;
                        } else {
                            console.warn('⚠️ Invalid user object in localStorage');
                            localStorage.removeItem('crm_user');
                            localStorage.removeItem('crm_user_expiry');
                        }
                    } catch (parseError) {
                        console.error('❌ Failed to parse stored session:', parseError);
                        localStorage.removeItem('crm_user');
                        localStorage.removeItem('crm_user_expiry');
                    }
                } else {
                    console.log('ℹ️ localStorage session expired');
                    localStorage.removeItem('crm_user');
                    localStorage.removeItem('crm_user_expiry');
                }
            }

            // Try sessionStorage (current browser session)
            const sessionStored = sessionStorage.getItem('crm_user');
            if (sessionStored) {
                try {
                    const user = JSON.parse(sessionStored);
                    
                    // Validate user object
                    if (user && user.id && user.email && user.role) {
                        console.log('✅ Valid sessionStorage session found:', user.email);
                        this.syncAuthState(user);
                        return true;
                    } else {
                        console.warn('⚠️ Invalid user object in sessionStorage');
                        sessionStorage.removeItem('crm_user');
                    }
                } catch (parseError) {
                    console.error('❌ Failed to parse session:', parseError);
                    sessionStorage.removeItem('crm_user');
                }
            }

            console.log('ℹ️ No valid stored session found');
            return false;
            
        } catch (error) {
            console.error('❌ Error checking stored session:', error);
            GlobalErrorHandler.handle(error, { operation: 'AuthManager.checkStoredSession' });
            return false;
        }
    },

    /**
     * FIXED: Permission checker with error handling
     */
    hasPermission(action) {
        try {
            if (!this.currentUser) {
                console.warn('⚠️ Permission check failed: No user authenticated');
                return false;
            }
            
            const role = this.normalizeRole(this.currentUser.role);
            
            // CRITICAL: Admin has ALL permissions - NO EXCEPTIONS
            if (role === 'Admin') {
                return true;
            }
            
            // COMPLETE Permission Map
            const permissions = {
                'Manager': [
                    'create', 'read', 'update', 'delete',
                    'view_all', 'view_assigned',
                    'export', 'import',
                    'manage_tasks', 'manage_leads', 'manage_clients',
                    'manage_calendar', 'manage_todos'
                ],
                'Sales': [
                    'create', 'read', 'update',
                    'view_assigned',
                    'manage_tasks', 'manage_leads', 'manage_clients',
                    'manage_calendar', 'manage_todos'
                ],
                'User': [
                    'read', 'update',
                    'view_assigned'
                ]
            };

            const rolePermissions = permissions[role];
            
            if (!rolePermissions) {
                console.warn(`⚠️ Unknown role: ${role}`);
                return false;
            }
            
            return rolePermissions.includes(action);
            
        } catch (error) {
            console.error('❌ Error checking permission:', error);
            GlobalErrorHandler.handle(error, { 
                operation: 'AuthManager.hasPermission',
                action: action 
            });
            return false;
        }
    },

    /**
     * FIXED: Detailed permission checker with error handling
     */
    hasDetailedPermission(resource, operation) {
        try {
            if (!this.currentUser) {
                console.warn('⚠️ Detailed permission check failed: No user authenticated');
                return false;
            }
            
            const role = this.normalizeRole(this.currentUser.role);
            
            // CRITICAL: Admin can do EVERYTHING
            if (role === 'Admin') {
                return true;
            }
            
            // Manager permissions
            if (role === 'Manager') {
                if (resource === 'users' || resource === 'companies') {
                    return operation === 'read';
                }
                return ['create', 'read', 'update', 'delete'].includes(operation);
            }
            
            // Sales permissions
            if (role === 'Sales') {
                return ['create', 'read', 'update'].includes(operation);
            }
            
            // User permissions
            if (role === 'User') {
                return ['read', 'update'].includes(operation);
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Error checking detailed permission:', error);
            GlobalErrorHandler.handle(error, { 
                operation: 'AuthManager.hasDetailedPermission',
                resource: resource,
                action: operation
            });
            return false;
        }
    },
    
    /**
     * FIXED: Check if user can edit record with error handling
     */
    canEditRecord(resource, record) {
        try {
            if (!this.currentUser) {
                return false;
            }
            
            const role = this.normalizeRole(this.currentUser.role);
            
            // Admin and Manager can edit anything
            if (role === 'Admin' || role === 'Manager') {
                return true;
            }
            
            // Sales and User can only edit their own records
            if (record && record.assignedUser === this.currentUser.id) {
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Error checking edit permission:', error);
            GlobalErrorHandler.handle(error, { 
                operation: 'AuthManager.canEditRecord',
                resource: resource
            });
            return false;
        }
    },
    
    /**
     * FIXED: Check if user can delete record with error handling
     */
    canDeleteRecord(resource, record) {
        try {
            if (!this.currentUser) {
                return false;
            }
            
            const role = this.normalizeRole(this.currentUser.role);
            
            // Only Admin can delete
            return role === 'Admin';
            
        } catch (error) {
            console.error('❌ Error checking delete permission:', error);
            GlobalErrorHandler.handle(error, { 
                operation: 'AuthManager.canDeleteRecord',
                resource: resource
            });
            return false;
        }
    },

    /**
     * FIXED: Get user display with error handling
     */
    getUserDisplay() {
        try {
            if (!this.currentUser) return '';
            
            return `
                <div class="flex items-center gap-3">
                    <div class="text-right">
                        <div class="text-white font-semibold">${this.currentUser.name}</div>
                        <div class="text-white text-xs opacity-75">${this.normalizeRole(this.currentUser.role)}</div>
                    </div>
                    <div class="relative">
                        <button class="btn btn-primary" onclick="DropdownManager.toggle('userMenu'); event.stopPropagation();">
                            👤
                        </button>
                        <div id="userMenu" class="hidden absolute right-0 mt-2 w-56 glass-card rounded-lg overflow-hidden z-50 shadow-2xl">
                            <button class="w-full text-left px-4 py-3 text-white hover:bg-white hover:bg-opacity-10 transition-all flex items-center gap-3" 
                                    onclick="AuthManager.showProfile(); event.stopPropagation();">
                                <span class="text-xl">👤</span>
                                <span>My Profile</span>
                            </button>
                            <button class="w-full text-left px-4 py-3 text-white hover:bg-white hover:bg-opacity-10 transition-all flex items-center gap-3" 
                                    onclick="AuthManager.showSettings(); event.stopPropagation();">
                                <span class="text-xl">⚙️</span>
                                <span>Settings</span>
                            </button>
                            <button class="w-full text-left px-4 py-3 text-white hover:bg-white hover:bg-opacity-10 transition-all flex items-center gap-3" 
                                    onclick="AuthManager.showActivityLog(); event.stopPropagation();">
                                <span class="text-xl">📊</span>
                                <span>Activity Log</span>
                            </button>
                            <div class="border-t border-white border-opacity-20"></div>
                            <button class="w-full text-left px-4 py-3 text-white hover:bg-white hover:bg-opacity-10 transition-all flex items-center gap-3" 
                                    onclick="AuthManager.logout(); event.stopPropagation();">
                                <span class="text-xl">🚪</span>
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('❌ Error getting user display:', error);
            GlobalErrorHandler.handle(error, { operation: 'AuthManager.getUserDisplay' });
            return ''; // Return empty string as fallback
        }
    },

    /**
     * FIXED: Show profile with error handling
     */
    showProfile() {
        try {
            // Close all dropdowns before showing modal
            DropdownManager.closeAll();
            
            if (!this.currentUser) return;
            
            const content = `
                <div class="text-center mb-6">
                    <div class="text-6xl mb-4">👤</div>
                    <h3 class="text-white text-2xl font-bold">${this.currentUser.name}</h3>
                    <p class="text-white opacity-75 text-lg">${this.currentUser.email}</p>
                </div>
                
                <div class="space-y-3">
                    <div class="glass-card p-4">
                        <div class="text-white text-sm opacity-75 mb-1">Role</div>
                        <div class="flex items-center gap-2">
                            <span class="text-2xl">${this.getRoleIcon(this.currentUser.role)}</span>
                            <span class="text-white font-semibold text-lg">${this.normalizeRole(this.currentUser.role)}</span>
                        </div>
                    </div>
                    
                    <div class="glass-card p-4">
                        <div class="text-white text-sm opacity-75 mb-1">User ID</div>
                        <div class="text-white font-mono text-xs">${this.currentUser.id}</div>
                    </div>
                    
                    ${this.currentUser.phone ? `
                        <div class="glass-card p-4">
                            <div class="text-white text-sm opacity-75 mb-1">Phone</div>
                            <div class="text-white font-semibold">${this.currentUser.phone}</div>
                        </div>
                    ` : ''}

                    <div class="glass-card p-4">
                        <div class="text-white text-sm opacity-75 mb-2">Permissions</div>
                        <div class="flex flex-wrap gap-2">
                            ${this.getPermissionBadges()}
                        </div>
                    </div>
                    
                    ${this.currentUser.loginTime ? `
                        <div class="glass-card p-4">
                            <div class="text-white text-sm opacity-75 mb-1">Last Login</div>
                            <div class="text-white text-xs">${new Date(this.currentUser.loginTime).toLocaleString()}</div>
                        </div>
                    ` : ''}
                </div>
            `;

            const footer = `
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                <button class="btn btn-primary" onclick="AuthManager.showEditProfile()">✏️ Edit Profile</button>
            `;

            if (typeof CRUDManager !== 'undefined') {
                const modal = CRUDManager.createModal('👤 My Profile', content, footer);
                document.body.appendChild(modal);
            }
        } catch (error) {
            console.error('❌ Error showing profile:', error);
            GlobalErrorHandler.handle(error, { operation: 'AuthManager.showProfile' });
        }
    },

    /**
     * FIXED: Show edit profile with error handling
     */
    showEditProfile() {
        try {
            if (!this.currentUser) return;
            
            // Close existing modal
            const existingModal = document.querySelector('.modal-overlay');
            if (existingModal) existingModal.remove();
            
            const content = `
                <form id="editProfileForm">
                    <div class="form-group">
                        <label class="form-label required">Name</label>
                        <input type="text" name="name" class="form-input" value="${this.currentUser.name}" required>
                        <div class="form-error">Name is required</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label required">Email</label>
                        <input type="email" name="email" class="form-input" value="${this.currentUser.email}" required>
                        <div class="form-error">Valid email is required</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Phone</label>
                        <input type="tel" name="phone" class="form-input" value="${this.currentUser.phone || ''}" placeholder="+1 (555) 000-0000">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">New Password (leave blank to keep current)</label>
                        <input type="password" name="password" class="form-input" placeholder="Enter new password">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Confirm Password</label>
                        <input type="password" name="confirmPassword" class="form-input" placeholder="Confirm new password">
                    </div>
                </form>
            `;

            const footer = `
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                <button class="btn btn-primary" onclick="AuthManager.submitEditProfile()">💾 Save Changes</button>
            `;

            if (typeof CRUDManager !== 'undefined') {
                const modal = CRUDManager.createModal('✏️ Edit Profile', content, footer);
                document.body.appendChild(modal);
            }
        } catch (error) {
            console.error('❌ Error showing edit profile:', error);
            GlobalErrorHandler.handle(error, { operation: 'AuthManager.showEditProfile' });
        }
    },

    /**
     * FIXED: Submit edit profile with error handling
     */
    async submitEditProfile() {
        try {
            const form = document.getElementById('editProfileForm');
            if (!form) return;
            
            if (typeof CRUDManager !== 'undefined' && !CRUDManager.validateForm(form)) return;

            const data = typeof CRUDManager !== 'undefined' 
                ? CRUDManager.getFormData(form)
                : {
                    name: form.querySelector('[name="name"]').value,
                    email: form.querySelector('[name="email"]').value,
                    phone: form.querySelector('[name="phone"]').value,
                    password: form.querySelector('[name="password"]').value,
                    confirmPassword: form.querySelector('[name="confirmPassword"]').value
                };
            
            // Validate password match
            if (data.password && data.password !== data.confirmPassword) {
                if (typeof CRUDManager !== 'undefined') {
                    CRUDManager.showToast('❌ Passwords do not match', 'error');
                }
                return;
            }

            // Update current user
            this.currentUser.name = data.name;
            this.currentUser.email = data.email;
            if (data.phone) this.currentUser.phone = data.phone;

            // Update in storage
            const stored = localStorage.getItem('crm_user');
            if (stored) {
                localStorage.setItem('crm_user', JSON.stringify(this.currentUser));
            }
            const sessionStored = sessionStorage.getItem('crm_user');
            if (sessionStored) {
                sessionStorage.setItem('crm_user', JSON.stringify(this.currentUser));
            }

            // Update in Airtable if configured
            if (typeof AirtableAPI !== 'undefined' && AirtableAPI.isConfigured() && this.currentUser.id) {
                const updateData = {
                    name: data.name,
                    email: data.email,
                    phoneNumber: data.phone
                };
                if (data.password) {
                    updateData.password = data.password;
                }
                await AirtableAPI.updateUser(this.currentUser.id, updateData);
            }

            this.logActivity('profile_updated', { fields: Object.keys(data) });
            
            if (typeof CRUDManager !== 'undefined') {
                CRUDManager.showToast('✅ Profile updated successfully!', 'success');
            }
            
            document.querySelector('.modal-overlay').remove();
            
            // Refresh display
            if (typeof render === 'function') render();
        } catch (error) {
            console.error('❌ Error updating profile:', error);
            GlobalErrorHandler.handle(error, { operation: 'AuthManager.submitEditProfile' });
            
            if (typeof CRUDManager !== 'undefined') {
                CRUDManager.showToast('❌ Failed to update profile', 'error');
            }
        }
    },

    /**
     * FIXED: Show settings with error handling
     */
    showSettings() {
        try {
            // Close all dropdowns before showing modal
            DropdownManager.closeAll();
            
            const savedSettings = JSON.parse(localStorage.getItem('crm_settings') || '{}');
            
            const content = `
                <form id="settingsForm">
                    <div class="space-y-6">
                        <!-- Theme Settings -->
                        <div class="glass-card p-4">
                            <h4 class="text-white font-bold text-lg mb-3 flex items-center gap-2">
                                <span class="text-2xl">🎨</span>
                                <span>Theme Settings</span>
                            </h4>
                            
                            <div class="form-group">
                                <label class="form-label">Theme Preference</label>
                                <select name="theme" class="form-select">
                                    <option value="light" ${ThemeManager.currentTheme === 'light' ? 'selected' : ''}>☀️ Light</option>
                                    <option value="dark" ${ThemeManager.currentTheme === 'dark' ? 'selected' : ''}>🌙 Dark</option>
                                    <option value="auto" ${ThemeManager.currentTheme === 'auto' ? 'selected' : ''}>🔄 Auto (System)</option>
                                </select>
                                <div class="text-white text-xs opacity-60 mt-1">Auto mode follows your system preferences</div>
                            </div>
                        </div>

                        <!-- Notification Settings -->
                        <div class="glass-card p-4">
                            <h4 class="text-white font-bold text-lg mb-3 flex items-center gap-2">
                                <span class="text-2xl">🔔</span>
                                <span>Notifications</span>
                            </h4>
                            
                            <div class="space-y-3">
                                <label class="flex items-center text-white cursor-pointer">
                                    <input type="checkbox" name="notifyTasks" class="mr-2" ${savedSettings.notifications?.tasks !== false ? 'checked' : ''}>
                                    <span class="text-sm">Task reminders</span>
                                </label>
                                
                                <label class="flex items-center text-white cursor-pointer">
                                    <input type="checkbox" name="notifyLeads" class="mr-2" ${savedSettings.notifications?.leads !== false ? 'checked' : ''}>
                                    <span class="text-sm">New lead notifications</span>
                                </label>
                                
                                <label class="flex items-center text-white cursor-pointer">
                                    <input type="checkbox" name="notifyClients" class="mr-2" ${savedSettings.notifications?.clients !== false ? 'checked' : ''}>
                                    <span class="text-sm">Client updates</span>
                                </label>
                            </div>
                        </div>

                        <!-- Display Settings -->
                        <div class="glass-card p-4">
                            <h4 class="text-white font-bold text-lg mb-3 flex items-center gap-2">
                                <span class="text-2xl">🖥️</span>
                                <span>Display</span>
                            </h4>
                            
                            <div class="form-group">
                                <label class="form-label">Items per page</label>
                                <select name="itemsPerPage" class="form-select">
                                    <option value="10" ${savedSettings.display?.itemsPerPage === 10 ? 'selected' : ''}>10</option>
                                    <option value="25" ${!savedSettings.display?.itemsPerPage || savedSettings.display?.itemsPerPage === 25 ? 'selected' : ''}>25</option>
                                    <option value="50" ${savedSettings.display?.itemsPerPage === 50 ? 'selected' : ''}>50</option>
                                    <option value="100" ${savedSettings.display?.itemsPerPage === 100 ? 'selected' : ''}>100</option>
                                </select>
                            </div>

                            <label class="flex items-center text-white cursor-pointer mt-3">
                                <input type="checkbox" name="compactView" class="mr-2" ${savedSettings.display?.compactView ? 'checked' : ''}>
                                <span class="text-sm">Use compact view</span>
                            </label>
                        </div>

                        <!-- Data & Privacy -->
                        <div class="glass-card p-4">
                            <h4 class="text-white font-bold text-lg mb-3 flex items-center gap-2">
                                <span class="text-2xl">🔒</span>
                                <span>Data & Privacy</span>
                            </h4>
                            
                            <div class="space-y-3">
                                <button type="button" class="btn btn-secondary w-full" onclick="AuthManager.exportUserData()">
                                    📥 Export My Data
                                </button>
                                
                                <button type="button" class="btn btn-secondary w-full" onclick="AuthManager.clearCache()">
                                    🗑️ Clear Cache
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            `;

            const footer = `
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                <button class="btn btn-primary" onclick="AuthManager.saveSettings()">💾 Save Settings</button>
            `;

            if (typeof CRUDManager !== 'undefined') {
                const modal = CRUDManager.createModal('⚙️ Settings', content, footer);
                document.body.appendChild(modal);
            }
        } catch (error) {
            console.error('❌ Error showing settings:', error);
            GlobalErrorHandler.handle(error, { operation: 'AuthManager.showSettings' });
        }
    },

    /**
     * FIXED: Save settings with error handling
     */
    saveSettings() {
        try {
            const form = document.getElementById('settingsForm');
            if (!form) return;
            
            const data = typeof CRUDManager !== 'undefined' 
                ? CRUDManager.getFormData(form)
                : {};
            
            // Apply theme
            if (data.theme) {
                ThemeManager.setTheme(data.theme);
            }

            // Save other settings
            const settings = {
                notifications: {
                    tasks: form.querySelector('[name="notifyTasks"]')?.checked || false,
                    leads: form.querySelector('[name="notifyLeads"]')?.checked || false,
                    clients: form.querySelector('[name="notifyClients"]')?.checked || false
                },
                display: {
                    itemsPerPage: parseInt(data.itemsPerPage) || 25,
                    compactView: form.querySelector('[name="compactView"]')?.checked || false
                }
            };

            localStorage.setItem('crm_settings', JSON.stringify(settings));
            
            this.logActivity('settings_updated', settings);
            
            if (typeof CRUDManager !== 'undefined') {
                CRUDManager.showToast('✅ Settings saved successfully!', 'success');
            }
            
            document.querySelector('.modal-overlay')?.remove();
        } catch (error) {
            console.error('❌ Error saving settings:', error);
            GlobalErrorHandler.handle(error, { operation: 'AuthManager.saveSettings' });
            
            if (typeof CRUDManager !== 'undefined') {
                CRUDManager.showToast('❌ Failed to save settings', 'error');
            }
        }
    },

    /**
     * FIXED: Show activity log with error handling
     */
    showActivityLog() {
        try {
            // Close all dropdowns before showing modal
            DropdownManager.closeAll();
            
            const activities = this.getActivityLog();
            
            const content = `
                <div class="space-y-3 max-h-96 overflow-y-auto">
                    ${activities.length === 0 ? `
                        <div class="text-center text-white opacity-75 py-8">
                            <div class="text-4xl mb-2">📊</div>
                            <p>No activity recorded yet</p>
                        </div>
                    ` : activities.map(activity => `
                        <div class="glass-card p-3 hover:scale-102 transition-transform">
                            <div class="flex items-start gap-3">
                                <div class="text-2xl">${activity.icon}</div>
                                <div class="flex-1">
                                    <div class="text-white font-semibold">${activity.action}</div>
                                    <div class="text-white text-sm opacity-75">${activity.details}</div>
                                    <div class="text-white text-xs opacity-60 mt-1">⏰ ${activity.timestamp}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            const footer = `
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                <button class="btn btn-danger" onclick="AuthManager.clearActivityLog()">🗑️ Clear Log</button>
            `;

            if (typeof CRUDManager !== 'undefined') {
                const modal = CRUDManager.createModal('📊 Activity Log', content, footer);
                document.body.appendChild(modal);
            }
        } catch (error) {
            console.error('❌ Error showing activity log:', error);
            GlobalErrorHandler.handle(error, { operation: 'AuthManager.showActivityLog' });
        }
    },

    /**
     * FIXED: Log activity with error handling
     */
    logActivity(action, details) {
        try {
            const activities = JSON.parse(localStorage.getItem('crm_activity_log') || '[]');
            
            const icons = {
                'login': '🔓',
                'logout': '🔒',
                'create': '➕',
                'update': '✏️',
                'delete': '🗑️',
                'view': '👁️',
                'export': '📥',
                'profile_updated': '👤',
                'settings_updated': '⚙️'
            };

            activities.unshift({
                action: action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                details: typeof details === 'string' ? details : JSON.stringify(details),
                timestamp: new Date().toLocaleString(),
                icon: icons[action] || '📝'
            });

            localStorage.setItem('crm_activity_log', JSON.stringify(activities.slice(0, 50)));
        } catch (error) {
            console.error('❌ Error logging activity:', error);
            // Don't use GlobalErrorHandler here to avoid infinite loop
        }
    },

    /**
     * FIXED: Get activity log with error handling
     */
    getActivityLog() {
        try {
            return JSON.parse(localStorage.getItem('crm_activity_log') || '[]');
        } catch (error) {
            console.error('❌ Error getting activity log:', error);
            return [];
        }
    },

    /**
     * FIXED: Clear activity log with error handling
     */
    clearActivityLog() {
        try {
            if (typeof CRUDManager !== 'undefined') {
                CRUDManager.showConfirmDialog(
                    '🗑️ Clear Activity Log',
                    'Are you sure you want to clear your activity log? This action cannot be undone.',
                    () => {
                        localStorage.removeItem('crm_activity_log');
                        CRUDManager.showToast('✅ Activity log cleared', 'success');
                        document.querySelector('.modal-overlay')?.remove();
                    }
                );
            } else {
                if (confirm('Clear activity log?')) {
                    localStorage.removeItem('crm_activity_log');
                }
            }
        } catch (error) {
            console.error('❌ Error clearing activity log:', error);
            GlobalErrorHandler.handle(error, { operation: 'AuthManager.clearActivityLog' });
        }
    },

    /**
     * FIXED: Export user data with error handling
     */
    exportUserData() {
        try {
            const data = {
                user: this.currentUser,
                settings: JSON.parse(localStorage.getItem('crm_settings') || '{}'),
                activities: this.getActivityLog(),
                exportDate: new Date().toISOString(),
                theme: ThemeManager.currentTheme
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `crm-user-data-${Date.now()}.json`;
            link.click();
            URL.revokeObjectURL(url);

            this.logActivity('export', 'User data exported');
            
            if (typeof CRUDManager !== 'undefined') {
                CRUDManager.showToast('📥 User data exported successfully!', 'success');
            }
        } catch (error) {
            console.error('❌ Error exporting user data:', error);
            GlobalErrorHandler.handle(error, { operation: 'AuthManager.exportUserData' });
        }
    },

    /**
     * FIXED: Clear cache with error handling
     */
    clearCache() {
        try {
            if (typeof CRUDManager !== 'undefined') {
                CRUDManager.showConfirmDialog(
                    '🗑️ Clear Cache',
                    'This will clear all cached data but keep you signed in. Continue?',
                    () => {
                        const itemsToKeep = ['crm_user', 'crm_user_expiry', 'crm_theme', 'crm_settings', 'crm_activity_log'];
                        const allKeys = Object.keys(localStorage);
                        
                        let clearedCount = 0;
                        allKeys.forEach(key => {
                            if (!itemsToKeep.includes(key)) {
                                localStorage.removeItem(key);
                                clearedCount++;
                            }
                        });

                        this.logActivity('cache_cleared', `${clearedCount} items removed`);
                        CRUDManager.showToast(`✅ Cleared ${clearedCount} cache items!`, 'success');
                    }
                );
            }
        } catch (error) {
            console.error('❌ Error clearing cache:', error);
            GlobalErrorHandler.handle(error, { operation: 'AuthManager.clearCache' });
        }
    },

    /**
     * Get permission badges
     */
    getPermissionBadges() {
        try {
            const allPermissions = [
                'create', 'read', 'update', 'delete',
                'view_all', 'view_assigned',
                'export', 'import',
                'manage_tasks', 'manage_leads', 'manage_clients',
                'manage_calendar', 'manage_todos'
            ];
            
            const userPermissions = allPermissions.filter(perm => this.hasPermission(perm));
            
            return userPermissions.map(perm => 
                `<span class="status-badge badge-low" style="font-size: 11px;">${perm.replace(/_/g, ' ')}</span>`
            ).join('');
        } catch (error) {
            console.error('❌ Error getting permission badges:', error);
            return '';
        }
    },

    /**
     * Get role icon
     */
    getRoleIcon(role) {
        const normalized = this.normalizeRole(role);
        return {
            'Admin': '👑',
            'Manager': '📊',
            'Sales': '💼',
            'User': '👤'
        }[normalized] || '👤';
    }
};

// ========================================
// GLOBAL EVENT LISTENERS - WITH ERROR HANDLING
// ========================================

/**
 * FIXED: Close dropdowns when clicking outside with error handling
 */
document.addEventListener('click', (e) => {
    try {
        // Don't close if clicking on a button that opens a dropdown
        const clickedButton = e.target.closest('button');
        if (clickedButton && clickedButton.getAttribute('onclick')?.includes('toggle')) {
            return;
        }
        
        // Don't close if clicking inside a dropdown
        const clickedDropdown = e.target.closest('[id$="Menu"]');
        if (clickedDropdown) {
            return;
        }
        
        // Don't close if clicking inside a modal
        const clickedModal = e.target.closest('.modal-overlay');
        if (clickedModal) {
            return;
        }
        
        // Close all dropdowns
        DropdownManager.closeAll();
    } catch (error) {
        console.error('❌ Error in click handler:', error);
        // Don't use GlobalErrorHandler here to avoid potential recursion
    }
});

/**
 * FIXED: Initialize on load with error handling
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        AuthManager.init();
    } catch (error) {
        console.error('❌ Error initializing AuthManager:', error);
        GlobalErrorHandler.handle(error, { operation: 'AuthManager initialization' });
    }
});

console.log('✅ Enhanced Authentication & Theme Manager loaded - WITH ERROR HANDLING');
console.log('🎨 Theme options: Light, Dark, Auto');
console.log('🔐 Demo credentials available in login page');
console.log('🛡️ All operations protected with try-catch blocks');
console.log('📊 Comprehensive error handling and recovery');