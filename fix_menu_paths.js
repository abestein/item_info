const fs = require('fs');
const path = require('path');

const appTsxPath = path.join(__dirname, 'client', 'src', 'App.tsx');

// Read the file
let content = fs.readFileSync(appTsxPath, 'utf8');

// Replace the Items Management children paths
content = content.replace(
  /key: '\/items-new-operations',\s+path: '\/items',/,
  "key: '/items-new-operations',\n                    path: '/items-new-operations',"
);

content = content.replace(
  /key: '\/items-new-changes',\s+path: '\/items',/,
  "key: '/items-new-changes',\n                    path: '/items-new-changes',"
);

content = content.replace(
  /key: '\/items-new',\s+path: '\/items',/,
  "key: '/items-new',\n                    path: '/items-new',"
);

// Replace the User Management children path for roles
content = content.replace(
  /key: '\/users\/roles',\s+path: '\/users',/,
  "key: '/users/roles',\n                    path: '/users/roles',"
);

// Remove path property from parent menus (Items Management and Users Menu)
content = content.replace(
  /key: '\/items-management',\s+path: '\/items',\s+icon:/,
  "key: '/items-management',\n            icon:"
);

content = content.replace(
  /key: '\/users-menu',\s+path: '\/users',\s+icon:/,
  "key: '/users-menu',\n            icon:"
);

// Write the file back
fs.writeFileSync(appTsxPath, content, 'utf8');

console.log('Successfully updated menu paths in App.tsx');
