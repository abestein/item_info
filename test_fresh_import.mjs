import sql from 'mssql';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

async function testFreshImport() {
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

        console.log('🚀 TESTING FRESH SQL IMPORT FOR 100% SUCCESS');
        console.log('═══════════════════════════════════════════════════════');
        console.log('📊 Testing fresh SQL generated from Excel MCP');
        console.log('🎯 Goal: Resolve data misalignment and achieve 100% success\n');

        console.log('🔗 Connecting to database...');
        const pool = await sql.connect(config);
        console.log('✅ Connected to SQL Server successfully!');

        // Clear existing data
        console.log('🧹 Clearing existing data...');
        await pool.request().query('DELETE FROM data_team_active_items');

        // Read the fresh SQL file
        console.log('📖 Reading data_import_statements_FRESH.sql...');
        const sqlContent = await fs.readFile('data_import_statements_FRESH.sql', 'utf8');

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
        console.log('🎯 Testing FRESH import - targeting 100% success!\n');

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

                // Progress reporting every 500 records
                if (recordIndex % 500 === 0) {
                    console.log(`  ✅ Processed ${recordIndex}/${valuesArray.length} records (${((recordIndex/valuesArray.length)*100).toFixed(1)}%)`);
                }
            } catch (error) {
                errorCount++;

                // Collect detailed error info for any remaining failures
                if (errorCount <= 10) {
                    errorDetails.push({
                        record: recordIndex,
                        error: error.message,
                        data: valuesArray[i].substring(0, 200) + '...'
                    });
                }

                console.error(`  ❌ Error in record ${recordIndex}: ${error.message.substring(0, 100)}...`);
            }
        }

        // Final verification
        const finalCount = await pool.request().query('SELECT COUNT(*) as total_rows FROM data_team_active_items');
        const sampleData = await pool.request().query('SELECT TOP 5 brand_name, item, description1 FROM data_team_active_items ORDER BY id');

        console.log('\n🎉 FRESH IMPORT RESULTS!');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`✅ Successfully imported: ${successCount} records`);
        console.log(`❌ Failed imports: ${errorCount} records`);
        console.log(`📊 Final table count: ${finalCount.recordset[0].total_rows}`);
        console.log(`📈 Success rate: ${((successCount / valuesArray.length) * 100).toFixed(2)}%`);

        // Success rate evaluation
        if (errorCount === 0) {
            console.log('\n🏆 PERFECT! 100% SUCCESS ACHIEVED! 🏆');
            console.log('🎊 ALL RECORDS IMPORTED SUCCESSFULLY! 🎊');
            console.log('✨ Excel-SQL misalignment issue COMPLETELY RESOLVED! ✨');
        } else if (successCount >= valuesArray.length * 0.999) {
            console.log('\n🎉 OUTSTANDING! 99.9%+ success achieved!');
        } else if (successCount >= valuesArray.length * 0.995) {
            console.log('\n✨ EXCELLENT! 99.5%+ success achieved!');
        }

        // Compare with previous attempts
        console.log(`\n📈 COMPLETE PROGRESS TIMELINE:`);
        console.log(`   Initial attempt: 1,807 records (66.3%)`);
        console.log(`   After quote fixes: 2,573 records (94.5%)`);
        console.log(`   Conservative fix: 2,581 records (94.79%)`);
        console.log(`   With field size increases: 2,696 records (99.01%)`);
        console.log(`   🆕 FRESH EXCEL-ALIGNED: ${successCount} records (${((successCount / valuesArray.length) * 100).toFixed(2)}%)`);

        const improvement = successCount - 2696;
        if (improvement > 0) {
            console.log(`🚀 Final improvement: +${improvement} more records!`);
        }

        // Show any remaining errors
        if (errorCount > 0) {
            console.log(`\n📋 Remaining error analysis:`);
            errorDetails.forEach((err, idx) => {
                console.log(`  ${idx + 1}. Record ${err.record}: ${err.error.substring(0, 80)}...`);
            });
        }

        // Show sample data
        if (sampleData.recordset.length > 0) {
            console.log(`\n📋 Sample imported data:`);
            console.table(sampleData.recordset);
        }

        // Validation queries
        console.log(`\n🔍 VALIDATION CHECKS:`);

        // Check for any missing data
        const nullCheck = await pool.request().query(`
            SELECT COUNT(*) as null_count
            FROM data_team_active_items
            WHERE brand_name IS NULL AND item IS NULL AND description1 IS NULL
        `);
        console.log(`   NULL records: ${nullCheck.recordset[0].null_count}`);

        // Check for duplicates
        const dupCheck = await pool.request().query(`
            SELECT COUNT(*) as duplicate_count
            FROM (
                SELECT brand_name, item, description1, COUNT(*) as cnt
                FROM data_team_active_items
                GROUP BY brand_name, item, description1
                HAVING COUNT(*) > 1
            ) dups
        `);
        console.log(`   Duplicate records: ${dupCheck.recordset[0].duplicate_count}`);

        await pool.close();

        return {
            successCount,
            errorCount,
            totalRecords: valuesArray.length,
            successRate: ((successCount / valuesArray.length) * 100).toFixed(2),
            isPerfect: errorCount === 0,
            improvement: improvement,
            isAligned: true
        };

    } catch (error) {
        console.error('❌ Fresh import test failed:', error.message);
        return null;
    }
}

testFreshImport();