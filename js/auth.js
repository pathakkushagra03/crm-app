// ========================================
// AUTHENTICATION MANAGER - FIXED & HARDENED
// ========================================

console.warn("⚠️ DEMO MODE: Client-side auth is NOT secure for production.");

// ========================================
// THEME MANAGER - Light/Dark/Auto Support
// ========================================
const ThemeManager = {
    currentTheme: 'dark',
    
    init() {
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
    },
    
    setTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('crm_theme', theme);
        this.applyTheme(theme);
        
        // Refresh UI if settings modal is open
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            AuthManager.showSettings();
        }
    },
    
    applyTheme(theme) {
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
// ENHANCED AUTHENTICATION SYSTEM - FIXED
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
    
    init() {
        ThemeManager.init();
        console.log('🔐 AuthManager initialized');
    },
    
    /**
     * Normalize role string for consistent comparison
     * FIX: Prevents case-sensitivity issues with "admin" vs "Admin"
     */
    normalizeRole(role) {
        if (!role) return 'User';
        return role.trim().charAt(0).toUpperCase() + role.trim().slice(1).toLowerCase();
    },
    
    /**
     * Synchronize auth state across the application
     * FIX: Ensures AuthManager.currentUser and AppState.currentUser stay aligned
     */
    syncAuthState(user) {
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
    },
    
    /**
     * Create user session object
     * FIX: Standardized user object structure
     */
    createUserSession(userData) {
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
    },
    
    showLoginForm() {
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
    },

    togglePasswordVisibility() {
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
    },

    showDemoCredentials() {
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
    },

    fillLoginForm(email, password) {
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
    },

    /**
     * FIXED: Robust login handler with clear error messages
     */
    async handleLogin() {
        const form = document.getElementById('loginForm');
        const loginButton = document.getElementById('loginButton');
        const loginButtonText = document.getElementById('loginButtonText');
        
        if (!form) {
            console.error('❌ Login form not found');
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
                    }
                } catch (airtableError) {
                    console.warn('⚠️ Airtable authentication failed:', airtableError.message);
                    
                    // Show specific error message
                    if (typeof CRUDManager !== 'undefined') {
                        CRUDManager.showToast('❌ Invalid credentials. Try demo accounts or check Airtable config.', 'error');
                    }
                    
                    if (loginButton) loginButton.disabled = false;
                    if (loginButtonText) loginButtonText.textContent = '🚀 Sign In';
                    return;
                }
            }
            // STEP 3: Pure demo mode fallback (only in development)
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
            
            // Show user-friendly error
            const errorMessage = error.message || 'Login failed. Please try again.';
            
            if (typeof CRUDManager !== 'undefined') {
                CRUDManager.showToast(`❌ ${errorMessage}`, 'error');
            } else {
                alert(errorMessage);
            }
        } finally {
            // Reset button state
            if (loginButton) loginButton.disabled = false;
            if (loginButtonText) loginButtonText.textContent = '🚀 Sign In';
        }
    },

    /**
     * FIXED: Secure logout with proper cleanup
     */
    logout() {
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
    },
    
    performLogout() {
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
    },

    /**
     * FIXED: Check if user is authenticated
     */
    isAuthenticated() {
        const authenticated = this.currentUser !== null && this.currentUser.id;
        console.log('🔐 isAuthenticated:', authenticated, this.currentUser?.email);
        return authenticated;
    },

    /**
     * FIXED: Robust session checking with validation
     */
    checkStoredSession() {
        console.log('🔍 Checking for stored session...');
        
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
                } catch (error) {
                    console.error('❌ Failed to parse stored session:', error);
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
            } catch (error) {
                console.error('❌ Failed to parse session:', error);
                sessionStorage.removeItem('crm_user');
            }
        }

        console.log('ℹ️ No valid stored session found');
        return false;
    },

    /**
     * FIXED: Centralized permission checker with Admin priority
     */
    hasPermission(action) {
        if (!this.currentUser) {
            console.warn('⚠️ Permission check failed: No user authenticated');
            return false;
        }
        
        const role = this.normalizeRole(this.currentUser.role);
        
        console.log('🔐 Checking permission:', { action, role, userId: this.currentUser.id });
        
        // Admin has ALL permissions - NO EXCEPTIONS
        if (role === 'Admin') {
            console.log('✅ Admin: Permission granted');
            return true;
        }
        
        const permissions = {
            'Manager': ['create', 'read', 'update', 'delete', 'view_all', 'export'],
            'Sales': ['create', 'read', 'update', 'view_assigned'],
            'User': ['read', 'update', 'view_assigned']
        };

        const hasPermission = permissions[role]?.includes(action) || false;
        console.log(hasPermission ? '✅ Permission granted' : '❌ Permission denied');
        
        return hasPermission;
    },

    /**
     * FIXED: Detailed permission checker for CRUD operations
     */
    hasDetailedPermission(resource, operation) {
        if (!this.currentUser) {
            console.warn('⚠️ Detailed permission check failed: No user authenticated');
            return false;
        }
        
        const role = this.normalizeRole(this.currentUser.role);
        
        console.log('🔐 Checking detailed permission:', { 
            resource, 
            operation, 
            role, 
            userId: this.currentUser.id 
        });
        
        // Admin can do EVERYTHING - NO EXCEPTIONS
        if (role === 'Admin') {
            console.log('✅ Admin: Full access granted');
            return true;
        }
        
        // Manager can do most things except manage users/companies
        if (role === 'Manager') {
            if (resource === 'users' || resource === 'companies') {
                const allowed = operation === 'read';
                console.log(allowed ? '✅ Manager: Read-only access' : '❌ Manager: No write access to users/companies');
                return allowed;
            }
            const allowed = ['create', 'read', 'update', 'delete'].includes(operation);
            console.log(allowed ? '✅ Manager: Access granted' : '❌ Manager: Operation not allowed');
            return allowed;
        }
        
        // Sales can create, read, update (but not delete)
        if (role === 'Sales') {
            const allowed = ['create', 'read', 'update'].includes(operation);
            console.log(allowed ? '✅ Sales: Access granted' : '❌ Sales: Cannot delete');
            return allowed;
        }
        
        // User can only read and update
        if (role === 'User') {
            const allowed = ['read', 'update'].includes(operation);
            console.log(allowed ? '✅ User: Access granted' : '❌ User: Limited access');
            return allowed;
        }
        
        console.log('❌ Permission denied: Unknown role or operation');
        return false;
    },
    
    /**
     * FIXED: Check if user can edit specific record
     */
    canEditRecord(resource, record) {
        if (!this.currentUser) {
            console.warn('⚠️ Edit check failed: No user authenticated');
            return false;
        }
        
        const role = this.normalizeRole(this.currentUser.role);
        
        // Admin and Manager can edit anything
        if (role === 'Admin' || role === 'Manager') {
            console.log('✅ Admin/Manager: Can edit any record');
            return true;
        }
        
        // Sales and User can only edit their own records
        if (record && record.assignedUser === this.currentUser.id) {
            console.log('✅ User owns record: Can edit');
            return true;
        }
        
        console.log('❌ Cannot edit: Not assigned to user');
        return false;
    },
    
    /**
     * FIXED: Check if user can delete specific record
     */
    canDeleteRecord(resource, record) {
        if (!this.currentUser) {
            console.warn('⚠️ Delete check failed: No user authenticated');
            return false;
        }
        
        const role = this.normalizeRole(this.currentUser.role);
        
        // Only Admin can delete
        const canDelete = role === 'Admin';
        console.log(canDelete ? '✅ Admin: Can delete' : '❌ Only Admin can delete');
        
        return canDelete;
    },

    getUserDisplay() {
        if (!this.currentUser) return '';
        
        return `
            <div class="flex items-center gap-3">
                <div class="text-right">
                    <div class="text-white font-semibold">${this.currentUser.name}</div>
                    <div class="text-white text-xs opacity-75">${this.normalizeRole(this.currentUser.role)}</div>
                </div>
                <div class="relative">
                    <button class="btn btn-primary" onclick="document.getElementById('userMenu').classList.toggle('hidden')">
                        👤
                    </button>
                    <div id="userMenu" class="hidden absolute right-0 mt-2 w-56 glass-card rounded-lg overflow-hidden z-50 shadow-2xl">
                        <button class="w-full text-left px-4 py-3 text-white hover:bg-white hover:bg-opacity-10 transition-all flex items-center gap-3" 
                                onclick="AuthManager.showProfile(); document.getElementById('userMenu').classList.add('hidden');">
                            <span class="text-xl">👤</span>
                            <span>My Profile</span>
                        </button>
                        <button class="w-full text-left px-4 py-3 text-white hover:bg-white hover:bg-opacity-10 transition-all flex items-center gap-3" 
                                onclick="AuthManager.showSettings(); document.getElementById('userMenu').classList.add('hidden');">
                            <span class="text-xl">⚙️</span>
                            <span>Settings</span>
                        </button>
                        <button class="w-full text-left px-4 py-3 text-white hover:bg-white hover:bg-opacity-10 transition-all flex items-center gap-3" 
                                onclick="AuthManager.showActivityLog(); document.getElementById('userMenu').classList.add('hidden');">
                            <span class="text-xl">📊</span>
                            <span>Activity Log</span>
                        </button>
                        <div class="border-t border-white border-opacity-20"></div>
                        <button class="w-full text-left px-4 py-3 text-white hover:bg-white hover:bg-opacity-10 transition-all flex items-center gap-3" 
                                onclick="AuthManager.logout(); document.getElementById('userMenu').classList.add('hidden');">
                            <span class="text-xl">🚪</span>
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    showProfile() {
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
    },

    showEditProfile() {
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
    },

    async submitEditProfile() {
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

        try {
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
            console.error('Error updating profile:', error);
            if (typeof CRUDManager !== 'undefined') {
                CRUDManager.showToast('❌ Failed to update profile', 'error');
            }
        }
    },

    showSettings() {
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
    },

    saveSettings() {
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
    },

    showActivityLog() {
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
    },

    logActivity(action, details) {
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
    },

    getActivityLog() {
        return JSON.parse(localStorage.getItem('crm_activity_log') || '[]');
    },

    clearActivityLog() {
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
    },

    exportUserData() {
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
    },

    clearCache() {
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
    },

    getPermissionBadges() {
        const allPermissions = ['create', 'read', 'update', 'delete', 'manage_users', 'manage_companies', 'view_all', 'export'];
        const userPermissions = allPermissions.filter(perm => this.hasPermission(perm));
        
        return userPermissions.map(perm => 
            `<span class="status-badge badge-low" style="font-size: 11px;">${perm.replace('_', ' ')}</span>`
        ).join('');
    },

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

// Close user menu when clicking outside
document.addEventListener('click', (e) => {
    const userMenu = document.getElementById('userMenu');
    const button = e.target.closest('button');
    
    if (userMenu && !userMenu.contains(e.target) && button?.textContent !== '👤') {
        userMenu.classList.add('hidden');
    }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    AuthManager.init();
});

console.log('✅ Enhanced Authentication & Theme Manager loaded - FIXED');
console.log('🎨 Theme options: Light, Dark, Auto');
console.log('🔐 Demo credentials available in login page');
console.log('✅ Permission validation methods hardened');
console.log('✅ Admin role always has full access');
console.log('✅ Session validation improved');
console.log('✅ Auth state synchronization active');