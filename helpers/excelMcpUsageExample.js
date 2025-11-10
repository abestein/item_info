/**
 * Excel MCP Integration Usage Examples
 * Demonstrates how transactions agent should use Excel MCP tools
 */

const EnhancedUploadHandler = require('./enhancedUploadHandler');

/**
 * Example: Processing Excel file with MCP enhancement for transactions agent
 */
async function processExcelFileWithMcp(filePath, dbConfig, mcpTools) {
    try {
        // Initialize enhanced handler with MCP tools
        const handler = new EnhancedUploadHandler(dbConfig, mcpTools, true);
        
        // Set progress callback
        handler.setProgressCallback((progress) => {
            console.log(`Progress: ${progress.current}/${progress.total} - ${progress.message}`);
        });

        // 1. Get file information using MCP
        console.log('=== Getting Excel File Information ===');
        const fileInfo = await handler.getFileInfo(filePath);
        console.log('File info:', JSON.stringify(fileInfo, null, 2));

        // 2. Validate file structure with expected headers
        console.log('\n=== Validating File Structure ===');
        const expectedHeaders = [
            'Item #', 'Vendor Name', 'Brand Name', 'Item#', 'Description1',
            'Description2', 'Description3', 'Origin', 'Last PO Date', 'FOB Cost'
        ];
        
        const validation = await handler.validateFile(filePath, expectedHeaders);
        console.log('Validation result:', JSON.stringify(validation, null, 2));

        if (!validation.valid) {
            throw new Error(`File validation failed: ${validation.error}`);
        }

        // 3. Process the Excel file with enhanced capabilities
        console.log('\n=== Processing Excel File ===');
        const result = await handler.processExcelFile(filePath, null, {
            validateStructure: true,
            expectedHeaders: expectedHeaders,
            createBackup: false,
            detailedLogging: true
        });

        console.log('Processing result:', {
            success: result.success,
            totalRows: result.totalRows,
            validRows: result.validRows,
            successfulRows: result.successfulRows,
            mcpEnhanced: result.mcpEnhanced
        });

        return result;

    } catch (error) {
        console.error('Excel processing error:', error.message);
        throw error;
    }
}

/**
 * Example: Converting Excel to JSON for data analysis
 */
async function convertExcelToJsonWithMcp(filePath, mcpTools) {
    try {
        const handler = new EnhancedUploadHandler({}, mcpTools, true);
        
        // Convert Excel to JSON
        console.log('=== Converting Excel to JSON ===');
        const jsonResult = await handler.convertToJson(filePath, null, true);
        
        console.log('Conversion result:', {
            success: jsonResult.success,
            recordCount: jsonResult.data?.length || 0,
            headers: jsonResult.headers
        });

        // Sample data for inspection
        if (jsonResult.data && jsonResult.data.length > 0) {
            console.log('Sample record:', JSON.stringify(jsonResult.data[0], null, 2));
        }

        return jsonResult;

    } catch (error) {
        console.error('JSON conversion error:', error.message);
        throw error;
    }
}

/**
 * Example: Creating Excel report from processed data
 */
async function createReportWithMcp(data, outputPath, mcpTools) {
    try {
        const handler = new EnhancedUploadHandler({}, mcpTools, true);
        
        console.log('=== Creating Excel Report ===');
        const reportResult = await handler.createReport(data, outputPath, {
            sheetName: 'Transaction_Report',
            includeMetadata: true,
            format: 'xlsx'
        });

        console.log('Report creation result:', JSON.stringify(reportResult, null, 2));

        return reportResult;

    } catch (error) {
        console.error('Report creation error:', error.message);
        throw error;
    }
}

/**
 * Example: Batch processing multiple Excel files
 */
async function batchProcessExcelFilesWithMcp(filePaths, dbConfig, mcpTools) {
    const results = [];
    
    for (const filePath of filePaths) {
        try {
            console.log(`\n=== Processing file: ${filePath} ===`);
            const result = await processExcelFileWithMcp(filePath, dbConfig, mcpTools);
            results.push({ filePath, success: true, result });
        } catch (error) {
            console.error(`Failed to process ${filePath}:`, error.message);
            results.push({ filePath, success: false, error: error.message });
        }
    }

    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`\n=== Batch Processing Summary ===`);
    console.log(`Total files: ${filePaths.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);

    return results;
}

/**
 * Example: Using MCP for Excel structure analysis before processing
 */
async function analyzeExcelStructure(filePath, mcpTools) {
    try {
        const handler = new EnhancedUploadHandler({}, mcpTools, true);
        
        console.log('=== Analyzing Excel Structure ===');
        
        // Get detailed file information
        const fileInfo = await handler.getFileInfo(filePath);
        
        // Get capabilities
        const capabilities = handler.getCapabilities();
        
        console.log('Structure analysis:', {
            fileInfo,
            capabilities,
            recommendations: {
                primarySheet: fileInfo.sheets?.[0]?.name,
                totalColumns: fileInfo.sheets?.[0]?.columnCount,
                totalRows: fileInfo.sheets?.[0]?.rowCount,
                hasMultipleSheets: fileInfo.totalSheets > 1
            }
        });

        return { fileInfo, capabilities };

    } catch (error) {
        console.error('Structure analysis error:', error.message);
        throw error;
    }
}

module.exports = {
    processExcelFileWithMcp,
    convertExcelToJsonWithMcp,
    createReportWithMcp,
    batchProcessExcelFilesWithMcp,
    analyzeExcelStructure
};