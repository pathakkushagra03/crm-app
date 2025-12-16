function sanitizeInput(str) {
  return str.replace(/[<>&"'`]/g, "");
}
// ========================================
// CRUD OPERATIONS & MODAL MANAGEMENT
// Complete CRUD.js file - Replace your js/crud.js with this
// ========================================

const CRUDManager = {
    
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

    showConfirmDialog(title, message, onConfirm) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="confirm-dialog">
                <div class="confirm-icon">⚠️</div>
                <h3 class="confirm-title">${title}</h3>
                <p class="confirm-message">${message}</p>
                <div class="confirm-actions">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button class="btn btn-danger" id="confirmBtn">Confirm</button>
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

    createModal(title, content, footer) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">${title}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">${content}</div>
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

    getFormData(formElement) {
        const formData = new FormData(formElement);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = sanitizeInput(value);
        }
        return data;
    },

    handlePhotoUpload(previewId, dataId, inputElement) {
        const file = inputElement.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showToast('❌ Please select an image file', 'error');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            this.showToast('❌ Image must be smaller than 2MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            
            const preview = document.getElementById(previewId);
            if (preview) {
                preview.innerHTML = `<img src="${dataUrl}" alt="Preview" class="w-full h-full object-cover">`;
            }
            
            const dataInput = document.getElementById(dataId);
            if (dataInput) {
                dataInput.value = dataUrl;
            }
            
            this.showToast('✅ Photo uploaded successfully', 'success');
        };
        
        reader.onerror = () => {
            this.showToast('❌ Failed to read image file', 'error');
        };
        
        reader.readAsDataURL(file);
    },

    removePhoto(previewId, dataId) {
        const preview = document.getElementById(previewId);
        const dataInput = document.getElementById(dataId);
        
        if (preview) {
            if (previewId.includes('company')) {
                preview.innerHTML = '<span class="text-6xl">🏢</span>';
            } else {
                preview.innerHTML = '<span class="text-6xl">👤</span>';
            }
        }
        
        if (dataInput) {
            dataInput.value = '';
        }
        
        this.showToast('✅ Photo removed', 'success');
    },

    // COMPANY OPERATIONS
    showAddCompanyForm() {
        const content = `
            <form id="addCompanyForm">
                <div class="form-group">
                    <label class="form-label">Company Logo</label>
                    <div class="mb-3">
                        <div id="companyPhotoPreview" class="w-32 h-32 mx-auto mb-3 rounded-full overflow-hidden bg-white bg-opacity-10 flex items-center justify-center">
                            <span class="text-6xl">🏢</span>
                        </div>
                        <input type="file" id="companyPhotoInput" accept="image/*" class="form-input"
                               onchange="CRUDManager.handlePhotoUpload('companyPhotoPreview', 'companyPhotoData', this)">
                        <input type="hidden" id="companyPhotoData" name="photo">
                    </div>
                </div>
                
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
                const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7B731'];
                newCompany = {
                    id: 'demo-' + Date.now().toString(),
                    name: data.name,
                    photo: data.photo || '',
                    color: colors[Math.floor(Math.random() * colors.length)]
                };
                this.showToast('Company created (Demo)', 'success');
            }
            
            AppState.data.companies.push(newCompany);
            document.querySelector('.modal-overlay').remove();
            render();
            
        } catch (error) {
            console.error('Error creating company:', error);
            this.showToast('Failed to create company', 'error');
        }
    },

    showEditCompanyForm(companyId) {
        const company = AppState.data.companies.find(c => c.id === companyId);
        if (!company) return this.showToast('Company not found', 'error');

        const content = `
            <form id="editCompanyForm">
                <div class="form-group">
                    <label class="form-label">Company Logo</label>
                    <div class="mb-3">
                        <div id="companyPhotoPreview" class="w-32 h-32 mx-auto mb-3 rounded-full overflow-hidden bg-white bg-opacity-10 flex items-center justify-center">
                            ${company.photo ? `<img src="${company.photo}" alt="${company.name}" class="w-full h-full object-cover">` : '<span class="text-6xl">🏢</span>'}
                        </div>
                        <input type="file" id="companyPhotoInput" accept="image/*" class="form-input"
                               onchange="CRUDManager.handlePhotoUpload('companyPhotoPreview', 'companyPhotoData', this)">
                        <input type="hidden" id="companyPhotoData" name="photo" value="${company.photo || ''}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Company Name</label>
                    <input type="text" name="name" class="form-input" value="${company.name}" required>
                    <div class="form-error">Company name is required</div>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-danger" onclick="CRUDManager.deleteCompany('${companyId}')">Delete</button>
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitEditCompany('${companyId}')">Update</button>
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
            } else {
                const company = AppState.data.companies.find(c => c.id === companyId);
                if (company) {
                    company.name = data.name;
                    company.photo = data.photo;
                }
            }
            this.showToast('Company updated!', 'success');
            await loadCompanies();
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            this.showToast('Failed to update company', 'error');
        }
    },

    deleteCompany(companyId) {
        this.showConfirmDialog('Delete Company', 'Are you sure?', async () => {
            try {
                if (AirtableAPI.isConfigured()) {
                    await AirtableAPI.deleteCompany(companyId);
                } else {
                    AppState.data.companies = AppState.data.companies.filter(c => c.id !== companyId);
                }
                this.showToast('Company deleted!', 'success');
                await loadCompanies();
                render();
                document.querySelector('.modal-overlay')?.remove();
            } catch (error) {
                this.showToast('Failed to delete', 'error');
            }
        });
    },

    // USER OPERATIONS
    showAddUserForm() {
        const companies = AppState.data.companies;
        
        const content = `
            <form id="addUserForm">
                <div class="form-group">
                    <label class="form-label required">User Name</label>
                    <input type="text" name="name" class="form-input" required>
                    <div class="form-error">User name is required</div>
                </div>
                <div class="form-group">
                    <label class="form-label required">Email</label>
                    <input type="email" name="email" class="form-input" required>
                    <div class="form-error">Valid email is required</div>
                </div>
                <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="tel" name="phone" class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label required">Password</label>
                    <input type="password" name="password" class="form-input" required>
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
                        ${companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
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
            } else {
                AppState.data.users.push({
                    id: Date.now().toString(),
                    ...data,
                    companies: [data.companies]
                });
            }
            this.showToast('User created!', 'success');
            if (AppState.selectedCompany) await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            this.showToast('Failed to create user', 'error');
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
                    <label class="form-label required">Name</label>
                    <input type="text" name="name" class="form-input" value="${user.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label required">Email</label>
                    <input type="email" name="email" class="form-input" value="${user.email}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="tel" name="phone" class="form-input" value="${user.phone || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Password (leave blank to keep current)</label>
                    <input type="password" name="password" class="form-input">
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
                        ${companies.map(c => `<option value="${c.id}" ${userCompany === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-danger" onclick="CRUDManager.deleteUser('${userId}')">Delete</button>
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitEditUser('${userId}')">Update</button>
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
            } else {
                const user = AppState.data.users.find(u => u.id === userId);
                Object.assign(user, data);
                if (data.companies) user.companies = [data.companies];
            }
            this.showToast('User updated!', 'success');
            if (AppState.selectedCompany) await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            this.showToast('Failed to update', 'error');
        }
    },

    deleteUser(userId) {
        this.showConfirmDialog('Delete User', 'Are you sure?', async () => {
            try {
                if (AirtableAPI.isConfigured()) {
                    await AirtableAPI.deleteUser(userId);
                } else {
                    AppState.data.users = AppState.data.users.filter(u => u.id !== userId);
                }
                this.showToast('User deleted!', 'success');
                if (AppState.selectedCompany) await loadCompanyData(AppState.selectedCompany);
                render();
                document.querySelector('.modal-overlay')?.remove();
            } catch (error) {
                this.showToast('Failed to delete', 'error');
            }
        });
    },

    // CLIENT OPERATIONS
    showAddClientForm() {
        const users = AppState.data.users.filter(u => 
            u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany)
        );
        
        const content = `
            <form id="addClientForm">
                <div class="form-group">
                    <label class="form-label required">Client Name</label>
                    <input type="text" name="name" class="form-input" required>
                    <div class="form-error">Client name is required</div>
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" name="email" class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="tel" name="phone" class="form-input">
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
                        <option value="">Select Priority</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Deal Value ($)</label>
                    <input type="number" name="dealValue" class="form-input" min="0">
                </div>
                <div class="form-group">
                    <label class="form-label">Rating (1-5)</label>
                    <input type="number" name="rating" class="form-input" min="0" max="5">
                </div>
                <div class="form-group">
                    <label class="form-label">Assigned User</label>
                    <select name="assignedUser" class="form-select">
                        <option value="">Not Assigned</option>
                        ${users.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
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
            } else {
                AppState.data.clients.push({id: Date.now().toString(), ...data});
            }
            this.showToast('Client created!', 'success');
            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            this.showToast('Failed to create client', 'error');
        }
    },

    showEditClientForm(clientId) {
        const client = AppState.data.clients.find(c => c.id === clientId);
        if (!client) return this.showToast('Client not found', 'error');
        const users = AppState.data.users.filter(u => u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany));
        
        const content = `
            <form id="editClientForm">
                <div class="form-group">
                    <label class="form-label required">Name</label>
                    <input type="text" name="name" class="form-input" value="${client.name}" required>
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
                        <option value="">Select</option>
                        <option value="High" ${client.priority === 'High' ? 'selected' : ''}>High</option>
                        <option value="Medium" ${client.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="Low" ${client.priority === 'Low' ? 'selected' : ''}>Low</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Deal Value</label>
                    <input type="number" name="dealValue" class="form-input" value="${client.dealValue || 0}" min="0">
                </div>
                <div class="form-group">
                    <label class="form-label">Rating</label>
                    <input type="number" name="rating" class="form-input" value="${client.rating || 0}" min="0" max="5">
                </div>
                <div class="form-group">
                    <label class="form-label">Assigned User</label>
                    <select name="assignedUser" class="form-select">
                        <option value="">Not Assigned</option>
                        ${users.map(u => `<option value="${u.id}" ${client.assignedUser === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}
                    </select>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-danger" onclick="CRUDManager.deleteClient('${clientId}')">Delete</button>
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitEditClient('${clientId}')">Update</button>
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
            } else {
                const client = AppState.data.clients.find(c => c.id === clientId);
                Object.assign(client, data);
            }
            this.showToast('Client updated!', 'success');
            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            this.showToast('Failed to update', 'error');
        }
    },

    deleteClient(clientId) {
        this.showConfirmDialog('Delete Client', 'Are you sure?', async () => {
            try {
                if (AirtableAPI.isConfigured()) {
                    await AirtableAPI.deleteClient(clientId);
                } else {
                    AppState.data.clients = AppState.data.clients.filter(c => c.id !== clientId);
                }
                this.showToast('Client deleted!', 'success');
                await loadCompanyData(AppState.selectedCompany);
                render();
                document.querySelector('.modal-overlay')?.remove();
            } catch (error) {
                this.showToast('Failed to delete', 'error');
            }
        });
    },

    // LEAD OPERATIONS
    showAddLeadForm() {
        const users = AppState.data.users.filter(u => u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany));
        
        const content = `
            <form id="addLeadForm">
                <div class="form-group">
                    <label class="form-label required">Lead Name</label>
                    <input type="text" name="name" class="form-input" required>
                    <div class="form-error">Lead name is required</div>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea name="description" class="form-textarea"></textarea>
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
                        <option value="">Select</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Source</label>
                    <input type="text" name="source" class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label">Due Date</label>
                    <input type="date" name="dueDate" class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label">Assigned User</label>
                    <select name="assignedUser" class="form-select">
                        <option value="">Not Assigned</option>
                        ${users.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
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
            } else {
                AppState.data.leads.push({id: Date.now().toString(), ...data});
            }
            this.showToast('Lead created!', 'success');
            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            this.showToast('Failed to create lead', 'error');
        }
    },

    showEditLeadForm(leadId) {
        const lead = AppState.data.leads.find(l => l.id === leadId);
        if (!lead) return this.showToast('Lead not found', 'error');
        const users = AppState.data.users.filter(u => u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany));
        
        const content = `
            <form id="editLeadForm">
                <div class="form-group">
                    <label class="form-label required">Name</label>
                    <input type="text" name="name" class="form-input" value="${lead.name}" required>
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
                        <option value="">Select</option>
                        <option value="High" ${lead.priority === 'High' ? 'selected' : ''}>High</option>
                        <option value="Medium" ${lead.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="Low" ${lead.priority === 'Low' ? 'selected' : ''}>Low</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Source</label>
                    <input type="text" name="source" class="form-input" value="${lead.source || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Due Date</label>
                    <input type="date" name="dueDate" class="form-input" value="${lead.dueDate || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Assigned User</label>
                    <select name="assignedUser" class="form-select">
                        <option value="">Not Assigned</option>
                        ${users.map(u => `<option value="${u.id}" ${lead.assignedUser === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}
                    </select>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-danger" onclick="CRUDManager.deleteLead('${leadId}')">Delete</button>
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitEditLead('${leadId}')">Update</button>
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
            } else {
                const lead = AppState.data.leads.find(l => l.id === leadId);
                Object.assign(lead, data);
            }
            this.showToast('Lead updated!', 'success');
            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            this.showToast('Failed to update', 'error');
        }
    },

    deleteLead(leadId) {
        this.showConfirmDialog('Delete Lead', 'Are you sure?', async () => {
            try {
                if (AirtableAPI.isConfigured()) {
                    await AirtableAPI.deleteLead(leadId);
                } else {
                    AppState.data.leads = AppState.data.leads.filter(l => l.id !== leadId);
                }
                this.showToast('Lead deleted!', 'success');
                await loadCompanyData(AppState.selectedCompany);
                render();
                document.querySelector('.modal-overlay')?.remove();
            } catch (error) {
                this.showToast('Failed to delete', 'error');
            }
        });
    },

    // TASK OPERATIONS
    showAddTaskForm() {
        const users = AppState.data.users.filter(u => u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany));
        
        const content = `
            <form id="addTaskForm">
                <div class="form-group">
                    <label class="form-label required">Task Name</label>
                    <input type="text" name="name" class="form-input" required>
                    <div class="form-error">Task name is required</div>
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
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Due Date</label>
                    <input type="date" name="dueDate" class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label">Assigned User</label>
                    <select name="assignedUser" class="form-select">
                        <option value="">Not Assigned</option>
                        ${users.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
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
            } else {
                AppState.data.generalTodos.push({id: Date.now().toString(), ...data});
            }
            this.showToast('Task created!', 'success');
            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            this.showToast('Failed to create task', 'error');
        }
    },

    showEditTaskForm(taskId) {
        const task = AppState.data.generalTodos.find(t => t.id === taskId);
        if (!task) return this.showToast('Task not found', 'error');
        const users = AppState.data.users.filter(u => u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany));
        
        const content = `
            <form id="editTaskForm">
                <div class="form-group">
                    <label class="form-label required">Name</label>
                    <input type="text" name="name" class="form-input" value="${task.name}" required>
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
                    <label class="form-label">Due Date</label>
                    <input type="date" name="dueDate" class="form-input" value="${task.dueDate || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Assigned User</label>
                    <select name="assignedUser" class="form-select">
                        <option value="">Not Assigned</option>
                        ${users.map(u => `<option value="${u.id}" ${task.assignedUser === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}
                    </select>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-danger" onclick="CRUDManager.deleteTask('${taskId}')">Delete</button>
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitEditTask('${taskId}')">Update</button>
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
            } else {
                const task = AppState.data.generalTodos.find(t => t.id === taskId);
                Object.assign(task, data);
            }
            this.showToast('Task updated!', 'success');
            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            this.showToast('Failed to update', 'error');
        }
    },

    deleteTask(taskId) {
        this.showConfirmDialog('Delete Task', 'Are you sure?', async () => {
            try {
                if (AirtableAPI.isConfigured()) {
                    await AirtableAPI.deleteGeneralTodo(taskId);
                } else {
                    AppState.data.generalTodos = AppState.data.generalTodos.filter(t => t.id !== taskId);
                }
                this.showToast('Task deleted!', 'success');
                await loadCompanyData(AppState.selectedCompany);
                render();
                document.querySelector('.modal-overlay')?.remove();
            } catch (error) {
                this.showToast('Failed to delete', 'error');
            }
        });
    }
};

console.log('✅ Complete CRUD Manager loaded - All operations ready');