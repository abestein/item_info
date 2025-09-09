const ExcelJS = require('exceljs');
const sql = require('mssql');

// Define the vendor_items_temp table structure
const TABLE_NAME = 'vendor_items_temp';

// Map Excel columns to actual database column names
const VENDOR_ITEMS_COLUMN_MAPPINGS = [
    { excelIndex: 0, dbColumn: 'vendor_item', type: 'VARCHAR' },
    { excelIndex: 1, dbColumn: 'vendor_name', type: 'VARCHAR' },
    { excelIndex: 2, dbColumn: 'brand_name', type: 'VARCHAR' },
    { excelIndex: 3, dbColumn: 'dynrex_item', type: 'VARCHAR' },
    { excelIndex: 4, dbColumn: 'description1', type: 'VARCHAR' },
    { excelIndex: 5, dbColumn: 'description2', type: 'VARCHAR' },
    { excelIndex: 6, dbColumn: 'description3', type: 'VARCHAR' },
    { excelIndex: 7, dbColumn: 'inner_inner_pt', type: 'VARCHAR' },
    { excelIndex: 8, dbColumn: 'inner_pt', type: 'VARCHAR' },
    { excelIndex: 9, dbColumn: 'sellable_pt', type: 'VARCHAR' },
    { excelIndex: 10, dbColumn: 'ship_pt', type: 'VARCHAR' },
    { excelIndex: 11, dbColumn: 'outter_ship_pt', type: 'VARCHAR' },
    { excelIndex: 12, dbColumn: 'inner_inner_upc', type: 'VARCHAR' },
    { excelIndex: 13, dbColumn: 'inner_upc', type: 'VARCHAR' },
    { excelIndex: 14, dbColumn: 'sellable_upc', type: 'VARCHAR' },
    { excelIndex: 15, dbColumn: 'ship_upc', type: 'VARCHAR' },
    { excelIndex: 16, dbColumn: 'outter_ship_upc', type: 'VARCHAR' },
    { excelIndex: 17, dbColumn: 'origin', type: 'VARCHAR' },
    { excelIndex: 18, dbColumn: 'last_po_date', type: 'VARCHAR' },
    { excelIndex: 19, dbColumn: 'fob_cost', type: 'VARCHAR' },
    { excelIndex: 20, dbColumn: 'forty_hq', type: 'VARCHAR' },
    { excelIndex: 21, dbColumn: 'hts_code', type: 'VARCHAR' },
    { excelIndex: 22, dbColumn: 'hts_code2', type: 'VARCHAR' },
    { excelIndex: 23, dbColumn: 'current_duty', type: 'VARCHAR' },
    { excelIndex: 24, dbColumn: 'current_tariff', type: 'VARCHAR' },
    { excelIndex: 25, dbColumn: 'sort_order', type: 'VARCHAR' }
];

// UPC column indices and names
const UPC_COLUMNS = [
    { excelIndex: 12, name: 'inner_inner_upc' },
    { excelIndex: 13, name: 'inner_upc' },
    { excelIndex: 14, name: 'sellable_upc' },
    { excelIndex: 15, name: 'ship_upc' },
    { excelIndex: 16, name: 'outter_ship_upc' }
];

class VendorItemsTestUploadHandler {
    #dbConfig;
    #progressCallback;

    constructor(dbConfig) {
        this.#dbConfig = dbConfig;
        this.#progressCallback = null;
    }

