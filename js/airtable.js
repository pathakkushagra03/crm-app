// ========================================
// AIRTABLE CONFIG (SAFE MODE)
// ========================================

// 🔴 KEEP THIS FALSE UNTIL EVERYTHING WORKS
const USE_AIRTABLE = false;

// 🟡 ONLY FILL THESE WHEN READY
const AirtableConfig = {
    API_KEY: '',      // paste your key later
    BASE_ID: '',      // paste your base id later
};

// ========================================
// AIRTABLE API WRAPPER
// ========================================

const AirtableAPI = {

    isConfigured() {
        return USE_AIRTABLE &&
               AirtableConfig.API_KEY &&
               AirtableConfig.BASE_ID;
    },

    // ===============================
    // GENERIC REQUEST
    // ===============================
    async request(table, method = 'GET', data = null, recordId = '') {
        if (!this.isConfigured()) {
            throw new Error('Airtable not configured');
        }

        const url =
            `https://api.airtable.com/v0/${AirtableConfig.BASE_ID}/${table}` +
            (recordId ? `/${recordId}` : '');

        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${AirtableConfig.API_KEY}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify({ fields: data });
        }

        const res = await fetch(url, options);
        if (!res.ok) throw new Error('Airtable request failed');
        return await res.json();
    },

    // ===============================
    // COMPANIES
    // ===============================
    async getCompanies() {
        return this.request('Companies');
    },

    async addCompany(data) {
        return this.request('Companies', 'POST', data);
    },

    async updateCompany(id, data) {
        return this.request('Companies', 'PATCH', data, id);
    },

    async deleteCompany(id) {
        return this.request('Companies', 'DELETE', null, id);
    },

    // ===============================
    // CLIENTS
    // ===============================
    async getClients() {
        return this.request('Clients');
    },

    async addClient(data) {
        return this.request('Clients', 'POST', data);
    },

    async updateClient(id, data) {
        return this.request('Clients', 'PATCH', data, id);
    },

    async deleteClient(id) {
        return this.request('Clients', 'DELETE', null, id);
    },

    // ===============================
    // LEADS
    // ===============================
    async getLeads() {
        return this.request('Leads');
    },

    async addLead(data) {
        return this.request('Leads', 'POST', data);
    },

    async updateLead(id, data) {
        return this.request('Leads', 'PATCH', data, id);
    },

    async deleteLead(id) {
        return this.request('Leads', 'DELETE', null, id);
    },

    // ===============================
    // TASKS
    // ===============================
    async getTasks() {
        return this.request('Tasks');
    },

    async addTask(data) {
        return this.request('Tasks', 'POST', data);
    },

    async updateTask(id, data) {
        return this.request('Tasks', 'PATCH', data, id);
    },

    async deleteTask(id) {
        return this.request('Tasks', 'DELETE', null, id);
    }
};

console.log('✅ Airtable API loaded (Demo mode)');
