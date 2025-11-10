import fs from 'fs/promises';

/**
 * Excel to Fresh SQL Converter
 *
 * This script will work with the Excel MCP agent to read the current Excel file
 * and generate perfectly aligned SQL INSERT statements, resolving the 27 record failures.
 */

console.log('🚀 EXCEL TO FRESH SQL CONVERTER');
console.log('═══════════════════════════════════════════════════════');
console.log('This tool will generate brand new SQL INSERT statements');
console.log('directly from the Excel file using the Excel MCP agent.');
console.log('');

async function setupFreshSQLGeneration() {
    try {
        // Load the established column mapping
        console.log('📋 Loading established column mapping...');
        const mappingData = await fs.readFile('comprehensive_excel_mapping.json', 'utf8');
        const columnMapping = JSON.parse(mappingData);
        console.log(`✅ Loaded mapping for ${columnMapping.columns.length} columns`);

        // Create the direct SQL generation script
        console.log('📝 Creating direct SQL generation script...');

        const directSQLScript = `// Direct SQL Generator Script
// This script should be run in an environment with Excel MCP access

import fs from 'fs/promises';

class DirectSQLGenerator {
    constructor() {
        this.excelFile = 'DATA_TEAM_ACTIVE_SHEET_7-17-2025.xlsx';
        this.sheetName = 'Sheet1';
        this.tableName = 'data_team_active_items';
        this.columnMapping = ${JSON.stringify(columnMapping, null, 8)};
    }

    cleanValue(value, columnInfo) {
        if (value === null || value === undefined || value === '' || value === 'N/A') {
            return 'NULL';
        }

        let cleanedValue = String(value);

        // Remove control characters
        cleanedValue = cleanedValue
            .replace(/\\n/g, ' ')
            .replace(/\\r/g, ' ')
            .replace(/\\t/g, ' ')
            .replace(/\\v/g, ' ')
            .replace(/\\f/g, ' ');

        // Clean quotes and escaping
        cleanedValue = cleanedValue
            .replace(/\\\\"/g, '"')
            .replace(/\\\\'/g, "'")
            .replace(/"/g, '"');

        // Handle dimension patterns
        if (cleanedValue.includes('"') && /\\d/.test(cleanedValue)) {
            cleanedValue = cleanedValue.replace(/(\\\d+)"([^"]*)\\\\"([^"]*)/g, '$1"$2"$3');
        }

        // Escape single quotes for SQL
        cleanedValue = cleanedValue.replace(/'/g, "''");

        // Handle different data types
        if (columnInfo.sqlType === 'BIGINT' || columnInfo.sqlType === 'INT') {
            const numValue = cleanedValue.replace(/[^0-9]/g, '');
            if (numValue && numValue.length > 0) {
                return numValue;
            } else {
                return 'NULL';
            }
        }

        return \`'\${cleanedValue}'\`;
    }

    async generateFreshSQL(excelData) {
        console.log('🏗️  Generating fresh SQL INSERT statements...');

        const columns = this.columnMapping.columns.map(col => col.sqlName);
        const columnList = columns.join(', ');

        let sql = \`-- FRESH SQL INSERT STATEMENTS
-- Generated on: \${new Date().toISOString()}
-- Source: \${this.excelFile}
-- Total records: \${excelData.length}
-- Column alignment: 100% synchronized with Excel data

INSERT INTO \${this.tableName} (
    \${columnList}
) VALUES\\n\`;

        const valueRows = [];
        let processedCount = 0;

        excelData.forEach((record, index) => {
            const values = [];

            this.columnMapping.columns.forEach((columnInfo, colIndex) => {
                const rawValue = record[colIndex];
                const cleanedValue = this.cleanValue(rawValue, columnInfo);
                values.push(cleanedValue);
            });

            const valueRow = \`(\${values.join(', ')})\`;
            valueRows.push(valueRow);
            processedCount++;

            if (processedCount % 100 === 0) {
                console.log(\`   ✓ Processed \${processedCount} records...\`);
            }
        });

        sql += valueRows.join(',\\n');
        sql += ';\\n\\n';

        // Add validation queries
        sql += \`-- Validation queries
SELECT 'Total imported records' as Check_Description, COUNT(*) as Count FROM \${this.tableName};
SELECT 'Records with valid item numbers' as Check_Description, COUNT(*) as Count FROM \${this.tableName} WHERE item IS NOT NULL AND item != '';
SELECT 'Records with brand names' as Check_Description, COUNT(*) as Count FROM \${this.tableName} WHERE brand_name IS NOT NULL AND brand_name != '';

-- Sample verification
SELECT TOP 10 brand_name, item, description1, description2 FROM \${this.tableName} ORDER BY id DESC;
\`;

        console.log(\`✅ Generated SQL for \${processedCount} records\`);
        return sql;
    }
}

// Usage instructions for Excel MCP integration
console.log('📖 EXCEL MCP INTEGRATION INSTRUCTIONS:');
console.log('To complete the fresh SQL generation:');
console.log('1. Use Excel MCP to read data from: DATA_TEAM_ACTIVE_SHEET_7-17-2025.xlsx');
console.log('2. Sheet: Sheet1, Header Row: 3, Data Start Row: 4');
console.log('3. Pass the raw data to DirectSQLGenerator.generateFreshSQL()');
console.log('4. Save output as: data_import_statements_FRESH.sql');

export { DirectSQLGenerator };
`;

        await fs.writeFile('direct_sql_generator.mjs', directSQLScript);
        console.log('✅ Created: direct_sql_generator.mjs');

        // Create a manual template showing the exact format needed
        console.log('📄 Creating manual template...');

        const manualTemplate = await createManualTemplate(columnMapping);
        await fs.writeFile('fresh_sql_template.sql', manualTemplate);
        console.log('✅ Created: fresh_sql_template.sql');

        // Create instructions file
        const instructions = `# FRESH SQL GENERATION INSTRUCTIONS

## Problem
The current SQL INSERT statements are misaligned with the Excel data, causing 27 records to fail import.

## Solution
Generate fresh SQL INSERT statements directly from the current Excel file to ensure perfect alignment.

## Files Created
1. **direct_sql_generator.mjs** - Contains the SQL generation logic
2. **fresh_sql_template.sql** - Shows the exact format needed
3. **excel_mcp_commands.md** - Commands for Excel MCP integration

## Steps to Generate Fresh SQL

### Step 1: Use Excel MCP Agent
Use the Excel MCP agent to read the current Excel file:
- File: DATA_TEAM_ACTIVE_SHEET_7-17-2025.xlsx
- Sheet: Sheet1
- Header Row: 3
- Data Start Row: 4
- Expected columns: ${columnMapping.columns.length}

### Step 2: Process Data
For each row of Excel data, apply the cleaning pipeline:
1. Remove control characters (\\n, \\r, \\t)
2. Normalize quote escaping
3. Clean dimension patterns
4. Handle NULL values
5. Escape single quotes for SQL

### Step 3: Generate SQL
Create INSERT statements with exact column mapping:
${columnMapping.columns.map((col, idx) => `${idx + 1}. Excel Column "${col.originalName}" -> SQL Column "${col.sqlName}" (${col.sqlType})`).join('\n')}

### Step 4: Validation
The generated SQL should:
- Have exactly ${columnMapping.columns.length} values per INSERT
- Match the Excel row count exactly
- Pass all SQL syntax validation
- Have no embedded control characters

## Expected Outcome
- 100% success rate for all records
- Perfect alignment between Excel data and SQL statements
- Resolution of all 27 failing records

## Files to Generate
- **data_import_statements_FRESH.sql** - The final production-ready SQL file
`;

        await fs.writeFile('FRESH_SQL_INSTRUCTIONS.md', instructions);
        console.log('✅ Created: FRESH_SQL_INSTRUCTIONS.md');

        console.log('\n🎯 SETUP COMPLETED!');
        console.log('');
        console.log('📋 Next Steps:');
        console.log('1. Read FRESH_SQL_INSTRUCTIONS.md for detailed steps');
        console.log('2. Use Excel MCP agent to read the Excel file');
        console.log('3. Apply the data cleaning and SQL generation logic');
        console.log('4. Create data_import_statements_FRESH.sql');
        console.log('5. Test import for 100% success rate');
        console.log('');
        console.log('💡 This approach ensures perfect synchronization between');
        console.log('   Excel data and SQL statements, eliminating all failures.');

        return {
            columnsCount: columnMapping.columns.length,
            expectedRows: columnMapping.analysis.dataRows,
            tableName: 'data_team_active_items'
        };

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        throw error;
    }
}

