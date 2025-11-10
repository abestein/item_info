import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

async function quickDuplicateSummary() {
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

        // Get total count of duplicate records
        const duplicateSum = await pool.request().query(`
            SELECT
                COUNT(*) as duplicate_sets,
                SUM(duplicate_count - 1) as total_duplicate_records
            FROM (
                SELECT brand_name, item, description1, COUNT(*) as duplicate_count
                FROM data_team_active_items
                GROUP BY brand_name, item, description1
                HAVING COUNT(*) > 1
            ) as duplicates
        `);

        const duplicateInfo = duplicateSum.recordset[0];
        console.log(`\n📊 DUPLICATE SUMMARY:`);
        console.log(`• Number of duplicate sets: ${duplicateInfo.duplicate_sets}`);
        console.log(`• Total duplicate records: ${duplicateInfo.total_duplicate_records}`);
        console.log(`• This explains ${duplicateInfo.total_duplicate_records} of the 398 extra records\n`);

        // Check for NULL brand names specifically
        const nullBrandCount = await pool.request().query(`
            SELECT COUNT(*) as null_count FROM data_team_active_items WHERE brand_name IS NULL OR brand_name = 'null'
        `);

        console.log(`🔍 NULL BRAND ANALYSIS:`);
        console.log(`• Records with NULL/null brand_name: ${nullBrandCount.recordset[0].null_count}`);

        // Get a breakdown by brand for null records
        const nullBrandBreakdown = await pool.request().query(`
            SELECT
                CASE
                    WHEN brand_name IS NULL THEN 'NULL'
                    WHEN brand_name = 'null' THEN 'string_null'
                    ELSE brand_name
                END as brand_type,
                COUNT(*) as count
            FROM data_team_active_items
            WHERE brand_name IS NULL OR brand_name = 'null'
            GROUP BY
                CASE
                    WHEN brand_name IS NULL THEN 'NULL'
                    WHEN brand_name = 'null' THEN 'string_null'
                    ELSE brand_name
                END
        `);

        console.log(`\n🔍 NULL BRAND BREAKDOWN:`);
        nullBrandBreakdown.recordset.forEach(row => {
            console.log(`• ${row.brand_type}: ${row.count} records`);
        });

        await pool.close();

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

quickDuplicateSummary();