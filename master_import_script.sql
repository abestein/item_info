-- MASTER IMPORT SCRIPT FOR ALL BATCHES
-- Total records to import: 2722
-- Number of batches: 3

-- Pre-import verification
SELECT 'Starting import' as status, COUNT(*) as current_records FROM data_team_active_items;

-- Import all batches
:r import_batch_1_of_3.sql
:r import_batch_2_of_3.sql
:r import_batch_3_of_3.sql

-- Final verification
SELECT 'Import completed' as status, COUNT(*) as final_records FROM data_team_active_items;
SELECT 'Expected vs Actual' as check_type,
       2722 as expected_records,
       COUNT(*) as actual_records,
       CASE WHEN COUNT(*) = 2722
            THEN 'SUCCESS'
            ELSE 'FAILED'
       END as import_status
FROM data_team_active_items;
