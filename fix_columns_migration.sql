-- Fix Column Mapping Migration
-- This migration removes incorrect columns and adds the correct NDC columns

-- ========================================
-- STEP 1: Remove 16 incorrect columns
-- ========================================

-- Remove from data_team_active_items
ALTER TABLE data_team_active_items
DROP COLUMN duns_number,
     prop_65_warning,
     dehp_free,
     latex,
     use_field,
     temp_range,
     humidity_limitation,
     pack_inner_2,
     pack_inner_1,
     pack_sellable,
     pack_ship_1,
     pack_ship_2,
     product_identification,
     term_code,
     hc_class,
     license_number;

-- Remove from data_team_active_items_temp
ALTER TABLE data_team_active_items_temp
DROP COLUMN duns_number,
     prop_65_warning,
     dehp_free,
     latex,
     use_field,
     temp_range,
     humidity_limitation,
     pack_inner_2,
     pack_inner_1,
     pack_sellable,
     pack_ship_1,
     pack_ship_2,
     product_identification,
     term_code,
     hc_class,
     license_number;

-- ========================================
-- STEP 2: Add 5 NDC columns
-- ========================================

-- Add to data_team_active_items
ALTER TABLE data_team_active_items
ADD ndc_inner_2 VARCHAR(50),
    ndc_inner_1 VARCHAR(50),
    ndc_sellable VARCHAR(50),
    ndc_ship_1 VARCHAR(50),
    ndc_ship_2 VARCHAR(50);

-- Add to data_team_active_items_temp
ALTER TABLE data_team_active_items_temp
ADD ndc_inner_2 VARCHAR(50),
    ndc_inner_1 VARCHAR(50),
    ndc_sellable VARCHAR(50),
    ndc_ship_1 VARCHAR(50),
    ndc_ship_2 VARCHAR(50);
