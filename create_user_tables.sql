-- =============================================================================
-- USER MANAGEMENT DATABASE SCHEMA
-- Complete user, role, and permission management tables
-- =============================================================================

-- Drop existing tables if they exist (for clean recreation)
IF OBJECT_ID('dbo.UserRoleHistory', 'U') IS NOT NULL DROP TABLE dbo.UserRoleHistory;
IF OBJECT_ID('dbo.UserPermissions', 'U') IS NOT NULL DROP TABLE dbo.UserPermissions;
IF OBJECT_ID('dbo.RolePermissions', 'U') IS NOT NULL DROP TABLE dbo.RolePermissions;
IF OBJECT_ID('dbo.PagePermissions', 'U') IS NOT NULL DROP TABLE dbo.PagePermissions;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
IF OBJECT_ID('dbo.Roles', 'U') IS NOT NULL DROP TABLE dbo.Roles;

-- =============================================================================
-- TABLE 1: Roles - Define available roles in the system
-- =============================================================================
CREATE TABLE dbo.Roles (
    Id INT IDENTITY(1,1) NOT NULL,
    RoleName NVARCHAR(50) NOT NULL UNIQUE,
    DisplayName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CreatedBy NVARCHAR(50) NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedBy NVARCHAR(50) NULL,

    CONSTRAINT PK_Roles PRIMARY KEY CLUSTERED (Id)
);

-- =============================================================================
-- TABLE 2: PagePermissions - Define available pages in the system
-- =============================================================================
CREATE TABLE dbo.PagePermissions (
    Id INT IDENTITY(1,1) NOT NULL,
    PagePath NVARCHAR(100) NOT NULL UNIQUE,
    PageName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255) NULL,
    Category NVARCHAR(50) NOT NULL DEFAULT 'General',
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_PagePermissions PRIMARY KEY CLUSTERED (Id)
);

-- =============================================================================
-- TABLE 3: Users - User accounts
-- =============================================================================
CREATE TABLE dbo.Users (
    Id INT IDENTITY(1,1) NOT NULL,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(50) NOT NULL DEFAULT 'user',
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    LastLoginAt DATETIME2 NULL,
    FailedLoginAttempts INT NOT NULL DEFAULT 0,
    LockedUntil DATETIME2 NULL,

    CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_Users_Role FOREIGN KEY (Role) REFERENCES dbo.Roles(RoleName)
        ON UPDATE CASCADE
);

-- =============================================================================
-- TABLE 4: RolePermissions - Which pages each role can access by default
-- =============================================================================
CREATE TABLE dbo.RolePermissions (
    Id INT IDENTITY(1,1) NOT NULL,
    RoleName NVARCHAR(50) NOT NULL,
    PagePath NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CreatedBy NVARCHAR(50) NULL,

    CONSTRAINT PK_RolePermissions PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_RolePermissions_Role FOREIGN KEY (RoleName) REFERENCES dbo.Roles(RoleName)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT FK_RolePermissions_Page FOREIGN KEY (PagePath) REFERENCES dbo.PagePermissions(PagePath)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT UQ_RolePermissions_RolePage UNIQUE (RoleName, PagePath)
);

-- =============================================================================
-- TABLE 5: UserPermissions - Custom permissions for individual users
-- =============================================================================
CREATE TABLE dbo.UserPermissions (
    Id INT IDENTITY(1,1) NOT NULL,
    UserId INT NOT NULL,
    Permissions NVARCHAR(MAX) NULL, -- JSON array of page paths, null means use role permissions
    UseRolePermissions BIT NOT NULL DEFAULT 1, -- true = use role, false = use custom permissions
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CreatedBy INT NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedBy INT NULL,

    CONSTRAINT PK_UserPermissions PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_UserPermissions_User FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
        ON DELETE CASCADE,
    CONSTRAINT FK_UserPermissions_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_UserPermissions_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT UQ_UserPermissions_User UNIQUE (UserId)
);

