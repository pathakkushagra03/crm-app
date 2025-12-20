function sanitizeInput(str) {
  return str.replace(/[<>&"'`]/g, "");
}

function shouldSkipSanitization(fieldName) {
  // Don't sanitize base64 photo data
  return fieldName === 'photo' || fieldName.includes('Photo');
}

// ========================================
// CRUD OPERATIONS & MODAL MANAGEMENT
// ========================================

// ========================================
// CRUD PERMISSION VALIDATORS
// ========================================

/**
 * Validate if user can perform CRUD operation
 */
function validateCRUDPermission(resource, operation, record = null) {
    if (!AuthManager || !AuthManager.currentUser) {
        return { 
            allowed: false, 
            reason: 'Not authenticated. Please log in.' 
        };
    }
    
    const hasPermission = AuthManager.hasDetailedPermission(resource, operation);
    
    if (!hasPermission) {
        return { 
            allowed: false, 
            reason: `Your role (${AuthManager.currentUser.role}) cannot ${operation} ${resource}.` 
        };
    }
    
    if ((operation === 'update' || operation === 'delete') && record) {
        const canEdit = AuthManager.canEditRecord(resource, record);
        
        if (!canEdit) {
            return {
                allowed: false,
                reason: `You can only ${operation} ${resource} assigned to you.`
            };
        }
    }
    
    if (operation === 'delete') {
        const canDelete = AuthManager.canDeleteRecord(resource, record);
        
        if (!canDelete) {
            return {
                allowed: false,
                reason: 'Only Admins can delete records. Contact your administrator.'
            };
        }
    }
    
    return { allowed: true, reason: '' };
}

/**
 * Show permission error with consistent formatting
 */
function showPermissionError(operation, reason) {
    if (typeof CRUDManager !== 'undefined') {
        CRUDManager.showToast(`❌ ${operation} blocked: ${reason}`, 'error');
    } else {
        alert(`${operation} blocked: ${reason}`);
    }
    
    console.warn(`CRUD Permission Denied: ${operation} - ${reason}`);
}

/**
 * Pre-flight check before showing form
 */
function canShowForm(resource, operation) {
    const validation = validateCRUDPermission(resource, operation);
    
    if (!validation.allowed) {
        showPermissionError(`${operation} ${resource}`, validation.reason);
        return false;
    }
    
    return true;
}

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
            const errorElement = group?.querySelector('.form-error');
            
            if (!input.value.trim()) {
                group?.classList.add('error');
                if (errorElement) {
                    errorElement.textContent = 'This field is required';
                }
                isValid = false;
            } 
            else if (input.type === 'email' && !this.isValidEmail(input.value)) {
                group?.classList.add('error');
                if (errorElement) {
                    errorElement.textContent = 'Please enter a valid email';
                }
                isValid = false;
            } 
            else if (input.type === 'tel' && input.value && !this.isValidPhone(input.value)) {
                group?.classList.add('error');
                if (errorElement) {
                    errorElement.textContent = 'Please enter a valid phone number';
                }
                isValid = false;
            } 
            else {
                group?.classList.remove('error');
            }
        });
        
        if (!isValid && typeof ToastManager !== 'undefined') {
            ToastManager.warning('Please fix the errors in the form');
        }

        return isValid;
    },

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    isValidPhone(phone) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    },

    getFormData(formElement) {
        const formData = new FormData(formElement);
        const data = {};
        for (let [key, value] of formData.entries()) {
            // Skip sanitization for photo fields (they contain base64 data)
            if (shouldSkipSanitization(key)) {
                data[key] = value;
            } else {
                data[key] = sanitizeInput(value);
            }
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

    // ========================================
    // COMPANY OPERATIONS
    // ========================================
    
    showAddCompanyForm() {
        if (!canShowForm('companies', 'create')) {
            return;
        }
        
        const content = `
            <form id="addCompanyForm">
                <div class="form-group">
                    <label class="form-label required">Company Name</label>
                    <input type="text" name="name" class="form-input" placeholder="Enter company name" required>
                    <div class="form-error">Company name is required</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Industry</label>
                    <select name="industry" class="form-select">
                        <option value="">Select Industry</option>
                        <option value="Technology">Technology</option>
                        <option value="Finance">Finance</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Retail">Retail</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Education">Education</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Location</label>
                    <input type="text" name="location" class="form-input" placeholder="City, State/Country">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea name="notes" class="form-textarea" rows="3" placeholder="Additional information about this company..."></textarea>
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
        const validation = validateCRUDPermission('companies', 'create');
        if (!validation.allowed) {
            showPermissionError('Create company', validation.reason);
            return;
        }
        
        const form = document.getElementById('addCompanyForm');
        if (!this.validateForm(form)) return;

        const data = this.getFormData(form);

        try {
            let newCompany = null;
            
            // Try Airtable if configured
            if (AirtableAPI.isConfigured()) {
                try {
                    newCompany = await AirtableAPI.addCompany(data);
                    this.showToast('✅ Company created successfully!', 'success');
                } catch (airtableError) {
                    console.warn('⚠️ Airtable failed, falling back to demo mode:', airtableError);
                    
                    // Fall back to demo mode
                    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7B731'];
                    newCompany = {
                        id: 'demo-' + Date.now().toString(),
                        name: data.name,
                        industry: data.industry || '',
                        location: data.location || '',
                        notes: data.notes || '',
                        clients: [],
                        color: colors[Math.floor(Math.random() * colors.length)]
                    };
                    
                    this.showToast('⚠️ Company created in demo mode (Airtable unavailable)', 'success');
                }
            } else {
                // Pure demo mode
                const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7B731'];
                newCompany = {
                    id: 'demo-' + Date.now().toString(),
                    name: data.name,
                    industry: data.industry || '',
                    location: data.location || '',
                    notes: data.notes || '',
                    clients: [],
                    color: colors[Math.floor(Math.random() * colors.length)]
                };
                this.showToast('✅ Company created (Demo Mode)', 'success');
            }
            
            AppState.data.companies.push(newCompany);
            
            if (AuthManager) {
                AuthManager.logActivity('create', `Created company: ${data.name}`);
            }
            
            document.querySelector('.modal-overlay').remove();
            render();
            
        } catch (error) {
            console.error('Error creating company:', error);
            this.showToast('❌ Failed to create company', 'error');
        }
    },

    showEditCompanyForm(companyId) {
        const company = AppState.data.companies.find(c => c.id === companyId);
        if (!company) return this.showToast('❌ Company not found', 'error');

        const validation = validateCRUDPermission('companies', 'update', company);
        if (!validation.allowed) {
            showPermissionError('Edit company', validation.reason);
            return;
        }

        const content = `
            <form id="editCompanyForm">
                <div class="form-group">
                    <label class="form-label required">Company Name</label>
                    <input type="text" name="name" class="form-input" value="${company.name}" required>
                    <div class="form-error">Company name is required</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Industry</label>
                    <select name="industry" class="form-select">
                        <option value="">Select Industry</option>
                        <option value="Technology" ${company.industry === 'Technology' ? 'selected' : ''}>Technology</option>
                        <option value="Finance" ${company.industry === 'Finance' ? 'selected' : ''}>Finance</option>
                        <option value="Healthcare" ${company.industry === 'Healthcare' ? 'selected' : ''}>Healthcare</option>
                        <option value="Retail" ${company.industry === 'Retail' ? 'selected' : ''}>Retail</option>
                        <option value="Manufacturing" ${company.industry === 'Manufacturing' ? 'selected' : ''}>Manufacturing</option>
                        <option value="Education" ${company.industry === 'Education' ? 'selected' : ''}>Education</option>
                        <option value="Real Estate" ${company.industry === 'Real Estate' ? 'selected' : ''}>Real Estate</option>
                        <option value="Consulting" ${company.industry === 'Consulting' ? 'selected' : ''}>Consulting</option>
                        <option value="Other" ${company.industry === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Location</label>
                    <input type="text" name="location" class="form-input" value="${company.location || ''}" placeholder="City, State/Country">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea name="notes" class="form-textarea" rows="3" placeholder="Additional information...">${company.notes || ''}</textarea>
                </div>
            </form>
        `;

        const canDelete = typeof can !== 'undefined' && can(AppState.currentUser.role, 'companies', 'manage');

        const footer = `
            ${canDelete ? `<button class="btn btn-danger" onclick="CRUDManager.deleteCompany('${companyId}')">Delete</button>` : ''}
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitEditCompany('${companyId}')">Update</button>
        `;

        const modal = this.createModal('Edit Company', content, footer);
        document.body.appendChild(modal);
    },

    async submitEditCompany(companyId) {
        const company = AppState.data.companies.find(c => c.id === companyId);
        if (!company) return;
        
        const validation = validateCRUDPermission('companies', 'update', company);
        if (!validation.allowed) {
            showPermissionError('Update company', validation.reason);
            return;
        }
        
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
                    company.industry = data.industry;
                    company.location = data.location;
                    company.notes = data.notes;
                }
            }
            
            if (AuthManager) {
                AuthManager.logActivity('update', `Updated company: ${data.name}`);
            }
            
            this.showToast('✅ Company updated!', 'success');
            await loadCompanies();
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            this.showToast('❌ Failed to update company', 'error');
        }
    },

    deleteCompany(companyId) {
        const company = AppState.data.companies.find(c => c.id === companyId);
        if (!company) return;
        
        const validation = validateCRUDPermission('companies', 'delete', company);
        if (!validation.allowed) {
            showPermissionError('Delete company', validation.reason);
            return;
        }
        
        this.showConfirmDialog(
            '🗑️ Delete Company', 
            `Are you sure you want to delete "${company.name}"? This action cannot be undone.`, 
            async () => {
                try {
                    if (AirtableAPI.isConfigured()) {
                        await AirtableAPI.deleteCompany(companyId);
                    } else {
                        AppState.data.companies = AppState.data.companies.filter(c => c.id !== companyId);
                    }
                    
                    if (AuthManager) {
                        AuthManager.logActivity('delete', `Deleted company: ${company.name}`);
                    }
                    
                    this.showToast('✅ Company deleted!', 'success');
                    await loadCompanies();
                    render();
                    document.querySelector('.modal-overlay')?.remove();
                } catch (error) {
                    this.showToast('❌ Failed to delete', 'error');
                }
            }
        );
    },

    // ========================================
    // USER OPERATIONS
    // ========================================
    
    showAddUserForm() {
        if (!canShowForm('users', 'create')) return;
        
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
                    <label class="form-label">Phone Number</label>
                    <input type="tel" name="phoneNumber" class="form-input" placeholder="+1 (555) 000-0000">
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
                    <label class="form-label required">Status</label>
                    <select name="status" class="form-select" required>
                        <option value="Active" selected>Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Suspended">Suspended</option>
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
                    <label class="form-label">Phone Number</label>
                    <input type="tel" name="phoneNumber" class="form-input" value="${user.phoneNumber || user.phone || ''}" placeholder="+1 (555) 000-0000">
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
                    <label class="form-label required">Status</label>
                    <select name="status" class="form-select" required>
                        <option value="Active" ${(user.status === 'Active' || !user.status) ? 'selected' : ''}>Active</option>
                        <option value="Inactive" ${user.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="On Leave" ${user.status === 'On Leave' ? 'selected' : ''}>On Leave</option>
                        <option value="Suspended" ${user.status === 'Suspended' ? 'selected' : ''}>Suspended</option>
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

        const canDelete = typeof can !== 'undefined' && can(AppState.currentUser.role, 'users', 'manage');

        const footer = `
            ${canDelete ? `<button class="btn btn-danger" onclick="CRUDManager.deleteUser('${userId}')">Delete</button>` : ''}
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
                // Handle both old 'phone' and new 'phoneNumber' field names
                if (data.phoneNumber) {
                    user.phoneNumber = data.phoneNumber;
                    user.phone = data.phoneNumber; // Backward compatibility
                }
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

    // ========================================
    // CLIENT OPERATIONS
    // ========================================
    
    showAddClientForm() {
        if (!canShowForm('clients', 'create')) {
            return;
        }
        
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
                    <label class="form-label">Phone Number</label>
                    <input type="tel" name="phoneNo" class="form-input" placeholder="+1 (555) 000-0000">
                </div>
                <div class="form-group">
                    <label class="form-label">Address</label>
                    <input type="text" name="address" class="form-input" placeholder="Full address">
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
                    <label class="form-label">Lead Type</label>
                    <select name="leadType" class="form-select">
                        <option value="">Select Type</option>
                        <option value="Cold">Cold</option>
                        <option value="Warm">Warm</option>
                        <option value="Hot">Hot</option>
                        <option value="Referral">Referral</option>
                        <option value="Inbound">Inbound</option>
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
                    <input type="number" name="dealValue" class="form-input" min="0" step="0.01">
                </div>
                <div class="form-group">
                    <label class="form-label">Rating (1-5)</label>
                    <input type="number" name="rating" class="form-input" min="0" max="5">
                </div>
                <div class="form-group">
                    <label class="form-label">Last Contact Date</label>
                    <input type="date" name="lastContactDate" class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label">Next Follow-Up Date</label>
                    <input type="date" name="nextFollowUpDate" class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea name="notes" class="form-textarea" rows="3" placeholder="Additional notes about this client..."></textarea>
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
        
        const submitBtn = form.querySelector('button[type="submit"]');
        if (typeof UXUtils !== 'undefined') {
            UXUtils.setButtonLoading(submitBtn, true);
        }

        try {
            if (typeof ErrorHandler !== 'undefined') {
                await ErrorHandler.wrap(async () => {
                    await AirtableAPI.addClient(data);
                    
                    if (typeof ActivityTypes !== 'undefined') {
                        await ActivityTypes.clientCreated(data.name);
                    }
                    
                    if (typeof ToastManager !== 'undefined') {
                        ToastManager.created('Client');
                    } else {
                        this.showToast('✅ Client created successfully!', 'success');
                    }
                    
                    await loadCompanyData(AppState.selectedCompany);
                    render();
                    document.querySelector('.modal-overlay').remove();
                    
                }, 'Creating client');
            } else {
                await AirtableAPI.addClient(data);
                this.showToast('✅ Client created successfully!', 'success');
                await loadCompanyData(AppState.selectedCompany);
                render();
                document.querySelector('.modal-overlay').remove();
            }
            
        } catch (error) {
            if (typeof ToastManager !== 'undefined') {
                ToastManager.createFailed('Client');
            } else {
                this.showToast('❌ Failed to create client', 'error');
            }
        } finally {
            if (typeof UXUtils !== 'undefined' && submitBtn) {
                UXUtils.setButtonLoading(submitBtn, false);
            }
        }
    },

    showEditClientForm(clientId) {
        const client = AppState.data.clients.find(c => c.id === clientId);
        if (!client) {
            if (typeof ToastManager !== 'undefined') {
                ToastManager.error('Client not found');
            } else {
                this.showToast('❌ Client not found', 'error');
            }
            return;
        }
        
        const users = AppState.data.users.filter(u => 
            u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany)
        );
        
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
                    <label class="form-label">Phone Number</label>
                    <input type="tel" name="phoneNo" class="form-input" value="${client.phoneNo || client.phone || ''}" placeholder="+1 (555) 000-0000">
                </div>
                <div class="form-group">
                    <label class="form-label">Address</label>
                    <input type="text" name="address" class="form-input" value="${client.address || ''}" placeholder="Full address">
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
                    <label class="form-label">Lead Type</label>
                    <select name="leadType" class="form-select">
                        <option value="">Select Type</option>
                        <option value="Cold" ${client.leadType === 'Cold' ? 'selected' : ''}>Cold</option>
                        <option value="Warm" ${client.leadType === 'Warm' ? 'selected' : ''}>Warm</option>
                        <option value="Hot" ${client.leadType === 'Hot' ? 'selected' : ''}>Hot</option>
                        <option value="Referral" ${client.leadType === 'Referral' ? 'selected' : ''}>Referral</option>
                        <option value="Inbound" ${client.leadType === 'Inbound' ? 'selected' : ''}>Inbound</option>
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
                    <input type="number" name="dealValue" class="form-input" value="${client.dealValue || 0}" min="0" step="0.01">
                </div>
                <div class="form-group">
                    <label class="form-label">Rating</label>
                    <input type="number" name="rating" class="form-input" value="${client.rating || 0}" min="0" max="5">
                </div>
                <div class="form-group">
                    <label class="form-label">Last Contact Date</label>
                    <input type="date" name="lastContactDate" class="form-input" value="${client.lastContactDate || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Next Follow-Up Date</label>
                    <input type="date" name="nextFollowUpDate" class="form-input" value="${client.nextFollowUpDate || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea name="notes" class="form-textarea" rows="3">${client.notes || ''}</textarea>
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

        const canDelete = AuthManager && AuthManager.canDeleteRecord && AuthManager.canDeleteRecord('clients', client);
        
        const footer = `
            ${canDelete ? `<button class="btn btn-danger" onclick="CRUDManager.deleteClient('${clientId}')">Delete</button>` : ''}
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitEditClient('${clientId}')">Update</button>
        `;

        const modal = this.createModal('Edit Client', content, footer);
        document.body.appendChild(modal);
    },

    async submitEditClient(clientId) {
        const client = AppState.data.clients.find(c => c.id === clientId);
        if (!client) return;
        
        const validation = validateCRUDPermission('clients', 'update', client);
        if (!validation.allowed) {
            showPermissionError('Update client', validation.reason);
            return;
        }
        
        const form = document.getElementById('editClientForm');
        if (!this.validateForm(form)) return;
        const data = this.getFormData(form);
        const oldStatus = client.status;

        try {
            if (AirtableAPI.isConfigured()) {
                await AirtableAPI.updateClient(clientId, data);
            } else {
                const client = AppState.data.clients.find(c => c.id === clientId);
                Object.assign(client, data);
                // Handle backward compatibility
                if (data.phoneNo) {
                    client.phoneNo = data.phoneNo;
                    client.phone = data.phoneNo; // Backward compatibility
                }
            }
            
            if (AuthManager) {
                AuthManager.logActivity('update', `Updated client: ${data.name}`);
            }
            
            if (typeof ActivityTypes !== 'undefined') {
                if (oldStatus !== data.status) {
                    await ActivityTypes.clientStatusChanged(data.name, oldStatus, data.status);
                } else {
                    await ActivityTypes.clientUpdated(data.name, 'General updates');
                }
            }
            
            if (typeof ToastManager !== 'undefined') {
                ToastManager.updated('Client');
            } else {
                this.showToast('✅ Client updated!', 'success');
            }
            
            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            if (typeof ToastManager !== 'undefined') {
                ToastManager.updateFailed('Client');
            } else {
                this.showToast('❌ Failed to update client', 'error');
            }
        }
    },

    deleteClient(clientId) {
        const client = AppState.data.clients.find(c => c.id === clientId);
        if (!client) return;
        
        const validation = validateCRUDPermission('clients', 'delete', client);
        if (!validation.allowed) {
            showPermissionError('Delete client', validation.reason);
            return;
        }
        
        this.showConfirmDialog(
            '🗑️ Delete Client', 
            `Are you sure you want to delete "${client.name}"?`, 
            async () => {
                try {
                    if (AirtableAPI.isConfigured()) {
                        await AirtableAPI.deleteClient(clientId);
                    } else {
                        AppState.data.clients = AppState.data.clients.filter(c => c.id !== clientId);
                    }
                    
                    if (AuthManager) {
                        AuthManager.logActivity('delete', `Deleted client: ${client.name}`);
                    }
                    
                    if (typeof ActivityTypes !== 'undefined') {
                        await ActivityTypes.clientDeleted(client.name);
                    }
                    
                    if (typeof ToastManager !== 'undefined') {
                        ToastManager.deleted('Client');
                    } else {
                        this.showToast('✅ Client deleted!', 'success');
                    }
                    
                    await loadCompanyData(AppState.selectedCompany);
                    render();
                    document.querySelector('.modal-overlay')?.remove();
                } catch (error) {
                    this.showToast('❌ Failed to delete', 'error');
                }
            }
        );
    },

    // ========================================
    // LEAD OPERATIONS
    // ========================================
    
    showAddLeadForm() {
        if (!canShowForm('leads', 'create')) return;
        
        const users = AppState.data.users.filter(u => 
            u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany)
        );
        
        const content = `
            <form id="addLeadForm">
                <div class="form-group">
                    <label class="form-label required">Lead Name</label>
                    <input type="text" name="name" class="form-input" required>
                    <div class="form-error">Lead name is required</div>
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
            
            if (typeof ActivityTypes !== 'undefined') {
                await ActivityTypes.leadCreated(data.name);
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
        const users = AppState.data.users.filter(u => 
            u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany)
        );
        
        const content = `
            <form id="editLeadForm">
                <div class="form-group">
                    <label class="form-label required">Name</label>
                    <input type="text" name="name" class="form-input" value="${lead.name}" required>
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
                    <label class="form-label">Assigned User</label>
                    <select name="assignedUser" class="form-select">
                        <option value="">Not Assigned</option>
                        ${users.map(u => `<option value="${u.id}" ${lead.assignedUser === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}
                    </select>
                </div>
            </form>
        `;

        const canDelete = typeof can !== 'undefined' && can(AppState.currentUser.role, 'leads', 'delete');

        const footer = `
            ${canDelete ? `<button class="btn btn-danger" onclick="CRUDManager.deleteLead('${leadId}')">Delete</button>` : ''}
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitEditLead('${leadId}')">Update</button>
        `;

        const modal = this.createModal('Edit Lead', content, footer);
        document.body.appendChild(modal);
    },

    async submitEditLead(leadId) {
        const lead = AppState.data.leads.find(l => l.id === leadId);
        if (!lead) return;
        
        const oldStatus = lead.status;
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
            
            if (typeof ActivityTypes !== 'undefined' && oldStatus !== data.status) {
                await ActivityTypes.leadStatusChanged(data.name, oldStatus, data.status);
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
        const lead = AppState.data.leads.find(l => l.id === leadId);
        if (!lead) return;
        
        this.showConfirmDialog('Delete Lead', 'Are you sure?', async () => {
            try {
                if (AirtableAPI.isConfigured()) {
                    await AirtableAPI.deleteLead(leadId);
                } else {
                    AppState.data.leads = AppState.data.leads.filter(l => l.id !== leadId);
                }
                
                if (typeof ActivityTypes !== 'undefined') {
                    await ActivityTypes.leadDeleted(lead.name);
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

    // ========================================
    // CALENDAR EVENTS OPERATIONS (NEW!)
    // ========================================
    
    showAddCalendarEventForm() {
        if (!canShowForm('calendar_events', 'create')) return;
        
        const clients = AppState.data.clients.filter(c => c.company === AppState.selectedCompany);
        
        const content = `
            <form id="addCalendarEventForm">
                <div class="form-group">
                    <label class="form-label required">Event Title</label>
                    <input type="text" name="eventTitle" class="form-input" required>
                    <div class="form-error">Event title is required</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Event Type</label>
                    <select name="eventType" class="form-select" required>
                        <option value="">Select Type</option>
                        <option value="Meeting">Meeting</option>
                        <option value="Call">Call</option>
                        <option value="Email">Email</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Presentation">Presentation</option>
                        <option value="Demo">Demo</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Client(s)</label>
                    <select name="clients" class="form-select" multiple size="5">
                        ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                    </select>
                    <div class="text-white text-xs opacity-75 mt-1">Hold Ctrl/Cmd to select multiple</div>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Start Date & Time</label>
                    <input type="datetime-local" name="startDateTime" class="form-input" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">End Date & Time</label>
                    <input type="datetime-local" name="endDateTime" class="form-input" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Location</label>
                    <input type="text" name="location" class="form-input" placeholder="Office, Online, Address, etc.">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea name="description" class="form-textarea" rows="3" placeholder="Event details, agenda, notes..."></textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Status</label>
                    <select name="status" class="form-select" required>
                        <option value="Scheduled" selected>Scheduled</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Rescheduled">Rescheduled</option>
                    </select>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitAddCalendarEvent()">Create Event</button>
        `;

        const modal = this.createModal('📅 Add Calendar Event', content, footer);
        document.body.appendChild(modal);
    },

    async submitAddCalendarEvent() {
        const form = document.getElementById('addCalendarEventForm');
        if (!this.validateForm(form)) return;
        
        const formData = new FormData(form);
        const data = {
            eventTitle: formData.get('eventTitle'),
            eventType: formData.get('eventType'),
            clients: Array.from(form.querySelectorAll('[name="clients"] option:checked')).map(o => o.value),
            startDateTime: formData.get('startDateTime'),
            endDateTime: formData.get('endDateTime'),
            location: formData.get('location'),
            description: formData.get('description'),
            status: formData.get('status')
        };

        try {
            if (AirtableAPI.isConfigured()) {
                await AirtableAPI.addCalendarEvent(data);
            } else {
                AppState.data.calendarEvents = AppState.data.calendarEvents || [];
                AppState.data.calendarEvents.push({
                    id: Date.now().toString(),
                    ...data
                });
            }
            
            this.showToast('✅ Calendar event created!', 'success');
            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            console.error('Error creating calendar event:', error);
            this.showToast('❌ Failed to create calendar event', 'error');
        }
    },

    showEditCalendarEventForm(eventId) {
        const event = AppState.data.calendarEvents?.find(e => e.id === eventId);
        if (!event) return this.showToast('❌ Event not found', 'error');
        
        const clients = AppState.data.clients.filter(c => c.company === AppState.selectedCompany);
        
        const content = `
            <form id="editCalendarEventForm">
                <div class="form-group">
                    <label class="form-label required">Event Title</label>
                    <input type="text" name="eventTitle" class="form-input" value="${event.eventTitle}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Event Type</label>
                    <select name="eventType" class="form-select" required>
                        <option value="Meeting" ${event.eventType === 'Meeting' ? 'selected' : ''}>Meeting</option>
                        <option value="Call" ${event.eventType === 'Call' ? 'selected' : ''}>Call</option>
                        <option value="Email" ${event.eventType === 'Email' ? 'selected' : ''}>Email</option>
                        <option value="Follow-up" ${event.eventType === 'Follow-up' ? 'selected' : ''}>Follow-up</option>
                        <option value="Presentation" ${event.eventType === 'Presentation' ? 'selected' : ''}>Presentation</option>
                        <option value="Demo" ${event.eventType === 'Demo' ? 'selected' : ''}>Demo</option>
                        <option value="Other" ${event.eventType === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Client(s)</label>
                    <select name="clients" class="form-select" multiple size="5">
                        ${clients.map(c => `
                            <option value="${c.id}" ${event.clients?.includes(c.id) ? 'selected' : ''}>
                                ${c.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Start Date & Time</label>
                    <input type="datetime-local" name="startDateTime" class="form-input" value="${event.startDateTime}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">End Date & Time</label>
                    <input type="datetime-local" name="endDateTime" class="form-input" value="${event.endDateTime}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Location</label>
                    <input type="text" name="location" class="form-input" value="${event.location || ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea name="description" class="form-textarea" rows="3">${event.description || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Status</label>
                    <select name="status" class="form-select" required>
                        <option value="Scheduled" ${event.status === 'Scheduled' ? 'selected' : ''}>Scheduled</option>
                        <option value="Confirmed" ${event.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="Completed" ${event.status === 'Completed' ? 'selected' : ''}>Completed</option>
                        <option value="Cancelled" ${event.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        <option value="Rescheduled" ${event.status === 'Rescheduled' ? 'selected' : ''}>Rescheduled</option>
                    </select>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-danger" onclick="CRUDManager.deleteCalendarEvent('${eventId}')">Delete</button>
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitEditCalendarEvent('${eventId}')">Update</button>
        `;

        const modal = this.createModal('📅 Edit Calendar Event', content, footer);
        document.body.appendChild(modal);
    },

    async submitEditCalendarEvent(eventId) {
        const form = document.getElementById('editCalendarEventForm');
        if (!this.validateForm(form)) return;
        
        const formData = new FormData(form);
        const data = {
            eventTitle: formData.get('eventTitle'),
            eventType: formData.get('eventType'),
            clients: Array.from(form.querySelectorAll('[name="clients"] option:checked')).map(o => o.value),
            startDateTime: formData.get('startDateTime'),
            endDateTime: formData.get('endDateTime'),
            location: formData.get('location'),
            description: formData.get('description'),
            status: formData.get('status')
        };

        try {
            if (AirtableAPI.isConfigured()) {
                await AirtableAPI.updateCalendarEvent(eventId, data);
            } else {
                const event = AppState.data.calendarEvents?.find(e => e.id === eventId);
                if (event) Object.assign(event, data);
            }
            
            this.showToast('✅ Calendar event updated!', 'success');
            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            this.showToast('❌ Failed to update event', 'error');
        }
    },

    deleteCalendarEvent(eventId) {
        this.showConfirmDialog('Delete Event', 'Are you sure you want to delete this calendar event?', async () => {
            try {
                if (AirtableAPI.isConfigured()) {
                    await AirtableAPI.deleteCalendarEvent(eventId);
                } else {
                    AppState.data.calendarEvents = AppState.data.calendarEvents?.filter(e => e.id !== eventId) || [];
                }
                
                this.showToast('✅ Event deleted!', 'success');
                await loadCompanyData(AppState.selectedCompany);
                render();
                document.querySelector('.modal-overlay')?.remove();
            } catch (error) {
                this.showToast('❌ Failed to delete event', 'error');
            }
        });
    },

    // ========================================
    // TASK OPERATIONS (General & Client To-Dos)
    // ========================================
    
    showAddTaskForm(type = 'general') {
        if (!canShowForm('tasks', 'create')) return;
        
        const users = AppState.data.users.filter(u => 
            u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany)
        );
        
        const clients = type === 'client' ? AppState.data.clients.filter(c => c.company === AppState.selectedCompany) : [];
        
        const content = `
            <form id="addTaskForm">
                <div class="form-group">
                    <label class="form-label required">Task Name</label>
                    <input type="text" name="name" class="form-input" required>
                    <div class="form-error">Task name is required</div>
                </div>
                
                ${type === 'client' ? `
                    <div class="form-group">
                        <label class="form-label required">Client</label>
                        <select name="client" class="form-select" required>
                            <option value="">Select Client</option>
                            ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                        <div class="form-error">Client is required</div>
                    </div>
                ` : ''}
                
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea name="description" class="form-textarea" rows="3" placeholder="Task details, notes, requirements..."></textarea>
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
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
                
                ${type === 'general' ? `
                    <div class="form-group">
                        <label class="form-label">Assigned User</label>
                        <select name="assignedUser" class="form-select">
                            <option value="">Not Assigned</option>
                            ${users.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
                        </select>
                    </div>
                ` : ''}
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitAddTask('${type}')">Create Task</button>
        `;

        const modal = this.createModal(`Add New ${type === 'client' ? 'Client' : 'General'} Task`, content, footer);
        document.body.appendChild(modal);
    },

    async submitAddTask(type = 'general') {
        const form = document.getElementById('addTaskForm');
        if (!this.validateForm(form)) return;
        const data = this.getFormData(form);

        try {
            if (type === 'client') {
                if (AirtableAPI.isConfigured()) {
                    await AirtableAPI.addClientTodo(data);
                } else {
                    AppState.data.clientTodos = AppState.data.clientTodos || [];
                    AppState.data.clientTodos.push({id: Date.now().toString(), ...data});
                }
            } else {
                if (AirtableAPI.isConfigured()) {
                    await AirtableAPI.addGeneralTodo(data);
                } else {
                    AppState.data.generalTodos = AppState.data.generalTodos || [];
                    AppState.data.generalTodos.push({id: Date.now().toString(), ...data});
                }
            }
            
            this.showToast('✅ Task created!', 'success');
            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            console.error('Error creating task:', error);
            this.showToast('❌ Failed to create task', 'error');
        }
    },

    showEditTaskForm(taskId, type = 'general') {
        const task = type === 'client' 
            ? AppState.data.clientTodos?.find(t => t.id === taskId)
            : AppState.data.generalTodos?.find(t => t.id === taskId);
            
        if (!task) return this.showToast('❌ Task not found', 'error');
        
        const users = AppState.data.users.filter(u => 
            u.companies && (Array.isArray(u.companies) ? u.companies.includes(AppState.selectedCompany) : u.companies === AppState.selectedCompany)
        );
        
        const clients = type === 'client' ? AppState.data.clients.filter(c => c.company === AppState.selectedCompany) : [];
        
        const content = `
            <form id="editTaskForm">
                <div class="form-group">
                    <label class="form-label required">Task Name</label>
                    <input type="text" name="name" class="form-input" value="${task.name}" required>
                </div>
                
                ${type === 'client' ? `
                    <div class="form-group">
                        <label class="form-label required">Client</label>
                        <select name="client" class="form-select" required>
                            ${clients.map(c => `<option value="${c.id}" ${task.client === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                        </select>
                    </div>
                ` : ''}
                
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea name="description" class="form-textarea" rows="3">${task.description || ''}</textarea>
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
                        <option value="Cancelled" ${task.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
                
                ${type === 'general' ? `
                    <div class="form-group">
                        <label class="form-label">Assigned User</label>
                        <select name="assignedUser" class="form-select">
                            <option value="">Not Assigned</option>
                            ${users.map(u => `<option value="${u.id}" ${task.assignedUser === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}
                        </select>
                    </div>
                ` : ''}
            </form>
        `;

        const canDelete = typeof can !== 'undefined' && can(AppState.currentUser.role, 'tasks', 'delete');

        const footer = `
            ${canDelete ? `<button class="btn btn-danger" onclick="CRUDManager.deleteTask('${taskId}', '${type}')">Delete</button>` : ''}
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="CRUDManager.submitEditTask('${taskId}', '${type}')">Update</button>
        `;

        const modal = this.createModal(`Edit ${type === 'client' ? 'Client' : 'General'} Task`, content, footer);
        document.body.appendChild(modal);
    },

    async submitEditTask(taskId, type = 'general') {
        const form = document.getElementById('editTaskForm');
        if (!this.validateForm(form)) return;
        const data = this.getFormData(form);

        try {
            if (type === 'client') {
                if (AirtableAPI.isConfigured()) {
                    await AirtableAPI.updateClientTodo(taskId, data);
                } else {
                    const task = AppState.data.clientTodos?.find(t => t.id === taskId);
                    if (task) Object.assign(task, data);
                }
            } else {
                if (AirtableAPI.isConfigured()) {
                    await AirtableAPI.updateGeneralTodo(taskId, data);
                } else {
                    const task = AppState.data.generalTodos?.find(t => t.id === taskId);
                    if (task) Object.assign(task, data);
                }
            }
            
            this.showToast('✅ Task updated!', 'success');
            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            console.error('Error updating task:', error);
            this.showToast('❌ Failed to update task', 'error');
        }
    },

    deleteTask(taskId, type = 'general') {
        this.showConfirmDialog('Delete Task', 'Are you sure?', async () => {
            try {
                if (type === 'client') {
                    if (AirtableAPI.isConfigured()) {
                        await AirtableAPI.deleteClientTodo(taskId);
                    } else {
                        AppState.data.clientTodos = AppState.data.clientTodos?.filter(t => t.id !== taskId) || [];
                    }
                } else {
                    if (AirtableAPI.isConfigured()) {
                        await AirtableAPI.deleteGeneralTodo(taskId);
                    } else {
                        AppState.data.generalTodos = AppState.data.generalTodos?.filter(t => t.id !== taskId) || [];
                    }
                }
                
                this.showToast('✅ Task deleted!', 'success');
                await loadCompanyData(AppState.selectedCompany);
                render();
                document.querySelector('.modal-overlay')?.remove();
            } catch (error) {
                console.error('Error deleting task:', error);
                this.showToast('❌ Failed to delete task', 'error');
            }
        });
    }
};

console.log('✅ CRUD Manager loaded with FULL SCHEMA COMPLIANCE');
console.log('✅ Permission validation active');
console.log('✅ All field names corrected:');
console.log('   - Companies: Added Industry, Location, Notes');
console.log('   - Users: phone → phoneNumber, added Status');
console.log('   - Clients: phone → phoneNo, all spaces removed from field names');
console.log('   - Leads: Schema compliant (only LeadName, Status, AssignedUser)');
console.log('   - Calendar Events: NEW - Full CRUD operations');
console.log('   - General To-Do: Added Description, removed Company');
console.log('   - Client To-Do: Added Description, removed AssignedUser & Company');