    setProgressCallback(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Progress callback must be a function');
        }
        this.#progressCallback = callback;
    }

    #updateProgress(current, total, message) {
        if (this.#progressCallback) {
            this.#progressCallback({ current, total, message });
        }
    }

    // Check if row has data in the 4th column (index 3)
    #rowHasRequiredColumn(row) {
        const fourthColumnValue = row[3];
        return fourthColumnValue !== null &&
            fourthColumnValue !== undefined &&
            String(fourthColumnValue).trim() !== '';
    }

    // Validate UPC format
    isValidUPC(upc) {
        if (!upc || upc === '') return true; // Empty is allowed

        const upcStr = String(upc).trim();
        if (upcStr === '') return true; // Empty after trim is allowed

        // Check if it's exactly 12 digits or contains only 'x' or 'X'
        if (upcStr.toLowerCase() === 'x') return true;

        // Check if it's numeric and exactly 12 digits
        if (!/^\d{12}$/.test(upcStr)) {
            return false;
        }

        return true;
    }

    // Validate all UPCs in the data
    validateUPCs(validRows) {
        const errors = [];
        const itemUPCs = new Map(); // Map to track UPCs per item
        const globalUPCs = new Map(); // Map to track UPCs globally

        validRows.forEach((row, rowIndex) => {
            const itemCode = this.cleanValue(row[3]); // dynrex_item (4th column)
            const excelRowNum = rowIndex + 2; // +2 for header and 1-based indexing

            // Initialize tracking for this item
            if (!itemUPCs.has(itemCode)) {
                itemUPCs.set(itemCode, new Map());
            }

            // Check each UPC column
            UPC_COLUMNS.forEach(upcCol => {
                const upcValue = this.cleanValue(row[upcCol.excelIndex]);

                if (upcValue) {
                    // Check 1: Validate UPC format
                    if (!this.isValidUPC(upcValue)) {
                        errors.push({
                            type: 'invalid_format',
                            row: excelRowNum,
                            column: upcCol.name,
                            value: upcValue,
                            itemCode: itemCode,
                            message: `Invalid UPC format in row ${excelRowNum}, column ${upcCol.name}: "${upcValue}" - Must be exactly 12 digits, 'X', or empty`
                        });
                    }

                    // Only check for duplicates if it's a valid 12-digit UPC
                    if (/^\d{12}$/.test(String(upcValue).trim())) {
                        const upcStr = String(upcValue).trim();

                        // Check 2: Same UPC in different UOM for same item
                        const itemUPCMap = itemUPCs.get(itemCode);
                        if (itemUPCMap.has(upcStr)) {
                            const existingUOM = itemUPCMap.get(upcStr);
                            errors.push({
                                type: 'duplicate_upc_same_item',
                                row: excelRowNum,
                                column: upcCol.name,
                                value: upcStr,
                                itemCode: itemCode,
                                existingUOM: existingUOM,
                                message: `Duplicate UPC in row ${excelRowNum}: UPC "${upcStr}" already exists in ${existingUOM} for item ${itemCode}`
                            });
                        } else {
                            itemUPCMap.set(upcStr, upcCol.name);
                        }

                        // Check 3: Same UPC across different items
                        if (globalUPCs.has(upcStr)) {
                            const existing = globalUPCs.get(upcStr);
                            if (existing.itemCode !== itemCode) {
                                errors.push({
                                    type: 'duplicate_upc_different_item',
                                    row: excelRowNum,
                                    column: upcCol.name,
                                    value: upcStr,
                                    itemCode: itemCode,
                                    existingItem: existing.itemCode,
                                    existingRow: existing.row,
                                    message: `Duplicate UPC across items in row ${excelRowNum}: UPC "${upcStr}" already exists for item ${existing.itemCode} (row ${existing.row})`
                                });
                            }
                        } else {
                            globalUPCs.set(upcStr, {
                                itemCode: itemCode,
                                row: excelRowNum,
                                uom: upcCol.name
                            });
                        }
                    }
                }
            });
        });

        return errors;
    }

    // Helper method to get cell value from ExcelJS cell
    getCellValue(cell) {
        if (!cell) return null;

        // Handle different cell types
        if (cell.type === ExcelJS.ValueType.Date) {
            return cell.value;
        } else if (cell.type === ExcelJS.ValueType.Number) {
            return cell.value;
        } else if (cell.type === ExcelJS.ValueType.String) {
            return cell.value;
        } else if (cell.type === ExcelJS.ValueType.Boolean) {
            return cell.value;
        } else if (cell.type === ExcelJS.ValueType.Formula) {
            // Use the calculated result if available
            return cell.result !== undefined ? cell.result : cell.value;
        } else if (cell.type === ExcelJS.ValueType.Null || cell.type === ExcelJS.ValueType.Merge) {
            return null;
        }

        return cell.value;
    }

    cleanValue(value) {
        // Handle null/undefined
        if (value === null || value === undefined || value === '') {
            return null;
        }

        // Convert to string and trim
        const strValue = String(value).trim();
        return strValue === '' ? null : strValue;
    }

    async testExcelFile(filePath, sheetName = null) {
        try {
            this.#updateProgress(0, 100, 'Reading Excel file...');

            // Create a new workbook and read the file
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(filePath);

            // Get the worksheet
            let worksheet;
            if (sheetName) {
                worksheet = workbook.getWorksheet(sheetName);
                if (!worksheet) {
                    throw new Error(`Sheet "${sheetName}" not found`);
                }
            } else {
                worksheet = workbook.worksheets[0];
                if (!worksheet) {
                    throw new Error('No worksheets found in the file');
                }
            }

            // Convert worksheet to array of arrays
            const data = [];
            worksheet.eachRow((row, rowNumber) => {
                const rowData = [];
                // Read up to 26 columns (or however many columns we need)
                for (let colNumber = 1; colNumber <= VENDOR_ITEMS_COLUMN_MAPPINGS.length; colNumber++) {
                    const cell = row.getCell(colNumber);
                    const value = this.getCellValue(cell);
                    rowData.push(value);
                }
                data.push(rowData);
            });

            if (data.length < 2) {
                throw new Error('Excel file must contain at least one data row (plus headers)');
            }

            // Skip the header row
            const allDataRows = data.slice(1);

            // Filter rows based on 4th column requirement
            const validRows = [];
            const skippedRows = [];

            for (let i = 0; i < allDataRows.length; i++) {
                const row = allDataRows[i];
                if (this.#rowHasRequiredColumn(row)) {
                    validRows.push(row);
                } else {
                    skippedRows.push(i + 2); // +2 because Excel rows start at 1 and we skipped header
                }
            }

            const totalRows = validRows.length;
            const skippedCount = skippedRows.length;

            this.#updateProgress(10, 100, `Found ${totalRows} valid rows to process (skipped ${skippedCount} rows missing 4th column)`);

            if (totalRows === 0) {
                throw new Error('No valid data rows found in the Excel file (all rows missing 4th column)');
            }

            // Validate UPCs
            this.#updateProgress(15, 100, 'Validating UPC codes...');
            const upcErrors = this.validateUPCs(validRows);

            if (upcErrors.length > 0) {
                // Return validation errors without processing
                return {
                    success: false,
                    totalRows: allDataRows.length,
                    validRows: totalRows,
                    skippedRows: skippedCount,
                    skippedRowIndices: skippedRows.slice(0, 10),
                    successfulRows: 0,
                    failedRows: totalRows,
                    validationErrors: upcErrors,
                    errors: [{
                        batch: 'UPC Validation',
                        error: `Found ${upcErrors.length} UPC validation error(s). Upload cancelled.`
                    }]
                };
            }

            // Connect to database
            await sql.connect(this.#dbConfig);

            // Ensure vendor_items_temp table exists
            await this.createTableIfNotExists();

            // Process in batches
            const batchSize = 100;
            let processedRows = 0;
            let successfulRows = 0;
            const errors = [];

            for (let i = 0; i < validRows.length; i += batchSize) {
                const batch = validRows.slice(i, Math.min(i + batchSize, validRows.length));

                try {
                    await this.processBatch(batch, i);
                    successfulRows += batch.length;
                } catch (error) {
                    errors.push({
                        batch: `Rows ${i + 2} to ${i + batch.length + 1}`,
                        error: error.message
                    });
                }

                processedRows += batch.length;
                const progress = 20 + (processedRows / totalRows) * 70; // 20-90% for processing
                this.#updateProgress(
                    processedRows,
                    totalRows,
                    `Processing rows... (${processedRows}/${totalRows})`
                );
            }

            this.#updateProgress(95, 100, 'Finalizing...');

            // Get preview of inserted data
            const request = new sql.Request();
            let previewResult = { recordset: [] };

            try {
                previewResult = await request.query(`
                    SELECT TOP 5 * FROM [${TABLE_NAME}] 
                    ORDER BY id DESC
                `);
            } catch (error) {
                console.warn('Could not fetch preview data:', error.message);
            }

            await sql.close();

            this.#updateProgress(100, 100, 'Upload complete!');

            return {
                success: true,
                totalRows: allDataRows.length,
                validRows: totalRows,
                skippedRows: skippedCount,
                skippedRowIndices: skippedRows.slice(0, 10),
                successfulRows: successfulRows,
                failedRows: totalRows - successfulRows,
                errors: errors,
                preview: previewResult.recordset
            };

        } catch (error) {
            await sql.close();
            throw error;
        }
    }

    async createTableIfNotExists() {
        const request = new sql.Request();

        // Check if table exists
        const checkTableQuery = `
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = '${TABLE_NAME}'
        `;

        const result = await request.query(checkTableQuery);

        if (result.recordset[0].count === 0) {
            console.log(`Table ${TABLE_NAME} does not exist, creating it...`);
            // Create the table with proper column mappings
            const createTableQuery = `
                CREATE TABLE [${TABLE_NAME}] (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    vendor_item NVARCHAR(MAX),
                    vendor_name NVARCHAR(MAX),
                    brand_name NVARCHAR(MAX),
                    dynrex_item NVARCHAR(MAX),
                    description1 NVARCHAR(MAX),
                    description2 NVARCHAR(MAX),
                    description3 NVARCHAR(MAX),
                    inner_inner_pt NVARCHAR(MAX),
                    inner_pt NVARCHAR(MAX),
                    sellable_pt NVARCHAR(MAX),
                    ship_pt NVARCHAR(MAX),
                    outter_ship_pt NVARCHAR(MAX),
                    inner_inner_upc NVARCHAR(MAX),
                    inner_upc NVARCHAR(MAX),
                    sellable_upc NVARCHAR(MAX),
                    ship_upc NVARCHAR(MAX),
                    outter_ship_upc NVARCHAR(MAX),
                    origin NVARCHAR(MAX),
                    last_po_date NVARCHAR(MAX),
                    fob_cost NVARCHAR(MAX),
                    forty_hq NVARCHAR(MAX),
                    hts_code NVARCHAR(MAX),
                    hts_code2 NVARCHAR(MAX),
                    current_duty NVARCHAR(MAX),
                    current_tariff NVARCHAR(MAX),
                    sort_order NVARCHAR(MAX),
                    created_at DATETIME DEFAULT GETDATE()
                )
            `;

            await request.query(createTableQuery);
        }
    }

    async processBatch(rows, startIndex) {
        const request = new sql.Request();

        // Build the values for insertion
        const values = [];
        const columns = VENDOR_ITEMS_COLUMN_MAPPINGS.map(m => `[${m.dbColumn}]`).join(', ');

        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            const row = rows[rowIndex];
            const rowValues = [];

            for (const mapping of VENDOR_ITEMS_COLUMN_MAPPINGS) {
                const rawValue = row[mapping.excelIndex];
                const cleanedValue = this.cleanValue(rawValue);

                if (cleanedValue === null) {
                    rowValues.push('NULL');
                } else {
                    // Escape single quotes for string values
                    const escaped = String(cleanedValue).replace(/'/g, "''");
                    rowValues.push(`'${escaped}'`);
                }
            }

            values.push(`(${rowValues.join(', ')})`);
        }

        // Execute the insert query
        const insertQuery = `
            INSERT INTO [${TABLE_NAME}] (${columns})
            VALUES ${values.join(',\n')}
        `;

        await request.query(insertQuery);
    }

    // Method to clear existing data (optional)
    async clearTable() {
        await sql.connect(this.#dbConfig);
        const request = new sql.Request();
        await request.query(`DELETE FROM [${TABLE_NAME}]`);

        // Reset identity
        try {
            await request.query(`DBCC CHECKIDENT ([${TABLE_NAME}], RESEED, 0)`);
        } catch (error) {
            console.log('Could not reset identity:', error.message);
        }

        await sql.close();
    }

    // Method to validate file before processing
    async validateFile(filePath) {
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(filePath);

            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                return { valid: false, error: 'No worksheets found in the file' };
            }

            if (worksheet.rowCount < 2) {
                return { valid: false, error: 'File must contain headers and at least one data row' };
            }

            return { valid: true };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
}

module.exports = VendorItemsTestUploadHandler; 