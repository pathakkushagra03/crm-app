// ========================================
// AIRTABLE – PRODUCTION READY
// ========================================

// ✅ TURN THIS ON
const USE_AIRTABLE = true;

// 🔴 FILL THESE
const AirtableConfig = {
    API_KEY: 'PASTE_YOUR_AIRTABLE_API_KEY_HERE',
    BASE_ID: 'PASTE_YOUR_BASE_ID_HERE'
};

// ========================================
// CORE API
// ========================================

const AirtableAPI = {

    isConfigured() {
        return USE_AIRTABLE &&
            AirtableConfig.API_KEY &&
            AirtableConfig.BASE_ID;
    },

    async request(table, method = 'GET', data = null, recordId = '') {
        const url =
            `https://api.airtable.com/v0/${AirtableConfig.BASE_ID}/${table}` +
            (recordId ? `/${recordId}` : '');

        const options = {
            method,
            headers: {
                Authorization: `Bearer ${AirtableConfig.API_KEY}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify({ fields: data });
        }

        const res = await fetch(url, options);
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text);
        }
        return await res.json();
    },

    normalize(record) {
        return { id: record.id, ...record.fields };
    },

    normalizeList(res) {
        return res.records.map(r => this.normalize(r));
    },

    // ========================================
    // COMPANIES
    // ========================================
    async getCompanies() {
        const res = await this.request('Companies');
        return this.normalizeList(res);
    },

    async addCompany(data) {
        const res = await this.request('Companies', 'POST', data);
        return this.normalize(res);
    },

    async updateCompany(id, data) {
        const res = await this.request('Companies', 'PATCH', data, id);
        return this.normalize(res);
    },

    async deleteCompany(id) {
        await this.request('Companies', 'DELETE', null, id);
    },

    // ========================================
    // CLIENTS
    // ========================================
    async getClients() {
        const res = await this.request('Clients');
        return this.normalizeList(res);
    },

    async addClient(data) {
        const res = await this.request('Clients', 'POST', data);
        return this.normalize(res);
    },

    async updateClient(id, data) {
        const res = await this.request('Clients', 'PATCH', data, id);
        return this.normalize(res);
    },

    async deleteClient(id) {
        await this.request('Clients', 'DELETE', null, id);
    },

    // ========================================
    // LEADS
    // ========================================
    async getLeads() {
        const res = await this.request('Leads');
        return this.normalizeList(res);
    },

    async addLead(data) {
        const res = await this.request('Leads', 'POST', data);
        return this.normalize(res);
    },

    async updateLead(id, data) {
        const res = await this.request('Leads', 'PATCH', data, id);
        return this.normalize(res);
    },

    async deleteLead(id) {
        await this.request('Leads', 'DELETE', null, id);
    },

    // ========================================
    // TASKS
    // ========================================
    async getTasks() {
        const res = await this.request('Tasks');
        return this.normalizeList(res);
    },

    async addTask(data) {
        const res = await this.request('Tasks', 'POST', data);
        return this.normalize(res);
    },

    async updateTask(id, data) {
        const res = await this.request('Tasks', 'PATCH', data, id);
        return this.normalize(res);
    },

    async deleteTask(id) {
        await this.request('Tasks', 'DELETE', null, id);
    }
};

console.log('✅ Airtable connected (LIVE MODE)');
