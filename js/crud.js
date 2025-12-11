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
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${type === 'success' ? '✅' : '⚠️'}</div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        container.appendChild(toast);

        // Auto-remove after 4 seconds
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

        // Handle confirm
        overlay.querySelector('#confirmBtn').addEventListener('click', () => {
            overlay.remove();
            onConfirm();
        });

        // Close on overlay click
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

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });

        // Close on ESC key
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

    /**
     * Show add company form
     */
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

    /**
     * Submit add company form
     */
    async submitAddCompany() {
        const form = document.getElementById('addCompanyForm');
        if (!this.validateForm(form)) return;

        const data = this.getFormData(form);
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7B731'];
        data.color = colors[Math.floor(Math.random() * colors.length)];

        try {
            if (AirtableAPI.isConfigured()) {
                await AirtableAPI.createCompany(data.name);
                this.showToast('Company created successfully!', 'success');
            } else {
                // Demo mode: add to local state
                AppState.data.companies.push({
                    id: Date.now().toString(),
                    ...data
                });
            }

            // Reload companies
            await loadCompanies();
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            console.error('Error creating company:', error);
            this.showToast('Failed to create company. Please try again.', 'error');
        }
    },

    /**
     * Show edit company form
     */
    showEditCompanyForm(companyId) {
        const company = AppState.data.companies.find(c => c.id === companyId);
        if (!company) return;

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

    /**
     * Submit edit company form
     */
    async submitEditCompany(companyId) {
        const form = document.getElementById('editCompanyForm');
        if (!this.validateForm(form)) return;

        const data = this.getFormData(form);

        try {
            if (AirtableAPI.isConfigured()) {
                await AirtableAPI.updateCompany(companyId, data.name);
                this.showToast('Company updated successfully!', 'success');
            } else {
                // Demo mode: update local state
                const company = AppState.data.companies.find(c => c.id === companyId);
                company.name = data.name;
            }

            // Reload companies
            await loadCompanies();
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            console.error('Error updating company:', error);
            this.showToast('Failed to update company. Please try again.', 'error');
        }
    },

    /**
     * Delete company
     */
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
                        // Demo mode: remove from local state
                        AppState.data.companies = AppState.data.companies.filter(c => c.id !== companyId);
                        // Also remove related data
                        AppState.data.users = AppState.data.users.filter(u => u.company !== companyId);
                        AppState.data.clients = AppState.data.clients.filter(c => c.company !== companyId);
                        AppState.data.leads = AppState.data.leads.filter(l => l.company !== companyId);
                        AppState.data.tasks = AppState.data.tasks.filter(t => t.company !== companyId);
                    }

                    // Reload companies
                    await loadCompanies();
                    render();
                    document.querySelector('.modal-overlay')?.remove();
                } catch (error) {
                    console.error('Error deleting company:', error);
                    this.showToast('Failed to delete company. Please try again.', 'error');
                }
            }
        );
    },

    // ========================================
    // CLIENT CRUD OPERATIONS
    // ========================================

    /**
     * Show add client form
     */
    showAddClientForm() {
        const users = AppState.data.users.filter(u => u.company === AppState.selectedCompany);
        
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
                        <option value="Pending">Pending</option>
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

    /**
     * Submit add client form
     */
    async submitAddClient() {
        const form = document.getElementById('addClientForm');
        if (!this.validateForm(form)) return;

        const data = this.getFormData(form);
        data.company = AppState.selectedCompany;

        try {
            if (AirtableAPI.isConfigured()) {
                await AirtableAPI.createClient(data);
                this.showToast('Client created successfully!', 'success');
            } else {
                // Demo mode: add to local state
                AppState.data.clients.push({
                    id: Date.now().toString(),
                    ...data
                });
            }

            // Reload data and refresh view
            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            console.error('Error creating client:', error);
            this.showToast('Failed to create client. Please try again.', 'error');
        }
    },

    /**
     * Show edit client form
     */
    showEditClientForm(clientId) {
        const client = AppState.data.clients.find(c => c.id === clientId);
        if (!client) return;

        const users = AppState.data.users.filter(u => u.company === AppState.selectedCompany);
        
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
                        <option value="Pending" ${client.status === 'Pending' ? 'selected' : ''}>Pending</option>
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

    /**
     * Submit edit client form
     */
    async submitEditClient(clientId) {
        const form = document.getElementById('editClientForm');
        if (!this.validateForm(form)) return;

        const data = this.getFormData(form);

        try {
            if (AirtableAPI.isConfigured()) {
                await AirtableAPI.updateClient(clientId, data);
                this.showToast('Client updated successfully!', 'success');
            } else {
                // Demo mode: update local state
                const client = AppState.data.clients.find(c => c.id === clientId);
                Object.assign(client, data);
            }

            // Reload data and refresh view
            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            console.error('Error updating client:', error);
            this.showToast('Failed to update client. Please try again.', 'error');
        }
    },

    /**
     * Delete client
     */
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
                        // Demo mode: remove from local state
                        AppState.data.clients = AppState.data.clients.filter(c => c.id !== clientId);
                    }

                    // Reload data and refresh view
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
        const users = AppState.data.users.filter(u => u.company === AppState.selectedCompany);
        
        const content = `
            <form id="addLeadForm">
                <div class="form-group">
                    <label class="form-label required">Lead Name</label>
                    <input type="text" name="name" class="form-input" placeholder="Enter lead name" required>
                    <div class="form-error">Lead name is required</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Status</label>
                    <select name="status" class="form-select" required>
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Lost">Lost</option>
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
                await AirtableAPI.createLead(data);
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

    /**
     * Show edit lead form
     */
    showEditLeadForm(leadId) {
        const lead = AppState.data.leads.find(l => l.id === leadId);
        if (!lead) return;

        const users = AppState.data.users.filter(u => u.company === AppState.selectedCompany);
        
        const content = `
            <form id="editLeadForm">
                <div class="form-group">
                    <label class="form-label required">Lead Name</label>
                    <input type="text" name="name" class="form-input" value="${lead.name}" required>
                    <div class="form-error">Lead name is required</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Status</label>
                    <select name="status" class="form-select" required>
                        <option value="New" ${lead.status === 'New' ? 'selected' : ''}>New</option>
                        <option value="Contacted" ${lead.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
                        <option value="Qualified" ${lead.status === 'Qualified' ? 'selected' : ''}>Qualified</option>
                        <option value="Lost" ${lead.status === 'Lost' ? 'selected' : ''}>Lost</option>
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

    /**
     * Submit edit lead form
     */
    async submitEditLead(leadId) {
        const form = document.getElementById('editLeadForm');
        if (!this.validateForm(form)) return;

        const data = this.getFormData(form);

        try {
            if (AirtableAPI.isConfigured()) {
                await AirtableAPI.updateLead(leadId, data);
                this.showToast('Lead updated successfully!', 'success');
            } else {
                // Demo mode: update local state
                const lead = AppState.data.leads.find(l => l.id === leadId);
                Object.assign(lead, data);
            }

            // Reload data and refresh view
            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            console.error('Error updating lead:', error);
            this.showToast('Failed to update lead. Please try again.', 'error');
        }
    },

    /**
     * Delete lead
     */
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
                        // Demo mode: remove from local state
                        AppState.data.leads = AppState.data.leads.filter(l => l.id !== leadId);
                    }

                    // Reload data and refresh view
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
    // TASK CRUD OPERATIONS
    // ========================================

    showAddTaskForm() {
        const users = AppState.data.users.filter(u => u.company === AppState.selectedCompany);
        
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
                await AirtableAPI.createTask(data);
                this.showToast('Task created successfully!', 'success');
            } else {
                AppState.data.tasks.push({
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
    }
};

console.log('✅ CRUD Manager loaded');
