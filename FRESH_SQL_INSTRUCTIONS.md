# FRESH SQL GENERATION INSTRUCTIONS

## Problem
The current SQL INSERT statements are misaligned with the Excel data, causing 27 records to fail import.

## Solution
Generate fresh SQL INSERT statements directly from the current Excel file to ensure perfect alignment.

## Files Created
1. **direct_sql_generator.mjs** - Contains the SQL generation logic
2. **fresh_sql_template.sql** - Shows the exact format needed
3. **excel_mcp_commands.md** - Commands for Excel MCP integration

## Steps to Generate Fresh SQL

### Step 1: Use Excel MCP Agent
Use the Excel MCP agent to read the current Excel file:
- File: DATA_TEAM_ACTIVE_SHEET_7-17-2025.xlsx
- Sheet: Sheet1
- Header Row: 3
- Data Start Row: 4
- Expected columns: 65

### Step 2: Process Data
For each row of Excel data, apply the cleaning pipeline:
1. Remove control characters (\n, \r, \t)
2. Normalize quote escaping
3. Clean dimension patterns
4. Handle NULL values
5. Escape single quotes for SQL

### Step 3: Generate SQL
Create INSERT statements with exact column mapping:
1. Excel Column "Brand Name" -> SQL Column "brand_name" (VARCHAR(50))
2. Excel Column "Item#" -> SQL Column "item" (VARCHAR(50))
3. Excel Column "Description1" -> SQL Column "description1" (VARCHAR(50))
4. Excel Column "Description2" -> SQL Column "description2" (VARCHAR(100))
5. Excel Column "Description3" -> SQL Column "description3" (VARCHAR(50))
6. Excel Column "Inner - 2" -> SQL Column "uom_units_inner_2" (VARCHAR(50))
7. Excel Column "Inner - 1" -> SQL Column "uom_pack_inner_1" (VARCHAR(50))
8. Excel Column "Sellable" -> SQL Column "uom_sellable" (VARCHAR(50))
9. Excel Column "Ship + 1" -> SQL Column "uom_ship_1" (VARCHAR(255))
10. Excel Column "Ship + 2" -> SQL Column "uom_ship_2" (VARCHAR(255))
11. Excel Column "Inner - 2" -> SQL Column "inner_2" (BIGINT)
12. Excel Column "Inner - 1" -> SQL Column "inner_1" (BIGINT)
13. Excel Column "Sellable" -> SQL Column "sellable" (BIGINT)
14. Excel Column "Ship + 1" -> SQL Column "ship_1" (VARCHAR(255))
15. Excel Column "Ship + 2" -> SQL Column "ship_2" (VARCHAR(255))
16. Excel Column "Inner - 2" -> SQL Column "artwork_inner_2" (VARCHAR(50))
17. Excel Column "Inner - 1" -> SQL Column "artwork_inner_1" (VARCHAR(50))
18. Excel Column "Sellable" -> SQL Column "uom_sellable_2" (VARCHAR(50))
19. Excel Column "Ship + 1" -> SQL Column "uom_ship_1_2" (VARCHAR(255))
20. Excel Column "Ship + 2" -> SQL Column "uom_ship_2_2" (VARCHAR(255))
21. Excel Column "D" -> SQL Column "dim_inner2_d" (VARCHAR(255))
22. Excel Column "H" -> SQL Column "dim_inner2_h" (VARCHAR(255))
23. Excel Column "W" -> SQL Column "dim_inner2_w" (VARCHAR(255))
24. Excel Column "D" -> SQL Column "dim_inner1_d" (VARCHAR(255))
25. Excel Column "H" -> SQL Column "dim_inner1_h" (VARCHAR(255))
26. Excel Column "W" -> SQL Column "dim_inner1_w" (VARCHAR(255))
27. Excel Column "D" -> SQL Column "uom_d" (VARCHAR(255))
28. Excel Column "H" -> SQL Column "uom_h" (VARCHAR(255))
29. Excel Column "W" -> SQL Column "uom_w" (VARCHAR(255))
30. Excel Column "D" -> SQL Column "dim_ship1_d" (VARCHAR(255))
31. Excel Column "H" -> SQL Column "dim_ship1_h" (VARCHAR(255))
32. Excel Column "W" -> SQL Column "dim_ship1_w" (VARCHAR(255))
33. Excel Column "D" -> SQL Column "dim_ship2_d" (VARCHAR(255))
34. Excel Column "H" -> SQL Column "dim_ship2_h" (VARCHAR(255))
35. Excel Column "W" -> SQL Column "dim_ship2_w" (VARCHAR(255))
36. Excel Column "Inner -2" -> SQL Column "weight_inner_2" (VARCHAR(255))
37. Excel Column "Inner -1" -> SQL Column "weight_inner_1" (VARCHAR(255))
38. Excel Column "Sellable" -> SQL Column "weight_sellable" (VARCHAR(255))
39. Excel Column "Shipper +1" -> SQL Column "weight_shipper_1" (VARCHAR(255))
40. Excel Column "Shipper +2" -> SQL Column "weight_shipper_2" (VARCHAR(255))
41. Excel Column "HCPC Code" -> SQL Column "hcpc_code" (VARCHAR(50))
42. Excel Column "Product Type" -> SQL Column "reg_product_type" (VARCHAR(50))
43. Excel Column "FEI #" -> SQL Column "reg_fei" (INT)
44. Excel Column "DLN" -> SQL Column "reg_dln" (VARCHAR(255))
45. Excel Column "Device Class" -> SQL Column "reg_device_class" (VARCHAR(255))
46. Excel Column "Product Code" -> SQL Column "reg_product_code" (VARCHAR(255))
47. Excel Column "510 (k)" -> SQL Column "reg_510_k" (VARCHAR(255))
48. Excel Column "EXP Date" -> SQL Column "reg_exp_date" (VARCHAR(50))
49. Excel Column "SN #" -> SQL Column "reg_sn" (VARCHAR(50))
50. Excel Column "Sterile" -> SQL Column "reg_sterile" (VARCHAR(50))
51. Excel Column "Sterile Method" -> SQL Column "reg_sterile_method" (VARCHAR(255))
52. Excel Column "Shelf Life" -> SQL Column "shelf_life" (VARCHAR(50))
53. Excel Column "Prop-65" -> SQL Column "prop_65" (VARCHAR(50))
54. Excel Column "RX Required" -> SQL Column "rx_required" (VARCHAR(50))
55. Excel Column "Temp Required" -> SQL Column "temp_required" (VARCHAR(50))
56. Excel Column "Inner - 2" -> SQL Column "gtin_inner_2" (VARCHAR(20))
57. Excel Column "Inner - 1" -> SQL Column "gtin_inner_1" (VARCHAR(20))
58. Excel Column "Sellable" -> SQL Column "gtin_sellable" (VARCHAR(20))
59. Excel Column "Ship + 1" -> SQL Column "gtin_ship_1" (VARCHAR(20))
60. Excel Column "Ship + 2" -> SQL Column "gtin_ship_2" (VARCHAR(20))
61. Excel Column "Inner -2" -> SQL Column "ndc_inner_2" (VARCHAR(50))
62. Excel Column "Inner -1" -> SQL Column "ndc_inner_1" (VARCHAR(50))
63. Excel Column "Sellable" -> SQL Column "ndc_sellable" (VARCHAR(50))
64. Excel Column "Shipper +1" -> SQL Column "ndc_shipper_1" (VARCHAR(255))
65. Excel Column "Shipper +2" -> SQL Column "ndc_shipper_2" (VARCHAR(255))

### Step 4: Validation
The generated SQL should:
- Have exactly 65 values per INSERT
- Match the Excel row count exactly
- Pass all SQL syntax validation
- Have no embedded control characters

## Expected Outcome
- 100% success rate for all records
- Perfect alignment between Excel data and SQL statements
- Resolution of all 27 failing records

## Files to Generate
- **data_import_statements_FRESH.sql** - The final production-ready SQL file
