import sql from 'mssql';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

async function testConservativeImport() {
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

        // Clear existing data
        console.log('🧹 Clearing existing data...');
        await pool.request().query('DELETE FROM data_team_active_items');

        // Read the conservative fix SQL file
        console.log('📖 Reading data_import_statements_CONSERVATIVE.sql...');
        const sqlContent = await fs.readFile('data_import_statements_CONSERVATIVE.sql', 'utf8');

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

        console.log(`📊 Found ${valuesArray.length} records to import`);
        console.log('🎯 Testing conservative fixes (expecting ~98-99% success)...');

        let successCount = 0;
        let errorCount = 0;
        let truncationErrors = 0;
        let backslashErrors = 0;
        let otherErrors = 0;

        // Process all records
        for (let i = 0; i < valuesArray.length; i++) {
            const recordIndex = i + 1;
            try {
                const individualSQL = insertHeader + '\n' + valuesArray[i] + ';';
                await pool.request().query(individualSQL);
                successCount++;

                if (recordIndex % 500 === 0) {
                    console.log(`  ✅ Processed ${recordIndex}/${valuesArray.length} records`);
                }
            } catch (error) {
                errorCount++;

                // Categorize errors
                if (error.message.includes('truncated')) {
                    truncationErrors++;
                } else if (error.message.includes('Incorrect syntax near')) {
                    backslashErrors++;
                } else {
                    otherErrors++;
                }

                if (errorCount <= 5) {
                    console.error(`  ❌ Error in record ${recordIndex}: ${error.message}`);
                }
            }
        }

        // Final verification
        const finalCount = await pool.request().query('SELECT COUNT(*) as total_rows FROM data_team_active_items');
        const sampleData = await pool.request().query('SELECT TOP 5 brand_name, item, description1 FROM data_team_active_items ORDER BY id');

        console.log(`\n🎯 CONSERVATIVE FIX RESULTS:`);
        console.log(`✅ Successfully imported: ${successCount} records`);
        console.log(`❌ Failed imports: ${errorCount} records`);
        console.log(`📊 Final table count: ${finalCount.recordset[0].total_rows}`);
        console.log(`📈 Success rate: ${((successCount / valuesArray.length) * 100).toFixed(2)}%`);

        console.log(`\n📊 Error breakdown:`);
        console.log(`  📏 Truncation errors: ${truncationErrors}`);
        console.log(`  🔧 Syntax/backslash errors: ${backslashErrors}`);
        console.log(`  ❓ Other errors: ${otherErrors}`);

        // Compare with previous attempts
        const previousAttempts = [
            { name: 'Initial attempt', success: 1807, rate: 66.3 },
            { name: 'After quote fixes', success: 2573, rate: 94.5 }
        ];

        console.log(`\n📈 Progress comparison:`);
        previousAttempts.forEach(attempt => {
            const improvement = successCount - attempt.success;
            const sign = improvement >= 0 ? '+' : '';
            console.log(`  ${attempt.name}: ${attempt.success} (${attempt.rate}%) → ${sign}${improvement}`);
        });

        if (successCount >= 2670) { // 98%+
            console.log('\n🎉 EXCELLENT! Nearly 100% success achieved!');
        } else if (successCount >= 2600) { // 95%+
            console.log('\n✅ GREAT! Significant improvement achieved!');
        }

        if (sampleData.recordset.length > 0) {
            console.log(`\n📋 Sample imported data:`);
            console.table(sampleData.recordset);
        }

        await pool.close();

        return {
            successCount,
            errorCount,
            totalRecords: valuesArray.length,
            successRate: ((successCount / valuesArray.length) * 100).toFixed(2),
            errorBreakdown: { truncationErrors, backslashErrors, otherErrors }
        };
    } catch (error) {
        console.error('❌ Import process failed:', error.message);
        return null;
    }
}

testConservativeImport();