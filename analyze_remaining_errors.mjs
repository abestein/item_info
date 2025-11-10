import sql from 'mssql';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

async function analyzeRemainingErrors() {
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
        console.log('🔍 Testing each record to identify remaining error patterns...');

        let truncationErrors = [];
        let syntaxErrors = [];
        let otherErrors = [];
        let processedCount = 0;

        // Test first 500 records to get error samples
        const testLimit = Math.min(500, valuesArray.length);

        for (let i = 0; i < testLimit; i++) {
            const recordIndex = i + 1;
            try {
                const individualSQL = insertHeader + '\n' + valuesArray[i] + ';';
                await pool.request().query(individualSQL);
                processedCount++;
            } catch (error) {
                const errorInfo = {
                    record: recordIndex,
                    error: error.message,
                    data: valuesArray[i]
                };

                if (error.message.includes('truncated')) {
                    truncationErrors.push(errorInfo);
                } else if (error.message.includes('Incorrect syntax near')) {
                    syntaxErrors.push(errorInfo);
                } else {
                    otherErrors.push(errorInfo);
                }

                // Stop after collecting enough samples
                if (truncationErrors.length >= 15 && syntaxErrors.length >= 15) {
                    break;
                }
            }

            if (recordIndex % 100 === 0) {
                console.log(`  📊 Analyzed ${recordIndex}/${testLimit} records...`);
            }
        }

        await pool.close();

        console.log(`\n🔍 ERROR ANALYSIS RESULTS:`);
        console.log(`📏 Truncation error samples: ${truncationErrors.length}`);
        console.log(`🔧 Syntax error samples: ${syntaxErrors.length}`);
        console.log(`❓ Other error samples: ${otherErrors.length}`);

        // Show truncation error examples
        if (truncationErrors.length > 0) {
            console.log(`\n📏 TRUNCATION ERROR EXAMPLES:`);
            truncationErrors.slice(0, 10).forEach((err, idx) => {
                console.log(`\n${idx + 1}. Record ${err.record}:`);
                console.log(`   Error: ${err.error}`);

                // Extract the values to see which field is too long
                const values = err.data.match(/'([^']*)'/g) || [];
                console.log(`   Long values found:`);
                values.forEach(val => {
                    if (val.length > 52) { // Remove quotes and check if >50 chars
                        console.log(`     ${val} (${val.length - 2} chars)`);
                    }
                });
            });
        }

        // Show syntax error examples
        if (syntaxErrors.length > 0) {
            console.log(`\n🔧 SYNTAX ERROR EXAMPLES:`);
            syntaxErrors.slice(0, 10).forEach((err, idx) => {
                console.log(`\n${idx + 1}. Record ${err.record}:`);
                console.log(`   Error: ${err.error}`);
                console.log(`   Data snippet: ${err.data.substring(0, 200)}...`);

                // Look for problematic patterns
                const problematicPatterns = [
                    /\\['"]/g,  // Escaped quotes
                    /\\\\/g,    // Double backslashes
                    /\\n/g,     // Newline escapes
                    /\\r/g,     // Carriage return escapes
                    /\\t/g      // Tab escapes
                ];

                problematicPatterns.forEach((pattern, pidx) => {
                    const matches = err.data.match(pattern);
                    if (matches) {
                        console.log(`   Pattern ${pidx + 1} found: ${matches.slice(0, 3).join(', ')}${matches.length > 3 ? '...' : ''}`);
                    }
                });
            });
        }

        // Write detailed analysis to file
        const analysis = {
            summary: {
                totalAnalyzed: testLimit,
                truncationErrors: truncationErrors.length,
                syntaxErrors: syntaxErrors.length,
                otherErrors: otherErrors.length
            },
            truncationExamples: truncationErrors.slice(0, 5),
            syntaxExamples: syntaxErrors.slice(0, 10),
            recommendations: [
                "Increase field sizes for description1, description3 from 50 to at least 100 characters",
                "Consider increasing brand_name and item fields from 50 to 75-100 characters",
                "Fix remaining backslash escape sequences in dimension values"
            ]
        };

        await fs.writeFile('error_analysis_results.json', JSON.stringify(analysis, null, 2));
        console.log(`\n📁 Detailed analysis saved to: error_analysis_results.json`);

        return analysis;

    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        return null;
    }
}

analyzeRemainingErrors();