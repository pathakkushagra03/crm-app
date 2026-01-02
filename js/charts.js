// ========================================
// FILE: js/charts.js
// PURPOSE: Chart management with comprehensive error handling
// DEPENDENCIES: GlobalErrorHandler, Chart.js, AppState
// ========================================

// ========================================
// DEFENSIVE DEPENDENCY WRAPPERS
// ========================================

/**
 * Safe wrapper for GlobalErrorHandler.handle()
 * Falls back to console logging if GlobalErrorHandler unavailable
 */
function safeHandleError(error, options = {}) {
    try {
        if (typeof GlobalErrorHandler !== 'undefined' && GlobalErrorHandler && typeof GlobalErrorHandler.handle === 'function') {
            GlobalErrorHandler.handle(error, options);
        } else {
            console.error(`[CHARTS ERROR] ${options.context || 'Unknown'}:`, error);
            if (options.userMessage && !options.silent) {
                console.warn(`[CHARTS USER MESSAGE] ${options.userMessage}`);
            }
            if (options.metadata) {
                console.info('[CHARTS METADATA]', options.metadata);
            }
        }
    } catch (handlerError) {
        console.error('[CHARTS] Error handler failed:', handlerError);
        console.error('[CHARTS] Original error:', error);
    }
}

/**
 * Safe wrapper for CRUDManager.showToast()
 */
function safeShowToast(message, type = 'info') {
    try {
        if (typeof CRUDManager !== 'undefined' && CRUDManager && typeof CRUDManager.showToast === 'function') {
            CRUDManager.showToast(message, type);
        } else {
            console.log(`[TOAST ${type.toUpperCase()}] ${message}`);
        }
    } catch (error) {
        console.error('[CHARTS] Toast failed:', error);
    }
}

/**
 * Check if Chart.js is available
 */
function isChartJsAvailable() {
    return typeof Chart !== 'undefined' && Chart && typeof Chart === 'function';
}

/**
 * Check if AppState is available and has data
 */
function isAppStateAvailable() {
    return typeof AppState !== 'undefined' && 
           AppState && 
           AppState.data &&
           typeof AppState.data === 'object';
}

/**
 * Safely get array from AppState.data
 * @param {string} key - The data key (clients, leads, etc.)
 * @returns {Array} The data array or empty array if invalid
 */
function getAppStateData(key) {
    try {
        if (!isAppStateAvailable()) {
            console.warn('[CHARTS] AppState not available');
            return [];
        }
        
        const data = AppState.data[key];
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(`[CHARTS] Error getting AppState.data.${key}:`, error);
        return [];
    }
}

/**
 * Safely get selected company ID
 */
function getSelectedCompany() {
    try {
        if (!isAppStateAvailable()) return null;
        return AppState.selectedCompany || null;
    } catch (error) {
        console.error('[CHARTS] Error getting selected company:', error);
        return null;
    }
}

// ========================================
// CHART INSTANCE MANAGEMENT
// ========================================

let chartInstances = {
    clients: null,
    leads: null,
    tasks: null
};

/**
 * ENHANCED: Destroy existing chart if it exists with error handling
 */
function destroyChart(chartKey) {
    try {
        if (!chartKey || typeof chartKey !== 'string') {
            console.warn('[CHARTS] Invalid chart key provided to destroyChart');
            return;
        }
        
        if (chartInstances[chartKey]) {
            try {
                chartInstances[chartKey].destroy();
            } catch (destroyError) {
                console.warn(`[CHARTS] Error destroying chart ${chartKey}:`, destroyError);
            }
            chartInstances[chartKey] = null;
        }
    } catch (error) {
        console.error('[CHARTS] Error in destroyChart:', error);
    }
}

/**
 * ENHANCED: Update all dashboard charts with error handling
 */
