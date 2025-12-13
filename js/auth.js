// ========================================
// USER MANAGEMENT (NO AUTHENTICATION)
// ========================================

const AuthManager = {
    currentUser: null,
    
    /**
     * Initialize default user
     */
    initializeDefaultUser() {
        this.currentUser = {
            id: 'default-user',
            name: 'CRM User',
            email: 'user@crm.com',
            role: 'Admin'
        };
        AppState.currentUser = this.currentUser;
        AppState.role = this.currentUser.role;
        return true;
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return true; // Always authenticated now
    },

    /**
     * Check if user has permission
     */
    hasPermission(action) {
        return true; // All permissions granted
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

console.log('✅ User Manager loaded (No Authentication Required)');