const express = require('express');
const { adminMiddleware } = require('../middleware/auth');
const { getPageDescription } = require('../config/permissions');

module.exports = (dbConfig) => {
    const router = express.Router();

    // Get all page permissions
    router.get('/pages', adminMiddleware, async (req, res) => {
        try {
            const { pagePermissions } = require('../config/permissions');
            
            // Transform permissions into a more detailed format
            const formattedPermissions = Object.entries(pagePermissions).map(([page, roles]) => ({
                page,
                name: page.replace(/[/_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                description: getPageDescription(page),
                category: page.split('/')[1] || 'General',
                roles,
                isAdminOnly: roles.length === 1 && roles[0] === 'admin'
            }));

            res.json({
                success: true,
                pages: formattedPermissions
            });
        } catch (error) {
            console.error('Get permissions error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch permissions'
            });
        }
    });

    return router;
};