function updateCharts() {
    try {
        const selectedCompany = getSelectedCompany();
        
        if (!selectedCompany) {
            console.warn('[CHARTS] No company selected, skipping chart update');
            return;
        }
        
        if (!isChartJsAvailable()) {
            safeHandleError(new Error('Chart.js library not loaded'), {
                context: 'updateCharts',
                userMessage: 'Chart library unavailable. Charts cannot be displayed.',
                severity: 'medium',
                silent: false,
                metadata: {
                    selectedCompany: selectedCompany
                }
            });
            return;
        }
        
        // Update each chart independently with error isolation
        try {
            updateClientsChart();
        } catch (error) {
            console.error('[CHARTS] Failed to update clients chart:', error);
        }
        
        try {
            updateLeadsChart();
        } catch (error) {
            console.error('[CHARTS] Failed to update leads chart:', error);
        }
        
        try {
            updateTasksChart();
        } catch (error) {
            console.error('[CHARTS] Failed to update tasks chart:', error);
        }
        
    } catch (error) {
        safeHandleError(error, {
            context: 'updateCharts',
            userMessage: 'Error updating charts',
            severity: 'medium',
            silent: true,
            metadata: {
                chartJsAvailable: isChartJsAvailable(),
                appStateAvailable: isAppStateAvailable()
            }
        });
    }
}

// ========================================
// COMMON CHART OPTIONS
// ========================================

const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    layout: {
        padding: {
            top: 20,
            bottom: 20,
            left: 10,
            right: 10
        }
    },
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                color: 'white',
                padding: 20,
                font: {
                    size: 14,
                    weight: '600',
                    family: "'Inter', sans-serif"
                },
                boxWidth: 20,
                boxHeight: 20,
                usePointStyle: true,
                pointStyle: 'circle'
            }
        },
        tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            borderWidth: 2,
            padding: 16,
            displayColors: true,
            titleFont: {
                size: 16,
                weight: 'bold',
                family: "'Inter', sans-serif"
            },
            bodyFont: {
                size: 14,
                family: "'Inter', sans-serif"
            },
            cornerRadius: 8
        }
    }
};

// ========================================
// CHART UPDATE FUNCTIONS - ENHANCED
// ========================================

/**
 * ENHANCED: Clients Status Chart with comprehensive error handling
 */
