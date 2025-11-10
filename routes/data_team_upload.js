const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Column index mapping (0-indexed)
// Maps Excel column positions to database field names
const COLUMN_MAP = {
    0: 'brand_name',        // Column A: Brand Name
    1: 'item',              // Column B: Item#
    2: 'description1',      // Column C: Description1
    3: 'description2',      // Column D: Description2
    4: 'description3',      // Column E: Description3
    5: 'uom_units_inner_2', // Column F: Inner - 2 (UOM)
    6: 'uom_pack_inner_1',  // Column G: Inner - 1 (UOM)
    7: 'uom_sellable',      // Column H: Sellable (UOM)
    8: 'uom_ship_1',        // Column I: Ship + 1 (UOM)
    9: 'uom_ship_2',        // Column J: Ship + 2 (UOM)
    10: 'upc_inner_2',      // Column K: Inner - 2 (UPC)
    11: 'upc_inner_1',      // Column L: Inner - 1 (UPC)
    12: 'upc_sellable',     // Column M: Sellable (UPC)
    13: 'upc_ship_1',       // Column N: Ship + 1 (UPC)
    14: 'upc_ship_2',       // Column O: Ship + 2 (UPC)
    15: 'ar_inner_2',       // Column P: Inner - 2 (AR)
    16: 'ar_inner_1',       // Column Q: Inner - 1 (AR)
    17: 'ar_sellable',      // Column R: Sellable (AR)
    18: 'ar_ship_1',        // Column S: Ship + 1 (AR)
    19: 'ar_ship_2',        // Column T: Ship + 2 (AR)
    // Columns 20-39: Dimensions and weights (not mapped)
    40: 'hcpc_code',        // Column AO: HCPC Code
    41: 'product_type',     // Column AP: Product Type
    42: 'fei_number',       // Column AQ: FEI #
    43: 'duns_number',      // Column AR: Duns #
    44: 'dln',              // Column AS: DLN
    45: 'device_class',     // Column AT: Device Class
    46: 'product_code',     // Column AU: Product Code
    47: 'fda_510_k',        // Column AV: 510 (k)
    48: 'exp_date',         // Column AW: EXP Date
    49: 'sn_number',        // Column AX: SN #
    50: 'sterile',          // Column AY: Sterile
    51: 'sterile_method',   // Column AZ: Sterile Method
    52: 'shelf_life',       // Column BA: Shelf Life
    53: 'prop_65',          // Column BB: Prop-65
    54: 'prop_65_warning',  // Column BC: Prop-65 Warning
    55: 'rx_required',      // Column BD: RX Required
    56: 'dehp_free',        // Column BE: DEHP Free
    57: 'latex',            // Column BF: Latex
    58: 'use_field',        // Column BG: Use
    59: 'temp_required',    // Column BH: Temp Required
    60: 'temp_range',       // Column BI: Temp Range
    61: 'humidity_limitation', // Column BJ: Humidity Limitation
    62: 'gtin_inner_2',     // Column BK: Inner - 2 (GTIN/Pack)
    63: 'gtin_inner_1',     // Column BL: Inner - 1 (GTIN/Pack)
    64: 'gtin_sellable',    // Column BM: Sellable (GTIN/Pack)
    65: 'gtin_ship_1',      // Column BN: Ship + 1 (GTIN/Pack)
    66: 'gtin_ship_2',      // Column BO: Ship + 2 (GTIN/Pack)
    67: 'product_identification', // Column BP: Product Identification
    68: 'term_code',        // Column BQ: Term Code
    69: 'ndc_inner_2',      // Column BR: Inner -2 (NDC)
    70: 'ndc_inner_1',      // Column BS: Inner -1 (NDC)
    71: 'ndc_sellable',     // Column BT: Sellable (NDC)
    72: 'ndc_shipper_1',    // Column BU: Shipper +1 (NDC)
    73: 'ndc_shipper_2',    // Column BV: Shipper +2 (NDC)
    74: 'hc_class',         // Column BW: HC Class
    75: 'license_number'    // Column BX: License Number
};

// UPC column indices to validate
const UPC_COLUMNS = [10, 11, 12, 13, 14]; // Columns K-O (UPC fields)
const GTIN_COLUMNS = [62, 63, 64, 65, 66]; // Columns BK-BO (GTIN fields)

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed'), false);
        }
    }
});

