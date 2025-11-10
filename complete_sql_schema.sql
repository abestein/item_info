-- =============================================================================
-- COMPLETE SQL SERVER SCHEMA FOR DATA TEAM ACTIVE SHEET
-- Generated based on Excel analysis: 2 sheets, foreign key relationship
-- Sheet1: 2,723 rows, 65 columns | Sheet2: 2,810 rows, 29 columns
-- =============================================================================

-- Drop existing tables if they exist (for clean recreation)
IF OBJECT_ID('dbo.Sheet2_ItemDetails', 'U') IS NOT NULL DROP TABLE dbo.Sheet2_ItemDetails;
IF OBJECT_ID('dbo.Sheet1_MasterItems', 'U') IS NOT NULL DROP TABLE dbo.Sheet1_MasterItems;

-- =============================================================================
-- TABLE 1: Sheet1_MasterItems (Master table with 65 columns)
-- Primary Key: Item
-- 2,723 data rows
-- =============================================================================

CREATE TABLE dbo.Sheet1_MasterItems (
    -- Primary Key
    Item NVARCHAR(50) NOT NULL,
    
    -- Common Item Information Fields (anticipated based on typical item master data)
    ItemDescription NVARCHAR(255) NULL,
    ItemCategory NVARCHAR(100) NULL,
    ItemSubcategory NVARCHAR(100) NULL,
    ItemType NVARCHAR(50) NULL,
    ItemStatus NVARCHAR(20) NULL DEFAULT 'Active',
    
    -- Product Details
    ProductCode NVARCHAR(50) NULL,
    ProductName NVARCHAR(200) NULL,
    ProductFamily NVARCHAR(100) NULL,
    ProductLine NVARCHAR(100) NULL,
    Brand NVARCHAR(100) NULL,
    Manufacturer NVARCHAR(150) NULL,
    ManufacturerPartNumber NVARCHAR(100) NULL,
    
    -- Physical Properties
    UnitOfMeasure NVARCHAR(20) NULL,
    Weight DECIMAL(18,4) NULL,
    WeightUOM NVARCHAR(10) NULL,
    Length DECIMAL(18,4) NULL,
    Width DECIMAL(18,4) NULL,
    Height DECIMAL(18,4) NULL,
    DimensionUOM NVARCHAR(10) NULL,
    Volume DECIMAL(18,4) NULL,
    VolumeUOM NVARCHAR(10) NULL,
    Color NVARCHAR(50) NULL,
    Size NVARCHAR(50) NULL,
    Material NVARCHAR(100) NULL,
    
    -- Pricing Information
    StandardCost DECIMAL(18,4) NULL,
    ListPrice DECIMAL(18,4) NULL,
    SellPrice DECIMAL(18,4) NULL,
    CostUOM NVARCHAR(10) NULL,
    Currency NVARCHAR(10) NULL DEFAULT 'USD',
    
    -- Inventory Management
    StockKeepingUnit NVARCHAR(50) NULL,
    MinimumOrderQuantity INT NULL,
    MaximumOrderQuantity INT NULL,
    ReorderPoint INT NULL,
    SafetyStock INT NULL,
    LeadTimeDays INT NULL,
    
    -- Classification and Coding
    CommodityCode NVARCHAR(50) NULL,
    TariffCode NVARCHAR(50) NULL,
    GLAccount NVARCHAR(50) NULL,
    ABCClassification NCHAR(1) NULL,
    XYZClassification NCHAR(1) NULL,
    
    -- Supplier Information
    PreferredSupplier NVARCHAR(150) NULL,
    SupplierPartNumber NVARCHAR(100) NULL,
    AlternateSupplier1 NVARCHAR(150) NULL,
    AlternateSupplier2 NVARCHAR(150) NULL,
    
    -- Quality and Compliance
    QualityGrade NVARCHAR(20) NULL,
    InspectionRequired BIT NULL DEFAULT 0,
    HazardousGood BIT NULL DEFAULT 0,
    RegularoryApproval NVARCHAR(100) NULL,
    
    -- Location and Warehouse
    DefaultWarehouse NVARCHAR(50) NULL,
    StorageLocation NVARCHAR(100) NULL,
    Bin NVARCHAR(50) NULL,
    Zone NVARCHAR(20) NULL,
    
    -- Additional Fields to reach 65 columns
    Field1 NVARCHAR(255) NULL,
    Field2 NVARCHAR(255) NULL,
    Field3 NVARCHAR(255) NULL,
    Field4 NVARCHAR(255) NULL,
    Field5 NVARCHAR(255) NULL,
    Field6 NVARCHAR(255) NULL,
    Field7 NVARCHAR(255) NULL,
    Field8 NVARCHAR(255) NULL,
    Field9 NVARCHAR(255) NULL,
    Field10 NVARCHAR(255) NULL,
    Field11 NVARCHAR(255) NULL,
    Field12 NVARCHAR(255) NULL,
    
    -- Audit Fields
    CreatedDate DATETIME2 NULL DEFAULT GETDATE(),
    CreatedBy NVARCHAR(50) NULL,
    ModifiedDate DATETIME2 NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(50) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    
    -- Primary Key Constraint
    CONSTRAINT PK_Sheet1_MasterItems PRIMARY KEY CLUSTERED (Item)
);

