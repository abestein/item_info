import XLSX from 'xlsx';
import fs from 'fs';

// Specific failing row numbers (these are 1-based Excel rows, so subtract 1 for 0-based array indexing)
const failingRows = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700];

async function compareExcelWithSQL() {
    try {
        // Read the Excel file
        const workbook = XLSX.readFile('./DATA_TEAM_ACTIVE_SHEET_7-17-2025.xlsx');
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON with proper handling
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            raw: false
        });

        // Read the SQL file to get the INSERT statements
        const sqlContent = fs.readFileSync('./data_import_statements_PRODUCTION_READY.sql', 'utf8');
        const insertStatements = sqlContent.split('\\n').filter(line => line.trim().startsWith('(') && line.trim().endsWith('),'));

        console.log(`Excel rows: ${jsonData.length}`);
        console.log(`SQL insert statements: ${insertStatements.length}`);

        const comparison = {
            failingRowsComparison: [],
            patterns: {
                mismatchedValues: [],
                encodingIssues: [],
                quotingProblems: [],
                nullHandling: []
            }
        };

        // Compare each failing row
        for (let i = 0; i < failingRows.length; i++) {
            const excelRowNum = failingRows[i];
            const sqlRowIndex = excelRowNum - 2; // Excel row 2 = first data row (after header), SQL index 0

            if (excelRowNum < jsonData.length && sqlRowIndex < insertStatements.length && sqlRowIndex >= 0) {
                const excelRow = jsonData[excelRowNum];
                const sqlStatement = insertStatements[sqlRowIndex];

                // Parse SQL values
                const sqlMatch = sqlStatement.match(/\\((.*)\\),?$/);
                if (!sqlMatch) {
                    console.log(`Failed to parse SQL statement at index ${sqlRowIndex}`);
                    continue;
                }

                const sqlValues = parseSQLValues(sqlMatch[1]);

                const rowComparison = {
                    excelRowNumber: excelRowNum,
                    sqlRowIndex: sqlRowIndex,
                    excelData: excelRow.slice(0, 10), // First 10 columns for brevity
                    sqlData: sqlValues.slice(0, 10),
                    issues: []
                };

                // Compare first few columns to identify patterns
                for (let col = 0; col < Math.min(10, excelRow.length, sqlValues.length); col++) {
                    const excelValue = String(excelRow[col] || '').trim();
                    const sqlValue = String(sqlValues[col] || '').trim();

                    // Remove quotes from SQL value for comparison
                    const cleanSqlValue = sqlValue.replace(/^'(.*)'$/, '$1').replace(/''/g, "'");

                    if (excelValue !== cleanSqlValue) {
                        const issue = {
                            column: col,
                            excelValue: excelValue,
                            sqlValue: cleanSqlValue,
                            rawSqlValue: sqlValue
                        };

                        // Categorize the issue
                        if (excelValue.includes('"') || excelValue.includes("'")) {
                            issue.category = 'quoting_issue';
                            comparison.patterns.quotingProblems.push(issue);
                        } else if (excelValue === '' && cleanSqlValue === 'NULL') {
                            issue.category = 'null_handling';
                            comparison.patterns.nullHandling.push(issue);
                        } else if (excelValue.length !== cleanSqlValue.length) {
                            issue.category = 'length_mismatch';
                            comparison.patterns.encodingIssues.push(issue);
                        } else {
                            issue.category = 'value_mismatch';
                            comparison.patterns.mismatchedValues.push(issue);
                        }

                        rowComparison.issues.push(issue);
                    }
                }

                comparison.failingRowsComparison.push(rowComparison);
            }
        }

        // Save the comparison results
        fs.writeFileSync('./excel_sql_comparison.json', JSON.stringify(comparison, null, 2));

        // Generate summary
        console.log('\\n=== EXCEL vs SQL COMPARISON SUMMARY ===');
        console.log(`Analyzed ${comparison.failingRowsComparison.length} failing rows`);
        console.log(`Quoting problems: ${comparison.patterns.quotingProblems.length}`);
        console.log(`Null handling issues: ${comparison.patterns.nullHandling.length}`);
        console.log(`Encoding issues: ${comparison.patterns.encodingIssues.length}`);
        console.log(`Value mismatches: ${comparison.patterns.mismatchedValues.length}`);

        // Show examples of each type of issue
        console.log('\\n=== QUOTING PROBLEMS EXAMPLES ===');
        comparison.patterns.quotingProblems.slice(0, 3).forEach(issue => {
            console.log(`Column ${issue.column}: Excel="${issue.excelValue}" vs SQL="${issue.sqlValue}"`);
        });

        console.log('\\n=== VALUE MISMATCH EXAMPLES ===');
        comparison.patterns.mismatchedValues.slice(0, 3).forEach(issue => {
            console.log(`Column ${issue.column}: Excel="${issue.excelValue}" vs SQL="${issue.sqlValue}"`);
        });

        return comparison;

    } catch (error) {
        console.error('Error comparing Excel with SQL:', error);
        throw error;
    }
}

function parseSQLValues(sqlValueString) {
    const values = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let escapeNext = false;

    for (let i = 0; i < sqlValueString.length; i++) {
        const char = sqlValueString[i];

        if (escapeNext) {
            current += char;
            escapeNext = false;
            continue;
        }

        if (char === '\\\\') {
            escapeNext = true;
            current += char;
            continue;
        }

        if (!inQuotes) {
            if (char === "'" || char === '"') {
                inQuotes = true;
                quoteChar = char;
                current += char;
            } else if (char === ',') {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        } else {
            if (char === quoteChar) {
                // Check for escaped quote
                if (i + 1 < sqlValueString.length && sqlValueString[i + 1] === quoteChar) {
                    current += char + char;
                    i++; // Skip next character
                } else {
                    inQuotes = false;
                    quoteChar = '';
                    current += char;
                }
            } else {
                current += char;
            }
        }
    }

    // Add the last value
    if (current.trim()) {
        values.push(current.trim());
    }

    return values;
}

// Run the comparison
compareExcelWithSQL().then(() => {
    console.log('\\nComparison complete! Check excel_sql_comparison.json for detailed results.');
}).catch(error => {
    console.error('Comparison failed:', error);
});