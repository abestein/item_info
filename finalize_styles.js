const fs = require('fs');
const path = require('path');

// Update App.css with final touches
const appCssPath = path.join(__dirname, 'client', 'src', 'App.css');
let appContent = fs.readFileSync(appCssPath, 'utf8');

// Add final corporate polish
const additionalStyles = `

/* Corporate polish */
.ant-btn-primary {
    background: #00acac !important;
    border-color: #00acac !important;
}

.ant-btn-primary:hover {
    background: #008181 !important;
    border-color: #008181 !important;
}

.ant-card {
    border-radius: 5px !important;
    border: 1px solid #dee2e6 !important;
    box-shadow: none !important;
}

.ant-card:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
}

/* Header improvements */
.ant-layout-header {
    border-bottom: 1px solid #dee2e6 !important;
}

/* Table improvements */
.ant-table {
    background: #ffffff;
    border-radius: 5px;
}

.ant-table-thead > tr > th {
    background: #f2f3f4 !important;
    color: #043168 !important;
    font-weight: 600 !important;
    border-bottom: 2px solid #dee2e6 !important;
}

.ant-table-tbody > tr:hover > td {
    background: #f2f3f4 !important;
}

/* Form improvements */
.ant-input,
.ant-input-number,
.ant-select-selector,
.ant-picker {
    border-radius: 5px !important;
    border-color: #dee2e6 !important;
}

.ant-input:focus,
.ant-input-number:focus,
.ant-select-focused .ant-select-selector,
.ant-picker-focused {
    border-color: #00acac !important;
    box-shadow: 0 0 0 2px rgba(0, 172, 172, 0.1) !important;
}

/* Modal improvements */
.ant-modal-content {
    border-radius: 5px !important;
}

.ant-modal-header {
    border-bottom: 1px solid #dee2e6 !important;
    border-radius: 5px 5px 0 0 !important;
}

/* Tag improvements */
.ant-tag {
    border-radius: 3px !important;
}
`;

if (!appContent.includes('/* Corporate polish */')) {
    appContent += additionalStyles;
}

fs.writeFileSync(appCssPath, appContent, 'utf8');
console.log('Final styles applied successfully!');
