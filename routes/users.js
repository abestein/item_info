const express = require('express');
const sql = require('mssql');
const bcrypt = require('bcryptjs');

module.exports = (dbConfig) => {
    const router = express.Router();

    // Get all users
    router.get('/', async (req, res) => {
        try {
            const pool = await sql.connect(dbConfig);
            const result = await pool.request()
                .query(`
                    SELECT Id, Username, Email, Role, IsActive, 
                           CreatedAt, LastLoginAt
                    FROM Users
                    ORDER BY Username
                `);

            res.json({
                success: true,
                users: result.recordset
            });
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch users'
            });
        }
    });

    // Get single user
    router.get('/:id', async (req, res) => {
        try {
            const pool = await sql.connect(dbConfig);
            const result = await pool.request()
                .input('id', sql.Int, req.params.id)
                .query(`
                    SELECT Id, Username, Email, Role, IsActive, 
                           CreatedAt, LastLoginAt
                    FROM Users
                    WHERE Id = @id
                `);

            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            res.json({
                success: true,
                user: result.recordset[0]
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
            const { username, email, password, role } = req.body;

            // Validate input
            if (!username || !email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Username, email and password are required'
                });
            }

            const pool = await sql.connect(dbConfig);

            // Check if user exists
            const existingUser = await pool.request()
                .input('username', sql.NVarChar, username)
                .input('email', sql.NVarChar, email)
                .query('SELECT * FROM Users WHERE Username = @username OR Email = @email');

            if (existingUser.recordset.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Username or email already exists'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new user
            const result = await pool.request()
                .input('username', sql.NVarChar, username)
                .input('email', sql.NVarChar, email)
                .input('passwordHash', sql.NVarChar, hashedPassword)
                .input('role', sql.NVarChar, role || 'user')
                .query(`
                    INSERT INTO Users (Username, Email, PasswordHash, Role, IsActive)
                    VALUES (@username, @email, @passwordHash, @role, 1);
                    SELECT SCOPE_IDENTITY() as Id;
                `);

            res.status(201).json({
                success: true,
                userId: result.recordset[0].Id
            });
        } catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create user'
            });
        }
    });

    // Update user
    router.put('/:id', async (req, res) => {
        try {
            const { username, email, password, role, isActive } = req.body;
            const userId = req.params.id;

            const pool = await sql.connect(dbConfig);
            const request = pool.request()
                .input('id', sql.Int, userId);

            // Build update query
            let updateFields = [];
            let queryInputs = [];

            if (username) {
                updateFields.push('Username = @username');
                queryInputs.push(['username', sql.NVarChar, username]);
            }
            if (email) {
                updateFields.push('Email = @email');
                queryInputs.push(['email', sql.NVarChar, email]);
            }
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                updateFields.push('PasswordHash = @passwordHash');
                queryInputs.push(['passwordHash', sql.NVarChar, hashedPassword]);
            }
            if (role) {
                updateFields.push('Role = @role');
                queryInputs.push(['role', sql.NVarChar, role]);
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

            res.json({
                success: true,
                message: 'User updated successfully'
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
            const result = await pool.request()
                .input('id', sql.Int, req.params.id)
                .query(`
                    DELETE FROM Users
                    WHERE Id = @id;
                    SELECT @@ROWCOUNT as count;
                `);

            if (result.recordset[0].count === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete user'
            });
        }
    });

    return router;
};
