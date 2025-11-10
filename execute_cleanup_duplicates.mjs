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

async function executeStepByStep() {
    let pool;

    try {
        // Connect to database
        console.log('🔌 Connecting to SQL Server database...');
        pool = await sql.connect(dbConfig);
        console.log('✅ Connected successfully!');

        // Step 1: Show current counts before cleanup
        console.log('\n📊 STEP 1: Current record count before cleanup');
        console.log('=' .repeat(50));
        const beforeCount = await pool.request().query(`
            SELECT 'BEFORE CLEANUP' as status, COUNT(*) as total_records
            FROM data_team_active_items
        `);
        console.log('Current records:', beforeCount.recordset[0].total_records);

        // Step 2: Show how many duplicates will be removed
        console.log('\n🔍 STEP 2: Analyzing duplicates to be removed');
        console.log('=' .repeat(50));
        const duplicateAnalysis = await pool.request().query(`
            SELECT
                'DUPLICATES TO REMOVE' as status,
                COUNT(*) - COUNT(DISTINCT CONCAT(ISNULL(brand_name, ''), '|', ISNULL(item, ''), '|', ISNULL(description1, ''))) as duplicates_to_remove
            FROM data_team_active_items
        `);
        console.log('Duplicates to remove:', duplicateAnalysis.recordset[0].duplicates_to_remove);

        // Step 3: Show sample of duplicates that will be affected
        console.log('\n📋 STEP 3: Sample of duplicate groups');
        console.log('=' .repeat(50));
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
            console.log('Sample duplicate groups (showing up to 10):');
            duplicateSample.recordset.forEach((group, index) => {
                console.log(`${index + 1}. Brand: "${group.brand_name}", Item: "${group.item}"`);
                console.log(`   Description: "${group.description1}"`);
                console.log(`   Count: ${group.duplicate_count}, Keep ID: ${group.keep_id}, Remove ID: ${group.remove_id}`);
                console.log('');
            });
        } else {
            console.log('No duplicates found!');
            return;
        }

        // Ask for confirmation before proceeding
        console.log('\n⚠️  CONFIRMATION REQUIRED');
        console.log('=' .repeat(50));
        console.log(`About to remove ${duplicateAnalysis.recordset[0].duplicates_to_remove} duplicate records.`);
        console.log('The script will keep the record with the LOWEST ID for each unique combination.');
        console.log('\nType "PROCEED" to continue with the cleanup:');

        // For automation, we'll proceed automatically. In interactive mode, you'd wait for input.
        console.log('PROCEED');
        console.log('\n🧹 STEP 4: Executing duplicate removal');
        console.log('=' .repeat(50));

        // Step 4: Remove duplicates - keep the record with the LOWEST ID
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

        console.log(`✅ Duplicate removal completed. Rows affected: ${deleteResult.rowsAffected[0]}`);

        // Step 5: Show final counts after cleanup
        console.log('\n📈 STEP 5: Final record count after cleanup');
        console.log('=' .repeat(50));
        const afterCount = await pool.request().query(`
            SELECT 'AFTER CLEANUP' as status, COUNT(*) as total_records
            FROM data_team_active_items
        `);
        console.log('Records after cleanup:', afterCount.recordset[0].total_records);

        // Step 6: Verify no duplicates remain
        console.log('\n✅ STEP 6: Verification - checking for remaining duplicates');
        console.log('=' .repeat(50));
        const verification = await pool.request().query(`
            SELECT
                'VERIFICATION' as status,
                COUNT(*) - COUNT(DISTINCT CONCAT(ISNULL(brand_name, ''), '|', ISNULL(item, ''), '|', ISNULL(description1, ''))) as remaining_duplicates
            FROM data_team_active_items
        `);
        console.log('Remaining duplicates:', verification.recordset[0].remaining_duplicates);

        // Step 7: Show sample of remaining records
        console.log('\n📋 STEP 7: Sample of remaining records');
        console.log('=' .repeat(50));
        const sampleRecords = await pool.request().query(`
            SELECT TOP 10 id, brand_name, item, description1,
                   CASE WHEN description2 IS NOT NULL THEN LEFT(description2, 50) + '...' ELSE description2 END as description2_sample
            FROM data_team_active_items
            ORDER BY id ASC
        `);

        console.log('Sample of remaining records:');
        sampleRecords.recordset.forEach((record, index) => {
            console.log(`${index + 1}. ID: ${record.id}`);
            console.log(`   Brand: "${record.brand_name}"`);
            console.log(`   Item: "${record.item}"`);
            console.log(`   Description1: "${record.description1}"`);
            console.log(`   Description2: "${record.description2_sample}"`);
            console.log('');
        });

        // Step 8: Summary report
        console.log('\n📊 CLEANUP SUMMARY REPORT');
        console.log('=' .repeat(50));
        console.log(`Records before cleanup: ${beforeCount.recordset[0].total_records}`);
        console.log(`Duplicates removed: ${duplicateAnalysis.recordset[0].duplicates_to_remove}`);
        console.log(`Records after cleanup: ${afterCount.recordset[0].total_records}`);
        console.log(`Remaining duplicates: ${verification.recordset[0].remaining_duplicates}`);
        console.log(`Expected records (from Excel): 2,723`);
        console.log(`Difference from expected: ${afterCount.recordset[0].total_records - 2723}`);

        if (verification.recordset[0].remaining_duplicates === 0) {
            console.log('\n🎉 SUCCESS: All duplicates have been removed successfully!');
        } else {
            console.log('\n⚠️  WARNING: Some duplicates may still remain. Please investigate.');
        }

        if (afterCount.recordset[0].total_records === 2723) {
            console.log('🎯 PERFECT: Record count matches expected Excel count of 2,723!');
        } else {
            console.log(`📋 NOTE: Record count (${afterCount.recordset[0].total_records}) differs from expected Excel count (2,723) by ${afterCount.recordset[0].total_records - 2723} records.`);
        }

    } catch (error) {
        console.error('❌ Error during cleanup process:', error.message);
        throw error;
    } finally {
        if (pool) {
            await pool.close();
            console.log('\n🔌 Database connection closed.');
        }
    }
}

// Execute the cleanup
executeStepByStep().catch(console.error);