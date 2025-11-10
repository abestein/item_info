# Excel MCP Server Agent

An intelligent agent for Excel file processing through the Model Context Protocol (MCP).

## Features

### 🔧 **Core Capabilities**
- **Excel File Reading** - Extract data from .xlsx, .xls, and .csv files
- **Worksheet Management** - Handle multiple sheets and workbooks
- **Data Validation** - Validate file structure and headers
- **Format Conversion** - Convert between Excel and JSON formats
- **Report Generation** - Create Excel reports from data

### 📊 **Supported Operations**

#### 1. **Read Excel Files**
```javascript
// Read entire worksheet
await mcp.callTool('read_excel_file', {
  filePath: './uploads/data.xlsx',
  sheetName: 'Sheet1'
});

// Read specific range
await mcp.callTool('read_excel_file', {
  filePath: './uploads/data.xlsx',
  range: 'A1:D10'
});
```

#### 2. **Get Worksheet Information**
```javascript
await mcp.callTool('get_excel_sheets', {
  filePath: './uploads/workbook.xlsx'
});
```

#### 3. **Validate File Structure**
```javascript
await mcp.callTool('validate_excel_structure', {
  filePath: './uploads/data.xlsx',
  expectedHeaders: ['Name', 'Price', 'Category', 'Stock']
});
```

#### 4. **Convert to JSON**
```javascript
await mcp.callTool('convert_excel_to_json', {
  filePath: './uploads/data.xlsx',
  sheetName: 'Products',
  includeHeaders: true
});
```

#### 5. **Create Excel Reports**
```javascript
await mcp.callTool('create_excel_report', {
  data: [
    { name: 'Product A', price: 100, stock: 50 },
    { name: 'Product B', price: 200, stock: 30 }
  ],
  outputPath: './reports/product_report.xlsx',
  sheetName: 'Product Report'
});
```

## Installation

### 1. **Install Dependencies**
```bash
cd .agents/data-agents/excel-mcp
npm install
```

### 2. **Add to Claude Desktop Config**
Add this configuration to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "excel-mcp-server": {
      "command": "node",
      "args": [".agents/data-agents/excel-mcp/index.js"],
      "cwd": "C:/Users/A.Stein/Source/Repos/item_info",
      "env": {
        "NODE_ENV": "production",
        "EXCEL_TEMP_DIR": "./uploads/temp",
        "MAX_FILE_SIZE": "50MB"
      }
    }
  }
}
```

## Usage Examples

### **Basic File Reading**
```javascript
const result = await mcp.callTool('read_excel_file', {
  filePath: './uploads/inventory.xlsx'
});

console.log(result.data); // Array of row objects
console.log(result.metadata); // File metadata
```

### **Bulk Data Processing**
```javascript
// 1. Validate structure first
const validation = await mcp.callTool('validate_excel_structure', {
  filePath: './uploads/products.xlsx',
  expectedHeaders: ['SKU', 'Name', 'Price', 'Category']
});

if (validation.isValid) {
  // 2. Convert to JSON for processing
  const jsonData = await mcp.callTool('convert_excel_to_json', {
    filePath: './uploads/products.xlsx',
    includeHeaders: true
  });
  
  // 3. Process data...
  const processedData = jsonData.data.map(item => ({
    ...item,
    processedAt: new Date().toISOString()
  }));
  
  // 4. Generate report
  await mcp.callTool('create_excel_report', {
    data: processedData,
    outputPath: './reports/processed_products.xlsx'
  });
}
```

## Integration with Other Agents

### **With SQL MCP Agent**
```javascript
// Read Excel data and import to database
const excelData = await mcp.callTool('convert_excel_to_json', {
  filePath: './uploads/new_products.xlsx'
});

// Use SQL MCP to insert data
await sqlMcp.callTool('execute_query', {
  query: 'INSERT INTO products (name, price, category) VALUES ?',
  params: excelData.data.map(row => [row.Name, row.Price, row.Category])
});
```

### **With Transactions Agent**
```javascript
// Validate and process uploaded Excel files
const uploadResult = await transactionAgent.processUpload(file);
if (uploadResult.success) {
  const validation = await mcp.callTool('validate_excel_structure', {
    filePath: uploadResult.filePath,
    expectedHeaders: ['UPC', 'Description', 'Price']
  });
  
  if (!validation.isValid) {
    throw new Error(`Invalid file structure: ${validation.missingHeaders.join(', ')}`);
  }
}
```

## File Format Support

| Format | Extension | Read | Write | Notes |
|--------|-----------|------|-------|-------|
| Excel 2007+ | .xlsx | ✅ | ✅ | Full feature support |
| Excel 97-2003 | .xls | ✅ | ❌ | Read-only support |
| CSV | .csv | ✅ | ✅ | Basic support |
| TSV | .tsv | ✅ | ✅ | Tab-separated values |

## Error Handling

The agent provides comprehensive error handling:

```javascript
try {
  const result = await mcp.callTool('read_excel_file', {
    filePath: './uploads/data.xlsx'
  });
} catch (error) {
  if (error.message.includes('not found')) {
    console.log('File does not exist');
  } else if (error.message.includes('Worksheet')) {
    console.log('Invalid worksheet name');
  } else {
    console.log('General Excel processing error:', error.message);
  }
}
```

## Performance Considerations

- **File Size Limit**: 50MB default (configurable via `MAX_FILE_SIZE`)
- **Memory Usage**: Large files are processed in chunks
- **Temporary Files**: Stored in `./uploads/temp` directory
- **Caching**: Results cached for repeated operations

## Security Features

- **File Type Validation**: Only allows Excel and CSV files
- **Path Sanitization**: Prevents directory traversal attacks
- **Size Limits**: Configurable maximum file size
- **Temporary Cleanup**: Automatic cleanup of temporary files

## Agent Coordination

The Excel MCP Agent coordinates with:

- **📊 Transactions Agent**: File upload validation and processing
- **🗄️ SQL MCP Agent**: Database import/export operations  
- **🔍 Gap Analyzer**: Data quality and structure analysis
- **🎯 Orchestrator**: Multi-step workflow coordination

This agent provides robust Excel processing capabilities while maintaining security and performance standards.