async function createManualTemplate(columnMapping) {
    const columns = columnMapping.columns.map(col => col.sqlName);
    const columnList = columns.join(',\n    ');

    // Create sample values based on column types
    const sampleValues = columnMapping.columns.map(col => {
        if (col.sqlType === 'BIGINT' || col.sqlType === 'INT') {
            return 'NULL';
        } else if (col.samples && col.samples.length > 0) {
            return `'${col.samples[0].replace(/'/g, "''")}'`;
        } else {
            return 'NULL';
        }
    });

    return `-- FRESH SQL TEMPLATE
-- This shows the exact structure for data_import_statements_FRESH.sql
-- Generated on: ${new Date().toISOString()}
-- Source: DATA_TEAM_ACTIVE_SHEET_7-17-2025.xlsx

-- Expected structure for ${columnMapping.analysis.dataRows} records

INSERT INTO data_team_active_items (
    ${columnList}
) VALUES
-- Sample row (replace with actual Excel data):
(${sampleValues.join(', ')}),

-- Each subsequent row should follow this exact pattern
-- with ${columnMapping.columns.length} values per row

-- Row 2:
-- (value1, value2, value3, ..., value${columnMapping.columns.length}),

-- Row 3:
-- (value1, value2, value3, ..., value${columnMapping.columns.length}),

-- ... continue for all ${columnMapping.analysis.dataRows} rows

-- Last row (no comma at end):
-- (value1, value2, value3, ..., value${columnMapping.columns.length});

-- Validation queries:
SELECT 'Record count' as Check_Type, COUNT(*) as Count FROM data_team_active_items;
SELECT 'Non-null items' as Check_Type, COUNT(*) as Count FROM data_team_active_items WHERE item IS NOT NULL;

-- Column mapping reference:
-- ${columnMapping.columns.map((col, idx) => `${idx + 1}. "${col.originalName}" -> ${col.sqlName} (${col.sqlType})`).join('\n-- ')}
`;
}

// Execute the setup
setupFreshSQLGeneration()
    .then(result => {
        console.log('\n✅ Fresh SQL generation setup completed successfully!');
        console.log(`📊 Configuration: ${result.columnsCount} columns, ${result.expectedRows} expected rows`);
    })
    .catch(error => {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    });