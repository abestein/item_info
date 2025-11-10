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

        const migrationSQL = fs.readFileSync('./fix_columns_migration.sql', 'utf8');

        console.log('Running fix migration...');
        console.log('  - Removing 16 incorrect columns');
        console.log('  - Adding 5 NDC columns');

        await sql.query(migrationSQL);

        console.log('\n✓ Fix migration completed successfully!');
        console.log('  ✓ Removed incorrect columns from both tables');
        console.log('  ✓ Added NDC columns to both tables');

        await sql.close();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
