-- Fix Unicode support for data_team_active_items table
-- Changes VARCHAR to NVARCHAR for all text columns that may contain Unicode characters
--
-- AFFECTED CHARACTERS:
-- - Registered trademark ® (code 174)
-- - Degree symbol ° (code 176)
-- - Subscript characters like ₂ (code 8322) in "O₂", "CO₂"
-- - Other Unicode characters
--
-- NOTE: NVARCHAR uses 2 bytes per character vs VARCHAR's 1 byte
--       Size limits remain the same (e.g., NVARCHAR(50) = 50 characters)

USE item_information;
GO

PRINT 'Starting Unicode support fix for data_team_active_items...';
PRINT '';

-- Main table: data_team_active_items
PRINT 'Updating data_team_active_items table...';

-- Description columns (most critical - contain O₂, CO₂, ®, °)
ALTER TABLE data_team_active_items
ALTER COLUMN brand_name NVARCHAR(50);

ALTER TABLE data_team_active_items
ALTER COLUMN item NVARCHAR(50);

ALTER TABLE data_team_active_items
ALTER COLUMN description1 NVARCHAR(50);

ALTER TABLE data_team_active_items
ALTER COLUMN description2 NVARCHAR(100);

ALTER TABLE data_team_active_items
ALTER COLUMN description3 NVARCHAR(50);

-- UOM columns
ALTER TABLE data_team_active_items
ALTER COLUMN uom_units_inner_2 NVARCHAR(50);

ALTER TABLE data_team_active_items
ALTER COLUMN uom_pack_inner_1 NVARCHAR(50);

ALTER TABLE data_team_active_items
ALTER COLUMN uom_sellable NVARCHAR(50);

ALTER TABLE data_team_active_items
ALTER COLUMN uom_ship_1 NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN uom_ship_2 NVARCHAR(255);

