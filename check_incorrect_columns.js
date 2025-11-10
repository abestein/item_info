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

const columnsToCheck = [
    'duns_number',
    'prop_65_warning',
    'dehp_free',
    'latex',
    'use_field',
    'temp_range',
    'humidity_limitation',
    'pack_inner_2',
    'pack_inner_1',
    'pack_sellable',
    'pack_ship_1',
    'pack_ship_2',
    'product_identification',
    'term_code',
    'hc_class',
    'license_number'
];

async function checkColumns() {
    try {
        await sql.connect(dbConfig);

        const placeholders = columnsToCheck.map(() => '?').join(',');
        const result = await sql.query`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'data_team_active_items'
                AND COLUMN_NAME IN (
                    'duns_number', 'prop_65_warning', 'dehp_free', 'latex', 'use_field',
                    'temp_range', 'humidity_limitation', 'pack_inner_2', 'pack_inner_1',
                    'pack_sellable', 'pack_ship_1', 'pack_ship_2', 'product_identification',
                    'term_code', 'hc_class', 'license_number'
                )
        `;

        console.log('\nIncorrect columns that exist in database:');
        result.recordset.forEach(r => {
            console.log(`  - ${r.COLUMN_NAME}`);
        });

        if (result.recordset.length === 0) {
            console.log('  (none found)');
        } else {
            console.log(`\nTotal: ${result.recordset.length} columns need to be removed`);
        }

        await sql.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkColumns();
