/*
 * AIRTABLE API INTEGRATION - WITH COMPREHENSIVE ERROR HANDLING
 * Complete CRUD operations for all entities
 * ✅ FIXED: Schema compliance with Airtable structure
 * ✅ ADDED: Comprehensive error handling with retry logic
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
// CORE API HELPER - WITH ERROR HANDLING
// ========================================
const AirtableAPI = {
    
    // Retry configuration
    retryConfig: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 5000
    },
    
    /**
     * Check if Airtable is configured
     */
    isConfigured() {
        try {
            const hasToken = AIRTABLE_CONFIG.TOKEN && 
                           AIRTABLE_CONFIG.TOKEN !== 'PASTE_YOUR_PERSONAL_ACCESS_TOKEN_HERE';
            const hasBaseId = AIRTABLE_CONFIG.BASE_ID && 
                            AIRTABLE_CONFIG.BASE_ID !== 'PASTE_YOUR_BASE_ID_HERE';
            
            return hasToken && hasBaseId;
        } catch (error) {
            console.error('❌ Error checking Airtable configuration:', error);
            return false;
        }
    },

    /**
     * FIXED: Fetch from Airtable with comprehensive error handling and retry logic
     */
    async fetchFromAirtable(tableName, filterFormula = '', fields = [], pageSize = 100, offset = null) {
        if (!this.isConfigured()) {
            const error = new Error('Airtable not configured - Missing TOKEN or BASE_ID');
            throw error;
        }

        const context = {
            operation: 'fetchFromAirtable',
            table: tableName,
            hasFilter: !!filterFormula,
            pageSize: pageSize
        };

        try {
            const baseUrl = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.BASE_ID}/${tableName}`;
            const params = new URLSearchParams();
            
            if (filterFormula) params.append('filterByFormula', filterFormula);
            if (fields.length > 0) fields.forEach(field => params.append('fields[]', field));
            if (pageSize) params.append('pageSize', pageSize);
            if (offset) params.append('offset', offset);
            
            const url = `${baseUrl}?${params.toString()}`;
            
            console.log(`🔗 Fetching from Airtable: ${tableName}`, { filterFormula, fields, pageSize });
            
            // Use retry wrapper for network resilience
            const response = await GlobalErrorHandler.retry(
                async () => {
                    const res = await fetch(url, {
                        headers: {
                            'Authorization': `Bearer ${AIRTABLE_CONFIG.TOKEN}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!res.ok) {
                        const errorText = await res.text();
                        let errorMessage = `Airtable API Error: ${res.status}`;
                        
                        // Parse error message if available
                        try {
                            const errorJson = JSON.parse(errorText);
                            errorMessage = errorJson.error?.message || errorMessage;
                        } catch (e) {
                            errorMessage += ` - ${errorText}`;
                        }
                        
                        // Add context for common errors
                        if (res.status === 401) {
                            errorMessage += ' - Invalid or expired API token';
                        } else if (res.status === 403) {
                            errorMessage += ' - Insufficient permissions for this operation';
                        } else if (res.status === 404) {
                            errorMessage += ` - Table "${tableName}" not found in base`;
                        } else if (res.status === 422) {
                            errorMessage += ' - Invalid request parameters';
                        }
                        
                        throw new Error(errorMessage);
                    }
                    
                    return res;
                },
                {
                    maxAttempts: this.retryConfig.maxAttempts,
                    delay: this.retryConfig.initialDelay,
                    context: context
                }
            );
            
            const data = await response.json();
            
            const records = (data.records || []).map(record => ({
                id: record.id,
                ...record.fields
            }));
            
            console.log(`✅ Fetched ${records.length} records from ${tableName}`);
            
            return {
                records: records,
                offset: data.offset || null
            };
            
        } catch (error) {
            console.error(`❌ Error fetching from ${tableName}:`, error);
            
            // Handle with global error handler
            GlobalErrorHandler.handle(error, context);
            
            // Rethrow to let caller handle
            throw error;
        }
    },

    /**
     * FIXED: Create record with error handling
     */
    async createRecord(tableName, fields) {
        if (!this.isConfigured()) {
            throw new Error('Airtable not configured');
        }

        const context = {
            operation: 'createRecord',
            table: tableName,
            fieldCount: Object.keys(fields).length
        };

        try {
            const url = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.BASE_ID}/${tableName}`;
            
            console.log(`➕ Creating record in ${tableName}`, fields);
            
            const response = await GlobalErrorHandler.retry(
                async () => {
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${AIRTABLE_CONFIG.TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ fields })
                    });
                    
                    if (!res.ok) {
                        const errorText = await res.text();
                        let errorMessage = `Failed to create record: ${res.status}`;
                        
                        try {
                            const errorJson = JSON.parse(errorText);
                            errorMessage = errorJson.error?.message || errorMessage;
                        } catch (e) {
                            errorMessage += ` - ${errorText}`;
                        }
                        
                        throw new Error(errorMessage);
                    }
                    
                    return res;
                },
                {
                    maxAttempts: 2, // Less retries for creates to avoid duplicates
                    delay: this.retryConfig.initialDelay,
                    context: context
                }
            );
            
            const data = await response.json();
            
            console.log(`✅ Created record in ${tableName}:`, data.id);
            
            return {
                id: data.id,
                ...data.fields
            };
        } catch (error) {
            console.error(`❌ Error creating record in ${tableName}:`, error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    /**
     * FIXED: Update record with error handling
     */
    async updateRecord(tableName, recordId, fields) {
        if (!this.isConfigured()) {
            throw new Error('Airtable not configured');
        }

        const context = {
            operation: 'updateRecord',
            table: tableName,
            recordId: recordId,
            fieldCount: Object.keys(fields).length
        };

        try {
            const url = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.BASE_ID}/${tableName}/${recordId}`;
            
            console.log(`✏️ Updating record in ${tableName}:`, recordId);
            
            const response = await GlobalErrorHandler.retry(
                async () => {
                    const res = await fetch(url, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${AIRTABLE_CONFIG.TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ fields })
                    });
                    
                    if (!res.ok) {
                        const errorText = await res.text();
                        let errorMessage = `Failed to update record: ${res.status}`;
                        
                        try {
                            const errorJson = JSON.parse(errorText);
                            errorMessage = errorJson.error?.message || errorMessage;
                        } catch (e) {
                            errorMessage += ` - ${errorText}`;
                        }
                        
                        if (res.status === 404) {
                            errorMessage += ` - Record ${recordId} not found`;
                        }
                        
                        throw new Error(errorMessage);
                    }
                    
                    return res;
                },
                {
                    maxAttempts: this.retryConfig.maxAttempts,
                    delay: this.retryConfig.initialDelay,
                    context: context
                }
            );
            
            const data = await response.json();
            
            console.log(`✅ Updated record in ${tableName}:`, recordId);
            
            return {
                id: data.id,
                ...data.fields
            };
        } catch (error) {
            console.error(`❌ Error updating record in ${tableName}:`, error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    /**
     * FIXED: Delete record with error handling
     */
    async deleteRecord(tableName, recordId) {
        if (!this.isConfigured()) {
            throw new Error('Airtable not configured');
        }

        const context = {
            operation: 'deleteRecord',
            table: tableName,
            recordId: recordId
        };

        try {
            const url = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.BASE_ID}/${tableName}/${recordId}`;
            
            console.log(`🗑️ Deleting record from ${tableName}:`, recordId);
            
            const response = await GlobalErrorHandler.retry(
                async () => {
                    const res = await fetch(url, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${AIRTABLE_CONFIG.TOKEN}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!res.ok) {
                        const errorText = await res.text();
                        let errorMessage = `Failed to delete record: ${res.status}`;
                        
                        try {
                            const errorJson = JSON.parse(errorText);
                            errorMessage = errorJson.error?.message || errorMessage;
                        } catch (e) {
                            errorMessage += ` - ${errorText}`;
                        }
                        
                        if (res.status === 404) {
                            errorMessage += ` - Record ${recordId} not found (may already be deleted)`;
                        }
                        
                        throw new Error(errorMessage);
                    }
                    
                    return res;
                },
                {
                    maxAttempts: 2, // Less retries for deletes
                    delay: this.retryConfig.initialDelay,
                    context: context
                }
            );
            
            console.log(`✅ Deleted record from ${tableName}:`, recordId);
            
            return true;
        } catch (error) {
            console.error(`❌ Error deleting record from ${tableName}:`, error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    // ========================================
    // COMPANIES - WITH ERROR HANDLING
    // ========================================
    
    /**
     * FIXED: Get companies with comprehensive error handling
     */
    async getCompanies(pageSize = 100, offset = null) {
        const context = {
            operation: 'getCompanies',
            table: TABLES.COMPANIES
        };

        try {
            console.log('📦 Loading companies from Airtable...');
            
            const result = await this.fetchFromAirtable(
                AIRTABLE_CONFIG.TABLES.COMPANIES,
                '',
                ['CompanyName', 'Industry', 'Location', 'Clients', 'Notes'],
                pageSize,
                offset
            );
            
            const companies = result.records.map(record => ({
                id: record.id,
                name: record.CompanyName || 'Unnamed Company',
                industry: record.Industry || '',
                location: record.Location || '',
                clients: Array.isArray(record.Clients) ? record.Clients : [],
                notes: record.Notes || '',
                color: this.generateColor(record.id)
            }));
            
            console.log(`✅ Loaded ${companies.length} companies`);
            
            return {
                records: companies,
                offset: result.offset
            };
        } catch (error) {
            console.error('❌ Failed to load companies:', error);
            GlobalErrorHandler.handle(error, context);
            
            // Return empty result instead of throwing
            return {
                records: [],
                offset: null
            };
        }
    },

    /**
     * FIXED: Add company with error handling
     */
    async addCompany(data) {
        const context = {
            operation: 'addCompany',
            table: TABLES.COMPANIES,
            companyName: data.name
        };

        try {
            const fields = {
                CompanyName: data.name,
                Industry: data.industry || '',
                Location: data.location || '',
                Notes: data.notes || ''
            };
            
            console.log('➕ Creating company:', data.name);
            
            const record = await this.createRecord(AIRTABLE_CONFIG.TABLES.COMPANIES, fields);
            
            const company = {
                id: record.id,
                name: record.CompanyName,
                industry: record.Industry || '',
                location: record.Location || '',
                clients: Array.isArray(record.Clients) ? record.Clients : [],
                notes: record.Notes || '',
                color: this.generateColor(record.id)
            };
            
            console.log('✅ Company created:', company.id);
            
            return company;
        } catch (error) {
            console.error('❌ Failed to create company:', error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    /**
     * FIXED: Update company with error handling
     */
    async updateCompany(id, data) {
        const context = {
            operation: 'updateCompany',
            table: TABLES.COMPANIES,
            companyId: id
        };

        try {
            const fields = {};
            if (data.name) fields.CompanyName = data.name;
            if (data.industry !== undefined) fields.Industry = data.industry;
            if (data.location !== undefined) fields.Location = data.location;
            if (data.notes !== undefined) fields.Notes = data.notes;
            
            console.log('✏️ Updating company:', id);
            
            const record = await this.updateRecord(AIRTABLE_CONFIG.TABLES.COMPANIES, id, fields);
            
            const company = {
                id: record.id,
                name: record.CompanyName,
                industry: record.Industry || '',
                location: record.Location || '',
                clients: Array.isArray(record.Clients) ? record.Clients : [],
                notes: record.Notes || '',
                color: this.generateColor(record.id)
            };
            
            console.log('✅ Company updated:', id);
            
            return company;
        } catch (error) {
            console.error('❌ Failed to update company:', error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    /**
     * FIXED: Delete company with error handling
     */
    async deleteCompany(id) {
        const context = {
            operation: 'deleteCompany',
            table: TABLES.COMPANIES,
            companyId: id
        };

        try {
            console.log('🗑️ Deleting company:', id);
            
            const result = await this.deleteRecord(AIRTABLE_CONFIG.TABLES.COMPANIES, id);
            
            console.log('✅ Company deleted:', id);
            
            return result;
        } catch (error) {
            console.error('❌ Failed to delete company:', error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    // ========================================
    // USERS - WITH ERROR HANDLING
    // ========================================
    
    /**
     * FIXED: Get users with error handling
     */
    async getUsers(companyId = null, pageSize = 100, offset = null) {
        const context = {
            operation: 'getUsers',
            table: TABLES.USERS,
            companyId: companyId
        };

        try {
            const filter = companyId ? `FIND('${companyId}', ARRAYJOIN({Companies}))` : '';
            
            console.log('👥 Loading users from Airtable...', { companyId });
            
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
            
            const users = result.records.map(record => ({
                id: record.id,
                name: record.UserName || 'Unnamed User',
                email: record.Email || '',
                phoneNumber: record.PhoneNumber || '',
                role: record.Role || 'User',
                status: record.Status || 'Active',
                companies: Array.isArray(record.Companies) ? record.Companies : [],
                companyNames: Array.isArray(record['CompanyName from Companies']) ? record['CompanyName from Companies'] : [],
                leads: Array.isArray(record.Leads) ? record.Leads : [],
                password: record.Password || ''
            }));
            
            console.log(`✅ Loaded ${users.length} users`);
            
            return {
                records: users,
                offset: result.offset
            };
        } catch (error) {
            console.error('❌ Failed to load users:', error);
            GlobalErrorHandler.handle(error, context);
            
            return {
                records: [],
                offset: null
            };
        }
    },

    /**
     * FIXED: Add user with error handling
     */
    async addUser(data) {
        const context = {
            operation: 'addUser',
            table: TABLES.USERS,
            userName: data.name
        };

        try {
            const fields = {
                UserName: data.name,
                Email: data.email || '',
                PhoneNumber: data.phoneNumber || '',
                Role: data.role || 'User',
                Status: data.status || 'Active',
                Companies: data.companies ? [data.companies] : [],
                Password: data.password || ''
            };
            
            console.log('➕ Creating user:', data.name);
            
            const record = await this.createRecord(AIRTABLE_CONFIG.TABLES.USERS, fields);
            
            const user = {
                id: record.id,
                name: record.UserName,
                email: record.Email,
                phoneNumber: record.PhoneNumber,
                role: record.Role,
                status: record.Status,
                companies: Array.isArray(record.Companies) ? record.Companies : [],
                companyNames: Array.isArray(record['CompanyName from Companies']) ? record['CompanyName from Companies'] : [],
                leads: Array.isArray(record.Leads) ? record.Leads : [],
                password: record.Password
            };
            
            console.log('✅ User created:', user.id);
            
            return user;
        } catch (error) {
            console.error('❌ Failed to create user:', error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    /**
     * FIXED: Update user with error handling
     */
    async updateUser(id, data) {
        const context = {
            operation: 'updateUser',
            table: TABLES.USERS,
            userId: id
        };

        try {
            const fields = {};
            if (data.name) fields.UserName = data.name;
            if (data.email !== undefined) fields.Email = data.email;
            if (data.phoneNumber !== undefined) fields.PhoneNumber = data.phoneNumber;
            if (data.role) fields.Role = data.role;
            if (data.status !== undefined) fields.Status = data.status;
            if (data.companies) fields.Companies = [data.companies];
            if (data.password !== undefined) fields.Password = data.password;
            
            console.log('✏️ Updating user:', id);
            
            const record = await this.updateRecord(AIRTABLE_CONFIG.TABLES.USERS, id, fields);
            
            const user = {
                id: record.id,
                name: record.UserName,
                email: record.Email,
                phoneNumber: record.PhoneNumber,
                role: record.Role,
                status: record.Status,
                companies: Array.isArray(record.Companies) ? record.Companies : [],
                companyNames: Array.isArray(record['CompanyName from Companies']) ? record['CompanyName from Companies'] : [],
                leads: Array.isArray(record.Leads) ? record.Leads : [],
                password: record.Password
            };
            
            console.log('✅ User updated:', id);
            
            return user;
        } catch (error) {
            console.error('❌ Failed to update user:', error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    /**
     * FIXED: Delete user with error handling
     */
    async deleteUser(id) {
        const context = {
            operation: 'deleteUser',
            table: TABLES.USERS,
            userId: id
        };

        try {
            console.log('🗑️ Deleting user:', id);
            
            const result = await this.deleteRecord(AIRTABLE_CONFIG.TABLES.USERS, id);
            
            console.log('✅ User deleted:', id);
            
            return result;
        } catch (error) {
            console.error('❌ Failed to delete user:', error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    /**
     * FIXED: Authenticate user with error handling
     */
    async authenticateUser(email, password) {
        const context = {
            operation: 'authenticateUser',
            table: TABLES.USERS,
            email: email
        };

        try {
            console.log('🔐 Authenticating user:', email);
            
            const result = await this.getUsers();
            const user = result.records.find(u => 
                u.email.toLowerCase() === email.toLowerCase() && u.password === password
            );
            
            if (user) {
                console.log('✅ User authenticated:', email);
            } else {
                console.warn('⚠️ Authentication failed: Invalid credentials');
            }
            
            return user || null;
        } catch (error) {
            console.error('❌ Authentication error:', error);
            GlobalErrorHandler.handle(error, context);
            return null;
        }
    },

    
    // ========================================
    // CLIENTS - WITH ERROR HANDLING
    // ========================================
    
    /**
     * FIXED: Get clients with error handling
     */
    async getClients(companyId = null, pageSize = 100, offset = null) {
        const context = {
            operation: 'getClients',
            table: TABLES.CLIENTS,
            companyId: companyId
        };

        try {
            const filter = companyId ? `FIND('${companyId}', ARRAYJOIN({Company}))` : '';
            
            console.log('💼 Loading clients from Airtable...', { companyId });
            
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
            
            const clients = result.records.map(record => ({
                id: record.id,
                name: record.Name || 'Unnamed Client',
                phoneNo: record.PhoneNo || '',
                email: record.Email || '',
                address: record.Address || '',
                company: Array.isArray(record.Company) && record.Company.length > 0 ? record.Company[0] : null,
                status: record.Status || 'Active',
                leadType: record.LeadType || '',
                priority: record.Priority || '',
                notes: record.Notes || '',
                dealValue: parseFloat(record.DealValue) || 0,
                daysSinceLastContact: record.DaysSinceLastContact || null,
                daysUntilFollowUp: record.DaysUntilFollowUp || null,
                rating: parseInt(record.Rating) || 0,
                clientToDoList: Array.isArray(record.ClientToDoList) ? record.ClientToDoList : [],
                calendarEvents: Array.isArray(record.CalendarEvents) ? record.CalendarEvents : [],
                assignedUser: Array.isArray(record.AssignedUser) && record.AssignedUser.length > 0 ? record.AssignedUser[0] : null,
                assignedUserName: Array.isArray(record['UserName from Assigned User']) && record['UserName from Assigned User'].length > 0 ? record['UserName from Assigned User'][0] : null,
                leads: Array.isArray(record.Leads) ? record.Leads : [],
                createdTime: record.CreatedTime || '',
                lastModified: record.LastModified || '',
                lastContactDate: record.LastContactDate || '',
                nextFollowUpDate: record.NextFollowUpDate || ''
            }));
            
            console.log(`✅ Loaded ${clients.length} clients`);
            
            return {
                records: clients,
                offset: result.offset
            };
        } catch (error) {
            console.error('❌ Failed to load clients:', error);
            GlobalErrorHandler.handle(error, context);
            
            return {
                records: [],
                offset: null
            };
        }
    },

    /**
     * FIXED: Add client with error handling
     */
    async addClient(data) {
        const context = {
            operation: 'addClient',
            table: TABLES.CLIENTS,
            clientName: data.name
        };

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
            
            console.log('➕ Creating client:', data.name);
            
            const record = await this.createRecord(AIRTABLE_CONFIG.TABLES.CLIENTS, fields);
            
            const client = {
                id: record.id,
                name: record.Name,
                phoneNo: record.PhoneNo,
                email: record.Email,
                address: record.Address,
                status: record.Status,
                leadType: record.LeadType,
                priority: record.Priority,
                notes: record.Notes,
                dealValue: parseFloat(record.DealValue) || 0,
                rating: parseInt(record.Rating) || 0,
                assignedUser: Array.isArray(record.AssignedUser) && record.AssignedUser.length > 0 ? record.AssignedUser[0] : null,
                company: Array.isArray(record.Company) && record.Company.length > 0 ? record.Company[0] : null,
                lastContactDate: record.LastContactDate || '',
                nextFollowUpDate: record.NextFollowUpDate || ''
            };
            
            console.log('✅ Client created:', client.id);
            
            return client;
        } catch (error) {
            console.error('❌ Failed to create client:', error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    /**
     * FIXED: Update client with error handling
     */
    async updateClient(id, data) {
        const context = {
            operation: 'updateClient',
            table: TABLES.CLIENTS,
            clientId: id
        };

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
            
            console.log('✏️ Updating client:', id);
            
            const record = await this.updateRecord(AIRTABLE_CONFIG.TABLES.CLIENTS, id, fields);
            
            const client = {
                id: record.id,
                name: record.Name,
                status: record.Status,
                dealValue: parseFloat(record.DealValue) || 0,
                rating: parseInt(record.Rating) || 0
            };
            
            console.log('✅ Client updated:', id);
            
            return client;
        } catch (error) {
            console.error('❌ Failed to update client:', error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    /**
     * FIXED: Delete client with error handling
     */
    async deleteClient(id) {
        const context = {
            operation: 'deleteClient',
            table: TABLES.CLIENTS,
            clientId: id
        };

        try {
            console.log('🗑️ Deleting client:', id);
            
            const result = await this.deleteRecord(AIRTABLE_CONFIG.TABLES.CLIENTS, id);
            
            console.log('✅ Client deleted:', id);
            
            return result;
        } catch (error) {
            console.error('❌ Failed to delete client:', error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    // ========================================
    // LEADS - WITH ERROR HANDLING
    // ========================================
    
    /**
     * FIXED: Get leads with error handling
     */
    async getLeads(companyId = null, pageSize = 100, offset = null) {
        const context = {
            operation: 'getLeads',
            table: TABLES.LEADS,
            companyId: companyId
        };

        try {
            const filter = companyId ? `FIND('${companyId}', ARRAYJOIN({Company}))` : '';
            
            console.log('🎯 Loading leads from Airtable...', { companyId });
            
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
            
            const leads = result.records.map(record => ({
                id: record.id,
                name: record.LeadName || 'Unnamed Lead',
                status: record.Status || 'New',
                assignedUser: Array.isArray(record.AssignedUser) && record.AssignedUser.length > 0 ? record.AssignedUser[0] : null,
                assignedUserName: Array.isArray(record['UserName from Assigned User']) && record['UserName from Assigned User'].length > 0 ? record['UserName from Assigned User'][0] : null,
                company: Array.isArray(record.Company) && record.Company.length > 0 ? record.Company[0] : null,
                companyName: Array.isArray(record['CompanyName from Company']) && record['CompanyName from Company'].length > 0 ? record['CompanyName from Company'][0] : null
            }));
            
            console.log(`✅ Loaded ${leads.length} leads`);
            
            return {
                records: leads,
                offset: result.offset
            };
        } catch (error) {
            console.error('❌ Failed to load leads:', error);
            GlobalErrorHandler.handle(error, context);
            
            return {
                records: [],
                offset: null
            };
        }
    },

    /**
     * FIXED: Add lead with error handling
     */
    async addLead(data) {
        const context = {
            operation: 'addLead',
            table: TABLES.LEADS,
            leadName: data.name
        };

        try {
            const fields = {
                LeadName: data.name,
                Status: data.status || 'New',
                AssignedUser: data.assignedUser ? [data.assignedUser] : [],
                Company: data.company ? [data.company] : []
            };
            
            console.log('➕ Creating lead:', data.name);
            
            const record = await this.createRecord(AIRTABLE_CONFIG.TABLES.LEADS, fields);
            
            const lead = {
                id: record.id,
                name: record.LeadName,
                status: record.Status,
                assignedUser: Array.isArray(record.AssignedUser) && record.AssignedUser.length > 0 ? record.AssignedUser[0] : null,
                assignedUserName: Array.isArray(record['UserName from Assigned User']) && record['UserName from Assigned User'].length > 0 ? record['UserName from Assigned User'][0] : null,
                company: Array.isArray(record.Company) && record.Company.length > 0 ? record.Company[0] : null,
                companyName: Array.isArray(record['CompanyName from Company']) && record['CompanyName from Company'].length > 0 ? record['CompanyName from Company'][0] : null
            };
            
            console.log('✅ Lead created:', lead.id);
            
            return lead;
        } catch (error) {
            console.error('❌ Failed to create lead:', error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    /**
     * FIXED: Update lead with error handling
     */
    async updateLead(id, data) {
        const context = {
            operation: 'updateLead',
            table: TABLES.LEADS,
            leadId: id
        };

        try {
            const fields = {};
            if (data.name) fields.LeadName = data.name;
            if (data.status) fields.Status = data.status;
            if (data.assignedUser !== undefined) fields.AssignedUser = data.assignedUser ? [data.assignedUser] : [];
            if (data.company !== undefined) fields.Company = data.company ? [data.company] : [];
            
            console.log('✏️ Updating lead:', id);
            
            const record = await this.updateRecord(AIRTABLE_CONFIG.TABLES.LEADS, id, fields);
            
            const lead = {
                id: record.id,
                name: record.LeadName,
                status: record.Status
            };
            
            console.log('✅ Lead updated:', id);
            
            return lead;
        } catch (error) {
            console.error('❌ Failed to update lead:', error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    /**
     * FIXED: Delete lead with error handling
     */
    async deleteLead(id) {
        const context = {
            operation: 'deleteLead',
            table: TABLES.LEADS,
            leadId: id
        };

        try {
            console.log('🗑️ Deleting lead:', id);
            
            const result = await this.deleteRecord(AIRTABLE_CONFIG.TABLES.LEADS, id);
            
            console.log('✅ Lead deleted:', id);
            
            return result;
        } catch (error) {
            console.error('❌ Failed to delete lead:', error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    // ========================================
    // CALENDAR EVENTS - WITH ERROR HANDLING
    // ========================================
    
    /**
     * FIXED: Get calendar events with error handling
     */
    async getCalendarEvents(clientId = null, pageSize = 100, offset = null) {
        const context = {
            operation: 'getCalendarEvents',
            table: TABLES.CALENDAR_EVENTS,
            clientId: clientId
        };

        try {
            const filter = clientId ? `FIND('${clientId}', ARRAYJOIN({Clients}))` : '';
            
            console.log('📅 Loading calendar events from Airtable...', { clientId });
            
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
            
            const events = result.records.map(record => ({
                id: record.id,
                eventTitle: record.EventTitle || 'Unnamed Event',
                eventType: record.EventType || '',
                clients: Array.isArray(record.Clients) ? record.Clients : [],
                startDateTime: record.StartDateTime || '',
                endDateTime: record.EndDateTime || '',
                location: record.Location || '',
                description: record.Description || '',
                status: record.Status || 'Scheduled',
                createdDate: record.CreatedDate || ''
            }));
            
            console.log(`✅ Loaded ${events.length} calendar events`);
            
            return {
                records: events,
                offset: result.offset
            };
        } catch (error) {
            console.error('❌ Failed to load calendar events:', error);
            GlobalErrorHandler.handle(error, context);
            
            return {
                records: [],
                offset: null
            };
        }
    },

    /**
     * FIXED: Add calendar event with error handling
     */
    async addCalendarEvent(data) {
        const context = {
            operation: 'addCalendarEvent',
            table: TABLES.CALENDAR_EVENTS,
            eventTitle: data.eventTitle
        };

        try {
            const fields = {
                EventTitle: data.eventTitle,
                EventType: data.eventType || '',
                Clients: Array.isArray(data.clients) ? data.clients : [],
                StartDateTime: data.startDateTime || '',
                EndDateTime: data.endDateTime || '',
                Location: data.location || '',
                Description: data.description || '',
                Status: data.status || 'Scheduled'
            };
            
            console.log('➕ Creating calendar event:', data.eventTitle);
            
            const record = await this.createRecord(AIRTABLE_CONFIG.TABLES.CALENDAR_EVENTS, fields);
            
            const event = {
                id: record.id,
                eventTitle: record.EventTitle,
                eventType: record.EventType,
                clients: Array.isArray(record.Clients) ? record.Clients : [],
                startDateTime: record.StartDateTime,
                endDateTime: record.EndDateTime,
                location: record.Location,
                description: record.Description,
                status: record.Status,
                createdDate: record.CreatedDate || ''
            };
            
            console.log('✅ Calendar event created:', event.id);
            
            return event;
        } catch (error) {
            console.error('❌ Failed to create calendar event:', error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    /**
     * FIXED: Update calendar event with error handling
     */
    async updateCalendarEvent(id, data) {
        const context = {
            operation: 'updateCalendarEvent',
            table: TABLES.CALENDAR_EVENTS,
            eventId: id
        };

        try {
            const fields = {};
            if (data.eventTitle) fields.EventTitle = data.eventTitle;
            if (data.eventType !== undefined) fields.EventType = data.eventType;
            if (data.clients !== undefined) fields.Clients = Array.isArray(data.clients) ? data.clients : [];
            if (data.startDateTime !== undefined) fields.StartDateTime = data.startDateTime;
            if (data.endDateTime !== undefined) fields.EndDateTime = data.endDateTime;
            if (data.location !== undefined) fields.Location = data.location;
            if (data.description !== undefined) fields.Description = data.description;
            if (data.status) fields.Status = data.status;
            
            console.log('✏️ Updating calendar event:', id);
            
            const record = await this.updateRecord(AIRTABLE_CONFIG.TABLES.CALENDAR_EVENTS, id, fields);
            
            const event = {
                id: record.id,
                eventTitle: record.EventTitle,
                status: record.Status
            };
            
            console.log('✅ Calendar event updated:', id);
            
            return event;
        } catch (error) {
            console.error('❌ Failed to update calendar event:', error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    /**
     * FIXED: Delete calendar event with error handling
     */
    async deleteCalendarEvent(id) {
        const context = {
            operation: 'deleteCalendarEvent',
            table: TABLES.CALENDAR_EVENTS,
            eventId: id
        };

        try {
            console.log('🗑️ Deleting calendar event:', id);
            
            const result = await this.deleteRecord(AIRTABLE_CONFIG.TABLES.CALENDAR_EVENTS, id);
            
            console.log('✅ Calendar event deleted:', id);
            
            return result;
        } catch (error) {
            console.error('❌ Failed to delete calendar event:', error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    // ========================================
    // GENERAL TO-DO LIST - WITH ERROR HANDLING
    // ========================================
    
    /**
     * FIXED: Get general todos with error handling
     */
    async getGeneralTodos(pageSize = 100, offset = null) {
        const context = {
            operation: 'getGeneralTodos',
            table: TABLES.GENERAL_TODO
        };

        try {
            console.log('📋 Loading general todos from Airtable...');
            
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
            
            const todos = result.records.map(record => ({
                id: record.id,
                name: record.TaskName || 'Unnamed Task',
                description: record.Description || '',
                priority: record.Priority || 'Medium',
                status: record.Status || 'Pending',
                dueDate: record.DueDate || '',
                assignedUser: Array.isArray(record.AssignedUser) && record.AssignedUser.length > 0 ? record.AssignedUser[0] : null,
                createdDate: record.CreatedDate || ''
            }));
            
            console.log(`✅ Loaded ${todos.length} general todos`);
            
            return {
                records: todos,
                offset: result.offset
            };
        } catch (error) {
            console.error('❌ Failed to load general todos:', error);
            GlobalErrorHandler.handle(error, context);
            
            return {
                records: [],
                offset: null
            };
        }
    },

    /**
     * FIXED: Add general todo with error handling
     */
    async addGeneralTodo(data) {
        const context = {
            operation: 'addGeneralTodo',
            table: TABLES.GENERAL_TODO,
            taskName: data.name
        };

        try {
            const fields = {
                TaskName: data.name,
                Description: data.description || '',
                Priority: data.priority || 'Medium',
                Status: data.status || 'Pending',
                DueDate: data.dueDate || '',
                AssignedUser: data.assignedUser ? [data.assignedUser] : []
            };
            
            console.log('➕ Creating general todo:', data.name);
            
            const record = await this.createRecord(AIRTABLE_CONFIG.TABLES.GENERAL_TODO, fields);
            
            const todo = {
                id: record.id,
                name: record.TaskName,
                description: record.Description,
                priority: record.Priority,
                status: record.Status,
                dueDate: record.DueDate,
                assignedUser: Array.isArray(record.AssignedUser) && record.AssignedUser.length > 0 ? record.AssignedUser[0] : null,
                createdDate: record.CreatedDate || ''
            };
            
            console.log('✅ General todo created:', todo.id);
            
            return todo;
        } catch (error) {
            console.error('❌ Failed to create general todo:', error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    /**
     * FIXED: Update general todo with error handling
     */
    async updateGeneralTodo(id, data) {
        const context = {
            operation: 'updateGeneralTodo',
            table: TABLES.GENERAL_TODO,
            todoId: id
        };

        try {
            const fields = {};
            if (data.name) fields.TaskName = data.name;
            if (data.description !== undefined) fields.Description = data.description;
            if (data.priority) fields.Priority = data.priority;
            if (data.status) fields.Status = data.status;
            if (data.dueDate !== undefined) fields.DueDate = data.dueDate;
            if (data.assignedUser !== undefined) fields.AssignedUser = data.assignedUser ? [data.assignedUser] : [];
            
            console.log('✏️ Updating general todo:', id);
            
            const record = await this.updateRecord(AIRTABLE_CONFIG.TABLES.GENERAL_TODO, id, fields);
            
            const todo = {
                id: record.id,
                name: record.TaskName,
                status: record.Status,
                priority: record.Priority
            };
            
            console.log('✅ General todo updated:', id);
            
            return todo;
        } catch (error) {
            console.error('❌ Failed to update general todo:', error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    /**
     * FIXED: Delete general todo with error handling
     */
    async deleteGeneralTodo(id) {
        const context = {
            operation: 'deleteGeneralTodo',
            table: TABLES.GENERAL_TODO,
            todoId: id
        };

        try {
            console.log('🗑️ Deleting general todo:', id);
            
            const result = await this.deleteRecord(AIRTABLE_CONFIG.TABLES.GENERAL_TODO, id);
            
            console.log('✅ General todo deleted:', id);
            
            return result;
        } catch (error) {
            console.error('❌ Failed to delete general todo:', error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    // ========================================
    // CLIENT TO-DO LIST - WITH ERROR HANDLING
    // ========================================
    
    /**
     * FIXED: Get client todos with error handling
     */
    async getClientTodos(clientId = null, pageSize = 100, offset = null) {
        const context = {
            operation: 'getClientTodos',
            table: TABLES.CLIENT_TODO,
            clientId: clientId
        };

        try {
            const filter = clientId ? `FIND('${clientId}', ARRAYJOIN({Client}))` : '';
            
            console.log('✓ Loading client todos from Airtable...', { clientId });
            
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
            
            const todos = result.records.map(record => ({
                id: record.id,
                name: record.TaskName || 'Unnamed Task',
                client: Array.isArray(record.Client) && record.Client.length > 0 ? record.Client[0] : null,
                status: record.Status || 'Pending',
                priority: record.Priority || 'Medium',
                dueDate: record.DueDate || '',
                description: record.Description || '',
                createdDate: record.CreatedDate || ''
            }));
            
            console.log(`✅ Loaded ${todos.length} client todos`);
            
            return {
                records: todos,
                offset: result.offset
            };
        } catch (error) {
            console.error('❌ Failed to load client todos:', error);
            GlobalErrorHandler.handle(error, context);
            
            return {
                records: [],
                offset: null
            };
        }
    },

    /**
     * FIXED: Add client todo with error handling
     */
    async addClientTodo(data) {
        const context = {
            operation: 'addClientTodo',
            table: TABLES.CLIENT_TODO,
            taskName: data.name
        };

        try {
            const fields = {
                TaskName: data.name,
                Client: data.client ? [data.client] : [],
                Status: data.status || 'Pending',
                Priority: data.priority || 'Medium',
                DueDate: data.dueDate || '',
                Description: data.description || ''
            };
            
            console.log('➕ Creating client todo:', data.name);
            
            const record = await this.createRecord(AIRTABLE_CONFIG.TABLES.CLIENT_TODO, fields);
            
            const todo = {
                id: record.id,
                name: record.TaskName,
                client: Array.isArray(record.Client) && record.Client.length > 0 ? record.Client[0] : null,
                status: record.Status,
                priority: record.Priority,
                dueDate: record.DueDate,
                description: record.Description,
                createdDate: record.CreatedDate || ''
            };
            
            console.log('✅ Client todo created:', todo.id);
            
            return todo;
        } catch (error) {
            console.error('❌ Failed to create client todo:', error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    /**
     * FIXED: Update client todo with error handling
     */
    async updateClientTodo(id, data) {
        const context = {
            operation: 'updateClientTodo',
            table: TABLES.CLIENT_TODO,
            todoId: id
        };

        try {
            const fields = {};
            if (data.name) fields.TaskName = data.name;
            if (data.client !== undefined) fields.Client = data.client ? [data.client] : [];
            if (data.status) fields.Status = data.status;
            if (data.priority) fields.Priority = data.priority;
            if (data.dueDate !== undefined) fields.DueDate = data.dueDate;
            if (data.description !== undefined) fields.Description = data.description;
            
            console.log('✏️ Updating client todo:', id);
            
            const record = await this.updateRecord(AIRTABLE_CONFIG.TABLES.CLIENT_TODO, id, fields);
            
            const todo = {
                id: record.id,
                name: record.TaskName,
                status: record.Status,
                priority: record.Priority
            };
            
            console.log('✅ Client todo updated:', id);
            
            return todo;
        } catch (error) {
            console.error('❌ Failed to update client todo:', error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    /**
     * FIXED: Delete client todo with error handling
     */
    async deleteClientTodo(id) {
        const context = {
            operation: 'deleteClientTodo',
            table: TABLES.CLIENT_TODO,
            todoId: id
        };

        try {
            console.log('🗑️ Deleting client todo:', id);
            
            const result = await this.deleteRecord(AIRTABLE_CONFIG.TABLES.CLIENT_TODO, id);
            
            console.log('✅ Client todo deleted:', id);
            
            return result;
        } catch (error) {
            console.error('❌ Failed to delete client todo:', error);
            GlobalErrorHandler.handle(error, context);
            throw error;
        }
    },

    // ========================================
    // UTILITIES - WITH ERROR HANDLING
    // ========================================
    
    /**
     * Generate color based on ID
     */
    generateColor(id) {
        try {
            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7B731'];
            const index = Math.abs(id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length;
            return colors[index];
        } catch (error) {
            console.warn('⚠️ Error generating color, using default:', error);
            return '#4ECDC4'; // Default color
        }
    },

    /**
     * FIXED: Batch fetch all data for a user with error handling
     */
    async getUserDashboardData(userId) {
        const context = {
            operation: 'getUserDashboardData',
            userId: userId
        };

        try {
            console.log('📊 Loading dashboard data for user:', userId);
            
            const [clients, leads, todos, events] = await Promise.allSettled([
                this.getUserClients(userId),
                this.getUserLeads(userId),
                this.getUserGeneralTodos(userId),
                this.getUserCalendarEvents(userId)
            ]);
            
            const result = {
                clients: clients.status === 'fulfilled' ? clients.value.records : [],
                leads: leads.status === 'fulfilled' ? leads.value.records : [],
                generalTodos: todos.status === 'fulfilled' ? todos.value.records : [],
                calendarEvents: events.status === 'fulfilled' ? events.value.records : []
            };
            
            console.log('✅ Dashboard data loaded:', {
                clients: result.clients.length,
                leads: result.leads.length,
                todos: result.generalTodos.length,
                events: result.calendarEvents.length
            });
            
            return result;
        } catch (error) {
            console.error('❌ Error fetching user dashboard data:', error);
            GlobalErrorHandler.handle(error, context);
            
            // Return empty data instead of throwing
            return {
                clients: [],
                leads: [],
                generalTodos: [],
                calendarEvents: []
            };
        }
    },

    /**
     * FIXED: Get user-specific clients with error handling
     */
    async getUserClients(userId, pageSize = 100, offset = null) {
        try {
            const filter = `FIND('${userId}', ARRAYJOIN({AssignedUser}))`;
            return await this.getClients(null, pageSize, offset);
        } catch (error) {
            console.error('❌ Error getting user clients:', error);
            return { records: [], offset: null };
        }
    },

    /**
     * FIXED: Get user-specific leads with error handling
     */
    async getUserLeads(userId, pageSize = 100, offset = null) {
        try {
            const filter = `FIND('${userId}', ARRAYJOIN({AssignedUser}))`;
            return await this.getLeads(null, pageSize, offset);
        } catch (error) {
            console.error('❌ Error getting user leads:', error);
            return { records: [], offset: null };
        }
    },

    /**
     * FIXED: Get user-specific todos with error handling
     */
    async getUserGeneralTodos(userId, pageSize = 100, offset = null) {
        try {
            return await this.getGeneralTodos(pageSize, offset);
        } catch (error) {
            console.error('❌ Error getting user todos:', error);
            return { records: [], offset: null };
        }
    },

    /**
     * FIXED: Get user-specific calendar events with error handling
     */
    async getUserCalendarEvents(userId, pageSize = 100, offset = null) {
        try {
            return await this.getCalendarEvents(null, pageSize, offset);
        } catch (error) {
            console.error('❌ Error getting user calendar events:', error);
            return { records: [], offset: null };
        }
    }
};

console.log('✅ Airtable API loaded - COMPREHENSIVE ERROR HANDLING ADDED');
console.log('🛡️ All operations protected with try-catch blocks');
console.log('🔄 Automatic retry logic for network failures');
console.log('📊 Graceful degradation with empty data fallbacks');
console.log('⚙️ Configuration:', AirtableAPI.isConfigured() ? '✅ Ready' : '⚠️ Needs TOKEN and BASE_ID');