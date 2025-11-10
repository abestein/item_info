const XLSX = require('xlsx');

const excelPath = 'C:\\Users\\A.Stein\\Downloads\\DATA TEAM ACTIVE SHEET_ 7-17-2025_3.xlsx';
console.log('Reading Excel file:', excelPath);

const wb = XLSX.readFile(excelPath);
const ws = wb.Sheets[wb.SheetNames[0]];
const range = XLSX.utils.decode_range(ws['!ref']);

console.log('\n=== Excel File Structure ===');
console.log('Total columns:', range.e.c + 1);
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
    for (let c = 0; c <= Math.min(80, range.e.c); c++) {
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
    const cell = ws[XLSX.utils.encode_cell({ r: 3, c })];
    dataRow.push(cell ? cell.v : '');
}

// Show all columns of data
for (let c = 0; c < Math.min(80, dataRow.length); c++) {
    if (dataRow[c] !== '' && dataRow[c] !== null && dataRow[c] !== undefined) {
        console.log(`  ${getColLetter(c)} (index ${c}): ${dataRow[c]}`);
    }
}
