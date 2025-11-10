import sql from 'mssql';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

async function executeImport() {
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
            requestTimeout: 300000, // 5 minutes
        };

        console.log('🔗 Connecting to database...');
        const pool = await sql.connect(config);
        console.log('✅ Connected to SQL Server successfully!');

        // Read the SQL file
        console.log('📖 Reading data_import_statements.sql...');
        const sqlContent = await fs.readFile('data_import_statements.sql', 'utf8');

        // Split into individual statements and filter out comments
        const statements = sqlContent
            .split('\n')
            .filter(line => line.trim() && !line.trim().startsWith('--'))
            .join('\n')
            .split('INSERT INTO')
            .filter(stmt => stmt.trim())
            .map(stmt => 'INSERT INTO' + stmt);

        console.log(`📊 Found ${statements.length} INSERT statements to execute`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < statements.length; i++) {
            try {
                await pool.request().query(statements[i]);
                successCount++;
                if ((i + 1) % 100 === 0) {
                    console.log(`✅ Processed ${i + 1}/${statements.length} statements...`);
                }
            } catch (error) {
                console.error(`❌ Error in statement ${i + 1}:`, error.message);
                errorCount++;
                if (errorCount > 10) {
                    console.log('❌ Too many errors, stopping execution');
                    break;
                }
            }
        }

        // Verify the results
        const rowCount = await pool.request().query('SELECT COUNT(*) as total_rows FROM data_team_active_items');

        console.log('\n🎉 Import completed!');
        console.log(`✅ Successful inserts: ${successCount}`);
        console.log(`❌ Failed inserts: ${errorCount}`);
        console.log(`📊 Total rows in table: ${rowCount.recordset[0].total_rows}`);

        await pool.close();
    } catch (error) {
        console.error('❌ Import failed:', error.message);
    }
}

executeImport();