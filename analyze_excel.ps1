try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    
    $workbook = $excel.Workbooks.Open('C:\Users\A.Stein\Downloads\DATA TEAM ACTIVE SHEET_ 7-17-2025.xlsx')
    $worksheet = $workbook.Worksheets[1]
    
    Write-Host "Worksheet Name: $($worksheet.Name)"
    
    # Get last row and column
    $lastRow = $worksheet.UsedRange.Rows.Count
    $lastCol = $worksheet.UsedRange.Columns.Count
    
    Write-Host "Rows: $lastRow"
    Write-Host "Columns: $lastCol"
    Write-Host "-------------------"
    
    # Get headers (first row)
    Write-Host "COLUMN HEADERS:"
    for ($i = 1; $i -le $lastCol; $i++) {
        $header = $worksheet.Cells(1, $i).Text
        Write-Host "Column $i : $header"
    }
    
    Write-Host "-------------------"
    Write-Host "SAMPLE DATA (First 5 rows):"
    for ($row = 1; $row -le [Math]::Min(6, $lastRow); $row++) {
        $rowData = @()
        for ($col = 1; $col -le $lastCol; $col++) {
            $cellValue = $worksheet.Cells($row, $col).Text
            if ($cellValue.Length -gt 50) {
                $cellValue = $cellValue.Substring(0, 47) + "..."
            }
            $rowData += $cellValue
        }
        Write-Host "Row $row : $($rowData -join ' | ')"
    }
    
    Write-Host "-------------------"
    Write-Host "COLUMN DATA ANALYSIS:"
    for ($col = 1; $col -le $lastCol; $col++) {
        $header = $worksheet.Cells(1, $col).Text
        Write-Host "Column $col - $header :"
        
        # Sample a few values to understand data type
        $sampleValues = @()
        $nonEmptyCount = 0
        for ($row = 2; $row -le [Math]::Min(10, $lastRow); $row++) {
            $value = $worksheet.Cells($row, $col).Text
            if ($value -ne "") {
                $sampleValues += $value
                $nonEmptyCount++
            }
        }
        
        Write-Host "  Sample values: $($sampleValues -join ', ')"
        Write-Host "  Non-empty values in sample: $nonEmptyCount"
        Write-Host ""
    }
    
    $workbook.Close($false)
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
catch {
    Write-Host "Error: $($_.Exception.Message)"
}