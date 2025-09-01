import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { authService } from '../services/authService';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const verified = await authService.verify();
            setIsAuthenticated(verified);

            if (verified && requireAdmin) {
                const user = authService.getUser();
                const isAdmin = user?.role === 'admin';
                setHasPermission(isAdmin);
            } else {
                setHasPermission(true);
            }
        };
        checkAuth();
    }, [requireAdmin]);

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
                    title="403"
                    subTitle="Sorry, you are not authorized to access this page. Admin privileges required."
                    extra={
                        <Button type="primary" onClick={() => window.history.back()}>
                            Go Back
                        </Button>
                    }
                />
            </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;
