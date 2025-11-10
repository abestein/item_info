const fs = require('fs');
const path = require('path');

const changesPath = path.join(__dirname, 'client', 'src', 'pages', 'ItemsNewChangesPage.tsx');
let content = fs.readFileSync(changesPath, 'utf8');

// Remove defaultActiveKey from main Collapse (Change Type View)
content = content.replace(
    '<Collapse defaultActiveKey={[\'NEW\', \'MODIFIED\', \'DELETED\']} style={{ marginTop: 16 }}>',
    '<Collapse style={{ marginTop: 16 }}>'
);

// Remove defaultActiveKey from nested Collapse (Modified fields)
content = content.replace(
    '<Collapse defaultActiveKey={Object.keys(modifiedByField)}>',
    '<Collapse>'
);

// Remove defaultActiveKey from Item View Collapse
content = content.replace(
    '<Collapse defaultActiveKey={Object.keys(groupedByItem)} style={{ marginTop: 16 }}>',
    '<Collapse style={{ marginTop: 16 }}>'
);

fs.writeFileSync(changesPath, content, 'utf8');
console.log('Fixed - all sections will be closed by default');
