/**
 * Excel MCP Integration Handler
 * Provides enhanced Excel processing capabilities by integrating with Excel MCP server
 * while maintaining compatibility with existing upload handlers
 */

class ExcelMcpHandler {
    #mcpTools;
    #progressCallback;

    constructor(mcpTools = null) {
        this.#mcpTools = mcpTools;
        this.#progressCallback = null;
    }

    /**
     * Set the MCP tools instance (available when running as agent)
     */
    setMcpTools(mcpTools) {
        this.#mcpTools = mcpTools;
    }

    /**
     * Set progress callback for reporting processing status
     */
    setProgressCallback(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Progress callback must be a function');
        }
        this.#progressCallback = callback;
    }

    /**
     * Update progress if callback is set
     */
    #updateProgress(current, total, message) {
        if (this.#progressCallback) {
            this.#progressCallback({ current, total, message });
        }
    }

    /**
     * Enhanced file validation using Excel MCP
     */
    async validateExcelFile(filePath, expectedHeaders = null) {
        try {
            this.#updateProgress(0, 100, 'Validating Excel file structure...');

            if (this.#mcpTools && this.#mcpTools.validate_excel_structure) {
                // Use Excel MCP for enhanced validation
                const result = await this.#mcpTools.validate_excel_structure({
                    filePath: filePath,
                    expectedHeaders: expectedHeaders
                });

                this.#updateProgress(50, 100, 'Processing validation results...');

                const validation = JSON.parse(result.content[0].text);
                
                if (!validation.success) {
                    throw new Error(`Excel MCP validation failed: ${validation.error || 'Unknown error'}`);
                }

                this.#updateProgress(100, 100, 'Validation complete');

                return {
                    valid: validation.validation.isValid,
                    actualHeaders: validation.validation.actualHeaders,
                    missingHeaders: validation.validation.missingHeaders || [],
                    extraHeaders: validation.validation.extraHeaders || [],
                    error: validation.validation.isValid ? null : 
                           `Missing headers: ${validation.validation.missingHeaders?.join(', ') || 'none'}`
                };
            } else {
                // Fallback to basic validation
                return await this.#basicFileValidation(filePath, expectedHeaders);
            }
        } catch (error) {
            throw new Error(`Excel file validation failed: ${error.message}`);
        }
    }

    /**
     * Get Excel worksheets using MCP or fallback
     */
    async getExcelSheets(filePath) {
        try {
            this.#updateProgress(0, 100, 'Reading Excel worksheets...');

            if (this.#mcpTools && this.#mcpTools.get_excel_sheets) {
                // Use Excel MCP
                const result = await this.#mcpTools.get_excel_sheets({ filePath: filePath });
                const data = JSON.parse(result.content[0].text);
                
                if (!data.success) {
                    throw new Error(`Excel MCP failed: ${data.error || 'Unknown error'}`);
                }

                this.#updateProgress(100, 100, 'Worksheets retrieved');
                
                return {
                    success: true,
                    sheets: data.sheets.map(sheet => ({
                        name: sheet.name,
                        id: sheet.id,
                        rowCount: sheet.rowCount,
                        columnCount: sheet.columnCount
                    }))
                };
            } else {
                // Fallback to ExcelJS
                return await this.#getExcelSheetsBasic(filePath);
            }
        } catch (error) {
            throw new Error(`Failed to get Excel sheets: ${error.message}`);
        }
    }

    /**
     * Convert Excel to JSON using MCP with fallback
     */
    async convertExcelToJson(filePath, sheetName = null, includeHeaders = true) {
        try {
            this.#updateProgress(0, 100, 'Converting Excel to JSON...');

            if (this.#mcpTools && this.#mcpTools.convert_excel_to_json) {
                // Use Excel MCP
                const params = { 
                    filePath: filePath,
                    includeHeaders: includeHeaders
                };
                
                if (sheetName) {
                    params.sheetName = sheetName;
                }

                const result = await this.#mcpTools.convert_excel_to_json(params);
                const data = JSON.parse(result.content[0].text);
                
                if (!data.success) {
                    throw new Error(`Excel MCP conversion failed: ${data.error || 'Unknown error'}`);
                }

                this.#updateProgress(100, 100, 'Conversion complete');

                return {
                    success: true,
                    data: data.data,
                    headers: data.headers
                };
            } else {
                // Fallback to basic conversion
                return await this.#convertExcelToJsonBasic(filePath, sheetName, includeHeaders);
            }
        } catch (error) {
            throw new Error(`Excel to JSON conversion failed: ${error.message}`);
        }
    }

    /**
     * Create Excel report using MCP
     */
    async createExcelReport(data, outputPath, sheetName = 'Report') {
        try {
            this.#updateProgress(0, 100, 'Creating Excel report...');

            if (this.#mcpTools && this.#mcpTools.create_excel_report) {
                // Use Excel MCP
                const result = await this.#mcpTools.create_excel_report({
                    data: data,
                    outputPath: outputPath,
                    sheetName: sheetName
                });

                const response = JSON.parse(result.content[0].text);
                
                if (!response.success) {
                    throw new Error(`Excel MCP report creation failed: ${response.error || 'Unknown error'}`);
                }

                this.#updateProgress(100, 100, 'Report created successfully');

                return {
                    success: true,
                    message: response.message,
                    recordCount: response.recordCount,
                    filePath: outputPath
                };
            } else {
                // Fallback implementation would go here
                throw new Error('Excel MCP not available and no fallback implemented for report creation');
            }
        } catch (error) {
            throw new Error(`Excel report creation failed: ${error.message}`);
        }
    }

    /**
     * Enhanced Excel reading with better error handling and progress tracking
     */
    async readExcelFile(filePath, sheetName = null, range = null) {
        try {
            this.#updateProgress(0, 100, 'Reading Excel file...');

            if (this.#mcpTools && this.#mcpTools.read_excel_file) {
                // Use Excel MCP
                const params = { filePath: filePath };
                if (sheetName) params.sheetName = sheetName;
                if (range) params.range = range;

                const result = await this.#mcpTools.read_excel_file(params);
                const data = JSON.parse(result.content[0].text);
                
                if (!data.success) {
                    throw new Error(`Excel MCP read failed: ${data.error || 'Unknown error'}`);
                }

                this.#updateProgress(100, 100, 'File read complete');

                return {
                    success: true,
                    data: data.data,
                    metadata: data.metadata
                };
            } else {
                // Fallback to basic reading
                return await this.#readExcelFileBasic(filePath, sheetName, range);
            }
        } catch (error) {
            throw new Error(`Excel file reading failed: ${error.message}`);
        }
    }

    /**
     * Check if Excel MCP is available
     */
    isMcpAvailable() {
        return this.#mcpTools !== null;
    }

    /**
     * Get available MCP tool names
     */
    getAvailableMcpTools() {
        if (!this.#mcpTools) return [];
        return Object.keys(this.#mcpTools).filter(key => typeof this.#mcpTools[key] === 'function');
    }

    // Fallback implementations using ExcelJS
    async #basicFileValidation(filePath, expectedHeaders) {
        const ExcelJS = require('exceljs');
        
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

            // Get headers
            const headerRow = worksheet.getRow(1);
            const actualHeaders = [];
            headerRow.eachCell((cell) => {
                actualHeaders.push(cell.value?.toString() || '');
            });

            if (expectedHeaders) {
                const missingHeaders = expectedHeaders.filter(h => !actualHeaders.includes(h));
                const extraHeaders = actualHeaders.filter(h => !expectedHeaders.includes(h));
                
                return {
                    valid: missingHeaders.length === 0,
                    actualHeaders: actualHeaders,
                    missingHeaders: missingHeaders,
                    extraHeaders: extraHeaders,
                    error: missingHeaders.length > 0 ? `Missing headers: ${missingHeaders.join(', ')}` : null
                };
            }

            return { valid: true, actualHeaders: actualHeaders };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    async #getExcelSheetsBasic(filePath) {
        const ExcelJS = require('exceljs');
        
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const sheets = workbook.worksheets.map(sheet => ({
            name: sheet.name,
            id: sheet.id,
            rowCount: sheet.rowCount,
            columnCount: sheet.columnCount
        }));

        return { success: true, sheets: sheets };
    }

    async #convertExcelToJsonBasic(filePath, sheetName, includeHeaders) {
        const ExcelJS = require('exceljs');
        
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = sheetName 
            ? workbook.getWorksheet(sheetName)
            : workbook.worksheets[0];

        const jsonData = [];
        let headers = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1 && includeHeaders) {
                row.eachCell((cell) => {
                    headers.push(cell.value?.toString() || `Column_${headers.length + 1}`);
                });
            } else {
                const rowData = {};
                row.eachCell((cell, colNumber) => {
                    const key = headers[colNumber - 1] || `col_${colNumber}`;
                    rowData[key] = cell.value;
                });
                jsonData.push(rowData);
            }
        });

        return {
            success: true,
            data: jsonData,
            headers: headers
        };
    }

    async #readExcelFileBasic(filePath, sheetName, range) {
        const ExcelJS = require('exceljs');
        
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = sheetName 
            ? workbook.getWorksheet(sheetName)
            : workbook.worksheets[0];

        if (!worksheet) {
            throw new Error(`Worksheet '${sheetName}' not found`);
        }

        let data = [];
        
        worksheet.eachRow((row, rowNumber) => {
            const rowData = {};
            row.eachCell((cell, colNumber) => {
                rowData[`col_${colNumber}`] = cell.value;
            });
            data.push(rowData);
        });

        return {
            success: true,
            data: data,
            metadata: {
                sheetName: worksheet.name,
                rowCount: worksheet.rowCount,
                columnCount: worksheet.columnCount
            }
        };
    }
}

module.exports = ExcelMcpHandler;