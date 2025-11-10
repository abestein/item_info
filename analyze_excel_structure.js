const ExcelJS = require('exceljs');

async function analyzeExcelStructure() {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile('C:\\Users\\A.Stein\\Downloads\\DATA TEAM ACTIVE SHEET_ 7-17-2025.xlsx');
        
        const worksheet = workbook.worksheets[0];
        console.log(`Sheet name: ${worksheet.name}`);
        console.log(`Total rows: ${worksheet.rowCount}`);
        console.log(`Total columns: ${worksheet.columnCount}`);
        
        // Get actual headers from row 3
        const headerRow = worksheet.getRow(3);
        const headers = [];
        headerRow.eachCell((cell, colNumber) => {
            const value = cell.value ? cell.value.toString().trim() : `Column_${colNumber}`;
            headers.push({
                index: colNumber,
                name: value || `Column_${colNumber}`,
                cleanName: (value || `Column_${colNumber}`)
                    .replace(/[^a-zA-Z0-9_]/g, '_')
                    .replace(/_+/g, '_')
                    .replace(/^_|_$/g, '')
                    .toLowerCase()
            });
        });
        
        console.log('\n=== COLUMN HEADERS FROM ROW 3 ===');
        headers.forEach(header => {
            console.log(`${header.index.toString().padStart(2)}: ${header.name} -> ${header.cleanName}`);
        });
        
        console.log('\n=== DATA TYPE ANALYSIS ===');
        console.log('Analyzing first 20 data rows (4-23) for data types:');
        
        const dataTypeAnalysis = [];
        
        for (let colIndex = 1; colIndex <= Math.min(headers.length, 30); colIndex++) {
            const header = headers.find(h => h.index === colIndex);
            const columnData = [];
            
            // Sample data from rows 4-23 (20 rows)
            for (let rowIndex = 4; rowIndex <= Math.min(23, worksheet.rowCount); rowIndex++) {
                const cell = worksheet.getCell(rowIndex, colIndex);
                const value = cell.value;
                if (value !== null && value !== undefined && value !== '' && value !== 'N/A') {
                    columnData.push(value.toString().trim());
                }
            }
            
            let suggestedType = 'VARCHAR(255)';
            let maxLength = 0;
            let hasNumbers = false;
            let hasText = false;
            let hasDecimal = false;
            let allIntegers = true;
            
            if (columnData.length > 0) {
                maxLength = Math.max(...columnData.map(v => v.length));
                
                columnData.forEach(value => {
                    if (/^\d+$/.test(value)) {
                        hasNumbers = true;
                    } else if (/^\d+\.\d+$/.test(value)) {
                        hasNumbers = true;
                        hasDecimal = true;
                        allIntegers = false;
                    } else {
                        hasText = true;
                        allIntegers = false;
                    }
                });
                
                // Determine SQL type
                if (hasNumbers && !hasText) {
                    if (hasDecimal) {
                        suggestedType = 'DECIMAL(18,2)';
                    } else if (maxLength <= 10) {
                        suggestedType = 'INT';
                    } else {
                        suggestedType = 'BIGINT';
                    }
                } else if (maxLength <= 50) {
                    suggestedType = 'VARCHAR(50)';
                } else if (maxLength <= 100) {
                    suggestedType = 'VARCHAR(100)';
                } else if (maxLength <= 255) {
                    suggestedType = 'VARCHAR(255)';
                } else {
                    suggestedType = 'TEXT';
                }
            }
            
            dataTypeAnalysis.push({
                columnIndex: colIndex,
                columnName: header ? header.name : `Column_${colIndex}`,
                cleanName: header ? header.cleanName : `column_${colIndex}`,
                sampleCount: columnData.length,
                maxLength: maxLength,
                sampleValues: columnData.slice(0, 3),
                suggestedType: suggestedType
            });
            
            console.log(`${colIndex.toString().padStart(2)}. ${(header ? header.name : `Column_${colIndex}`).substring(0, 25).padEnd(25)} | ${suggestedType.padEnd(15)} | Len: ${maxLength.toString().padStart(3)} | Samples: ${columnData.slice(0, 2).join(', ')}`);
        }
        
        console.log('\n=== SQL TABLE SCHEMA SUGGESTION ===');
        console.log('CREATE TABLE data_team_active_items (');
        console.log('    id INT IDENTITY(1,1) PRIMARY KEY,');
        
        dataTypeAnalysis.forEach((col, index) => {
            const comma = index < dataTypeAnalysis.length - 1 ? ',' : '';
            console.log(`    ${col.cleanName} ${col.suggestedType}${comma}`);
        });
        
        console.log(');');
        
        // Generate a mapping file for future reference
        const mapping = {
            sourceFile: 'DATA TEAM ACTIVE SHEET_ 7-17-2025.xlsx',
            sheet: worksheet.name,
            headerRow: 3,
            dataStartRow: 4,
            totalRows: worksheet.rowCount,
            totalColumns: worksheet.columnCount,
            dataRows: worksheet.rowCount - 3,
            columns: dataTypeAnalysis
        };
        
        require('fs').writeFileSync('excel_column_mapping.json', JSON.stringify(mapping, null, 2));
        console.log('\n✓ Column mapping saved to excel_column_mapping.json');
        
    } catch (error) {
        console.error('Error analyzing Excel file:', error.message);
    }
}

analyzeExcelStructure();