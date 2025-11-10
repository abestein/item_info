import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

async function verifyFieldSizes() {
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

        console.log('🔗 Connecting to SQL Server for verification...');
        pool = await sql.connect(config);
        console.log('✅ Connected successfully!');

        // Get current column sizes with a cleaner query
        const verificationQuery = `
            SELECT
                COLUMN_NAME as [Column Name],
                CHARACTER_MAXIMUM_LENGTH as [Current Size],
                CASE
                    WHEN COLUMN_NAME IN ('description1', 'description3') THEN 100
                    WHEN COLUMN_NAME = 'description2' THEN 150
                    ELSE 75
                END as [Expected Size]
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

        const result = await pool.request().query(verificationQuery);
        console.log('\n📋 Column Size Verification Results:');
        console.log('=====================================');

        let allCorrect = true;

        result.recordset.forEach(row => {
            const isCorrect = row['Current Size'] === row['Expected Size'];
            const status = isCorrect ? 'CORRECT' : 'NEEDS REVIEW';

            console.log(`${row['Column Name'].padEnd(20)} | Current: ${String(row['Current Size']).padStart(3)} | Expected: ${String(row['Expected Size']).padStart(3)} | ${status}`);

            if (!isCorrect) {
                allCorrect = false;
            }
        });

        console.log('\n📊 Summary:');
        console.log('===========');

        if (allCorrect) {
            console.log('✅ SUCCESS: All column sizes have been updated correctly!');
            console.log('');
            console.log('📝 Changes made:');
            console.log('   • description1: 50 → 100 characters');
            console.log('   • description2: 100 → 150 characters');
            console.log('   • description3: 50 → 100 characters');
            console.log('   • brand_name: 50 → 75 characters');
            console.log('   • item: 50 → 75 characters');
            console.log('   • hcpc_code: 50 → 75 characters');
            console.log('   • product_type: 50 → 75 characters');
            console.log('   • fei_number: 50 → 75 characters');
            console.log('   • product_code: 255 → 75 characters');
            console.log('   • fda_510_k: 255 → 75 characters');
            console.log('   • device_class: 255 → 75 characters');
            console.log('   • uom_units_inner_2: 50 → 75 characters');
            console.log('   • uom_pack_inner_1: 50 → 75 characters');
            console.log('   • uom_sellable: 50 → 75 characters');
            console.log('   • uom_ship_1: 255 → 75 characters');
            console.log('   • uom_ship_2: 255 → 75 characters');
            console.log('');
            console.log('🎉 The database is now ready for improved data import!');
            console.log('💡 These larger field sizes should prevent truncation errors during data import.');
        } else {
            console.log('❌ Some columns still need attention. Review the table above.');
        }

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
    } finally {
        if (pool) {
            await pool.close();
            console.log('\n🔒 Database connection closed');
        }
    }
}

verifyFieldSizes();