function updateClientsChart() {
    const chartKey = 'clients';
    
    try {
        // Validate Chart.js availability
        if (!isChartJsAvailable()) {
            throw new Error('Chart.js library not available');
        }
        
        // Get canvas element
        const canvas = document.getElementById('clientsChart');
        if (!canvas) {
            console.warn('[CHARTS] clientsChart canvas not found');
            return;
        }
        
        // Destroy existing chart
        destroyChart(chartKey);
        
        // Get and validate data
        const selectedCompany = getSelectedCompany();
        if (!selectedCompany) {
            console.warn('[CHARTS] No company selected for clients chart');
            return;
        }
        
        const allClients = getAppStateData('clients');
        const clients = allClients.filter(c => c && c.company === selectedCompany);
        
        if (clients.length === 0) {
            console.info('[CHARTS] No clients data available for chart');
            // Could render "no data" message on canvas
            return;
        }
        
        // Count by status with validation
        const statusCounts = {};
        clients.forEach(client => {
            try {
                const status = client.status || 'Unknown';
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            } catch (clientError) {
                console.warn('[CHARTS] Invalid client object:', clientError);
            }
        });
        
        const labels = Object.keys(statusCounts);
        const data = Object.values(statusCounts);
        
        if (labels.length === 0 || data.length === 0) {
            console.warn('[CHARTS] No valid client status data to display');
            return;
        }
        
        // Color scheme for client statuses
        const colors = {
            'Active': 'rgba(39, 174, 96, 0.95)',
            'Inactive': 'rgba(149, 165, 166, 0.95)',
            'On Hold': 'rgba(243, 156, 18, 0.95)',
            'VIP': 'rgba(241, 196, 15, 0.95)',
            'Churned': 'rgba(231, 76, 60, 0.95)',
            'Pending': 'rgba(52, 152, 219, 0.95)'
        };
        
        const backgroundColors = labels.map(label => colors[label] || 'rgba(155, 89, 182, 0.95)');
        const borderColors = labels.map(label => {
            const color = colors[label] || 'rgba(155, 89, 182, 0.95)';
            return color.replace('0.95', '1');
        });
        
        // Add 3D shadow effect to canvas
        try {
            canvas.style.filter = 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4))';
            canvas.style.transform = 'perspective(1000px) rotateX(5deg)';
            canvas.style.transformStyle = 'preserve-3d';
        } catch (styleError) {
            console.warn('[CHARTS] Failed to apply canvas styles:', styleError);
        }
        
        // Create chart
        try {
            chartInstances[chartKey] = new Chart(canvas, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Clients by Status',
                        data: data,
                        backgroundColor: backgroundColors,
                        borderColor: borderColors,
                        borderWidth: 3,
                        hoverOffset: 15,
                        offset: 5
                    }]
                },
                options: {
                    ...commonChartOptions,
                    cutout: '50%',
                    plugins: {
                        ...commonChartOptions.plugins,
                        legend: {
                            ...commonChartOptions.plugins.legend,
                            labels: {
                                ...commonChartOptions.plugins.legend.labels,
                                generateLabels: function(chart) {
                                    try {
                                        const data = chart.data;
                                        if (data.labels.length && data.datasets.length) {
                                            return data.labels.map((label, i) => {
                                                const value = data.datasets[0].data[i];
                                                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                                return {
                                                    text: `${label}: ${value} (${percentage}%)`,
                                                    fillStyle: data.datasets[0].backgroundColor[i],
                                                    hidden: false,
                                                    index: i
                                                };
                                            });
                                        }
                                        return [];
                                    } catch (labelError) {
                                        console.error('[CHARTS] Error generating labels:', labelError);
                                        return [];
                                    }
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: 'CLIENTS BY STATUS',
                            color: 'white',
                            font: {
                                size: 18,
                                weight: 'bold',
                                family: "'Inter', sans-serif"
                            },
                            padding: {
                                top: 10,
                                bottom: 20
                            }
                        },
                        tooltip: {
                            ...commonChartOptions.plugins.tooltip,
                            callbacks: {
                                label: function(context) {
                                    try {
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                                        return `${context.label}: ${context.parsed} clients (${percentage}%)`;
                                    } catch (error) {
                                        return `${context.label}: ${context.parsed} clients`;
                                    }
                                }
                            }
                        }
                    }
                }
            });
            
            console.log('[CHARTS] Clients chart created successfully');
            
        } catch (chartError) {
            throw new Error('Failed to create clients chart: ' + chartError.message);
        }
        
    } catch (error) {
        safeHandleError(error, {
            context: 'updateClientsChart',
            userMessage: 'Failed to create clients chart',
            severity: 'low',
            silent: true,
            metadata: {
                chartKey: chartKey,
                chartJsAvailable: isChartJsAvailable(),
                canvasExists: !!document.getElementById('clientsChart')
            }
        });
    }
}

/**
 * ENHANCED: Leads Status Chart with comprehensive error handling
 */
