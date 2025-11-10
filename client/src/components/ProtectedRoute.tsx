import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { authService } from '../services/authService';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
    requirePath?: string; // Specific permission path required
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false, requirePath }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            const verified = await authService.verify();
            setIsAuthenticated(verified);

            if (verified) {
                const user = authService.getUser();

                // Check admin requirement
                if (requireAdmin) {
                    const isAdmin = user?.role === 'admin';
                    setHasPermission(isAdmin);
                    return;
                }

                // Check specific path permission if provided
                if (requirePath) {
                    const pathPermission = checkPathPermission(user, requirePath);
                    setHasPermission(pathPermission);
                    return;
                }

                // Check permission for current route
                const currentPath = location.pathname;
                const routePermission = checkPathPermission(user, currentPath);
                setHasPermission(routePermission);
            }
        };
        checkAuth();
    }, [requireAdmin, requirePath, location.pathname]);

    const checkPathPermission = (user: any, path: string): boolean => {
        if (!user || !user.permissions) return false;

        // Map frontend routes to permission paths
        const permissionMap: Record<string, string> = {
            '/': '/dashboard',
            '/dashboard': '/dashboard',
            '/items': '/items',
            '/items-new': '/items',
            '/vendor-items-upload': '/upload',
            '/vendor-items-test-upload': '/upload-data-team',
            '/data-team-upload': '/upload-data-team',
            '/users': '/users',
            '/users/roles': '/users',
            '/reports': '/reports',
            '/settings': '/settings',
        };

        // Check if path starts with a known route (for dynamic routes like /item-detail/:id)
        let requiredPermission = permissionMap[path];
        if (!requiredPermission) {
            // Check for dynamic routes
            if (path.startsWith('/item-detail/')) {
                requiredPermission = '/items';
            } else {
                requiredPermission = path;
            }
        }

        return user.permissions.some((perm: string) => {
            return perm === requiredPermission || path.startsWith(perm);
        });
    };

    if (isAuthenticated === null || hasPermission === null) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (!hasPermission) {
        return (
            <div style={{ padding: 50 }}>
                <Result
                    status="403"
                    title="403 - Access Denied"
                    subTitle="Sorry, you don't have permission to access this page. Please contact your administrator if you need access."
                    extra={
                        <Button type="primary" onClick={() => window.location.href = '/dashboard'}>
                            Go to Dashboard
                        </Button>
                    }
                />
            </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;
