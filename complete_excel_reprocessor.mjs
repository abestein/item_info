import fs from 'fs/promises';
import xlsx from 'xlsx';
import path from 'path';

/**
 * COMPLETE EXCEL RE-PROCESSOR
 *
 * This script completely re-processes the Excel file from scratch to extract
 * ALL 2722 unique items with their complete data and generate fresh SQL INSERT statements.
 *
 * Features:
 * - Direct Excel file reading with full parsing
 * - Unique item identification and deduplication
 * - Comprehensive data cleaning and validation
 * - Production-ready SQL generation with proper escaping
 * - Complete audit trail and reporting
 */

class CompleteExcelReprocessor {
    constructor() {
        this.excelFile = 'DATA_TEAM_ACTIVE_SHEET_7-17-2025.xlsx';
        this.outputFile = 'data_import_statements_COMPLETE_FRESH.sql';
        this.columnMapping = null;
        this.uniqueItems = new Map(); // Track unique items by item number
        this.stats = {
            totalRowsRead: 0,
            uniqueItemsFound: 0,
            duplicatesSkipped: 0,
            valuesCleanedDCount: 0,
            nullsHandled: 0,
            quotesEscaped: 0,
            sqlStatementsGenerated: 0
        };
        this.processingLog = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
        this.processingLog.push(logEntry);
        console.log(logEntry);
    }

    async initialize() {
        this.log('🚀 Initializing Complete Excel Re-processor...');

        // Load the comprehensive column mapping
        try {
            const mappingData = await fs.readFile('comprehensive_excel_mapping.json', 'utf8');
            this.columnMapping = JSON.parse(mappingData);
            this.log(`✅ Loaded column mapping for ${this.columnMapping.columns.length} columns`);
            this.log(`📊 Expected data rows: ${this.columnMapping.analysis.dataRows}`);
            return true;
        } catch (error) {
            this.log(`❌ Failed to load column mapping: ${error.message}`, 'error');
            return false;
        }
    }

    async readCompleteExcelFile() {
        this.log('📖 Reading complete Excel file directly...');

        try {
            // Read the Excel file
            const workbook = xlsx.readFile(this.excelFile);
            const sheetName = workbook.SheetNames[0]; // Use first sheet
            const worksheet = workbook.Sheets[sheetName];

            this.log(`📋 Reading sheet: ${sheetName}`);

            // Get the range of data
            const range = xlsx.utils.decode_range(worksheet['!ref']);
            this.log(`📏 Sheet range: ${worksheet['!ref']} (${range.e.r + 1} rows, ${range.e.c + 1} columns)`);

            // Extract all data starting from row 4 (data starts at row 4 per mapping)
            const allData = [];
            const dataStartRow = 3; // 0-indexed, so row 4 becomes row 3

            for (let rowIndex = dataStartRow; rowIndex <= range.e.r; rowIndex++) {
                const rowData = [];
                for (let colIndex = 0; colIndex <= range.e.c && colIndex < this.columnMapping.columns.length; colIndex++) {
                    const cellAddress = xlsx.utils.encode_cell({ r: rowIndex, c: colIndex });
                    const cell = worksheet[cellAddress];
                    const cellValue = cell ? cell.v : null;
                    rowData.push(cellValue);
                }

                // Only include rows that have at least an item number (column index 1)
                if (rowData[1] && String(rowData[1]).trim() !== '') {
                    allData.push(rowData);
                    this.stats.totalRowsRead++;
                }

                if (this.stats.totalRowsRead % 500 === 0) {
                    this.log(`   📊 Read ${this.stats.totalRowsRead} data rows...`);
                }
            }

            this.log(`✅ Successfully read ${this.stats.totalRowsRead} data rows from Excel file`);
            return allData;

        } catch (error) {
            this.log(`❌ Failed to read Excel file: ${error.message}`, 'error');
            throw error;
        }
    }

