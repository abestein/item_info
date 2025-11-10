const fs = require('fs');
const path = require('path');

const appTsxPath = path.join(__dirname, 'client', 'src', 'App.tsx');
let content = fs.readFileSync(appTsxPath, 'utf8');

// Update theme config
content = content.replace(
    /const darkThemeConfig = \{[\s\S]*?\};[\s\S]*?const lightThemeConfig = \{[\s\S]*?\};/,
    `const darkThemeConfig = {
        algorithm: theme.darkAlgorithm,
        token: {
            colorPrimary: '#00acac',
            colorInfo: '#348fe2',
            colorSuccess: '#28a745',
            colorWarning: '#ffc107',
            colorError: '#dc3545',
            fontSize: 14,
            borderRadius: 5,
        },
    };

    const lightThemeConfig = {
        algorithm: theme.defaultAlgorithm,
        token: {
            colorPrimary: '#00acac',
            colorInfo: '#348fe2',
            colorSuccess: '#28a745',
            colorWarning: '#ffc107',
            colorError: '#dc3545',
            colorTextBase: '#043168',
            colorText: '#20252a',
            colorBgContainer: '#ffffff',
            colorBgLayout: '#f2f3f4',
            colorBorder: '#dee2e6',
            fontSize: 14,
            borderRadius: 5,
        },
    };`
);

// Change sidebar theme to light
content = content.replace(
    /<Sider[\s\S]*?theme="dark"/,
    '<Sider\n                            trigger={null}\n                            collapsible\n                            collapsed={collapsed}\n                            theme="light"'
);

// Update sidebar background
content = content.replace(
    /boxShadow: '2px 0 8px rgba\(0,0,0,0\.06\)'\s*\}/,
    "boxShadow: '2px 0 8px rgba(0,0,0,0.06)',\n                                background: '#ffffff'\n                            }"
);

// Update logo area
content = content.replace(
    /height: 32,\s*margin: 16,\s*background: 'rgba\(255, 255, 255, 0\.3\)'/,
    "height: 48,\n                                margin: 16,\n                                background: '#00acac'"
);

// Update menu theme
content = content.replace(
    /theme="dark"\s*mode="inline"/,
    'theme="light"\n                                mode="inline"'
);

// Update user section background
content = content.replace(
    /borderTop: '1px solid rgba\(255, 255, 255, 0\.1\)',\s*background: 'rgba\(255, 255, 255, 0\.04\)'/,
    "borderTop: '1px solid #dee2e6',\n                                background: '#043168'"
);

// Update avatar color
content = content.replace(
    /backgroundColor: '#1890ff'/g,
    "backgroundColor: '#00acac'"
);

// Update content background
content = content.replace(
    /background: isDarkMode \? '#141414' : '#fff'/,
    "background: isDarkMode ? '#0A0E27' : '#f2f3f4'"
);

fs.writeFileSync(appTsxPath, content, 'utf8');
console.log('Theme updated successfully!');
