const ExcelJS = require('exceljs');
const sql = require('mssql');

// Define the table structure and column mappings
const TABLE_NAME = 'ItemVendorDetails';
const COLUMN_MAPPINGS = [
    { excelIndex: 0, dbColumn: 'Item #', type: 'VARCHAR' },
    { excelIndex: 1, dbColumn: 'Vendor Name', type: 'VARCHAR' },
    { excelIndex: 2, dbColumn: 'Brand Name', type: 'VARCHAR' },
    { excelIndex: 3, dbColumn: 'Item#', type: 'VARCHAR' },
    { excelIndex: 4, dbColumn: 'Description1', type: 'VARCHAR' },
    { excelIndex: 5, dbColumn: 'Description2', type: 'VARCHAR' },
    { excelIndex: 6, dbColumn: 'Description3', type: 'VARCHAR' },
    { excelIndex: 7, dbColumn: 'PI_Inner - 2', type: 'VARCHAR' },
    { excelIndex: 8, dbColumn: 'PI_Inner - 1', type: 'VARCHAR' },
    { excelIndex: 9, dbColumn: 'PI_Sellable', type: 'VARCHAR' },
    { excelIndex: 10, dbColumn: 'PI_Ship + 1', type: 'VARCHAR' },
    { excelIndex: 11, dbColumn: 'PI_Ship + 2', type: 'VARCHAR' },
    { excelIndex: 12, dbColumn: 'Inner - 2', type: 'VARCHAR' },
    { excelIndex: 13, dbColumn: 'Inner - 1', type: 'VARCHAR' },
    { excelIndex: 14, dbColumn: 'Sellable', type: 'VARCHAR' },
    { excelIndex: 15, dbColumn: 'Ship + 1', type: 'VARCHAR' },
    { excelIndex: 16, dbColumn: 'Ship + 2', type: 'VARCHAR' },
    { excelIndex: 17, dbColumn: 'Origin', type: 'VARCHAR' },
    { excelIndex: 18, dbColumn: 'Last PO Date', type: 'DATE' },
    { excelIndex: 19, dbColumn: 'FOB Cost', type: 'DECIMAL' },
    { excelIndex: 20, dbColumn: '40HQ', type: 'INT' },
    { excelIndex: 21, dbColumn: 'HTS Code', type: 'VARCHAR' },
    { excelIndex: 22, dbColumn: '9817.00.96', type: 'VARCHAR' },
    { excelIndex: 23, dbColumn: 'Current Duty', type: 'DECIMAL' },
    { excelIndex: 24, dbColumn: 'Current Tariff', type: 'DECIMAL' },
    { excelIndex: 25, dbColumn: 'Sort Order', type: 'INT' }
];

// Fields that need X/empty to NULL conversion
const FIELDS_NEED_X_CLEANUP = [
    'PI_Inner - 2', 'PI_Inner - 1', 'PI_Sellable', 'PI_Ship + 1', 'PI_Ship + 2',
    'Inner - 2', 'Inner - 1', 'Sellable', 'Ship + 1', 'Ship + 2'
];

// Fields that need percentage cleanup
const FIELDS_NEED_PERCENT_CLEANUP = ['Current Duty', 'Current Tariff'];

// Essential fields for empty row detection
const ESSENTIAL_FIELDS = [
    { excelIndex: 0, dbColumn: 'Item #' },
    { excelIndex: 1, dbColumn: 'Vendor Name' },
    { excelIndex: 3, dbColumn: 'Item#' }
];

class UploadHandler {
    constructor(dbConfig) {
        this.dbConfig = dbConfig;
        this.progressCallback = null;
    }

    setProgressCallback(callback) {
        this.progressCallback = callback;
    }

    updateProgress(current, total, message) {
        if (this.progressCallback) {
            this.progressCallback({ current, total, message });
        }
    }

