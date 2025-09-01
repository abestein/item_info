const express = require('express');
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const { adminMiddleware } = require('../middleware/auth');
const { calculateRoleFromPermissions, getPageDescription } = require('../config/permissions');

module.exports = (dbConfig) => {
    const router = express.Router();

    // Get all users with pagination
    router.get('/', async (req, res) => {
        try {
            const { page = 1, pageSize = 10, searchTerm = '', role = '', isActive } = req.query;
            const offset = (page - 1) * pageSize;

            const pool = await sql.connect(dbConfig);
            const request = pool.request();

            // Build where clause
            let whereClause = '1=1';
            if (searchTerm) {
                whereClause += ' AND (Username LIKE @searchTerm OR Email LIKE @searchTerm)';
                request.input('searchTerm', sql.NVarChar, `%${searchTerm}%`);
            }
            if (role) {
                whereClause += ' AND Role = @role';
                request.input('role', sql.NVarChar, role);
            }
            if (isActive !== undefined) {
                whereClause += ' AND IsActive = @isActive';
                request.input('isActive', sql.Bit, isActive === 'true');
            }

            // Get total count
            const countResult = await request.query(`
                SELECT COUNT(*) as total 
                FROM Users 
                WHERE ${whereClause}
            `);

            // Get paginated data
            const result = await request.query(`
                SELECT Id, Username, Email, Role, IsActive, 
                       CreatedAt, LastLoginAt
                FROM Users
                WHERE ${whereClause}
                ORDER BY Username
                OFFSET ${offset} ROWS
                FETCH NEXT ${pageSize} ROWS ONLY
            `);

            res.json({
                success: true,
                users: result.recordset,
                total: countResult.recordset[0].total,
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                totalPages: Math.ceil(countResult.recordset[0].total / pageSize)
            });
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch users'
            });
        }
    });

    // Get single user with details
    router.get('/:id', async (req, res) => {
        try {
            // Check permissions
            if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
                return res.status(403).json({
                    success: false,
                    error: 'You can only view your own profile unless you are an admin'
                });
            }

            const pool = await sql.connect(dbConfig);
            
            // Get user details
            const userResult = await pool.request()
                .input('id', sql.Int, req.params.id)
                .query(`
                    SELECT 
                        u.Id,
                        u.Username,
                        u.Email,
                        u.Role,
                        u.IsActive,
                        u.CreatedAt,
                        u.LastLoginAt,
                        (SELECT COUNT(*) FROM UserRoleHistory WHERE UserId = u.Id) as RoleChangesCount,
                        (SELECT TOP 1 ChangedAt 
                         FROM UserRoleHistory 
                         WHERE UserId = u.Id 
                         ORDER BY ChangedAt DESC) as LastRoleChangeAt
                    FROM Users u
                    WHERE u.Id = @id
                `);

            if (userResult.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Get last 5 role changes
            const roleHistoryResult = await pool.request()
                .input('id', sql.Int, req.params.id)
                .query(`
                    SELECT TOP 5
                        h.OldRole,
                        h.NewRole,
                        h.ChangedAt,
                        u.Username as ChangedBy
                    FROM UserRoleHistory h
                    JOIN Users u ON h.ChangedBy = u.Id
                    WHERE h.UserId = @id
                    ORDER BY h.ChangedAt DESC
                `);

            res.json({
                success: true,
                user: {
                    ...userResult.recordset[0],
                    recentRoleChanges: roleHistoryResult.recordset
                }
            });
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch user'
            });
        }
    });

    // Create new user
    router.post('/', async (req, res) => {
        try {
            console.log('POST /api/users - Request body:', req.body);
            const { username, email, password, role } = req.body;

            // Validate input
            const errors = [];
            if (!username || username.length < 3) {
                errors.push('Username must be at least 3 characters long');
            }
            if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                errors.push('Valid email address is required');
            }
            
            // Enhanced password validation
            if (!password) {
                errors.push('Password is required');
            } else {
                if (password.length < 8) {
                    errors.push('Password must be at least 8 characters long');
                }
                if (!/[A-Z]/.test(password)) {
                    errors.push('Password must contain at least one uppercase letter');
                }
                if (!/[a-z]/.test(password)) {
                    errors.push('Password must contain at least one lowercase letter');
                }
                if (!/[0-9]/.test(password)) {
                    errors.push('Password must contain at least one number');
                }
                if (!/[!@#$%^&*]/.test(password)) {
                    errors.push('Password must contain at least one special character (!@#$%^&*)');
                }
            }

            // Validate role if provided
            const validRoles = ['admin', 'user', 'manager', 'readonly'];
            if (role && !validRoles.includes(role)) {
                errors.push(`Invalid role specified. Valid roles are: ${validRoles.join(', ')}`);
            }
            
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: errors.join(', ')
                });
            }

            console.log('Connecting to database...');
            const pool = await sql.connect(dbConfig);
            console.log('Database connected successfully');

            // Check if user exists
            console.log('Checking for existing user...');
            const existingUser = await pool.request()
                .input('username', sql.NVarChar(50), username)
                .input('email', sql.NVarChar(255), email)
                .query('SELECT Id, Username, Email FROM Users WHERE Username = @username OR Email = @email');

            if (existingUser.recordset.length > 0) {
                console.log('User already exists:', existingUser.recordset[0]);
                return res.status(400).json({
                    success: false,
                    error: 'Username or email already exists'
                });
            }

            // Hash password
            console.log('Hashing password...');
            const hashedPassword = await bcrypt.hash(password, 10);
            console.log('Password hashed successfully');

            // Get admin user making the request
            if (!req.user || !req.user.id) {
                console.error('User context missing:', req.user);
                return res.status(401).json({
                    success: false,
                    error: 'User context not found'
                });
            }

            console.log('Creating user with data:', { username, email, role: role || 'user' });

            let transaction;
            try {
                // Start transaction
                transaction = new sql.Transaction(pool);
                await transaction.begin();
                console.log('Transaction started');

                // Insert new user
                const insertRequest = transaction.request()
                    .input('username', sql.NVarChar(50), username)
                    .input('email', sql.NVarChar(255), email)
                    .input('passwordHash', sql.NVarChar(255), hashedPassword)
                    .input('role', sql.NVarChar(20), role || 'user');

                console.log('Executing user insert query');
                const result = await insertRequest.query(`
                    INSERT INTO Users (Username, Email, PasswordHash, Role, IsActive)
                    VALUES (@username, @email, @passwordHash, @role, 1);
                    SELECT SCOPE_IDENTITY() as Id;
                `);

                const newUserId = result.recordset[0].Id;
                console.log('User created with ID:', newUserId);

                // Log role assignment
                const historyRequest = transaction.request()
                    .input('userId', sql.Int, newUserId)
                    .input('oldRole', sql.NVarChar(20), null)
                    .input('newRole', sql.NVarChar(20), role || 'user')
                    .input('changedBy', sql.Int, req.user.id);

                console.log('Logging role assignment');
                await historyRequest.query(`
                    INSERT INTO UserRoleHistory (UserId, OldRole, NewRole, ChangedBy, ChangedAt)
                    VALUES (@userId, @oldRole, @newRole, @changedBy, GETDATE())
                `);

                // Get the created user data before committing
                const createdUserResult = await transaction.request()
                    .input('userId', sql.Int, newUserId)
                    .query(`
                        SELECT Id, Username, Email, Role, IsActive, CreatedAt, LastLoginAt
                        FROM Users 
                        WHERE Id = @userId
                    `);

                await transaction.commit();
                console.log('Transaction committed successfully');

                res.status(201).json({
                    success: true,
                    user: createdUserResult.recordset[0]
                });
            } catch (error) {
                console.error('Transaction error:', error);
                if (transaction) {
                    try {
                        await transaction.rollback();
                        console.log('Transaction rolled back');
                    } catch (rollbackError) {
                        console.error('Rollback error:', rollbackError);
                    }
                }
                throw error;
            }
        } catch (error) {
            console.error('Create user error:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                code: error.code,
                number: error.number,
                state: error.state,
                class: error.class,
                serverName: error.serverName,
                procName: error.procName,
                lineNumber: error.lineNumber
            });
            res.status(500).json({
                success: false,
                error: 'Failed to create user',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });

    // Update user
    router.put('/:id', async (req, res) => {
        try {
            const { username, email, password, role, isActive } = req.body;
            const userId = req.params.id;

            // Check permissions
            if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
                return res.status(403).json({
                    success: false,
                    error: 'You can only update your own account unless you are an admin'
                });
            }

            // Regular users can't change roles
            if (req.user.role !== 'admin' && role) {
                return res.status(403).json({
                    success: false,
                    error: 'Only administrators can change user roles'
                });
            }

            // Validate input
            const errors = [];
            
            // Username validation
            if (username) {
                if (username.length < 3) {
                    errors.push('Username must be at least 3 characters long');
                }
                if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
                    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
                }
            }

            // Email validation
            if (email) {
                if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                    errors.push('Valid email address is required');
                }
                if (email.length > 255) {
                    errors.push('Email address is too long');
                }
            }

            // Password validation
            if (password) {
                if (password.length < 8) {
                    errors.push('Password must be at least 8 characters long');
                }
                if (!/[A-Z]/.test(password)) {
                    errors.push('Password must contain at least one uppercase letter');
                }
                if (!/[a-z]/.test(password)) {
                    errors.push('Password must contain at least one lowercase letter');
                }
                if (!/[0-9]/.test(password)) {
                    errors.push('Password must contain at least one number');
                }
                if (!/[!@#$%^&*]/.test(password)) {
                    errors.push('Password must contain at least one special character (!@#$%^&*)');
                }
            }

            // Role validation
            const validRoles = ['admin', 'user', 'manager', 'readonly'];
            if (role && !validRoles.includes(role)) {
                errors.push(`Invalid role specified. Valid roles are: ${validRoles.join(', ')}`);
            }

            // Active status validation
            if (isActive !== undefined && typeof isActive !== 'boolean') {
                errors.push('IsActive must be a boolean value');
            }
            
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: errors.join(', ')
                });
            }

            const pool = await sql.connect(dbConfig);
            
            // Check if user exists
            const existingUser = await pool.request()
                .input('id', sql.Int, userId)
                .query('SELECT * FROM Users WHERE Id = @id');

            if (existingUser.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            const request = pool.request()
                .input('id', sql.Int, userId);

            // Build update query
            let updateFields = [];
            let queryInputs = [];

            if (username) {
                updateFields.push('Username = @username');
                queryInputs.push(['username', sql.NVarChar(50), username]);
            }
            if (email) {
                updateFields.push('Email = @email');
                queryInputs.push(['email', sql.NVarChar(255), email]);
            }
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                updateFields.push('PasswordHash = @passwordHash');
                queryInputs.push(['passwordHash', sql.NVarChar(255), hashedPassword]);
            }
            if (role) {
                // Get current role before update
                const currentRole = existingUser.recordset[0].Role;
                
                if (role !== currentRole) {
                    updateFields.push('Role = @role');
                    queryInputs.push(['role', sql.NVarChar(20), role]);

                    // Log role change
                    await pool.request()
                        .input('userId', sql.Int, userId)
                        .input('oldRole', sql.NVarChar, currentRole)
                        .input('newRole', sql.NVarChar, role)
                        .input('changedBy', sql.Int, req.user.id)
                        .query(`
                            INSERT INTO UserRoleHistory (UserId, OldRole, NewRole, ChangedBy, ChangedAt)
                            VALUES (@userId, @oldRole, @newRole, @changedBy, GETDATE())
                        `);
                }
            }
            if (isActive !== undefined) {
                updateFields.push('IsActive = @isActive');
                queryInputs.push(['isActive', sql.Bit, isActive]);
            }

            if (updateFields.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No fields to update'
                });
            }

            // Add inputs to request
            queryInputs.forEach(([name, type, value]) => {
                request.input(name, type, value);
            });

            const result = await request.query(`
                UPDATE Users 
                SET ${updateFields.join(', ')}
                WHERE Id = @id;
                SELECT @@ROWCOUNT as count;
            `);

            if (result.recordset[0].count === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Get updated user data
            const updatedUser = await pool.request()
                .input('id', sql.Int, userId)
                .query(`
                    SELECT Id, Username, Email, Role, IsActive, 
                           CreatedAt, LastLoginAt
                    FROM Users
                    WHERE Id = @id
                `);

            res.json({
                success: true,
                user: updatedUser.recordset[0]
            });
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update user'
            });
        }
    });

    // Delete user
    router.delete('/:id', async (req, res) => {
        try {
            const pool = await sql.connect(dbConfig);
            
            // Check if trying to delete the last admin
            if (req.user.role === 'admin') {
                const adminCount = await pool.request()
                    .query('SELECT COUNT(*) as count FROM Users WHERE Role = \'admin\'');
                
                if (adminCount.recordset[0].count <= 1) {
                    return res.status(400).json({
                        success: false,
                        error: 'Cannot delete the last admin user'
                    });
                }
            }

            // Prevent self-deletion
            if (parseInt(req.params.id) === req.user.id) {
                return res.status(400).json({
                    success: false,
                    error: 'Cannot delete your own account'
                });
            }

            // Start transaction
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // Get user details before deletion
                const userResult = await transaction.request()
                    .input('id', sql.Int, req.params.id)
                    .query('SELECT Username, Role FROM Users WHERE Id = @id');

                if (userResult.recordset.length === 0) {
                    await transaction.rollback();
                    return res.status(404).json({
                        success: false,
                        error: 'User not found'
                    });
                }

                const user = userResult.recordset[0];

                // Delete role history first
                await transaction.request()
                    .input('id', sql.Int, req.params.id)
                    .query('DELETE FROM UserRoleHistory WHERE UserId = @id');

                // Delete user
                const result = await transaction.request()
                    .input('id', sql.Int, req.params.id)
                    .query('DELETE FROM Users WHERE Id = @id');

                await transaction.commit();

                res.json({
                    success: true,
                    message: 'User deleted successfully',
                    deletedUser: {
                        id: parseInt(req.params.id),
                        username: user.Username,
                        role: user.Role
                    }
                });
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete user'
            });
        }
    });

    // Get user permissions
    router.get('/:id/permissions', adminMiddleware, async (req, res) => {
        try {
            const userId = req.params.id;
            const pool = await sql.connect(dbConfig);
            
            // Get user details
            const userResult = await pool.request()
                .input('userId', sql.Int, userId)
                .query('SELECT Id, Username, Role FROM Users WHERE Id = @userId');
                
            if (userResult.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            
            const user = userResult.recordset[0];
            
            // Get user's custom permissions
            const permissionsResult = await pool.request()
                .input('userId', sql.Int, userId)
                .query('SELECT Permissions, UseRolePermissions FROM UserPermissions WHERE UserId = @userId');
            
            let userPermissions = null;
            let useRolePermissions = true;
            
            if (permissionsResult.recordset.length > 0) {
                const record = permissionsResult.recordset[0];
                useRolePermissions = record.UseRolePermissions;
                if (!useRolePermissions && record.Permissions) {
                    try {
                        userPermissions = JSON.parse(record.Permissions);
                    } catch (e) {
                        console.error('Error parsing user permissions:', e);
                        userPermissions = [];
                    }
                }
            }
            
            // Get available pages and role-based permissions
            const { pagePermissions, getAccessiblePages } = require('../config/permissions');
            const roleBasedPermissions = getAccessiblePages(user.Role);
            
            const availablePages = Object.entries(pagePermissions).map(([page, roles]) => ({
                page,
                name: page.replace(/[/_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                description: getPageDescription(page),
                category: page.split('/')[1] || 'General'
            }));

            res.json({
                success: true,
                user,
                permissions: userPermissions,
                useRolePermissions,
                availablePages,
                roleBasedPermissions
            });
        } catch (error) {
            console.error('Get user permissions error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch user permissions'
            });
        }
    });


    // Update user permissions
    router.put('/:id/permissions', adminMiddleware, async (req, res) => {
        try {
            const userId = req.params.id;
            const { permissions } = req.body;

            // Determine if using role permissions based on whether permissions is null
            const useRolePermissions = permissions === null;

            // Validate input
            if (!useRolePermissions && !Array.isArray(permissions)) {
                return res.status(400).json({
                    success: false,
                    error: 'Permissions must be an array of page paths or null'
                });
            }

            // Validate all permissions exist if provided
            if (permissions && Array.isArray(permissions)) {
                const { pagePermissions } = require('../config/permissions');
                const invalidPages = permissions.filter(page => !pagePermissions[page]);
                if (invalidPages.length > 0) {
                    return res.status(400).json({
                        success: false,
                        error: `Invalid pages: ${invalidPages.join(', ')}`
                    });
                }
            }

            const pool = await sql.connect(dbConfig);

            // Start transaction
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // Check if user exists
                const userResult = await transaction.request()
                    .input('userId', sql.Int, userId)
                    .query('SELECT Id, Role FROM Users WHERE Id = @userId');

                if (userResult.recordset.length === 0) {
                    await transaction.rollback();
                    return res.status(404).json({
                        success: false,
                        error: 'User not found'
                    });
                }

                // Check if user permissions record exists
                const existingPermissions = await transaction.request()
                    .input('userId', sql.Int, userId)
                    .query('SELECT Id FROM UserPermissions WHERE UserId = @userId');

                const permissionsJson = permissions ? JSON.stringify(permissions) : null;

                if (existingPermissions.recordset.length > 0) {
                    // Update existing record
                    await transaction.request()
                        .input('userId', sql.Int, userId)
                        .input('permissions', sql.NVarChar(sql.MAX), permissionsJson)
                        .input('useRolePermissions', sql.Bit, useRolePermissions)
                        .input('updatedBy', sql.Int, req.user.id)
                        .query(`
                            UPDATE UserPermissions 
                            SET Permissions = @permissions,
                                UseRolePermissions = @useRolePermissions,
                                UpdatedBy = @updatedBy,
                                UpdatedAt = GETDATE()
                            WHERE UserId = @userId
                        `);
                } else {
                    // Create new record
                    await transaction.request()
                        .input('userId', sql.Int, userId)
                        .input('permissions', sql.NVarChar(sql.MAX), permissionsJson)
                        .input('useRolePermissions', sql.Bit, useRolePermissions)
                        .input('createdBy', sql.Int, req.user.id)
                        .input('updatedBy', sql.Int, req.user.id)
                        .query(`
                            INSERT INTO UserPermissions (UserId, Permissions, UseRolePermissions, CreatedBy, UpdatedBy)
                            VALUES (@userId, @permissions, @useRolePermissions, @createdBy, @updatedBy)
                        `);
                }

                await transaction.commit();

                res.json({
                    success: true,
                    message: 'Permissions updated successfully'
                });
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Update permissions error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update user permissions'
            });
        }
    });

    // Get role history for a user (admin only)
    router.get('/:id/role-history', adminMiddleware, async (req, res) => {
        try {
            const pool = await sql.connect(dbConfig);
            const result = await pool.request()
                .input('userId', sql.Int, req.params.id)
                .query(`
                    SELECT 
                        h.Id,
                        h.OldRole,
                        h.NewRole,
                        h.ChangedAt,
                        u.Username as ChangedBy
                    FROM UserRoleHistory h
                    JOIN Users u ON h.ChangedBy = u.Id
                    WHERE h.UserId = @userId
                    ORDER BY h.ChangedAt DESC
                `);

            res.json({
                success: true,
                history: result.recordset
            });
        } catch (error) {
            console.error('Get role history error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch role history'
            });
        }
    });

    return router;
};
