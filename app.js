const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const multer = require('multer');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');
const path = require('path');
const fs = require('fs');
const UploadHandler = require('./helpers/uploadHandler');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.xlsx' || ext === '.xls') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed'), false);
        }
    }
});

// Database configuration
const dbConfig = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectTimeout: 10000,
        requestTimeout: 15000
    }
};

// NOW require auth routes AFTER dbConfig is defined
const authRoutes = require('./routes/auth')(dbConfig);
const dashboardRoutes = require('./routes/dashboard')(dbConfig);
const userRoutes = require('./routes/users')(dbConfig);
const permissionsRoutes = require('./routes/permissions')(dbConfig);
const { authMiddleware, adminMiddleware } = require('./middleware/auth');

// Add auth routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes);

// Apply auth middleware and rate limiting to protected routes
app.use('/api/dashboard', authMiddleware, apiLimiter, dashboardRoutes);

// User management routes (admin only)
app.use('/api/users', authMiddleware, adminMiddleware, apiLimiter, userRoutes);

// Permissions routes (admin only)
app.use('/api/permissions', authMiddleware, adminMiddleware, apiLimiter, permissionsRoutes);

// Progress tracking
let uploadProgress = {};

// API ROUTES

// Get products/measurement data (protected)
app.get('/api/products', authMiddleware, async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query`SELECT * FROM products_measurement`;
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching products'
        });
    }
});

// Get items data (protected)
app.get('/api/items', authMiddleware, async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query`SELECT TOP 100 * FROM ItemVendorDetails ORDER BY ID DESC`;
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching items'
        });
    }
});

// SSE endpoint for upload progress (protected)
app.get('/api/upload-progress', authMiddleware, (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    const progressInterval = setInterval(() => {
        if (uploadProgress.current) {
            res.write(`data: ${JSON.stringify(uploadProgress)}\n\n`);
        }
    }, 100);

    req.on('close', () => {
        clearInterval(progressInterval);
    });
});

// Handle file upload (protected)
app.post('/api/upload-items', authMiddleware, upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        // Reset progress
        uploadProgress = { current: 0, total: 0, message: 'Starting upload...' };

        // Create upload handler
        const uploadHandler = new UploadHandler(dbConfig);

        // Set progress callback
        uploadHandler.setProgressCallback((progress) => {
            uploadProgress = progress;
        });

        // Clear table if requested
        if (req.body.clearTable === 'true') {
            uploadProgress.message = 'Clearing existing data...';
            await uploadHandler.clearTable();
        }

        // Process the file
        const result = await uploadHandler.processExcelFile(
            req.file.path,
            req.body.sheetName || null
        );

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        // Send success response
        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('Upload error:', error);

        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process Excel file'
        });
    } finally {
        // Clear progress after a delay
        setTimeout(() => {
            uploadProgress = {};
        }, 5000);
    }
});

// Health check (public)
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// Helper function to get local IP
function getLocalIP() {
    const os = require('os');
    const interfaces = os.networkInterfaces();

    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (const alias of iface) {
            if (alias.family === 'IPv4' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return 'localhost';
}

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`API Server running at http://localhost:${port}`);
    console.log(`Also available on your network at http://${getLocalIP()}:${port}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    await sql.close();
    process.exit(0);
});
