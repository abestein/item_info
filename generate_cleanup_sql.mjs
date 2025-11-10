import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

async function generateCleanupSQL() {
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
        console.log('✅ Connected to SQL Server\n');

        console.log('🧹 GENERATING CLEANUP SQL TO REMOVE DUPLICATES');
        console.log('=' .repeat(60));

        // Create SQL to identify and remove duplicates
        const cleanupSQL = `
-- ===================================================
-- CLEANUP SCRIPT TO REMOVE DUPLICATES
-- Generated on: ${new Date().toISOString()}
-- ===================================================

-- Step 1: Show current counts before cleanup
SELECT 'BEFORE CLEANUP' as status, COUNT(*) as total_records FROM data_team_active_items;

-- Step 2: Show how many duplicates will be removed
SELECT
    'DUPLICATES TO REMOVE' as status,
    COUNT(*) - COUNT(DISTINCT CONCAT(ISNULL(brand_name, ''), '|', ISNULL(item, ''), '|', ISNULL(description1, ''))) as duplicates_to_remove
FROM data_team_active_items;

-- Step 3: Create backup table (OPTIONAL - uncomment if you want a backup)
-- SELECT * INTO data_team_active_items_backup_before_cleanup FROM data_team_active_items;

-- Step 4: Remove duplicates - keep the record with the LOWEST ID for each unique combination
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
);

-- Step 5: Show final counts after cleanup
SELECT 'AFTER CLEANUP' as status, COUNT(*) as total_records FROM data_team_active_items;

-- Step 6: Verify no duplicates remain
SELECT
    'VERIFICATION' as status,
    COUNT(*) - COUNT(DISTINCT CONCAT(ISNULL(brand_name, ''), '|', ISNULL(item, ''), '|', ISNULL(description1, ''))) as remaining_duplicates
FROM data_team_active_items;

-- Expected results:
-- Before cleanup: 3,121 records
-- Duplicates to remove: 488 records
-- After cleanup: 2,633 records
-- Remaining duplicates: 0
`;

        console.log(cleanupSQL);

        // Also save to file
        require('fs').writeFileSync('C:\\Users\\A.Stein\\Source\\Repos\\item_info\\cleanup_duplicates.sql', cleanupSQL);
        console.log('\n✅ Cleanup SQL saved to: C:\\Users\\A.Stein\\Source\\Repos\\item_info\\cleanup_duplicates.sql');

        console.log('\n📋 EXECUTION INSTRUCTIONS:');
        console.log('=' .repeat(60));
        console.log('1. Review the generated SQL script carefully');
        console.log('2. Test on a backup/copy of the database first if possible');
        console.log('3. Uncomment the backup line if you want to create a backup table');
        console.log('4. Execute the script using SQL Server Management Studio or sqlcmd');
        console.log('5. Verify the results match the expected counts');

        console.log('\n⚠️  WARNING:');
        console.log('This will permanently delete 488 duplicate records!');
        console.log('Make sure you have a backup before proceeding.');

        await pool.close();

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

generateCleanupSQL();