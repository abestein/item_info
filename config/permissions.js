// Define available pages/routes and their required roles
const pagePermissions = {
    '/dashboard': ['admin', 'user', 'manager', 'readonly'],
    '/users': ['admin'],
    '/items': ['admin', 'manager', 'user'],
    '/reports': ['admin', 'manager', 'readonly'],
    '/settings': ['admin'],
    '/upload': ['admin', 'manager']
};

// Helper function to check if a role has access to a page
function hasPageAccess(role, page) {
    return pagePermissions[page]?.includes(role) || false;
}

// Get all accessible pages for a role
function getAccessiblePages(role) {
    return Object.entries(pagePermissions)
        .filter(([_, roles]) => roles.includes(role))
        .map(([page]) => page);
}

// Page descriptions
const pageDescriptions = {
    '/dashboard': 'Main dashboard with overview and statistics',
    '/users': 'User management and role assignments',
    '/items': 'Item and inventory management',
    '/reports': 'System reports and analytics',
    '/settings': 'System configuration and settings',
    '/upload': 'File upload and data import'
};

// Get description for a page
function getPageDescription(page) {
    return pageDescriptions[page] || 'No description available';
}

module.exports = {
    pagePermissions,
    hasPageAccess,
    getAccessiblePages,
    getPageDescription
};
