import sql from 'mssql';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

async function executeFullImport() {
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
            requestTimeout: 600000, // 10 minutes
        };

        console.log('🔗 Connecting to database...');
        const pool = await sql.connect(config);
        console.log('✅ Connected to SQL Server successfully!');

        // Clear existing test data first
        console.log('🧹 Clearing existing test data...');
        await pool.request().query('DELETE FROM data_team_active_items');
        console.log('✅ Table cleared');

        // Read the fixed SQL file
        console.log('📖 Reading data_import_statements_FIXED.sql...');
        const sqlContent = await fs.readFile('data_import_statements_FIXED.sql', 'utf8');

        // Execute the entire SQL file
        console.log('🚀 Executing full import with all records...');
        console.log('⏳ This may take a few minutes...');

        const startTime = Date.now();

        try {
            await pool.request().query(sqlContent);

            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);

            console.log(`✅ Full import completed in ${duration} seconds!`);

            // Verify the results
            const rowCount = await pool.request().query('SELECT COUNT(*) as total_rows FROM data_team_active_items');
            const sampleData = await pool.request().query('SELECT TOP 5 brand_name, item, description1 FROM data_team_active_items ORDER BY id');

            console.log(`\n🎉 Import Results:`);
            console.log(`📊 Total rows imported: ${rowCount.recordset[0].total_rows}`);
            console.log(`📋 Sample data (first 5 records):`);
            console.table(sampleData.recordset);

            // Additional verification
            const brandCount = await pool.request().query('SELECT brand_name, COUNT(*) as count FROM data_team_active_items GROUP BY brand_name ORDER BY count DESC');
            console.log(`\n📈 Records by brand (top 5):`);
            console.table(brandCount.recordset.slice(0, 5));

        } catch (importError) {
            console.error('❌ Import failed:', importError.message);

            // Check how many records were imported before the error
            const partialCount = await pool.request().query('SELECT COUNT(*) as partial_rows FROM data_team_active_items');
            console.log(`📊 Partial import - records inserted: ${partialCount.recordset[0].partial_rows}`);
        }

        await pool.close();
    } catch (error) {
        console.error('❌ Full import failed:', error.message);
    }
}

executeFullImport();