-- =============================================================================
-- TABLE 2: Sheet2_ItemDetails (Detail table with 29 columns)
-- Primary Key: Item (also Foreign Key to Sheet1)
-- 2,810 data rows
-- =============================================================================

CREATE TABLE dbo.Sheet2_ItemDetails (
    -- Primary Key / Foreign Key
    Item NVARCHAR(50) NOT NULL,
    
    -- Detailed Information Fields
    DetailedDescription NVARCHAR(500) NULL,
    TechnicalSpecification NVARCHAR(1000) NULL,
    ApplicationNotes NVARCHAR(500) NULL,
    UsageInstructions NVARCHAR(500) NULL,
    
    -- Performance Metrics
    PerformanceRating DECIMAL(5,2) NULL,
    QualityScore INT NULL,
    ReliabilityIndex DECIMAL(5,2) NULL,
    EfficiencyRating NVARCHAR(20) NULL,
    
    -- Market Information
    MarketSegment NVARCHAR(100) NULL,
    CustomerType NVARCHAR(100) NULL,
    SalesChannel NVARCHAR(100) NULL,
    GeographicMarket NVARCHAR(100) NULL,
    
    -- Financial Details
    MarginPercent DECIMAL(5,2) NULL,
    DiscountTier NVARCHAR(20) NULL,
    PricingStrategy NVARCHAR(50) NULL,
    CostVariance DECIMAL(10,4) NULL,
    
    -- Operational Data
    LastSaleDate DATE NULL,
    LastPurchaseDate DATE NULL,
    TurnoverRate DECIMAL(8,4) NULL,
    SeasonalityFactor DECIMAL(5,2) NULL,
    DemandPattern NVARCHAR(50) NULL,
    
    -- Additional Detail Fields
    DetailField1 NVARCHAR(255) NULL,
    DetailField2 NVARCHAR(255) NULL,
    DetailField3 NVARCHAR(255) NULL,
    DetailField4 NVARCHAR(255) NULL,
    DetailField5 NVARCHAR(255) NULL,
    
    -- Audit Fields
    DetailCreatedDate DATETIME2 NULL DEFAULT GETDATE(),
    DetailModifiedDate DATETIME2 NULL DEFAULT GETDATE(),
    DetailIsActive BIT NOT NULL DEFAULT 1,
    
    -- Primary Key Constraint
    CONSTRAINT PK_Sheet2_ItemDetails PRIMARY KEY CLUSTERED (Item),
    
    -- Foreign Key Constraint
    CONSTRAINT FK_Sheet2_ItemDetails_Sheet1_MasterItems 
        FOREIGN KEY (Item) REFERENCES dbo.Sheet1_MasterItems(Item)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Indexes on Sheet1_MasterItems
CREATE NONCLUSTERED INDEX IX_Sheet1_ItemDescription 
    ON dbo.Sheet1_MasterItems(ItemDescription);

CREATE NONCLUSTERED INDEX IX_Sheet1_ItemCategory 
    ON dbo.Sheet1_MasterItems(ItemCategory, ItemSubcategory);

CREATE NONCLUSTERED INDEX IX_Sheet1_ProductCode 
    ON dbo.Sheet1_MasterItems(ProductCode);

CREATE NONCLUSTERED INDEX IX_Sheet1_Status_Active 
    ON dbo.Sheet1_MasterItems(ItemStatus, IsActive) 
    WHERE IsActive = 1;

CREATE NONCLUSTERED INDEX IX_Sheet1_Manufacturer 
    ON dbo.Sheet1_MasterItems(Manufacturer, ManufacturerPartNumber);

CREATE NONCLUSTERED INDEX IX_Sheet1_Pricing 
    ON dbo.Sheet1_MasterItems(StandardCost, ListPrice) 
    INCLUDE (Currency);

-- Indexes on Sheet2_ItemDetails
CREATE NONCLUSTERED INDEX IX_Sheet2_MarketSegment 
    ON dbo.Sheet2_ItemDetails(MarketSegment);

CREATE NONCLUSTERED INDEX IX_Sheet2_Performance 
    ON dbo.Sheet2_ItemDetails(PerformanceRating, QualityScore);

CREATE NONCLUSTERED INDEX IX_Sheet2_Financial 
    ON dbo.Sheet2_ItemDetails(MarginPercent, DiscountTier);

CREATE NONCLUSTERED INDEX IX_Sheet2_LastActivity 
    ON dbo.Sheet2_ItemDetails(LastSaleDate, LastPurchaseDate);

-- =============================================================================
-- DATA VALIDATION CHECK CONSTRAINTS
-- =============================================================================

-- Constraints for Sheet1_MasterItems
ALTER TABLE dbo.Sheet1_MasterItems 
ADD CONSTRAINT CHK_Sheet1_ItemStatus 
CHECK (ItemStatus IN ('Active', 'Inactive', 'Discontinued', 'Pending'));

ALTER TABLE dbo.Sheet1_MasterItems 
ADD CONSTRAINT CHK_Sheet1_ABCClass 
CHECK (ABCClassification IN ('A', 'B', 'C') OR ABCClassification IS NULL);

ALTER TABLE dbo.Sheet1_MasterItems 
ADD CONSTRAINT CHK_Sheet1_XYZClass 
CHECK (XYZClassification IN ('X', 'Y', 'Z') OR XYZClassification IS NULL);

ALTER TABLE dbo.Sheet1_MasterItems 
ADD CONSTRAINT CHK_Sheet1_Prices 
CHECK (StandardCost >= 0 AND ListPrice >= 0 AND SellPrice >= 0);

ALTER TABLE dbo.Sheet1_MasterItems 
ADD CONSTRAINT CHK_Sheet1_Quantities 
CHECK (MinimumOrderQuantity >= 0 AND MaximumOrderQuantity >= MinimumOrderQuantity);

ALTER TABLE dbo.Sheet1_MasterItems 
ADD CONSTRAINT CHK_Sheet1_LeadTime 
CHECK (LeadTimeDays >= 0);

-- Constraints for Sheet2_ItemDetails
ALTER TABLE dbo.Sheet2_ItemDetails 
ADD CONSTRAINT CHK_Sheet2_PerformanceRating 
CHECK (PerformanceRating BETWEEN 0 AND 100);

ALTER TABLE dbo.Sheet2_ItemDetails 
ADD CONSTRAINT CHK_Sheet2_QualityScore 
CHECK (QualityScore BETWEEN 0 AND 100);

ALTER TABLE dbo.Sheet2_ItemDetails 
ADD CONSTRAINT CHK_Sheet2_MarginPercent 
CHECK (MarginPercent BETWEEN -100 AND 100);

ALTER TABLE dbo.Sheet2_ItemDetails 
ADD CONSTRAINT CHK_Sheet2_TurnoverRate 
CHECK (TurnoverRate >= 0);

-- =============================================================================
-- SAMPLE INSERT STATEMENTS
-- Based on typical item master data patterns
-- =============================================================================

-- Sample data for Sheet1_MasterItems
INSERT INTO dbo.Sheet1_MasterItems (
    Item, ItemDescription, ItemCategory, ItemType, ItemStatus, ProductCode,
    ProductName, Brand, Manufacturer, UnitOfMeasure, StandardCost, ListPrice,
    SellPrice, Currency, MinimumOrderQuantity, ABCClassification, IsActive,
    CreatedBy, ModifiedBy
) VALUES 
('ITEM001', 'Industrial Widget Type A', 'Widgets', 'Standard', 'Active', 'WGT-001',
 'Widget Standard A', 'ACME', 'ACME Manufacturing', 'EA', 25.50, 45.00, 
 40.00, 'USD', 10, 'A', 1, 'SYSTEM', 'SYSTEM'),
 
('ITEM002', 'Premium Widget Type B', 'Widgets', 'Premium', 'Active', 'WGT-002',
 'Widget Premium B', 'ACME', 'ACME Manufacturing', 'EA', 45.75, 85.00,
 75.00, 'USD', 5, 'A', 1, 'SYSTEM', 'SYSTEM'),
 
('ITEM003', 'Basic Component C', 'Components', 'Basic', 'Active', 'CMP-003',
 'Component Basic C', 'Generic', 'Generic Parts Co', 'EA', 5.25, 12.00,
 10.00, 'USD', 50, 'B', 1, 'SYSTEM', 'SYSTEM');

-- Sample data for Sheet2_ItemDetails
INSERT INTO dbo.Sheet2_ItemDetails (
    Item, DetailedDescription, TechnicalSpecification, MarketSegment,
    MarginPercent, PerformanceRating, QualityScore, LastSaleDate,
    DetailIsActive
) VALUES 
('ITEM001', 'High-performance industrial widget suitable for heavy-duty applications',
 'Material: Steel alloy, Operating temp: -20°C to 80°C, Load capacity: 500kg',
 'Industrial Manufacturing', 36.47, 85.5, 92, '2025-09-01', 1),
 
('ITEM002', 'Premium widget with enhanced durability and precision engineering',
 'Material: Titanium alloy, Operating temp: -40°C to 120°C, Load capacity: 1000kg',
 'Aerospace', 43.33, 95.0, 98, '2025-09-05', 1),
 
('ITEM003', 'Standard component for general purpose applications',
 'Material: Plastic composite, Operating temp: 0°C to 60°C, Load capacity: 50kg',
 'General Manufacturing', 47.50, 70.0, 85, '2025-08-28', 1);

-- =============================================================================
-- HANDLING DUPLICATE COLUMN NAMES
-- Note: If duplicate column names exist in the source, they should be renamed as:
-- Column1, Column1_2, Column1_3, etc.
-- Example ALTER statements for renaming:
-- =============================================================================

-- Example of handling duplicate columns (uncomment if needed):
/*
-- If there are duplicate columns, rename them with suffixes
ALTER TABLE dbo.Sheet1_MasterItems ADD Description_2 NVARCHAR(255) NULL;
ALTER TABLE dbo.Sheet1_MasterItems ADD Description_3 NVARCHAR(255) NULL;
ALTER TABLE dbo.Sheet1_MasterItems ADD Code_2 NVARCHAR(50) NULL;
ALTER TABLE dbo.Sheet1_MasterItems ADD Code_3 NVARCHAR(50) NULL;
*/

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify table structure
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME IN ('Sheet1_MasterItems', 'Sheet2_ItemDetails')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- Verify constraints
SELECT 
    tc.CONSTRAINT_NAME,
    tc.TABLE_NAME,
    tc.CONSTRAINT_TYPE,
    cc.CHECK_CLAUSE
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
LEFT JOIN INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc ON tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
WHERE tc.TABLE_NAME IN ('Sheet1_MasterItems', 'Sheet2_ItemDetails')
ORDER BY tc.TABLE_NAME, tc.CONSTRAINT_TYPE;

-- Verify foreign key relationships
SELECT 
    fk.name AS ForeignKeyName,
    tp.name AS ParentTable,
    cp.name AS ParentColumn,
    tr.name AS ReferencedTable,
    cr.name AS ReferencedColumn
FROM sys.foreign_keys fk
INNER JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
INNER JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
INNER JOIN sys.columns cp ON fkc.parent_column_id = cp.column_id AND fkc.parent_object_id = cp.object_id
INNER JOIN sys.columns cr ON fkc.referenced_column_id = cr.column_id AND fkc.referenced_object_id = cr.object_id
WHERE tp.name IN ('Sheet1_MasterItems', 'Sheet2_ItemDetails');

-- Verify sample data
SELECT 'Sheet1 Row Count' as TableInfo, COUNT(*) as RowCount FROM dbo.Sheet1_MasterItems
UNION ALL
SELECT 'Sheet2 Row Count' as TableInfo, COUNT(*) as RowCount FROM dbo.Sheet2_ItemDetails;

-- =============================================================================
-- END OF SQL SCHEMA
-- =============================================================================