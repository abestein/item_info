-- Add 11 new columns to match the updated Excel structure
-- Based on COLUMN_MAPPING.md
-- Note: GTIN and NDC columns already exist, just mapped from different Excel positions

-- Add to data_team_active_items table
ALTER TABLE data_team_active_items
ADD duns_number VARCHAR(255),              -- AR (43): Duns #
    prop_65_warning VARCHAR(255),           -- BC (54): Prop-65 Warning
    dehp_free VARCHAR(50),                  -- BE (56): DEHP Free
    latex VARCHAR(50),                      -- BF (57): Latex
    use_field VARCHAR(255),                 -- BG (58): Use
    temp_range VARCHAR(255),                -- BI (60): Temp Range
    humidity_limitation VARCHAR(255),       -- BJ (61): Humidity Limitation
    product_identification VARCHAR(255),    -- BP (67): Product Identification
    term_code VARCHAR(255),                 -- BQ (68): Term Code
    hc_class VARCHAR(255),                  -- BW (74): HC Class
    license_number VARCHAR(255);            -- BX (75): License Number

-- Add to data_team_active_items_temp table
ALTER TABLE data_team_active_items_temp
ADD duns_number VARCHAR(255),
    prop_65_warning VARCHAR(255),
    dehp_free VARCHAR(50),
    latex VARCHAR(50),
    use_field VARCHAR(255),
    temp_range VARCHAR(255),
    humidity_limitation VARCHAR(255),
    product_identification VARCHAR(255),
    term_code VARCHAR(255),
    hc_class VARCHAR(255),
    license_number VARCHAR(255);
