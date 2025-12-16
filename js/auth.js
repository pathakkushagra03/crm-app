console.warn("⚠️ DEMO MODE: Client-side auth is NOT secure.");
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
// ENHANCED AUTHENTICATION SYSTEM
// ========================================
const AuthManager = {
    currentUser: null,
    
    init() {
        ThemeManager.init();
    },
    
    showLoginForm() {
        const content = `
            <div class="text-center mb-8">
                <div class="text-6xl mb-4">🔐</div>
                <h1 class="text-4xl font-bold text-white mb-2">Welcome to CRM</h1>
                <p class="text-white text-lg opacity-75">Sign in to continue to your workspace</p>
            </div>
            
            <form id="loginForm">
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
                        <input type="checkbox" name="remember" class="mr-2">
                        <span class="text-sm">Remember me for 30 days</span>
                    </label>
                </div>
                
                <button type="submit" class="btn btn-primary w-full mb-4">
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
        app.innerHTML = `
            <div class="min-h-screen flex items-center justify-center p-6">
                <div class="glass-card p-12 max-w-md w-full fade-in">
                    ${content}
                </div>
            </div>
        `;

        const form = document.getElementById('loginForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    },

    togglePasswordVisibility() {
        const input = document.getElementById('passwordInput');
        const icon = document.getElementById('passwordToggleIcon');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.textContent = '🙈';
        } else {
            input.type = 'password';
            icon.textContent = '👁️';
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

        const modal = CRUDManager.createModal('🔐 Demo Credentials', demoInfo, footer);
        document.body.appendChild(modal);
    },

    fillLoginForm(email, password) {
        document.querySelector('.modal-overlay').remove();
        
        setTimeout(() => {
            const emailInput = document.querySelector('input[name="email"]');
            const passwordInput = document.querySelector('input[name="password"]');
            
            if (emailInput && passwordInput) {
                emailInput.value = email;
                passwordInput.value = password;
                emailInput.focus();
                
                CRUDManager.showToast(`Credentials filled for ${email}`, 'success');
            }
        }, 100);
    },

    async handleLogin() {
        const form = document.getElementById('loginForm');
        if (!CRUDManager.validateForm(form)) return;

        const data = CRUDManager.getFormData(form);
        const loginButton = document.getElementById('loginButtonText');
        const originalText = loginButton.textContent;
        
        loginButton.textContent = '⏳ Signing in...';

        try {
            let user = null;

            // Define demo users (always available)
            const demoUsers = {
                'admin@demo.com': { 
                    role: 'Admin', 
                    password: 'admin123',
                    name: 'Admin User',
                    phone: '+1 (555) 000-0001'
                },
                'manager@demo.com': { 
                    role: 'Manager', 
                    password: 'manager123',
                    name: 'Manager User',
                    phone: '+1 (555) 000-0002'
                },
                'sales@demo.com': { 
                    role: 'Sales', 
                    password: 'sales123',
                    name: 'Sales User',
                    phone: '+1 (555) 000-0003'
                },
                'user@demo.com': { 
                    role: 'User', 
                    password: 'user123',
                    name: 'Regular User',
                    phone: '+1 (555) 000-0004'
                }
            };

            // Check if using demo credentials first
            const demoUser = demoUsers[data.email.toLowerCase()];
            
            if (demoUser && demoUser.password === data.password) {
                // Use demo account
                user = {
                    id: 'demo-' + data.email.split('@')[0],
                    name: demoUser.name,
                    email: data.email,
                    phone: demoUser.phone,
                    role: demoUser.role,
                    companies: ['1']
                };
            } else if (AirtableAPI.isConfigured()) {
                // Try Airtable authentication
                try {
                    user = await AirtableAPI.authenticateUser(data.email, data.password);
                } catch (error) {
                    console.log('Airtable authentication failed, trying fallback');
                }
                
                if (!user) {
                    // Fallback: Accept any credentials in demo mode
                    user = {
                        id: 'demo-user-' + Date.now(),
                        name: data.email.split('@')[0].charAt(0).toUpperCase() + data.email.split('@')[0].slice(1),
                        email: data.email,
                        phone: '',
                        role: 'Admin',
                        companies: ['1']
                    };
                }
            } else {
                // Pure demo mode - accept any credentials
                user = {
                    id: 'demo-user-' + Date.now(),
                    name: data.email.split('@')[0].charAt(0).toUpperCase() + data.email.split('@')[0].slice(1),
                    email: data.email,
                    phone: '',
                    role: 'Admin',
                    companies: ['1']
                };
            }

            // Store authentication
            this.currentUser = user;
            AppState.currentUser = user;
            AppState.role = user.role;

            if (data.remember) {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30);
                localStorage.setItem('crm_user', JSON.stringify(user));
                localStorage.setItem('crm_user_expiry', expiryDate.toISOString());
            } else {
                sessionStorage.setItem('crm_user', JSON.stringify(user));
            }

            // Log activity
            this.logActivity('login', { 
                email: user.email, 
                role: user.role,
                time: new Date().toISOString()
            });

            CRUDManager.showToast(`🎉 Welcome back, ${user.name}!`, 'success');
            
            // Load companies and proceed
            await loadCompanies();
            navigateTo('companySelection');

        } catch (error) {
            console.error('Login error:', error);
            CRUDManager.showToast('❌ Login failed. Please try again.', 'error');
            loginButton.textContent = originalText;
        }
    },

    logout() {
        CRUDManager.showConfirmDialog(
            '🚪 Sign Out',
            'Are you sure you want to sign out?',
            () => {
                if (this.currentUser) {
                    this.logActivity('logout', { 
                        email: this.currentUser.email,
                        time: new Date().toISOString()
                    });
                }

                this.currentUser = null;
                AppState.currentUser = null;
                AppState.selectedCompany = null;
                AppState.selectedUser = null;
                AppState.data = {
                    companies: [],
                    users: [],
                    clients: [],
                    leads: [],
                    generalTodos: [],
                    clientTodos: []
                };
                
                localStorage.removeItem('crm_user');
                localStorage.removeItem('crm_user_expiry');
                sessionStorage.removeItem('crm_user');
                
                CRUDManager.showToast('👋 Signed out successfully', 'success');
                this.showLoginForm();
            }
        );
    },

    isAuthenticated() {
        return this.currentUser !== null;
    },

    checkStoredSession() {
        const stored = localStorage.getItem('crm_user');
        const expiry = localStorage.getItem('crm_user_expiry');
        
        if (stored && expiry) {
            const expiryDate = new Date(expiry);
            if (expiryDate > new Date()) {
                try {
                    this.currentUser = JSON.parse(stored);
                    AppState.currentUser = this.currentUser;
                    AppState.role = this.currentUser.role;
                    return true;
                } catch (error) {
                    localStorage.removeItem('crm_user');
                    localStorage.removeItem('crm_user_expiry');
                }
            } else {
                localStorage.removeItem('crm_user');
                localStorage.removeItem('crm_user_expiry');
            }
        }

        const sessionStored = sessionStorage.getItem('crm_user');
        if (sessionStored) {
            try {
                this.currentUser = JSON.parse(sessionStored);
                AppState.currentUser = this.currentUser;
                AppState.role = this.currentUser.role;
                return true;
            } catch (error) {
                sessionStorage.removeItem('crm_user');
            }
        }

        return false;
    },

    hasPermission(action) {
        if (!this.currentUser) return false;
        
        const role = this.currentUser.role;
        
        const permissions = {
            'Admin': ['create', 'read', 'update', 'delete', 'manage_users', 'manage_companies', 'view_all', 'export'],
            'Manager': ['create', 'read', 'update', 'delete', 'view_all', 'export'],
            'Sales': ['create', 'read', 'update', 'view_assigned'],
            'User': ['read', 'update', 'view_assigned']
        };

        return permissions[role]?.includes(action) || false;
    },

    getUserDisplay() {
        if (!this.currentUser) return '';
        
        return `
            <div class="flex items-center gap-3">
                <div class="text-right">
                    <div class="text-white font-semibold">${this.currentUser.name}</div>
                    <div class="text-white text-xs opacity-75">${this.currentUser.role}</div>
                </div>
                <div class="relative">
                    <button class="btn btn-primary" onclick="document.getElementById('userMenu').classList.toggle('hidden')">
                        👤
                    </button>
                    <div id="userMenu" class="hidden absolute right-0 mt-2 w-56 glass-card rounded-lg overflow-hidden z-50 shadow-2xl">
                        <button class="w-full text-left px-4 py-3 text-white hover:bg-white hover:bg-opacity-10 transition-all flex items-center gap-3" 
                                onclick="AuthManager.showProfile()">
                            <span class="text-xl">👤</span>
                            <span>My Profile</span>
                        </button>
                        <button class="w-full text-left px-4 py-3 text-white hover:bg-white hover:bg-opacity-10 transition-all flex items-center gap-3" 
                                onclick="AuthManager.showSettings()">
                            <span class="text-xl">⚙️</span>
                            <span>Settings</span>
                        </button>
                        <button class="w-full text-left px-4 py-3 text-white hover:bg-white hover:bg-opacity-10 transition-all flex items-center gap-3" 
                                onclick="AuthManager.showActivityLog()">
                            <span class="text-xl">📊</span>
                            <span>Activity Log</span>
                        </button>
                        <div class="border-t border-white border-opacity-20"></div>
                        <button class="w-full text-left px-4 py-3 text-white hover:bg-white hover:bg-opacity-10 transition-all flex items-center gap-3" 
                                onclick="AuthManager.logout()">
                            <span class="text-xl">🚪</span>
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    showProfile() {
        document.getElementById('userMenu')?.classList.add('hidden');
        
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
                        <span class="text-white font-semibold text-lg">${this.currentUser.role}</span>
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
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
            <button class="btn btn-primary" onclick="AuthManager.showEditProfile()">✏️ Edit Profile</button>
        `;

        const modal = CRUDManager.createModal('👤 My Profile', content, footer);
        document.body.appendChild(modal);
    },

    showEditProfile() {
        document.querySelector('.modal-overlay').remove();
        
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

        const modal = CRUDManager.createModal('✏️ Edit Profile', content, footer);
        document.body.appendChild(modal);
    },

    async submitEditProfile() {
        const form = document.getElementById('editProfileForm');
        if (!CRUDManager.validateForm(form)) return;

        const data = CRUDManager.getFormData(form);
        
        // Validate password match
        if (data.password && data.password !== data.confirmPassword) {
            CRUDManager.showToast('❌ Passwords do not match', 'error');
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
            if (AirtableAPI.isConfigured() && this.currentUser.id) {
                const updateData = {
                    name: data.name,
                    email: data.email,
                    phone: data.phone
                };
                if (data.password) {
                    updateData.password = data.password;
                }
                await AirtableAPI.updateUser(this.currentUser.id, updateData);
            }

            this.logActivity('profile_updated', { fields: Object.keys(data) });
            
            CRUDManager.showToast('✅ Profile updated successfully!', 'success');
            document.querySelector('.modal-overlay').remove();
            
            // Refresh display
            render();
        } catch (error) {
            console.error('Error updating profile:', error);
            CRUDManager.showToast('❌ Failed to update profile', 'error');
        }
    },

    showSettings() {
        document.getElementById('userMenu')?.classList.add('hidden');
        
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

        const modal = CRUDManager.createModal('⚙️ Settings', content, footer);
        document.body.appendChild(modal);
    },

    saveSettings() {
        const form = document.getElementById('settingsForm');
        const data = CRUDManager.getFormData(form);
        
        // Apply theme
        if (data.theme) {
            ThemeManager.setTheme(data.theme);
        }

        // Save other settings
        const settings = {
            notifications: {
                tasks: form.querySelector('[name="notifyTasks"]').checked,
                leads: form.querySelector('[name="notifyLeads"]').checked,
                clients: form.querySelector('[name="notifyClients"]').checked
            },
            display: {
                itemsPerPage: parseInt(data.itemsPerPage),
                compactView: form.querySelector('[name="compactView"]').checked
            }
        };

        localStorage.setItem('crm_settings', JSON.stringify(settings));
        
        this.logActivity('settings_updated', settings);
        
        CRUDManager.showToast('✅ Settings saved successfully!', 'success');
        document.querySelector('.modal-overlay').remove();
    },

    showActivityLog() {
        document.getElementById('userMenu')?.classList.add('hidden');
        
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

        const modal = CRUDManager.createModal('📊 Activity Log', content, footer);
        document.body.appendChild(modal);
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
        CRUDManager.showConfirmDialog(
            '🗑️ Clear Activity Log',
            'Are you sure you want to clear your activity log? This action cannot be undone.',
            () => {
                localStorage.removeItem('crm_activity_log');
                CRUDManager.showToast('✅ Activity log cleared', 'success');
                document.querySelector('.modal-overlay').remove();
            }
        );
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
        CRUDManager.showToast('📥 User data exported successfully!', 'success');
    },

    clearCache() {
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
    },

    getPermissionBadges() {
        const allPermissions = ['create', 'read', 'update', 'delete', 'manage_users', 'manage_companies', 'view_all', 'export'];
        const userPermissions = allPermissions.filter(perm => this.hasPermission(perm));
        
        return userPermissions.map(perm => 
            `<span class="status-badge badge-low">${perm.replace('_', ' ')}</span>`
        ).join('');
    },

    getRoleIcon(role) {
        return {
            'Admin': '👑',
            'Manager': '📊',
            'Sales': '💼',
            'User': '👤'
        }[role] || '👤';
    }
};

// Close user menu when clicking outside
document.addEventListener('click', (e) => {
    const userMenu = document.getElementById('userMenu');
    const button = e.target.closest('button');
    
    if (userMenu && !userMenu.contains(e.target) && !button) {
        userMenu.classList.add('hidden');
    }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    AuthManager.init();
});

console.log('✅ Enhanced Authentication & Theme Manager loaded');
console.log('🎨 Theme options: Light, Dark, Auto');
console.log('🔐 Demo credentials available in login page');