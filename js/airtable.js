/*
 * AIRTABLE API INTEGRATION
 * Complete CRUD operations for all entities
 * ✅ FIXED: Schema compliance with Airtable structure
 */

// ========================================
// CONFIGURATION
// ========================================
const AIRTABLE_CONFIG = window.AIRTABLE_CONFIG;

// Table names - EXACT match with Airtable
const TABLES = {
    COMPANIES: 'Companies',
    USERS: 'Users',
    CLIENTS: 'All Clients',
    LEADS: 'Leads',
    CALENDAR_EVENTS: 'Calendar Events',
    GENERAL_TODO: 'General To-Do List',
    CLIENT_TODO: 'Client To-Do List'
};

AIRTABLE_CONFIG.TABLES = TABLES;

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
            ['CompanyName', 'Industry', 'Location', 'Clients', 'Notes'],
            pageSize,
            offset
        );
        
        return {
            records: result.records.map(record => ({
                id: record.id,
                name: record.CompanyName || 'Unnamed Company',
                industry: record.Industry || '',
                location: record.Location || '',
                clients: record.Clients || [],
                notes: record.Notes || '',
                color: this.generateColor(record.id)
            })),
            offset: result.offset
        };
    },

    async addCompany(data) {
        const fields = {
            CompanyName: data.name,
            Industry: data.industry || '',
            Location: data.location || '',
            Notes: data.notes || ''
        };
        
        const record = await this.createRecord(AIRTABLE_CONFIG.TABLES.COMPANIES, fields);
        
        return {
            id: record.id,
            name: record.CompanyName,
            industry: record.Industry || '',
            location: record.Location || '',
            clients: record.Clients || [],
            notes: record.Notes || '',
            color: this.generateColor(record.id)
        };
    },

    async updateCompany(id, data) {
        const fields = {};
        if (data.name) fields.CompanyName = data.name;
        if (data.industry !== undefined) fields.Industry = data.industry;
        if (data.location !== undefined) fields.Location = data.location;
        if (data.notes !== undefined) fields.Notes = data.notes;
        
        const record = await this.updateRecord(AIRTABLE_CONFIG.TABLES.COMPANIES, id, fields);
        
        return {
            id: record.id,
            name: record.CompanyName,
            industry: record.Industry || '',
            location: record.Location || '',
            clients: record.Clients || [],
            notes: record.Notes || '',
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
            [
                'UserName', 
                'Email', 
                'PhoneNumber', 
                'Role', 
                'Status',
                'Companies', 
                'CompanyName from Companies',
                'Leads',
                'Password'
            ],
            pageSize,
            offset
        );
        
        return {
            records: result.records.map(record => ({
                id: record.id,
                name: record.UserName || 'Unnamed User',
                email: record.Email || '',
                phoneNumber: record.PhoneNumber || '',
                role: record.Role || 'User',
                status: record.Status || 'Active',
                companies: record.Companies || [],
                companyNames: record['CompanyName from Companies'] || [],
                leads: record.Leads || [],
                password: record.Password || ''
            })),
            offset: result.offset
        };
    },

    async addUser(data) {
        const fields = {
            UserName: data.name,
            Email: data.email || '',
            PhoneNumber: data.phoneNumber || '',
            Role: data.role || 'User',
            Status: data.status || 'Active',
            Companies: data.companies ? [data.companies] : [],
            Password: data.password || ''
        };
        
        const record = await this.createRecord(AIRTABLE_CONFIG.TABLES.USERS, fields);
        
        return {
            id: record.id,
            name: record.UserName,
            email: record.Email,
            phoneNumber: record.PhoneNumber,
            role: record.Role,
            status: record.Status,
            companies: record.Companies || [],
            companyNames: record['CompanyName from Companies'] || [],
            leads: record.Leads || [],
            password: record.Password
        };
    },

    async updateUser(id, data) {
        const fields = {};
        if (data.name) fields.UserName = data.name;
        if (data.email !== undefined) fields.Email = data.email;
        if (data.phoneNumber !== undefined) fields.PhoneNumber = data.phoneNumber;
        if (data.role) fields.Role = data.role;
        if (data.status !== undefined) fields.Status = data.status;
        if (data.companies) fields.Companies = [data.companies];
        if (data.password !== undefined) fields.Password = data.password;
        
        const record = await this.updateRecord(AIRTABLE_CONFIG.TABLES.USERS, id, fields);
        
        return {
            id: record.id,
            name: record.UserName,
            email: record.Email,
            phoneNumber: record.PhoneNumber,
            role: record.Role,
            status: record.Status,
            companies: record.Companies || [],
            companyNames: record['CompanyName from Companies'] || [],
            leads: record.Leads || [],
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
                'Name',
                'PhoneNo',
                'Email',
                'Address',
                'Company',
                'Status',
                'LeadType',
                'Priority',
                'Notes',
                'DealValue',
                'DaysSinceLastContact',
                'DaysUntilFollowUp',
                'Rating',
                'ClientToDoList',
                'CalendarEvents',
                'AssignedUser',
                'UserName from Assigned User',
                'Leads',
                'CreatedTime',
                'LastModified',
                'LastContactDate',
                'NextFollowUpDate'
            ],
            pageSize,
            offset
        );
        
        return {
            records: result.records.map(record => ({
                id: record.id,
                name: record.Name || 'Unnamed Client',
                phoneNo: record.PhoneNo || '',
                email: record.Email || '',
                address: record.Address || '',
                company: record.Company ? record.Company[0] : null,
                status: record.Status || 'Active',
                leadType: record.LeadType || '',
                priority: record.Priority || '',
                notes: record.Notes || '',
                dealValue: record.DealValue || 0,
                daysSinceLastContact: record.DaysSinceLastContact || null,
                daysUntilFollowUp: record.DaysUntilFollowUp || null,
                rating: record.Rating || 0,
                clientToDoList: record.ClientToDoList || [],
                calendarEvents: record.CalendarEvents || [],
                assignedUser: record.AssignedUser ? record.AssignedUser[0] : null,
                assignedUserName: record['UserName from Assigned User'] ? record['UserName from Assigned User'][0] : null,
                leads: record.Leads || [],
                createdTime: record.CreatedTime || '',
                lastModified: record.LastModified || '',
                lastContactDate: record.LastContactDate || '',
                nextFollowUpDate: record.NextFollowUpDate || ''
            })),
            offset: result.offset
        };
    },

    async addClient(data) {
        if (!this.isConfigured()) {
            throw new Error('Airtable not configured');
        }

        try {
            const fields = {
                Name: data.name,
                PhoneNo: data.phoneNo || '',
                Email: data.email || '',
                Address: data.address || '',
                Status: data.status || 'Active',
                LeadType: data.leadType || '',
                Priority: data.priority || '',
                Notes: data.notes || '',
                DealValue: parseFloat(data.dealValue) || 0,
                Rating: parseInt(data.rating) || 0
            };
            
            // Add linked records
            if (data.assignedUser) {
                fields.AssignedUser = [data.assignedUser];
            }
            if (data.company) {
                fields.Company = [data.company];
            }
            
            // Add dates
            if (data.lastContactDate) {
                fields.LastContactDate = data.lastContactDate;
            }
            if (data.nextFollowUpDate) {
                fields.NextFollowUpDate = data.nextFollowUpDate;
            }
            
            const url = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.BASE_ID}/${AIRTABLE_CONFIG.TABLES.CLIENTS}`;
            
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
                throw new Error(`Failed to create client: ${errorText}`);
            }
            
            const record = await response.json();
            
            return {
                id: record.id,
                name: record.fields.Name,
                phoneNo: record.fields.PhoneNo,
                email: record.fields.Email,
                address: record.fields.Address,
                status: record.fields.Status,
                leadType: record.fields.LeadType,
                priority: record.fields.Priority,
                notes: record.fields.Notes,
                dealValue: record.fields.DealValue,
                rating: record.fields.Rating,
                assignedUser: record.fields.AssignedUser ? record.fields.AssignedUser[0] : null,
                company: record.fields.Company ? record.fields.Company[0] : null,
                lastContactDate: record.fields.LastContactDate || '',
                nextFollowUpDate: record.fields.NextFollowUpDate || ''
            };
        } catch (error) {
            console.error('Error creating client:', error);
            throw error;
        }
    },

    async updateClient(id, data) {
        if (!this.isConfigured()) {
            throw new Error('Airtable not configured');
        }

        try {
            const fields = {};
            
            if (data.name) fields.Name = data.name;
            if (data.phoneNo !== undefined) fields.PhoneNo = data.phoneNo;
            if (data.email !== undefined) fields.Email = data.email;
            if (data.address !== undefined) fields.Address = data.address;
            if (data.status) fields.Status = data.status;
            if (data.leadType !== undefined) fields.LeadType = data.leadType;
            if (data.priority !== undefined) fields.Priority = data.priority;
            if (data.notes !== undefined) fields.Notes = data.notes;
            if (data.dealValue !== undefined) fields.DealValue = parseFloat(data.dealValue) || 0;
            if (data.rating !== undefined) fields.Rating = parseInt(data.rating) || 0;
            
            if (data.assignedUser !== undefined) {
                fields.AssignedUser = data.assignedUser ? [data.assignedUser] : [];
            }
            if (data.company !== undefined) {
                fields.Company = data.company ? [data.company] : [];
            }
            
            if (data.lastContactDate !== undefined && data.lastContactDate !== '') {
                fields.LastContactDate = data.lastContactDate;
            }
            if (data.nextFollowUpDate !== undefined && data.nextFollowUpDate !== '') {
                fields.NextFollowUpDate = data.nextFollowUpDate;
            }
            
            const url = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.BASE_ID}/${AIRTABLE_CONFIG.TABLES.CLIENTS}/${id}`;
            
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
                throw new Error(`Failed to update client: ${errorText}`);
            }
            
            const responseData = await response.json();
            
            return {
                id: responseData.id,
                name: responseData.fields.Name,
                status: responseData.fields.Status,
                dealValue: responseData.fields.DealValue,
                rating: responseData.fields.Rating
            };
        } catch (error) {
            console.error('Error in updateClient:', error);
            throw error;
        }
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
            [
                'LeadName',
                'Status',
                'AssignedUser',
                'UserName from Assigned User',
                'Company',
                'CompanyName from Company'
            ],
            pageSize,
            offset
        );
        
        return {
            records: result.records.map(record => ({
                id: record.id,
                name: record.LeadName || 'Unnamed Lead',
                status: record.Status || 'New',
                assignedUser: record.AssignedUser ? record.AssignedUser[0] : null,
                assignedUserName: record['UserName from Assigned User'] ? record['UserName from Assigned User'][0] : null,
                company: record.Company ? record.Company[0] : null,
                companyName: record['CompanyName from Company'] ? record['CompanyName from Company'][0] : null
            })),
            offset: result.offset
        };
    },

    async addLead(data) {
        const fields = {
            LeadName: data.name,
            Status: data.status || 'New',
            AssignedUser: data.assignedUser ? [data.assignedUser] : [],
            Company: data.company ? [data.company] : []
        };
        
        const record = await this.createRecord(AIRTABLE_CONFIG.TABLES.LEADS, fields);
        
        return {
            id: record.id,
            name: record.LeadName,
            status: record.Status,
            assignedUser: record.AssignedUser ? record.AssignedUser[0] : null,
            assignedUserName: record['UserName from Assigned User'] ? record['UserName from Assigned User'][0] : null,
            company: record.Company ? record.Company[0] : null,
            companyName: record['CompanyName from Company'] ? record['CompanyName from Company'][0] : null
        };
    },

    async updateLead(id, data) {
        const fields = {};
        if (data.name) fields.LeadName = data.name;
        if (data.status) fields.Status = data.status;
        if (data.assignedUser !== undefined) fields.AssignedUser = data.assignedUser ? [data.assignedUser] : [];
        if (data.company !== undefined) fields.Company = data.company ? [data.company] : [];
        
        const record = await this.updateRecord(AIRTABLE_CONFIG.TABLES.LEADS, id, fields);
        
        return {
            id: record.id,
            name: record.LeadName,
            status: record.Status
        };
    },

    async deleteLead(id) {
        return await this.deleteRecord(AIRTABLE_CONFIG.TABLES.LEADS, id);
    },

    // ========================================
    // CALENDAR EVENTS (NEW!)
    // ========================================
    
    async getCalendarEvents(clientId = null, pageSize = 100, offset = null) {
        const filter = clientId ? `FIND('${clientId}', ARRAYJOIN({Clients}))` : '';
        
        const result = await this.fetchFromAirtable(
            AIRTABLE_CONFIG.TABLES.CALENDAR_EVENTS,
            filter,
            [
                'EventTitle',
                'EventType',
                'Clients',
                'StartDateTime',
                'EndDateTime',
                'Location',
                'Description',
                'Status',
                'CreatedDate'
            ],
            pageSize,
            offset
        );
        
        return {
            records: result.records.map(record => ({
                id: record.id,
                eventTitle: record.EventTitle || 'Unnamed Event',
                eventType: record.EventType || '',
                clients: record.Clients || [],
                startDateTime: record.StartDateTime || '',
                endDateTime: record.EndDateTime || '',
                location: record.Location || '',
                description: record.Description || '',
                status: record.Status || 'Scheduled',
                createdDate: record.CreatedDate || ''
            })),
            offset: result.offset
        };
    },

    async addCalendarEvent(data) {
        const fields = {
            EventTitle: data.eventTitle,
            EventType: data.eventType || '',
            Clients: data.clients || [],
            StartDateTime: data.startDateTime || '',
            EndDateTime: data.endDateTime || '',
            Location: data.location || '',
            Description: data.description || '',
            Status: data.status || 'Scheduled'
        };
        
        const record = await this.createRecord(AIRTABLE_CONFIG.TABLES.CALENDAR_EVENTS, fields);
        
        return {
            id: record.id,
            eventTitle: record.EventTitle,
            eventType: record.EventType,
            clients: record.Clients || [],
            startDateTime: record.StartDateTime,
            endDateTime: record.EndDateTime,
            location: record.Location,
            description: record.Description,
            status: record.Status,
            createdDate: record.CreatedDate || ''
        };
    },

    async updateCalendarEvent(id, data) {
        const fields = {};
        if (data.eventTitle) fields.EventTitle = data.eventTitle;
        if (data.eventType !== undefined) fields.EventType = data.eventType;
        if (data.clients !== undefined) fields.Clients = data.clients;
        if (data.startDateTime !== undefined) fields.StartDateTime = data.startDateTime;
        if (data.endDateTime !== undefined) fields.EndDateTime = data.endDateTime;
        if (data.location !== undefined) fields.Location = data.location;
        if (data.description !== undefined) fields.Description = data.description;
        if (data.status) fields.Status = data.status;
        
        const record = await this.updateRecord(AIRTABLE_CONFIG.TABLES.CALENDAR_EVENTS, id, fields);
        
        return {
            id: record.id,
            eventTitle: record.EventTitle,
            status: record.Status
        };
    },

    async deleteCalendarEvent(id) {
        return await this.deleteRecord(AIRTABLE_CONFIG.TABLES.CALENDAR_EVENTS, id);
    },

    // ========================================
    // GENERAL TO-DO LIST
    // ========================================
    
    async getGeneralTodos(pageSize = 100, offset = null) {
        const result = await this.fetchFromAirtable(
            AIRTABLE_CONFIG.TABLES.GENERAL_TODO,
            '',
            [
                'TaskName',
                'Description',
                'Priority',
                'Status',
                'DueDate',
                'AssignedUser',
                'CreatedDate'
            ],
            pageSize,
            offset
        );
        
        return {
            records: result.records.map(record => ({
                id: record.id,
                name: record.TaskName || 'Unnamed Task',
                description: record.Description || '',
                priority: record.Priority || 'Medium',
                status: record.Status || 'Pending',
                dueDate: record.DueDate || '',
                assignedUser: record.AssignedUser ? record.AssignedUser[0] : null,
                createdDate: record.CreatedDate || ''
            })),
            offset: result.offset
        };
    },

    async addGeneralTodo(data) {
        const fields = {
            TaskName: data.name,
            Description: data.description || '',
            Priority: data.priority || 'Medium',
            Status: data.status || 'Pending',
            DueDate: data.dueDate || '',
            AssignedUser: data.assignedUser ? [data.assignedUser] : []
        };
        
        const record = await this.createRecord(AIRTABLE_CONFIG.TABLES.GENERAL_TODO, fields);
        
        return {
            id: record.id,
            name: record.TaskName,
            description: record.Description,
            priority: record.Priority,
            status: record.Status,
            dueDate: record.DueDate,
            assignedUser: record.AssignedUser ? record.AssignedUser[0] : null,
            createdDate: record.CreatedDate || ''
        };
    },

    async updateGeneralTodo(id, data) {
        const fields = {};
        if (data.name) fields.TaskName = data.name;
        if (data.description !== undefined) fields.Description = data.description;
        if (data.priority) fields.Priority = data.priority;
        if (data.status) fields.Status = data.status;
        if (data.dueDate !== undefined) fields.DueDate = data.dueDate;
        if (data.assignedUser !== undefined) fields.AssignedUser = data.assignedUser ? [data.assignedUser] : [];
        
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
    
    async getClientTodos(clientId = null, pageSize = 100, offset = null) {
        const filter = clientId ? `FIND('${clientId}', ARRAYJOIN({Client}))` : '';
        
        const result = await this.fetchFromAirtable(
            AIRTABLE_CONFIG.TABLES.CLIENT_TODO,
            filter,
            [
                'TaskName',
                'Client',
                'Status',
                'Priority',
                'DueDate',
                'Description',
                'CreatedDate'
            ],
            pageSize,
            offset
        );
        
        return {
            records: result.records.map(record => ({
                id: record.id,
                name: record.TaskName || 'Unnamed Task',
                client: record.Client ? record.Client[0] : null,
                status: record.Status || 'Pending',
                priority: record.Priority || 'Medium',
                dueDate: record.DueDate || '',
                description: record.Description || '',
                createdDate: record.CreatedDate || ''
            })),
            offset: result.offset
        };
    },

    async addClientTodo(data) {
        const fields = {
            TaskName: data.name,
            Client: data.client ? [data.client] : [],
            Status: data.status || 'Pending',
            Priority: data.priority || 'Medium',
            DueDate: data.dueDate || '',
            Description: data.description || ''
        };
        
        const record = await this.createRecord(AIRTABLE_CONFIG.TABLES.CLIENT_TODO, fields);
        
        return {
            id: record.id,
            name: record.TaskName,
            client: record.Client ? record.Client[0] : null,
            status: record.Status,
            priority: record.Priority,
            dueDate: record.DueDate,
            description: record.Description,
            createdDate: record.CreatedDate || ''
        };
    },

    async updateClientTodo(id, data) {
        const fields = {};
        if (data.name) fields.TaskName = data.name;
        if (data.client !== undefined) fields.Client = data.client ? [data.client] : [];
        if (data.status) fields.Status = data.status;
        if (data.priority) fields.Priority = data.priority;
        if (data.dueDate !== undefined) fields.DueDate = data.dueDate;
        if (data.description !== undefined) fields.Description = data.description;
        
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
            [
                'Name',
                'PhoneNo',
                'Email',
                'Status',
                'AssignedUser',
                'Company',
                'Priority',
                'DealValue',
                'Rating'
            ],
            pageSize,
            offset
        );
        
        return {
            records: result.records.map(record => ({
                id: record.id,
                name: record.Name || 'Unnamed Client',
                phoneNo: record.PhoneNo || '',
                email: record.Email || '',
                status: record.Status || 'Active',
                assignedUser: record.AssignedUser ? record.AssignedUser[0] : null,
                company: record.Company ? record.Company[0] : null,
                priority: record.Priority || '',
                dealValue: record.DealValue || 0,
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
            [
                'LeadName',
                'Status',
                'AssignedUser',
                'Company',
                'UserName from Assigned User',
                'CompanyName from Company'
            ],
            pageSize,
            offset
        );
        
        return {
            records: result.records.map(record => ({
                id: record.id,
                name: record.LeadName || 'Unnamed Lead',
                status: record.Status || 'New',
                assignedUser: record.AssignedUser ? record.AssignedUser[0] : null,
                assignedUserName: record['UserName from Assigned User'] ? record['UserName from Assigned User'][0] : null,
                company: record.Company ? record.Company[0] : null,
                companyName: record['CompanyName from Company'] ? record['CompanyName from Company'][0] : null
            })),
            offset: result.offset
        };
    },

    async getUserGeneralTodos(userId, pageSize = 100, offset = null) {
        const filter = `FIND('${userId}', ARRAYJOIN({AssignedUser}))`;
        const result = await this.fetchFromAirtable(
            AIRTABLE_CONFIG.TABLES.GENERAL_TODO,
            filter,
            [
                'TaskName',
                'Description',
                'Priority',
                'Status',
                'DueDate',
                'AssignedUser',
                'CreatedDate'
            ],
            pageSize,
            offset
        );
        
        return {
            records: result.records.map(record => ({
                id: record.id,
                name: record.TaskName || 'Unnamed Task',
                description: record.Description || '',
                priority: record.Priority || 'Medium',
                status: record.Status || 'Pending',
                dueDate: record.DueDate || '',
                assignedUser: record.AssignedUser ? record.AssignedUser[0] : null,
                createdDate: record.CreatedDate || ''
            })),
            offset: result.offset
        };
    },

    async getUserCalendarEvents(userId, pageSize = 100, offset = null) {
        // Filter by clients assigned to user
        const clientsResult = await this.getUserClients(userId);
        const clientIds = clientsResult.records.map(c => c.id);
        
        if (clientIds.length === 0) {
            return { records: [], offset: null };
        }
        
        // Get events for these clients
        const filter = clientIds.map(id => `FIND('${id}', ARRAYJOIN({Clients}))`).join(',OR(') + ')'.repeat(clientIds.length - 1);
        
        const result = await this.fetchFromAirtable(
            AIRTABLE_CONFIG.TABLES.CALENDAR_EVENTS,
            filter,
            [
                'EventTitle',
                'EventType',
                'Clients',
                'StartDateTime',
                'EndDateTime',
                'Location',
                'Description',
                'Status',
                'CreatedDate'
            ],
            pageSize,
            offset
        );
        
        return {
            records: result.records.map(record => ({
                id: record.id,
                eventTitle: record.EventTitle || 'Unnamed Event',
                eventType: record.EventType || '',
                clients: record.Clients || [],
                startDateTime: record.StartDateTime || '',
                endDateTime: record.EndDateTime || '',
                location: record.Location || '',
                description: record.Description || '',
                status: record.Status || 'Scheduled',
                createdDate: record.CreatedDate || ''
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
    },

    /**
     * Batch fetch all data for a user
     */
    async getUserDashboardData(userId) {
        try {
            const [clients, leads, todos, events] = await Promise.all([
                this.getUserClients(userId),
                this.getUserLeads(userId),
                this.getUserGeneralTodos(userId),
                this.getUserCalendarEvents(userId)
            ]);
            
            return {
                clients: clients.records,
                leads: leads.records,
                generalTodos: todos.records,
                calendarEvents: events.records
            };
        } catch (error) {
            console.error('Error fetching user dashboard data:', error);
            throw error;
        }
    },

    /**
     * Get upcoming events (next 7 days)
     */
    async getUpcomingEvents(days = 7) {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);
        
        const todayStr = today.toISOString().split('T')[0];
        const futureStr = futureDate.toISOString().split('T')[0];
        
        const filter = `AND(IS_AFTER({StartDateTime}, '${todayStr}'), IS_BEFORE({StartDateTime}, '${futureStr}'))`;
        
        const result = await this.fetchFromAirtable(
            AIRTABLE_CONFIG.TABLES.CALENDAR_EVENTS,
            filter,
            [
                'EventTitle',
                'EventType',
                'Clients',
                'StartDateTime',
                'EndDateTime',
                'Status'
            ],
            100
        );
        
        return result.records;
    },

    /**
     * Get overdue tasks
     */
    async getOverdueTasks() {
        const today = new Date().toISOString().split('T')[0];
        
        const filter = `AND(IS_BEFORE({DueDate}, '${today}'), NOT({Status} = 'Completed'))`;
        
        const [generalTodos, clientTodos] = await Promise.all([
            this.fetchFromAirtable(
                AIRTABLE_CONFIG.TABLES.GENERAL_TODO,
                filter,
                ['TaskName', 'Priority', 'Status', 'DueDate', 'AssignedUser'],
                100
            ),
            this.fetchFromAirtable(
                AIRTABLE_CONFIG.TABLES.CLIENT_TODO,
                filter,
                ['TaskName', 'Client', 'Priority', 'Status', 'DueDate'],
                100
            )
        ]);
        
        return {
            general: generalTodos.records,
            client: clientTodos.records,
            total: generalTodos.records.length + clientTodos.records.length
        };
    },

    /**
     * Search across all entities
     */
    async globalSearch(searchTerm) {
        if (!searchTerm || searchTerm.length < 2) {
            return { clients: [], leads: [], tasks: [] };
        }
        
        const term = searchTerm.toLowerCase();
        
        try {
            const [clients, leads, generalTodos] = await Promise.all([
                this.getClients(),
                this.getLeads(),
                this.getGeneralTodos()
            ]);
            
            return {
                clients: clients.records.filter(c => 
                    c.name.toLowerCase().includes(term) || 
                    c.email.toLowerCase().includes(term)
                ),
                leads: leads.records.filter(l => 
                    l.name.toLowerCase().includes(term)
                ),
                tasks: generalTodos.records.filter(t => 
                    t.name.toLowerCase().includes(term) ||
                    t.description.toLowerCase().includes(term)
                )
            };
        } catch (error) {
            console.error('Global search error:', error);
            return { clients: [], leads: [], tasks: [] };
        }
    }
};

console.log('✅ Airtable API loaded - SCHEMA COMPLIANT');
console.log('✅ All 7 tables configured:');
console.log('   - Companies (with Industry, Location, Notes)');
console.log('   - Users (with Status, Leads link, lookups)');
console.log('   - Clients (ALL schema fields including formulas)');
console.log('   - Leads (with lookups)');
console.log('   - Calendar Events (NEW - fully implemented)');
console.log('   - General To-Do List (with Description, CreatedDate)');
console.log('   - Client To-Do List (with Description, CreatedDate)');
console.log('⚙️ Configuration:', AirtableAPI.isConfigured() ? '✅ Ready' : '⚠️ Needs TOKEN and BASE_ID');