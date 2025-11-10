import sql from 'mssql';
import { config } from 'dotenv';

config();

const dbConfig = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function verifyCleanupSuccess() {
    let pool;

    try {
        console.log('🔌 Connecting to SQL Server database for verification...');
        pool = await sql.connect(dbConfig);
        console.log('✅ Connected successfully!');

        console.log('\n📊 CLEANUP VERIFICATION REPORT');
        console.log('='.repeat(60));

        // 1. Count total records
        const totalCount = await pool.request().query(`
            SELECT COUNT(*) as total_records
            FROM data_team_active_items
        `);
        console.log(`✅ Total records after cleanup: ${totalCount.recordset[0].total_records}`);

        // 2. Check for duplicates
        const duplicateCheck = await pool.request().query(`
            SELECT
                COUNT(*) - COUNT(DISTINCT CONCAT(ISNULL(brand_name, ''), '|', ISNULL(item, ''), '|', ISNULL(description1, ''))) as remaining_duplicates
            FROM data_team_active_items
        `);
        console.log(`✅ Remaining duplicates: ${duplicateCheck.recordset[0].remaining_duplicates}`);

        // 3. Verify backup table exists and has correct count
        const backupCount = await pool.request().query(`
            SELECT COUNT(*) as backup_records
            FROM data_team_active_items_backup_before_cleanup
        `);
        console.log(`✅ Backup table records: ${backupCount.recordset[0].backup_records}`);

        // 4. Sample data integrity check
        console.log('\n📋 Data Integrity Verification');
        console.log('='.repeat(40));

        const sampleData = await pool.request().query(`
            SELECT TOP 10
                id,
                brand_name,
                item,
                description1,
                description2,
                UOM_sellable,
                UPC_sellable
            FROM data_team_active_items
            ORDER BY id ASC
        `);

        console.log('Sample records (first 10):');
        sampleData.recordset.forEach((record, index) => {
            console.log(`${index + 1}. ID: ${record.id}`);
            console.log(`   Brand: "${record.brand_name}"`);
            console.log(`   Item: "${record.item}"`);
            console.log(`   Description: "${record.description1}"`);
            console.log(`   UOM: "${record.UOM_sellable}"`);
            console.log('');
        });

        // 5. Check for any NULL critical fields
        const nullCheck = await pool.request().query(`
            SELECT
                SUM(CASE WHEN brand_name IS NULL THEN 1 ELSE 0 END) as null_brand_names,
                SUM(CASE WHEN item IS NULL THEN 1 ELSE 0 END) as null_items,
                SUM(CASE WHEN description1 IS NULL THEN 1 ELSE 0 END) as null_description1
            FROM data_team_active_items
        `);

        console.log('\n🔍 NULL Field Analysis');
        console.log('='.repeat(30));
        console.log(`NULL brand_name fields: ${nullCheck.recordset[0].null_brand_names}`);
        console.log(`NULL item fields: ${nullCheck.recordset[0].null_items}`);
        console.log(`NULL description1 fields: ${nullCheck.recordset[0].null_description1}`);

        // 6. Verify unique constraints
        const uniqueConstraintCheck = await pool.request().query(`
            WITH DuplicateGroups AS (
                SELECT
                    brand_name,
                    item,
                    description1,
                    COUNT(*) as record_count
                FROM data_team_active_items
                GROUP BY brand_name, item, description1
                HAVING COUNT(*) > 1
            )
            SELECT COUNT(*) as groups_with_duplicates
            FROM DuplicateGroups
        `);

        console.log(`\n✅ Groups with duplicates: ${uniqueConstraintCheck.recordset[0].groups_with_duplicates}`);

        // 7. Database table information
        const tableInfo = await pool.request().query(`
            SELECT
                t.name as table_name,
                p.rows as estimated_rows,
                CAST(ROUND(((SUM(a.total_pages) * 8) / 1024.00), 2) AS NUMERIC(36, 2)) AS size_mb
            FROM sys.tables t
            INNER JOIN sys.indexes i ON t.OBJECT_ID = i.object_id
            INNER JOIN sys.partitions p ON i.object_id = p.OBJECT_ID AND i.index_id = p.index_id
            INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
            WHERE t.name IN ('data_team_active_items', 'data_team_active_items_backup_before_cleanup')
            GROUP BY t.name, p.rows
            ORDER BY t.name
        `);

        console.log('\n📊 Table Storage Information');
        console.log('='.repeat(40));
        tableInfo.recordset.forEach(table => {
            console.log(`${table.table_name}: ${table.estimated_rows} rows, ${table.size_mb} MB`);
        });

        // 8. Final verification summary
        console.log('\n🎯 FINAL VERIFICATION SUMMARY');
        console.log('='.repeat(60));

        const isSuccess =
            totalCount.recordset[0].total_records === 440 &&
            duplicateCheck.recordset[0].remaining_duplicates === 0 &&
            backupCount.recordset[0].backup_records === 2723 &&
            uniqueConstraintCheck.recordset[0].groups_with_duplicates === 0;

        console.log(`Expected total records: 440`);
        console.log(`Actual total records: ${totalCount.recordset[0].total_records}`);
        console.log(`Records match expected: ${totalCount.recordset[0].total_records === 440 ? '✅ YES' : '❌ NO'}`);
        console.log(`Expected duplicates: 0`);
        console.log(`Actual duplicates: ${duplicateCheck.recordset[0].remaining_duplicates}`);
        console.log(`Zero duplicates confirmed: ${duplicateCheck.recordset[0].remaining_duplicates === 0 ? '✅ YES' : '❌ NO'}`);
        console.log(`Backup table created: ${backupCount.recordset[0].backup_records > 0 ? '✅ YES' : '❌ NO'}`);
        console.log(`Backup has original data: ${backupCount.recordset[0].backup_records === 2723 ? '✅ YES' : '❌ NO'}`);

        if (isSuccess) {
            console.log('\n🎉 SUCCESS: Database cleanup completed successfully!');
            console.log('✅ All verification checks passed');
            console.log('✅ Database is now in the correct state with 440 unique records');
            console.log('✅ Full backup created before cleanup');
            console.log('✅ No data integrity issues detected');
        } else {
            console.log('\n⚠️  WARNING: Some verification checks failed');
            console.log('Please review the results above and investigate any issues');
        }

        return {
            totalRecords: totalCount.recordset[0].total_records,
            remainingDuplicates: duplicateCheck.recordset[0].remaining_duplicates,
            backupRecords: backupCount.recordset[0].backup_records,
            success: isSuccess
        };

    } catch (error) {
        console.error('❌ Error during verification:', error.message);
        throw error;
    } finally {
        if (pool) {
            await pool.close();
            console.log('\n🔌 Database connection closed.');
        }
    }
}

// Execute verification
verifyCleanupSuccess()
    .then(results => {
        console.log('\n📋 Verification completed');
        if (results.success) {
            console.log('🎯 Database cleanup was 100% successful!');
        }
    })
    .catch(error => {
        console.error('\n❌ Verification failed:', error.message);
        process.exit(1);
    });