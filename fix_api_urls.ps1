# PowerShell script to fix API URLs to use API_CONFIG

Write-Host "Fixing API URLs to use dynamic configuration..." -ForegroundColor Cyan

# Fix permissionsService.ts
$file1 = "C:\Users\A.Stein\Source\Repos\item_info\client\src\services\permissionsService.ts"
$content1 = Get-Content $file1 -Raw
$content1 = $content1 -replace "import axios from 'axios';`nimport \{ authService \} from './authService';`nimport type \{ PagePermission \} from '../types/user.types';`n`nconst API_URL = import\.meta\.env\.VITE_API_URL_LOCAL\?\.replace\('/api', ''\) \|\| 'http://localhost:3000';",
    "import axios from 'axios';`nimport { authService } from './authService';`nimport type { PagePermission } from '../types/user.types';`nimport { API_CONFIG } from '../config/api.config';`n`nconst API_URL = API_CONFIG.BASE_URL.replace('/api', '');"
$content1 | Set-Content $file1 -NoNewline
Write-Host "[OK] Updated permissionsService.ts" -ForegroundColor Green

# Fix HomePage.tsx
$file2 = "C:\Users\A.Stein\Source\Repos\item_info\client\src\pages\HomePage.tsx"
$content2 = Get-Content $file2 -Raw
$content2 = $content2 -replace "import axios from 'axios';`n`nconst API_URL = import\.meta\.env\.VITE_API_URL_LOCAL \|\| 'http://localhost:3000/api';",
    "import axios from 'axios';`nimport { API_CONFIG } from '../config/api.config';`n`nconst API_URL = API_CONFIG.BASE_URL;"
$content2 | Set-Content $file2 -NoNewline
Write-Host "[OK] Updated HomePage.tsx" -ForegroundColor Green

# Fix UploadPage.tsx
$file3 = "C:\Users\A.Stein\Source\Repos\item_info\client\src\pages\UploadPage.tsx"
$content3 = Get-Content $file3 -Raw
$content3 = $content3 -replace "import axios from 'axios';`n`nconst API_URL = 'http://localhost:3000/api';",
    "import axios from 'axios';`nimport { API_CONFIG } from '../config/api.config';`n`nconst API_URL = API_CONFIG.BASE_URL;"
$content3 | Set-Content $file3 -NoNewline
Write-Host "[OK] Updated UploadPage.tsx" -ForegroundColor Green

# Fix VendorItemsUploadPage.tsx
$file4 = "C:\Users\A.Stein\Source\Repos\item_info\client\src\pages\VendorItemsUploadPage.tsx"
if (Test-Path $file4) {
    $content4 = Get-Content $file4 -Raw
    $content4 = $content4 -replace "const API_URL = import\.meta\.env\.VITE_API_URL_LOCAL \|\| 'http://localhost:3000/api';",
        "import { API_CONFIG } from '../config/api.config';`nconst API_URL = API_CONFIG.BASE_URL;"
    $content4 | Set-Content $file4 -NoNewline
    Write-Host "[OK] Updated VendorItemsUploadPage.tsx" -ForegroundColor Green
}

# Fix VendorItemsTestUploadPage.tsx
$file5 = "C:\Users\A.Stein\Source\Repos\item_info\client\src\pages\VendorItemsTestUploadPage.tsx"
if (Test-Path $file5) {
    $content5 = Get-Content $file5 -Raw
    $content5 = $content5 -replace "const API_URL = import\.meta\.env\.VITE_API_URL_LOCAL \|\| 'http://localhost:3000/api';",
        "import { API_CONFIG } from '../config/api.config';`nconst API_URL = API_CONFIG.BASE_URL;"
    $content5 | Set-Content $file5 -NoNewline
    Write-Host "[OK] Updated VendorItemsTestUploadPage.tsx" -ForegroundColor Green
}

Write-Host "`nAll files updated! The frontend will now automatically use:" -ForegroundColor Cyan
Write-Host "  - localhost:3000 when accessed via localhost" -ForegroundColor Yellow
Write-Host "  - 192.168.254.142:3000 when accessed via network IP" -ForegroundColor Yellow
Write-Host "`nThe dev server should hot-reload the changes automatically." -ForegroundColor Green
