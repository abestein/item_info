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

module.exports = {
    pagePermissions,
    hasPageAccess,
    getAccessiblePages
};
