const express = require('express');
const sql = require('mssql');
const { adminMiddleware } = require('../middleware/auth');

module.exports = (dbConfig) => {
    const router = express.Router();

    // Get all roles with their permissions and user counts
    router.get('/', adminMiddleware, async (req, res) => {
        try {
            const pool = await sql.connect(dbConfig);

            const result = await pool.request().query(`
                SELECT
                    r.RoleName,
                    r.DisplayName,
                    r.Description,
                    r.IsActive,
                    COUNT(DISTINCT u.Id) as UserCount,
                    STRING_AGG(rp.PagePath, ',') as Permissions
                FROM Roles r
                LEFT JOIN Users u ON r.RoleName = u.Role AND u.IsActive = 1
                LEFT JOIN RolePermissions rp ON r.RoleName = rp.RoleName
                WHERE r.IsActive = 1
                GROUP BY r.RoleName, r.DisplayName, r.Description, r.IsActive
                ORDER BY r.RoleName
            `);

            const roles = result.recordset.map(role => ({
                role: role.RoleName,
                description: role.Description,
                permissions: role.Permissions ? role.Permissions.split(',') : [],
                userCount: role.UserCount
            }));

            res.json({
                success: true,
                roles
            });
        } catch (error) {
            console.error('Get roles error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch roles'
            });
        }
    });

    // Get permissions for a specific role
    router.get('/:role/permissions', adminMiddleware, async (req, res) => {
        try {
            const { role } = req.params;
            const pool = await sql.connect(dbConfig);

            // Get role details
            const roleResult = await pool.request()
                .input('role', sql.NVarChar, role)
                .query(`
                    SELECT RoleName, DisplayName, Description
                    FROM Roles
                    WHERE RoleName = @role AND IsActive = 1
                `);

            if (roleResult.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Role not found'
                });
            }

            // Get role permissions
            const permissionsResult = await pool.request()
                .input('role', sql.NVarChar, role)
                .query(`
                    SELECT PagePath
                    FROM RolePermissions
                    WHERE RoleName = @role
                `);

            // Get all available pages
            const pagesResult = await pool.request().query(`
                SELECT PagePath, PageName, Description, Category
                FROM PagePermissions
                WHERE IsActive = 1
                ORDER BY Category, PageName
            `);

            res.json({
                success: true,
                role: roleResult.recordset[0],
                permissions: permissionsResult.recordset.map(p => p.PagePath),
                availablePages: pagesResult.recordset
            });
        } catch (error) {
            console.error('Get role permissions error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch role permissions'
            });
        }
    });

    // Update permissions for a specific role
    router.put('/:role/permissions', adminMiddleware, async (req, res) => {
        try {
            const { role } = req.params;
            const { permissions } = req.body;

            if (!Array.isArray(permissions)) {
                return res.status(400).json({
                    success: false,
                    error: 'Permissions must be an array'
                });
            }

            const pool = await sql.connect(dbConfig);
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // Verify role exists
                const roleCheck = await transaction.request()
                    .input('role', sql.NVarChar, role)
                    .query('SELECT RoleName FROM Roles WHERE RoleName = @role AND IsActive = 1');

                if (roleCheck.recordset.length === 0) {
                    await transaction.rollback();
                    return res.status(404).json({
                        success: false,
                        error: 'Role not found'
                    });
                }

                // Verify all permissions exist
                if (permissions.length > 0) {
                    const permissionCheck = await transaction.request()
                        .query(`
                            SELECT PagePath
                            FROM PagePermissions
                            WHERE PagePath IN ('${permissions.join("','")}') AND IsActive = 1
                        `);

                    if (permissionCheck.recordset.length !== permissions.length) {
                        await transaction.rollback();
                        return res.status(400).json({
                            success: false,
                            error: 'One or more permissions are invalid'
                        });
                    }
                }

                // Remove existing permissions
                await transaction.request()
                    .input('role', sql.NVarChar, role)
                    .query('DELETE FROM RolePermissions WHERE RoleName = @role');

                // Insert new permissions
                if (permissions.length > 0) {
                    for (const permission of permissions) {
                        await transaction.request()
                            .input('role', sql.NVarChar, role)
                            .input('permission', sql.NVarChar, permission)
                            .input('createdBy', sql.NVarChar, req.user.username)
                            .query(`
                                INSERT INTO RolePermissions (RoleName, PagePath, CreatedBy)
                                VALUES (@role, @permission, @createdBy)
                            `);
                    }
                }

                await transaction.commit();

                res.json({
                    success: true,
                    message: 'Role permissions updated successfully'
                });
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Update role permissions error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update role permissions'
            });
        }
    });

    // Get all available pages
    router.get('/pages/available', adminMiddleware, async (req, res) => {
        try {
            const pool = await sql.connect(dbConfig);
            const result = await pool.request().query(`
                SELECT PagePath, PageName, Description, Category
                FROM PagePermissions
                WHERE IsActive = 1
                ORDER BY Category, PageName
            `);

            res.json({
                success: true,
                pages: result.recordset
            });
        } catch (error) {
            console.error('Get available pages error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch available pages'
            });
        }
    });

    // Create a new role (optional - for future use)
    router.post('/', adminMiddleware, async (req, res) => {
        try {
            const { roleName, displayName, description, permissions = [] } = req.body;

            if (!roleName || !displayName) {
                return res.status(400).json({
                    success: false,
                    error: 'Role name and display name are required'
                });
            }

            const pool = await sql.connect(dbConfig);
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // Check if role already exists
                const existingRole = await transaction.request()
                    .input('roleName', sql.NVarChar, roleName)
                    .query('SELECT RoleName FROM Roles WHERE RoleName = @roleName');

                if (existingRole.recordset.length > 0) {
                    await transaction.rollback();
                    return res.status(409).json({
                        success: false,
                        error: 'Role already exists'
                    });
                }

                // Create role
                await transaction.request()
                    .input('roleName', sql.NVarChar, roleName)
                    .input('displayName', sql.NVarChar, displayName)
                    .input('description', sql.NVarChar, description)
                    .input('createdBy', sql.NVarChar, req.user.username)
                    .query(`
                        INSERT INTO Roles (RoleName, DisplayName, Description, CreatedBy)
                        VALUES (@roleName, @displayName, @description, @createdBy)
                    `);

                // Add permissions if provided
                if (permissions.length > 0) {
                    for (const permission of permissions) {
                        await transaction.request()
                            .input('roleName', sql.NVarChar, roleName)
                            .input('permission', sql.NVarChar, permission)
                            .input('createdBy', sql.NVarChar, req.user.username)
                            .query(`
                                INSERT INTO RolePermissions (RoleName, PagePath, CreatedBy)
                                VALUES (@roleName, @permission, @createdBy)
                            `);
                    }
                }

                await transaction.commit();

                res.status(201).json({
                    success: true,
                    message: 'Role created successfully',
                    role: {
                        roleName,
                        displayName,
                        description,
                        permissions
                    }
                });
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Create role error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create role'
            });
        }
    });

    // Update role details (name, description)
    router.put('/:role', adminMiddleware, async (req, res) => {
        try {
            const { role } = req.params;
            const { displayName, description } = req.body;

            if (!displayName) {
                return res.status(400).json({
                    success: false,
                    error: 'Display name is required'
                });
            }

            const pool = await sql.connect(dbConfig);

            const result = await pool.request()
                .input('role', sql.NVarChar, role)
                .input('displayName', sql.NVarChar, displayName)
                .input('description', sql.NVarChar, description)
                .input('updatedBy', sql.NVarChar, req.user.username)
                .query(`
                    UPDATE Roles
                    SET DisplayName = @displayName,
                        Description = @description,
                        UpdatedBy = @updatedBy,
                        UpdatedAt = GETDATE()
                    WHERE RoleName = @role AND IsActive = 1;
                    SELECT @@ROWCOUNT as affectedRows;
                `);

            if (result.recordset[0].affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Role not found'
                });
            }

            res.json({
                success: true,
                message: 'Role updated successfully'
            });
        } catch (error) {
            console.error('Update role error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update role'
            });
        }
    });

    return router;
};