const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} = require('@modelcontextprotocol/sdk/types.js');
const ExcelJS = require('exceljs');
const fs = require('fs').promises;
const path = require('path');

class ExcelMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'excel-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'read_excel_file',
            description: 'Read and extract data from an Excel file',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Path to the Excel file'
                },
                sheetName: {
                  type: 'string',
                  description: 'Name of the worksheet (optional, defaults to first sheet)'
                },
                range: {
                  type: 'string',
                  description: 'Cell range to read (e.g., "A1:D10", optional)'
                }
              },
              required: ['filePath']
            }
          },
          {
            name: 'get_excel_sheets',
            description: 'Get list of all worksheets in an Excel file',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Path to the Excel file'
                }
              },
              required: ['filePath']
            }
          },
          {
            name: 'validate_excel_structure',
            description: 'Validate Excel file structure and format',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Path to the Excel file'
                },
                expectedHeaders: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Expected column headers for validation'
                }
              },
              required: ['filePath']
            }
          },
          {
            name: 'convert_excel_to_json',
            description: 'Convert Excel data to JSON format',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Path to the Excel file'
                },
                sheetName: {
                  type: 'string',
                  description: 'Name of the worksheet'
                },
                includeHeaders: {
                  type: 'boolean',
                  description: 'Include headers in output (default: true)'
                }
              },
              required: ['filePath']
            }
          },
          {
            name: 'create_excel_report',
            description: 'Create an Excel report from JSON data',
            inputSchema: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  description: 'Array of objects to write to Excel'
                },
                outputPath: {
                  type: 'string',
                  description: 'Output file path for the Excel report'
                },
                sheetName: {
                  type: 'string',
                  description: 'Name for the worksheet (default: "Report")'
                }
              },
              required: ['data', 'outputPath']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'read_excel_file':
            return await this.readExcelFile(args);
          case 'get_excel_sheets':
            return await this.getExcelSheets(args);
          case 'validate_excel_structure':
            return await this.validateExcelStructure(args);
          case 'convert_excel_to_json':
            return await this.convertExcelToJson(args);
          case 'create_excel_report':
            return await this.createExcelReport(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Error in ${name}: ${error.message}`
        );
      }
    });
  }

  async readExcelFile({ filePath, sheetName, range }) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const worksheet = sheetName 
        ? workbook.getWorksheet(sheetName)
        : workbook.worksheets[0];

      if (!worksheet) {
        throw new Error(`Worksheet '${sheetName}' not found`);
      }

      let data = [];
      
      if (range) {
        const cellRange = worksheet.getCell(range);
        // Handle range reading logic here
        data = this.extractRangeData(worksheet, range);
      } else {
        worksheet.eachRow((row, rowNumber) => {
          const rowData = {};
          row.eachCell((cell, colNumber) => {
            rowData[`col_${colNumber}`] = cell.value;
          });
          data.push(rowData);
        });
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: data,
              metadata: {
                sheetName: worksheet.name,
                rowCount: worksheet.rowCount,
                columnCount: worksheet.columnCount
              }
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to read Excel file: ${error.message}`);
    }
  }

  async getExcelSheets({ filePath }) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const sheets = workbook.worksheets.map(sheet => ({
        name: sheet.name,
        id: sheet.id,
        rowCount: sheet.rowCount,
        columnCount: sheet.columnCount
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              sheets: sheets
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to get Excel sheets: ${error.message}`);
    }
  }

  async validateExcelStructure({ filePath, expectedHeaders }) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      const worksheet = workbook.worksheets[0];
      const headerRow = worksheet.getRow(1);
      
      const actualHeaders = [];
      headerRow.eachCell((cell) => {
        actualHeaders.push(cell.value?.toString() || '');
      });

      const validation = {
        isValid: true,
        missingHeaders: [],
        extraHeaders: [],
        actualHeaders: actualHeaders
      };

      if (expectedHeaders) {
        validation.missingHeaders = expectedHeaders.filter(h => !actualHeaders.includes(h));
        validation.extraHeaders = actualHeaders.filter(h => !expectedHeaders.includes(h));
        validation.isValid = validation.missingHeaders.length === 0;
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              validation: validation
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to validate Excel structure: ${error.message}`);
    }
  }

  async convertExcelToJson({ filePath, sheetName, includeHeaders = true }) {
    try {
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
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: jsonData,
              headers: headers
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to convert Excel to JSON: ${error.message}`);
    }
  }

  async createExcelReport({ data, outputPath, sheetName = 'Report' }) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);

      if (data.length > 0) {
        // Add headers
        const headers = Object.keys(data[0]);
        worksheet.addRow(headers);

        // Add data rows
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
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Excel report created at ${outputPath}`,
              recordCount: data.length
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to create Excel report: ${error.message}`);
    }
  }

  extractRangeData(worksheet, range) {
    // Helper method to extract data from a specific range
    // This is a simplified implementation
    const data = [];
    const cells = worksheet.getCell(range);
    // Add range extraction logic here
    return data;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Excel MCP server running on stdio');
  }
}

// Run the server
if (require.main === module) {
  const server = new ExcelMCPServer();
  server.run().catch(console.error);
}

module.exports = ExcelMCPServer;