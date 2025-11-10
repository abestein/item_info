import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
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

        console.log('Connecting to:', {
            server: config.server,
            database: config.database,
            user: config.user
        });

        const pool = await sql.connect(config);
        console.log('✅ Connected to SQL Server successfully!');

        // Check if table exists
        const tableCheck = await pool.request().query(`
            SELECT COUNT(*) as table_count
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_NAME = 'data_team_active_items'
        `);

        if (tableCheck.recordset[0].table_count > 0) {
            console.log('✅ Table data_team_active_items exists');

            // Count rows
            const rowCount = await pool.request().query('SELECT COUNT(*) as total_rows FROM data_team_active_items');
            console.log(`📊 Total rows in table: ${rowCount.recordset[0].total_rows}`);

            // Get sample data
            const sampleData = await pool.request().query('SELECT TOP 5 * FROM data_team_active_items');
            console.log('📋 Sample data (first 5 rows):');
            console.log(sampleData.recordset);
        } else {
            console.log('❌ Table data_team_active_items does not exist');
        }

        await pool.close();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    }
}

testConnection();