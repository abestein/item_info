-- Validation script for fresh SQL import
-- Run this after importing data_import_statements_FRESH.sql

USE your_database_name; -- Replace with actual database name

-- 1. Check total record count
SELECT 'Expected vs Actual' as Check_Type,
       2723 as Expected_Records,
       COUNT(*) as Actual_Records,
       CASE WHEN COUNT(*) = 2723
            THEN 'PASS' ELSE 'FAIL' END as Status
FROM data_team_active_items;

-- 2. Check for any NULL item numbers (should be minimal)
SELECT 'NULL Items Check' as Check_Type,
       COUNT(*) as NULL_Items,
       CASE WHEN COUNT(*) < 10 THEN 'PASS' ELSE 'REVIEW' END as Status
FROM data_team_active_items
WHERE item IS NULL OR item = '';

-- 3. Check data distribution
SELECT 'Brand Distribution' as Check_Type,
       brand_name,
       COUNT(*) as Record_Count
FROM data_team_active_items
WHERE brand_name IS NOT NULL
GROUP BY brand_name
ORDER BY Record_Count DESC;

-- 4. Verify no syntax errors in descriptions
SELECT 'Syntax Check' as Check_Type,
       COUNT(*) as Records_With_Quotes,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'REVIEW' END as Status
FROM data_team_active_items
WHERE description1 LIKE '%\%' OR description2 LIKE '%\%';

-- 5. Final validation
SELECT 'Import Status' as Final_Check,
       CASE WHEN COUNT(*) = 2723
            THEN '✅ SUCCESS: All records imported'
            ELSE '⚠️ REVIEW: Record count mismatch' END as Result
FROM data_team_active_items;
