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

async function executeComprehensiveCleanup() {
    let pool;

    try {
        // Connect to database
        console.log('🔌 Connecting to SQL Server database...');
        pool = await sql.connect(dbConfig);
        console.log('✅ Connected successfully!');

        // Step 1: Show current counts before cleanup
        console.log('\n📊 STEP 1: Current record count before cleanup');
        console.log('='.repeat(60));
        const beforeCount = await pool.request().query(`
            SELECT COUNT(*) as total_records
            FROM data_team_active_items
        `);
        console.log(`Current total records: ${beforeCount.recordset[0].total_records}`);

        // Step 2: Analyze duplicates
        console.log('\n🔍 STEP 2: Analyzing duplicates to be removed');
        console.log('='.repeat(60));
        const duplicateAnalysis = await pool.request().query(`
            SELECT
                COUNT(*) as total_records,
                COUNT(DISTINCT CONCAT(ISNULL(brand_name, ''), '|', ISNULL(item, ''), '|', ISNULL(description1, ''))) as unique_records,
                COUNT(*) - COUNT(DISTINCT CONCAT(ISNULL(brand_name, ''), '|', ISNULL(item, ''), '|', ISNULL(description1, ''))) as duplicates_to_remove
            FROM data_team_active_items
        `);

        const analysis = duplicateAnalysis.recordset[0];
        console.log(`Total records: ${analysis.total_records}`);
        console.log(`Unique records: ${analysis.unique_records}`);
        console.log(`Duplicates to remove: ${analysis.duplicates_to_remove}`);

        // Step 3: Create backup table
        console.log('\n💾 STEP 3: Creating backup table');
        console.log('='.repeat(60));

        // First check if backup table exists and drop it
        await pool.request().query(`
            IF OBJECT_ID('data_team_active_items_backup_before_cleanup', 'U') IS NOT NULL
                DROP TABLE data_team_active_items_backup_before_cleanup
        `);

        // Create backup
        await pool.request().query(`
            SELECT * INTO data_team_active_items_backup_before_cleanup
            FROM data_team_active_items
        `);

        const backupCount = await pool.request().query(`
            SELECT COUNT(*) as backup_records
            FROM data_team_active_items_backup_before_cleanup
        `);
        console.log(`✅ Backup created successfully with ${backupCount.recordset[0].backup_records} records`);

        // Step 4: Show sample of duplicates
        console.log('\n📋 STEP 4: Sample of duplicate groups to be cleaned');
        console.log('='.repeat(60));
        const duplicateSample = await pool.request().query(`
            WITH DuplicateGroups AS (
                SELECT
                    brand_name,
                    item,
                    description1,
                    COUNT(*) as duplicate_count,
                    MIN(id) as keep_id,
                    MAX(id) as remove_id
                FROM data_team_active_items
                GROUP BY brand_name, item, description1
                HAVING COUNT(*) > 1
            )
            SELECT TOP 10 * FROM DuplicateGroups
            ORDER BY duplicate_count DESC
        `);

        if (duplicateSample.recordset.length > 0) {
            console.log('Top 10 duplicate groups:');
            duplicateSample.recordset.forEach((group, index) => {
                console.log(`${index + 1}. Brand: "${group.brand_name}", Item: "${group.item}"`);
                console.log(`   Description: "${group.description1}"`);
                console.log(`   Count: ${group.duplicate_count}, Keep ID: ${group.keep_id}`);
                console.log('');
            });
        }

        // Step 5: Execute cleanup
        console.log('\n🧹 STEP 5: Executing duplicate removal (keeping lowest ID)');
        console.log('='.repeat(60));
        console.log('Starting cleanup process...');

        const deleteResult = await pool.request().query(`
            WITH DuplicateCTE AS (
                SELECT
                    id,
                    brand_name,
                    item,
                    description1,
                    ROW_NUMBER() OVER (
                        PARTITION BY
                            ISNULL(brand_name, ''),
                            ISNULL(item, ''),
                            ISNULL(description1, '')
                        ORDER BY id ASC  -- Keep the oldest record (lowest ID)
                    ) as row_num
                FROM data_team_active_items
            )
            DELETE FROM data_team_active_items
            WHERE id IN (
                SELECT id FROM DuplicateCTE WHERE row_num > 1
            )
        `);

        console.log(`✅ Duplicate removal completed. Rows deleted: ${deleteResult.rowsAffected[0]}`);

        // Step 6: Verify results
        console.log('\n📈 STEP 6: Post-cleanup verification');
        console.log('='.repeat(60));

        const afterCount = await pool.request().query(`
            SELECT COUNT(*) as total_records
            FROM data_team_active_items
        `);

        const verification = await pool.request().query(`
            SELECT
                COUNT(*) - COUNT(DISTINCT CONCAT(ISNULL(brand_name, ''), '|', ISNULL(item, ''), '|', ISNULL(description1, ''))) as remaining_duplicates
            FROM data_team_active_items
        `);

        console.log(`Records after cleanup: ${afterCount.recordset[0].total_records}`);
        console.log(`Remaining duplicates: ${verification.recordset[0].remaining_duplicates}`);

        // Step 7: Data integrity check
        console.log('\n🔍 STEP 7: Data integrity verification');
        console.log('='.repeat(60));

        const integritySample = await pool.request().query(`
            SELECT TOP 5
                id, brand_name, item, description1,
                created_at, updated_at
            FROM data_team_active_items
            ORDER BY id ASC
        `);

        console.log('Sample of remaining records (first 5):');
        integritySample.recordset.forEach((record, index) => {
            console.log(`${index + 1}. ID: ${record.id}, Brand: "${record.brand_name}", Item: "${record.item}"`);
        });

        // Step 8: Final summary
        console.log('\n📊 COMPREHENSIVE CLEANUP SUMMARY');
        console.log('='.repeat(60));
        console.log(`Records before cleanup: ${beforeCount.recordset[0].total_records}`);
        console.log(`Unique records identified: ${analysis.unique_records}`);
        console.log(`Duplicates removed: ${deleteResult.rowsAffected[0]}`);
        console.log(`Records after cleanup: ${afterCount.recordset[0].total_records}`);
        console.log(`Remaining duplicates: ${verification.recordset[0].remaining_duplicates}`);
        console.log(`Expected final count: 440`);
        console.log(`Actual vs Expected: ${afterCount.recordset[0].total_records === 440 ? 'MATCH ✅' : 'MISMATCH ⚠️'}`);

        if (verification.recordset[0].remaining_duplicates === 0) {
            console.log('\n🎉 SUCCESS: All duplicates have been removed successfully!');
        } else {
            console.log('\n⚠️  WARNING: Some duplicates may still remain. Please investigate.');
        }

        if (afterCount.recordset[0].total_records === 440) {
            console.log('🎯 PERFECT: Record count matches expected count of 440!');
        } else {
            console.log(`📋 NOTE: Record count (${afterCount.recordset[0].total_records}) differs from expected count (440).`);
        }

        // Return results for verification
        return {
            beforeCount: beforeCount.recordset[0].total_records,
            afterCount: afterCount.recordset[0].total_records,
            duplicatesRemoved: deleteResult.rowsAffected[0],
            remainingDuplicates: verification.recordset[0].remaining_duplicates,
            backupCreated: true
        };

    } catch (error) {
        console.error('❌ Error during cleanup process:', error.message);
        console.error('Stack trace:', error.stack);
        throw error;
    } finally {
        if (pool) {
            await pool.close();
            console.log('\n🔌 Database connection closed.');
        }
    }
}

// Execute the cleanup
console.log('🚀 Starting comprehensive duplicate cleanup process...');
console.log('This will remove 2,283 duplicate records, keeping only 440 unique records.');
console.log('');

executeComprehensiveCleanup()
    .then(results => {
        console.log('\n✅ Cleanup process completed successfully!');
        console.log('Results:', results);
    })
    .catch(error => {
        console.error('\n❌ Cleanup process failed:', error.message);
        process.exit(1);
    });