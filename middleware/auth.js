const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const { hasPageAccess, checkPageAccess } = require('../config/permissions');

const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }
    next();
};

const editorMiddleware = (req, res, next) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'editor') {
        return res.status(403).json({
            success: false,
            error: 'Editor or Admin access required'
        });
    }
    next();
};

const pageAccessMiddleware = (req, res, next) => {
    const page = req.path;
    if (!checkPageAccess(req.user, page)) {
        return res.status(403).json({
            success: false,
            error: 'You do not have permission to access this page'
        });
    }
    next();
};

module.exports = { authMiddleware, adminMiddleware, editorMiddleware, pageAccessMiddleware };
