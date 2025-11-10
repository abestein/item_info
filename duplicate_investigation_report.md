# Data Team Active Items - Duplicate Investigation Report

**Investigation Date:** September 16, 2025
**Database:** Item_DimensionsBU
**Table:** data_team_active_items

## Executive Summary

A severe data duplication issue has been identified in the `data_team_active_items` table. The investigation reveals that **83.84% of records are duplicates**, resulting from multiple import operations of the same dataset.

## Key Findings

### 1. Scale of Duplication
- **Total Records:** 2,723
- **Unique Records:** 440
- **Duplicate Records:** 2,283 (83.84%)
- **Duplicate Groups:** 440 unique items with duplicates

### 2. Duplication Patterns

The data shows a systematic duplication pattern:

| Duplicate Count | Number of Groups | Total Records |
|----------------|------------------|---------------|
| 9 duplicates   | 122 groups       | 1,098 records |
| 8 duplicates   | 78 groups        | 624 records   |
| 5 duplicates   | 100 groups       | 500 records   |
| 4 duplicates   | 100 groups       | 400 records   |
| 3 duplicates   | 21 groups        | 63 records    |
| 2 duplicates   | 19 groups        | 38 records    |

### 3. Import Timing Analysis

All records were imported on **September 16, 2025** between 01:19:40 and 01:20:57 (approximately 1 minute and 17 seconds). This suggests multiple rapid import operations or a batch process that ran multiple times.

### 4. Most Affected Items

The top duplicated items are primarily Cardinal Health products:
- **Cardinal Health 1108UB-04 (Antiseptic Wipes):** 9 duplicates
- **Cardinal Health 1108UB-24 (Antiseptic Wipes):** 9 duplicates
- **Cardinal Health 1108UB-64 (Antiseptic Wipes):** 9 duplicates
- **Cardinal Health 1113UB-09 (Medical Scissors):** 9 duplicates

### 5. Data Integrity Impact

While the core identification fields (brand_name, item, description1) are duplicated exactly, some secondary fields like UPC codes vary between duplicate records:

**Example - Cardinal Health 1108UB-04:**
- All 9 records have identical brand_name, item, description1, description2, description3, and UOM_sellable
- UPC_sellable values vary: 616784129068, 616784132468, 616784135868, etc.

This suggests the source data may have had variations that got lost during import, or the import process generated different UPC values.

## Root Cause Analysis

The duplication appears to be caused by:

1. **Multiple Import Executions:** The same dataset was imported multiple times in rapid succession
2. **Lack of Duplicate Prevention:** No mechanisms in place to prevent duplicate records during import
3. **Possible Script Re-execution:** Import scripts may have been run multiple times without clearing previous data

## Impact Assessment

### Data Quality Impact
- **Critical:** 83.84% data redundancy
- **Storage:** Approximately 6x more storage used than necessary
- **Performance:** Queries will be significantly slower due to data volume
- **Analytics:** Any aggregations or counts will be severely skewed

### Business Impact
- **Inventory Management:** Inflated item counts
- **Reporting:** Incorrect metrics and KPIs
- **Data Trust:** Reduced confidence in data accuracy

## Recommended Actions

### Immediate Actions (Priority 1)
1. **Create Backup:** Before any cleanup, create a full backup of the table
   ```sql
   SELECT * INTO data_team_active_items_backup_before_cleanup
   FROM data_team_active_items;
   ```

2. **Execute Cleanup:** Run the existing `cleanup_duplicates.sql` script
   - This will reduce records from 2,723 to 440
   - Keeps the oldest record (lowest ID) for each unique combination
   - Expected to remove 2,283 duplicate records

### Short-term Actions (Priority 2)
3. **Validate Cleanup Results:** Verify no duplicates remain and data integrity is maintained
4. **Investigate UPC Variations:** Determine why UPC codes differ between duplicate records
5. **Update Documentation:** Document the duplication issue and cleanup process

### Long-term Actions (Priority 3)
6. **Implement Duplicate Prevention:**
   - Add unique constraints on (brand_name, item, description1)
   - Implement MERGE statements instead of INSERT for future imports
   - Add duplicate checking logic to import processes

7. **Process Improvements:**
   - Implement transaction rollback mechanisms for failed imports
   - Add logging to track import operations
   - Create data validation checks before and after imports

## Expected Cleanup Results

After running the cleanup script:
- **Records Removed:** 2,283
- **Records Remaining:** 440
- **Storage Reduction:** ~84%
- **Data Integrity:** Maintained (oldest record kept for each unique item)

## Verification Queries

After cleanup, run these queries to verify results:

```sql
-- Verify no duplicates remain
SELECT COUNT(*) - COUNT(DISTINCT CONCAT(
    ISNULL(brand_name, ''), '|',
    ISNULL(item, ''), '|',
    ISNULL(description1, '')
)) as remaining_duplicates
FROM data_team_active_items;
-- Expected result: 0

-- Verify total count
SELECT COUNT(*) as total_records
FROM data_team_active_items;
-- Expected result: 440
```

## Conclusion

This investigation confirms the user's report that "the data was imported more than once per line." The systematic duplication pattern (2-9 copies of each record) indicates a process failure during import operations. Immediate cleanup is recommended to restore data integrity and prevent downstream impacts on business operations.

The existing `cleanup_duplicates.sql` script is well-designed to address this issue while preserving data integrity by keeping the oldest record for each unique item combination.