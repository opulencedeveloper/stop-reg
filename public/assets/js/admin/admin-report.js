/**
 * Admin Report Page Logic
 * Handles Chart.js initialization for the usage stats.
 */

document.addEventListener('DOMContentLoaded', () => {
    initUsageStatsChart();
});

function initUsageStatsChart() {
    const ctx = document.getElementById('usageStatsChart');
    if (!ctx) return;

    // Sample data for the 4 categories
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Public Provider (Blue)
    const publicProviderData = [30, 32, 28, 35, 33, 38, 40, 35, 42, 38, 45, 40];
    // Disposable Domains (Red)
    const disposableDomainsData = [20, 18, 25, 22, 28, 25, 32, 30, 35, 32, 40, 38];
    // Email forwarding/alias (Grey)
    const forwardingData = [50, 48, 55, 52, 60, 58, 65, 62, 70, 68, 75, 72];
    // Unresolved (Teal)
    const unresolvedData = [15, 12, 18, 15, 20, 18, 22, 20, 25, 22, 28, 25];

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Email forwarding/alias',
                    data: forwardingData,
                    borderColor: '#D3D3D3', // Grey
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                },
                {
                    label: 'Public Provider',
                    data: publicProviderData,
                    borderColor: '#1452CA', // Blue
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                },
                {
                    label: 'Disposable Domains',
                    data: disposableDomainsData,
                    borderColor: '#CC0000', // Red
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                },
                {
                    label: 'Private',
                    data: unresolvedData,
                    borderColor: '#049286', // Teal
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Using custom legend in HTML
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: '#FFFFFF',
                    titleColor: '#252525',
                    bodyColor: '#737373',
                    borderColor: '#EDEDED',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        labelColor: function(context) {
                            return {
                                borderColor: context.dataset.borderColor,
                                backgroundColor: context.dataset.borderColor
                            };
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#9CA3AF',
                        font: {
                            family: 'Inter_28pt-Regular',
                            size: 12
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#F3F4F6'
                    },
                    ticks: {
                        display: false // Mockup doesn't show Y axis ticks
                    },
                    border: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest',
            }
        }
    });
}
