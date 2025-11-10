import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

async function executeIndividualAlters() {
    let pool;
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

        console.log('🔗 Connecting to SQL Server...');
        pool = await sql.connect(config);
        console.log('✅ Connected to SQL Server successfully!');

        // Individual ALTER statements to execute
        const alterStatements = [
            {
                description: 'Increase description1 from 50 to 100',
                sql: 'ALTER TABLE data_team_active_items ALTER COLUMN description1 varchar(100);'
            },
            {
                description: 'Increase description3 from 50 to 100',
                sql: 'ALTER TABLE data_team_active_items ALTER COLUMN description3 varchar(100);'
            },
            {
                description: 'Increase description2 from 100 to 150',
                sql: 'ALTER TABLE data_team_active_items ALTER COLUMN description2 varchar(150);'
            },
            {
                description: 'Increase brand_name from 50 to 75',
                sql: 'ALTER TABLE data_team_active_items ALTER COLUMN brand_name varchar(75);'
            },
            {
                description: 'Increase item from 50 to 75',
                sql: 'ALTER TABLE data_team_active_items ALTER COLUMN item varchar(75);'
            },
            {
                description: 'Increase hcpc_code from 50 to 75',
                sql: 'ALTER TABLE data_team_active_items ALTER COLUMN hcpc_code varchar(75);'
            },
            {
                description: 'Increase product_type from 50 to 75',
                sql: 'ALTER TABLE data_team_active_items ALTER COLUMN product_type varchar(75);'
            },
            {
                description: 'Increase fei_number from 50 to 75',
                sql: 'ALTER TABLE data_team_active_items ALTER COLUMN fei_number varchar(75);'
            },
            {
                description: 'Set product_code to 75 (was 255)',
                sql: 'ALTER TABLE data_team_active_items ALTER COLUMN product_code varchar(75);'
            },
            {
                description: 'Set fda_510_k to 75 (was 255)',
                sql: 'ALTER TABLE data_team_active_items ALTER COLUMN fda_510_k varchar(75);'
            },
            {
                description: 'Set device_class to 75 (was 255)',
                sql: 'ALTER TABLE data_team_active_items ALTER COLUMN device_class varchar(75);'
            },
            {
                description: 'Increase uom_units_inner_2 from 50 to 75',
                sql: 'ALTER TABLE data_team_active_items ALTER COLUMN uom_units_inner_2 varchar(75);'
            },
            {
                description: 'Increase uom_pack_inner_1 from 50 to 75',
                sql: 'ALTER TABLE data_team_active_items ALTER COLUMN uom_pack_inner_1 varchar(75);'
            },
            {
                description: 'Increase uom_sellable from 50 to 75',
                sql: 'ALTER TABLE data_team_active_items ALTER COLUMN uom_sellable varchar(75);'
            },
            {
                description: 'Set uom_ship_1 to 75 (was 255)',
                sql: 'ALTER TABLE data_team_active_items ALTER COLUMN uom_ship_1 varchar(75);'
            },
            {
                description: 'Set uom_ship_2 to 75 (was 255)',
                sql: 'ALTER TABLE data_team_active_items ALTER COLUMN uom_ship_2 varchar(75);'
            }
        ];

        console.log(`🔧 Executing ${alterStatements.length} ALTER TABLE statements individually...`);
        console.log('');

        for (let i = 0; i < alterStatements.length; i++) {
            const { description, sql: statement } = alterStatements[i];

            try {
                console.log(`⚙️  ${i + 1}. ${description}`);
                await pool.request().query(statement);
                console.log(`✅ Success!`);
            } catch (error) {
                console.error(`❌ Error: ${error.message}`);
                // Continue with other statements
            }
            console.log('');
        }

        console.log('🎉 All ALTER TABLE statements executed!');

        // Final verification - get current column sizes
        console.log('🔍 Verifying updated column sizes...');
        const verificationQuery = `
            SELECT
                COLUMN_NAME,
                DATA_TYPE,
                CHARACTER_MAXIMUM_LENGTH,
                CASE
                    WHEN COLUMN_NAME IN ('description1', 'description3') THEN 'Expected: 100'
                    WHEN COLUMN_NAME = 'description2' THEN 'Expected: 150'
                    WHEN COLUMN_NAME IN ('brand_name', 'item', 'hcpc_code', 'product_type', 'fei_number', 'product_code', 'fda_510_k', 'device_class', 'uom_units_inner_2', 'uom_pack_inner_1', 'uom_sellable', 'uom_ship_1', 'uom_ship_2') THEN 'Expected: 75'
                    ELSE 'No change expected'
                END as Expected_Size,
                CASE
                    WHEN COLUMN_NAME IN ('description1', 'description3') AND CHARACTER_MAXIMUM_LENGTH = 100 THEN '✅ Correct'
                    WHEN COLUMN_NAME = 'description2' AND CHARACTER_MAXIMUM_LENGTH = 150 THEN '✅ Correct'
                    WHEN COLUMN_NAME IN ('brand_name', 'item', 'hcpc_code', 'product_type', 'fei_number', 'product_code', 'fda_510_k', 'device_class', 'uom_units_inner_2', 'uom_pack_inner_1', 'uom_sellable', 'uom_ship_1', 'uom_ship_2') AND CHARACTER_MAXIMUM_LENGTH = 75 THEN '✅ Correct'
                    ELSE '❌ Needs review'
                END as Status
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'data_team_active_items'
            AND COLUMN_NAME IN (
                'description1', 'description2', 'description3', 'brand_name', 'item',
                'hcpc_code', 'product_type', 'fei_number', 'product_code', 'fda_510_k',
                'device_class', 'uom_units_inner_2', 'uom_pack_inner_1', 'uom_sellable',
                'uom_ship_1', 'uom_ship_2'
            )
            ORDER BY COLUMN_NAME;
        `;

        const verificationResult = await pool.request().query(verificationQuery);
        console.log('📋 Final verification results:');
        console.table(verificationResult.recordset);

        // Count successful changes
        const successfulChanges = verificationResult.recordset.filter(row => row.Status === '✅ Correct').length;
        const totalChanges = verificationResult.recordset.length;

        console.log(`\n📊 Summary: ${successfulChanges}/${totalChanges} columns successfully updated`);

        if (successfulChanges === totalChanges) {
            console.log('🎉 All field size modifications completed successfully!');
            console.log('💡 The database is now ready for improved data import with larger field sizes.');
        } else {
            console.log('⚠️  Some modifications may need review. Check the table above for details.');
        }

    } catch (error) {
        console.error('❌ Script execution failed:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    } finally {
        if (pool) {
            await pool.close();
            console.log('🔒 Database connection closed');
        }
    }
}

executeIndividualAlters();