-- ===================================================
-- CLEANUP SCRIPT TO REMOVE DUPLICATES FROM data_team_active_items
-- Generated on: 2025-09-15
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