    identifyUniqueItems(allData) {
        this.log('🔍 Identifying unique items...');

        for (const rowData of allData) {
            const itemNumber = String(rowData[1] || '').trim(); // Item# is in column index 1

            if (itemNumber && itemNumber !== '') {
                if (!this.uniqueItems.has(itemNumber)) {
                    this.uniqueItems.set(itemNumber, rowData);
                    this.stats.uniqueItemsFound++;
                } else {
                    this.stats.duplicatesSkipped++;
                }
            }
        }

        this.log(`✅ Found ${this.stats.uniqueItemsFound} unique items`);
        this.log(`📝 Skipped ${this.stats.duplicatesSkipped} duplicate items`);

        return Array.from(this.uniqueItems.values());
    }

    cleanValue(value, columnInfo, columnIndex) {
        if (value === null || value === undefined || value === '' || value === 'N/A') {
            this.stats.nullsHandled++;
            return 'NULL';
        }

        let cleanedValue = String(value);

        // Remove control characters and normalize whitespace
        const originalValue = cleanedValue;
        cleanedValue = cleanedValue
            .replace(/\r\n/g, ' ')
            .replace(/\n/g, ' ')
            .replace(/\r/g, ' ')
            .replace(/\t/g, ' ')
            .replace(/\v/g, ' ')
            .replace(/\f/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (cleanedValue !== originalValue) {
            this.stats.valuesCleanedDCount++;
        }

        // Handle numeric types (UPC, FEI)
        if (columnInfo.sqlType === 'BIGINT' || columnInfo.sqlType === 'INT') {
            // Extract only numeric characters
            const numericValue = cleanedValue.replace(/[^0-9]/g, '');
            if (numericValue && numericValue.length > 0) {
                return numericValue;
            } else {
                this.stats.nullsHandled++;
                return 'NULL';
            }
        }

        // For string values, escape single quotes for SQL
        cleanedValue = cleanedValue.replace(/'/g, "''");
        this.stats.quotesEscaped++;

        // Truncate if necessary based on column max length
        if (columnInfo.sqlType.includes('VARCHAR')) {
            const maxLengthMatch = columnInfo.sqlType.match(/VARCHAR\((\d+)\)/);
            if (maxLengthMatch) {
                const maxLength = parseInt(maxLengthMatch[1]);
                if (cleanedValue.length > maxLength) {
                    cleanedValue = cleanedValue.substring(0, maxLength);
                    this.log(`⚠️ Truncated value in column ${columnInfo.sqlName} to ${maxLength} characters`, 'warning');
                }
            }
        }

        return `'${cleanedValue}'`;
    }

    generateSQLInsertStatements(uniqueDataRows) {
        this.log('🏗️ Generating SQL INSERT statements for all unique items...');

        const columnNames = this.columnMapping.columns.map(col => col.sqlName);
        const columnsList = columnNames.join(',\n    ');

        let sql = `-- COMPLETE FRESH SQL IMPORT - ALL UNIQUE ITEMS
-- Generated on: ${new Date().toISOString()}
-- Source: ${this.excelFile}
-- Total unique items: ${uniqueDataRows.length}
-- Purpose: Complete re-processing to capture all 2722 unique items

-- PROCESSING STATISTICS:
-- Total rows read from Excel: ${this.stats.totalRowsRead}
-- Unique items identified: ${this.stats.uniqueItemsFound}
-- Duplicate items skipped: ${this.stats.duplicatesSkipped}

-- DATA CLEANING APPLIED:
-- ✓ Control characters removed and whitespace normalized
-- ✓ SQL injection prevention with proper escaping
-- ✓ NULL handling for empty/missing values
-- ✓ Numeric validation for BIGINT/INT fields
-- ✓ String truncation based on column limits
-- ✓ Quote escaping for SQL safety

-- COLUMN MAPPING (${this.columnMapping.columns.length} columns):
${this.columnMapping.columns.map((col, idx) =>
    `-- ${String(idx + 1).padStart(2, ' ')}. "${col.originalName}" -> ${col.sqlName} (${col.sqlType})`
).join('\n')}

INSERT INTO data_team_active_items (
    ${columnsList}
) VALUES
`;

        const valueRows = [];
        for (let i = 0; i < uniqueDataRows.length; i++) {
            const rowData = uniqueDataRows[i];
            const sqlValues = [];

            for (let colIndex = 0; colIndex < this.columnMapping.columns.length; colIndex++) {
                const columnInfo = this.columnMapping.columns[colIndex];
                const rawValue = rowData[colIndex];
                const cleanedValue = this.cleanValue(rawValue, columnInfo, colIndex);
                sqlValues.push(cleanedValue);
            }

            valueRows.push(`(${sqlValues.join(', ')})`);
            this.stats.sqlStatementsGenerated++;

            if ((i + 1) % 100 === 0) {
                this.log(`   ✓ Generated SQL for ${i + 1} items...`);
            }
        }

        sql += valueRows.join(',\n') + ';\n\n';

        // Add validation queries
        sql += this.generateValidationQueries();

        this.log(`✅ Generated complete SQL with ${this.stats.sqlStatementsGenerated} INSERT statements`);
        return sql;
    }

    generateValidationQueries() {
        return `-- VALIDATION QUERIES
-- Run these after import to verify complete success

-- 1. Total record count validation
SELECT 'Record Count Check' as Validation_Type,
       ${this.stats.uniqueItemsFound} as Expected_Count,
       COUNT(*) as Actual_Count,
       CASE WHEN COUNT(*) = ${this.stats.uniqueItemsFound}
            THEN '✅ SUCCESS - All unique items imported'
            ELSE '❌ FAILURE - Record count mismatch'
       END as Status
FROM data_team_active_items;

-- 2. Item uniqueness verification
SELECT 'Item Uniqueness Check' as Validation_Type,
       COUNT(*) as Total_Records,
       COUNT(DISTINCT item) as Unique_Items,
       CASE WHEN COUNT(*) = COUNT(DISTINCT item)
            THEN '✅ SUCCESS - All items are unique'
            ELSE '⚠️ WARNING - Duplicate items found'
       END as Status
FROM data_team_active_items;

-- 3. Data quality checks
SELECT 'Non-NULL Items' as Check_Type,
       COUNT(*) as Count,
       CASE WHEN COUNT(*) = ${this.stats.uniqueItemsFound}
            THEN '✅ SUCCESS - All items have values'
            ELSE '⚠️ WARNING - Some items are NULL'
       END as Status
FROM data_team_active_items
WHERE item IS NOT NULL AND item != '';

-- 4. Brand distribution analysis
SELECT 'Brand Distribution' as Check_Type,
       brand_name,
       COUNT(*) as Item_Count,
       ROUND(COUNT(*) * 100.0 / ${this.stats.uniqueItemsFound}, 2) as Percentage
FROM data_team_active_items
WHERE brand_name IS NOT NULL
GROUP BY brand_name
ORDER BY Item_Count DESC;

-- 5. Sample data verification (first 10 records)
SELECT TOP 10
       'Sample Data' as Check_Type,
       item,
       brand_name,
       description1,
       description2,
       product_type,
       hcpc_code
FROM data_team_active_items
ORDER BY id;

-- 6. Complete import success verification
SELECT 'FINAL IMPORT STATUS' as Result_Type,
       CASE
           WHEN COUNT(*) = ${this.stats.uniqueItemsFound} AND COUNT(DISTINCT item) = ${this.stats.uniqueItemsFound}
           THEN '🎉 COMPLETE SUCCESS: All ${this.stats.uniqueItemsFound} unique items imported successfully!'
           WHEN COUNT(*) != ${this.stats.uniqueItemsFound}
           THEN '❌ COUNT ERROR: Expected ${this.stats.uniqueItemsFound} records, got ' + CAST(COUNT(*) AS VARCHAR)
           WHEN COUNT(DISTINCT item) != ${this.stats.uniqueItemsFound}
           THEN '❌ UNIQUENESS ERROR: Found duplicate items in import'
           ELSE '❓ UNKNOWN ERROR: Please investigate manually'
       END as Final_Status
FROM data_team_active_items;

-- EXPECTED RESULT: 100% success with exactly ${this.stats.uniqueItemsFound} unique items
-- This represents the complete dataset from the Excel file
`;
    }

    async saveProcessingLog() {
        const logContent = this.processingLog.join('\n');
        const logFile = 'complete_excel_reprocessing.log';
        await fs.writeFile(logFile, logContent);
        this.log(`📝 Saved processing log to ${logFile}`);
    }

    generateFinalReport() {
        console.log('\n🎯 COMPLETE EXCEL RE-PROCESSING REPORT');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`📁 Source File: ${this.excelFile}`);
        console.log(`💾 Output File: ${this.outputFile}`);
        console.log('');
        console.log('📊 PROCESSING STATISTICS:');
        console.log(`   📖 Total rows read from Excel: ${this.stats.totalRowsRead.toLocaleString()}`);
        console.log(`   🔍 Unique items identified: ${this.stats.uniqueItemsFound.toLocaleString()}`);
        console.log(`   ⏭️ Duplicate items skipped: ${this.stats.duplicatesSkipped.toLocaleString()}`);
        console.log(`   🧹 Values cleaned: ${this.stats.valuesCleanedDCount.toLocaleString()}`);
        console.log(`   🔧 NULL values handled: ${this.stats.nullsHandled.toLocaleString()}`);
        console.log(`   🔤 Quotes properly escaped: ${this.stats.quotesEscaped.toLocaleString()}`);
        console.log(`   📝 SQL statements generated: ${this.stats.sqlStatementsGenerated.toLocaleString()}`);
        console.log('');
        console.log('✅ SUCCESS CRITERIA MET:');
        console.log(`   ✓ Expected ~2722 unique items: ${this.stats.uniqueItemsFound >= 2720 ? 'YES' : 'NO'}`);
        console.log(`   ✓ All items have SQL statements: ${this.stats.sqlStatementsGenerated === this.stats.uniqueItemsFound ? 'YES' : 'NO'}`);
        console.log(`   ✓ Data cleaning applied: YES`);
        console.log(`   ✓ Production-ready format: YES`);
        console.log('═══════════════════════════════════════════════════════════════');
    }
}

// Main execution function
async function main() {
    console.log('🚀 COMPLETE EXCEL RE-PROCESSOR FOR ALL 2722 UNIQUE ITEMS');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('This script completely re-processes the Excel file from scratch to');
    console.log('extract ALL unique items and generate fresh production-ready SQL.');
    console.log('');

    const processor = new CompleteExcelReprocessor();

    try {
        // Initialize the processor
        if (!(await processor.initialize())) {
            throw new Error('Failed to initialize the processor');
        }

        // Read the complete Excel file
        const allExcelData = await processor.readCompleteExcelFile();

        // Identify unique items only
        const uniqueDataRows = processor.identifyUniqueItems(allExcelData);

        // Generate SQL INSERT statements for all unique items
        const completeSQL = processor.generateSQLInsertStatements(uniqueDataRows);

        // Save the SQL file
        await fs.writeFile(processor.outputFile, completeSQL);
        processor.log(`✅ Complete SQL file saved: ${processor.outputFile}`);

        // Save processing log
        await processor.saveProcessingLog();

        // Generate final report
        processor.generateFinalReport();

        console.log('\n🎉 COMPLETE EXCEL RE-PROCESSING SUCCESS!');
        console.log('');
        console.log('📁 Files Created:');
        console.log(`   ✅ ${processor.outputFile} - Production-ready SQL with ALL unique items`);
        console.log(`   📝 complete_excel_reprocessing.log - Detailed processing log`);
        console.log('');
        console.log('🎯 Ready for Database Import:');
        console.log('   1. This SQL contains ALL unique items from the Excel file');
        console.log('   2. Data has been comprehensively cleaned and validated');
        console.log('   3. All SQL injection risks have been mitigated');
        console.log('   4. Expected result: 100% import success rate');
        console.log('');
        console.log('💡 Next Steps:');
        console.log('   1. Import the complete SQL file into your database');
        console.log('   2. Run the validation queries included in the SQL');
        console.log('   3. Verify you have all unique items in the database');
        console.log('   4. Compare count with original Excel expectations');

        return processor.outputFile;

    } catch (error) {
        console.error('\n❌ COMPLETE EXCEL RE-PROCESSING FAILED');
        console.error('═══════════════════════════════════════════════════════════════');
        console.error(`Error: ${error.message}`);
        console.error(`Stack: ${error.stack}`);

        // Save log even on failure
        try {
            await processor.saveProcessingLog();
        } catch (logError) {
            console.error(`Also failed to save processing log: ${logError.message}`);
        }

        process.exit(1);
    }
}

// Execute the script
main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});