function updateLeadsChart() {
    const chartKey = 'leads';
    
    try {
        if (!isChartJsAvailable()) {
            throw new Error('Chart.js library not available');
        }
        
        const canvas = document.getElementById('leadsChart');
        if (!canvas) {
            console.warn('[CHARTS] leadsChart canvas not found');
            return;
        }
        
        destroyChart(chartKey);
        
        const selectedCompany = getSelectedCompany();
        if (!selectedCompany) {
            console.warn('[CHARTS] No company selected for leads chart');
            return;
        }
        
        const allLeads = getAppStateData('leads');
        const leads = allLeads.filter(l => l && l.company === selectedCompany);
        
        if (leads.length === 0) {
            console.info('[CHARTS] No leads data available for chart');
            return;
        }
        
        // Count by status with validation
        const statusCounts = {};
        leads.forEach(lead => {
            try {
                const status = lead.status || 'Unknown';
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            } catch (leadError) {
                console.warn('[CHARTS] Invalid lead object:', leadError);
            }
        });
        
        const labels = Object.keys(statusCounts);
        const data = Object.values(statusCounts);
        
        if (labels.length === 0 || data.length === 0) {
            console.warn('[CHARTS] No valid lead status data to display');
            return;
        }
        
        // Color scheme for lead statuses
        const colors = {
            'New': 'rgba(52, 152, 219, 0.95)',
            'Contacted': 'rgba(155, 89, 182, 0.95)',
            'Qualified': 'rgba(26, 188, 156, 0.95)',
            'Proposal Sent': 'rgba(230, 126, 34, 0.95)',
            'Won': 'rgba(39, 174, 96, 0.95)',
            'Lost': 'rgba(231, 76, 60, 0.95)'
        };
        
        const backgroundColors = labels.map(label => colors[label] || 'rgba(149, 165, 166, 0.95)');
        const borderColors = labels.map(label => {
            const color = colors[label] || 'rgba(149, 165, 166, 0.95)';
            return color.replace('0.95', '1');
        });
        
        // Add 3D shadow effect to canvas
        try {
            canvas.style.filter = 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4))';
            canvas.style.transform = 'perspective(1000px) rotateX(5deg)';
            canvas.style.transformStyle = 'preserve-3d';
        } catch (styleError) {
            console.warn('[CHARTS] Failed to apply canvas styles:', styleError);
        }
        
        // Create chart
        try {
            chartInstances[chartKey] = new Chart(canvas, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Leads by Status',
                        data: data,
                        backgroundColor: backgroundColors,
                        borderColor: borderColors,
                        borderWidth: 3,
                        hoverOffset: 15
                    }]
                },
                options: {
                    ...commonChartOptions,
                    plugins: {
                        ...commonChartOptions.plugins,
                        legend: {
                            ...commonChartOptions.plugins.legend,
                            labels: {
                                ...commonChartOptions.plugins.legend.labels,
                                generateLabels: function(chart) {
                                    try {
                                        const data = chart.data;
                                        if (data.labels.length && data.datasets.length) {
                                            return data.labels.map((label, i) => {
                                                const value = data.datasets[0].data[i];
                                                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                                return {
                                                    text: `${label}: ${value} (${percentage}%)`,
                                                    fillStyle: data.datasets[0].backgroundColor[i],
                                                    hidden: false,
                                                    index: i
                                                };
                                            });
                                        }
                                        return [];
                                    } catch (labelError) {
                                        console.error('[CHARTS] Error generating labels:', labelError);
                                        return [];
                                    }
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: 'LEADS BY STATUS',
                            color: 'white',
                            font: {
                                size: 18,
                                weight: 'bold',
                                family: "'Inter', sans-serif"
                            },
                            padding: {
                                top: 10,
                                bottom: 20
                            }
                        },
                        tooltip: {
                            ...commonChartOptions.plugins.tooltip,
                            callbacks: {
                                label: function(context) {
                                    try {
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                                        return `${context.label}: ${context.parsed} leads (${percentage}%)`;
                                    } catch (error) {
                                        return `${context.label}: ${context.parsed} leads`;
                                    }
                                }
                            }
                        }
                    }
                }
            });
            
            console.log('[CHARTS] Leads chart created successfully');
            
        } catch (chartError) {
            throw new Error('Failed to create leads chart: ' + chartError.message);
        }
        
    } catch (error) {
        safeHandleError(error, {
            context: 'updateLeadsChart',
            userMessage: 'Failed to create leads chart',
            severity: 'low',
            silent: true,
            metadata: {
                chartKey: chartKey,
                chartJsAvailable: isChartJsAvailable(),
                canvasExists: !!document.getElementById('leadsChart')
            }
        });
    }
}

/**
 * ENHANCED: Tasks Priority & Status Chart with comprehensive error handling
 */
