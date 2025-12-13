// ========================================
// CHART MANAGEMENT - 3D STYLE WITH CLEAR TEXT
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
 * Common chart options for better text clarity
 */
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
    
    // Color scheme for client statuses with higher saturation
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
    canvas.style.filter = 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4))';
    canvas.style.transform = 'perspective(1000px) rotateX(5deg)';
    canvas.style.transformStyle = 'preserve-3d';
    
    chartInstances.clients = new Chart(canvas, {
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
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return {
                                        text: `${label}: ${value} (${percentage}%)`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
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
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} clients (${percentage}%)`;
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
    
    // Color scheme for lead statuses with higher saturation
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
    canvas.style.filter = 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4))';
    canvas.style.transform = 'perspective(1000px) rotateX(5deg)';
    canvas.style.transformStyle = 'preserve-3d';
    
    chartInstances.leads = new Chart(canvas, {
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
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return {
                                        text: `${label}: ${value} (${percentage}%)`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
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
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} leads (${percentage}%)`;
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
    
    // Add 3D shadow effect to canvas
    canvas.style.filter = 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4))';
    canvas.style.transform = 'perspective(1000px) rotateX(5deg)';
    canvas.style.transformStyle = 'preserve-3d';
    
    chartInstances.tasks = new Chart(canvas, {
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
                            return context[0].label;
                        },
                        label: function(context) {
                            return `Tasks: ${context.parsed.y}`;
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
                <h4 class="text-white font-semibold mb-2 text-lg">Client Summary</h4>
                <div class="text-white text-sm space-y-1">
                    <div><strong>Total:</strong> ${stats.clients.total}</div>
                    <div><strong>Active:</strong> ${stats.clients.active}</div>
                    <div><strong>VIP:</strong> ${stats.clients.vip}</div>
                </div>
            </div>
            <div class="glass-card p-4">
                <h4 class="text-white font-semibold mb-2 text-lg">Lead Summary</h4>
                <div class="text-white text-sm space-y-1">
                    <div><strong>Total:</strong> ${stats.leads.total}</div>
                    <div><strong>New:</strong> ${stats.leads.new}</div>
                    <div><strong>Won:</strong> ${stats.leads.won}</div>
                    <div><strong>Conversion:</strong> ${stats.leads.conversionRate}%</div>
                </div>
            </div>
            <div class="glass-card p-4">
                <h4 class="text-white font-semibold mb-2 text-lg">Task Summary</h4>
                <div class="text-white text-sm space-y-1">
                    <div><strong>Total:</strong> ${stats.tasks.total}</div>
                    <div><strong>Completed:</strong> ${stats.tasks.completed}</div>
                    <div><strong>Pending:</strong> ${stats.tasks.pending}</div>
                    <div><strong>Completion:</strong> ${stats.tasks.completionRate}%</div>
                </div>
            </div>
        </div>
    `;
}

console.log('✅ Charts Manager loaded - 3D Style with Clear Text');