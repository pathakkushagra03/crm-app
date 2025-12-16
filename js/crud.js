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
                    <input type="number" name="dealValue" class="form-input" placeholder="0" min="0">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Rating (1-5)</label>
                    <input type="number" name="rating" class="form-input" placeholder="0" min="0" max="5">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Assigned User</label>
                    <select name="assignedUser" class="form-select">
                        <option value="">Not Assigned</option>
                        ${users.map(user => `<option value="${user.id}">${user.name}</option>`).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Address</label>
                    <input type="text" name="address" class="form-input" placeholder="Client address">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea name="notes" class="form-textarea" placeholder="Additional notes"></textarea>
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
            this.showToast('Failed to create client: ' + error.message, 'error');
        }
    },

    showEditClientForm(clientId) {
        const client = AppState.data.clients.find(c => c.id === clientId);
        if (!client) {
            this.showToast('Client not found', 'error');
            return;
        }

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
                        <option value="">Select Priority</option>
                        <option value="High" ${client.priority === 'High' ? 'selected' : ''}>High</option>
                        <option value="Medium" ${client.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="Low" ${client.priority === 'Low' ? 'selected' : ''}>Low</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Deal Value ($)</label>
                    <input type="number" name="dealValue" class="form-input" value="${client.dealValue || 0}" min="0">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Rating (1-5)</label>
                    <input type="number" name="rating" class="form-input" value="${client.rating || 0}" min="0" max="5">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Assigned User</label>
                    <select name="assignedUser" class="form-select">
                        <option value="">Not Assigned</option>
                        ${users.map(user => `
                            <option value="${user.id}" ${client.assignedUser === user.id ? 'selected' : ''}>
                                ${user.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Address</label>
                    <input type="text" name="address" class="form-input" value="${client.address || ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea name="notes" class="form-textarea">${client.notes || ''}</textarea>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-danger" onclick="CRUDManager.deleteClient('${clientId}')">Delete Client</button>
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
                this.showToast('Client updated (demo mode)', 'success');
            }

            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            console.error('Error updating client:', error);
            this.showToast('Failed to update client: ' + error.message, 'error');
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
                        this.showToast('Client deleted (demo mode)', 'success');
                    }

                    await loadCompanyData(AppState.selectedCompany);
                    render();
                    document.querySelector('.modal-overlay')?.remove();
                } catch (error) {
                    console.error('Error deleting client:', error);
                    this.showToast('Failed to delete client: ' + error.message, 'error');
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
                        <option value="">Select Priority</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Source</label>
                    <input type="text" name="source" class="form-input" placeholder="e.g., Website, Referral">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Due Date</label>
                    <input type="date" name="dueDate" class="form-input">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Assigned User</label>
                    <select name="assignedUser" class="form-select">
                        <option value="">Not Assigned</option>
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
                this.showToast('Lead created (demo mode)', 'success');
            }

            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            console.error('Error creating lead:', error);
            this.showToast('Failed to create lead: ' + error.message, 'error');
        }
    },

    showEditLeadForm(leadId) {
        const lead = AppState.data.leads.find(l => l.id === leadId);
        if (!lead) {
            this.showToast('Lead not found', 'error');
            return;
        }

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
                        <option value="">Select Priority</option>
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
            <button class="btn btn-danger" onclick="CRUDManager.deleteLead('${leadId}')">Delete Lead</button>
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
                this.showToast('Lead updated (demo mode)', 'success');
            }

            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            console.error('Error updating lead:', error);
            this.showToast('Failed to update lead: ' + error.message, 'error');
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
                        this.showToast('Lead deleted (demo mode)', 'success');
                    }

                    await loadCompanyData(AppState.selectedCompany);
                    render();
                    document.querySelector('.modal-overlay')?.remove();
                } catch (error) {
                    console.error('Error deleting lead:', error);
                    this.showToast('Failed to delete lead: ' + error.message, 'error');
                }
            }
        );
    },

    // ========================================
    // TASK CRUD OPERATIONS
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
                this.showToast('Task created (demo mode)', 'success');
            }

            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            console.error('Error creating task:', error);
            this.showToast('Failed to create task: ' + error.message, 'error');
        }
    },

    showEditTaskForm(taskId) {
        const task = AppState.data.generalTodos.find(t => t.id === taskId);
        if (!task) {
            this.showToast('Task not found', 'error');
            return;
        }

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
            <button class="btn btn-danger" onclick="CRUDManager.deleteTask('${taskId}')">Delete Task</button>
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
                this.showToast('Task updated (demo mode)', 'success');
            }

            await loadCompanyData(AppState.selectedCompany);
            render();
            document.querySelector('.modal-overlay').remove();
        } catch (error) {
            console.error('Error updating task:', error);
            this.showToast('Failed to update task: ' + error.message, 'error');
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
                        this.showToast('Task deleted (demo mode)', 'success');
                    }

                    await loadCompanyData(AppState.selectedCompany);
                    render();
                    document.querySelector('.modal-overlay')?.remove();
                } catch (error) {
                    console.error('Error deleting task:', error);
                    this.showToast('Failed to delete task: ' + error.message, 'error');
                }
            }
        );
    },

    // ========================================
    // USER/MEMBER CRUD OPERATIONS
    // ========================================