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

        const migrationSQL = fs.readFileSync('./add_new_columns_final.sql', 'utf8');

        console.log('Running migration to add 11 new columns...');
        console.log('  - duns_number');
        console.log('  - prop_65_warning');
        console.log('  - dehp_free');
        console.log('  - latex');
        console.log('  - use_field');
        console.log('  - temp_range');
        console.log('  - humidity_limitation');
        console.log('  - product_identification');
        console.log('  - term_code');
        console.log('  - hc_class');
        console.log('  - license_number');
        console.log('\nNote: GTIN and NDC columns already exist in database');

        await sql.query(migrationSQL);

        console.log('\n✓ Migration completed successfully!');
        console.log('Added 11 new columns to both data_team_active_items and data_team_active_items_temp tables');

        await sql.close();
    } catch (error) {
        console.error('Migration failed:', error.message);
        if (error.message.includes('already exists') || error.message.includes('specified more than once')) {
            console.error('\nNote: Some columns may already exist. Please check the database structure.');
        }
        process.exit(1);
    }
}

runMigration();
