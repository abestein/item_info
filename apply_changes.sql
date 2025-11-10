-- Apply changes from data_team_active_items_temp to data_team_active_items
-- WARNING: This script will permanently modify the original table
-- Make sure to run compare_tables.sql first and review all changes before executing

-- Before running this script, ensure you have:
-- 1. Reviewed the output of compare_tables.sql
-- 2. Confirmed all changes are intentional
-- 3. Have a backup of the original table if needed

BEGIN TRANSACTION;

-- Step 1: Update existing records with changes from temp table
UPDATE orig
SET
    item_name = temp.item_name,
    description = temp.description,
    category = temp.category,
    price = temp.price,
    status = temp.status,
    last_updated = temp.last_updated
FROM data_team_active_items orig
INNER JOIN data_team_active_items_temp temp ON orig.id = temp.id
WHERE
    ISNULL(orig.item_name, '') != ISNULL(temp.item_name, '') OR
    ISNULL(orig.description, '') != ISNULL(temp.description, '') OR
    ISNULL(orig.category, '') != ISNULL(temp.category, '') OR
    ISNULL(orig.price, 0) != ISNULL(temp.price, 0) OR
    ISNULL(orig.status, '') != ISNULL(temp.status, '') OR
    ISNULL(orig.last_updated, '1900-01-01') != ISNULL(temp.last_updated, '1900-01-01');

-- Step 2: Insert new records from temp table
INSERT INTO data_team_active_items
SELECT temp.*
FROM data_team_active_items_temp temp
LEFT JOIN data_team_active_items orig ON temp.id = orig.id
WHERE orig.id IS NULL;

-- Step 3: Delete records that exist in original but not in temp (if this is intended)
-- UNCOMMENT the following lines only if you want to delete records that are missing from the temp table
/*
DELETE orig
FROM data_team_active_items orig
LEFT JOIN data_team_active_items_temp temp ON orig.id = temp.id
WHERE temp.id IS NULL;
*/

-- Display summary of applied changes
SELECT
    @@ROWCOUNT as total_rows_affected,
    'Changes applied successfully. Remember to drop temp table when done.' as status;

-- Uncomment the following line if you're satisfied with the changes
-- COMMIT TRANSACTION;

-- Uncomment the following line if you want to rollback the changes
-- ROLLBACK TRANSACTION;

-- Note: The transaction is left open for review.
-- You must manually COMMIT or ROLLBACK after reviewing the results.