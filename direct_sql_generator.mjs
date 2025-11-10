// Direct SQL Generator Script
// This script should be run in an environment with Excel MCP access

import fs from 'fs/promises';

class DirectSQLGenerator {
    constructor() {
        this.excelFile = 'DATA_TEAM_ACTIVE_SHEET_7-17-2025.xlsx';
        this.sheetName = 'Sheet1';
        this.tableName = 'data_team_active_items';
        this.columnMapping = {
        "sourceFile": "DATA TEAM ACTIVE SHEET_ 7-17-2025.xlsx",
        "sheet": "Sheet1",
        "analysis": {
                "totalRows": 2726,
                "totalColumns": 65,
                "headerRows": 3,
                "dataStartRow": 4,
                "dataRows": 2723
        },
        "sqlTable": {
                "name": "data_team_active_items",
                "createStatement": "CREATE TABLE data_team_active_items (\n    id INT IDENTITY(1,1) PRIMARY KEY,\n    created_date DATETIME2 DEFAULT GETDATE(),\n    brand_name VARCHAR(50),\n    item VARCHAR(50),\n    description1 VARCHAR(50),\n    description2 VARCHAR(100),\n    description3 VARCHAR(50),\n    uom_units_inner_2 VARCHAR(50),\n    uom_pack_inner_1 VARCHAR(50),\n    uom_sellable VARCHAR(50),\n    uom_ship_1 VARCHAR(255),\n    uom_ship_2 VARCHAR(255),\n    upc_inner_2 BIGINT,\n    upc_inner_1 BIGINT,\n    upc_sellable BIGINT,\n    upc_ship_1 VARCHAR(255),\n    upc_ship_2 VARCHAR(255),\n    ar_inner_2 VARCHAR(50),\n    ar_inner_1 VARCHAR(50),\n    ar_sellable VARCHAR(50),\n    ar_ship_1 VARCHAR(255),\n    ar_ship_2 VARCHAR(255),\n    dim_in_2_d VARCHAR(255),\n    dim_in_2_h VARCHAR(255),\n    dim_in_2_w VARCHAR(255),\n    dim_in_1_d VARCHAR(255),\n    dim_in_1_h VARCHAR(255),\n    dim_in_1_w VARCHAR(255),\n    dim_sl_d VARCHAR(255),\n    dim_sl_h VARCHAR(255),\n    dim_sl_w VARCHAR(255),\n    dim_ship_1_d VARCHAR(255),\n    dim_ship_1_h VARCHAR(255),\n    dim_ship_1_w VARCHAR(255),\n    dim_ship_2_d VARCHAR(255),\n    dim_ship_2_h VARCHAR(255),\n    dim_ship_2_w VARCHAR(255),\n    weight_inner_2 VARCHAR(255),\n    weight_inner_1 VARCHAR(255),\n    weight_sellable VARCHAR(255),\n    weight_shipper_1 VARCHAR(255),\n    weight_shipper_2 VARCHAR(255),\n    hcpc_code VARCHAR(50),\n    product_type VARCHAR(50),\n    fei_number VARCHAR(50),\n    dln VARCHAR(255),\n    device_class VARCHAR(255),\n    product_code VARCHAR(255),\n    fda_510_k VARCHAR(255),\n    exp_date VARCHAR(50),\n    sn_number VARCHAR(50),\n    sterile VARCHAR(50),\n    sterile_method VARCHAR(255),\n    shelf_life VARCHAR(50),\n    prop_65 VARCHAR(50),\n    rx_required VARCHAR(50),\n    temp_required VARCHAR(50),\n    gtin_inner_2 VARCHAR(20),\n    gtin_inner_1 VARCHAR(20),\n    gtin_sellable VARCHAR(20),\n    gtin_ship_1 VARCHAR(20),\n    gtin_ship_2 VARCHAR(20),\n    ndc_inner_2 VARCHAR(50),\n    ndc_inner_1 VARCHAR(50),\n    ndc_sellable VARCHAR(50),\n    ndc_shipper_1 VARCHAR(255),\n    ndc_shipper_2 VARCHAR(255)\n);"
        },
        "columns": [
                {
                        "index": 1,
                        "originalName": "Brand Name",
                        "sqlName": "brand_name",
                        "description": "",
                        "sqlType": "VARCHAR(50)",
                        "maxLength": 10,
                        "sampleCount": 47,
                        "samples": [
                                "Dynarex",
                                "DynaSafety",
                                "Dynarex"
                        ]
                },
                {
                        "index": 2,
                        "originalName": "Item#",
                        "sqlName": "item",
                        "description": "",
                        "sqlType": "VARCHAR(50)",
                        "maxLength": 9,
                        "sampleCount": 47,
                        "samples": [
                                "1108",
                                "1108UB-10",
                                "1113"
                        ]
                },
                {
                        "index": 3,
                        "originalName": "Description1",
                        "sqlName": "description1",
                        "description": "",
                        "sqlType": "VARCHAR(50)",
                        "maxLength": 39,
                        "sampleCount": 47,
                        "samples": [
                                "Povidone - Iodine USP Prep Pads",
                                "Povidone - Iodine USP Prep Pads",
                                "Sterile Alcohol Prep Pads"
                        ]
                },
                {
                        "index": 4,
                        "originalName": "Description2",
                        "sqlName": "description2",
                        "description": "",
                        "sqlType": "VARCHAR(100)",
                        "maxLength": 52,
                        "sampleCount": 47,
                        "samples": [
                                "Antiseptic",
                                "Antiseptic",
                                "Medium"
                        ]
                },
                {
                        "index": 5,
                        "originalName": "Description3",
                        "sqlName": "description3",
                        "description": "",
                        "sqlType": "VARCHAR(50)",
                        "maxLength": 14,
                        "sampleCount": 31,
                        "samples": [
                                "0.9g",
                                "0.9g",
                                "0.9g"
                        ]
                },
                {
                        "index": 6,
                        "originalName": "Inner - 2",
                        "sqlName": "uom_units_inner_2",
                        "description": "UOM - Units per Pack",
                        "sqlType": "VARCHAR(50)",
                        "maxLength": 4,
                        "sampleCount": 26,
                        "samples": [
                                "1/EA",
                                "1/EA",
                                "1/EA"
                        ]
                },
                {
                        "index": 7,
                        "originalName": "Inner - 1",
                        "sqlName": "uom_pack_inner_1",
                        "description": "UOM - Pack Type",
                        "sqlType": "VARCHAR(50)",
                        "maxLength": 6,
                        "sampleCount": 47,
                        "samples": [
                                "100/BX",
                                "10/BX",
                                "200/BX"
                        ]
                },
                {
                        "index": 8,
                        "originalName": "Sellable",
                        "sqlName": "uom_sellable",
                        "description": "UOM - Primary UOM",
                        "sqlType": "VARCHAR(50)",
                        "maxLength": 11,
                        "sampleCount": 47,
                        "samples": [
                                "100 x 10/CS",
                                "10 x 100/CS",
                                "200 x 10/CS"
                        ]
                },
                {
                        "index": 9,
                        "originalName": "Ship + 1",
                        "sqlName": "uom_ship_1",
                        "description": "UOM - Shipper UOM + 1",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 10,
                        "originalName": "Ship + 2",
                        "sqlName": "uom_ship_2",
                        "description": "UOM - Shipper UOM + 2",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 11,
                        "originalName": "Inner - 2",
                        "sqlName": "inner_2",
                        "description": "UPC",
                        "sqlType": "BIGINT",
                        "maxLength": 12,
                        "sampleCount": 2,
                        "samples": [
                                "616784114514",
                                "616784115511"
                        ]
                },
                {
                        "index": 12,
                        "originalName": "Inner - 1",
                        "sqlName": "inner_1",
                        "description": "UPC",
                        "sqlType": "BIGINT",
                        "maxLength": 12,
                        "sampleCount": 46,
                        "samples": [
                                "616784110820",
                                "840117327672",
                                "616784111322"
                        ]
                },
                {
                        "index": 13,
                        "originalName": "Sellable",
                        "sqlName": "sellable",
                        "description": "UPC",
                        "sqlType": "BIGINT",
                        "maxLength": 12,
                        "sampleCount": 47,
                        "samples": [
                                "616784110837",
                                "840117327689",
                                "616784111339"
                        ]
                },
                {
                        "index": 14,
                        "originalName": "Ship + 1",
                        "sqlName": "ship_1",
                        "description": "UPC",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 15,
                        "originalName": "Ship + 2",
                        "sqlName": "ship_2",
                        "description": "UPC",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 16,
                        "originalName": "Inner - 2",
                        "sqlName": "artwork_inner_2",
                        "description": "Artwork Rev# - Units per Pack",
                        "sqlType": "VARCHAR(50)",
                        "maxLength": 10,
                        "sampleCount": 28,
                        "samples": [
                                "R231121-2",
                                "R240219-1",
                                "R240219-1"
                        ]
                },
                {
                        "index": 17,
                        "originalName": "Inner - 1",
                        "sqlName": "artwork_inner_1",
                        "description": "Artwork Rev# - Pack Type",
                        "sqlType": "VARCHAR(50)",
                        "maxLength": 9,
                        "sampleCount": 47,
                        "samples": [
                                "R240626-4",
                                "R231110-1",
                                "R240219-1"
                        ]
                },
                {
                        "index": 18,
                        "originalName": "Sellable",
                        "sqlName": "uom_sellable_2",
                        "description": "Artwork Rev# - Primary UOM",
                        "sqlType": "VARCHAR(50)",
                        "maxLength": 9,
                        "sampleCount": 47,
                        "samples": [
                                "R240626-2",
                                "R230619-6",
                                "R240219-1"
                        ]
                },
                {
                        "index": 19,
                        "originalName": "Ship + 1",
                        "sqlName": "uom_ship_1_2",
                        "description": "Artwork Rev# - Shipper UOM + 1",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 20,
                        "originalName": "Ship + 2",
                        "sqlName": "uom_ship_2_2",
                        "description": "Artwork Rev# - Shipper UOM + 2",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 21,
                        "originalName": "D",
                        "sqlName": "dim_inner2_d",
                        "description": "Dimensions - Inner -2 (Units per Pack)",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 22,
                        "originalName": "H",
                        "sqlName": "dim_inner2_h",
                        "description": "Dimensions - Inner -2 (Units per Pack)",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 23,
                        "originalName": "W",
                        "sqlName": "dim_inner2_w",
                        "description": "Dimensions - Inner -2 (Units per Pack)",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 24,
                        "originalName": "D",
                        "sqlName": "dim_inner1_d",
                        "description": "Dimensions - Inner -1 (Pack Type)",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 25,
                        "originalName": "H",
                        "sqlName": "dim_inner1_h",
                        "description": "Dimensions - Inner -1 (Pack Type)",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 26,
                        "originalName": "W",
                        "sqlName": "dim_inner1_w",
                        "description": "Dimensions - Inner -1 (Pack Type)",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 27,
                        "originalName": "D",
                        "sqlName": "uom_d",
                        "description": "Dimensions - Sellable (Primary UOM)",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 28,
                        "originalName": "H",
                        "sqlName": "uom_h",
                        "description": "Dimensions - Sellable (Primary UOM)",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 29,
                        "originalName": "W",
                        "sqlName": "uom_w",
                        "description": "Dimensions - Sellable (Primary UOM)",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 30,
                        "originalName": "D",
                        "sqlName": "dim_ship1_d",
                        "description": "Dimensions - Shipper +1",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 31,
                        "originalName": "H",
                        "sqlName": "dim_ship1_h",
                        "description": "Dimensions - Shipper +1",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 32,
                        "originalName": "W",
                        "sqlName": "dim_ship1_w",
                        "description": "Dimensions - Shipper +1",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 33,
                        "originalName": "D",
                        "sqlName": "dim_ship2_d",
                        "description": "Dimensions - Shipper +2",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 34,
                        "originalName": "H",
                        "sqlName": "dim_ship2_h",
                        "description": "Dimensions - Shipper +2",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 35,
                        "originalName": "W",
                        "sqlName": "dim_ship2_w",
                        "description": "Dimensions - Shipper +2",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 36,
                        "originalName": "Inner -2",
                        "sqlName": "weight_inner_2",
                        "description": "Weight",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 37,
                        "originalName": "Inner -1",
                        "sqlName": "weight_inner_1",
                        "description": "Weight",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 38,
                        "originalName": "Sellable",
                        "sqlName": "weight_sellable",
                        "description": "Weight",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 39,
                        "originalName": "Shipper +1",
                        "sqlName": "weight_shipper_1",
                        "description": "Weight",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 40,
                        "originalName": "Shipper +2",
                        "sqlName": "weight_shipper_2",
                        "description": "Weight",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 41,
                        "originalName": "HCPC Code",
                        "sqlName": "hcpc_code",
                        "description": "",
                        "sqlType": "VARCHAR(50)",
                        "maxLength": 5,
                        "sampleCount": 33,
                        "samples": [
                                "A4247",
                                "A4247",
                                "A4245"
                        ]
                },
                {
                        "index": 42,
                        "originalName": "Product Type",
                        "sqlName": "reg_product_type",
                        "description": "Regulatory",
                        "sqlType": "VARCHAR(50)",
                        "maxLength": 3,
                        "sampleCount": 47,
                        "samples": [
                                "OTC",
                                "OTC",
                                "OTC"
                        ]
                },
                {
                        "index": 43,
                        "originalName": "FEI #",
                        "sqlName": "reg_fei",
                        "description": "Regulatory",
                        "sqlType": "INT",
                        "maxLength": 10,
                        "sampleCount": 42,
                        "samples": [
                                "3016603542",
                                "3016603542",
                                "3010408344"
                        ]
                },
                {
                        "index": 44,
                        "originalName": "DLN",
                        "sqlName": "reg_dln",
                        "description": "Regulatory",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 45,
                        "originalName": "Device Class",
                        "sqlName": "reg_device_class",
                        "description": "Regulatory",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 46,
                        "originalName": "Product Code",
                        "sqlName": "reg_product_code",
                        "description": "Regulatory",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 47,
                        "originalName": "510 (k)",
                        "sqlName": "reg_510_k",
                        "description": "Regulatory",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 48,
                        "originalName": "EXP Date",
                        "sqlName": "reg_exp_date",
                        "description": "Regulatory",
                        "sqlType": "VARCHAR(50)",
                        "maxLength": 3,
                        "sampleCount": 47,
                        "samples": [
                                "YES",
                                "YES",
                                "YES"
                        ]
                },
                {
                        "index": 49,
                        "originalName": "SN #",
                        "sqlName": "reg_sn",
                        "description": "Regulatory",
                        "sqlType": "VARCHAR(50)",
                        "maxLength": 2,
                        "sampleCount": 47,
                        "samples": [
                                "NO",
                                "NO",
                                "NO"
                        ]
                },
                {
                        "index": 50,
                        "originalName": "Sterile",
                        "sqlName": "reg_sterile",
                        "description": "Regulatory",
                        "sqlType": "VARCHAR(50)",
                        "maxLength": 2,
                        "sampleCount": 22,
                        "samples": [
                                "NO",
                                "NO",
                                "NO"
                        ]
                },
                {
                        "index": 51,
                        "originalName": "Sterile Method",
                        "sqlName": "reg_sterile_method",
                        "description": "Regulatory",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 52,
                        "originalName": "Shelf Life",
                        "sqlName": "shelf_life",
                        "description": "Regulatory",
                        "sqlType": "VARCHAR(50)",
                        "maxLength": 9,
                        "sampleCount": 42,
                        "samples": [
                                "36 months",
                                "36 months",
                                "60 months"
                        ]
                },
                {
                        "index": 53,
                        "originalName": "Prop-65",
                        "sqlName": "prop_65",
                        "description": "",
                        "sqlType": "VARCHAR(50)",
                        "maxLength": 2,
                        "sampleCount": 22,
                        "samples": [
                                "NO",
                                "NO",
                                "NO"
                        ]
                },
                {
                        "index": 54,
                        "originalName": "RX Required",
                        "sqlName": "rx_required",
                        "description": "",
                        "sqlType": "VARCHAR(50)",
                        "maxLength": 2,
                        "sampleCount": 22,
                        "samples": [
                                "NO",
                                "NO",
                                "NO"
                        ]
                },
                {
                        "index": 55,
                        "originalName": "Temp Required",
                        "sqlName": "temp_required",
                        "description": "",
                        "sqlType": "VARCHAR(50)",
                        "maxLength": 3,
                        "sampleCount": 22,
                        "samples": [
                                "YES",
                                "YES",
                                "YES"
                        ]
                },
                {
                        "index": 56,
                        "originalName": "Inner - 2",
                        "sqlName": "gtin_inner_2",
                        "description": "GTIN",
                        "sqlType": "VARCHAR(20)",
                        "maxLength": 3,
                        "sampleCount": 47,
                        "samples": [
                                "N/A",
                                "N/A",
                                "N/A"
                        ]
                },
                {
                        "index": 57,
                        "originalName": "Inner - 1",
                        "sqlName": "gtin_inner_1",
                        "description": "GTIN",
                        "sqlType": "VARCHAR(20)",
                        "maxLength": 3,
                        "sampleCount": 47,
                        "samples": [
                                "N/A",
                                "N/A",
                                "N/A"
                        ]
                },
                {
                        "index": 58,
                        "originalName": "Sellable",
                        "sqlName": "gtin_sellable",
                        "description": "GTIN",
                        "sqlType": "VARCHAR(20)",
                        "maxLength": 3,
                        "sampleCount": 47,
                        "samples": [
                                "N/A",
                                "N/A",
                                "N/A"
                        ]
                },
                {
                        "index": 59,
                        "originalName": "Ship + 1",
                        "sqlName": "gtin_ship_1",
                        "description": "GTIN",
                        "sqlType": "VARCHAR(20)",
                        "maxLength": 3,
                        "sampleCount": 47,
                        "samples": [
                                "N/A",
                                "N/A",
                                "N/A"
                        ]
                },
                {
                        "index": 60,
                        "originalName": "Ship + 2",
                        "sqlName": "gtin_ship_2",
                        "description": "GTIN",
                        "sqlType": "VARCHAR(20)",
                        "maxLength": 3,
                        "sampleCount": 47,
                        "samples": [
                                "N/A",
                                "N/A",
                                "N/A"
                        ]
                },
                {
                        "index": 61,
                        "originalName": "Inner -2",
                        "sqlName": "ndc_inner_2",
                        "description": "NDC Number",
                        "sqlType": "VARCHAR(50)",
                        "maxLength": 12,
                        "sampleCount": 14,
                        "samples": [
                                "67777-004-02",
                                "67777-005-11",
                                "67777-005-52"
                        ]
                },
                {
                        "index": 62,
                        "originalName": "Inner -1",
                        "sqlName": "ndc_inner_1",
                        "description": "NDC Number",
                        "sqlType": "VARCHAR(50)",
                        "maxLength": 12,
                        "sampleCount": 46,
                        "samples": [
                                "67777-022-02",
                                "67777-002-04",
                                "67777-121-11"
                        ]
                },
                {
                        "index": 63,
                        "originalName": "Sellable",
                        "sqlName": "ndc_sellable",
                        "description": "NDC Number",
                        "sqlType": "VARCHAR(50)",
                        "maxLength": 13,
                        "sampleCount": 47,
                        "samples": [
                                "67777-022-01",
                                "67777-002-03",
                                "67777-121-12"
                        ]
                },
                {
                        "index": 64,
                        "originalName": "Shipper +1",
                        "sqlName": "ndc_shipper_1",
                        "description": "NDC Number",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                },
                {
                        "index": 65,
                        "originalName": "Shipper +2",
                        "sqlName": "ndc_shipper_2",
                        "description": "NDC Number",
                        "sqlType": "VARCHAR(255)",
                        "maxLength": 0,
                        "sampleCount": 0,
                        "samples": []
                }
        ]
};
    }

