const ExcelJS = require('exceljs');
const fs = require('fs');

async function generateSQLSchema() {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile('C:\\Users\\A.Stein\\Downloads\\DATA TEAM ACTIVE SHEET_ 7-17-2025.xlsx');
        
        const worksheet = workbook.worksheets[0];
        console.log(`Analyzing: ${worksheet.name} (${worksheet.rowCount} rows, ${worksheet.columnCount} columns)`);
        
        // Read the multi-level headers from rows 1, 2, and 3
        const row1 = worksheet.getRow(1);
        const row2 = worksheet.getRow(2);
        const row3 = worksheet.getRow(3);
        
        const columns = [];
        
        for (let colIndex = 1; colIndex <= worksheet.columnCount; colIndex++) {
            const val1 = row1.getCell(colIndex).value || '';
            const val2 = row2.getCell(colIndex).value || '';
            const val3 = row3.getCell(colIndex).value || '';
            
            // Build meaningful column name from hierarchy
            let columnName = '';
            let description = '';
            
            // Determine the context/group from upper rows
            if (val1.toString().trim()) {
                description = val1.toString().trim();
            }
            if (val2.toString().trim() && val2.toString().trim() !== val1.toString().trim()) {
                description = description ? `${description} - ${val2.toString().trim()}` : val2.toString().trim();
            }
            
            // The actual field name is in row 3
            columnName = val3.toString().trim() || `Column_${colIndex}`;
            
            // Create unique SQL-safe column name
            let sqlName = columnName
                .replace(/[^a-zA-Z0-9_\s]/g, '_')
                .replace(/\s+/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '')
                .toLowerCase();
            
            // Add context prefix for duplicate names
            if (description.includes('UOM')) {
                if (description.includes('Units per Pack')) sqlName = 'uom_units_' + sqlName;
                else if (description.includes('Pack Type')) sqlName = 'uom_pack_' + sqlName;
                else sqlName = 'uom_' + sqlName;
            } else if (description.includes('Artwork')) {
                sqlName = 'artwork_' + sqlName;
            } else if (description.includes('Dimensions')) {
                if (description.includes('Inner -2')) sqlName = 'dim_inner2_' + sqlName;
                else if (description.includes('Inner -1')) sqlName = 'dim_inner1_' + sqlName;
                else if (description.includes('Sellable')) sqlName = 'dim_sellable_' + sqlName;
                else if (description.includes('Shipper +1')) sqlName = 'dim_ship1_' + sqlName;
                else if (description.includes('Shipper +2')) sqlName = 'dim_ship2_' + sqlName;
                else sqlName = 'dim_' + sqlName;
            } else if (description.includes('Weight')) {
                sqlName = 'weight_' + sqlName;
            } else if (description.includes('Regulatory')) {
                sqlName = 'reg_' + sqlName;
            } else if (description.includes('GTIN')) {
                sqlName = 'gtin_' + sqlName;
            } else if (description.includes('NDC')) {
                sqlName = 'ndc_' + sqlName;
            }
            
            // Sample data for type analysis
            const sampleData = [];
            for (let rowIndex = 4; rowIndex <= Math.min(50, worksheet.rowCount); rowIndex++) {
                const cellValue = worksheet.getCell(rowIndex, colIndex).value;
                if (cellValue !== null && cellValue !== undefined && cellValue !== '' && cellValue !== 'N/A') {
                    sampleData.push(cellValue.toString().trim());
                }
            }
            
            // Determine SQL data type
            let sqlType = 'VARCHAR(255)';
            let maxLength = 0;
            
            if (sampleData.length > 0) {
                maxLength = Math.max(...sampleData.map(v => v.length));
                
                const isAllNumbers = sampleData.every(v => /^\d+$/.test(v));
                const isAllDecimals = sampleData.every(v => /^\d+(\.\d+)?$/.test(v));
                const hasDecimals = sampleData.some(v => /\.\d+/.test(v));
                const isAllDates = sampleData.every(v => /\d{1,2}\/\d{1,2}\/\d{4}/.test(v) || /\d{4}-\d{2}-\d{2}/.test(v));
                
                if (isAllDates) {
                    sqlType = 'DATE';
                } else if (isAllNumbers && maxLength <= 10) {
                    sqlType = 'INT';
                } else if (isAllNumbers && maxLength > 10) {
                    sqlType = 'BIGINT';
                } else if (isAllDecimals && hasDecimals) {
                    sqlType = 'DECIMAL(18,2)';
                } else if (maxLength <= 50) {
                    sqlType = 'VARCHAR(50)';
                } else if (maxLength <= 100) {
                    sqlType = 'VARCHAR(100)';
                } else if (maxLength <= 255) {
                    sqlType = 'VARCHAR(255)';
                } else {
                    sqlType = 'TEXT';
                }
                
                // Special cases
                if (sqlName.includes('upc') || sqlName.includes('ean') || sqlName.includes('gtin')) {
                    sqlType = 'VARCHAR(20)';
                } else if (sqlName.includes('date') || sqlName.includes('exp')) {
                    sqlType = 'VARCHAR(50)'; // Keep as varchar since format varies
                }
            }
            
            columns.push({
                index: colIndex,
                originalName: columnName,
                sqlName: sqlName,
                description: description,
                sqlType: sqlType,
                maxLength: maxLength,
                sampleCount: sampleData.length,
                samples: sampleData.slice(0, 3)
            });
        }
        
        // Check for duplicate SQL names and make them unique
        const nameCount = {};
        columns.forEach(col => {
            if (nameCount[col.sqlName]) {
                nameCount[col.sqlName]++;
                col.sqlName = `${col.sqlName}_${nameCount[col.sqlName]}`;
            } else {
                nameCount[col.sqlName] = 1;
            }
        });
        
        // Generate CREATE TABLE statement
        console.log('\n=== RECOMMENDED SQL TABLE STRUCTURE ===\n');
        
        const createTable = `CREATE TABLE data_team_active_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    created_date DATETIME2 DEFAULT GETDATE(),
    ${columns.map(col => `${col.sqlName} ${col.sqlType}`).join(',\n    ')}
);`;

        console.log(createTable);
        
        // Generate column documentation
        console.log('\n=== COLUMN MAPPING DOCUMENTATION ===\n');
        columns.forEach(col => {
            console.log(`-- ${col.index.toString().padStart(2)}: ${col.originalName} (${col.description})`);
            console.log(`--     SQL: ${col.sqlName} ${col.sqlType}`);
            console.log(`--     Samples: ${col.samples.join(', ')}`);
            console.log('');
        });
        
        // Save comprehensive mapping
        const fullMapping = {
            sourceFile: 'DATA TEAM ACTIVE SHEET_ 7-17-2025.xlsx',
            sheet: worksheet.name,
            analysis: {
                totalRows: worksheet.rowCount,
                totalColumns: worksheet.columnCount,
                headerRows: 3,
                dataStartRow: 4,
                dataRows: worksheet.rowCount - 3
            },
            sqlTable: {
                name: 'data_team_active_items',
                createStatement: createTable
            },
            columns: columns
        };
        
        fs.writeFileSync('comprehensive_excel_mapping.json', JSON.stringify(fullMapping, null, 2));
        
        // Generate INSERT script template
        const insertTemplate = `-- Data import template
-- Use this with BULK INSERT or create a procedure

BULK INSERT data_team_active_items
FROM 'path_to_csv_file.csv'
WITH (
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\\n',
    FIRSTROW = 2,
    TABLOCK
);

-- Or create INSERT statements (sample):
INSERT INTO data_team_active_items (
    ${columns.slice(0, 10).map(col => col.sqlName).join(',\n    ')}
    -- ... add remaining columns
) VALUES (
    -- Sample values would go here
);`;

        console.log('\n=== INSERT TEMPLATE ===\n');
        console.log(insertTemplate);
        
        fs.writeFileSync('create_table_script.sql', createTable);
        fs.writeFileSync('insert_template.sql', insertTemplate);
        
        console.log('\n✓ Files generated:');
        console.log('  - comprehensive_excel_mapping.json');
        console.log('  - create_table_script.sql');
        console.log('  - insert_template.sql');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

generateSQLSchema();