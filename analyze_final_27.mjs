import sql from 'mssql';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

async function analyzeFinal27() {
    try {
        const config = {
            user: process.env.DB_USER || 'sa',
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER || process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 1433,
            database: process.env.DB_DATABASE || process.env.DB_NAME || 'master',
            options: {
                encrypt: false,
                trustServerCertificate: true,
                enableArithAbort: true,
            },
            requestTimeout: 30000,
        };

        console.log('🔍 DEEP ANALYSIS OF THE FINAL 27 FAILED RECORDS');
        console.log('═══════════════════════════════════════════════════════');
        console.log('🔗 Connecting to database...');
        const pool = await sql.connect(config);
        console.log('✅ Connected to SQL Server successfully!');

        // Read the production-ready SQL file
        console.log('📖 Reading data_import_statements_PRODUCTION_READY.sql...');
        const sqlContent = await fs.readFile('data_import_statements_PRODUCTION_READY.sql', 'utf8');

        // Extract VALUES
        const lines = sqlContent.split('\n');
        let insertHeader = '';
        let valuesArray = [];
        let inInsert = false;
        let inValues = false;

        for (const line of lines) {
            if (line.trim().startsWith('INSERT INTO')) {
                inInsert = true;
                insertHeader = line;
                continue;
            }
            if (inInsert && !inValues) {
                if (line.includes('VALUES')) {
                    insertHeader += '\n' + line.replace(/VALUES.*/, 'VALUES');
                    inValues = true;
                    continue;
                } else {
                    insertHeader += '\n' + line;
                }
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

        console.log(`📊 Found ${valuesArray.length} records to analyze`);
        console.log('🎯 Identifying the exact 27 failed records...\n');

        let failedRecords = [];
        let successCount = 0;
        let errorPattern = {};

        // Target specific records that we know fail (every 100th starting from 100)
        const suspectedFailures = [];
        for (let i = 100; i <= 2700; i += 100) {
            if (i <= valuesArray.length) {
                suspectedFailures.push(i - 1); // Convert to 0-based index
            }
        }

        console.log(`🔍 Testing suspected failure records: ${suspectedFailures.map(i => i + 1).join(', ')}`);

        // Test each suspected record
        for (const index of suspectedFailures) {
            const recordIndex = index + 1;
            try {
                const individualSQL = insertHeader + '\n' + valuesArray[index] + ';';
                await pool.request().query(individualSQL);
                console.log(`  ✅ Record ${recordIndex}: SUCCESS (unexpected!)`);
                successCount++;
            } catch (error) {
                console.log(`  ❌ Record ${recordIndex}: FAILED - ${error.message.substring(0, 60)}...`);

                // Deep analysis of the failed record
                const record = valuesArray[index];
                const analysis = {
                    recordNumber: recordIndex,
                    error: error.message,
                    rawRecord: record,
                    recordLength: record.length,
                    issues: []
                };

                // Check for various issues
                if (record.includes('\\')) {
                    analysis.issues.push('Contains backslashes');
                }
                if (record.includes('""')) {
                    analysis.issues.push('Contains double quotes');
                }
                if (record.match(/[^\x20-\x7E]/)) {
                    analysis.issues.push('Contains non-ASCII characters');
                }
                if (record.split(',').length !== 68) { // Should have 67 columns + opening paren
                    analysis.issues.push(`Wrong column count: ${record.split(',').length - 1} (expected 67)`);
                }
                if (!record.endsWith(')')) {
                    analysis.issues.push('Does not end with closing parenthesis');
                }
                if (record.includes('NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL')) {
                    analysis.issues.push('Contains excessive NULL sequence');
                }

                // Count pattern occurrences
                const errorType = error.message.split(' ')[0];
                errorPattern[errorType] = (errorPattern[errorType] || 0) + 1;

                failedRecords.push(analysis);
            }
        }

        await pool.close();

        console.log(`\n📊 ANALYSIS SUMMARY:`);
        console.log(`✅ Records that passed: ${successCount}`);
        console.log(`❌ Records that failed: ${failedRecords.length}`);

        console.log(`\n🔍 ERROR PATTERN BREAKDOWN:`);
        Object.entries(errorPattern).forEach(([type, count]) => {
            console.log(`   ${type}: ${count} occurrences`);
        });

        console.log(`\n📋 DETAILED ANALYSIS OF FAILED RECORDS:\n`);

        failedRecords.forEach((record, index) => {
            console.log(`═══════════════════════════════════════════════════════════════`);
            console.log(`🔥 FAILED RECORD ${index + 1}: Record #${record.recordNumber}`);
            console.log(`═══════════════════════════════════════════════════════════════`);
            console.log(`Error: ${record.error}`);
            console.log(`Length: ${record.recordLength} characters`);
            console.log(`Issues found: ${record.issues.join(', ') || 'None identified'}`);

            // Show first and last parts of the record
            console.log(`\nFirst 200 chars: ${record.rawRecord.substring(0, 200)}...`);
            console.log(`Last 200 chars: ...${record.rawRecord.substring(record.rawRecord.length - 200)}`);

            // Look for specific patterns
            console.log('\n🔍 Pattern Analysis:');
            if (record.rawRecord.includes("'")) {
                const quotes = record.rawRecord.match(/'/g);
                console.log(`   Single quotes: ${quotes ? quotes.length : 0} (should be even number)`);
            }

            const commas = record.rawRecord.match(/,/g);
            console.log(`   Commas: ${commas ? commas.length : 0} (should be 66 for 67 columns)`);

            // Check for unescaped quotes within data
            const problematicQuotes = record.rawRecord.match(/'[^']*'[^',)]/g);
            if (problematicQuotes) {
                console.log(`   ⚠️  Potential unescaped quotes: ${problematicQuotes.length}`);
                problematicQuotes.slice(0, 3).forEach(quote => {
                    console.log(`      ${quote}...`);
                });
            }

            console.log('');
        });

        // Save detailed analysis
        const detailedReport = {
            timestamp: new Date().toISOString(),
            totalRecordsAnalyzed: suspectedFailures.length,
            successfulRecords: successCount,
            failedRecords: failedRecords.length,
            errorPatterns: errorPattern,
            detailedFailures: failedRecords.map(r => ({
                recordNumber: r.recordNumber,
                error: r.error,
                issues: r.issues,
                recordSnippet: {
                    start: r.rawRecord.substring(0, 100),
                    end: r.rawRecord.substring(r.rawRecord.length - 100)
                }
            }))
        };

        await fs.writeFile('final_27_analysis_report.json', JSON.stringify(detailedReport, null, 2));

        console.log(`📁 Detailed analysis saved to: final_27_analysis_report.json`);
        console.log(`\n🎯 NEXT STEPS:`);
        console.log(`   Based on the patterns found, create targeted fixes for these specific issues.`);

        return failedRecords;

    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        return null;
    }
}

analyzeFinal27();