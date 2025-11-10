import fs from 'fs';
import path from 'path';

console.log('Fixing API configuration in all files...\n');

const files = [
    {
        path: 'client/src/pages/HomePage.tsx',
        find: /^import axios from 'axios';\s*$/m,
        replace: "import axios from 'axios';\nimport { API_CONFIG } from '../config/api.config';",
        find2: /^const API_URL = import\.meta\.env\.VITE_API_URL_LOCAL \|\| 'http:\/\/localhost:3000\/api';$/m,
        replace2: "const API_URL = API_CONFIG.BASE_URL;"
    },
    {
        path: 'client/src/pages/UploadPage.tsx',
        find: /^import axios from 'axios';\s*$/m,
        replace: "import axios from 'axios';\nimport { API_CONFIG } from '../config/api.config';",
        find2: /^const API_URL = 'http:\/\/localhost:3000\/api';$/m,
        replace2: "const API_URL = API_CONFIG.BASE_URL;"
    },
    {
        path: 'client/src/pages/VendorItemsUploadPage.tsx',
        find: /^const API_URL = import\.meta\.env\.VITE_API_URL_LOCAL \|\| 'http:\/\/localhost:3000\/api';$/m,
        replace: "import { API_CONFIG } from '../config/api.config';\nconst API_URL = API_CONFIG.BASE_URL;"
    },
    {
        path: 'client/src/pages/VendorItemsTestUploadPage.tsx',
        find: /^const API_URL = import\.meta\.env\.VITE_API_URL_LOCAL \|\| 'http:\/\/localhost:3000\/api';$/m,
        replace: "import { API_CONFIG } from '../config/api.config';\nconst API_URL = API_CONFIG.BASE_URL;"
    },
    {
        path: 'client/src/services/permissionsService.ts',
        find: /^const API_URL = import\.meta\.env\.VITE_API_URL_LOCAL\?\.replace\('\/api', ''\) \|\| 'http:\/\/localhost:3000';$/m,
        replace: "import { API_CONFIG } from '../config/api.config';\nconst API_URL = API_CONFIG.BASE_URL.replace('/api', '');"
    }
];

let successCount = 0;
let errorCount = 0;

for (const file of files) {
    const fullPath = path.resolve(file.path);

    try {
        let content = fs.readFileSync(fullPath, 'utf8');
        let modified = false;

        // First replacement
        if (file.find && content.match(file.find)) {
            content = content.replace(file.find, file.replace);
            modified = true;
        }

        // Second replacement if exists
        if (file.find2 && content.match(file.find2)) {
            content = content.replace(file.find2, file.replace2);
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`✓ Updated: ${file.path}`);
            successCount++;
        } else {
            console.log(`○ Skipped (already updated): ${file.path}`);
        }
    } catch (error) {
        console.error(`✗ Error updating ${file.path}:`, error.message);
        errorCount++;
    }
}

console.log(`\nComplete! ${successCount} files updated, ${errorCount} errors.`);
console.log('\nYour app now uses smart API configuration:');
console.log('  • localhost → localhost:3000');
console.log('  • 192.168.254.142 → 192.168.254.142:3000');
