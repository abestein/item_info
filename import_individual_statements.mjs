import sql from 'mssql';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

async function importIndividualStatements() {
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
            requestTimeout: 30000, // 30 seconds per statement
        };

        console.log('🔗 Connecting to database...');
        const pool = await sql.connect(config);
        console.log('✅ Connected to SQL Server successfully!');

        // Clear existing data
        console.log('🧹 Clearing existing data...');
        await pool.request().query('DELETE FROM data_team_active_items');

        // Read the fixed SQL file
        console.log('📖 Reading data_import_statements_FIXED.sql...');
        const sqlContent = await fs.readFile('data_import_statements_FIXED.sql', 'utf8');

        // Extract the INSERT header and VALUES
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
                // Clean up the VALUES line
                let valueLine = line.trim();
                if (valueLine.endsWith('),')) {
                    valueLine = valueLine.slice(0, -2) + ')'; // Remove trailing comma
                } else if (valueLine.endsWith(');')) {
                    valueLine = valueLine.slice(0, -2) + ')'; // Remove semicolon
                }
                valuesArray.push(valueLine);
            }
        }

        console.log(`📊 Found ${valuesArray.length} records to import`);
        console.log('🚀 Starting individual INSERT operations...');

        let successCount = 0;
        let errorCount = 0;
        const batchSize = 50; // Process in smaller batches
        const totalBatches = Math.ceil(valuesArray.length / batchSize);

        for (let batch = 0; batch < totalBatches; batch++) {
            const startIdx = batch * batchSize;
            const endIdx = Math.min(startIdx + batchSize, valuesArray.length);
            const batchValues = valuesArray.slice(startIdx, endIdx);

            console.log(`\n📦 Processing batch ${batch + 1}/${totalBatches} (records ${startIdx + 1}-${endIdx})`);

            for (let i = 0; i < batchValues.length; i++) {
                const recordIndex = startIdx + i + 1;
                try {
                    const individualSQL = insertHeader + '\n' + batchValues[i] + ';';
                    await pool.request().query(individualSQL);
                    successCount++;

                    if (recordIndex % 100 === 0) {
                        console.log(`  ✅ Processed ${recordIndex}/${valuesArray.length} records`);
                    }
                } catch (error) {
                    errorCount++;
                    console.error(`  ❌ Error in record ${recordIndex}:`, error.message.substring(0, 100));

                    if (errorCount > 50) {
                        console.log('❌ Too many errors, stopping import');
                        break;
                    }
                }
            }

            if (errorCount > 50) break;
        }

        // Final verification
        const finalCount = await pool.request().query('SELECT COUNT(*) as total_rows FROM data_team_active_items');
        const sampleData = await pool.request().query('SELECT TOP 5 brand_name, item, description1 FROM data_team_active_items ORDER BY id');

        console.log(`\n🎉 Import completed!`);
        console.log(`✅ Successfully imported: ${successCount} records`);
        console.log(`❌ Failed imports: ${errorCount} records`);
        console.log(`📊 Final table count: ${finalCount.recordset[0].total_rows}`);

        if (sampleData.recordset.length > 0) {
            console.log(`\n📋 Sample imported data:`);
            console.table(sampleData.recordset);
        }

        await pool.close();

        return successCount;
    } catch (error) {
        console.error('❌ Import process failed:', error.message);
        return 0;
    }
}

importIndividualStatements();