import fs from 'fs/promises';
import xlsx from 'xlsx';

console.log('🔍 Testing Excel file reading...');

try {
    // Check if file exists
    const excelFile = 'DATA_TEAM_ACTIVE_SHEET_7-17-2025.xlsx';
    const stats = await fs.stat(excelFile);
    console.log(`✅ Excel file found: ${excelFile} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

    // Read the Excel file
    console.log('📖 Reading Excel file...');
    const workbook = xlsx.readFile(excelFile);
    console.log(`📋 Sheets found: ${workbook.SheetNames.join(', ')}`);

    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    console.log(`📏 Sheet range: ${worksheet['!ref']}`);

    // Get a few sample cells
    const range = xlsx.utils.decode_range(worksheet['!ref']);
    console.log(`📊 Total rows: ${range.e.r + 1}, Total columns: ${range.e.c + 1}`);

    // Read header row (row 3, 0-indexed as row 2)
    console.log('\n📋 Sample headers from row 3:');
    for (let col = 0; col < Math.min(10, range.e.c + 1); col++) {
        const cellAddress = xlsx.utils.encode_cell({ r: 2, c: col });
        const cell = worksheet[cellAddress];
        const value = cell ? cell.v : 'empty';
        console.log(`   Column ${col}: "${value}"`);
    }

    // Read first data row (row 4, 0-indexed as row 3)
    console.log('\n📋 Sample data from row 4:');
    for (let col = 0; col < Math.min(10, range.e.c + 1); col++) {
        const cellAddress = xlsx.utils.encode_cell({ r: 3, c: col });
        const cell = worksheet[cellAddress];
        const value = cell ? cell.v : 'empty';
        console.log(`   Column ${col}: "${value}"`);
    }

    // Count data rows with item numbers
    let dataRowsWithItems = 0;
    const itemColumn = 1; // Item# is in column B (index 1)

    for (let row = 3; row <= range.e.r; row++) { // Start from row 4 (index 3)
        const cellAddress = xlsx.utils.encode_cell({ r: row, c: itemColumn });
        const cell = worksheet[cellAddress];
        if (cell && cell.v && String(cell.v).trim() !== '') {
            dataRowsWithItems++;
        }
    }

    console.log(`\n📊 Data rows with item numbers: ${dataRowsWithItems}`);
    console.log('✅ Excel file reading test completed successfully!');

} catch (error) {
    console.error('❌ Excel file reading test failed:', error.message);
    console.error('Stack:', error.stack);
}