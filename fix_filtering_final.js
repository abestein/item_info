const fs = require('fs');
const path = require('path');

const appTsxPath = path.join(__dirname, 'client', 'src', 'App.tsx');

// Read the file
let lines = fs.readFileSync(appTsxPath, 'utf8').split('\n');

// Find the line with "item.children = filteredChildren;" and add two lines after it
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('item.children = filteredChildren;')) {
        // Insert the new lines after this line
        lines.splice(i + 1, 0,
            '                // If parent has children, show it even without a path',
            '                return true;'
        );
        break;
    }
}

// Find the line with "return hasAccess(item.path);" and replace it
for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === 'return hasAccess(item.path);') {
        lines[i] = lines[i].replace('return hasAccess(item.path);', 'return item.path && hasAccess(item.path);');
        break;
    }
}

// Write back
fs.writeFileSync(appTsxPath, lines.join('\n'), 'utf8');

console.log('Successfully updated filtering logic');
