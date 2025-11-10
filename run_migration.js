const sql = require('mssql');
const fs = require('fs');
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

async function runMigration() {
    try {
        console.log('Connecting to database...');
        await sql.connect(dbConfig);
        console.log('Connected successfully');

        const migrationSQL = fs.readFileSync('./add_missing_columns.sql', 'utf8');

        console.log('Running migration...');
        await sql.query(migrationSQL);

        console.log('✓ Migration completed successfully!');
        console.log('Added missing columns to both data_team_active_items and data_team_active_items_temp tables');

        await sql.close();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