function updateTasksChart() {
    const chartKey = 'tasks';
    
    try {
        if (!isChartJsAvailable()) {
            throw new Error('Chart.js library not available');
        }
        
        const canvas = document.getElementById('tasksChart');
        if (!canvas) {
            console.warn('[CHARTS] tasksChart canvas not found');
            return;
        }
        
        destroyChart(chartKey);
        
        const selectedCompany = getSelectedCompany();
        if (!selectedCompany) {
            console.warn('[CHARTS] No company selected for tasks chart');
            return;
        }
        
        const allTasks = getAppStateData('generalTodos');
        const tasks = allTasks.filter(t => t && t.company === selectedCompany);
        
        if (tasks.length === 0) {
            console.info('[CHARTS] No tasks data available for chart');
            return;
        }
        
        // Count by priority with validation
        const priorityCounts = {
            'High': 0,
            'Medium': 0,
            'Low': 0
        };
        
        tasks.forEach(task => {
            try {
                const priority = task.priority || 'Medium';
                if (priorityCounts.hasOwnProperty(priority)) {
                    priorityCounts[priority]++;
                }
            } catch (taskError) {
                console.warn('[CHARTS] Invalid task object:', taskError);
            }
        });
        
        // Add 3D shadow effect to canvas
        try {
            canvas.style.filter = 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4))';
            canvas.style.transform = 'perspective(1000px) rotateX(5deg)';
            canvas.style.transformStyle = 'preserve-3d';
        } catch (styleError) {
            console.warn('[CHARTS] Failed to apply canvas styles:', styleError);
        }
        
        // Create chart
        try {
            chartInstances[chartKey] = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: ['High Priority', 'Medium Priority', 'Low Priority'],
                    datasets: [{
                        label: 'Number of Tasks',
                        data: [priorityCounts.High, priorityCounts.Medium, priorityCounts.Low],
                        backgroundColor: [
                            'rgba(255, 107, 107, 0.95)',
                            'rgba(247, 183, 49, 0.95)',
                            'rgba(46, 204, 113, 0.95)'
                        ],
                        borderColor: [
                            'rgba(255, 107, 107, 1)',
                            'rgba(247, 183, 49, 1)',
                            'rgba(46, 204, 113, 1)'
                        ],
                        borderWidth: 3,
                        borderRadius: 12,
                        borderSkipped: false,
                        barThickness: 60,
                        hoverBackgroundColor: [
                            'rgba(255, 107, 107, 1)',
                            'rgba(247, 183, 49, 1)',
                            'rgba(46, 204, 113, 1)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    layout: {
                        padding: {
                            top: 20,
                            bottom: 10,
                            left: 10,
                            right: 10
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: 'white',
                                stepSize: 1,
                                font: {
                                    size: 14,
                                    weight: '600',
                                    family: "'Inter', sans-serif"
                                }
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.15)',
                                drawBorder: false,
                                lineWidth: 2
                            },
                            title: {
                                display: true,
                                text: 'Number of Tasks',
                                color: 'white',
                                font: {
                                    size: 14,
                                    weight: 'bold',
                                    family: "'Inter', sans-serif"
                                },
                                padding: 10
                            }
                        },
                        x: {
                            ticks: {
                                color: 'white',
                                font: {
                                    size: 13,
                                    weight: '600',
                                    family: "'Inter', sans-serif"
                                }
                            },
                            grid: {
                                display: false
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'TASKS BY PRIORITY',
                            color: 'white',
                            font: {
                                size: 18,
                                weight: 'bold',
                                family: "'Inter', sans-serif"
                            },
                            padding: {
                                top: 10,
                                bottom: 20
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                            titleColor: 'white',
                            bodyColor: 'white',
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            borderWidth: 2,
                            padding: 16,
                            displayColors: false,
                            titleFont: {
                                size: 16,
                                weight: 'bold',
                                family: "'Inter', sans-serif"
                            },
                            bodyFont: {
                                size: 14,
                                family: "'Inter', sans-serif"
                            },
                            cornerRadius: 8,
                            callbacks: {
                                title: function(context) {
                                    try {
                                        return context[0].label;
                                    } catch (error) {
                                        return 'Task';
                                    }
                                },
                                label: function(context) {
                                    try {
                                        return `Tasks: ${context.parsed.y}`;
                                    } catch (error) {
                                        return 'Tasks';
                                    }
                                }
                            }
                        }
                    }
                }
            });
            
            console.log('[CHARTS] Tasks chart created successfully');
            
        } catch (chartError) {
            throw new Error('Failed to create tasks chart: ' + chartError.message);
        }
        
    } catch (error) {
        safeHandleError(error, {
            context: 'updateTasksChart',
            userMessage: 'Failed to create tasks chart',
            severity: 'low',
            silent: true,
            metadata: {
                chartKey: chartKey,
                chartJsAvailable: isChartJsAvailable(),
                canvasExists: !!document.getElementById('tasksChart')
            }
        });
    }
}

