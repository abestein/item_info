const fs = require('fs');
const path = require('path');

const appTsxPath = path.join(__dirname, 'client', 'src', 'App.tsx');

// Read the file
let content = fs.readFileSync(appTsxPath, 'utf8');

// Replace the filtering logic
const oldFiltering = `    // Filter menu items based on user permissions
    const menuItems = allMenuItems
        .filter(item => {
            // If item has children, filter children first
            if (item.children) {
                const filteredChildren = item.children.filter(child => hasAccess(child.path));
                if (filteredChildren.length === 0) return false;
                item.children = filteredChildren;
            }
            // Check if user has access to this item's path
            return hasAccess(item.path);
        })
        .map(({ path, ...item }) => item); // Remove path property before rendering`;

const newFiltering = `    // Filter menu items based on user permissions
    const menuItems = allMenuItems
        .filter(item => {
            // If item has children, filter children first
            if (item.children) {
                const filteredChildren = item.children.filter(child => hasAccess(child.path));
                if (filteredChildren.length === 0) return false;
                item.children = filteredChildren;
                // If parent has children, show it even without a path
                return true;
            }
            // Check if user has access to this item's path
            return item.path && hasAccess(item.path);
        })
        .map(({ path, ...item }) => item); // Remove path property before rendering`;

content = content.replace(oldFiltering, newFiltering);

// Write the file back
fs.writeFileSync(appTsxPath, content, 'utf8');

console.log('Successfully updated menu filtering logic in App.tsx');
