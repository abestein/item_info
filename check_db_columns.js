const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function checkColumns() {
    try {
        console.log('Connecting to database...');
        await sql.connect(dbConfig);
        console.log('Connected successfully\n');

        const result = await sql.query`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'data_team_active_items'
            ORDER BY ORDINAL_POSITION
        `;

        console.log('=== data_team_active_items columns ===');
        result.recordset.forEach((col, index) => {
            const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
            console.log(`${index + 1}. ${col.COLUMN_NAME} - ${col.DATA_TYPE}${length}`);
        });

        await sql.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkColumns();