// ========================================
// CHART EXPORT & STATISTICS - ENHANCED
// ========================================

/**
 * ENHANCED: Export chart as image with comprehensive error handling
 */
function exportChart(chartKey, filename) {
    try {
        // Validate input
        if (!chartKey || typeof chartKey !== 'string') {
            throw new Error('Invalid chart key provided');
        }
        
        // Check if chart exists
        const chart = chartInstances[chartKey];
        if (!chart) {
            throw new Error(`Chart not found: ${chartKey}`);
        }
        
        // Validate chart has toBase64Image method
        if (typeof chart.toBase64Image !== 'function') {
            throw new Error('Chart does not support image export');
        }
        
        // Generate image
        let url;
        try {
            url = chart.toBase64Image();
        } catch (imageError) {
            throw new Error('Failed to generate chart image: ' + imageError.message);
        }
        
        if (!url || typeof url !== 'string') {
            throw new Error('Invalid image data generated');
        }
        
        // Create download link
        const link = document.createElement('a');
        link.download = filename || `${chartKey}-chart.png`;
        link.href = url;
        
        try {
            link.click();
        } catch (clickError) {
            throw new Error('Failed to trigger download: ' + clickError.message);
        }
        
        console.log(`[CHARTS] Chart exported successfully: ${chartKey}`);
        safeShowToast(`✅ Chart exported: ${link.download}`, 'success');
        
    } catch (error) {
        safeHandleError(error, {
            context: 'exportChart',
            userMessage: 'Failed to export chart. Please try again.',
            severity: 'medium',
            silent: false,
            metadata: {
                chartKey: chartKey,
                filename: filename,
                chartExists: !!chartInstances[chartKey],
                chartJsAvailable: isChartJsAvailable()
            }
        });
    }
}

/**
 * ENHANCED: Get chart statistics with comprehensive error handling
 */
