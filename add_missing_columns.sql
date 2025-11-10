-- Add missing columns to data_team_active_items table
ALTER TABLE data_team_active_items
ADD duns_number VARCHAR(255),
    prop_65_warning VARCHAR(255),
    dehp_free VARCHAR(50),
    latex VARCHAR(50),
    use_field VARCHAR(255),
    temp_range VARCHAR(255),
    humidity_limitation VARCHAR(255),
    pack_inner_2 VARCHAR(255),
    pack_inner_1 VARCHAR(255),
    pack_sellable VARCHAR(255),
    pack_ship_1 VARCHAR(255),
    pack_ship_2 VARCHAR(255),
    product_identification VARCHAR(255),
    term_code VARCHAR(255),
    hc_class VARCHAR(255),
    license_number VARCHAR(255);

-- Add missing columns to data_team_active_items_temp table
ALTER TABLE data_team_active_items_temp
ADD duns_number VARCHAR(255),
    prop_65_warning VARCHAR(255),
    dehp_free VARCHAR(50),
    latex VARCHAR(50),
    use_field VARCHAR(255),
    temp_range VARCHAR(255),
    humidity_limitation VARCHAR(255),
    pack_inner_2 VARCHAR(255),
    pack_inner_1 VARCHAR(255),
    pack_sellable VARCHAR(255),
    pack_ship_1 VARCHAR(255),
    pack_ship_2 VARCHAR(255),
    product_identification VARCHAR(255),
    term_code VARCHAR(255),
    hc_class VARCHAR(255),
    license_number VARCHAR(255);