// Helper function to check if a row is completely empty
function isRowEmpty(row) {
    // Check if row is undefined/null or has no values
    if (!row || row.length === 0) {
        return true;
    }

    // Check if all cells in the row are empty
    return row.every(cell => {
        if (cell === undefined || cell === null || cell === '') {
            return true;
        }
        if (typeof cell === 'string' && cell.trim() === '') {
            return true;
        }
        return false;
    });
}

// Validation functions
function validateItemCodes(data) {
    const itemCodes = new Map();
    const duplicates = [];

    data.forEach((row, index) => {
        // Skip completely empty rows
        if (isRowEmpty(row)) {
            return;
        }

        const itemCode = row[1]; // Column B (index 1) is Item#
        if (itemCode !== undefined && itemCode !== null && itemCode !== '') {
            const trimmedCode = itemCode.toString().trim();
            if (trimmedCode) { // Only process if not empty after trim
                if (itemCodes.has(trimmedCode)) {
                    duplicates.push({
                        row: index + 4, // +4 because data starts from row 4 (header in row 3)
                        itemCode: trimmedCode
                    });
                } else {
                    itemCodes.set(trimmedCode, index + 4);
                }
            }
        }
    });

    return duplicates;
}

function validateUPCs(data) {
    const upcCodes = new Map();
    const duplicates = [];
    const invalidLengths = [];

    // Only validate UPC columns (K-O), NOT GTIN columns
    const upcColumnsToValidate = UPC_COLUMNS; // Columns K-O (10-14)

    data.forEach((row, index) => {
        // Skip completely empty rows
        if (isRowEmpty(row)) {
            return;
        }

        upcColumnsToValidate.forEach(colIndex => {
            const upcValue = row[colIndex];
            if (upcValue !== undefined && upcValue !== null && upcValue !== '') {
                const trimmedUPC = upcValue.toString().trim();
                const rowNum = index + 4;

                // Check if it's 'X', 'x', 'N/A', or empty - these are valid
                if (trimmedUPC.toLowerCase() === 'x' ||
                    trimmedUPC.toLowerCase() === 'n/a' ||
                    trimmedUPC === '') {
                    return; // Valid, skip validation
                }

                // Check length (must be exactly 12 digits)
                if (!/^\d{12}$/.test(trimmedUPC)) {
                    invalidLengths.push({
                        row: rowNum,
                        column: `Column ${colIndex + 1}`,
                        upcCode: trimmedUPC,
                        length: trimmedUPC.length
                    });
                    return;
                }

                // Check for duplicates (only for valid UPCs)
                if (upcCodes.has(trimmedUPC)) {
                    duplicates.push({
                        row: rowNum,
                        column: `Column ${colIndex + 1}`,
                        upcCode: trimmedUPC
                    });
                } else {
                    upcCodes.set(trimmedUPC, { row: rowNum, column: colIndex });
                }
            }
        });
    });

    return { duplicates, invalidLengths };
}

// Helper function to convert column index to Excel column letter (A, B, ..., Z, AA, AB, ..., BK, BL, etc.)
function getColumnLetter(colIndex) {
    let letter = '';
    let temp = colIndex;
    while (temp >= 0) {
        letter = String.fromCharCode(65 + (temp % 26)) + letter;
        temp = Math.floor(temp / 26) - 1;
    }
    return letter;
}

function validateGTINs(data) {
    const gtinCodes = new Map();
    const duplicates = [];
    const invalidLengths = [];

    // GTIN columns (BK-BO, indices 62-66)
    const gtinColumnsToValidate = GTIN_COLUMNS; // Columns BK-BO (62-66)

    data.forEach((row, index) => {
        // Skip completely empty rows
        if (isRowEmpty(row)) {
            return;
        }

        gtinColumnsToValidate.forEach(colIndex => {
            const gtinValue = row[colIndex];
            if (gtinValue !== undefined && gtinValue !== null && gtinValue !== '') {
                const trimmedGTIN = gtinValue.toString().trim();
                const rowNum = index + 4;

                // Check if it's 'X', 'x', 'N/A', or empty - these are valid
                if (trimmedGTIN.toLowerCase() === 'x' ||
                    trimmedGTIN.toLowerCase() === 'n/a' ||
                    trimmedGTIN.toLowerCase() === 'na' ||
                    trimmedGTIN === '') {
                    return; // Valid, skip validation
                }

                // Check length (must be at least 14 digits for GTIN-14)
                if (!/^\d{14,}$/.test(trimmedGTIN)) {
                    invalidLengths.push({
                        row: rowNum,
                        column: `Column ${getColumnLetter(colIndex)}`,
                        gtinCode: trimmedGTIN,
                        length: trimmedGTIN.length,
                        message: 'GTIN must be at least 14 digits'
                    });
                    return;
                }

                // Check for duplicates (only for valid GTINs)
                if (gtinCodes.has(trimmedGTIN)) {
                    duplicates.push({
                        row: rowNum,
                        column: `Column ${getColumnLetter(colIndex)}`,
                        gtinCode: trimmedGTIN
                    });
                } else {
                    gtinCodes.set(trimmedGTIN, { row: rowNum, column: colIndex });
                }
            }
        });
    });

    return { duplicates, invalidLengths };
}

