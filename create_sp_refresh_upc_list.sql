-- Create the UPC_list table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UPC_list')
BEGIN
    CREATE TABLE UPC_list (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        ItemCode NVARCHAR(255),
        Level NVARCHAR(50),
        UPC NVARCHAR(255),
        LevelNumber INT,
        IsSellable BIT
    );
    PRINT 'Table UPC_list created successfully';
END
ELSE
BEGIN
    PRINT 'Table UPC_list already exists';
END
GO

-- Create the stored procedure
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_Refresh_UPC_List')
BEGIN
    DROP PROCEDURE sp_Refresh_UPC_List;
    PRINT 'Dropped existing sp_Refresh_UPC_List procedure';
END
GO

CREATE PROCEDURE [dbo].[sp_Refresh_UPC_List]
AS
BEGIN
    -- Clear existing data
    TRUNCATE TABLE UPC_list;

    -- Insert transformed data with level numbers and sellable flag
    WITH UPC_Hierarchy AS (
        -- Get all UPC data with hierarchy levels from data_team_active_items
        SELECT
            item AS ItemCode,
            'Ship-2' AS Level,
            CAST(upc_ship_2 AS NVARCHAR(255)) AS UPC,
            5 AS HierarchyOrder,
            CASE
                WHEN upc_ship_2 IS NOT NULL
                AND LTRIM(RTRIM(CAST(upc_ship_2 AS NVARCHAR(255)))) != ''
                AND CAST(upc_ship_2 AS NVARCHAR(255)) != 'X'
                THEN 1
                ELSE 0
            END AS HasUPC
        FROM data_team_active_items
        UNION ALL
        SELECT
            item AS ItemCode,
            'Ship-1' AS Level,
            CAST(upc_ship_1 AS NVARCHAR(255)) AS UPC,
            4 AS HierarchyOrder,
            CASE
                WHEN upc_ship_1 IS NOT NULL
                AND LTRIM(RTRIM(CAST(upc_ship_1 AS NVARCHAR(255)))) != ''
                AND CAST(upc_ship_1 AS NVARCHAR(255)) != 'X'
                THEN 1
                ELSE 0
            END AS HasUPC
        FROM data_team_active_items
        UNION ALL
        SELECT
            item AS ItemCode,
            'Sellable' AS Level,
            CAST(upc_sellable AS NVARCHAR(255)) AS UPC,
            3 AS HierarchyOrder,
            CASE
                WHEN upc_sellable IS NOT NULL
                AND LTRIM(RTRIM(CAST(upc_sellable AS NVARCHAR(255)))) != ''
                AND CAST(upc_sellable AS NVARCHAR(255)) != 'X'
                THEN 1
                ELSE 0
            END AS HasUPC
        FROM data_team_active_items
        UNION ALL
        SELECT
            item AS ItemCode,
            'Inner-1' AS Level,
            CAST(upc_inner_1 AS NVARCHAR(255)) AS UPC,
            2 AS HierarchyOrder,
            CASE
                WHEN upc_inner_1 IS NOT NULL
                AND LTRIM(RTRIM(CAST(upc_inner_1 AS NVARCHAR(255)))) != ''
                AND CAST(upc_inner_1 AS NVARCHAR(255)) != 'X'
                THEN 1
                ELSE 0
            END AS HasUPC
        FROM data_team_active_items
        UNION ALL
        SELECT
            item AS ItemCode,
            'Inner-2' AS Level,
            CAST(upc_inner_2 AS NVARCHAR(255)) AS UPC,
            1 AS HierarchyOrder,
            CASE
                WHEN upc_inner_2 IS NOT NULL
                AND LTRIM(RTRIM(CAST(upc_inner_2 AS NVARCHAR(255)))) != ''
                AND CAST(upc_inner_2 AS NVARCHAR(255)) != 'X'
                THEN 1
                ELSE 0
            END AS HasUPC
        FROM data_team_active_items
    )
    INSERT INTO UPC_list (ItemCode, Level, UPC, LevelNumber, IsSellable)
    SELECT
        h.ItemCode,
        h.Level,
        h.UPC,
        DENSE_RANK() OVER (PARTITION BY h.ItemCode ORDER BY h.HierarchyOrder DESC) AS LevelNumber,
        CASE WHEN h.Level = 'Sellable' THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS IsSellable
    FROM UPC_Hierarchy h
    WHERE h.HasUPC = 1
    ORDER BY h.ItemCode, h.HierarchyOrder DESC;

    -- Return row count
    SELECT @@ROWCOUNT AS 'RowsInserted';
END;
GO

PRINT 'Stored procedure sp_Refresh_UPC_List created successfully';
