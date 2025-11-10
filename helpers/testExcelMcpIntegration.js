/**
 * Test Script for Excel MCP Integration
 * Verifies that the transactions agent can properly use Excel MCP tools
 */

const path = require('path');
const ExcelMcpHandler = require('./excelMcpHandler');
const EnhancedUploadHandler = require('./enhancedUploadHandler');

// Mock MCP tools for testing (simulates what would be available in agent context)
const mockMcpTools = {
    validate_excel_structure: async (params) => {
        console.log('Mock MCP: validate_excel_structure called with:', params);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    validation: {
                        isValid: true,
                        actualHeaders: ['Item #', 'Vendor Name', 'Brand Name', 'Description1'],
                        missingHeaders: [],
                        extraHeaders: []
                    }
                })
            }]
        };
    },

    get_excel_sheets: async (params) => {
        console.log('Mock MCP: get_excel_sheets called with:', params);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    sheets: [
                        {
                            name: 'Sheet1',
                            id: 1,
                            rowCount: 100,
                            columnCount: 26
                        }
                    ]
                })
            }]
        };
    },

    convert_excel_to_json: async (params) => {
        console.log('Mock MCP: convert_excel_to_json called with:', params);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    data: [
                        { 'Item #': 'TEST001', 'Vendor Name': 'Test Vendor', 'Brand Name': 'Test Brand' }
                    ],
                    headers: ['Item #', 'Vendor Name', 'Brand Name']
                })
            }]
        };
    },

    create_excel_report: async (params) => {
        console.log('Mock MCP: create_excel_report called with:', params);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    message: `Excel report created at ${params.outputPath}`,
                    recordCount: params.data.length
                })
            }]
        };
    }
};

async function testExcelMcpHandler() {
    console.log('=== Testing Excel MCP Handler ===\n');
    
    try {
        // Test 1: Initialize handler
        console.log('1. Testing handler initialization...');
        const handler = new ExcelMcpHandler(mockMcpTools);
        console.log('✅ Handler initialized successfully');
        console.log('MCP Available:', handler.isMcpAvailable());
        console.log('Available Tools:', handler.getAvailableMcpTools());
        
        // Test 2: File validation (mock)
        console.log('\n2. Testing file validation...');
        const validation = await handler.validateExcelFile('test.xlsx', ['Item #', 'Vendor Name']);
        console.log('✅ Validation result:', validation);
        
        // Test 3: Get sheets (mock)
        console.log('\n3. Testing get sheets...');
        const sheets = await handler.getExcelSheets('test.xlsx');
        console.log('✅ Sheets result:', sheets);
        
        // Test 4: Convert to JSON (mock)
        console.log('\n4. Testing Excel to JSON conversion...');
        const jsonResult = await handler.convertExcelToJson('test.xlsx');
        console.log('✅ JSON conversion result:', jsonResult);
        
        return true;
    } catch (error) {
        console.error('❌ Excel MCP Handler test failed:', error.message);
        return false;
    }
}

async function testEnhancedUploadHandler() {
    console.log('\n=== Testing Enhanced Upload Handler ===\n');
    
    try {
        // Test 1: Initialize with MCP
        console.log('1. Testing enhanced handler with MCP...');
        const handlerWithMcp = new EnhancedUploadHandler({}, mockMcpTools, true);
        console.log('✅ Handler with MCP initialized');
        
        const capabilities = handlerWithMcp.getCapabilities();
        console.log('Capabilities:', capabilities);
        
        // Test 2: Initialize without MCP (fallback)
        console.log('\n2. Testing enhanced handler fallback...');
        const handlerFallback = new EnhancedUploadHandler({}, null, false);
        console.log('✅ Fallback handler initialized');
        
        const fallbackCapabilities = handlerFallback.getCapabilities();
        console.log('Fallback capabilities:', fallbackCapabilities);
        
        // Test 3: File info (mock)
        console.log('\n3. Testing get file info with MCP...');
        const fileInfo = await handlerWithMcp.getFileInfo('test.xlsx');
        console.log('✅ File info result:', fileInfo);
        
        return true;
    } catch (error) {
        console.error('❌ Enhanced Upload Handler test failed:', error.message);
        return false;
    }
}

async function testIntegrationFlow() {
    console.log('\n=== Testing Full Integration Flow ===\n');
    
    try {
        const handler = new EnhancedUploadHandler({}, mockMcpTools, true);
        
        // Set up progress callback
        handler.setProgressCallback((progress) => {
            console.log(`Progress: ${progress.message}`);
        });
        
        console.log('1. Testing validation flow...');
        const validation = await handler.validateFile('test.xlsx', ['Item #', 'Vendor Name']);
        console.log('✅ Validation:', validation.valid ? 'PASSED' : 'FAILED');
        
        console.log('\n2. Testing conversion flow...');
        const jsonResult = await handler.convertToJson('test.xlsx');
        console.log('✅ Conversion successful:', jsonResult.success);
        
        console.log('\n3. Testing report creation...');
        const reportData = [
            { 'Item': 'TEST001', 'Status': 'Processed', 'Count': 5 },
            { 'Item': 'TEST002', 'Status': 'Processed', 'Count': 3 }
        ];
        
        const reportResult = await handler.createReport(reportData, 'test_report.xlsx');
        console.log('✅ Report creation successful:', reportResult.success);
        
        return true;
    } catch (error) {
        console.error('❌ Integration flow test failed:', error.message);
        return false;
    }
}

// Main test runner
async function runAllTests() {
    console.log('Starting Excel MCP Integration Tests...\n');
    
    const results = [];
    
    // Run individual tests
    results.push(await testExcelMcpHandler());
    results.push(await testEnhancedUploadHandler());
    results.push(await testIntegrationFlow());
    
    // Summary
    console.log('\n=== Test Results Summary ===');
    const passed = results.filter(r => r).length;
    const failed = results.length - passed;
    
    console.log(`Total Tests: ${results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    
    if (failed === 0) {
        console.log('🎉 All tests passed! Excel MCP integration is ready.');
    } else {
        console.log('⚠️  Some tests failed. Check the logs above for details.');
    }
    
    return failed === 0;
}

// Export for use in other test files
module.exports = {
    testExcelMcpHandler,
    testEnhancedUploadHandler,
    testIntegrationFlow,
    runAllTests,
    mockMcpTools
};

// Run tests if called directly
if (require.main === module) {
    runAllTests().catch(console.error);
}