function validateRequiredFields(data) {
    const missing = [];

    data.forEach((row, index) => {
        const rowNum = index + 4;

        // Skip completely empty rows (typically at the end of the Excel file)
        if (isRowEmpty(row)) {
            return;
        }

        // Check required fields using column indices
        // Column 0: Brand Name - NOW OPTIONAL, no validation needed

        // Column 1: Item# - REQUIRED
        const itemCode = row[1];
        if (itemCode === undefined || itemCode === null || itemCode === '' ||
            itemCode.toString().trim() === '') {
            missing.push({
                row: rowNum,
                field: 'Item#'
            });
        }
    });

    return missing;
}

// Route to validate Excel file
router.post('/validate-data-team-excel', upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const workbook = XLSX.readFile(filePath);
        const sheetName = req.body.sheetName || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
            return res.status(400).json({ success: false, error: `Sheet '${sheetName}' not found` });
        }

        // Read data starting from row 4 (0-indexed row 3) as array of arrays
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        range.s.r = 3; // Start from row 4 (0-indexed), skip first 3 header rows

        const dataRows = XLSX.utils.sheet_to_json(worksheet, {
            range: range,
            header: 1,  // Read as array of arrays, not objects
            defval: ''
        });

        if (dataRows.length === 0) {
            return res.status(400).json({ success: false, error: 'No data rows found' });
        }

        // Run all validations (functions now expect arrays)
        const duplicateItems = validateItemCodes(dataRows);
        const upcValidation = validateUPCs(dataRows);
        const gtinValidation = validateGTINs(dataRows);
        const missingRequired = validateRequiredFields(dataRows);

        const errors = {
            duplicateItems,
            duplicateUPCs: upcValidation.duplicates,
            invalidUPCs: upcValidation.invalidLengths,
            duplicateGTINs: gtinValidation.duplicates,
            invalidGTINs: gtinValidation.invalidLengths,
            missingRequired
        };

        const hasErrors = duplicateItems.length > 0 ||
                         upcValidation.duplicates.length > 0 ||
                         upcValidation.invalidLengths.length > 0 ||
                         gtinValidation.duplicates.length > 0 ||
                         gtinValidation.invalidLengths.length > 0 ||
                         missingRequired.length > 0;

        if (hasErrors) {
            // Clean up uploaded file
            fs.unlinkSync(filePath);
            return res.json({ success: false, errors });
        }

        // Validation passed - return array data as-is
        const summary = {
            totalRows: dataRows.length,
            validItemCodes: dataRows.filter(row => row[1] && row[1].toString().trim()).length,
            validUPCs: dataRows.length // This could be more specific
        };

        // Clean up uploaded file but keep data for import
        fs.unlinkSync(filePath);

        res.json({
            success: true,
            summary,
            data: dataRows  // Return raw array data
        });

    } catch (error) {
        console.error('Excel validation error:', error);

        // Clean up uploaded file on error
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Error cleaning up file:', unlinkError);
            }
        }

        res.status(500).json({
            success: false,
            error: `Validation failed: ${error.message}`
        });
    }
});

