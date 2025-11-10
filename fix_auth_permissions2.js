const fs = require('fs');
const path = require('path');

const authPath = path.join(__dirname, 'routes', 'auth.js');

// Read the file
let content = fs.readFileSync(authPath, 'utf8');

// Replace the old permission fetching code - exact match from the file
const oldCode = `// If no custom permissions, get role-based permissions
            if (userPermissions === null) {
                const { getAccessiblePages } = require('../config/permissions');
                userPermissions = getAccessiblePages(user.Role);
            }`;

const newCode = `// If no custom permissions, get role-based permissions from database
            if (userPermissions === null) {
                const rolePermissionsResult = await pool.request()
                    .input('role', sql.NVarChar, user.Role)
                    .query('SELECT PagePath FROM RolePermissions WHERE RoleName = @role');

                userPermissions = rolePermissionsResult.recordset.map(r => r.PagePath);
            }`;

if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(authPath, content, 'utf8');
    console.log('Successfully updated auth.js to use database permissions');
} else {
    console.log('Pattern not found. Checking...');
    console.log('Looking for:', oldCode.substring(0, 50));
}
