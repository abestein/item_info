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

const { ValidationError, ProcessingError } = require('../utils/errors');

class VendorItemsTempUploadHandler {
    #dbConfig;
    #progressCallback;

    constructor(dbConfig) {
        this.#dbConfig = dbConfig;
        this.#progressCallback = null;
    }

    setProgressCallback(callback) {
        if (typeof callback !== 'function') {
            throw new ValidationError('Progress callback must be a function');
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

    async processExcelFile(filePath, sheetName = null) {
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
                const progress = 10 + (processedRows / totalRows) * 80; // 10-90% for processing
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
                // Get preview ordered by the ID column (uppercase as shown in table structure)
                previewResult = await request.query(`
                    SELECT TOP 5 * FROM [${TABLE_NAME}] 
                    ORDER BY ID DESC
                `);
            } catch (error) {
                // If ID column doesn't exist, try without ORDER BY
                try {
                    previewResult = await request.query(`
                        SELECT TOP 5 * FROM [${TABLE_NAME}]
                    `);
                } catch (innerError) {
                    // If still fails, just return empty preview
                    console.warn('Could not fetch preview data:', innerError.message);
                }
            }

            await sql.close();

            this.#updateProgress(100, 100, 'Upload complete!');

            return {
                success: true,
                totalRows: allDataRows.length,
                validRows: totalRows,
                skippedRows: skippedCount,
                skippedRowIndices: skippedRows.slice(0, 10), // First 10 skipped row numbers
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
            // Create the table
            const createTableQuery = `
                CREATE TABLE [${TABLE_NAME}] (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    column1 NVARCHAR(MAX),
                    column2 NVARCHAR(MAX),
                    column3 NVARCHAR(MAX),
                    column4 NVARCHAR(MAX),
                    column5 NVARCHAR(MAX),
                    column6 NVARCHAR(MAX),
                    column7 NVARCHAR(MAX),
                    column8 NVARCHAR(MAX),
                    column9 NVARCHAR(MAX),
                    column10 NVARCHAR(MAX),
                    column11 NVARCHAR(MAX),
                    column12 NVARCHAR(MAX),
                    column13 NVARCHAR(MAX),
                    column14 NVARCHAR(MAX),
                    column15 NVARCHAR(MAX),
                    column16 NVARCHAR(MAX),
                    column17 NVARCHAR(MAX),
                    column18 NVARCHAR(MAX),
                    column19 NVARCHAR(MAX),
                    column20 NVARCHAR(MAX),
                    column21 NVARCHAR(MAX),
                    column22 NVARCHAR(MAX),
                    column23 NVARCHAR(MAX),
                    column24 NVARCHAR(MAX),
                    column25 NVARCHAR(MAX),
                    column26 NVARCHAR(MAX),
                    created_at DATETIME DEFAULT GETDATE()
                )
            `;
            
            await request.query(createTableQuery);
        } else {
            console.log(`Table ${TABLE_NAME} exists, checking column structure...`);
            
            // Check actual columns in the table
            const columnsQuery = `
                SELECT COLUMN_NAME, DATA_TYPE, ORDINAL_POSITION
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${TABLE_NAME}'
                ORDER BY ORDINAL_POSITION
            `;
            const columns = await request.query(columnsQuery);
            console.log('Actual table columns:');
            columns.recordset.forEach(col => {
                console.log(`  ${col.ORDINAL_POSITION}: ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
            });
        }
    }

    async processBatch(rows, startIndex) {
        const request = new sql.Request();

        // Build the values for insertion
        const values = [];
        const columns = VENDOR_ITEMS_COLUMN_MAPPINGS.map(m => `[${m.dbColumn}]`).join(', ');
        
        console.log('Column mappings count:', VENDOR_ITEMS_COLUMN_MAPPINGS.length);
        console.log('Columns to insert:', columns);

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

        console.log('First few characters of insert query:', insertQuery.substring(0, 500));
        await request.query(insertQuery);
    }

    // Method to clear existing data (optional)
    async clearTable() {
        await sql.connect(this.#dbConfig);
        const request = new sql.Request();
        await request.query(`DELETE FROM [${TABLE_NAME}]`);
        
        // Only reset identity if the table has an identity column
        try {
            await request.query(`DBCC CHECKIDENT ([${TABLE_NAME}], RESEED, 0)`);
        } catch (error) {
            // Ignore error if table doesn't have identity column
            if (!error.message.includes('does not contain an identity column')) {
                throw error;
            }
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

module.exports = VendorItemsTempUploadHandler;