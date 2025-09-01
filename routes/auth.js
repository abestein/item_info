const express = require('express');
const router = express.Router();
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// JWT Secret - Add this to your .env file
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

module.exports = (dbConfig) => {
    // Login route
    router.post('/login', async (req, res) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Username and password are required'
                });
            }

            const pool = await sql.connect(dbConfig);
            const result = await pool.request()
                .input('username', sql.NVarChar, username)
                .query('SELECT * FROM Users WHERE Username = @username OR Email = @username');

            const user = result.recordset[0];

            if (!user || !user.IsActive) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials'
                });
            }

            const isValidPassword = await bcrypt.compare(password, user.PasswordHash);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    id: user.Id,
                    username: user.Username,
                    email: user.Email,
                    role: user.Role
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
                    role: user.Role
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