// Helper function to get value from row using column mapping
function getValueFromRow(row, colIndex) {
    const value = row[colIndex];

    // Handle undefined, null, or empty values
    if (value === undefined || value === null || value === '') {
        return null;
    }

    // Handle string values
    if (typeof value === 'string') {
        const trimmedValue = value.trim();
        const lowerValue = trimmedValue.toLowerCase();

        // Check for N/A, X, or other null-equivalent values
        if (trimmedValue === '' || lowerValue === 'n/a' || lowerValue === 'x' ||
            lowerValue === 'na' || lowerValue === 'null' || lowerValue === 'none') {
            return null;
        }

        return trimmedValue; // Return trimmed string
    }

    // Convert numbers to strings for SQL Server NVarChar fields
    if (typeof value === 'number') {
        return value.toString();
    }

    return value;
}

// Route to import validated data to temp table
router.post('/import-data-team-temp', async (req, res) => {
    const sql = require('mssql');

    console.log('=== Import to temp table started ===');
    try {
        const { data, clearTable } = req.body;
        console.log('Data received:', data ? `${data.length} rows` : 'null/undefined');
        console.log('Clear table:', clearTable);

        if (!data || !Array.isArray(data)) {
            console.error('Invalid data:', typeof data);
            return res.status(400).json({ success: false, error: 'No valid data provided' });
        }

        // Get database config from app locals
        const dbConfig = req.app.locals.dbConfig;
        if (!dbConfig) {
            console.error('Database config not available');
            return res.status(500).json({ success: false, error: 'Database configuration not available' });
        }

        console.log('Connecting to database...');
        const pool = new sql.ConnectionPool(dbConfig);
        await pool.connect();
        console.log('Database connected successfully');

        // Clear temp table if requested
        if (clearTable) {
            console.log('Clearing temp table...');
            await pool.request().query('TRUNCATE TABLE data_team_active_items_temp');
            console.log('Temp table cleared');
        }

        // Insert data in batches
        const batchSize = 100;
        let totalInserted = 0;

        console.log(`Starting batch insert of ${data.length} rows...`);
        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i / batchSize) + 1}: rows ${i + 1} to ${i + batch.length}`);

            for (let rowIndex = 0; rowIndex < batch.length; rowIndex++) {
                const row = batch[rowIndex];
                const globalRowIndex = i + rowIndex;

                // Skip completely empty rows
                if (isRowEmpty(row)) {
                    console.log(`Skipping empty row at index ${globalRowIndex}`);
                    continue;
                }

                try {
                    const request = pool.request();

                    // Get all values first
                    const feiNumber = getValueFromRow(row, 42);

                    // Map columns using COLUMN_MAP indices
                    // Using NVarChar for Unicode support (®, °, ₂, etc.)
                    request.input('brand_name', sql.NVarChar(50), getValueFromRow(row, 0));
                    request.input('item', sql.NVarChar(50), getValueFromRow(row, 1));
                    request.input('description1', sql.NVarChar(100), getValueFromRow(row, 2));
                    request.input('description2', sql.NVarChar(150), getValueFromRow(row, 3));
                    request.input('description3', sql.NVarChar(100), getValueFromRow(row, 4));
                    request.input('uom_units_inner_2', sql.NVarChar(50), getValueFromRow(row, 5));
                    request.input('uom_pack_inner_1', sql.NVarChar(50), getValueFromRow(row, 6));
                    request.input('uom_sellable', sql.NVarChar(50), getValueFromRow(row, 7));
                    request.input('uom_ship_1', sql.NVarChar(255), getValueFromRow(row, 8));
                    request.input('uom_ship_2', sql.NVarChar(255), getValueFromRow(row, 9));
                    request.input('upc_inner_2', sql.BigInt, getValueFromRow(row, 10));
                    request.input('upc_inner_1', sql.BigInt, getValueFromRow(row, 11));
                    request.input('upc_sellable', sql.BigInt, getValueFromRow(row, 12));
                    request.input('upc_ship_1', sql.NVarChar(255), getValueFromRow(row, 13));
                    request.input('upc_ship_2', sql.NVarChar(255), getValueFromRow(row, 14));
                    request.input('ar_inner_2', sql.NVarChar(50), getValueFromRow(row, 15));
                    request.input('ar_inner_1', sql.NVarChar(50), getValueFromRow(row, 16));
                    request.input('ar_sellable', sql.NVarChar(50), getValueFromRow(row, 17));
                    request.input('ar_ship_1', sql.NVarChar(255), getValueFromRow(row, 18));
                    request.input('ar_ship_2', sql.NVarChar(255), getValueFromRow(row, 19));
                    request.input('hcpc_code', sql.NVarChar(50), getValueFromRow(row, 40));
                    request.input('product_type', sql.NVarChar(50), getValueFromRow(row, 41));
                    request.input('fei_number', sql.NVarChar(50), feiNumber);
                    request.input('duns_number', sql.NVarChar(255), getValueFromRow(row, 43));
                    request.input('dln', sql.NVarChar(255), getValueFromRow(row, 44));
                    request.input('device_class', sql.NVarChar(255), getValueFromRow(row, 45));
                    request.input('product_code', sql.NVarChar(255), getValueFromRow(row, 46));
                    request.input('fda_510_k', sql.NVarChar(255), getValueFromRow(row, 47));
                    request.input('exp_date', sql.NVarChar(50), getValueFromRow(row, 48));
                    request.input('sn_number', sql.NVarChar(50), getValueFromRow(row, 49));
                    request.input('sterile', sql.NVarChar(50), getValueFromRow(row, 50));
                    request.input('sterile_method', sql.NVarChar(255), getValueFromRow(row, 51));
                    request.input('shelf_life', sql.NVarChar(50), getValueFromRow(row, 52));
                    request.input('prop_65', sql.NVarChar(50), getValueFromRow(row, 53));
                    request.input('prop_65_warning', sql.NVarChar(255), getValueFromRow(row, 54));
                    request.input('rx_required', sql.NVarChar(50), getValueFromRow(row, 55));
                    request.input('dehp_free', sql.NVarChar(50), getValueFromRow(row, 56));
                    request.input('latex', sql.NVarChar(50), getValueFromRow(row, 57));
                    request.input('use_field', sql.NVarChar(255), getValueFromRow(row, 58));
                    request.input('temp_required', sql.NVarChar(50), getValueFromRow(row, 59));
                    request.input('temp_range', sql.NVarChar(255), getValueFromRow(row, 60));
                    request.input('humidity_limitation', sql.NVarChar(255), getValueFromRow(row, 61));
                    request.input('gtin_inner_2', sql.NVarChar(20), getValueFromRow(row, 62));
                    request.input('gtin_inner_1', sql.NVarChar(20), getValueFromRow(row, 63));
                    request.input('gtin_sellable', sql.NVarChar(20), getValueFromRow(row, 64));
                    request.input('gtin_ship_1', sql.NVarChar(20), getValueFromRow(row, 65));
                    request.input('gtin_ship_2', sql.NVarChar(20), getValueFromRow(row, 66));
                    request.input('product_identification', sql.NVarChar(255), getValueFromRow(row, 67));
                    request.input('term_code', sql.NVarChar(255), getValueFromRow(row, 68));
                    request.input('ndc_inner_2', sql.NVarChar(50), getValueFromRow(row, 69));
                    request.input('ndc_inner_1', sql.NVarChar(50), getValueFromRow(row, 70));
                    request.input('ndc_sellable', sql.NVarChar(50), getValueFromRow(row, 71));
                    request.input('ndc_shipper_1', sql.NVarChar(255), getValueFromRow(row, 72));
                    request.input('ndc_shipper_2', sql.NVarChar(255), getValueFromRow(row, 73));
                    request.input('hc_class', sql.NVarChar(255), getValueFromRow(row, 74));
                    request.input('license_number', sql.NVarChar(255), getValueFromRow(row, 75));

                    await request.query(`
                        INSERT INTO data_team_active_items_temp (
                            brand_name, item, description1, description2, description3,
                            uom_units_inner_2, uom_pack_inner_1, uom_sellable, uom_ship_1, uom_ship_2,
                            upc_inner_2, upc_inner_1, upc_sellable, upc_ship_1, upc_ship_2,
                            ar_inner_2, ar_inner_1, ar_sellable, ar_ship_1, ar_ship_2,
                            hcpc_code, product_type, fei_number, duns_number, dln, device_class, product_code,
                            fda_510_k, exp_date, sn_number, sterile, sterile_method, shelf_life,
                            prop_65, prop_65_warning, rx_required, dehp_free, latex, use_field,
                            temp_required, temp_range, humidity_limitation,
                            gtin_inner_2, gtin_inner_1, gtin_sellable, gtin_ship_1, gtin_ship_2,
                            product_identification, term_code,
                            ndc_inner_2, ndc_inner_1, ndc_sellable, ndc_shipper_1, ndc_shipper_2,
                            hc_class, license_number
                        ) VALUES (
                            @brand_name, @item, @description1, @description2, @description3,
                            @uom_units_inner_2, @uom_pack_inner_1, @uom_sellable, @uom_ship_1, @uom_ship_2,
                            @upc_inner_2, @upc_inner_1, @upc_sellable, @upc_ship_1, @upc_ship_2,
                            @ar_inner_2, @ar_inner_1, @ar_sellable, @ar_ship_1, @ar_ship_2,
                            @hcpc_code, @product_type, @fei_number, @duns_number, @dln, @device_class, @product_code,
                            @fda_510_k, @exp_date, @sn_number, @sterile, @sterile_method, @shelf_life,
                            @prop_65, @prop_65_warning, @rx_required, @dehp_free, @latex, @use_field,
                            @temp_required, @temp_range, @humidity_limitation,
                            @gtin_inner_2, @gtin_inner_1, @gtin_sellable, @gtin_ship_1, @gtin_ship_2,
                            @product_identification, @term_code,
                            @ndc_inner_2, @ndc_inner_1, @ndc_sellable, @ndc_shipper_1, @ndc_shipper_2,
                            @hc_class, @license_number
                        )
                    `);

                    totalInserted++;
                } catch (rowError) {
                    console.error(`Error inserting row ${globalRowIndex + 4} (Excel row ${globalRowIndex + 4}):`);
                    console.error(`Item code: ${row[1]}`);
                    console.error(`FEI Number value:`, row[42], `Type: ${typeof row[42]}, Length: ${row[42] ? row[42].toString().length : 0}`);
                    console.error(`Error:`, rowError.message);
                    throw new Error(`Row ${globalRowIndex + 4}: ${rowError.message}`);
                }
            }
        }

        await pool.close();

        console.log(`=== Import completed successfully: ${totalInserted} rows ===`);
        res.json({
            success: true,
            totalRows: totalInserted,
            message: `Successfully imported ${totalInserted} rows to temp table`
        });

    } catch (error) {
        console.error('=== Import error ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            error: `Import failed: ${error.message}`
        });
    }
});

// Route to clear temp table
router.post('/clear-data-team-temp', async (req, res) => {
    const sql = require('mssql');

    console.log('=== Clearing temp table requested ===');
    try {
        // Get database config from app locals
        const dbConfig = req.app.locals.dbConfig;
        if (!dbConfig) {
            console.error('Database config not available');
            return res.status(500).json({ success: false, error: 'Database configuration not available' });
        }

        console.log('Connecting to database...');
        const pool = new sql.ConnectionPool(dbConfig);
        await pool.connect();
        console.log('Database connected successfully');

        console.log('Truncating data_team_active_items_temp table...');
        await pool.request().query('TRUNCATE TABLE data_team_active_items_temp');
        console.log('Temp table cleared successfully');

        await pool.close();

        res.json({
            success: true,
            message: 'Temp table cleared successfully'
        });

    } catch (error) {
        console.error('Clear temp table error:', error);
        res.status(500).json({
            success: false,
            error: `Failed to clear temp table: ${error.message}`
        });
    }
});

// Route to check if temp table has data
router.get('/check-data-team-temp', async (req, res) => {
    const sql = require('mssql');

    console.log('=== Checking temp table for data ===');
    try {
        // Get database config from app locals
        const dbConfig = req.app.locals.dbConfig;
        if (!dbConfig) {
            console.error('Database config not available');
            return res.status(500).json({ success: false, error: 'Database configuration not available' });
        }

        console.log('Connecting to database...');
        const pool = new sql.ConnectionPool(dbConfig);
        await pool.connect();
        console.log('Database connected successfully');

        console.log('Checking data_team_active_items_temp table...');
        const result = await pool.request().query('SELECT COUNT(*) as count FROM data_team_active_items_temp');
        const count = result.recordset[0].count;
        console.log(`Temp table has ${count} rows`);

        await pool.close();

        res.json({
            success: true,
            hasData: count > 0,
            count: count
        });

    } catch (error) {
        console.error('Check temp table error:', error);
        res.status(500).json({
            success: false,
            error: `Failed to check temp table: ${error.message}`
        });
    }
});

module.exports = router;