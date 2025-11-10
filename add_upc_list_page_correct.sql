-- Add UPC List page to PagePermissions table
IF NOT EXISTS (SELECT 1 FROM PagePermissions WHERE PagePath = '/upc-list')
BEGIN
    INSERT INTO PagePermissions (PagePath, PageName, Description, Category, IsActive, CreatedAt)
    VALUES ('/upc-list', 'UPC List', 'View UPC codes organized by item and level', 'Data', 1, GETDATE());
    PRINT 'UPC List page added to PagePermissions';
END
ELSE
BEGIN
    PRINT 'UPC List page already exists in PagePermissions';
END
GO

-- Also add items-new-operations page if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM PagePermissions WHERE PagePath = '/items-new-operations')
BEGIN
    INSERT INTO PagePermissions (PagePath, PageName, Description, Category, IsActive, CreatedAt)
    VALUES ('/items-new-operations', 'Data Operations', 'Manage data operations and uploads', 'Data', 1, GETDATE());
    PRINT 'Data Operations page added to PagePermissions';
END
ELSE
BEGIN
    PRINT 'Data Operations page already exists';
END
GO

-- Add items-new page if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM PagePermissions WHERE PagePath = '/items-new')
BEGIN
    INSERT INTO PagePermissions (PagePath, PageName, Description, Category, IsActive, CreatedAt)
    VALUES ('/items-new', 'Item View', 'View and manage all items', 'Data', 1, GETDATE());
    PRINT 'Item View page added to PagePermissions';
END
ELSE
BEGIN
    PRINT 'Item View page already exists';
END
GO

-- Add items-new-changes page if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM PagePermissions WHERE PagePath = '/items-new-changes')
BEGIN
    INSERT INTO PagePermissions (PagePath, PageName, Description, Category, IsActive, CreatedAt)
    VALUES ('/items-new-changes', 'Pending Changes', 'View and apply pending data changes', 'Data', 1, GETDATE());
    PRINT 'Pending Changes page added to PagePermissions';
END
ELSE
BEGIN
    PRINT 'Pending Changes page already exists';
END
GO

-- Grant UPC List access to admin role
IF NOT EXISTS (SELECT 1 FROM RolePermissions WHERE RoleName = 'admin' AND PagePath = '/upc-list')
BEGIN
    INSERT INTO RolePermissions (RoleName, PagePath, CreatedAt, CreatedBy)
    VALUES ('admin', '/upc-list', GETDATE(), 'SYSTEM');
    PRINT 'UPC List page assigned to admin role';
END
GO

-- Grant items-new-operations to admin
IF NOT EXISTS (SELECT 1 FROM RolePermissions WHERE RoleName = 'admin' AND PagePath = '/items-new-operations')
BEGIN
    INSERT INTO RolePermissions (RoleName, PagePath, CreatedAt, CreatedBy)
    VALUES ('admin', '/items-new-operations', GETDATE(), 'SYSTEM');
    PRINT 'Data Operations assigned to admin role';
END
GO

-- Grant items-new to admin
IF NOT EXISTS (SELECT 1 FROM RolePermissions WHERE RoleName = 'admin' AND PagePath = '/items-new')
BEGIN
    INSERT INTO RolePermissions (RoleName, PagePath, CreatedAt, CreatedBy)
    VALUES ('admin', '/items-new', GETDATE(), 'SYSTEM');
    PRINT 'Item View assigned to admin role';
END
GO

-- Grant items-new-changes to admin
IF NOT EXISTS (SELECT 1 FROM RolePermissions WHERE RoleName = 'admin' AND PagePath = '/items-new-changes')
BEGIN
    INSERT INTO RolePermissions (RoleName, PagePath, CreatedAt, CreatedBy)
    VALUES ('admin', '/items-new-changes', GETDATE(), 'SYSTEM');
    PRINT 'Pending Changes assigned to admin role';
END
GO

PRINT 'All permissions setup completed!';
