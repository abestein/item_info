import XLSX from 'xlsx';
import fs from 'fs';

// Specific failing row numbers
const failingRows = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700];

async function analyzeFailingRows() {
    try {
        // Read the Excel file
        const workbook = XLSX.readFile('./DATA_TEAM_ACTIVE_SHEET_7-17-2025.xlsx');
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            raw: false // This ensures we get formatted values, not raw numbers
        });

        console.log(`Total rows in Excel: ${jsonData.length}`);
        console.log(`Headers: ${JSON.stringify(jsonData[0])}`);

        const analysis = {
            totalRows: jsonData.length,
            headers: jsonData[0],
            failingRowsAnalysis: [],
            patterns: {
                specialCharacters: new Set(),
                dataTypes: {},
                nullValues: 0,
                emptyStrings: 0,
                longValues: [],
                unusualFormatting: []
            }
        };

        // Analyze each failing row
        for (const rowNum of failingRows) {
            if (rowNum < jsonData.length) {
                const rowData = jsonData[rowNum];
                const rowAnalysis = {
                    rowNumber: rowNum,
                    data: rowData,
                    issues: []
                };

                // Check each cell in the row
                rowData.forEach((cell, colIndex) => {
                    const cellValue = String(cell);

                    // Check for special characters
                    const specialChars = cellValue.match(/[^\w\s\-\.\,\(\)\/\:]/g);
                    if (specialChars) {
                        specialChars.forEach(char => analysis.patterns.specialCharacters.add(char));
                        rowAnalysis.issues.push({
                            column: colIndex,
                            columnName: analysis.headers[colIndex],
                            issue: 'special_characters',
                            characters: specialChars,
                            value: cellValue
                        });
                    }

                    // Check for quotes and escaping issues
                    if (cellValue.includes("'") || cellValue.includes('"') || cellValue.includes('\\')) {
                        rowAnalysis.issues.push({
                            column: colIndex,
                            columnName: analysis.headers[colIndex],
                            issue: 'quote_or_escape_characters',
                            value: cellValue
                        });
                    }

                    // Check for null/empty values
                    if (cellValue === '' || cellValue === 'null' || cellValue === 'NULL') {
                        analysis.patterns.nullValues++;
                        rowAnalysis.issues.push({
                            column: colIndex,
                            columnName: analysis.headers[colIndex],
                            issue: 'null_or_empty',
                            value: cellValue
                        });
                    }

                    // Check for very long values
                    if (cellValue.length > 255) {
                        analysis.patterns.longValues.push({
                            row: rowNum,
                            column: colIndex,
                            length: cellValue.length,
                            value: cellValue.substring(0, 100) + '...'
                        });
                        rowAnalysis.issues.push({
                            column: colIndex,
                            columnName: analysis.headers[colIndex],
                            issue: 'value_too_long',
                            length: cellValue.length,
                            value: cellValue.substring(0, 100) + '...'
                        });
                    }

                    // Check for unusual whitespace
                    if (cellValue !== cellValue.trim()) {
                        rowAnalysis.issues.push({
                            column: colIndex,
                            columnName: analysis.headers[colIndex],
                            issue: 'leading_trailing_whitespace',
                            value: `"${cellValue}"`
                        });
                    }

                    // Check for line breaks
                    if (cellValue.includes('\n') || cellValue.includes('\r')) {
                        rowAnalysis.issues.push({
                            column: colIndex,
                            columnName: analysis.headers[colIndex],
                            issue: 'line_breaks',
                            value: cellValue.replace(/\n/g, '\\n').replace(/\r/g, '\\r')
                        });
                    }
                });

                analysis.failingRowsAnalysis.push(rowAnalysis);
            } else {
                console.log(`Row ${rowNum} does not exist in the Excel file (only ${jsonData.length} rows total)`);
            }
        }

        // Convert Set to Array for JSON serialization
        analysis.patterns.specialCharacters = Array.from(analysis.patterns.specialCharacters);

        // Save detailed analysis
        fs.writeFileSync('./failing_rows_detailed_analysis.json', JSON.stringify(analysis, null, 2));

        // Generate summary report
        const summary = {
            totalFailingRows: analysis.failingRowsAnalysis.length,
            commonIssues: {},
            specialCharactersFound: analysis.patterns.specialCharacters,
            totalIssuesFound: 0
        };

        // Count common issues
        analysis.failingRowsAnalysis.forEach(row => {
            row.issues.forEach(issue => {
                summary.totalIssuesFound++;
                if (!summary.commonIssues[issue.issue]) {
                    summary.commonIssues[issue.issue] = 0;
                }
                summary.commonIssues[issue.issue]++;
            });
        });

        console.log('\\n=== SUMMARY REPORT ===');
        console.log(`Analyzed ${summary.totalFailingRows} failing rows`);
        console.log(`Total issues found: ${summary.totalIssuesFound}`);
        console.log('\\nCommon issues:');
        Object.entries(summary.commonIssues).forEach(([issue, count]) => {
            console.log(`  ${issue}: ${count} occurrences`);
        });

        console.log('\\nSpecial characters found:');
        analysis.patterns.specialCharacters.forEach(char => {
            console.log(`  "${char}" (Unicode: ${char.charCodeAt(0)})`);
        });

        // Show first few failing rows for inspection
        console.log('\\n=== FIRST 3 FAILING ROWS DETAILED ===');
        analysis.failingRowsAnalysis.slice(0, 3).forEach(row => {
            console.log(`\\nRow ${row.rowNumber}:`);
            console.log(`Data: ${JSON.stringify(row.data.slice(0, 5))}...`); // Show first 5 columns
            if (row.issues.length > 0) {
                console.log('Issues:');
                row.issues.forEach(issue => {
                    console.log(`  Column ${issue.column} (${issue.columnName}): ${issue.issue} - ${issue.value}`);
                });
            } else {
                console.log('  No obvious issues detected');
            }
        });

        fs.writeFileSync('./failing_rows_summary.json', JSON.stringify(summary, null, 2));

        return analysis;

    } catch (error) {
        console.error('Error analyzing Excel file:', error);
        throw error;
    }
}

// Run the analysis
analyzeFailingRows().then(() => {
    console.log('\\nAnalysis complete! Check failing_rows_detailed_analysis.json and failing_rows_summary.json for results.');
}).catch(error => {
    console.error('Analysis failed:', error);
});