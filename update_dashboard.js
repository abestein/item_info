const fs = require('fs');
const path = require('path');

const dashboardCssPath = path.join(__dirname, 'client', 'src', 'pages', 'DashboardPage.css');

const newContent = `.dashboard-container {
    padding: 0;
    background: #f2f3f4;
}

.dashboard-card {
    border-radius: 5px;
    box-shadow: none;
    border: 1px solid #dee2e6;
    transition: all 0.2s ease;
    background: #ffffff;
}

    .dashboard-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

.summary-card {
    height: 100%;
    border-radius: 5px;
    transition: all 0.2s ease;
    border: 1px solid #dee2e6;
    box-shadow: none;
    background: #ffffff;
}

    .summary-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .summary-card .ant-statistic-title {
        font-weight: 600;
        color: #043168;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .summary-card .ant-statistic-content {
        font-weight: 700;
        color: #20252a;
    }

    .summary-card .ant-statistic-content-value {
        font-size: 32px;
    }

/* Chart containers */
.chart-container {
    padding: 16px;
    background: #ffffff;
    border-radius: 5px;
    border: 1px solid #dee2e6;
}

/* Tabs styling */
.ant-tabs-tab {
    font-weight: 600 !important;
    color: #043168 !important;
}

.ant-tabs-tab-active {
    color: #00acac !important;
}

.ant-tabs-ink-bar {
    background: #00acac !important;
}

/* Progress bars */
.ant-progress-bg {
    background-color: #28a745 !important;
}

/* Dark theme adjustments */
[data-theme="dark"] .dashboard-container {
    background: #0A0E27;
}

[data-theme="dark"] .dashboard-card {
    background: #141828;
    border-color: #1f2937;
    box-shadow: none;
}

[data-theme="dark"] .summary-card {
    background: #141828;
    border-color: #1f2937;
    box-shadow: none;
}

[data-theme="dark"] .summary-card .ant-statistic-title {
    color: #9ca3af;
}

[data-theme="dark"] .summary-card .ant-statistic-content {
    color: #ffffff;
}

[data-theme="dark"] .chart-container {
    background: #141828;
    border-color: #1f2937;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .dashboard-container {
        padding: 0;
    }

    .ant-statistic-content-value {
        font-size: 24px !important;
    }
}
`;

fs.writeFileSync(dashboardCssPath, newContent, 'utf8');
console.log('Dashboard CSS updated successfully!');