function getChartStats() {
    const defaultStats = {
        clients: {
            total: 0,
            active: 0,
            vip: 0
        },
        leads: {
            total: 0,
            new: 0,
            won: 0,
            conversionRate: 0
        },
        tasks: {
            total: 0,
            completed: 0,
            pending: 0,
            completionRate: 0
        }
    };
    
    try {
        const selectedCompany = getSelectedCompany();
        if (!selectedCompany) {
            console.warn('[CHARTS] No company selected for stats');
            return defaultStats;
        }
        
        // Get and filter data with validation
        let clients = [];
        let leads = [];
        let tasks = [];
        
        try {
            const allClients = getAppStateData('clients');
            clients = allClients.filter(c => c && c.company === selectedCompany);
        } catch (clientError) {
            console.warn('[CHARTS] Error filtering clients:', clientError);
        }
        
        try {
            const allLeads = getAppStateData('leads');
            leads = allLeads.filter(l => l && l.company === selectedCompany);
        } catch (leadError) {
            console.warn('[CHARTS] Error filtering leads:', leadError);
        }
        
        try {
            const allTasks = getAppStateData('generalTodos');
            tasks = allTasks.filter(t => t && t.company === selectedCompany);
        } catch (taskError) {
            console.warn('[CHARTS] Error filtering tasks:', taskError);
        }
        
        // Calculate stats with safe fallbacks
        const stats = { ...defaultStats };
        
        // Client stats
        try {
            stats.clients.total = clients.length;
            stats.clients.active = clients.filter(c => c && c.status === 'Active').length;
            stats.clients.vip = clients.filter(c => c && c.status === 'VIP').length;
        } catch (clientStatsError) {
            console.warn('[CHARTS] Error calculating client stats:', clientStatsError);
        }
        
        // Lead stats
        try {
            stats.leads.total = leads.length;
            stats.leads.new = leads.filter(l => l && l.status === 'New').length;
            stats.leads.won = leads.filter(l => l && l.status === 'Won').length;
            
            if (leads.length > 0) {
                const conversionRate = (stats.leads.won / leads.length) * 100;
                stats.leads.conversionRate = isNaN(conversionRate) ? 0 : conversionRate.toFixed(1);
            }
        } catch (leadStatsError) {
            console.warn('[CHARTS] Error calculating lead stats:', leadStatsError);
        }
        
        // Task stats
        try {
            stats.tasks.total = tasks.length;
            stats.tasks.completed = tasks.filter(t => t && t.status === 'Completed').length;
            stats.tasks.pending = tasks.filter(t => t && t.status === 'Pending').length;
            
            if (tasks.length > 0) {
                const completionRate = (stats.tasks.completed / tasks.length) * 100;
                stats.tasks.completionRate = isNaN(completionRate) ? 0 : completionRate.toFixed(1);
            }
        } catch (taskStatsError) {
            console.warn('[CHARTS] Error calculating task stats:', taskStatsError);
        }
        
        return stats;
        
    } catch (error) {
        safeHandleError(error, {
            context: 'getChartStats',
            userMessage: 'Error calculating chart statistics',
            severity: 'low',
            silent: true,
            metadata: {
                appStateAvailable: isAppStateAvailable(),
                selectedCompany: getSelectedCompany()
            }
        });
        
        return defaultStats;
    }
}

/**
 * ENHANCED: Render chart statistics summary with error handling
 */
