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