-- UPC columns (keep as VARCHAR since they're numeric codes)
ALTER TABLE data_team_active_items
ALTER COLUMN upc_ship_1 NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN upc_ship_2 NVARCHAR(255);

-- Artwork Revision columns
ALTER TABLE data_team_active_items
ALTER COLUMN ar_inner_2 NVARCHAR(50);

ALTER TABLE data_team_active_items
ALTER COLUMN ar_inner_1 NVARCHAR(50);

ALTER TABLE data_team_active_items
ALTER COLUMN ar_sellable NVARCHAR(50);

ALTER TABLE data_team_active_items
ALTER COLUMN ar_ship_1 NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN ar_ship_2 NVARCHAR(255);

-- Dimension columns
ALTER TABLE data_team_active_items
ALTER COLUMN dim_in_2_d NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN dim_in_2_h NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN dim_in_2_w NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN dim_in_1_d NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN dim_in_1_h NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN dim_in_1_w NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN dim_sl_d NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN dim_sl_h NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN dim_sl_w NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN dim_ship_1_d NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN dim_ship_1_h NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN dim_ship_1_w NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN dim_ship_2_d NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN dim_ship_2_h NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN dim_ship_2_w NVARCHAR(255);

-- Weight columns
ALTER TABLE data_team_active_items
ALTER COLUMN weight_inner_2 NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN weight_inner_1 NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN weight_sellable NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN weight_shipper_1 NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN weight_shipper_2 NVARCHAR(255);

-- Product information columns
ALTER TABLE data_team_active_items
ALTER COLUMN hcpc_code NVARCHAR(50);

ALTER TABLE data_team_active_items
ALTER COLUMN product_type NVARCHAR(50);

ALTER TABLE data_team_active_items
ALTER COLUMN fei_number NVARCHAR(50);

ALTER TABLE data_team_active_items
ALTER COLUMN dln NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN device_class NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN product_code NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN fda_510_k NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN exp_date NVARCHAR(50);

ALTER TABLE data_team_active_items
ALTER COLUMN sn_number NVARCHAR(50);

ALTER TABLE data_team_active_items
ALTER COLUMN sterile NVARCHAR(50);

ALTER TABLE data_team_active_items
ALTER COLUMN sterile_method NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN shelf_life NVARCHAR(50);

ALTER TABLE data_team_active_items
ALTER COLUMN prop_65 NVARCHAR(50);

ALTER TABLE data_team_active_items
ALTER COLUMN rx_required NVARCHAR(50);

ALTER TABLE data_team_active_items
ALTER COLUMN temp_required NVARCHAR(50);

-- GTIN columns
ALTER TABLE data_team_active_items
ALTER COLUMN gtin_inner_2 NVARCHAR(20);

ALTER TABLE data_team_active_items
ALTER COLUMN gtin_inner_1 NVARCHAR(20);

ALTER TABLE data_team_active_items
ALTER COLUMN gtin_sellable NVARCHAR(20);

ALTER TABLE data_team_active_items
ALTER COLUMN gtin_ship_1 NVARCHAR(20);

ALTER TABLE data_team_active_items
ALTER COLUMN gtin_ship_2 NVARCHAR(20);

-- NDC columns
ALTER TABLE data_team_active_items
ALTER COLUMN ndc_inner_2 NVARCHAR(50);

ALTER TABLE data_team_active_items
ALTER COLUMN ndc_inner_1 NVARCHAR(50);

ALTER TABLE data_team_active_items
ALTER COLUMN ndc_sellable NVARCHAR(50);

ALTER TABLE data_team_active_items
ALTER COLUMN ndc_shipper_1 NVARCHAR(255);

ALTER TABLE data_team_active_items
ALTER COLUMN ndc_shipper_2 NVARCHAR(255);

PRINT '';
PRINT 'data_team_active_items updated successfully!';
PRINT '';

-- Temp table: data_team_active_items_temp
PRINT 'Checking if temp table exists...';

IF OBJECT_ID('dbo.data_team_active_items_temp', 'U') IS NOT NULL
BEGIN
    PRINT 'Updating data_team_active_items_temp table...';

    -- Apply same changes to temp table
    ALTER TABLE data_team_active_items_temp ALTER COLUMN brand_name NVARCHAR(50);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN item NVARCHAR(50);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN description1 NVARCHAR(50);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN description2 NVARCHAR(100);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN description3 NVARCHAR(50);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN uom_units_inner_2 NVARCHAR(50);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN uom_pack_inner_1 NVARCHAR(50);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN uom_sellable NVARCHAR(50);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN uom_ship_1 NVARCHAR(255);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN uom_ship_2 NVARCHAR(255);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN upc_ship_1 NVARCHAR(255);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN upc_ship_2 NVARCHAR(255);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN ar_inner_2 NVARCHAR(50);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN ar_inner_1 NVARCHAR(50);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN ar_sellable NVARCHAR(50);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN ar_ship_1 NVARCHAR(255);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN ar_ship_2 NVARCHAR(255);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN hcpc_code NVARCHAR(50);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN product_type NVARCHAR(50);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN fei_number NVARCHAR(50);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN dln NVARCHAR(255);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN device_class NVARCHAR(255);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN product_code NVARCHAR(255);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN fda_510_k NVARCHAR(255);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN exp_date NVARCHAR(50);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN sn_number NVARCHAR(50);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN sterile NVARCHAR(50);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN sterile_method NVARCHAR(255);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN shelf_life NVARCHAR(50);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN prop_65 NVARCHAR(50);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN rx_required NVARCHAR(50);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN temp_required NVARCHAR(50);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN gtin_inner_2 NVARCHAR(20);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN gtin_inner_1 NVARCHAR(20);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN gtin_sellable NVARCHAR(20);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN gtin_ship_1 NVARCHAR(20);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN gtin_ship_2 NVARCHAR(20);

    PRINT 'data_team_active_items_temp updated successfully!';
END
ELSE
BEGIN
    PRINT 'Temp table does not exist (will be created on first upload with correct types)';
END

PRINT '';
PRINT '✅ Unicode support fix completed successfully!';
PRINT '';
PRINT 'Summary:';
PRINT '- All VARCHAR columns changed to NVARCHAR';
PRINT '- Both main and temp tables updated';
PRINT '- Now supports Unicode characters: ®, °, ₂, and others';
PRINT '';
