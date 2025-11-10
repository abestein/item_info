import fs from 'fs/promises';

async function analyzeFailedRecords() {
    try {
        console.log('🔍 Analyzing failed records...');

        // Read the fixed SQL file
        const sqlContent = await fs.readFile('data_import_statements_FIXED.sql', 'utf8');

        // Extract all VALUES lines
        const lines = sqlContent.split('\n');
        let valuesArray = [];
        let inValues = false;

        for (const line of lines) {
            if (line.includes('VALUES')) {
                inValues = true;
                continue;
            }
            if (inValues && line.trim().startsWith('(')) {
                let valueLine = line.trim();
                if (valueLine.endsWith('),')) {
                    valueLine = valueLine.slice(0, -2) + ')';
                } else if (valueLine.endsWith(');')) {
                    valueLine = valueLine.slice(0, -2) + ')';
                }
                valuesArray.push(valueLine);
            }
        }

        console.log(`📊 Total records found: ${valuesArray.length}\n`);

        // Check for backslash issues
        console.log('🔍 Analyzing backslash issues:');
        let backslashIssues = [];
        valuesArray.forEach((record, index) => {
            if (record.includes('\\') && !record.includes('\\\\')) {
                backslashIssues.push({
                    recordNumber: index + 1,
                    preview: record.substring(0, 100) + '...',
                    backslashPositions: [...record.matchAll(/\\/g)].map(match => match.index)
                });
            }
        });

        console.log(`❌ Records with backslash issues: ${backslashIssues.length}`);
        if (backslashIssues.length > 0) {
            console.log('📋 First 10 backslash issues:');
            backslashIssues.slice(0, 10).forEach(issue => {
                console.log(`  Record ${issue.recordNumber}: ${issue.preview}`);
                console.log(`    Backslash positions: ${issue.backslashPositions.join(', ')}`);
            });
        }

        // Check for potential length issues
        console.log('\n🔍 Analyzing potential length issues:');
        let lengthIssues = [];

        valuesArray.forEach((record, index) => {
            // Split the record into individual values
            const values = record.slice(1, -1).split(', '); // Remove outer parentheses and split

            values.forEach((value, valueIndex) => {
                // Check string values (those in quotes)
                if (value.startsWith("'") && value.endsWith("'")) {
                    const cleanValue = value.slice(1, -1); // Remove quotes

                    // Check various field lengths based on table schema
                    if (valueIndex <= 6 && cleanValue.length > 50) { // brand_name, item, descriptions
                        lengthIssues.push({
                            recordNumber: index + 1,
                            fieldIndex: valueIndex,
                            fieldLength: cleanValue.length,
                            value: cleanValue.substring(0, 50) + '...',
                            expectedMaxLength: 50
                        });
                    } else if (valueIndex >= 7 && valueIndex <= 11 && cleanValue.length > 255) { // uom fields
                        lengthIssues.push({
                            recordNumber: index + 1,
                            fieldIndex: valueIndex,
                            fieldLength: cleanValue.length,
                            value: cleanValue.substring(0, 50) + '...',
                            expectedMaxLength: 255
                        });
                    }
                }
            });
        });

        console.log(`❌ Records with potential length issues: ${lengthIssues.length}`);
        if (lengthIssues.length > 0) {
            console.log('📋 First 10 length issues:');
            lengthIssues.slice(0, 10).forEach(issue => {
                console.log(`  Record ${issue.recordNumber}, Field ${issue.fieldIndex}: ${issue.fieldLength} chars (max ${issue.expectedMaxLength})`);
                console.log(`    Value: "${issue.value}"`);
            });
        }

        // Estimate total problematic records
        const problematicRecords = new Set([
            ...backslashIssues.map(i => i.recordNumber),
            ...lengthIssues.map(i => i.recordNumber)
        ]);

        console.log(`\n📊 Summary:`);
        console.log(`  🔢 Total records: ${valuesArray.length}`);
        console.log(`  ❌ Records with backslash issues: ${backslashIssues.length}`);
        console.log(`  ❌ Records with length issues: ${lengthIssues.length}`);
        console.log(`  ❌ Unique problematic records: ${problematicRecords.size}`);
        console.log(`  ✅ Estimated clean records: ${valuesArray.length - problematicRecords.size}`);

        // Show which specific records are problematic
        const sortedProblematic = Array.from(problematicRecords).sort((a, b) => a - b);
        console.log(`\n🎯 Problematic record numbers (first 20):`);
        console.log(`   ${sortedProblematic.slice(0, 20).join(', ')}`);

    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
    }
}

analyzeFailedRecords();