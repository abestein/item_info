const ExcelJS = require('exceljs');
const fs = require('fs');

async function convertExcelToSQL() {
    try {
        console.log('Loading Excel file...');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile('C:\\Users\\A.Stein\\Downloads\\DATA TEAM ACTIVE SHEET_ 7-17-2025.xlsx');
        
        const worksheet = workbook.worksheets[0];
        console.log(`Processing ${worksheet.rowCount} rows from ${worksheet.name}...`);
        
        // Load the column mapping
        const mapping = JSON.parse(fs.readFileSync('comprehensive_excel_mapping.json', 'utf8'));
        const columns = mapping.columns;
        
        console.log(`Found ${columns.length} columns to process...`);
        
        // Generate CSV export (easier for bulk import)
        const csvHeaders = ['id', 'created_date', ...columns.map(col => col.sqlName)];
        const csvRows = [csvHeaders.join(',')];
        
        // Generate SQL INSERT statements
        const sqlInserts = [];
        const batchSize = 100;
        let currentBatch = [];
        
        // Process data rows (starting from row 4)
        console.log('Converting data rows...');
        for (let rowIndex = 4; rowIndex <= worksheet.rowCount; rowIndex++) {
            const row = worksheet.getRow(rowIndex);
            const csvValues = ['DEFAULT', 'DEFAULT']; // id and created_date
            const sqlValues = [];
            
            columns.forEach(col => {
                let cellValue = row.getCell(col.index).value;
                
                // Clean and format the value
                if (cellValue === null || cellValue === undefined || cellValue === '') {
                    cellValue = null;
                } else {
                    cellValue = cellValue.toString().trim();
                    if (cellValue === 'N/A' || cellValue === '' || cellValue === 'NULL') {
                        cellValue = null;
                    }
                }
                
                // Format for CSV
                if (cellValue === null) {
                    csvValues.push('NULL');
                } else {
                    // Escape quotes and wrap in quotes for CSV
                    const csvValue = cellValue.replace(/"/g, '""');
                    csvValues.push(`"${csvValue}"`);
                }
                
                // Format for SQL
                if (cellValue === null) {
                    sqlValues.push('NULL');
                } else {
                    // Escape single quotes for SQL
                    const sqlValue = cellValue.replace(/'/g, "''");
                    if (col.sqlType.includes('INT') || col.sqlType.includes('DECIMAL')) {
                        // Try to parse as number, fallback to NULL if invalid
                        const numValue = parseFloat(cellValue);
                        if (!isNaN(numValue)) {
                            sqlValues.push(numValue.toString());
                        } else {
                            sqlValues.push('NULL');
                        }
                    } else {
                        sqlValues.push(`'${sqlValue}'`);
                    }
                }
            });
            
            // Add to CSV
            csvRows.push(csvValues.join(','));
            
            // Add to SQL batch
            currentBatch.push(`(${sqlValues.join(', ')})`);
            
            // Process batch when it reaches the size limit
            if (currentBatch.length >= batchSize) {
                const insertStatement = `INSERT INTO data_team_active_items (
    ${columns.map(col => col.sqlName).join(',\n    ')}
) VALUES 
${currentBatch.join(',\n')};`;
                sqlInserts.push(insertStatement);
                currentBatch = [];
            }
            
            // Progress indicator
            if (rowIndex % 100 === 0) {
                console.log(`Processed ${rowIndex - 3} data rows...`);
            }
        }
        
        // Process remaining batch
        if (currentBatch.length > 0) {
            const insertStatement = `INSERT INTO data_team_active_items (
    ${columns.map(col => col.sqlName).join(',\n    ')}
) VALUES 
${currentBatch.join(',\n')};`;
            sqlInserts.push(insertStatement);
        }
        
        // Save CSV file
        console.log('Saving CSV file...');
        fs.writeFileSync('data_team_active_items.csv', csvRows.join('\\n'));
        
        // Save SQL INSERT file
        console.log('Saving SQL INSERT statements...');
        const sqlContent = `-- Data import for data_team_active_items
-- Generated from: DATA TEAM ACTIVE SHEET_ 7-17-2025.xlsx
-- Total records: ${worksheet.rowCount - 3}
-- Generated on: ${new Date().toISOString()}

-- First create the table (if not exists)
-- Run create_table_script.sql first

-- Option 1: Use these INSERT statements
${sqlInserts.join('\\n\\n')}

-- Option 2: Use BULK INSERT with the CSV file
/*
BULK INSERT data_team_active_items
FROM 'C:\\\\path\\\\to\\\\data_team_active_items.csv'
WITH (
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\\\\n',
    FIRSTROW = 2,
    TABLOCK,
    FORMAT = 'CSV',
    FIELDQUOTE = '"'
);
*/`;
        
        fs.writeFileSync('data_import_statements.sql', sqlContent);
        
        // Generate data validation script
        const validationScript = `-- Data validation queries
-- Run these after importing to verify data quality

-- 1. Row count check
SELECT COUNT(*) as total_rows FROM data_team_active_items;
-- Expected: ${worksheet.rowCount - 3}

-- 2. Check for empty critical fields
SELECT 
    COUNT(*) as rows_with_brand,
    COUNT(*) - COUNT(brand_name) as rows_missing_brand
FROM data_team_active_items;

-- 3. Sample data verification
SELECT TOP 10 
    brand_name,
    item,
    description1,
    reg_product_type,
    created_date
FROM data_team_active_items
ORDER BY id;

-- 4. Data type validation
SELECT 
    COUNT(*) as total_rows,
    COUNT(CASE WHEN reg_fei IS NOT NULL THEN 1 END) as rows_with_fei,
    COUNT(CASE WHEN inner_1 IS NOT NULL THEN 1 END) as rows_with_upc
FROM data_team_active_items;

-- 5. Check for duplicates
SELECT 
    brand_name,
    item,
    COUNT(*) as duplicate_count
FROM data_team_active_items
GROUP BY brand_name, item
HAVING COUNT(*) > 1;`;
        
        fs.writeFileSync('data_validation_queries.sql', validationScript);
        
        console.log('\\n✅ CONVERSION COMPLETE!');
        console.log('\\n📁 Files generated:');
        console.log('   📋 create_table_script.sql - CREATE TABLE statement');
        console.log('   📊 data_team_active_items.csv - CSV data for bulk import');
        console.log('   💽 data_import_statements.sql - SQL INSERT statements');
        console.log('   🔍 data_validation_queries.sql - Validation queries');
        console.log('   📝 comprehensive_excel_mapping.json - Complete column mapping');
        
        console.log('\\n🚀 Next Steps:');
        console.log('   1. Run create_table_script.sql to create the table');
        console.log('   2. Import data using either:');
        console.log('      • BULK INSERT with the CSV file (recommended for large data)');
        console.log('      • Run data_import_statements.sql (for smaller datasets)');
        console.log('   3. Run data_validation_queries.sql to verify the import');
        
        console.log(`\\n📈 Summary:`);
        console.log(`   • Excel file: ${worksheet.rowCount} rows, ${worksheet.columnCount} columns`);
        console.log(`   • Data rows: ${worksheet.rowCount - 3}`);
        console.log(`   • SQL columns: ${columns.length + 2} (including id and created_date)`);
        console.log(`   • INSERT batches: ${sqlInserts.length}`);
        
    } catch (error) {
        console.error('❌ Error during conversion:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

convertExcelToSQL();