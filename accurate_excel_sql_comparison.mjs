import XLSX from 'xlsx';
import fs from 'fs';

// Specific failing row numbers (these correspond to Excel row numbers)
const failingRows = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700];

async function accurateComparison() {
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

        console.log(`Excel total rows: ${jsonData.length}`);
        console.log(`Excel headers: ${JSON.stringify(jsonData[0].slice(0, 10))}...`);

        // Read the SQL file and extract all data rows
        const sqlContent = fs.readFileSync('./data_import_statements_PRODUCTION_READY.sql', 'utf8');

        // Find all lines that start with ( and end with ), - these are our data rows
        const dataLines = sqlContent.split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed.startsWith('(') && (trimmed.endsWith('),') || trimmed.endsWith(');'));
        });

        console.log(`SQL data lines found: ${dataLines.length}`);

        const analysis = {
            totalExcelRows: jsonData.length,
            totalSQLRows: dataLines.length,
            failingRowsAnalysis: [],
            commonIssues: {
                specialCharacters: 0,
                quotingIssues: 0,
                encodingProblems: 0,
                nullMismatches: 0,
                lengthMismatches: 0
            }
        };

        // Analyze each failing row
        for (const excelRowNum of failingRows) {
            if (excelRowNum >= jsonData.length) {
                console.log(`Excel row ${excelRowNum} doesn't exist (only ${jsonData.length} rows)`);
                continue;
            }

            // Excel row 2 = first data row (row 1 is headers)
            // So Excel row N corresponds to SQL data index N-2
            const sqlDataIndex = excelRowNum - 2;

            if (sqlDataIndex < 0 || sqlDataIndex >= dataLines.length) {
                console.log(`SQL data index ${sqlDataIndex} out of range (${dataLines.length} SQL rows)`);
                continue;
            }

            const excelRow = jsonData[excelRowNum];
            const sqlLine = dataLines[sqlDataIndex].trim();

            // Parse SQL line
            const sqlData = parseSQLRow(sqlLine);

            const rowAnalysis = {
                excelRowNumber: excelRowNum,
                sqlDataIndex: sqlDataIndex,
                excelSample: excelRow.slice(0, 5), // First 5 columns
                sqlSample: sqlData.slice(0, 5),
                issues: [],
                problemCells: []
            };

            // Compare key columns where issues are most likely
            const columnsToCheck = Math.min(10, excelRow.length, sqlData.length);

            for (let col = 0; col < columnsToCheck; col++) {
                const excelValue = String(excelRow[col] || '').trim();
                let sqlValue = sqlData[col] || '';

                // Clean SQL value (remove quotes, handle NULL)
                if (sqlValue === 'NULL') {
                    sqlValue = '';
                } else if (typeof sqlValue === 'string') {
                    // Remove surrounding quotes and unescape
                    sqlValue = sqlValue.replace(/^'(.*)'$/, '$1').replace(/''/g, "'");
                }

                sqlValue = String(sqlValue).trim();

                // Check for differences
                if (excelValue !== sqlValue) {
                    const issue = {
                        column: col,
                        excelValue: excelValue,
                        sqlValue: sqlValue,
                        type: 'value_mismatch'
                    };

                    // Categorize the issue
                    if (excelValue.includes('"') || excelValue.includes("'") || excelValue.includes('\\\\')) {
                        issue.type = 'special_characters';
                        analysis.commonIssues.specialCharacters++;
                    } else if (excelValue === '' && sqlValue !== '') {
                        issue.type = 'null_handling';
                        analysis.commonIssues.nullMismatches++;
                    } else if (Math.abs(excelValue.length - sqlValue.length) > 2) {
                        issue.type = 'length_mismatch';
                        analysis.commonIssues.lengthMismatches++;
                    } else {
                        issue.type = 'encoding_issue';
                        analysis.commonIssues.encodingProblems++;
                    }

                    rowAnalysis.issues.push(issue);
                    rowAnalysis.problemCells.push(col);
                }
            }

            // Check for problematic characters in the entire Excel row
            const rowText = excelRow.join(' ');
            const problemChars = rowText.match(/[""''&\\\\\\n\\r\\t]/g);
            if (problemChars) {
                rowAnalysis.specialCharactersFound = [...new Set(problemChars)];
                rowAnalysis.hasProblematicChars = true;
            }

            analysis.failingRowsAnalysis.push(rowAnalysis);
        }

        // Save detailed analysis
        fs.writeFileSync('./accurate_comparison_results.json', JSON.stringify(analysis, null, 2));

        // Print summary
        console.log('\\n=== ACCURATE COMPARISON SUMMARY ===');
        console.log(`Total failing rows analyzed: ${analysis.failingRowsAnalysis.length}`);
        console.log(`Rows with special characters: ${analysis.failingRowsAnalysis.filter(r => r.hasProblematicChars).length}`);
        console.log('\\nCommon issue types:');
        Object.entries(analysis.commonIssues).forEach(([type, count]) => {
            console.log(`  ${type}: ${count}`);
        });

        // Show detailed analysis for first few rows
        console.log('\\n=== DETAILED ANALYSIS (First 3 failing rows) ===');
        analysis.failingRowsAnalysis.slice(0, 3).forEach(row => {
            console.log(`\\nExcel Row ${row.excelRowNumber} (SQL Index ${row.sqlDataIndex}):`);
            console.log(`  Excel data: ${JSON.stringify(row.excelSample)}`);
            console.log(`  SQL data:   ${JSON.stringify(row.sqlSample)}`);
            if (row.hasProblematicChars) {
                console.log(`  Special chars found: ${row.specialCharactersFound.join(', ')}`);
            }
            if (row.issues.length > 0) {
                console.log(`  Issues found:`);
                row.issues.slice(0, 3).forEach(issue => {
                    console.log(`    Col ${issue.column} (${issue.type}): "${issue.excelValue}" vs "${issue.sqlValue}"`);
                });
            }
        });

        return analysis;

    } catch (error) {
        console.error('Error in accurate comparison:', error);
        throw error;
    }
}

function parseSQLRow(sqlLine) {
    // Remove the outer parentheses and trailing comma/semicolon
    let content = sqlLine.replace(/^\(/, '').replace(/\),?;?$/, '');

    const values = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let i = 0;

    while (i < content.length) {
        const char = content[i];

        if (!inQuotes) {
            if (char === "'" || char === '"') {
                inQuotes = true;
                quoteChar = char;
                current += char;
            } else if (char === ',') {
                // End of value
                values.push(current.trim());
                current = '';
                // Skip whitespace after comma
                while (i + 1 < content.length && content[i + 1] === ' ') {
                    i++;
                }
            } else {
                current += char;
            }
        } else {
            if (char === quoteChar) {
                // Check if this is an escaped quote
                if (i + 1 < content.length && content[i + 1] === quoteChar) {
                    current += char + char;
                    i++; // Skip the next quote
                } else {
                    // End of quoted string
                    inQuotes = false;
                    current += char;
                }
            } else {
                current += char;
            }
        }
        i++;
    }

    // Add the last value
    if (current.trim()) {
        values.push(current.trim());
    }

    return values;
}

// Run the analysis
accurateComparison().then(() => {
    console.log('\\nAccurate comparison complete! Check accurate_comparison_results.json for detailed results.');
}).catch(error => {
    console.error('Analysis failed:', error);
});