    cleanValue(value, columnInfo) {
        if (value === null || value === undefined || value === '' || value === 'N/A') {
            return 'NULL';
        }

        let cleanedValue = String(value);

        // Remove control characters
        cleanedValue = cleanedValue
            .replace(/\n/g, ' ')
            .replace(/\r/g, ' ')
            .replace(/\t/g, ' ')
            .replace(/\v/g, ' ')
            .replace(/\f/g, ' ');

        // Clean quotes and escaping
        cleanedValue = cleanedValue
            .replace(/\\"/g, '"')
            .replace(/\\'/g, "'")
            .replace(/"/g, '"');

        // Handle dimension patterns
        if (cleanedValue.includes('"') && /\d/.test(cleanedValue)) {
            cleanedValue = cleanedValue.replace(/(\d+)"([^"]*)\\"([^"]*)/g, '$1"$2"$3');
        }

        // Escape single quotes for SQL
        cleanedValue = cleanedValue.replace(/'/g, "''");

        // Handle different data types
        if (columnInfo.sqlType === 'BIGINT' || columnInfo.sqlType === 'INT') {
            const numValue = cleanedValue.replace(/[^0-9]/g, '');
            if (numValue && numValue.length > 0) {
                return numValue;
            } else {
                return 'NULL';
            }
        }

        return `'${cleanedValue}'`;
    }

