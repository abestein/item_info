-- Compare data_team_active_items with data_team_active_items_temp
-- This script identifies all differences between the original and temp tables

-- Check for records that exist in temp but not in original (NEW records)
SELECT
    'NEW' as change_type,
    temp.*
FROM data_team_active_items_temp temp
LEFT JOIN data_team_active_items orig ON temp.id = orig.id
WHERE orig.id IS NULL;

-- Check for records that exist in original but not in temp (DELETED records)
SELECT
    'DELETED' as change_type,
    orig.*
FROM data_team_active_items orig
LEFT JOIN data_team_active_items_temp temp ON orig.id = temp.id
WHERE temp.id IS NULL;

-- Check for records that exist in both but have different values (MODIFIED records)
-- Note: This assumes all columns should be compared. Adjust column list as needed.
SELECT
    'MODIFIED' as change_type,
    'Original' as record_source,
    orig.*
FROM data_team_active_items orig
INNER JOIN data_team_active_items_temp temp ON orig.id = temp.id
WHERE
    ISNULL(orig.item_name, '') != ISNULL(temp.item_name, '') OR
    ISNULL(orig.description, '') != ISNULL(temp.description, '') OR
    ISNULL(orig.category, '') != ISNULL(temp.category, '') OR
    ISNULL(orig.price, 0) != ISNULL(temp.price, 0) OR
    ISNULL(orig.status, '') != ISNULL(temp.status, '') OR
    ISNULL(orig.last_updated, '1900-01-01') != ISNULL(temp.last_updated, '1900-01-01')

UNION ALL

SELECT
    'MODIFIED' as change_type,
    'New Version' as record_source,
    temp.*
FROM data_team_active_items orig
INNER JOIN data_team_active_items_temp temp ON orig.id = temp.id
WHERE
    ISNULL(orig.item_name, '') != ISNULL(temp.item_name, '') OR
    ISNULL(orig.description, '') != ISNULL(temp.description, '') OR
    ISNULL(orig.category, '') != ISNULL(temp.category, '') OR
    ISNULL(orig.price, 0) != ISNULL(temp.price, 0) OR
    ISNULL(orig.status, '') != ISNULL(temp.status, '') OR
    ISNULL(orig.last_updated, '1900-01-01') != ISNULL(temp.last_updated, '1900-01-01')
ORDER BY change_type, id;

-- Summary of changes
SELECT
    'SUMMARY' as report_type,
    (SELECT COUNT(*) FROM data_team_active_items_temp temp LEFT JOIN data_team_active_items orig ON temp.id = orig.id WHERE orig.id IS NULL) as new_records,
    (SELECT COUNT(*) FROM data_team_active_items orig LEFT JOIN data_team_active_items_temp temp ON orig.id = temp.id WHERE temp.id IS NULL) as deleted_records,
    (SELECT COUNT(DISTINCT orig.id) FROM data_team_active_items orig INNER JOIN data_team_active_items_temp temp ON orig.id = temp.id
     WHERE ISNULL(orig.item_name, '') != ISNULL(temp.item_name, '') OR
           ISNULL(orig.description, '') != ISNULL(temp.description, '') OR
           ISNULL(orig.category, '') != ISNULL(temp.category, '') OR
           ISNULL(orig.price, 0) != ISNULL(temp.price, 0) OR
           ISNULL(orig.status, '') != ISNULL(temp.status, '') OR
           ISNULL(orig.last_updated, '1900-01-01') != ISNULL(temp.last_updated, '1900-01-01')) as modified_records;