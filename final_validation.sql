-- FINAL IMPORT VALIDATION QUERIES
-- =================================

-- 1. Record count validation
SELECT 'Record Count Check' as Check_Type,
       COUNT(*) as Actual_Count,
       2722 as Expected_Count,
       CASE WHEN COUNT(*) = 2722
            THEN 'SUCCESS - All 2722 records imported'
            ELSE 'FAILED - Expected 2722, got ' + CAST(COUNT(*) AS VARCHAR)
       END as Status
FROM data_team_active_items;

-- 2. Uniqueness validation
SELECT 'Uniqueness Check' as Check_Type,
       COUNT(DISTINCT item) as Unique_Items,
       COUNT(*) as Total_Records,
       CASE WHEN COUNT(DISTINCT item) = COUNT(*) AND COUNT(*) = 2722
            THEN 'SUCCESS - All items are unique'
            ELSE 'WARNING - Duplicate items found'
       END as Status
FROM data_team_active_items;

-- 3. Data quality checks
SELECT 'Non-NULL Items' as Check_Type,
       COUNT(*) as Count,
       CASE WHEN COUNT(*) = 2722
            THEN 'SUCCESS - All items have values'
            ELSE 'WARNING - Some items are NULL'
       END as Status
FROM data_team_active_items
WHERE item IS NOT NULL AND item != '';

-- 4. Final import success verification
SELECT 'FINAL IMPORT STATUS' as Result_Type,
       CASE
           WHEN COUNT(*) = 2722 AND COUNT(DISTINCT item) = 2722
           THEN 'COMPLETE SUCCESS: All 2722 unique items imported successfully!'
           WHEN COUNT(*) != 2722
           THEN 'COUNT ERROR: Expected 2722 records, got ' + CAST(COUNT(*) AS VARCHAR)
           WHEN COUNT(DISTINCT item) != 2722
           THEN 'UNIQUENESS ERROR: Found duplicate items in import'
           ELSE 'UNKNOWN ERROR: Please investigate manually'
       END as Final_Status
FROM data_team_active_items;

-- 5. Summary statistics
SELECT
    'IMPORT SUMMARY' as Report_Type,
    COUNT(*) as Total_Records_Imported,
    COUNT(DISTINCT item) as Unique_Items,
    COUNT(DISTINCT brand_name) as Unique_Brands,
    (COUNT(*) * 100.0 / 2722) as Success_Percentage
FROM data_team_active_items;