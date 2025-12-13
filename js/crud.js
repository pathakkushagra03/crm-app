// ========================================
// CRUD OPERATIONS & MODAL MANAGEMENT (FIXED)
// ========================================

const CRUDManager = {

    // ---------- TOAST ----------
    showToast(message, type = 'success') {
        let c = document.querySelector('.toast-container');
        if (!c) {
            c = document.createElement('div');
            c.className = 'toast-container';
            document.body.appendChild(c);
        }
        const t = document.createElement('div');
        t.className = `toast toast-${type}`;
        t.innerHTML = `<div>${message}</div>`;
        c.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    },

    // ---------- MODAL ----------
    createModal(title, content, footer) {
        const o = document.createElement('div');
        o.className = 'modal-overlay';
        o.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">${content}</div>
                ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
            </div>
        `;
        return o;
    },

    // ---------- FORM HELPERS ----------
    validateForm(form) {
        return [...form.querySelectorAll('[required]')].every(i => i.value.trim());
    },

    getFormData(form) {
        return Object.fromEntries(new FormData(form));
    },

    // ---------- COMPANY ----------
    showAddCompanyForm() {
        const content = `
            <form id="addCompanyForm">
                <input name="name" placeholder="Company name" required />
            </form>`;
        const footer = `
            <button onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button onclick="CRUDManager.submitAddCompany()">Create</button>`;
        document.body.appendChild(this.createModal('Add Company', content, footer));
    },

    submitAddCompany() {
        const f = document.getElementById('addCompanyForm');
        if (!this.validateForm(f)) return;
        AppState.data.companies.push({
            id: Date.now().toString(),
            name: this.getFormData(f).name
        });
        document.querySelector('.modal-overlay').remove();
        render();
    }
};

console.log('CRUD fixed');
