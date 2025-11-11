const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');
const path = require('path');
const fs = require('fs');
const UploadHandler = require('./helpers/uploadHandler');
const VendorItemsTempUploadHandler = require('./helpers/vendorItemsTempUploadHandler');
const VendorItemsTestUploadHandler = require('./helpers/vendorItemsTestUploadHandler');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Set up view engine for EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Set up layouts
const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for large Excel data imports
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Debug all requests
app.use((req, res, next) => {
    console.log(`[DEBUG] ${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

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
const roleRoutes = require('./routes/roles')(dbConfig);
const dataTeamUploadRoutes = require('./routes/data_team_upload');
const dataTeamComparisonRoutes = require('./routes/data_team_comparison');
const newDashboardRoutes = require('./routes/new_dashboard');
const { authMiddleware, adminMiddleware, editorMiddleware } = require('./middleware/auth');

// Add auth routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes);

// Apply auth middleware and rate limiting to protected routes
app.use('/api/dashboard', authMiddleware, apiLimiter, dashboardRoutes);

// User management routes (admin only)
app.use('/api/users', authMiddleware, adminMiddleware, apiLimiter, userRoutes);

// Permissions routes (admin only)
app.use('/api/permissions', authMiddleware, adminMiddleware, apiLimiter, permissionsRoutes);

// Role management routes (admin only)
app.use('/api/roles', authMiddleware, adminMiddleware, apiLimiter, roleRoutes);

// Progress tracking
let uploadProgress = {};
let vendorUploadProgress = {};
let vendorTestUploadProgress = {};

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

// Get data team active items (protected)
app.get('/api/data-team-items', authMiddleware, async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query`SELECT * FROM data_team_active_items ORDER BY id DESC`;
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching data team items'
        });
    }
});

// Get single data team item by ID (protected)
app.get('/api/data-team-item/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await sql.connect(dbConfig);
        const result = await sql.query`SELECT * FROM data_team_active_items WHERE id = ${id}`;

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Item not found'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching item details'
        });
    }
});

// Get product measurements with UPC data for an item (protected)
app.get('/api/data-team-item/:id/measurements', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await sql.connect(dbConfig);

        // First get the item code from the data_team_active_items table
        const itemResult = await sql.query`SELECT item FROM data_team_active_items WHERE id = ${id}`;

        if (itemResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Item not found'
            });
        }

        const itemCode = itemResult.recordset[0].item;

        // Get measurements data from the view
        const measurementsResult = await sql.query`
            SELECT * FROM product_measurements_with_upc_data
            WHERE item_code = ${itemCode}
            ORDER BY measurement_level
        `;

        res.json({
            success: true,
            data: measurementsResult.recordset
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching product measurements'
        });
    }
});

// Get product measurement mismatches for an item (protected)
app.get('/api/data-team-item/:id/mismatches', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await sql.connect(dbConfig);

        // First get the item code from the data_team_active_items table
        const itemResult = await sql.query`SELECT item FROM data_team_active_items WHERE id = ${id}`;

        if (itemResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Item not found'
            });
        }

        const itemCode = itemResult.recordset[0].item;

        // Get mismatches data from the view
        const mismatchesResult = await sql.query`
            SELECT * FROM product_measurement_mismatches
            WHERE measurement_item_code = ${itemCode}
            ORDER BY measurement_level
        `;

        res.json({
            success: true,
            data: mismatchesResult.recordset
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching product measurement mismatches'
        });
    }
});

// Get all product measurements with UPC data (protected) - for table view
app.get('/api/product-measurements', authMiddleware, async (req, res) => {
    try {
        await sql.connect(dbConfig);

        const result = await sql.query`
            SELECT * FROM product_measurements_with_upc_data
        `;

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching product measurements'
        });
    }
});

// Get all product measurement mismatches (protected) - for table view
app.get('/api/measurement-mismatches', authMiddleware, async (req, res) => {
    try {
        await sql.connect(dbConfig);

        const result = await sql.query`
            SELECT * FROM product_measurement_mismatches
        `;

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({
            success: false,
            error: 'Error fetching measurement mismatches'
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

// SSE endpoint for vendor upload progress (protected with query token)
app.get('/api/vendor-upload-progress', (req, res) => {
    // Check for token in query params since EventSource can't send headers
    const token = req.query.token;
    if (!token) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Verify the token manually
    try {
        jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    const progressInterval = setInterval(() => {
        if (vendorUploadProgress.current) {
            res.write(`data: ${JSON.stringify(vendorUploadProgress)}\n\n`);
        }
    }, 100);

    req.on('close', () => {
        clearInterval(progressInterval);
    });
});

// Handle vendor items temp file upload (protected)
app.post('/api/upload-vendor-items-temp', authMiddleware, upload.single('excelFile'), async (req, res) => {
    console.log('=== Vendor Upload Started ===');
    console.log('File:', req.file?.originalname);
    console.log('Size:', req.file?.size);
    
    try {
        if (!req.file) {
            console.log('ERROR: No file uploaded');
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        console.log('File received, starting process...');
        // Reset progress
        vendorUploadProgress = { current: 0, total: 0, message: 'Starting upload...' };

        // Create vendor upload handler
        const vendorUploadHandler = new VendorItemsTempUploadHandler(dbConfig);

        // Set progress callback
        vendorUploadHandler.setProgressCallback((progress) => {
            vendorUploadProgress = progress;
        });

        // Clear table if requested
        if (req.body.clearTable === 'true') {
            vendorUploadProgress.message = 'Clearing existing data...';
            await vendorUploadHandler.clearTable();
        }

        // Process the file
        const result = await vendorUploadHandler.processExcelFile(
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
        console.error('Vendor upload error:', error);

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
            vendorUploadProgress = {};
        }, 5000);
    }
});

// SSE endpoint for vendor test upload progress (protected with query token)
app.get('/api/vendor-test-upload-progress', (req, res) => {
    // Check for token in query params since EventSource can't send headers
    const token = req.query.token;
    if (!token) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Verify the token manually
    try {
        jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    const progressInterval = setInterval(() => {
        if (vendorTestUploadProgress.current) {
            res.write(`data: ${JSON.stringify(vendorTestUploadProgress)}\n\n`);
        }
    }, 100);

    req.on('close', () => {
        clearInterval(progressInterval);
    });
});

// Handle vendor items test upload (protected)
app.post('/api/upload-vendor-items-test', authMiddleware, upload.single('excelFile'), async (req, res) => {
    console.log('=== Vendor Test Upload Started ===');
    console.log('File:', req.file?.originalname);
    console.log('Size:', req.file?.size);
    
    try {
        if (!req.file) {
            console.log('ERROR: No file uploaded');
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        console.log('File received, starting test process...');
        // Reset progress
        vendorTestUploadProgress = { current: 0, total: 0, message: 'Starting test upload...' };

        // Create vendor test upload handler
        const vendorTestUploadHandler = new VendorItemsTestUploadHandler(dbConfig);

        // Set progress callback
        vendorTestUploadHandler.setProgressCallback((progress) => {
            vendorTestUploadProgress = progress;
        });

        // Process the file for validation
        const result = await vendorTestUploadHandler.testExcelFile(
            req.file.path,
            req.body.sheetName || null
        );

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        // Send response
        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('Vendor test upload error:', error);

        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process test Excel file'
        });
    } finally {
        // Clear progress after a delay
        setTimeout(() => {
            vendorTestUploadProgress = {};
        }, 5000);
    }
});

// Health check (public)
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// Data team routes
app.use('/api', authMiddleware, dataTeamUploadRoutes);
app.use('/api', authMiddleware, dataTeamComparisonRoutes);
app.use('/api', authMiddleware, newDashboardRoutes);

// Store dbConfig in app.locals for routes to access
app.locals.dbConfig = dbConfig;

// View routes (protected)
app.get('/upload-data-team', authMiddleware, (req, res) => {
    res.render('upload_data_team', {
        title: 'Upload Data Team Items',
        user: req.user,
        activePage: 'upload-data-team'
    });
});

// Comparison page route (editor/admin only)
app.get('/compare-data-team', authMiddleware, editorMiddleware, (req, res) => {
    res.render('compare_data_team', {
        title: 'Compare Data Team Items',
        user: req.user,
        activePage: 'compare-data-team'
    });
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
