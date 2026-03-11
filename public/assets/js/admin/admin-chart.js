document.addEventListener('DOMContentLoaded', function () {
    const chartCtx = document.getElementById('adminLineChart');
    if (!chartCtx) return;

    // Use Chart.js if available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded.');
        return;
    }

    // Gradient logic for lines, if needed. For now, matching the design.
    // The design shows 3 distinct wavy lines.
    
    // Abstracting some dummy data spanning from Jan to Nov
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

    // Data corresponding roughly to the design curves
    const dataRegistered = [40, 42, 45, 43, 44, 43, 44, 42, 45, 52, 46];
    const dataFree = [30, 28, 35, 38, 34, 38, 42, 40, 36, 40, 38];
    const dataPaid = [25, 23, 18, 25, 30, 26, 22, 28, 28, 22, 26];

    // Colors matching CSS dots
    const colorRegistered = '#1452CA'; // Blue
    const colorFree = '#8A2BE2'; // Purple
    const colorPaid = '#049286'; // Green

    // Custom Tooltip element
    const tooltipEl = document.getElementById('chart-tooltip');

    const chartConfig = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Registered Users',
                    data: dataRegistered,
                    borderColor: colorRegistered,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.4, // Smooth curves
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: colorRegistered,
                    pointHoverBorderColor: '#FFFFFF',
                    pointHoverBorderWidth: 2
                },
                {
                    label: 'Free Users',
                    data: dataFree,
                    borderColor: colorFree,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: colorFree,
                    pointHoverBorderColor: '#FFFFFF',
                    pointHoverBorderWidth: 2
                },
                {
                    label: 'Paid Users',
                    data: dataPaid,
                    borderColor: colorPaid,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: colorPaid,
                    pointHoverBorderColor: '#FFFFFF',
                    pointHoverBorderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: false // We built a custom HTML legend
                },
                tooltip: {
                    enabled: false, // Turn off default tooltip
                    external: function(context) {
                        // Custom Tooltip Code (similar to existing logic in main dashboard)
                        let tooltipModel = context.tooltip;
                        
                        // Hide if no tooltip
                        if (tooltipModel.opacity === 0) {
                            tooltipEl.style.opacity = 0;
                            return;
                        }

                        // Set Text
                        if (tooltipModel.body) {
                            const dataPoints = tooltipModel.dataPoints;
                            if(dataPoints && dataPoints.length > 0) {
                                // Just grab the primary hovered point or sum
                                const val = dataPoints[0].raw;
                                const label = dataPoints[0].label;
                                
                                tooltipEl.querySelector('strong').textContent = val;
                                tooltipEl.querySelector('span').textContent = label;
                            }
                        }

                        const position = context.chart.canvas.getBoundingClientRect();
                        
                        // Display, position, and set styles for font
                        tooltipEl.style.opacity = 1;
                        tooltipEl.style.position = 'absolute';
                        
                        // Center tooltip horizontally on point, adjusting for its width (assume ~125px)
                        tooltipEl.style.left = tooltipModel.caretX - (125 / 2) + 'px';
                        // Place tooltip above the pointer
                        tooltipEl.style.top = (tooltipModel.caretY - 70) + 'px';
                        tooltipEl.style.pointerEvents = 'none';
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: '#F0F0F0', // faint vertical lines as in design
                        drawBorder: false,
                    },
                    ticks: {
                        color: '#737373',
                        font: {
                            family: 'Inter_28pt-Regular',
                            size: 12
                        }
                    }
                },
                y: {
                    display: false, // hide Y axis
                    min: 10,
                    max: 60
                }
            }
        }
    };

    new Chart(chartCtx, chartConfig);
});
