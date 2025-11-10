import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

async function countFields() {
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

        const pool = await sql.connect(config);
        console.log('✅ Connected to SQL Server');

        // Get column count and names
        const columnQuery = `
            SELECT
                COUNT(*) as column_count
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'data_team_active_items'
        `;

        const columnListQuery = `
            SELECT
                COLUMN_NAME,
                DATA_TYPE,
                CHARACTER_MAXIMUM_LENGTH,
                IS_NULLABLE,
                ORDINAL_POSITION
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'data_team_active_items'
            ORDER BY ORDINAL_POSITION
        `;

        const countResult = await pool.request().query(columnQuery);
        const listResult = await pool.request().query(columnListQuery);

        console.log(`\n📊 Total columns in data_team_active_items table: ${countResult.recordset[0].column_count}\n`);

        console.log('📋 Column Details:');
        console.log('─'.repeat(80));
        listResult.recordset.forEach(col => {
            const maxLength = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
            const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
            console.log(`${col.ORDINAL_POSITION.toString().padStart(2)}. ${col.COLUMN_NAME.padEnd(25)} ${col.DATA_TYPE}${maxLength.padEnd(8)} ${nullable}`);
        });

        await pool.close();
    } catch (error) {
        console.error('❌ Query failed:', error.message);
    }
}

countFields();