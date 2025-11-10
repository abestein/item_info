try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    
    $workbook = $excel.Workbooks.Open('C:\Users\A.Stein\Downloads\DATA TEAM ACTIVE SHEET_ 7-17-2025.xlsx')
    $worksheet = $workbook.Worksheets[1]
    
    $lastCol = $worksheet.UsedRange.Columns.Count
    
    Write-Host "=== COLUMN HEADERS ANALYSIS ==="
    Write-Host "Extracting headers from row 3 (actual column headers):"
    Write-Host ""
    
    $headers = @()
    for ($i = 1; $i -le $lastCol; $i++) {
        $header = $worksheet.Cells(3, $i).Text.Trim()
        if ($header -eq "") {
            $header = "Column_$i"
        }
        $headers += $header
        Write-Host "Column $i : '$header'"
    }
    
    Write-Host ""
    Write-Host "=== DATA TYPE ANALYSIS ==="
    Write-Host "Analyzing data types for first 20 data rows (rows 4-23):"
    Write-Host ""
    
    for ($col = 1; $col -le [Math]::Min(30, $lastCol); $col++) {  # First 30 columns for detailed analysis
        $header = $headers[$col - 1]
        Write-Host "Column $col - '$header':"
        
        $sampleValues = @()
        $nonEmptyCount = 0
        $maxLength = 0
        $hasNumbers = $false
        $hasText = $false
        $hasDate = $false
        
        for ($row = 4; $row -le [Math]::Min(23, $worksheet.UsedRange.Rows.Count); $row++) {
            $value = $worksheet.Cells($row, $col).Text.Trim()
            if ($value -ne "" -and $value -ne "N/A") {
                $sampleValues += $value
                $nonEmptyCount++
                if ($value.Length -gt $maxLength) { $maxLength = $value.Length }
                
                # Check data type patterns
                if ($value -match '^\d+$') { $hasNumbers = $true }
                elseif ($value -match '^\d+\.\d+$') { $hasNumbers = $true }
                elseif ($value -match '\d{1,2}/\d{1,2}/\d{4}') { $hasDate = $true }
                elseif ($value -match '\d{4}-\d{2}-\d{2}') { $hasDate = $true }
                else { $hasText = $true }
            }
        }
        
        Write-Host "  Sample values: $($sampleValues[0..4] -join ', ')"
        Write-Host "  Non-empty count: $nonEmptyCount/20"
        Write-Host "  Max length: $maxLength"
        
        $suggestedType = "VARCHAR(255)"
        if ($hasDate -and !$hasText -and !$hasNumbers) {
            $suggestedType = "DATE"
        } elseif ($hasNumbers -and !$hasText -and !$hasDate) {
            if ($maxLength -le 10) { $suggestedType = "INT" }
            else { $suggestedType = "BIGINT" }
        } elseif ($maxLength -le 50) {
            $suggestedType = "VARCHAR(50)"
        } elseif ($maxLength -le 100) {
            $suggestedType = "VARCHAR(100)"
        } elseif ($maxLength -le 255) {
            $suggestedType = "VARCHAR(255)"
        } else {
            $suggestedType = "TEXT"
        }
        
        Write-Host "  Suggested SQL type: $suggestedType"
        Write-Host ""
    }
    
    Write-Host "=== SUMMARY ==="
    Write-Host "Total rows: $($worksheet.UsedRange.Rows.Count)"
    Write-Host "Total columns: $lastCol"
    Write-Host "Data rows (excluding headers): $($worksheet.UsedRange.Rows.Count - 3)"
    
    $workbook.Close($false)
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
catch {
    Write-Host "Error: $($_.Exception.Message)"
}