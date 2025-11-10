import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function bulkImport() {
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
        };

        console.log('🔗 Connecting to database...');
        const pool = await sql.connect(config);
        console.log('✅ Connected to SQL Server successfully!');

        // First, let's try a manual approach - parsing the CSV and inserting in batches
        console.log('📖 Starting bulk insert from CSV file...');

        // Get the absolute path to the CSV file
        const csvPath = path.resolve('data_team_active_items.csv');
        console.log(`📍 CSV file path: ${csvPath}`);

        try {
            // Use BULK INSERT SQL command
            const bulkInsertSQL = `
                BULK INSERT data_team_active_items
                FROM '${csvPath.replace(/\\/g, '\\\\')}'
                WITH (
                    FIELDTERMINATOR = ',',
                    ROWTERMINATOR = '\\n',
                    FIRSTROW = 2,
                    KEEPNULLS,
                    TABLOCK
                )
            `;

            console.log('🚀 Executing BULK INSERT...');
            await pool.request().query(bulkInsertSQL);

        } catch (bulkError) {
            console.log('⚠️  BULK INSERT failed, trying alternative approach...');
            console.log('Error:', bulkError.message);

            // Alternative: Read first few lines of SQL file and execute properly
            const fs = await import('fs/promises');
            const sqlContent = await fs.readFile('data_import_statements.sql', 'utf8');

            // Extract just the INSERT statement template and VALUES
            const lines = sqlContent.split('\n');
            let insertStatement = '';
            let valuesLines = [];
            let inInsert = false;

            for (const line of lines) {
                if (line.trim().startsWith('INSERT INTO')) {
                    inInsert = true;
                    insertStatement = line;
                    continue;
                }
                if (inInsert && !line.trim().startsWith('--') && line.trim()) {
                    if (line.includes('VALUES')) {
                        insertStatement += '\n' + line;
                        break;
                    } else {
                        insertStatement += '\n' + line;
                    }
                }
            }

            // Get all value lines
            for (const line of lines) {
                if (line.trim().startsWith('(') && line.trim().endsWith('),')) {
                    valuesLines.push(line.trim().slice(0, -1)); // Remove trailing comma
                } else if (line.trim().startsWith('(') && line.trim().endsWith(');')) {
                    valuesLines.push(line.trim().slice(0, -1)); // Remove semicolon
                    break;
                }
            }

            if (valuesLines.length > 0) {
                console.log(`📊 Found ${valuesLines.length} value records`);

                // Insert in batches of 100
                const batchSize = 100;
                let successCount = 0;

                for (let i = 0; i < valuesLines.length; i += batchSize) {
                    const batch = valuesLines.slice(i, i + batchSize);
                    const batchSQL = insertStatement + ' ' + batch.join(',\n') + ';';

                    try {
                        await pool.request().query(batchSQL);
                        successCount += batch.length;
                        console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}: ${successCount}/${valuesLines.length} records`);
                    } catch (batchError) {
                        console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, batchError.message);
                        // Try individual inserts for this batch
                        for (const values of batch) {
                            try {
                                const individualSQL = insertStatement + ' ' + values + ';';
                                await pool.request().query(individualSQL);
                                successCount++;
                            } catch (individualError) {
                                console.error(`❌ Individual insert failed:`, values.substring(0, 100) + '...');
                            }
                        }
                    }
                }

                console.log(`🎉 Batch insert completed! Inserted ${successCount} records`);
            }
        }

        // Verify the results
        const rowCount = await pool.request().query('SELECT COUNT(*) as total_rows FROM data_team_active_items');
        const sampleData = await pool.request().query('SELECT TOP 5 * FROM data_team_active_items');

        console.log('\n🎉 Import verification:');
        console.log(`📊 Total rows in table: ${rowCount.recordset[0].total_rows}`);
        console.log('📋 Sample data (first 5 rows):');
        console.table(sampleData.recordset.map(row => ({
            id: row.id,
            brand_name: row.brand_name,
            item: row.item,
            description1: row.description1
        })));

        await pool.close();
    } catch (error) {
        console.error('❌ Import failed:', error.message);
    }
}

bulkImport();