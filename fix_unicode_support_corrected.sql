-- Fix Unicode support for data_team_active_items table
-- Changes VARCHAR to NVARCHAR for all text columns that may contain Unicode characters
-- Uses CORRECT sizes based on actual database schema

PRINT 'Starting Unicode support fix for data_team_active_items...';
PRINT '';

-- Main table: data_team_active_items
PRINT 'Updating data_team_active_items table...';

-- Description columns (most critical - contain O₂, CO₂, ®, °)
-- brand_name and item are already NVARCHAR, skip them

ALTER TABLE data_team_active_items
ALTER COLUMN description1 NVARCHAR(100);  -- Was VARCHAR(100)

ALTER TABLE data_team_active_items
ALTER COLUMN description2 NVARCHAR(150);  -- Was VARCHAR(150)

ALTER TABLE data_team_active_items
ALTER COLUMN description3 NVARCHAR(100);  -- Was VARCHAR(100)

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

-- UPC columns
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

PRINT '';
PRINT 'data_team_active_items updated successfully!';
PRINT '';

-- Temp table: data_team_active_items_temp
PRINT 'Checking if temp table exists...';

IF OBJECT_ID('dbo.data_team_active_items_temp', 'U') IS NOT NULL
BEGIN
    PRINT 'Updating data_team_active_items_temp table...';

    -- Apply same changes to temp table with correct sizes
    ALTER TABLE data_team_active_items_temp ALTER COLUMN description1 NVARCHAR(100);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN description2 NVARCHAR(150);
    ALTER TABLE data_team_active_items_temp ALTER COLUMN description3 NVARCHAR(100);
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
PRINT '- Column sizes preserved (description1: 100, description2: 150, description3: 100)';
PRINT '- Both main and temp tables updated';
PRINT '- Now supports Unicode characters: ®, °, ₂, and others';
PRINT '';
