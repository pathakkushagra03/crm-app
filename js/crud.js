// ========================================
// CRUD OPERATIONS & MODAL MANAGEMENT
// ========================================

const CRUDManager = {
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${type === 'success' ? '✅' : '⚠️'}</div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    /**
     * Show confirmation dialog
     */
    showConfirmDialog(title, message, onConfirm) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="confirm-dialog">
                <div class="confirm-icon">⚠️</div>
                <h3 class="confirm-title">${title}</h3>
                <p class="confirm-message">${message}</p>
                <div class="confirm-actions">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Cancel
                    </button>
                    <button class="btn btn-danger" id="confirmBtn">
                        Confirm
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector('#confirmBtn').addEventListener('click', () => {
            overlay.remove();
            onConfirm();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    },

    /**
     * Create modal HTML
     */
    createModal(title, content, footer) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">${title}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
            </div>
        `;

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });

        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);

        return overlay;
    },

    /**
     * Validate form
     */
    validateForm(formElement) {
        let isValid = true;
        const inputs = formElement.querySelectorAll('[required]');

        inputs.forEach(input => {
            const group = input.closest('.form-group');
            if (!input.value.trim()) {
                group.classList.add('error');
                isValid = false;
            } else {
                group.classList.remove('error');
            }
        });

        return isValid;
    },

    /**
     * Get form data as object
     */
    getFormData(formElement) {
        const formData = new FormData(formElement);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    },

    // ========================================
    // COMPANY CRUD OPERATIONS
    // ========================================

    showAddCompanyForm() {
        const content = `
            <form id="addCompanyForm">
                <div class="form-group">
                    <label class="form-label required">Company Name</label>
                    <input type="text" name="name" class="form-input" placeholder="Enter company name" required>
                    <div class="form-error">Company name is required</div>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitAddCompany()">Create Company</button>
        `;

        const modal = this.createModal('Add New Company', content, footer);
        document.body.appendChild(modal);
    },

    async submitAddCompany() {
        const form = document.getElementById('addCompanyForm');
        if (!this.validateForm(form)) return;

        const data = this.getFormData(form);

        try {
            let newCompany = null;
            
            if (AirtableAPI.isConfigured()) {
                newCompany = await AirtableAPI.addCompany(data);
                this.showToast('Company created successfully!', 'success');
            } else {
                // Demo mode
                const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7B731'];
                newCompany = {
                    id: 'demo-' + Date.now().toString(),
                    name: data.name,
                    color: colors[Math.floor(Math.random() * colors.length)]
                };
                this.showToast('Company created (Demo Mode)', 'success');
            }
            
            // Add to state
            AppState.data.companies.push(newCompany);
            
            // Close modal and refresh
            document.querySelector('.modal-overlay').remove();
            render();
            
        } catch (error) {
            console.error('Error creating company:', error);
            this.showToast('Failed to create company: ' + error.message, 'error');
        }
    },

    showEditCompanyForm(companyId) {
        const company = AppState.data.companies.find(c => c.id === companyId);
        if (!company) {
            this.showToast('Company not found', 'error');
            return;
        }

        const content = `
            <form id="editCompanyForm">
                <div class="form-group">
                    <label class="form-label required">Company Name</label>
                    <input type="text" name="name" class="form-input" value="${company.name}" required>
                    <div class="form-error">Company name is required</div>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-danger" onclick="CRUDManager.deleteCompany('${companyId}')">Delete Company</button>
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitEditCompany('${companyId}')">Update Company</button>
        `;

        const modal = this.createModal('Edit Company', content, footer);
        document.body.appendChild(modal);
    },

    async submitEditCompany(companyId) {
        const form = document.getElementById('editCompanyForm');
        if (!this.validateForm(form)) return;

        const data = this.getFormData(form);

        try {
            if (AirtableAPI.isConfigured()) {
                await AirtableAPI.updateCompany(companyId, data);
                this.showToast('Company updated successfully!', 'success');
            } else {
                // Demo mode
                const company = AppState.data.companies.find(c => c.id === companyId);
                if (company) {
                    company.name = data.name;
                }
                this.showToast('Company updated (Demo Mode)', 'success');
            }

            // Refresh data
            await loadCompanies();
            render();
            document.querySelector('.modal-overlay').remove();
            
        } catch (error) {
            console.error('Error updating company:', error);
            this.showToast('Failed to update company: ' + error.message, 'error');
        }
    },

    deleteCompany(companyId) {
        this.showConfirmDialog(
            'Delete Company',
            'Are you sure you want to delete this company? This will also delete all associated users, clients, leads, and tasks. This action cannot be undone.',
            async () => {
                try {
                    if (AirtableAPI.isConfigured()) {
                        await AirtableAPI.deleteCompany(companyId);
                        this.showToast('Company deleted successfully!', 'success');
                    } else {
                        // Demo mode - remove from state
                        AppState.data.companies = AppState.data.companies.filter(c => c.id !== companyId);
                        AppState.data.users = AppState.data.users.filter(u => !u.companies || !u.companies.includes(companyId));
                        AppState.data.clients = AppState.data.clients.filter(c => c.company !== companyId);
                        AppState.data.leads = AppState.data.leads.filter(l => l.company !== companyId);
                        AppState.data.generalTodos = AppState.data.generalTodos.filter(t => t.company !== companyId);
                        AppState.data.clientTodos = AppState.data.clientTodos.filter(t => t.company !== companyId);
                        this.showToast('Company deleted (Demo Mode)', 'success');
                    }

                    await loadCompanies();
                    render();
                    document.querySelector('.modal-overlay')?.remove();
                    
                } catch (error) {
                    console.error('Error deleting company:', error);
                    this.showToast('Failed to delete company: ' + error.message, 'error');
                }
            }
        );
    },

    // ========================================
    // USER/MEMBER CRUD OPERATIONS
    // ========================================
    
    showAddUserForm() {
        const companies = AppState.data.companies;
        
        const content = `
            <form id="addUserForm">
                <div class="form-group">
                    <label class="form-label required">User Name</label>
                    <input type="text" name="name" class="form-input" placeholder="Enter user name" required>
                    <div class="form-error">User name is required</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Email</label>
                    <input type="email" name="email" class="form-input" placeholder="user@example.com" required>
                    <div class="form-error">Valid email is required</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="tel" name="phone" class="form-input" placeholder="+1 (555) 000-0000">
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Password</label>
                    <input type="password" name="password" class="form-input" placeholder="Enter password" required>
                    <div class="form-error">Password is required</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Role</label>
                    <select name="role" class="form-select" required>
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Sales">Sales</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Company</label>
                    <select name="companies" class="form-select" required>
                        <option value="">Select Company</option>
                        ${companies.map(company => `<option value="${company.id}">${company.name}</option>`).join('')}
                    </select>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitAddUser()">Create User</button>
        `;

        const modal = this.createModal('Add New User', content, footer);
        document.body.appendChild(modal);
    },

    async submitAddUser() {
        const form = document.getElementById('addUserForm');
        if (!this.validateForm(form)) return;

        const data = this.getFormData(form);

        try {
            if (AirtableAPI.isConfigured()) {
                await AirtableAPI.addUser(data);
                this.showToast('User created successfully!', 'success');
            } else {
                AppState.data.users.push({
                    id: Date.now().toString(),
                    ...data,
                    companies: [data.companies]
                });
                this.showToast('User created (demo mode)', 'success');
            }

            if (AppState.selectedCompany) {
                await loadCompanyData(AppState.selectedCompany);
            }
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            console.error('Error creating user:', error);
            this.showToast('Failed to create user. Please try again.', 'error');
        }
    },

    showEditUserForm(userId) {
        const user = AppState.data.users.find(u => u.id === userId);
        if (!user) return;

        const companies = AppState.data.companies;
        const userCompany = Array.isArray(user.companies) ? user.companies[0] : user.companies;
        
        const content = `
            <form id="editUserForm">
                <div class="form-group">
                    <label class="form-label required">User Name</label>
                    <input type="text" name="name" class="form-input" value="${user.name}" required>
                    <div class="form-error">User name is required</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Email</label>
                    <input type="email" name="email" class="form-input" value="${user.email}" required>
                    <div class="form-error">Valid email is required</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="tel" name="phone" class="form-input" value="${user.phone || ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Password (leave blank to keep current)</label>
                    <input type="password" name="password" class="form-input" placeholder="Enter new password">
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Role</label>
                    <select name="role" class="form-select" required>
                        <option value="User" ${user.role === 'User' ? 'selected' : ''}>User</option>
                        <option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Admin</option>
                        <option value="Manager" ${user.role === 'Manager' ? 'selected' : ''}>Manager</option>
                        <option value="Sales" ${user.role === 'Sales' ? 'selected' : ''}>Sales</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Company</label>
                    <select name="companies" class="form-select" required>
                        ${companies.map(company => `
                            <option value="${company.id}" ${userCompany === company.id ? 'selected' : ''}>
                                ${company.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-danger" onclick="CRUDManager.deleteUser('${userId}')">Delete User</button>
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitEditUser('${userId}')">Update User</button>
        `;

        const modal = this.createModal('Edit User', content, footer);
        document.body.appendChild(modal);
    },

    async submitEditUser(userId) {
        const form = document.getElementById('editUserForm');
        if (!this.validateForm(form)) return;

        const data = this.getFormData(form);
        if (!data.password) delete data.password;

        try {
            if (AirtableAPI.isConfigured()) {
                await AirtableAPI.updateUser(userId, data);
                this.showToast('User updated successfully!', 'success');
            } else {
                const user = AppState.data.users.find(u => u.id === userId);
                Object.assign(user, data);
                if (data.companies) user.companies = [data.companies];
            }

            if (AppState.selectedCompany) {
                await loadCompanyData(AppState.selectedCompany);
            }
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            console.error('Error updating user:', error);
            this.showToast('Failed to update user. Please try again.', 'error');
        }
    },

    deleteUser(userId) {
        this.showConfirmDialog(
            'Delete User',
            'Are you sure you want to delete this user? This action cannot be undone.',
            async () => {
                try {
                    if (AirtableAPI.isConfigured()) {
                        await AirtableAPI.deleteUser(userId);
                        this.showToast('User deleted successfully!', 'success');
                    } else {
                        AppState.data.users = AppState.data.users.filter(u => u.id !== userId);
                    }

                    if (AppState.selectedCompany) {
                        await loadCompanyData(AppState.selectedCompany);
                    }
                    render();
                    document.querySelector('.modal-overlay')?.remove();
                } catch (error) {
                    console.error('Error deleting user:', error);
                    this.showToast('Failed to delete user. Please try again.', 'error');
                }
            }
        );
    },

    // ========================================
    // CLIENT CRUD OPERATIONS
    // ========================================

    showAddClientForm() {
        const users = AppState.data.users.filter(u => 
            u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany)
        );
        
        const content = `
            <form id="addClientForm">
                <div class="form-group">
                    <label class="form-label required">Client Name</label>
                    <input type="text" name="name" class="form-input" placeholder="Enter client name" required>
                    <div class="form-error">Client name is required</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" name="email" class="form-input" placeholder="client@example.com">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="tel" name="phone" class="form-input" placeholder="+1 (555) 000-0000">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Lead Type</label>
                    <input type="text" name="leadType" class="form-input" placeholder="e.g., Referral, Online, Event">
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Status</label>
                    <select name="status" class="form-select" required>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="On Hold">On Hold</option>
                        <option value="VIP">VIP</option>
                        <option value="Churned">Churned</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Priority</label>
                    <select name="priority" class="form-select">
                        <option value="">None</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Assigned User</label>
                    <select name="assignedUser" class="form-select">
                        <option value="">Unassigned</option>
                        ${users.map(user => `<option value="${user.id}">${user.name}</option>`).join('')}
                    </select>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitAddClient()">Create Client</button>
        `;

        const modal = this.createModal('Add New Client', content, footer);
        document.body.appendChild(modal);
    },

    async submitAddClient() {
        const form = document.getElementById('addClientForm');
        if (!this.validateForm(form)) return;

        const data = this.getFormData(form);
        data.company = AppState.selectedCompany;

        try {
            if (AirtableAPI.isConfigured()) {
                await AirtableAPI.addClient(data);
                this.showToast('Client created successfully!', 'success');
            } else {
                AppState.data.clients.push({
                    id: Date.now().toString(),
                    ...data
                });
                this.showToast('Client created (demo mode)', 'success');
            }

            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            console.error('Error creating client:', error);
            this.showToast('Failed to create client. Please try again.', 'error');
        }
    },

    showEditClientForm(clientId) {
        const client = AppState.data.clients.find(c => c.id === clientId);
        if (!client) return;

        const users = AppState.data.users.filter(u => 
            u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany)
        );
        
        const content = `
            <form id="editClientForm">
                <div class="form-group">
                    <label class="form-label required">Client Name</label>
                    <input type="text" name="name" class="form-input" value="${client.name}" required>
                    <div class="form-error">Client name is required</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" name="email" class="form-input" value="${client.email || ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="tel" name="phone" class="form-input" value="${client.phone || ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Lead Type</label>
                    <input type="text" name="leadType" class="form-input" value="${client.leadType || ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Status</label>
                    <select name="status" class="form-select" required>
                        <option value="Active" ${client.status === 'Active' ? 'selected' : ''}>Active</option>
                        <option value="Inactive" ${client.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="On Hold" ${client.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
                        <option value="VIP" ${client.status === 'VIP' ? 'selected' : ''}>VIP</option>
                        <option value="Churned" ${client.status === 'Churned' ? 'selected' : ''}>Churned</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Priority</label>
                    <select name="priority" class="form-select">
                        <option value="">None</option>
                        <option value="High" ${client.priority === 'High' ? 'selected' : ''}>High</option>
                        <option value="Medium" ${client.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="Low" ${client.priority === 'Low' ? 'selected' : ''}>Low</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Assigned User</label>
                    <select name="assignedUser" class="form-select">
                        <option value="">Unassigned</option>
                        ${users.map(user => `
                            <option value="${user.id}" ${client.assignedUser === user.id ? 'selected' : ''}>
                                ${user.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-danger" onclick="CRUDManager.deleteClient('${clientId}')">Delete</button>
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitEditClient('${clientId}')">Update Client</button>
        `;

        const modal = this.createModal('Edit Client', content, footer);
        document.body.appendChild(modal);
    },

    async submitEditClient(clientId) {
        const form = document.getElementById('editClientForm');
        if (!this.validateForm(form)) return;

        const data = this.getFormData(form);

        try {
            if (AirtableAPI.isConfigured()) {
                await AirtableAPI.updateClient(clientId, data);
                this.showToast('Client updated successfully!', 'success');
            } else {
                const client = AppState.data.clients.find(c => c.id === clientId);
                Object.assign(client, data);
            }

            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            console.error('Error updating client:', error);
            this.showToast('Failed to update client. Please try again.', 'error');
        }
    },

    deleteClient(clientId) {
        this.showConfirmDialog(
            'Delete Client',
            'Are you sure you want to delete this client? This action cannot be undone.',
            async () => {
                try {
                    if (AirtableAPI.isConfigured()) {
                        await AirtableAPI.deleteClient(clientId);
                        this.showToast('Client deleted successfully!', 'success');
                    } else {
                        AppState.data.clients = AppState.data.clients.filter(c => c.id !== clientId);
                    }

                    await loadCompanyData(AppState.selectedCompany);
                    render();
                    document.querySelector('.modal-overlay')?.remove();
                } catch (error) {
                    console.error('Error deleting client:', error);
                    this.showToast('Failed to delete client. Please try again.', 'error');
                }
            }
        );
    },

    // ========================================
    // LEAD CRUD OPERATIONS
    // ========================================

    showAddLeadForm() {
        const users = AppState.data.users.filter(u => 
            u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany)
        );
        
        const content = `
            <form id="addLeadForm">
                <div class="form-group">
                    <label class="form-label required">Lead Name</label>
                    <input type="text" name="name" class="form-input" placeholder="Enter lead name" required>
                    <div class="form-error">Lead name is required</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea name="description" class="form-textarea" placeholder="Lead description"></textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Status</label>
                    <select name="status" class="form-select" required>
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Proposal Sent">Proposal Sent</option>
                        <option value="Won">Won</option>
                        <option value="Lost">Lost</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Priority</label>
                    <select name="priority" class="form-select">
                        <option value="">None</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Assigned User</label>
                    <select name="assignedUser" class="form-select">
                        <option value="">Unassigned</option>
                        ${users.map(user => `<option value="${user.id}">${user.name}</option>`).join('')}
                    </select>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitAddLead()">Create Lead</button>
        `;

        const modal = this.createModal('Add New Lead', content, footer);
        document.body.appendChild(modal);
    },

    async submitAddLead() {
        const form = document.getElementById('addLeadForm');
        if (!this.validateForm(form)) return;

        const data = this.getFormData(form);
        data.company = AppState.selectedCompany;

        try {
            if (AirtableAPI.isConfigured()) {
                await AirtableAPI.addLead(data);
                this.showToast('Lead created successfully!', 'success');
            } else {
                AppState.data.leads.push({
                    id: Date.now().toString(),
                    ...data
                });
            }

            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            console.error('Error creating lead:', error);
            this.showToast('Failed to create lead. Please try again.', 'error');
        }
    },

    showEditLeadForm(leadId) {
        const lead = AppState.data.leads.find(l => l.id === leadId);
        if (!lead) return;

        const users = AppState.data.users.filter(u => 
            u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany)
        );
        
        const content = `
            <form id="editLeadForm">
                <div class="form-group">
                    <label class="form-label required">Lead Name</label>
                    <input type="text" name="name" class="form-input" value="${lead.name}" required>
                    <div class="form-error">Lead name is required</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea name="description" class="form-textarea">${lead.description || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Status</label>
                    <select name="status" class="form-select" required>
                        <option value="New" ${lead.status === 'New' ? 'selected' : ''}>New</option>
                        <option value="Contacted" ${lead.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
                        <option value="Qualified" ${lead.status === 'Qualified' ? 'selected' : ''}>Qualified</option>
                        <option value="Proposal Sent" ${lead.status === 'Proposal Sent' ? 'selected' : ''}>Proposal Sent</option>
                        <option value="Won" ${lead.status === 'Won' ? 'selected' : ''}>Won</option>
                        <option value="Lost" ${lead.status === 'Lost' ? 'selected' : ''}>Lost</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Priority</label>
                    <select name="priority" class="form-select">
                        <option value="">None</option>
                        <option value="High" ${lead.priority === 'High' ? 'selected' : ''}>High</option>
                        <option value="Medium" ${lead.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="Low" ${lead.priority === 'Low' ? 'selected' : ''}>Low</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Assigned User</label>
                    <select name="assignedUser" class="form-select">
                        <option value="">Unassigned</option>
                        ${users.map(user => `
                            <option value="${user.id}" ${lead.assignedUser === user.id ? 'selected' : ''}>
                                ${user.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-danger" onclick="CRUDManager.deleteLead('${leadId}')">Delete</button>
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitEditLead('${leadId}')">Update Lead</button>
        `;

        const modal = this.createModal('Edit Lead', content, footer);
        document.body.appendChild(modal);
    },

    async submitEditLead(leadId) {
        const form = document.getElementById('editLeadForm');
        if (!this.validateForm(form)) return;

        const data = this.getFormData(form);

        try {
            if (AirtableAPI.isConfigured()) {
                await AirtableAPI.updateLead(leadId, data);
                this.showToast('Lead updated successfully!', 'success');
            } else {
                const lead = AppState.data.leads.find(l => l.id === leadId);
                Object.assign(lead, data);
            }

            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            console.error('Error updating lead:', error);
            this.showToast('Failed to update lead. Please try again.', 'error');
        }
    },

    deleteLead(leadId) {
        this.showConfirmDialog(
            'Delete Lead',
            'Are you sure you want to delete this lead? This action cannot be undone.',
            async () => {
                try {
                    if (AirtableAPI.isConfigured()) {
                        await AirtableAPI.deleteLead(leadId);
                        this.showToast('Lead deleted successfully!', 'success');
                    } else {
                        AppState.data.leads = AppState.data.leads.filter(l => l.id !== leadId);
                    }

                    await loadCompanyData(AppState.selectedCompany);
                    render();
                    document.querySelector('.modal-overlay')?.remove();
                } catch (error) {
                    console.error('Error deleting lead:', error);
                    this.showToast('Failed to delete lead. Please try again.', 'error');
                }
            }
        );
    },

    // ========================================
    // GENERAL TASK CRUD OPERATIONS
    // ========================================

    showAddTaskForm() {
        const users = AppState.data.users.filter(u => 
            u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany)
        );
        
        const content = `
            <form id="addTaskForm">
                <div class="form-group">
                    <label class="form-label required">Task Name</label>
                    <input type="text" name="name" class="form-input" placeholder="Enter task name" required>
                    <div class="form-error">Task name is required</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Due Date</label>
                    <input type="date" name="dueDate" class="form-input">
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Priority</label>
                    <select name="priority" class="form-select" required>
                        <option value="High">High</option>
                        <option value="Medium" selected>Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Status</label>
                    <select name="status" class="form-select" required>
                        <option value="Pending" selected>Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Assigned User</label>
                    <select name="assignedUser" class="form-select">
                        <option value="">Unassigned</option>
                        ${users.map(user => `<option value="${user.id}">${user.name}</option>`).join('')}
                    </select>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitAddTask()">Create Task</button>
        `;

        const modal = this.createModal('Add New Task', content, footer);
        document.body.appendChild(modal);
    },

    async submitAddTask() {
        const form = document.getElementById('addTaskForm');
        if (!this.validateForm(form)) return;

        const data = this.getFormData(form);
        data.company = AppState.selectedCompany;

        try {
            if (AirtableAPI.isConfigured()) {
                await AirtableAPI.addGeneralTodo(data);
                this.showToast('Task created successfully!', 'success');
            } else {
                AppState.data.generalTodos.push({
                    id: Date.now().toString(),
                    ...data
                });
            }

            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            console.error('Error creating task:', error);
            this.showToast('Failed to create task. Please try again.', 'error');
        }
    },

    showEditTaskForm(taskId) {
        const task = AppState.data.generalTodos.find(t => t.id === taskId);
        if (!task) return;

        const users = AppState.data.users.filter(u => 
            u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany)
        );
        
        const content = `
            <form id="editTaskForm">
                <div class="form-group">
                    <label class="form-label required">Task Name</label>
                    <input type="text" name="name" class="form-input" value="${task.name}" required>
                    <div class="form-error">Task name is required</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Due Date</label>
                    <input type="date" name="dueDate" class="form-input" value="${task.dueDate || ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Priority</label>
                    <select name="priority" class="form-select" required>
                        <option value="High" ${task.priority === 'High' ? 'selected' : ''}>High</option>
                        <option value="Medium" ${task.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="Low" ${task.priority === 'Low' ? 'selected' : ''}>Low</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Status</label>
                    <select name="status" class="form-select" required>
                        <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Assigned User</label>
                    <select name="assignedUser" class="form-select">
                        <option value="">Unassigned</option>
                        ${users.map(user => `
                            <option value="${user.id}" ${task.assignedUser === user.id ? 'selected' : ''}>
                                ${user.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-danger" onclick="CRUDManager.deleteTask('${taskId}')">Delete</button>
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitEditTask('${taskId}')">Update Task</button>
        `;

        const modal = this.createModal('Edit Task', content, footer);
        document.body.appendChild(modal);
    },

    async submitEditTask(taskId) {
        const form = document.getElementById('editTaskForm');
        if (!this.validateForm(form)) return;

        const data = this.getFormData(form);

        try {
            if (AirtableAPI.isConfigured()) {
                await AirtableAPI.updateGeneralTodo(taskId, data);
                this.showToast('Task updated successfully!', 'success');
            } else {
                const task = AppState.data.generalTodos.find(t => t.id === taskId);
                Object.assign(task, data);
            }

            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            console.error('Error updating task:', error);
            this.showToast('Failed to update task. Please try again.', 'error');
        }
    },

    deleteTask(taskId) {
        this.showConfirmDialog(
            'Delete Task',
            'Are you sure you want to delete this task? This action cannot be undone.',
            async () => {
                try {
                    if (AirtableAPI.isConfigured()) {
                        await AirtableAPI.deleteGeneralTodo(taskId);
                        this.showToast('Task deleted successfully!', 'success');
                    } else {
                        AppState.data.generalTodos = AppState.data.generalTodos.filter(t => t.id !== taskId);
                    }

                    await loadCompanyData(AppState.selectedCompany);
                    render();
                    document.querySelector('.modal-overlay')?.remove();
                } catch (error) {
                    console.error('Error deleting task:', error);
                    this.showToast('Failed to delete task. Please try again.', 'error');
                }
            }
        );
    },

    // ========================================
    // CLIENT TODO CRUD OPERATIONS
    // ========================================

    showAddClientTodoForm() {
        const users = AppState.data.users.filter(u => 
            u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany)
        );
        const clients = AppState.data.clients.filter(c => c.company === AppState.selectedCompany);
        
        const content = `
            <form id="addClientTodoForm">
                <div class="form-group">
                    <label class="form-label required">Task Name</label>
                    <input type="text" name="name" class="form-input" placeholder="Enter task name" required>
                    <div class="form-error">Task name is required</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Client</label>
                    <select name="client" class="form-select" required>
                        <option value="">Select Client</option>
                        ${clients.map(client => `<option value="${client.id}">${client.name}</option>`).join('')}
                    </select>
                    <div class="form-error">Client selection is required</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Due Date</label>
                    <input type="date" name="dueDate" class="form-input">
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Priority</label>
                    <select name="priority" class="form-select" required>
                        <option value="High">High</option>
                        <option value="Medium" selected>Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Status</label>
                    <select name="status" class="form-select" required>
                        <option value="Pending" selected>Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Assigned User</label>
                    <select name="assignedUser" class="form-select">
                        <option value="">Unassigned</option>
                        ${users.map(user => `<option value="${user.id}">${user.name}</option>`).join('')}
                    </select>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitAddClientTodo()">Create Task</button>
        `;

        const modal = this.createModal('Add New Client Task', content, footer);
        document.body.appendChild(modal);
    },

    async submitAddClientTodo() {
        const form = document.getElementById('addClientTodoForm');
        if (!this.validateForm(form)) return;

        const data = this.getFormData(form);
        data.company = AppState.selectedCompany;

        try {
            if (AirtableAPI.isConfigured()) {
                await AirtableAPI.addClientTodo(data);
                this.showToast('Client task created successfully!', 'success');
            } else {
                if (!AppState.data.clientTodos) AppState.data.clientTodos = [];
                AppState.data.clientTodos.push({
                    id: 'demo-ctodo-' + Date.now().toString(),
                    ...data
                });
                this.showToast('Client task created (Demo Mode)', 'success');
            }

            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
            
        } catch (error) {
            console.error('Error creating client task:', error);
            this.showToast('Failed to create client task: ' + error.message, 'error');
        }
    },

    showEditClientTodoForm(todoId) {
        const todo = AppState.data.clientTodos.find(t => t.id === todoId);
        if (!todo) {
            this.showToast('Client task not found', 'error');
            return;
        }

        const users = AppState.data.users.filter(u => 
            u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany)
        );
        const clients = AppState.data.clients.filter(c => c.company === AppState.selectedCompany);
        
        const content = `
            <form id="editClientTodoForm">
                <div class="form-group">
                    <label class="form-label required">Task Name</label>
                    <input type="text" name="name" class="form-input" value="${todo.name}" required>
                    <div class="form-error">Task name is required</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Client</label>
                    <select name="client" class="form-select" required>
                        ${clients.map(client => `
                            <option value="${client.id}" ${todo.client === client.id ? 'selected' : ''}>
                                ${client.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Due Date</label>
                    <input type="date" name="dueDate" class="form-input" value="${todo.dueDate || ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Priority</label>
                    <select name="priority" class="form-select" required>
                        <option value="High" ${todo.priority === 'High' ? 'selected' : ''}>High</option>
                        <option value="Medium" ${todo.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="Low" ${todo.priority === 'Low' ? 'selected' : ''}>Low</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Status</label>
                    <select name="status" class="form-select" required>
                        <option value="Pending" ${todo.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="In Progress" ${todo.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Completed" ${todo.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Assigned User</label>
                    <select name="assignedUser" class="form-select">
                        <option value="">Unassigned</option>
                        ${users.map(user => `
                            <option value="${user.id}" ${todo.assignedUser === user.id ? 'selected' : ''}>
                                ${user.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-danger" onclick="CRUDManager.deleteClientTodo('${todoId}')">Delete</button>
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitEditClientTodo('${todoId}')">Update Task</button>
        `;

        const modal = this.createModal('Edit Client Task', content, footer);
        document.body.appendChild(modal);
    },

    async submitEditClientTodo(todoId) {
        const form = document.getElementById('editClientTodoForm');
        if (!this.validateForm(form)) return;

        const data = this.getFormData(form);

        try {
            if (AirtableAPI.isConfigured()) {
                await AirtableAPI.updateClientTodo(todoId, data);
                this.showToast('Client task updated successfully!', 'success');
            } else {
                const todo = AppState.data.clientTodos.find(t => t.id === todoId);
                if (todo) {
                    Object.assign(todo, data);
                }
                this.showToast('Client task updated (Demo Mode)', 'success');
            }

            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
            
        } catch (error) {
            console.error('Error updating client task:', error);
            this.showToast('Failed to update client task: ' + error.message, 'error');
        }
    },

    deleteClientTodo(todoId) {
        this.showConfirmDialog(
            'Delete Client Task',
            'Are you sure you want to delete this client task? This action cannot be undone.',
            async () => {
                try {
                    if (AirtableAPI.isConfigured()) {
                        await AirtableAPI.deleteClientTodo(todoId);
                        this.showToast('Client task deleted successfully!', 'success');
                    } else {
                        AppState.data.clientTodos = AppState.data.clientTodos.filter(t => t.id !== todoId);
                        this.showToast('Client task deleted (Demo Mode)', 'success');
                    }

                    await loadCompanyData(AppState.selectedCompany);
                    render();
                    document.querySelector('.modal-overlay')?.remove();
                    
                } catch (error) {
                    console.error('Error deleting client task:', error);
                    this.showToast('Failed to delete client task: ' + error.message, 'error');
                }
            }
        );
    }
};

console.log('✅ CRUD Manager loaded - All operations ready');