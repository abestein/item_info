const fs = require('fs');
const path = require('path');

// Fix ItemsNewChangesPage
const changesPath = path.join(__dirname, 'client', 'src', 'pages', 'ItemsNewChangesPage.tsx');
let changesContent = fs.readFileSync(changesPath, 'utf8');

// 1. Add defaultActiveKey to nested Collapse for MODIFIED section
changesContent = changesContent.replace(
    '                    <Panel\n                        header={\n                            <Space>\n                                <Tag color="blue">MODIFIED</Tag>\n                                <span>{groupedByChangeType.MODIFIED.length} modifications</span>\n                            </Space>\n                        }\n                        key="MODIFIED"\n                    >\n                        <Collapse>',
    '                    <Panel\n                        header={\n                            <Space>\n                                <Tag color="blue">MODIFIED</Tag>\n                                <span>{groupedByChangeType.MODIFIED.length} modifications</span>\n                            </Space>\n                        }\n                        key="MODIFIED"\n                    >\n                        <Collapse defaultActiveKey={Object.keys(modifiedByField)}>'
);

// 2. Add defaultActiveKey to Item View Collapse
changesContent = changesContent.replace(
    '        return (\n            <Collapse style={{ marginTop: 16 }}>',
    '        return (\n            <Collapse defaultActiveKey={Object.keys(groupedByItem)} style={{ marginTop: 16 }}>'
);

// 3. Reduce page padding
changesContent = changesContent.replace(
    '        <div className="page-container" style={{ padding: 24 }}>',
    '        <div className="page-container" style={{ padding: 8 }}>'
);

// 4. Make Card more compact
changesContent = changesContent.replace(
    '            <Card\n                title="View Pending Changes"',
    '            <Card\n                size="small"\n                title="View Pending Changes"'
);

fs.writeFileSync(changesPath, changesContent, 'utf8');
console.log('Fixed ItemsNewChangesPage.tsx');

// Fix ItemsNewOperationsPage
const operationsPath = path.join(__dirname, 'client', 'src', 'pages', 'ItemsNewOperationsPage.tsx');
let operationsContent = fs.readFileSync(operationsPath, 'utf8');

// 1. Reduce page padding
operationsContent = operationsContent.replace(
    '        <div className="page-container" style={{ padding: 24 }}>',
    '        <div className="page-container" style={{ padding: 8 }}>'
);

// 2. Make outer Card more compact
operationsContent = operationsContent.replace(
    '            <Card\n                title="Data Management Operations"',
    '            <Card\n                size="small"\n                title="Data Management Operations"'
);

// 3. Reduce marginBottom on description
operationsContent = operationsContent.replace(
    '                <div style={{ marginBottom: 24 }}>',
    '                <div style={{ marginBottom: 12 }}>'
);

// 4. Make inner cards more compact - reduce text size and margins
operationsContent = operationsContent.replace(
    /                    <Card type="inner"/g,
    '                    <Card type="inner" size="small"'
);

operationsContent = operationsContent.replace(
    /                        <p style={{ marginBottom: 16 }}>/g,
    '                        <p style={{ marginBottom: 8, fontSize: 14 }}>'
);

fs.writeFileSync(operationsPath, operationsContent, 'utf8');
console.log('Fixed ItemsNewOperationsPage.tsx');

// Fix Menu Order in App.tsx
const appPath = path.join(__dirname, 'client', 'src', 'App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// Find and reorder the Items Management children
const itemsManagementPattern = /children: \[\s*\{\s*key: '\/items-new',[\s\S]*?\},\s*\{\s*key: '\/items-new-operations',[\s\S]*?\},\s*\{\s*key: '\/items-new-changes',[\s\S]*?\},\s*\]/;

const newItemsManagementChildren = `children: [
                {
                    key: '/items-new-operations',
                    path: '/items',
                    icon: <SettingOutlined />,
                    label: <Link to="/items-new-operations">Operations</Link>,
                },
                {
                    key: '/items-new-changes',
                    path: '/items',
                    icon: <FileTextOutlined />,
                    label: <Link to="/items-new-changes">View Pending Changes</Link>,
                },
                {
                    key: '/items-new',
                    path: '/items',
                    icon: <TableOutlined />,
                    label: <Link to="/items-new">Item View</Link>,
                },
            ]`;

appContent = appContent.replace(itemsManagementPattern, newItemsManagementChildren);

fs.writeFileSync(appPath, appContent, 'utf8');
console.log('Fixed App.tsx menu order');

console.log('All fixes applied successfully!');