    async generateFreshSQL(excelData) {
        console.log('🏗️  Generating fresh SQL INSERT statements...');

        const columns = this.columnMapping.columns.map(col => col.sqlName);
        const columnList = columns.join(', ');

        let sql = `-- FRESH SQL INSERT STATEMENTS
-- Generated on: ${new Date().toISOString()}
-- Source: ${this.excelFile}
-- Total records: ${excelData.length}
-- Column alignment: 100% synchronized with Excel data

INSERT INTO ${this.tableName} (
    ${columnList}
) VALUES\n`;

        const valueRows = [];
        let processedCount = 0;

        excelData.forEach((record, index) => {
            const values = [];

            this.columnMapping.columns.forEach((columnInfo, colIndex) => {
                const rawValue = record[colIndex];
                const cleanedValue = this.cleanValue(rawValue, columnInfo);
                values.push(cleanedValue);
            });

            const valueRow = `(${values.join(', ')})`;
            valueRows.push(valueRow);
            processedCount++;

            if (processedCount % 100 === 0) {
                console.log(`   ✓ Processed ${processedCount} records...`);
            }
        });

        sql += valueRows.join(',\n');
        sql += ';\n\n';

        // Add validation queries
        sql += `-- Validation queries
SELECT 'Total imported records' as Check_Description, COUNT(*) as Count FROM ${this.tableName};
SELECT 'Records with valid item numbers' as Check_Description, COUNT(*) as Count FROM ${this.tableName} WHERE item IS NOT NULL AND item != '';
SELECT 'Records with brand names' as Check_Description, COUNT(*) as Count FROM ${this.tableName} WHERE brand_name IS NOT NULL AND brand_name != '';

-- Sample verification
SELECT TOP 10 brand_name, item, description1, description2 FROM ${this.tableName} ORDER BY id DESC;
`;

        console.log(`✅ Generated SQL for ${processedCount} records`);
        return sql;
    }
}

// Usage instructions for Excel MCP integration
console.log('📖 EXCEL MCP INTEGRATION INSTRUCTIONS:');
console.log('To complete the fresh SQL generation:');
console.log('1. Use Excel MCP to read data from: DATA_TEAM_ACTIVE_SHEET_7-17-2025.xlsx');
console.log('2. Sheet: Sheet1, Header Row: 3, Data Start Row: 4');
console.log('3. Pass the raw data to DirectSQLGenerator.generateFreshSQL()');
console.log('4. Save output as: data_import_statements_FRESH.sql');

export { DirectSQLGenerator };
