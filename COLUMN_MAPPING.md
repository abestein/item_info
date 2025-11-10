# Data Team Excel Column Mapping

## Overview
This document shows the complete mapping between Excel columns and database fields for the Data Team Active Items upload.

## Excel File Structure
- **Header Rows**: Rows 1-3 (skipped during import)
- **Data Starts**: Row 4

## Complete Column Mapping

| Excel Column | Index | Database Field | Description |
|--------------|-------|----------------|-------------|
| A | 0 | brand_name | Brand Name |
| B | 1 | item | Item# |
| C | 2 | description1 | Description1 |
| D | 3 | description2 | Description2 |
| E | 4 | description3 | Description3 |
| F | 5 | uom_units_inner_2 | Inner - 2 (UOM) |
| G | 6 | uom_pack_inner_1 | Inner - 1 (UOM) |
| H | 7 | uom_sellable | Sellable (UOM) |
| I | 8 | uom_ship_1 | Ship + 1 (UOM) |
| J | 9 | uom_ship_2 | Ship + 2 (UOM) |
| K | 10 | upc_inner_2 | Inner - 2 (UPC) |
| L | 11 | upc_inner_1 | Inner - 1 (UPC) |
| M | 12 | upc_sellable | Sellable (UPC) |
| N | 13 | upc_ship_1 | Ship + 1 (UPC) |
| O | 14 | upc_ship_2 | Ship + 2 (UPC) |
| P | 15 | ar_inner_2 | Inner - 2 (AR) |
| Q | 16 | ar_inner_1 | Inner - 1 (AR) |
| R | 17 | ar_sellable | Sellable (AR) |
| S | 18 | ar_ship_1 | Ship + 1 (AR) |
| T | 19 | ar_ship_2 | Ship + 2 (AR) |
| U-AN | 20-39 | (dimensions/weights) | Not mapped in import |
| AO | 40 | hcpc_code | HCPC Code |
| AP | 41 | product_type | Product Type |
| AQ | 42 | fei_number | FEI # |
| AR | 43 | duns_number | Duns # ✨ NEW |
| AS | 44 | dln | DLN |
| AT | 45 | device_class | Device Class |
| AU | 46 | product_code | Product Code |
| AV | 47 | fda_510_k | 510 (k) |
| AW | 48 | exp_date | EXP Date |
| AX | 49 | sn_number | SN # |
| AY | 50 | sterile | Sterile |
| AZ | 51 | sterile_method | Sterile Method |
| BA | 52 | shelf_life | Shelf Life |
| BB | 53 | prop_65 | Prop-65 |
| BC | 54 | prop_65_warning | Prop-65 Warning ✨ NEW |
| BD | 55 | rx_required | RX Required |
| BE | 56 | dehp_free | DEHP Free ✨ NEW |
| BF | 57 | latex | Latex ✨ NEW |
| BG | 58 | use_field | Use ✨ NEW |
| BH | 59 | temp_required | Temp Required |
| BI | 60 | temp_range | Temp Range ✨ NEW |
| BJ | 61 | humidity_limitation | Humidity Limitation ✨ NEW |
| BK | 62 | gtin_inner_2 | Inner - 2 (Pack) ✨ NEW |
| BL | 63 | gtin_inner_1 | Inner - 1 (Pack) ✨ NEW |
| BM | 64 | gtin_sellable | Sellable (Pack) ✨ NEW |
| BN | 65 | gtin_ship_1 | Ship + 1 (Pack) ✨ NEW |
| BO | 66 | gtin_ship_2 | Ship + 2 (Pack) ✨ NEW |
| BP | 67 | product_identification | Product Identification ✨ NEW |
| BQ | 68 | term_code | Term Code ✨ NEW |
| BR | 69 | NDC_inner_2 | Inner -2 (GTIN) |
| BS | 70 | NDC_inner_1 | Inner -1 (GTIN) |
| BT | 71 | NDC_sellable | Sellable (GTIN) |
| BU | 72 | NDC_ship_1 | Shipper +1 (GTIN) |
| BV | 73 | NDC_ship_2 | Shipper +2 (GTIN) |
| BW | 74 | hc_class | HC Class ✨ NEW |
| BX | 75 | license_number | License Number ✨ NEW |

## Validation Rules

### UPC Codes (Columns K-O)
- Must be exactly 12 digits
- Duplicates not allowed
- "N/A", "X", or empty values are treated as null

### GTIN Codes (Columns BK-BO)
- Must be at least 14 digits
- Duplicates not allowed
- "N/A", "X", or empty values are treated as null

### Item Codes (Column B)
- Required field
- Must be unique
- Cannot be empty

## Changes Made

### Database Updates
✅ Added 16 new columns to `data_team_active_items` table
✅ Added 16 new columns to `data_team_active_items_temp` table

### Code Updates
✅ Updated `routes/data_team_upload.js` - Column mapping and INSERT statements
✅ Updated `routes/data_team_comparison.js` - INSERT statements for applying changes
✅ Updated GTIN validation column indices (moved from 60-64 to 69-73)

## Notes
- N/A values are treated as NULL during import
- All text fields support Unicode characters (®, °, ₂, etc.)
- Empty rows are automatically skipped
