// ========================================
// CHART MANAGEMENT
// ========================================

let chartInstances = {
    clients: null,
    leads: null,
    tasks: null
};

/**
 * Update all dashboard charts
 */
function updateCharts() {
    if (!AppState.selectedCompany) return;
    
    updateClientsChart();
    updateLeadsChart();
    updateTasksChart();
}

/**
 * Destroy existing chart if it exists
 */
function destroyChart(chartKey) {
    if (chartInstances[chartKey]) {
        chartInstances[chartKey].destroy();
        chartInstances[chartKey] = null;
    }
}

/**
 * Clients Status Chart
 */
function updateClientsChart() {
    const canvas = document.getElementById('clientsChart');
    if (!canvas) return;
    
    destroyChart('clients');
    
    const clients = AppState.data.clients.filter(c => c.company === AppState.selectedCompany);
    
    // Count by status
    const statusCounts = {};
    clients.forEach(client => {
        const status = client.status || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);
    
    // Color scheme for client statuses
    const colors = {
        'Active': 'rgba(39, 174, 96, 0.8)',
        'Inactive': 'rgba(149, 165, 166, 0.8)',
        'On Hold': 'rgba(243, 156, 18, 0.8)',
        'VIP': 'rgba(241, 196, 15, 0.8)',
        'Churned': 'rgba(192, 57, 43, 0.8)',
        'Pending': 'rgba(52, 152, 219, 0.8)'
    };
    
    const backgroundColors = labels.map(label => colors[label] || 'rgba(155, 89, 182, 0.8)');
    
    chartInstances.clients = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Clients by Status',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: 'rgba(255, 255, 255, 0.3)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'white',
                        padding: 15,
                        font: {
                            size: 12,
                            family: "'Inter', sans-serif"
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Clients by Status',
                    color: 'white',
                    font: {
                        size: 16,
                        weight: 'bold',
                        family: "'Inter', sans-serif"
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Leads Status Chart
 */
function updateLeadsChart() {
    const canvas = document.getElementById('leadsChart');
    if (!canvas) return;
    
    destroyChart('leads');
    
    const leads = AppState.data.leads.filter(l => l.company === AppState.selectedCompany);
    
    // Count by status
    const statusCounts = {};
    leads.forEach(lead => {
        const status = lead.status || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);
    
    // Color scheme for lead statuses
    const colors = {
        'New': 'rgba(52, 152, 219, 0.8)',
        'Contacted': 'rgba(155, 89, 182, 0.8)',
        'Qualified': 'rgba(26, 188, 156, 0.8)',
        'Proposal Sent': 'rgba(230, 126, 34, 0.8)',
        'Won': 'rgba(39, 174, 96, 0.8)',
        'Lost': 'rgba(231, 76, 60, 0.8)'
    };
    
    const backgroundColors = labels.map(label => colors[label] || 'rgba(149, 165, 166, 0.8)');
    
    chartInstances.leads = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Leads by Status',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: 'rgba(255, 255, 255, 0.3)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'white',
                        padding: 15,
                        font: {
                            size: 12,
                            family: "'Inter', sans-serif"
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Leads by Status',
                    color: 'white',
                    font: {
                        size: 16,
                        weight: 'bold',
                        family: "'Inter', sans-serif"
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Tasks Priority & Status Chart
 */
function updateTasksChart() {
    const canvas = document.getElementById('tasksChart');
    if (!canvas) return;
    
    destroyChart('tasks');
    
    const tasks = AppState.data.generalTodos.filter(t => t.company === AppState.selectedCompany);
    
    // Count by priority
    const priorityCounts = {
        'High': 0,
        'Medium': 0,
        'Low': 0
    };
    
    tasks.forEach(task => {
        const priority = task.priority || 'Medium';
        if (priorityCounts.hasOwnProperty(priority)) {
            priorityCounts[priority]++;
        }
    });
    
    chartInstances.tasks = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['High', 'Medium', 'Low'],
            datasets: [{
                label: 'Tasks by Priority',
                data: [priorityCounts.High, priorityCounts.Medium, priorityCounts.Low],
                backgroundColor: [
                    'rgba(255, 107, 107, 0.8)',
                    'rgba(247, 183, 49, 0.8)',
                    'rgba(46, 204, 113, 0.8)'
                ],
                borderColor: [
                    'rgba(255, 107, 107, 1)',
                    'rgba(247, 183, 49, 1)',
                    'rgba(46, 204, 113, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'white',
                        stepSize: 1,
                        font: {
                            family: "'Inter', sans-serif"
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: 'white',
                        font: {
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
                    text: 'Tasks by Priority',
                    color: 'white',
                    font: {
                        size: 16,
                        weight: 'bold',
                        family: "'Inter', sans-serif"
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `Count: ${context.parsed.y}`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Export chart as image
 */
function exportChart(chartKey, filename) {
    const chart = chartInstances[chartKey];
    if (!chart) {
        console.error('Chart not found:', chartKey);
        return;
    }
    
    const url = chart.toBase64Image();
    const link = document.createElement('a');
    link.download = filename || `${chartKey}-chart.png`;
    link.href = url;
    link.click();
}

/**
 * Get chart statistics
 */
function getChartStats() {
    const clients = AppState.data.clients.filter(c => c.company === AppState.selectedCompany);
    const leads = AppState.data.leads.filter(l => l.company === AppState.selectedCompany);
    const tasks = AppState.data.generalTodos.filter(t => t.company === AppState.selectedCompany);
    
    return {
        clients: {
            total: clients.length,
            active: clients.filter(c => c.status === 'Active').length,
            vip: clients.filter(c => c.status === 'VIP').length
        },
        leads: {
            total: leads.length,
            new: leads.filter(l => l.status === 'New').length,
            won: leads.filter(l => l.status === 'Won').length,
            conversionRate: leads.length > 0 ? 
                ((leads.filter(l => l.status === 'Won').length / leads.length) * 100).toFixed(1) : 0
        },
        tasks: {
            total: tasks.length,
            completed: tasks.filter(t => t.status === 'Completed').length,
            pending: tasks.filter(t => t.status === 'Pending').length,
            completionRate: tasks.length > 0 ? 
                ((tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100).toFixed(1) : 0
        }
    };
}

/**
 * Render chart statistics summary
 */
function renderChartStats() {
    const stats = getChartStats();
    
    return `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="glass-card p-4">
                <h4 class="text-white font-semibold mb-2">Client Summary</h4>
                <div class="text-white text-sm opacity-75">
                    <div>Total: ${stats.clients.total}</div>
                    <div>Active: ${stats.clients.active}</div>
                    <div>VIP: ${stats.clients.vip}</div>
                </div>
            </div>
            <div class="glass-card p-4">
                <h4 class="text-white font-semibold mb-2">Lead Summary</h4>
                <div class="text-white text-sm opacity-75">
                    <div>Total: ${stats.leads.total}</div>
                    <div>New: ${stats.leads.new}</div>
                    <div>Won: ${stats.leads.won}</div>
                    <div>Conversion: ${stats.leads.conversionRate}%</div>
                </div>
            </div>
            <div class="glass-card p-4">
                <h4 class="text-white font-semibold mb-2">Task Summary</h4>
                <div class="text-white text-sm opacity-75">
                    <div>Total: ${stats.tasks.total}</div>
                    <div>Completed: ${stats.tasks.completed}</div>
                    <div>Pending: ${stats.tasks.pending}</div>
                    <div>Completion: ${stats.tasks.completionRate}%</div>
                </div>
            </div>
        </div>
    `;
}

console.log('✅ Charts Manager loaded');