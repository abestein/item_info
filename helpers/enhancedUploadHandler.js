/**
 * Enhanced Upload Handler with Excel MCP Integration
 * Extends the existing upload functionality with Excel MCP capabilities
 */

const UploadHandler = require('./uploadHandler');
const ExcelMcpHandler = require('./excelMcpHandler');

class EnhancedUploadHandler extends UploadHandler {
    #excelMcpHandler;
    #useMcp;

    constructor(dbConfig, mcpTools = null, useMcp = true) {
        super(dbConfig);
        this.#excelMcpHandler = new ExcelMcpHandler(mcpTools);
        this.#useMcp = useMcp && mcpTools !== null;
    }

    /**
     * Set MCP tools (when running as agent)
     */
    setMcpTools(mcpTools) {
        this.#excelMcpHandler.setMcpTools(mcpTools);
        this.#useMcp = mcpTools !== null;
    }

    /**
     * Enhanced progress callback that works with both handlers
     */
    setProgressCallback(callback) {
        super.setProgressCallback(callback);
        this.#excelMcpHandler.setProgressCallback(callback);
    }

    /**
     * Enhanced file validation with MCP support
     */
    async validateFile(filePath, expectedHeaders = null) {
        try {
            if (this.#useMcp) {
                // Use Excel MCP for enhanced validation
                const mcpResult = await this.#excelMcpHandler.validateExcelFile(filePath, expectedHeaders);
                
                if (!mcpResult.valid) {
                    return { valid: false, error: mcpResult.error };
                }

                // Additional validation for specific business rules
                if (expectedHeaders && mcpResult.missingHeaders.length > 0) {
                    return {
                        valid: false,
                        error: `Missing required headers: ${mcpResult.missingHeaders.join(', ')}`,
                        actualHeaders: mcpResult.actualHeaders,
                        missingHeaders: mcpResult.missingHeaders,
                        extraHeaders: mcpResult.extraHeaders
                    };
                }

                return {
                    valid: true,
                    actualHeaders: mcpResult.actualHeaders,
                    message: 'File validation passed with Excel MCP'
                };
            } else {
                // Fallback to parent class validation
                return await super.validateFile(filePath);
            }
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    /**
     * Get detailed information about Excel file structure
     */
    async getFileInfo(filePath) {
        try {
            if (this.#useMcp) {
                const sheetsInfo = await this.#excelMcpHandler.getExcelSheets(filePath);
                
                return {
                    success: true,
                    sheets: sheetsInfo.sheets,
                    totalSheets: sheetsInfo.sheets.length,
                    recommendedSheet: sheetsInfo.sheets[0]?.name || null,
                    mcpEnhanced: true
                };
            } else {
                // Basic file info using ExcelJS
                const ExcelJS = require('exceljs');
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.readFile(filePath);

                const sheets = workbook.worksheets.map(sheet => ({
                    name: sheet.name,
                    id: sheet.id,
                    rowCount: sheet.rowCount,
                    columnCount: sheet.columnCount
                }));

                return {
                    success: true,
                    sheets: sheets,
                    totalSheets: sheets.length,
                    recommendedSheet: sheets[0]?.name || null,
                    mcpEnhanced: false
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Enhanced Excel processing with MCP integration
     */
    async processExcelFile(filePath, sheetName = null, options = {}) {
        try {
            const {
                validateStructure = true,
                expectedHeaders = null,
                createBackup = false,
                detailedLogging = true
            } = options;

            // Pre-validation with MCP if available
            if (validateStructure && this.#useMcp) {
                this.updateProgress(0, 100, 'Performing enhanced validation...');
                
                const validationResult = await this.validateFile(filePath, expectedHeaders);
                if (!validationResult.valid) {
                    throw new Error(`File validation failed: ${validationResult.error}`);
                }

                if (detailedLogging) {
                    console.log('Excel MCP validation passed:', {
                        headers: validationResult.actualHeaders,
                        mcpEnhanced: true
                    });
                }
            }

            // Get file information if MCP is available
            if (this.#useMcp && detailedLogging) {
                const fileInfo = await this.getFileInfo(filePath);
                console.log('Excel file info:', fileInfo);
                
                // Use recommended sheet if no sheet specified
                if (!sheetName && fileInfo.recommendedSheet) {
                    sheetName = fileInfo.recommendedSheet;
                }
            }

            this.updateProgress(10, 100, 'Starting Excel processing...');

            // Delegate to parent class for actual processing
            const result = await super.processExcelFile(filePath, sheetName);

            // Enhance result with MCP information
            return {
                ...result,
                mcpEnhanced: this.#useMcp,
                excelMcpAvailable: this.#excelMcpHandler.isMcpAvailable(),
                availableMcpTools: this.#excelMcpHandler.getAvailableMcpTools()
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Create Excel report from processed data
     */
    async createReport(data, outputPath, reportOptions = {}) {
        const {
            sheetName = 'Report',
            includeMetadata = true,
            format = 'xlsx'
        } = reportOptions;

        try {
            if (this.#useMcp) {
                // Use Excel MCP for report creation
                const result = await this.#excelMcpHandler.createExcelReport(data, outputPath, sheetName);
                
                return {
                    ...result,
                    mcpGenerated: true
                };
            } else {
                // Fallback to basic Excel generation
                const ExcelJS = require('exceljs');
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet(sheetName);

                if (data.length > 0) {
                    const headers = Object.keys(data[0]);
                    worksheet.addRow(headers);
                    
                    data.forEach(item => {
                        const row = headers.map(header => item[header]);
                        worksheet.addRow(row);
                    });

                    // Auto-fit columns
                    worksheet.columns.forEach(column => {
                        column.width = 15;
                    });
                }

                await workbook.xlsx.writeFile(outputPath);

                return {
                    success: true,
                    message: `Report created at ${outputPath}`,
                    recordCount: data.length,
                    filePath: outputPath,
                    mcpGenerated: false
                };
            }
        } catch (error) {
            throw new Error(`Report creation failed: ${error.message}`);
        }
    }

    /**
     * Convert Excel file to JSON with MCP enhancement
     */
    async convertToJson(filePath, sheetName = null, includeHeaders = true) {
        try {
            if (this.#useMcp) {
                return await this.#excelMcpHandler.convertExcelToJson(filePath, sheetName, includeHeaders);
            } else {
                // Fallback to basic conversion
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
        } catch (error) {
            throw new Error(`JSON conversion failed: ${error.message}`);
        }
    }

    /**
     * Get handler capabilities
     */
    getCapabilities() {
        return {
            mcpAvailable: this.#useMcp,
            mcpTools: this.#excelMcpHandler.getAvailableMcpTools(),
            features: {
                enhancedValidation: this.#useMcp,
                structureAnalysis: this.#useMcp,
                multiSheetSupport: true,
                reportGeneration: this.#useMcp,
                jsonConversion: true,
                batchProcessing: true,
                progressTracking: true
            }
        };
    }
}

module.exports = EnhancedUploadHandler;