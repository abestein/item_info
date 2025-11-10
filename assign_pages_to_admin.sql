-- Assign new pages to admin role
-- Admin should have access to all pages

-- Add role permissions for new pages (if they don't already exist)
IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleName = 'admin' AND PagePath = '/users/roles')
    INSERT INTO dbo.RolePermissions (RoleName, PagePath, CreatedBy)
    VALUES ('admin', '/users/roles', 'SYSTEM');

IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleName = 'admin' AND PagePath = '/items-new')
    INSERT INTO dbo.RolePermissions (RoleName, PagePath, CreatedBy)
    VALUES ('admin', '/items-new', 'SYSTEM');

IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleName = 'admin' AND PagePath = '/items-new-operations')
    INSERT INTO dbo.RolePermissions (RoleName, PagePath, CreatedBy)
    VALUES ('admin', '/items-new-operations', 'SYSTEM');

IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleName = 'admin' AND PagePath = '/items-new-changes')
    INSERT INTO dbo.RolePermissions (RoleName, PagePath, CreatedBy)
    VALUES ('admin', '/items-new-changes', 'SYSTEM');

IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleName = 'admin' AND PagePath = '/vendor-items-upload')
    INSERT INTO dbo.RolePermissions (RoleName, PagePath, CreatedBy)
    VALUES ('admin', '/vendor-items-upload', 'SYSTEM');

IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleName = 'admin' AND PagePath = '/vendor-items-test-upload')
    INSERT INTO dbo.RolePermissions (RoleName, PagePath, CreatedBy)
    VALUES ('admin', '/vendor-items-test-upload', 'SYSTEM');

IF NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleName = 'admin' AND PagePath = '/data-team-upload')
    INSERT INTO dbo.RolePermissions (RoleName, PagePath, CreatedBy)
    VALUES ('admin', '/data-team-upload', 'SYSTEM');

-- Verify admin has all permissions
PRINT 'Admin role permissions:';
SELECT rp.RoleName, rp.PagePath, pp.PageName, pp.Category
FROM dbo.RolePermissions rp
JOIN dbo.PagePermissions pp ON rp.PagePath = pp.PagePath
WHERE rp.RoleName = 'admin'
ORDER BY pp.Category, pp.PageName;

PRINT '';
PRINT 'Admin role now has access to all pages!';
