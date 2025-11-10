-- Script to increase field sizes in data_team_active_items table
-- This will resolve truncation errors for longer text values

USE Item_DimensionsBU;
GO

PRINT 'Starting field size modifications for data_team_active_items table...';

-- 1. Increase description fields (primary culprits for truncation)
PRINT 'Increasing description field sizes...';
ALTER TABLE data_team_active_items ALTER COLUMN description1 varchar(100);
ALTER TABLE data_team_active_items ALTER COLUMN description3 varchar(100);
-- description2 is already 100, but let's make it larger for safety
ALTER TABLE data_team_active_items ALTER COLUMN description2 varchar(150);

-- 2. Increase brand_name and item fields for longer product names
PRINT 'Increasing brand and item field sizes...';
ALTER TABLE data_team_active_items ALTER COLUMN brand_name varchar(75);
ALTER TABLE data_team_active_items ALTER COLUMN item varchar(75);

-- 3. Increase other text fields that might have long values
PRINT 'Increasing other text field sizes...';
ALTER TABLE data_team_active_items ALTER COLUMN hcpc_code varchar(75);
ALTER TABLE data_team_active_items ALTER COLUMN product_type varchar(75);
ALTER TABLE data_team_active_items ALTER COLUMN fei_number varchar(75);

-- 4. Increase regulatory and product code fields
ALTER TABLE data_team_active_items ALTER COLUMN product_code varchar(75);
ALTER TABLE data_team_active_items ALTER COLUMN fda_510_k varchar(75);
ALTER TABLE data_team_active_items ALTER COLUMN device_class varchar(75);

-- 5. UOM fields might have longer descriptions
ALTER TABLE data_team_active_items ALTER COLUMN uom_units_inner_2 varchar(75);
ALTER TABLE data_team_active_items ALTER COLUMN uom_pack_inner_1 varchar(75);
ALTER TABLE data_team_active_items ALTER COLUMN uom_sellable varchar(75);
ALTER TABLE data_team_active_items ALTER COLUMN uom_ship_1 varchar(75);
ALTER TABLE data_team_active_items ALTER COLUMN uom_ship_2 varchar(75);

PRINT 'Field size modifications completed successfully!';

-- Show the updated column information
PRINT 'Updated column sizes:';
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    CASE
        WHEN COLUMN_NAME IN ('description1', 'description3') THEN 'Increased from 50 to 100'
        WHEN COLUMN_NAME = 'description2' THEN 'Increased from 100 to 150'
        WHEN COLUMN_NAME IN ('brand_name', 'item', 'hcpc_code', 'product_type', 'fei_number', 'product_code', 'fda_510_k', 'device_class') THEN 'Increased from 50 to 75'
        WHEN COLUMN_NAME IN ('uom_units_inner_2', 'uom_pack_inner_1', 'uom_sellable', 'uom_ship_1', 'uom_ship_2') THEN 'Increased from 50 to 75'
        ELSE 'No change'
    END as Change_Made
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'data_team_active_items'
AND COLUMN_NAME IN (
    'description1', 'description2', 'description3', 'brand_name', 'item',
    'hcpc_code', 'product_type', 'fei_number', 'product_code', 'fda_510_k',
    'device_class', 'uom_units_inner_2', 'uom_pack_inner_1', 'uom_sellable',
    'uom_ship_1', 'uom_ship_2'
)
ORDER BY COLUMN_NAME;

PRINT 'Ready for improved data import!';