function renderChartStats() {
    try {
        const stats = getChartStats();
        
        if (!stats) {
            console.warn('[CHARTS] No stats available to render');
            return '<div class="text-white text-center p-6">Statistics unavailable</div>';
        }
        
        return `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="glass-card p-4">
                    <h4 class="text-white font-semibold mb-2 text-lg">Client Summary</h4>
                    <div class="text-white text-sm space-y-1">
                        <div><strong>Total:</strong> ${stats.clients.total || 0}</div>
                        <div><strong>Active:</strong> ${stats.clients.active || 0}</div>
                        <div><strong>VIP:</strong> ${stats.clients.vip || 0}</div>
                    </div>
                </div>
                <div class="glass-card p-4">
                    <h4 class="text-white font-semibold mb-2 text-lg">Lead Summary</h4>
                    <div class="text-white text-sm space-y-1">
                        <div><strong>Total:</strong> ${stats.leads.total || 0}</div>
                        <div><strong>New:</strong> ${stats.leads.new || 0}</div>
                        <div><strong>Won:</strong> ${stats.leads.won || 0}</div>
                        <div><strong>Conversion:</strong> ${stats.leads.conversionRate || 0}%</div>
                    </div>
                </div>
                <div class="glass-card p-4">
                    <h4 class="text-white font-semibold mb-2 text-lg">Task Summary</h4>
                    <div class="text-white text-sm space-y-1">
                        <div><strong>Total:</strong> ${stats.tasks.total || 0}</div>
                        <div><strong>Completed:</strong> ${stats.tasks.completed || 0}</div>
                        <div><strong>Pending:</strong> ${stats.tasks.pending || 0}</div>
                        <div><strong>Completion:</strong> ${stats.tasks.completionRate || 0}%</div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        safeHandleError(error, {
            context: 'renderChartStats',
            userMessage: 'Error rendering chart statistics',
            severity: 'low',
            silent: true
        });
        
        return '<div class="text-white text-center p-6">Error loading statistics</div>';
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Destroy all chart instances
 */
function destroyAllCharts() {
    try {
        Object.keys(chartInstances).forEach(key => {
            destroyChart(key);
        });
        console.log('[CHARTS] All charts destroyed');
    } catch (error) {
        console.error('[CHARTS] Error destroying all charts:', error);
    }
}

/**
 * Check if any charts are currently rendered
 */
function hasActiveCharts() {
    try {
        return Object.values(chartInstances).some(chart => chart !== null);
    } catch (error) {
        console.error('[CHARTS] Error checking active charts:', error);
        return false;
    }
}

/**
 * Get list of available chart keys
 */
function getAvailableChartKeys() {
    try {
        return Object.keys(chartInstances).filter(key => chartInstances[key] !== null);
    } catch (error) {
        console.error('[CHARTS] Error getting chart keys:', error);
        return [];
    }
}

/**
 * Validate chart configuration
 */
function validateChartConfig() {
    const validation = {
        valid: true,
        errors: [],
        warnings: []
    };
    
    try {
        // Check Chart.js
        if (!isChartJsAvailable()) {
            validation.valid = false;
            validation.errors.push('Chart.js library not loaded');
        }
        
        // Check AppState
        if (!isAppStateAvailable()) {
            validation.valid = false;
            validation.errors.push('AppState not available');
        }
        
        // Check canvas elements
        const canvases = ['clientsChart', 'leadsChart', 'tasksChart'];
        canvases.forEach(canvasId => {
            if (!document.getElementById(canvasId)) {
                validation.warnings.push(`Canvas element missing: ${canvasId}`);
            }
        });
        
        // Check data availability
        const selectedCompany = getSelectedCompany();
        if (!selectedCompany) {
            validation.warnings.push('No company selected');
        }
        
    } catch (error) {
        validation.valid = false;
        validation.errors.push('Error during validation: ' + error.message);
    }
    
    return validation;
}

/**
 * Initialize charts with validation
 */
function initializeCharts() {
    try {
        console.log('[CHARTS] Initializing charts...');
        
        const validation = validateChartConfig();
        
        if (!validation.valid) {
            console.error('[CHARTS] Chart configuration invalid:', validation.errors);
            safeShowToast('⚠️ Charts unavailable: ' + validation.errors[0], 'warning');
            return false;
        }
        
        if (validation.warnings.length > 0) {
            console.warn('[CHARTS] Chart warnings:', validation.warnings);
        }
        
        updateCharts();
        
        console.log('[CHARTS] Charts initialized successfully');
        return true;
        
    } catch (error) {
        safeHandleError(error, {
            context: 'initializeCharts',
            userMessage: 'Failed to initialize charts',
            severity: 'medium',
            silent: false
        });
        return false;
    }
}

// ========================================
// GLOBAL EXPOSURE
// ========================================

// Expose key functions globally for use by other modules
if (typeof window !== 'undefined') {
    window.ChartManager = {
        updateCharts,
        updateClientsChart,
        updateLeadsChart,
        updateTasksChart,
        exportChart,
        getChartStats,
        renderChartStats,
        destroyAllCharts,
        hasActiveCharts,
        getAvailableChartKeys,
        validateChartConfig,
        initializeCharts
    };
}

// ========================================
// INITIALIZATION
// ========================================

console.log('✅ Charts Manager loaded - Enhanced Error Handling');
console.log('📊 Chart.js available:', isChartJsAvailable());
console.log('📋 AppState available:', isAppStateAvailable());

// ========================================
// END OF FILE: js/charts.js
// ========================================