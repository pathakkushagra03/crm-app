/*
 * AIRTABLE API INTEGRATION
 * Complete CRUD operations for all entities
 * Updated to match new Airtable schema
 */

// ========================================
// CONFIGURATION
// ========================================
const AIRTABLE_CONFIG = {
    // PASTE YOUR CREDENTIALS HERE
    TOKEN: 'pattapHYeSpv9nVOP.00ac8088c4a11046dd4017aca7f81a662af33ff059b964bdb504eb31ececbef2',
    BASE_ID: 'appTCS4jZ78mZQDHy',
    
    // Table names - EXACT match with Airtable
    TABLES: {
        COMPANIES: 'Companies',
        USERS: 'Users',
        CLIENTS: 'All Clients',
        LEADS: 'Leads',
        GENERAL_TODO: 'General To-Do List',
        CLIENT_TODO: 'Client To-Do List'
    }
};

// ========================================
// CORE API HELPER
// ========================================
const AirtableAPI = {
    
    isConfigured() {
        return AIRTABLE_CONFIG.TOKEN !== 'PASTE_YOUR_PERSONAL_ACCESS_TOKEN_HERE' 
            && AIRTABLE_CONFIG.BASE_ID !== 'PASTE_YOUR_BASE_ID_HERE';
    },

    async fetchFromAirtable(tableName, filterFormula = '', fields = [], pageSize = 100, offset = null) {
        if (!this.isConfigured()) {
            throw new Error('Airtable not configured');
        }

        try {
            const baseUrl = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.BASE_ID}/${tableName}`;
            const params = new URLSearchParams();
            
            if (filterFormula) params.append('filterByFormula', filterFormula);
            if (fields.length > 0) fields.forEach(field => params.append('fields[]', field));
            if (pageSize) params.append('pageSize', pageSize);
            if (offset) params.append('offset', offset);
            
            const url = `${baseUrl}?${params.toString()}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_CONFIG.TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Airtable API Error: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            
            return {
                records: data.records.map(record => ({
                    id: record.id,
                    ...record.fields
                })),
                offset: data.offset || null
            };
            
        } catch (error) {
            console.error(`Error fetching from ${tableName}:`, error);
            throw error;
        }
    },

    async createRecord(tableName, fields) {
        if (!this.isConfigured()) {
            throw new Error('Airtable not configured');
        }

        try {
            const url = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.BASE_ID}/${tableName}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_CONFIG.TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            return {
                id: data.id,
                ...data.fields
            };
        } catch (error) {
            console.error(`Error creating record in ${tableName}:`, error);
            throw error;
        }
    },

    async updateRecord(tableName, recordId, fields) {
        if (!this.isConfigured()) {
            throw new Error('Airtable not configured');
        }

        try {
            const url = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.BASE_ID}/${tableName}/${recordId}`;
            
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_CONFIG.TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            return {
                id: data.id,
                ...data.fields
            };
        } catch (error) {
            console.error(`Error updating record in ${tableName}:`, error);
            throw error;
        }
    },

    async deleteRecord(tableName, recordId) {
        if (!this.isConfigured()) {
            throw new Error('Airtable not configured');
        }

        try {
            const url = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.BASE_ID}/${tableName}/${recordId}`;
            
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_CONFIG.TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete: ${response.status} - ${errorText}`);
            }
            
            return true;
        } catch (error) {
            console.error(`Error deleting record in ${tableName}:`, error);
            throw error;
        }
    },

    // ========================================
    // COMPANIES
    // ========================================
    
    async getCompanies(pageSize = 100, offset = null) {
        const result = await this.fetchFromAirtable(
            AIRTABLE_CONFIG.TABLES.COMPANIES,
            '',
            ['CompanyName'],
            pageSize,
            offset
        );
        
        return {
            records: result.records.map(record => ({
                id: record.id,
                name: record.CompanyName || 'Unnamed Company',
                color: this.generateColor(record.id)
            })),
            offset: result.offset
        };
    },

    async addCompany(data) {
        const fields = {
            CompanyName: data.name
        };
        
        const record = await this.createRecord(AIRTABLE_CONFIG.TABLES.COMPANIES, fields);
        
        return {
            id: record.id,
            name: record.CompanyName,
            color: this.generateColor(record.id)
        };
    },

    async updateCompany(id, data) {
        const fields = {};
        if (data.name) fields.CompanyName = data.name;
        
        const record = await this.updateRecord(AIRTABLE_CONFIG.TABLES.COMPANIES, id, fields);
        
        return {
            id: record.id,
            name: record.CompanyName,
            color: this.generateColor(record.id)
        };
    },

    async deleteCompany(id) {
        return await this.deleteRecord(AIRTABLE_CONFIG.TABLES.COMPANIES, id);
    },

    // ========================================
    // USERS
    // ========================================
    
    async getUsers(companyId = null, pageSize = 100, offset = null) {
        const filter = companyId ? `FIND('${companyId}', ARRAYJOIN({Companies}))` : '';
        
        const result = await this.fetchFromAirtable(
            AIRTABLE_CONFIG.TABLES.USERS,
            filter,
            ['UserName', 'Email', 'Phone', 'Role', 'Companies', 'Password'],
            pageSize,
            offset
        );
        
        return {
            records: result.records.map(record => ({
                id: record.id,
                name: record.UserName || 'Unnamed User',
                email: record.Email || '',
                phone: record.Phone || '',
                role: record.Role || 'User',
                companies: record.Companies || [],
                password: record.Password || ''
            })),
            offset: result.offset
        };
    },

    async addUser(data) {
        const fields = {
            UserName: data.name,
            Email: data.email || '',
            Phone: data.phone || '',
            Role: data.role || 'User',
            Companies: data.companies ? [data.companies] : [],
            Password: data.password || ''
        };
        
        const record = await this.createRecord(AIRTABLE_CONFIG.TABLES.USERS, fields);
        
        return {
            id: record.id,
            name: record.UserName,
            email: record.Email,
            phone: record.Phone,
            role: record.Role,
            companies: record.Companies || [],
            password: record.Password
        };
    },

    async updateUser(id, data) {
        const fields = {};
        if (data.name) fields.UserName = data.name;
        if (data.email !== undefined) fields.Email = data.email;
        if (data.phone !== undefined) fields.Phone = data.phone;
        if (data.role) fields.Role = data.role;
        if (data.companies) fields.Companies = [data.companies];
        if (data.password !== undefined) fields.Password = data.password;
        
        const record = await this.updateRecord(AIRTABLE_CONFIG.TABLES.USERS, id, fields);
        
        return {
            id: record.id,
            name: record.UserName,
            email: record.Email,
            phone: record.Phone,
            role: record.Role,
            companies: record.Companies || [],
            password: record.Password
        };
    },

    async deleteUser(id) {
        return await this.deleteRecord(AIRTABLE_CONFIG.TABLES.USERS, id);
    },

    async authenticateUser(email, password) {
        try {
            const result = await this.getUsers();
            const user = result.records.find(u => 
                u.email.toLowerCase() === email.toLowerCase() && u.password === password
            );
            return user || null;
        } catch (error) {
            console.error('Authentication error:', error);
            return null;
        }
    },

    // ========================================
    // CLIENTS
    // ========================================
    
    async getClients(companyId = null, pageSize = 100, offset = null) {
        const filter = companyId ? `FIND('${companyId}', ARRAYJOIN({Company}))` : '';
        
        const result = await this.fetchFromAirtable(
            AIRTABLE_CONFIG.TABLES.CLIENTS,
            filter,
            [
                'Name', 'Email', 'Phone Number', 'Status', 'AssignedUser', 
                'Company', 'Lead Type', 'Priority', 'Address', 'Notes',
                'Last Contact Date', 'Next Follow Up Date', 'Best Time to Contact',
                'Probability to Close', 'Deal Value', 'Rating'
            ],
            pageSize,
            offset
        );
        
        return {
            records: result.records.map(record => ({
                id: record.id,
                name: record.Name || 'Unnamed Client',
                email: record.Email || '',
                phone: record['Phone Number'] || '',
                status: record.Status || 'Active',
                assignedUser: record.AssignedUser ? record.AssignedUser[0] : null,
                company: record.Company ? record.Company[0] : null,
                leadType: record['Lead Type'] || '',
                priority: record.Priority || '',
                address: record.Address || '',
                notes: record.Notes || '',
                lastContactDate: record['Last Contact Date'] || '',
                nextFollowUpDate: record['Next Follow Up Date'] || '',
                bestTimeToContact: record['Best Time to Contact'] || '',
                probabilityToClose: record['Probability to Close'] || 0,
                dealValue: record['Deal Value'] || 0,
                rating: record.Rating || 0
            })),
            offset: result.offset
        };
    },

    async addClient(data) {
        const fields = {
            Name: data.name,
            Email: data.email || '',
            'Phone Number': data.phone || '',
            Status: data.status || 'Active',
            AssignedUser: data.assignedUser ? [data.assignedUser] : [],
            Company: data.company ? [data.company] : [],
            'Lead Type': data.leadType || '',
            Priority: data.priority || '',
            Address: data.address || '',
            Notes: data.notes || '',
            'Last Contact Date': data.lastContactDate || '',
            'Next Follow Up Date': data.nextFollowUpDate || '',
            'Best Time to Contact': data.bestTimeToContact || '',
            'Probability to Close': data.probabilityToClose || 0,
            'Deal Value': data.dealValue || 0,
            Rating: data.rating || 0
        };
        
        const record = await this.createRecord(AIRTABLE_CONFIG.TABLES.CLIENTS, fields);
        
        return {
            id: record.id,
            name: record.Name,
            email: record.Email,
            phone: record['Phone Number'],
            status: record.Status,
            assignedUser: record.AssignedUser ? record.AssignedUser[0] : null,
            company: record.Company ? record.Company[0] : null,
            leadType: record['Lead Type'],
            priority: record.Priority,
            address: record.Address,
            notes: record.Notes,
            dealValue: record['Deal Value'],
            rating: record.Rating
        };
    },

    async updateClient(id, data) {
        const fields = {};
        if (data.name) fields.Name = data.name;
        if (data.email !== undefined) fields.Email = data.email;
        if (data.phone !== undefined) fields['Phone Number'] = data.phone;
        if (data.status) fields.Status = data.status;
        if (data.assignedUser !== undefined) fields.AssignedUser = data.assignedUser ? [data.assignedUser] : [];
        if (data.company !== undefined) fields.Company = data.company ? [data.company] : [];
        if (data.leadType !== undefined) fields['Lead Type'] = data.leadType;
        if (data.priority !== undefined) fields.Priority = data.priority;
        if (data.address !== undefined) fields.Address = data.address;
        if (data.notes !== undefined) fields.Notes = data.notes;
        if (data.lastContactDate !== undefined) fields['Last Contact Date'] = data.lastContactDate;
        if (data.nextFollowUpDate !== undefined) fields['Next Follow Up Date'] = data.nextFollowUpDate;
        if (data.bestTimeToContact !== undefined) fields['Best Time to Contact'] = data.bestTimeToContact;
        if (data.probabilityToClose !== undefined) fields['Probability to Close'] = data.probabilityToClose;
        if (data.dealValue !== undefined) fields['Deal Value'] = data.dealValue;
        if (data.rating !== undefined) fields.Rating = data.rating;
        
        const record = await this.updateRecord(AIRTABLE_CONFIG.TABLES.CLIENTS, id, fields);
        
        return {
            id: record.id,
            name: record.Name,
            status: record.Status,
            dealValue: record['Deal Value'],
            rating: record.Rating
        };
    },

    async deleteClient(id) {
        return await this.deleteRecord(AIRTABLE_CONFIG.TABLES.CLIENTS, id);
    },

    // ========================================
    // LEADS
    // ========================================
    
    async getLeads(companyId = null, pageSize = 100, offset = null) {
        const filter = companyId ? `FIND('${companyId}', ARRAYJOIN({Company}))` : '';
        
        const result = await this.fetchFromAirtable(
            AIRTABLE_CONFIG.TABLES.LEADS,
            filter,
            ['LeadName', 'Description', 'Due Date', 'Status', 'Source', 'AssignedUser', 'Company', 'Priority'],
            pageSize,
            offset
        );
        
        return {
            records: result.records.map(record => ({
                id: record.id,
                name: record.LeadName || 'Unnamed Lead',
                description: record.Description || '',
                dueDate: record['Due Date'] || '',
                status: record.Status || 'New',
                source: record.Source || '',
                assignedUser: record.AssignedUser ? record.AssignedUser[0] : null,
                company: record.Company ? record.Company[0] : null,
                priority: record.Priority || ''
            })),
            offset: result.offset
        };
    },

    async addLead(data) {
        const fields = {
            LeadName: data.name,
            Description: data.description || '',
            'Due Date': data.dueDate || '',
            Status: data.status || 'New',
            Source: data.source || '',
            AssignedUser: data.assignedUser ? [data.assignedUser] : [],
            Company: data.company ? [data.company] : [],
            Priority: data.priority || ''
        };
        
        const record = await this.createRecord(AIRTABLE_CONFIG.TABLES.LEADS, fields);
        
        return {
            id: record.id,
            name: record.LeadName,
            description: record.Description,
            dueDate: record['Due Date'],
            status: record.Status,
            source: record.Source,
            assignedUser: record.AssignedUser ? record.AssignedUser[0] : null,
            company: record.Company ? record.Company[0] : null,
            priority: record.Priority
        };
    },

    async updateLead(id, data) {
        const fields = {};
        if (data.name) fields.LeadName = data.name;
        if (data.description !== undefined) fields.Description = data.description;
        if (data.dueDate !== undefined) fields['Due Date'] = data.dueDate;
        if (data.status) fields.Status = data.status;
        if (data.source !== undefined) fields.Source = data.source;
        if (data.assignedUser !== undefined) fields.AssignedUser = data.assignedUser ? [data.assignedUser] : [];
        if (data.company !== undefined) fields.Company = data.company ? [data.company] : [];
        if (data.priority !== undefined) fields.Priority = data.priority;
        
        const record = await this.updateRecord(AIRTABLE_CONFIG.TABLES.LEADS, id, fields);
        
        return {
            id: record.id,
            name: record.LeadName,
            status: record.Status,
            priority: record.Priority
        };
    },

    async deleteLead(id) {
        return await this.deleteRecord(AIRTABLE_CONFIG.TABLES.LEADS, id);
    },

    // ========================================
    // GENERAL TO-DO LIST
    // ========================================
    
    async getGeneralTodos(companyId = null, pageSize = 100, offset = null) {
        const filter = companyId ? `FIND('${companyId}', ARRAYJOIN({Company}))` : '';
        
        const result = await this.fetchFromAirtable(
            AIRTABLE_CONFIG.TABLES.GENERAL_TODO,
            filter,
            ['TaskName', 'DueDate', 'Priority', 'Status', 'AssignedUser', 'Company'],
            pageSize,
            offset
        );
        
        return {
            records: result.records.map(record => ({
                id: record.id,
                name: record.TaskName || 'Unnamed Task',
                dueDate: record.DueDate || '',
                priority: record.Priority || 'Medium',
                status: record.Status || 'Pending',
                assignedUser: record.AssignedUser ? record.AssignedUser[0] : null,
                company: record.Company ? record.Company[0] : null
            })),
            offset: result.offset
        };
    },

    async addGeneralTodo(data) {
        const fields = {
            TaskName: data.name,
            DueDate: data.dueDate || '',
            Priority: data.priority || 'Medium',
            Status: data.status || 'Pending',
            AssignedUser: data.assignedUser ? [data.assignedUser] : [],
            Company: data.company ? [data.company] : []
        };
        
        const record = await this.createRecord(AIRTABLE_CONFIG.TABLES.GENERAL_TODO, fields);
        
        return {
            id: record.id,
            name: record.TaskName,
            dueDate: record.DueDate,
            priority: record.Priority,
            status: record.Status,
            assignedUser: record.AssignedUser ? record.AssignedUser[0] : null,
            company: record.Company ? record.Company[0] : null
        };
    },

    async updateGeneralTodo(id, data) {
        const fields = {};
        if (data.name) fields.TaskName = data.name;
        if (data.dueDate !== undefined) fields.DueDate = data.dueDate;
        if (data.priority) fields.Priority = data.priority;
        if (data.status) fields.Status = data.status;
        if (data.assignedUser !== undefined) fields.AssignedUser = data.assignedUser ? [data.assignedUser] : [];
        if (data.company !== undefined) fields.Company = data.company ? [data.company] : [];
        
        const record = await this.updateRecord(AIRTABLE_CONFIG.TABLES.GENERAL_TODO, id, fields);
        
        return {
            id: record.id,
            name: record.TaskName,
            status: record.Status,
            priority: record.Priority
        };
    },

    async deleteGeneralTodo(id) {
        return await this.deleteRecord(AIRTABLE_CONFIG.TABLES.GENERAL_TODO, id);
    },

    // ========================================
    // CLIENT TO-DO LIST
    // ========================================
    
    async getClientTodos(companyId = null, pageSize = 100, offset = null) {
        const filter = companyId ? `FIND('${companyId}', ARRAYJOIN({Company}))` : '';
        
        const result = await this.fetchFromAirtable(
            AIRTABLE_CONFIG.TABLES.CLIENT_TODO,
            filter,
            ['TaskName', 'DueDate', 'Priority', 'Status', 'AssignedUser', 'Company', 'Client'],
            pageSize,
            offset
        );
        
        return {
            records: result.records.map(record => ({
                id: record.id,
                name: record.TaskName || 'Unnamed Task',
                dueDate: record.DueDate || '',
                priority: record.Priority || 'Medium',
                status: record.Status || 'Pending',
                assignedUser: record.AssignedUser ? record.AssignedUser[0] : null,
                company: record.Company ? record.Company[0] : null,
                client: record.Client ? record.Client[0] : null
            })),
            offset: result.offset
        };
    },

    async addClientTodo(data) {
        const fields = {
            TaskName: data.name,
            DueDate: data.dueDate || '',
            Priority: data.priority || 'Medium',
            Status: data.status || 'Pending',
            AssignedUser: data.assignedUser ? [data.assignedUser] : [],
            Company: data.company ? [data.company] : [],
            Client: data.client ? [data.client] : []
        };
        
        const record = await this.createRecord(AIRTABLE_CONFIG.TABLES.CLIENT_TODO, fields);
        
        return {
            id: record.id,
            name: record.TaskName,
            dueDate: record.DueDate,
            priority: record.Priority,
            status: record.Status,
            assignedUser: record.AssignedUser ? record.AssignedUser[0] : null,
            company: record.Company ? record.Company[0] : null,
            client: record.Client ? record.Client[0] : null
        };
    },

    async updateClientTodo(id, data) {
        const fields = {};
        if (data.name) fields.TaskName = data.name;
        if (data.dueDate !== undefined) fields.DueDate = data.dueDate;
        if (data.priority) fields.Priority = data.priority;
        if (data.status) fields.Status = data.status;
        if (data.assignedUser !== undefined) fields.AssignedUser = data.assignedUser ? [data.assignedUser] : [];
        if (data.company !== undefined) fields.Company = data.company ? [data.company] : [];
        if (data.client !== undefined) fields.Client = data.client ? [data.client] : [];
        
        const record = await this.updateRecord(AIRTABLE_CONFIG.TABLES.CLIENT_TODO, id, fields);
        
        return {
            id: record.id,
            name: record.TaskName,
            status: record.Status,
            priority: record.Priority
        };
    },

    async deleteClientTodo(id) {
        return await this.deleteRecord(AIRTABLE_CONFIG.TABLES.CLIENT_TODO, id);
    },

    // ========================================
    // USER-SPECIFIC QUERIES
    // ========================================
    
    async getUserClients(userId, pageSize = 100, offset = null) {
        const filter = `FIND('${userId}', ARRAYJOIN({AssignedUser}))`;
        const result = await this.fetchFromAirtable(
            AIRTABLE_CONFIG.TABLES.CLIENTS,
            filter,
            ['Name', 'Email', 'Phone Number', 'Status', 'AssignedUser', 'Company', 'Priority', 'Deal Value', 'Rating'],
            pageSize,
            offset
        );
        
        return {
            records: result.records.map(record => ({
                id: record.id,
                name: record.Name || 'Unnamed Client',
                email: record.Email || '',
                phone: record['Phone Number'] || '',
                status: record.Status || 'Active',
                assignedUser: record.AssignedUser ? record.AssignedUser[0] : null,
                company: record.Company ? record.Company[0] : null,
                priority: record.Priority || '',
                dealValue: record['Deal Value'] || 0,
                rating: record.Rating || 0
            })),
            offset: result.offset
        };
    },

    async getUserLeads(userId, pageSize = 100, offset = null) {
        const filter = `FIND('${userId}', ARRAYJOIN({AssignedUser}))`;
        const result = await this.fetchFromAirtable(
            AIRTABLE_CONFIG.TABLES.LEADS,
            filter,
            ['LeadName', 'Description', 'Status', 'Source', 'Priority', 'AssignedUser', 'Company'],
            pageSize,
            offset
        );
        
        return {
            records: result.records.map(record => ({
                id: record.id,
                name: record.LeadName || 'Unnamed Lead',
                description: record.Description || '',
                status: record.Status || 'New',
                source: record.Source || '',
                priority: record.Priority || '',
                assignedUser: record.AssignedUser ? record.AssignedUser[0] : null,
                company: record.Company ? record.Company[0] : null
            })),
            offset: result.offset
        };
    },

    async getUserGeneralTodos(userId, pageSize = 100, offset = null) {
        const filter = `FIND('${userId}', ARRAYJOIN({AssignedUser}))`;
        const result = await this.fetchFromAirtable(
            AIRTABLE_CONFIG.TABLES.GENERAL_TODO,
            filter,
            ['TaskName', 'DueDate', 'Priority', 'Status', 'AssignedUser', 'Company'],
            pageSize,
            offset
        );
        
        return {
            records: result.records.map(record => ({
                id: record.id,
                name: record.TaskName || 'Unnamed Task',
                dueDate: record.DueDate || '',
                priority: record.Priority || 'Medium',
                status: record.Status || 'Pending',
                assignedUser: record.AssignedUser ? record.AssignedUser[0] : null,
                company: record.Company ? record.Company[0] : null
            })),
            offset: result.offset
        };
    },

    async getUserClientTodos(userId, pageSize = 100, offset = null) {
        const filter = `FIND('${userId}', ARRAYJOIN({AssignedUser}))`;
        const result = await this.fetchFromAirtable(
            AIRTABLE_CONFIG.TABLES.CLIENT_TODO,
            filter,
            ['TaskName', 'DueDate', 'Priority', 'Status', 'AssignedUser', 'Company', 'Client'],
            pageSize,
            offset
        );
        
        return {
            records: result.records.map(record => ({
                id: record.id,
                name: record.TaskName || 'Unnamed Task',
                dueDate: record.DueDate || '',
                priority: record.Priority || 'Medium',
                status: record.Status || 'Pending',
                assignedUser: record.AssignedUser ? record.AssignedUser[0] : null,
                company: record.Company ? record.Company[0] : null,
                client: record.Client ? record.Client[0] : null
            })),
            offset: result.offset
        };
    },

    // ========================================
    // UTILITIES
    // ========================================
    
    generateColor(id) {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7B731'];
        const index = Math.abs(id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length;
        return colors[index];
    }
};

console.log('✅ Airtable API loaded');
console.log('⚙️ Configuration:', AirtableAPI.isConfigured() ? 'Ready' : 'Needs TOKEN and BASE_ID');