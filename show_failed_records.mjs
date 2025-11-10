import sql from 'mssql';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

async function showFailedRecords() {
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

        console.log('🔗 Connecting to database...');
        const pool = await sql.connect(config);
        console.log('✅ Connected to SQL Server successfully!');

        // Read the precisely fixed SQL file
        console.log('📖 Reading data_import_statements_PRECISE.sql...');
        const sqlContent = await fs.readFile('data_import_statements_PRECISE.sql', 'utf8');

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
        console.log('🔍 Identifying the specific 27 failed records...\n');

        let failedRecords = [];
        let successCount = 0;

        // Test all records to find the exact 27 failures
        for (let i = 0; i < valuesArray.length; i++) {
            const recordIndex = i + 1;
            try {
                const individualSQL = insertHeader + '\n' + valuesArray[i] + ';';
                await pool.request().query(individualSQL);
                successCount++;
            } catch (error) {
                // Parse the values to extract readable data
                const recordData = valuesArray[i];
                const values = recordData.match(/'([^']*)'/g) || [];

                // Clean values by removing quotes
                const cleanValues = values.map(v => v.slice(1, -1)); // Remove quotes

                const failedRecord = {
                    recordNumber: recordIndex,
                    error: error.message,
                    brand_name: cleanValues[0] || 'NULL',
                    item: cleanValues[1] || 'NULL',
                    description1: cleanValues[2] || 'NULL',
                    description2: cleanValues[3] || 'NULL',
                    rawData: recordData.substring(0, 300) + '...',
                    problematicPatterns: []
                };

                // Identify specific problematic patterns
                if (recordData.includes('\\n')) {
                    failedRecord.problematicPatterns.push('Contains \\n (newline characters)');
                }
                if (recordData.includes('\\"')) {
                    failedRecord.problematicPatterns.push('Contains \\" (escaped quotes)');
                }
                if (recordData.match(/\\+/g)) {
                    failedRecord.problematicPatterns.push('Contains backslash escapes');
                }
                if (recordData.includes('\\r')) {
                    failedRecord.problematicPatterns.push('Contains \\r (carriage returns)');
                }
                if (recordData.includes('\\t')) {
                    failedRecord.problematicPatterns.push('Contains \\t (tabs)');
                }

                failedRecords.push(failedRecord);

                if (failedRecords.length >= 15) { // Show first 15 detailed examples
                    break;
                }
            }

            if (recordIndex % 500 === 0) {
                console.log(`  📊 Analyzed ${recordIndex}/${valuesArray.length} records...`);
            }
        }

        await pool.close();

        console.log(`\n🎯 ANALYSIS COMPLETE:`);
        console.log(`✅ Successfully imported: ${successCount} records`);
        console.log(`❌ Failed records found: ${failedRecords.length} (showing details)\n`);

        console.log(`📋 DETAILED EXAMPLES OF FAILED RECORDS:\n`);

        failedRecords.forEach((record, index) => {
            console.log(`═══════════════════════════════════════════════════════════════`);
            console.log(`🔥 FAILED RECORD #${index + 1} (Record ${record.recordNumber})`);
            console.log(`═══════════════════════════════════════════════════════════════`);
            console.log(`Brand: ${record.brand_name}`);
            console.log(`Item: ${record.item}`);
            console.log(`Description1: ${record.description1}`);
            console.log(`Description2: ${record.description2}`);
            console.log(`\n🚫 Error: ${record.error}\n`);

            if (record.problematicPatterns.length > 0) {
                console.log(`🔍 Problematic Patterns Found:`);
                record.problematicPatterns.forEach(pattern => {
                    console.log(`   • ${pattern}`);
                });
                console.log('');
            }

            console.log(`📄 Raw Data Sample:`);
            console.log(`${record.rawData}\n`);
        });

        // Summary of patterns
        const allPatterns = failedRecords.flatMap(r => r.problematicPatterns);
        const patternCounts = {};
        allPatterns.forEach(pattern => {
            patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
        });

        console.log(`📊 PATTERN SUMMARY:`);
        Object.entries(patternCounts).forEach(([pattern, count]) => {
            console.log(`   ${pattern}: ${count} occurrences`);
        });

        // Write detailed report
        await fs.writeFile('failed_records_analysis.json', JSON.stringify({
            summary: {
                totalRecords: valuesArray.length,
                successfulRecords: successCount,
                failedRecords: failedRecords.length,
                patternCounts
            },
            failedRecords: failedRecords
        }, null, 2));

        console.log(`\n📁 Detailed analysis saved to: failed_records_analysis.json`);

        return failedRecords;

    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        return null;
    }
}

showFailedRecords();