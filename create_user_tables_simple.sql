-- Create core user management tables
USE Item_DimensionsBU;

-- Drop existing tables if they exist
IF OBJECT_ID('dbo.UserRoleHistory', 'U') IS NOT NULL DROP TABLE dbo.UserRoleHistory;
IF OBJECT_ID('dbo.UserPermissions', 'U') IS NOT NULL DROP TABLE dbo.UserPermissions;
IF OBJECT_ID('dbo.RolePermissions', 'U') IS NOT NULL DROP TABLE dbo.RolePermissions;
IF OBJECT_ID('dbo.PagePermissions', 'U') IS NOT NULL DROP TABLE dbo.PagePermissions;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
IF OBJECT_ID('dbo.Roles', 'U') IS NOT NULL DROP TABLE dbo.Roles;

-- Create Roles table
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

-- Create PagePermissions table
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

-- Create Users table
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
    CONSTRAINT FK_Users_Role FOREIGN KEY (Role) REFERENCES dbo.Roles(RoleName) ON UPDATE CASCADE
);

-- Create RolePermissions table
CREATE TABLE dbo.RolePermissions (
    Id INT IDENTITY(1,1) NOT NULL,
    RoleName NVARCHAR(50) NOT NULL,
    PagePath NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CreatedBy NVARCHAR(50) NULL,
    CONSTRAINT PK_RolePermissions PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_RolePermissions_Role FOREIGN KEY (RoleName) REFERENCES dbo.Roles(RoleName) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT FK_RolePermissions_Page FOREIGN KEY (PagePath) REFERENCES dbo.PagePermissions(PagePath) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT UQ_RolePermissions_RolePage UNIQUE (RoleName, PagePath)
);

-- Create UserPermissions table
CREATE TABLE dbo.UserPermissions (
    Id INT IDENTITY(1,1) NOT NULL,
    UserId INT NOT NULL,
    Permissions NVARCHAR(MAX) NULL,
    UseRolePermissions BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CreatedBy INT NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedBy INT NULL,
    CONSTRAINT PK_UserPermissions PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_UserPermissions_User FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_UserPermissions_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT FK_UserPermissions_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.Users(Id),
    CONSTRAINT UQ_UserPermissions_User UNIQUE (UserId)
);

-- Create UserRoleHistory table
CREATE TABLE dbo.UserRoleHistory (
    Id INT IDENTITY(1,1) NOT NULL,
    UserId INT NOT NULL,
    OldRole NVARCHAR(50) NULL,
    NewRole NVARCHAR(50) NOT NULL,
    ChangedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ChangedBy INT NOT NULL,
    Reason NVARCHAR(255) NULL,
    CONSTRAINT PK_UserRoleHistory PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_UserRoleHistory_User FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_UserRoleHistory_ChangedBy FOREIGN KEY (ChangedBy) REFERENCES dbo.Users(Id)
);

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

PRINT 'User management tables created successfully!';
PRINT 'Default admin user: admin / Admin123!';