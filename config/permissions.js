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

// Helper function to check if a user has access to a page (user-specific permissions)
function hasUserPageAccess(userPermissions, page) {
    // If user has specific permissions array, use that
    if (Array.isArray(userPermissions)) {
        return userPermissions.includes(page);
    }
    return false;
}

// Combined function to check access (user-specific first, then role-based fallback)
function checkPageAccess(user, page) {
    // If user has specific page permissions, use those
    if (user.permissions && Array.isArray(user.permissions)) {
        return hasUserPageAccess(user.permissions, page);
    }
    
    // Fallback to role-based permissions
    return hasPageAccess(user.role, page);
}

// Get all accessible pages for a role
function getAccessiblePages(role) {
    return Object.entries(pagePermissions)
        .filter(([_, roles]) => roles.includes(role))
        .map(([page]) => page);
}

// Get all accessible pages for a user (user-specific or role-based)
function getUserAccessiblePages(user) {
    // If user has specific permissions, return those
    if (user.permissions && Array.isArray(user.permissions)) {
        return user.permissions;
    }
    
    // Fallback to role-based permissions
    return getAccessiblePages(user.role);
}

// Get all available pages in the system
function getAllPages() {
    return Object.keys(pagePermissions);
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

// Calculate role based on assigned permissions
function calculateRoleFromPermissions(permissions) {
    // If user has access to all admin pages, they're an admin
    const adminPages = Object.entries(pagePermissions)
        .filter(([_, roles]) => roles.includes('admin'))
        .map(([page]) => page);
    
    if (adminPages.every(page => permissions.includes(page))) {
        return 'admin';
    }

    // If user has access to manager pages, they're a manager
    const managerPages = Object.entries(pagePermissions)
        .filter(([_, roles]) => roles.includes('manager'))
        .map(([page]) => page);
    
    if (managerPages.some(page => permissions.includes(page))) {
        return 'manager';
    }

    // If user only has read access pages, they're readonly
    const hasWriteAccess = permissions.some(page => 
        !pagePermissions[page].includes('readonly')
    );
    
    if (!hasWriteAccess) {
        return 'readonly';
    }

    // Default to regular user
    return 'user';
}

module.exports = {
    pagePermissions,
    hasPageAccess,
    hasUserPageAccess,
    checkPageAccess,
    getAccessiblePages,
    getUserAccessiblePages,
    getAllPages,
    getPageDescription,
    calculateRoleFromPermissions
};
