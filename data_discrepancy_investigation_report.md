# Data Discrepancy Investigation Report

## Executive Summary

**Issue**: The `data_team_active_items` table contains 3,121 records instead of the expected 2,723 records from the Excel sheet, representing a discrepancy of +398 records.

**Root Cause**: Duplicate records in the database due to multiple imports or data processing issues.

**Solution**: Remove duplicate records using the provided cleanup SQL script.

## Detailed Findings

### Database Analysis Results

| Metric | Count |
|--------|-------|
| **Total records in database** | 3,121 |
| **Expected records from Excel** | 2,723 |
| **Difference** | +398 records |
| **Unique combinations (brand, item, description)** | 2,633 |
| **Duplicate records identified** | 488 |
| **Records with actual brand names** | 732 |
| **Records with NULL/null brand names** | 2,389 |

### Key Insights

1. **Duplicate Records**: 488 duplicate records were found based on the combination of `brand_name`, `item`, and `description1` fields.

2. **Null Brand Names**: A significant number of records (2,389) have NULL or 'null' brand names, which may indicate incomplete data import or processing issues.

3. **Mathematics**:
   - Total records: 3,121
   - Unique combinations: 2,633
   - Duplicates: 488 (3,121 - 2,633)
   - After cleanup: 2,633 records expected
   - Remaining difference: 90 records (2,723 expected - 2,633 after cleanup)

### Sample Duplicate Records

The analysis identified 488 sets of duplicate records, including:
- Multiple glove products with identical brand_name, item, and description1
- Wound care products with duplicate entries
- Medical supplies with repeated records

Examples of duplicates found:
- Item "2512" - Blue Nitrile Examination Gloves (2 copies)
- Item "3005" - DynaWound Wound Cleanser Spray (2 copies)
- Item "1296" - XeroBurn Sterile Burn Dressings (2 copies)

## Recommended Actions

### 1. Immediate Action: Remove Duplicates

Execute the provided cleanup SQL script (`cleanup_duplicates.sql`) to remove duplicate records:

```sql
-- This will remove 488 duplicate records, keeping the oldest (lowest ID) for each unique combination
-- Final count after cleanup: 2,633 records
```

### 2. Investigate Remaining 90-Record Difference

After removing duplicates, there will still be a 90-record difference (2,633 vs 2,723 expected). This could be due to:

- **Records missing from import**: Some Excel records may not have been imported
- **Excel filtering**: The Excel sheet may have filters applied that affect the count
- **Data source differences**: The Excel and database may be from different data snapshots
- **Data validation**: Some records may have been excluded during import due to validation rules

### 3. Data Quality Improvements

- **Address NULL brand names**: Investigate why 2,389 records have NULL brand names
- **Implement duplicate prevention**: Add database constraints or import validation to prevent future duplicates
- **Data reconciliation process**: Establish a process to regularly compare Excel source with database

## Files Generated

1. **`cleanup_duplicates.sql`** - SQL script to remove duplicate records
2. **`analyze_data_discrepancy.mjs`** - Comprehensive analysis script
3. **`complete_analysis.mjs`** - Final analysis with detailed breakdown
4. **`quick_duplicate_summary.mjs`** - Quick summary of duplicate counts

## Execution Plan

1. **Backup**: Create a backup of the current table before cleanup
2. **Execute cleanup**: Run the cleanup_duplicates.sql script
3. **Verify results**: Confirm record count is reduced to 2,633
4. **Investigate remaining difference**: Compare remaining records with Excel source
5. **Document process**: Update import procedures to prevent future duplicates

## Risk Assessment

- **Low Risk**: The cleanup script uses a CTE to safely identify and remove duplicates
- **Backup Recommended**: Always create a backup before running cleanup operations
- **Data Integrity**: The script preserves the oldest record (lowest ID) for each unique combination

---

*Report generated on: September 15, 2025*
*Database: Item_DimensionsBU*
*Table: data_team_active_items*