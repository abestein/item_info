const XLSX = require('xlsx');

const excelPath = 'C:\\Users\\A.Stein\\Downloads\\DATA TEAM ACTIVE SHEET_ 7-17-2025.xlsx';
console.log('Reading Excel file:', excelPath);

const wb = XLSX.readFile(excelPath);
const ws = wb.Sheets[wb.SheetNames[0]];
const range = XLSX.utils.decode_range(ws['!ref']);

console.log('\n=== Excel File Structure ===');
console.log('Total columns:', range.e.c + 1, `(A to ${XLSX.utils.encode_col(range.e.c)})`);
console.log('Total rows:', range.e.r + 1);

// Helper to get column letter
function getColLetter(colIndex) {
    let letter = '';
    let temp = colIndex;
    while (temp >= 0) {
        letter = String.fromCharCode(65 + (temp % 26)) + letter;
        temp = Math.floor(temp / 26) - 1;
    }
    return letter;
}

// Show header rows (rows 1-3)
console.log('\n=== Header Rows (1-3) ===');
for (let r = 0; r <= 2; r++) {
    console.log(`\nRow ${r + 1}:`);
    for (let c = 0; c <= Math.min(75, range.e.c); c++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        if (cell && cell.v) {
            console.log(`  ${getColLetter(c)} (index ${c}): ${cell.v}`);
        }
    }
}

// Read a sample data row (row 4)
console.log('\n=== Sample Data Row 4 ===');
const dataRow = [];
for (let c = 0; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 3, c })];//row 4 is index 3
    dataRow.push(cell ? cell.v : '');
}

// Show first 20 columns of data
for (let c = 0; c < Math.min(76, dataRow.length); c++) {
    if (dataRow[c] !== '' && dataRow[c] !== null && dataRow[c] !== undefined) {
        console.log(`  ${getColLetter(c)} (index ${c}): ${dataRow[c]}`);
    }
}

console.log('\n=== Column Indices for Key Fields ===');
const keyColumns = [
    { name: 'Brand Name', expected: 'A (0)' },
    { name: 'Item#', expected: 'B (1)' },
    { name: 'HCPC Code', expected: 'AO (40)' },
    { name: 'Duns #', expected: 'AR (43)' },
    { name: 'Prop-65 Warning', expected: 'BC (54)' },
    { name: 'DEHP Free', expected: 'BE (56)' },
    { name: 'Pack Inner-2', expected: 'BK (62)' },
    { name: 'GTIN Inner-2', expected: 'BR (69)' },
    { name: 'HC Class', expected: 'BW (74)' },
    { name: 'License Number', expected: 'BX (75)' }
];

keyColumns.forEach(col => {
    console.log(`${col.name}: Expected at ${col.expected}`);
});
