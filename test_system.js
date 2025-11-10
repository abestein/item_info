const fs = require('fs');
const path = require('path');

// Test that all required files exist
const requiredFiles = [
    'views/upload_data_team.ejs',
    'views/compare_data_team.ejs',
    'routes/data_team_upload.js',
    'routes/data_team_comparison.js',
    'views/partials/sidebar.ejs',
    'config/permissions.js',
    'middleware/auth.js'
];

console.log('🔍 Testing Data Team Upload System...\n');

let allFilesExist = true;

requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} - EXISTS`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesExist = false;
    }
});

console.log('\n📋 Checking role configuration...');

// Check permissions configuration
try {
    const permissions = require('./config/permissions');

    // Check if editor role is included
    const dataTeamUploadPermissions = permissions.pagePermissions['/upload-data-team'];
    const comparePermissions = permissions.pagePermissions['/compare-data-team'];

    if (dataTeamUploadPermissions && dataTeamUploadPermissions.includes('editor')) {
        console.log('✅ Editor role has access to upload page');
    } else {
        console.log('❌ Editor role missing from upload page permissions');
        allFilesExist = false;
    }

    if (comparePermissions && comparePermissions.includes('editor')) {
        console.log('✅ Editor role has access to compare page');
    } else {
        console.log('❌ Editor role missing from compare page permissions');
        allFilesExist = false;
    }

} catch (error) {
    console.log('❌ Error loading permissions configuration:', error.message);
    allFilesExist = false;
}

console.log('\n📦 Checking package dependencies...');

try {
    const packageJson = require('./package.json');
    const requiredDeps = ['ejs', 'xlsx', 'express-ejs-layouts'];

    requiredDeps.forEach(dep => {
        if (packageJson.dependencies[dep]) {
            console.log(`✅ ${dep} - v${packageJson.dependencies[dep]}`);
        } else {
            console.log(`❌ ${dep} - MISSING from package.json`);
            allFilesExist = false;
        }
    });
} catch (error) {
    console.log('❌ Error reading package.json:', error.message);
    allFilesExist = false;
}

console.log('\n' + '='.repeat(50));

if (allFilesExist) {
    console.log('🎉 All system components are properly configured!');
    console.log('\n📖 Usage Instructions:');
    console.log('1. Create a user with "editor" role through user management');
    console.log('2. Login as editor user');
    console.log('3. Navigate to /upload-data-team to upload Excel files');
    console.log('4. Navigate to /compare-data-team to compare and override changes');
    console.log('5. Only Admin and Editor users can access the comparison page');
} else {
    console.log('⚠️  Some system components are missing or misconfigured.');
    console.log('Please check the items marked with ❌ above.');
}

console.log('\n🔗 Available Routes:');
console.log('- GET  /upload-data-team   (Admin, Manager, Editor)');
console.log('- POST /validate-data-team-excel (API endpoint)');
console.log('- POST /import-data-team-temp (API endpoint)');
console.log('- GET  /compare-data-team  (Admin, Editor only)');
console.log('- GET  /api/compare-data-team (API endpoint)');
console.log('- POST /api/apply-data-team-changes (API endpoint)');