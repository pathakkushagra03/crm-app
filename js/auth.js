// ========================================
// AUTHENTICATION SYSTEM
// ========================================

const AuthManager = {
    currentUser: null,
    
    /**
     * Show login form
     */
    showLoginForm() {
        const content = `
            <div class="text-center mb-8">
                <div class="text-6xl mb-4">🔐</div>
                <h1 class="text-4xl font-bold text-white mb-2">Welcome to CRM</h1>
                <p class="text-white text-lg opacity-75">Sign in to continue</p>
            </div>
            
            <form id="loginForm">
                <div class="form-group">
                    <label class="form-label required">Email</label>
                    <input type="email" name="email" class="form-input" placeholder="your@email.com" required autofocus>
                    <div class="form-error">Valid email is required</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Password</label>
                    <input type="password" name="password" class="form-input" placeholder="Enter your password" required>
                    <div class="form-error">Password is required</div>
                </div>
                
                <div class="form-group mb-6">
                    <label class="flex items-center text-white cursor-pointer">
                        <input type="checkbox" name="remember" class="mr-2">
                        <span class="text-sm">Remember me</span>
                    </label>
                </div>
                
                <button type="submit" class="btn btn-primary w-full">
                    Sign In
                </button>
                
                <div class="text-center mt-6">
                    <p class="text-white text-sm opacity-75">
                        Demo Mode: Use any email/password or configure Airtable
                    </p>
                </div>
            </form>
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

    /**
     * Handle login
     */
    async handleLogin() {
        const form = document.getElementById('loginForm');
        if (!CRUDManager.validateForm(form)) return;

        const data = CRUDManager.getFormData(form);

        try {
            let user = null;

            if (AirtableAPI.isConfigured()) {
                user = await AirtableAPI.authenticateUser(data.email, data.password);
                
                if (!user) {
                    CRUDManager.showToast('Invalid email or password', 'error');
                    return;
                }
            } else {
                // Demo mode - accept any credentials
                user = {
                    id: 'demo-user',
                    name: 'Demo User',
                    email: admin@demo.com,
                    password: 'demo123',
                    role: 'Admin',
                    companies: []
                };
            }

            // Store authentication
            this.currentUser = user;
            AppState.currentUser = user;
            AppState.role = user.role;

            if (data.remember) {
                localStorage.setItem('crm_user', JSON.stringify(user));
            }

            CRUDManager.showToast(`Welcome back, ${user.name}!`, 'success');
            
            // Load companies and proceed
            await loadCompanies();
            navigateTo('companySelection');

        } catch (error) {
            console.error('Login error:', error);
            CRUDManager.showToast('Login failed. Please try again.', 'error');
        }
    },

    /**
     * Handle logout
     */
    logout() {
        CRUDManager.showConfirmDialog(
            'Sign Out',
            'Are you sure you want to sign out?',
            () => {
                this.currentUser = null;
                AppState.currentUser = null;
                AppState.selectedCompany = null;
                AppState.selectedUser = null;
                localStorage.removeItem('crm_user');
                
                CRUDManager.showToast('Signed out successfully', 'success');
                this.showLoginForm();
            }
        );
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null;
    },

    /**
     * Check stored session
     */
    checkStoredSession() {
        const stored = localStorage.getItem('crm_user');
        if (stored) {
            try {
                this.currentUser = JSON.parse(stored);
                AppState.currentUser = this.currentUser;
                AppState.role = this.currentUser.role;
                return true;
            } catch (error) {
                localStorage.removeItem('crm_user');
                return false;
            }
        }
        return false;
    },

    /**
     * Check if user has permission
     */
    hasPermission(action) {
        if (!this.currentUser) return false;
        
        const role = this.currentUser.role;
        
        const permissions = {
            'Admin': ['create', 'read', 'update', 'delete', 'manage_users', 'manage_companies'],
            'Manager': ['create', 'read', 'update', 'delete'],
            'Sales': ['create', 'read', 'update'],
            'User': ['read', 'update']
        };

        return permissions[role]?.includes(action) || false;
    },

    /**
     * Get user display info
     */
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
                    <div id="userMenu" class="hidden absolute right-0 mt-2 w-48 glass-card rounded-lg overflow-hidden z-50">
                        <button class="w-full text-left px-4 py-3 text-white hover:bg-white hover:bg-opacity-10 transition-all" 
                                onclick="AuthManager.showProfile()">
                            👤 My Profile
                        </button>
                        <button class="w-full text-left px-4 py-3 text-white hover:bg-white hover:bg-opacity-10 transition-all" 
                                onclick="AuthManager.logout()">
                            🚪 Sign Out
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Show user profile
     */
    showProfile() {
        document.getElementById('userMenu')?.classList.add('hidden');
        
        const content = `
            <div class="text-center mb-6">
                <div class="text-6xl mb-4">👤</div>
                <h3 class="text-white text-2xl font-bold">${this.currentUser.name}</h3>
                <p class="text-white opacity-75">${this.currentUser.email}</p>
            </div>
            
            <div class="space-y-3">
                <div class="glass-card p-4">
                    <div class="text-white text-sm opacity-75 mb-1">Role</div>
                    <div class="text-white font-semibold">${this.currentUser.role}</div>
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
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
        `;

        const modal = CRUDManager.createModal('My Profile', content, footer);
        document.body.appendChild(modal);
    }
};

// Close user menu when clicking outside
document.addEventListener('click', (e) => {
    const userMenu = document.getElementById('userMenu');
    if (userMenu && !e.target.closest('#userMenu') && !e.target.closest('button')) {
        userMenu.classList.add('hidden');
    }
});

console.log('✅ Authentication Manager loaded');