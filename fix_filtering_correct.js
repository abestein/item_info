const fs = require('fs');
const path = require('path');

const appTsxPath = path.join(__dirname, 'client', 'src', 'App.tsx');

// Read the file
let content = fs.readFileSync(appTsxPath, 'utf8');

// Find and replace the specific section
const oldCode = `            // If item has children, filter children first
            if (item.children) {
                const filteredChildren = item.children.filter(child => hasAccess(child.path));
                if (filteredChildren.length === 0) return false;
                item.children = filteredChildren;
            }
            // Check if user has access to this item's path
            return hasAccess(item.path);`;

const newCode = `            // If item has children, filter children first
            if (item.children) {
                const filteredChildren = item.children.filter(child => hasAccess(child.path));
                if (filteredChildren.length === 0) return false;
                item.children = filteredChildren;
                // If parent has children, show it even without a path
                return true;
            }
            // Check if user has access to this item's path
            return item.path && hasAccess(item.path);`;

content = content.replace(oldCode, newCode);

// Write the file back
fs.writeFileSync(appTsxPath, content, 'utf8');

console.log('Successfully updated filtering logic');