-- =============================================================================
-- TABLE 6: UserRoleHistory - Track role changes for auditing
-- =============================================================================
CREATE TABLE dbo.UserRoleHistory (
    Id INT IDENTITY(1,1) NOT NULL,
    UserId INT NOT NULL,
    OldRole NVARCHAR(50) NULL,
    NewRole NVARCHAR(50) NOT NULL,
    ChangedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ChangedBy INT NOT NULL,
    Reason NVARCHAR(255) NULL,

    CONSTRAINT PK_UserRoleHistory PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_UserRoleHistory_User FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
        ON DELETE CASCADE,
    CONSTRAINT FK_UserRoleHistory_ChangedBy FOREIGN KEY (ChangedBy) REFERENCES dbo.Users(Id)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Users table indexes
CREATE NONCLUSTERED INDEX IX_Users_Role ON dbo.Users(Role) INCLUDE (IsActive);
CREATE NONCLUSTERED INDEX IX_Users_Active ON dbo.Users(IsActive) INCLUDE (Role);
CREATE NONCLUSTERED INDEX IX_Users_Email ON dbo.Users(Email) WHERE IsActive = 1;
CREATE NONCLUSTERED INDEX IX_Users_LastLogin ON dbo.Users(LastLoginAt) WHERE IsActive = 1;

-- RolePermissions indexes
CREATE NONCLUSTERED INDEX IX_RolePermissions_Role ON dbo.RolePermissions(RoleName);
CREATE NONCLUSTERED INDEX IX_RolePermissions_Page ON dbo.RolePermissions(PagePath);

-- UserPermissions indexes
CREATE NONCLUSTERED INDEX IX_UserPermissions_User ON dbo.UserPermissions(UserId);
CREATE NONCLUSTERED INDEX IX_UserPermissions_UseRole ON dbo.UserPermissions(UseRolePermissions);

-- UserRoleHistory indexes
CREATE NONCLUSTERED INDEX IX_UserRoleHistory_User ON dbo.UserRoleHistory(UserId, ChangedAt);
CREATE NONCLUSTERED INDEX IX_UserRoleHistory_Date ON dbo.UserRoleHistory(ChangedAt) INCLUDE (UserId, OldRole, NewRole);

-- =============================================================================
-- INSERT DEFAULT DATA
-- =============================================================================

-- Insert default roles
INSERT INTO dbo.Roles (RoleName, DisplayName, Description, CreatedBy) VALUES
('admin', 'Administrator', 'Full system access - can manage all users, settings, and data', 'SYSTEM'),
('manager', 'Manager', 'Management access - can upload data and manage items', 'SYSTEM'),
('editor', 'Editor', 'Can edit items and work with data team functions', 'SYSTEM'),
('user', 'User', 'Standard user access to view and manage items', 'SYSTEM'),
('readonly', 'Read Only', 'View-only access to dashboard and reports', 'SYSTEM');

-- Insert default pages
INSERT INTO dbo.PagePermissions (PagePath, PageName, Description, Category) VALUES
('/dashboard', 'Dashboard', 'Main dashboard with overview and statistics', 'General'),
('/users', 'User Management', 'Manage users and their permissions', 'Management'),
('/items', 'Item Management', 'View and manage inventory items', 'Data'),
('/reports', 'Reports', 'View system reports and analytics', 'Reports'),
('/settings', 'System Settings', 'Configure system settings and preferences', 'System'),
('/upload', 'File Upload', 'Upload files and import data', 'Data'),
('/upload-data-team', 'Data Team Upload', 'Upload data team active items to temp table', 'Data'),
('/compare-data-team', 'Data Team Compare', 'Compare and override data team active items', 'Data');

-- Insert default role permissions
INSERT INTO dbo.RolePermissions (RoleName, PagePath, CreatedBy) VALUES
-- Admin - Full access
('admin', '/dashboard', 'SYSTEM'),
('admin', '/users', 'SYSTEM'),
('admin', '/items', 'SYSTEM'),
('admin', '/reports', 'SYSTEM'),
('admin', '/settings', 'SYSTEM'),
('admin', '/upload', 'SYSTEM'),
('admin', '/upload-data-team', 'SYSTEM'),
('admin', '/compare-data-team', 'SYSTEM'),

-- Manager - Management + uploads
('manager', '/dashboard', 'SYSTEM'),
('manager', '/items', 'SYSTEM'),
('manager', '/reports', 'SYSTEM'),
('manager', '/upload', 'SYSTEM'),
('manager', '/upload-data-team', 'SYSTEM'),

-- Editor - Edit items + data team functions
('editor', '/dashboard', 'SYSTEM'),
('editor', '/items', 'SYSTEM'),
('editor', '/reports', 'SYSTEM'),
('editor', '/upload-data-team', 'SYSTEM'),
('editor', '/compare-data-team', 'SYSTEM'),

-- User - Standard access
('user', '/dashboard', 'SYSTEM'),
('user', '/items', 'SYSTEM'),

-- Readonly - View only
('readonly', '/dashboard', 'SYSTEM'),
('readonly', '/reports', 'SYSTEM');

-- Create default admin user (password: Admin123!)
INSERT INTO dbo.Users (Username, Email, PasswordHash, Role, CreatedAt) VALUES
('admin', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', GETDATE());

-- =============================================================================
-- VALIDATION CONSTRAINTS
-- =============================================================================

-- Role validation
ALTER TABLE dbo.Users
ADD CONSTRAINT CHK_Users_Role
CHECK (Role IN ('admin', 'manager', 'editor', 'user', 'readonly'));

-- Email format validation (basic)
ALTER TABLE dbo.Users
ADD CONSTRAINT CHK_Users_Email
CHECK (Email LIKE '%@%.%');

-- Username length validation
ALTER TABLE dbo.Users
ADD CONSTRAINT CHK_Users_Username
CHECK (LEN(Username) >= 3);

-- =============================================================================
-- HELPFUL VIEWS FOR REPORTING
-- =============================================================================

-- View: User permissions with role inheritance
CREATE VIEW dbo.vw_UserEffectivePermissions AS
SELECT
    u.Id as UserId,
    u.Username,
    u.Email,
    u.Role,
    u.IsActive,
    CASE
        WHEN up.UseRolePermissions = 0 AND up.Permissions IS NOT NULL
        THEN up.Permissions
        ELSE (
            SELECT STRING_AGG(rp.PagePath, ',')
            FROM dbo.RolePermissions rp
            WHERE rp.RoleName = u.Role
        )
    END as EffectivePermissions,
    CASE
        WHEN up.UseRolePermissions = 0 THEN 'Custom'
        ELSE 'Role-based'
    END as PermissionType
FROM dbo.Users u
LEFT JOIN dbo.UserPermissions up ON u.Id = up.UserId
WHERE u.IsActive = 1;

-- View: Role summary with user counts
CREATE VIEW dbo.vw_RoleSummary AS
SELECT
    r.RoleName,
    r.DisplayName,
    r.Description,
    COUNT(u.Id) as UserCount,
    STRING_AGG(rp.PagePath, ',') as DefaultPages
FROM dbo.Roles r
LEFT JOIN dbo.Users u ON r.RoleName = u.Role AND u.IsActive = 1
LEFT JOIN dbo.RolePermissions rp ON r.RoleName = rp.RoleName
WHERE r.IsActive = 1
GROUP BY r.RoleName, r.DisplayName, r.Description;

-- =============================================================================
-- STORED PROCEDURES FOR COMMON OPERATIONS
-- =============================================================================

-- Procedure: Get user permissions (combines role and custom permissions)
CREATE PROCEDURE dbo.sp_GetUserPermissions
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        u.Id,
        u.Username,
        u.Email,
        u.Role,
        up.Permissions as CustomPermissions,
        ISNULL(up.UseRolePermissions, 1) as UseRolePermissions,
        (
            SELECT STRING_AGG(rp.PagePath, ',')
            FROM dbo.RolePermissions rp
            WHERE rp.RoleName = u.Role
        ) as RoleBasedPermissions,
        (
            SELECT
                pp.PagePath,
                pp.PageName,
                pp.Description,
                pp.Category
            FROM dbo.PagePermissions pp
            WHERE pp.IsActive = 1
            FOR JSON PATH
        ) as AvailablePages
    FROM dbo.Users u
    LEFT JOIN dbo.UserPermissions up ON u.Id = up.UserId
    WHERE u.Id = @UserId AND u.IsActive = 1;
END;

-- Procedure: Update role permissions
CREATE PROCEDURE dbo.sp_UpdateRolePermissions
    @RoleName NVARCHAR(50),
    @PagePaths NVARCHAR(MAX), -- Comma-separated list
    @UpdatedBy NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        -- Remove existing permissions for this role
        DELETE FROM dbo.RolePermissions WHERE RoleName = @RoleName;

        -- Insert new permissions
        IF @PagePaths IS NOT NULL AND LEN(@PagePaths) > 0
        BEGIN
            INSERT INTO dbo.RolePermissions (RoleName, PagePath, CreatedBy)
            SELECT
                @RoleName,
                TRIM(value),
                @UpdatedBy
            FROM STRING_SPLIT(@PagePaths, ',')
            WHERE TRIM(value) != '';
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check table creation
SELECT
    t.name AS TableName,
    c.name AS ColumnName,
    ty.name AS DataType,
    c.max_length,
    c.is_nullable
FROM sys.tables t
INNER JOIN sys.columns c ON t.object_id = c.object_id
INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
WHERE t.name IN ('Users', 'Roles', 'PagePermissions', 'RolePermissions', 'UserPermissions', 'UserRoleHistory')
ORDER BY t.name, c.column_id;

-- Check default data
SELECT 'Roles' as TableName, COUNT(*) as RecordCount FROM dbo.Roles
UNION ALL
SELECT 'PagePermissions' as TableName, COUNT(*) as RecordCount FROM dbo.PagePermissions
UNION ALL
SELECT 'RolePermissions' as TableName, COUNT(*) as RecordCount FROM dbo.RolePermissions
UNION ALL
SELECT 'Users' as TableName, COUNT(*) as RecordCount FROM dbo.Users;

-- Test the view
SELECT * FROM dbo.vw_RoleSummary;

PRINT 'User management database schema created successfully!';
PRINT 'Default admin user created with username: admin, password: Admin123!';