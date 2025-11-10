const ExcelMCPServer = require('./.agents/data-agents/excel-mcp/index.js');

async function testExcelMCP() {
    try {
        const mcpServer = new ExcelMCPServer();
        
        // Test get_excel_sheets
        console.log("=== Getting Excel Sheets ===");
        const sheetsResult = await mcpServer.getExcelSheets({
            filePath: "C:\\Users\\A.Stein\\Downloads\\DATA TEAM ACTIVE SHEET_ 7-17-2025.xlsx"
        });
        console.log(JSON.parse(sheetsResult.content[0].text));
        
        // Test convert_excel_to_json for first 10 rows
        console.log("\n=== Converting Excel to JSON (first 10 rows) ===");
        const jsonResult = await mcpServer.convertExcelToJson({
            filePath: "C:\\Users\\A.Stein\\Downloads\\DATA TEAM ACTIVE SHEET_ 7-17-2025.xlsx",
            includeHeaders: true
        });
        
        const jsonData = JSON.parse(jsonResult.content[0].text);
        console.log("Headers:", jsonData.headers);
        console.log("Sample data (first 5 rows):");
        console.log(JSON.stringify(jsonData.data.slice(0, 5), null, 2));
        
        // Test validate_excel_structure
        console.log("\n=== Validating Excel Structure ===");
        const validationResult = await mcpServer.validateExcelStructure({
            filePath: "C:\\Users\\A.Stein\\Downloads\\DATA TEAM ACTIVE SHEET_ 7-17-2025.xlsx"
        });
        console.log(JSON.parse(validationResult.content[0].text));
        
    } catch (error) {
        console.error("Error:", error.message);
    }
}

testExcelMCP();