    // New method to check if a row is empty
    isRowEmpty(row) {
        // Check if all essential fields are empty
        for (const field of ESSENTIAL_FIELDS) {
            const value = row[field.excelIndex];
            // If any essential field has a value, the row is not empty
            if (value !== null && value !== undefined && String(value).trim() !== '') {
                return false;
            }
        }
        return true;
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

    cleanValue(value, columnName, columnType) {
        // Handle null/undefined
        if (value === null || value === undefined || value === '') {
            // For fields that need X cleanup, return NULL
            if (FIELDS_NEED_X_CLEANUP.includes(columnName)) {
                return null;
            }
            // For other fields, return null for empty values
            return null;
        }

        // Convert to string for processing
        const strValue = String(value).trim();

        // Handle X to NULL conversion for specific fields
        if (FIELDS_NEED_X_CLEANUP.includes(columnName)) {
            if (strValue.toUpperCase() === 'X' || strValue === '') {
                return null;
            }
        }

        // Handle percentage to decimal conversion
        if (FIELDS_NEED_PERCENT_CLEANUP.includes(columnName)) {
            if (strValue.includes('%')) {
                // Remove % and convert to decimal
                const numValue = parseFloat(strValue.replace('%', ''));
                if (!isNaN(numValue)) {
                    return numValue; // Store as percentage value, not decimal
                }
            }
            // Also try parsing as regular number
            const numValue = parseFloat(strValue);
            if (!isNaN(numValue)) {
                return numValue;
            }
        }

        // Handle date values
        if (columnType === 'DATE') {
            if (value instanceof Date) {
                return value;
            }
            if (strValue) {
                // Try parsing as regular date
                const date = new Date(strValue);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
            return null;
        }

        // Handle numeric types
        if (columnType === 'INT') {
            const num = parseInt(strValue);
            return isNaN(num) ? null : num;
        }

        if (columnType === 'DECIMAL') {
            // Remove $ sign if present for FOB Cost
            const cleanStr = strValue.replace('$', '').replace(',', '');
            const num = parseFloat(cleanStr);
            return isNaN(num) ? null : num;
        }

        // Return as string for VARCHAR
        return strValue;
    }

    async processExcelFile(filePath, sheetName = null) {
        try {
            this.updateProgress(0, 100, 'Reading Excel file...');

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
                for (let colNumber = 1; colNumber <= COLUMN_MAPPINGS.length; colNumber++) {
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

            // Filter out empty rows
            const dataRows = [];
            const emptyRowIndices = [];

            for (let i = 0; i < allDataRows.length; i++) {
                if (this.isRowEmpty(allDataRows[i])) {
                    emptyRowIndices.push(i + 2); // +2 because Excel rows start at 1 and we skipped header
                } else {
                    dataRows.push(allDataRows[i]);
                }
            }

            const totalRows = dataRows.length;
            const skippedRows = emptyRowIndices.length;

            this.updateProgress(10, 100, `Found ${totalRows} valid rows to process (skipped ${skippedRows} empty rows)`);

            if (totalRows === 0) {
                throw new Error('No valid data rows found in the Excel file');
            }

            // Connect to database
            await sql.connect(this.dbConfig);

            // Process in batches
            const batchSize = 100;
            let processedRows = 0;
            let successfulRows = 0;
            const errors = [];

            for (let i = 0; i < dataRows.length; i += batchSize) {
                const batch = dataRows.slice(i, Math.min(i + batchSize, dataRows.length));

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
                this.updateProgress(
                    processedRows,
                    totalRows,
                    `Processing rows... (${processedRows}/${totalRows})`
                );
            }

            this.updateProgress(95, 100, 'Finalizing...');

            // Get preview of inserted data
            const request = new sql.Request();
            const previewResult = await request.query(`
                SELECT TOP 5 * FROM [${TABLE_NAME}] 
                ORDER BY ID DESC
            `);

            await sql.close();

            this.updateProgress(100, 100, 'Upload complete!');

            return {
                success: true,
                totalRows: allDataRows.length,
                validRows: totalRows,
                skippedRows: skippedRows,
                skippedRowIndices: emptyRowIndices.slice(0, 10), // First 10 skipped row numbers
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

    async processBatch(rows, startIndex) {
        const request = new sql.Request();

        // Build the values for insertion
        const values = [];
        const columns = COLUMN_MAPPINGS.map(m => `[${m.dbColumn}]`).join(', ');

        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            const row = rows[rowIndex];
            const rowValues = [];

            for (const mapping of COLUMN_MAPPINGS) {
                const rawValue = row[mapping.excelIndex];
                const cleanedValue = this.cleanValue(rawValue, mapping.dbColumn, mapping.type);

                if (cleanedValue === null) {
                    rowValues.push('NULL');
                } else if (mapping.type === 'DATE') {
                    // Format date for SQL Server
                    const dateStr = cleanedValue.toISOString().split('T')[0];
                    rowValues.push(`'${dateStr}'`);
                } else if (mapping.type === 'VARCHAR') {
                    // Escape single quotes
                    const escaped = String(cleanedValue).replace(/'/g, "''");
                    rowValues.push(`'${escaped}'`);
                } else {
                    // Numeric values
                    rowValues.push(cleanedValue);
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
        await sql.connect(this.dbConfig);
        const request = new sql.Request();
        await request.query(`DELETE FROM [${TABLE_NAME}]`);
        await request.query(`DBCC CHECKIDENT ([${TABLE_NAME}], RESEED, 0)`);
        await sql.close();
    }

    // New method to validate file before processing
    async validateFile(filePath) {
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(filePath);

            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                return { valid: false, error: 'No worksheets found in the file' };
            }

            // Get the first row to check headers
            const headerRow = worksheet.getRow(1);
            const headerCount = headerRow.actualCellCount;

            if (worksheet.rowCount < 2) {
                return { valid: false, error: 'File must contain headers and at least one data row' };
            }

            // Check if we have the expected number of columns
            if (headerCount < COLUMN_MAPPINGS.length) {
                return {
                    valid: false,
                    error: `Expected ${COLUMN_MAPPINGS.length} columns, but found ${headerCount}`
                };
            }

            return { valid: true };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
}

module.exports = UploadHandler;