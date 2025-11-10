const fs = require('fs');
const path = require('path');

// Update index.css - Change typography
const indexCssPath = path.join(__dirname, 'client', 'src', 'index.css');
let indexContent = fs.readFileSync(indexCssPath, 'utf8');

indexContent = indexContent.replace(
    /@import url\('https:\/\/fonts\.googleapis\.com\/css2\?family=Inter:wght@300;400;500;600;700&display=swap'\);/,
    "@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap');"
);

indexContent = indexContent.replace(
    /font-family: 'Inter'/g,
    "font-family: 'Open Sans'"
);

fs.writeFileSync(indexCssPath, indexContent, 'utf8');
console.log('Typography updated in index.css');

// Update App.css
const appCssPath = path.join(__dirname, 'client', 'src', 'App.css');
let appContent = fs.readFileSync(appCssPath, 'utf8');

// Add corporate styling
appContent = appContent.replace(
    /\/\* Sidebar styles \*\//,
    `/* Sidebar styles */
.ant-layout-sider-light {
    background: #ffffff !important;
}

.ant-layout-sider-light .ant-menu-item-selected {
    background-color: #e6f7f7 !important;
    border-left: 3px solid #00acac !important;
}

.ant-layout-sider-light .ant-menu-item:hover {
    background-color: #f2f3f4 !important;
}

.ant-layout-sider-light .ant-menu-item {
    color: #043168 !important;
}

.ant-layout-sider-light .ant-menu-submenu-title {
    color: #043168 !important;
}`
);

fs.writeFileSync(appCssPath, appContent, 'utf8');
console.log('Corporate styles updated in App.css');

console.log('All styles updated successfully!');
