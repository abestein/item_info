const express = require('express');
const router = express.Router();
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (dbConfig) => {
    // Login route
    router.post('/login', async (req, res) => {
        console.log('===== AUTH ROUTE HIT =====');
        try {
            console.log('Login attempt received:', { username: req.body.username, hasPassword: !!req.body.password });
            const { username, password } = req.body;

            if (!username || !password) {
                console.log('Missing username or password');
                return res.status(400).json({
                    success: false,
                    error: 'Username and password are required'
                });
            }

            const pool = await sql.connect(dbConfig);
            const result = await pool.request()
                .input('username', sql.NVarChar, username)
                .query('SELECT * FROM Users WHERE Username = @username OR Email = @username');

            console.log('Database query result:', result.recordset.length, 'users found');
            const user = result.recordset[0];

            if (!user || !user.IsActive) {
                console.log('User not found or inactive:', { found: !!user, active: user?.IsActive });
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials'
                });
            }

            console.log('Found user:', { id: user.Id, username: user.Username, role: user.Role });
            const isValidPassword = await bcrypt.compare(password, user.PasswordHash);
            console.log('Password valid:', isValidPassword);

            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials'
                });
            }

            // Get user permissions
            const permissionsResult = await pool.request()
                .input('userId', sql.Int, user.Id)
                .query('SELECT Permissions, UseRolePermissions FROM UserPermissions WHERE UserId = @userId');

            let userPermissions = null;
            if (permissionsResult.recordset.length > 0) {
                const permRecord = permissionsResult.recordset[0];
                if (!permRecord.UseRolePermissions && permRecord.Permissions) {
                    try {
                        userPermissions = JSON.parse(permRecord.Permissions);
                    } catch (e) {
                        console.error('Error parsing permissions:', e);
                    }
                }
            }

            // If no custom permissions, get role-based permissions from database
            if (userPermissions === null) {
                const rolePermissionsResult = await pool.request()
                    .input('role', sql.NVarChar, user.Role)
                    .query('SELECT PagePath FROM RolePermissions WHERE RoleName = @role');

                userPermissions = rolePermissionsResult.recordset.map(r => r.PagePath);
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    id: user.Id,
                    username: user.Username,
                    email: user.Email,
                    role: user.Role,
                    permissions: userPermissions
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                token,
                user: {
                    id: user.Id,
                    username: user.Username,
                    email: user.Email,
                    role: user.Role,
                    permissions: userPermissions
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                error: 'Login failed'
            });
        }
    });

    // Register route
    router.post('/register', async (req, res) => {
        try {
            const { username, email, password } = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'All fields are required'
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
                    error: 'User already exists'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new user
            const result = await pool.request()
                .input('username', sql.NVarChar, username)
                .input('email', sql.NVarChar, email)
                .input('passwordHash', sql.NVarChar, hashedPassword)
                .query(`
                    INSERT INTO Users (Username, Email, PasswordHash)
                    VALUES (@username, @email, @passwordHash);
                    SELECT SCOPE_IDENTITY() as Id;
                `);

            const userId = result.recordset[0].Id;

            // Generate token
            const token = jwt.sign(
                { id: userId, username, email, role: 'user' },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                success: true,
                token,
                user: { id: userId, username, email, role: 'user' }
            });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({
                success: false,
                error: 'Registration failed'
            });
        }
    });

    // Verify token route
    router.get('/verify', async (req, res) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided'
                });
            }

            const decoded = jwt.verify(token, JWT_SECRET);
            res.json({ success: true, user: decoded });
        } catch (error) {
            res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }
    });

    return router;
};
