-- Add missing page permissions for sub-menu routes
-- This script adds pages that are needed for granular permission control

-- Insert missing pages if they don't already exist
IF NOT EXISTS (SELECT 1 FROM dbo.PagePermissions WHERE PagePath = '/users/roles')
    INSERT INTO dbo.PagePermissions (PagePath, PageName, Description, Category)
    VALUES ('/users/roles', 'Role Permissions', 'Manage role permissions and access control', 'Management');

IF NOT EXISTS (SELECT 1 FROM dbo.PagePermissions WHERE PagePath = '/items-new')
    INSERT INTO dbo.PagePermissions (PagePath, PageName, Description, Category)
    VALUES ('/items-new', 'Item View', 'View and manage items in the new interface', 'Data');

IF NOT EXISTS (SELECT 1 FROM dbo.PagePermissions WHERE PagePath = '/items-new-operations')
    INSERT INTO dbo.PagePermissions (PagePath, PageName, Description, Category)
    VALUES ('/items-new-operations', 'Operations', 'Perform operations on item data', 'Data');

IF NOT EXISTS (SELECT 1 FROM dbo.PagePermissions WHERE PagePath = '/items-new-changes')
    INSERT INTO dbo.PagePermissions (PagePath, PageName, Description, Category)
    VALUES ('/items-new-changes', 'View Pending Changes', 'View and review pending item changes', 'Data');

IF NOT EXISTS (SELECT 1 FROM dbo.PagePermissions WHERE PagePath = '/vendor-items-upload')
    INSERT INTO dbo.PagePermissions (PagePath, PageName, Description, Category)
    VALUES ('/vendor-items-upload', 'Vendor Upload', 'Upload vendor items data', 'Data');

IF NOT EXISTS (SELECT 1 FROM dbo.PagePermissions WHERE PagePath = '/vendor-items-test-upload')
    INSERT INTO dbo.PagePermissions (PagePath, PageName, Description, Category)
    VALUES ('/vendor-items-test-upload', 'Vendor Test Upload', 'Upload vendor items for testing', 'Data');

IF NOT EXISTS (SELECT 1 FROM dbo.PagePermissions WHERE PagePath = '/data-team-upload')
    INSERT INTO dbo.PagePermissions (PagePath, PageName, Description, Category)
    VALUES ('/data-team-upload', 'Data Team Upload', 'Upload data team items', 'Data');

-- Verify pages were added
SELECT PagePath, PageName, Category, IsActive
FROM dbo.PagePermissions
WHERE PagePath IN (
    '/users/roles',
    '/items-new',
    '/items-new-operations',
    '/items-new-changes',
    '/vendor-items-upload',
    '/vendor-items-test-upload',
    '/data-team-upload'
)
ORDER BY Category, PageName;

PRINT 'Missing pages have been added to PagePermissions table';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Review the role permissions in the admin panel';
PRINT '2. Assign these new pages to appropriate roles';
PRINT '3. Test user access to ensure permissions work correctly';
