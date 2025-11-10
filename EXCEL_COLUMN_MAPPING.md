# Excel Column Mapping for Data Team Upload

This document describes how Excel columns are mapped to database fields when uploading to `data_team_active_items_temp`.

## Overview

The Excel file has a **3-row header structure**:
- **Row 1**: Category headers (UOM, Artwork Rev#, Dimensions, etc.)
- **Row 2**: Sub-category headers (Units per Pack, UPC, Pack Type, etc.)
- **Row 3**: Field names (Inner - 2, Inner - 1, Sellable, etc.)
- **Row 4+**: Data rows

The upload system uses **column index mapping** (position-based) instead of header name matching, which avoids issues with the multi-row header structure.

## Column Mapping (0-indexed)

### Basic Information (Columns A-E)
| Excel Column | Index | Database Field | Description |
|--------------|-------|----------------|-------------|
| A | 0 | brand_name | Brand Name |
| B | 1 | item | Item# |
| C | 2 | description1 | Description1 |
| D | 3 | description2 | Description2 |
| E | 4 | description3 | Description3 |

### UOM Fields (Columns F-J)
| Excel Column | Index | Database Field | Description |
|--------------|-------|----------------|-------------|
| F | 5 | uom_units_inner_2 | UOM Inner - 2 |
| G | 6 | uom_pack_inner_1 | UOM Inner - 1 |
| H | 7 | uom_sellable | UOM Sellable |
| I | 8 | uom_ship_1 | UOM Ship + 1 |
| J | 9 | uom_ship_2 | UOM Ship + 2 |

### UPC Fields (Columns K-O)
| Excel Column | Index | Database Field | Description |
|--------------|-------|----------------|-------------|
| K | 10 | upc_inner_2 | UPC Inner - 2 |
| L | 11 | upc_inner_1 | UPC Inner - 1 |
| M | 12 | upc_sellable | UPC Sellable |
| N | 13 | upc_ship_1 | UPC Ship + 1 |
| O | 14 | upc_ship_2 | UPC Ship + 2 |

### Artwork Revision Fields (Columns P-T)
| Excel Column | Index | Database Field | Description |
|--------------|-------|----------------|-------------|
| P | 15 | ar_inner_2 | AR Inner - 2 |
| Q | 16 | ar_inner_1 | AR Inner - 1 |
| R | 17 | ar_sellable | AR Sellable |
| S | 18 | ar_ship_1 | AR Ship + 1 |
| T | 19 | ar_ship_2 | AR Ship + 2 |

### Dimensions & Weights (Columns U-AN)
**Columns 20-39 are NOT mapped** to the database (dimensions and weight data)

### Product Information (Columns AO-BC)
| Excel Column | Index | Database Field | Description |
|--------------|-------|----------------|-------------|
| AO | 40 | hcpc_code | HCPC Code |
| AP | 41 | product_type | Product Type |
| AQ | 42 | fei_number | FEI # |
| AR | 43 | dln | DLN |
| AS | 44 | device_class | Device Class |
| AT | 45 | product_code | Product Code |
| AU | 46 | fda_510_k | 510 (k) |
| AV | 47 | exp_date | EXP Date |
| AW | 48 | sn_number | SN # |
| AX | 49 | sterile | Sterile |
| AY | 50 | sterile_method | Sterile Method |
| AZ | 51 | shelf_life | Shelf Life |
| BA | 52 | prop_65 | Prop-65 |
| BB | 53 | rx_required | RX Required |
| BC | 54 | temp_required | Temp Required |

### Additional Pack Data (Columns BD-BH)
**Columns 55-59 are NOT mapped** to the database

### GTIN Fields (Columns BI-BM)
| Excel Column | Index | Database Field | Description |
|--------------|-------|----------------|-------------|
| BI | 60 | gtin_inner_2 | GTIN Inner -2 |
| BJ | 61 | gtin_inner_1 | GTIN Inner -1 |
| BK | 62 | gtin_sellable | GTIN Sellable |
| BL | 63 | gtin_ship_1 | GTIN Shipper +1 |
| BM | 64 | gtin_ship_2 | GTIN Shipper +2 |

## Data Processing Rules

### Validation
1. **Item#** (Column B): Must be unique, no duplicates allowed
2. **Brand Name** (Column A): Required field
3. **UPC/GTIN Fields**: Must be exactly 12 digits, or 'X', 'N/A', or empty

### Value Normalization
- Empty cells, 'N/A', and 'X' values are converted to `NULL` in the database
- All string values are trimmed of whitespace
- UPC/GTIN values must be numeric or special values (X, N/A)

## Implementation

The column mapping is implemented in `routes/data_team_upload.js`:
- `COLUMN_MAP`: Object defining all column index to field name mappings
- `UPC_COLUMNS`: Array of UPC column indices (10-14)
- `GTIN_COLUMNS`: Array of GTIN column indices (60-64)
- `getValueFromRow()`: Helper function to safely extract and normalize values

## Updating the Mapping

If Excel column structure changes:
1. Update `COLUMN_MAP` in `routes/data_team_upload.js`
2. Update validation column indices if needed (`UPC_COLUMNS`, `GTIN_COLUMNS`)
3. Update this documentation file
4. Test with sample Excel file before production use
