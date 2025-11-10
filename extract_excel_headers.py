import pandas as pd
import sys

def extract_excel_headers(file_path):
    """Extract column headers from an Excel file."""
    try:
        # Read the Excel file
        excel_file = pd.ExcelFile(file_path)
        
        print(f"Available sheets: {excel_file.sheet_names}")
        print("\n" + "="*50 + "\n")
        
        # Process each sheet
        for sheet_name in excel_file.sheet_names:
            print(f"SHEET: {sheet_name}")
            print("-" * 30)
            
            # Read the sheet with header=0 to get first row as headers
            df = pd.read_excel(file_path, sheet_name=sheet_name, header=0)
            
            print(f"Number of columns: {len(df.columns)}")
            print("\nColumn headers:")
            for i, col in enumerate(df.columns, 1):
                print(f"{i:2d}. {col}")
            
            # Read without header to analyze the structure
            df_raw = pd.read_excel(file_path, sheet_name=sheet_name, header=None, nrows=10)
            
            print(f"\nFirst 5 rows (to check for multi-level headers):")
            for row_idx in range(min(5, len(df_raw))):
                print(f"Row {row_idx + 1}: {list(df_raw.iloc[row_idx])[:10]}...")  # First 10 cols only
            
            # Extract actual headers from row 3 (index 2)
            print(f"\nActual column headers (Row 3):")
            actual_headers = []
            for i, col_value in enumerate(df_raw.iloc[2]):
                if pd.isna(col_value) or str(col_value).strip() == '':
                    header = f"Column_{i+1}"
                else:
                    header = str(col_value).strip()
                actual_headers.append(header)
                if i < 30:  # Show first 30 columns
                    print(f"{i+1:2d}. {header}")
            
            # Analyze data types from sample rows (4-10)
            print(f"\nData type analysis (rows 4-10):")
            for i in range(min(20, len(actual_headers))):  # First 20 columns
                col_data = []
                for row_idx in range(3, min(10, len(df_raw))):
                    if i < len(df_raw.columns):
                        val = df_raw.iloc[row_idx, i]
                        if not pd.isna(val) and str(val).strip() != '' and str(val).strip() != 'N/A':
                            col_data.append(str(val).strip())
                
                if col_data:
                    max_len = max(len(str(x)) for x in col_data)
                    sample_vals = col_data[:3]  # First 3 non-empty values
                    
                    # Suggest SQL data type
                    suggested_type = "VARCHAR(255)"
                    if all(str(x).replace('.','').replace('-','').isdigit() for x in col_data):
                        if max_len <= 10:
                            suggested_type = "INT"
                        else:
                            suggested_type = "BIGINT"
                    elif max_len <= 50:
                        suggested_type = "VARCHAR(50)"
                    elif max_len <= 100:
                        suggested_type = "VARCHAR(100)"
                    elif max_len > 255:
                        suggested_type = "TEXT"
                    
                    print(f"{i+1:2d}. {actual_headers[i][:25]:25} | Max len: {max_len:3d} | Type: {suggested_type:12} | Sample: {', '.join(sample_vals[:2])}")
                else:
                    print(f"{i+1:2d}. {actual_headers[i][:25]:25} | Empty column")
            
            print("\n" + "="*80 + "\n")
    
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        return

if __name__ == "__main__":
    file_path = r"C:\Users\A.Stein\Downloads\DATA TEAM ACTIVE SHEET_ 7-17-2025.xlsx"
    extract_excel_headers(file_path)