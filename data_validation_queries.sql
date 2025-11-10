-- Data validation queries
-- Run these after importing to verify data quality

-- 1. Row count check
SELECT COUNT(*) as total_rows FROM data_team_active_items;
-- Expected: 2723

-- 2. Check for empty critical fields
SELECT 
    COUNT(*) as rows_with_brand,
    COUNT(*) - COUNT(brand_name) as rows_missing_brand
FROM data_team_active_items;

-- 3. Sample data verification
SELECT TOP 10 
    brand_name,
    item,
    description1,
    reg_product_type,
    created_date
FROM data_team_active_items
ORDER BY id;

-- 4. Data type validation
SELECT 
    COUNT(*) as total_rows,
    COUNT(CASE WHEN reg_fei IS NOT NULL THEN 1 END) as rows_with_fei,
    COUNT(CASE WHEN inner_1 IS NOT NULL THEN 1 END) as rows_with_upc
FROM data_team_active_items;

-- 5. Check for duplicates
SELECT 
    brand_name,
    item,
    COUNT(*) as duplicate_count
FROM data_team_active_items
GROUP BY brand_name, item
HAVING COUNT(*) > 1;