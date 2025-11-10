import sql from 'mssql';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

async function testFinalImport() {
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

        // Read the final fixed SQL file
        console.log('📖 Reading data_import_statements_FINAL.sql...');
        const sqlContent = await fs.readFile('data_import_statements_FINAL.sql', 'utf8');

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
        console.log('🚀 Starting FINAL import test for 100% success...');

        let successCount = 0;
        let errorCount = 0;
        let errorDetails = [];

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

                // Collect error details for analysis
                if (errorCount <= 10) {
                    errorDetails.push({
                        record: recordIndex,
                        error: error.message,
                        data: valuesArray[i].substring(0, 100) + '...'
                    });
                }

                if (errorCount <= 5) {
                    console.error(`  ❌ Error in record ${recordIndex}: ${error.message}`);
                } else if (recordIndex % 100 === 0) {
                    console.error(`  ❌ Error in record ${recordIndex}: ${error.message.substring(0, 50)}...`);
                }
            }
        }

        // Final verification
        const finalCount = await pool.request().query('SELECT COUNT(*) as total_rows FROM data_team_active_items');
        const sampleData = await pool.request().query('SELECT TOP 5 brand_name, item, description1 FROM data_team_active_items ORDER BY id');

        console.log(`\n🎉 FINAL IMPORT RESULTS!`);
        console.log(`✅ Successfully imported: ${successCount} records`);
        console.log(`❌ Failed imports: ${errorCount} records`);
        console.log(`📊 Final table count: ${finalCount.recordset[0].total_rows}`);
        console.log(`📈 Success rate: ${((successCount / valuesArray.length) * 100).toFixed(2)}%`);

        if (errorCount === 0) {
            console.log('\n🏆 PERFECT! 100% SUCCESS ACHIEVED! 🏆');
        } else {
            console.log(`\n📋 Remaining error analysis (first ${Math.min(errorCount, 10)}):`);
            errorDetails.forEach((err, idx) => {
                console.log(`  ${idx + 1}. Record ${err.record}: ${err.error}`);
                if (idx < 3) {
                    console.log(`     Data: ${err.data}`);
                }
            });
        }

        if (sampleData.recordset.length > 0) {
            console.log(`\n📋 Sample imported data:`);
            console.table(sampleData.recordset);
        }

        // Compare with previous attempt
        const previousSuccess = 2573;
        const improvement = successCount - previousSuccess;
        if (improvement > 0) {
            console.log(`\n🚀 Additional improvement: +${improvement} more records!`);
        }

        await pool.close();

        return {
            successCount,
            errorCount,
            totalRecords: valuesArray.length,
            successRate: ((successCount / valuesArray.length) * 100).toFixed(2),
            isComplete: errorCount === 0
        };
    } catch (error) {
        console.error('❌ Import process failed:', error.message);
        return { successCount: 0, errorCount: 0, totalRecords: 0, successRate: 0, isComplete: false };
    }
}

testFinalImport();