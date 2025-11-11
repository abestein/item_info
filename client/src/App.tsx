import React, { useEffect, useState } from 'react';
import { Layout, Menu, Avatar, Button, Dropdown, Space, ConfigProvider, App as AntdApp, theme } from 'antd';
import {
    HomeOutlined,
    BarChartOutlined,
    TableOutlined,
    UploadOutlined,
    UserOutlined,
    LogoutOutlined,
    SettingOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    SunOutlined,
    MoonOutlined,
    TeamOutlined,
    FileTextOutlined,
    KeyOutlined,
    InfoCircleOutlined,
    BarcodeOutlined,
    ExpandOutlined,
    WarningOutlined
} from '@ant-design/icons';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ItemsPage from './pages/ItemsPage';
import ItemsNewPage from './pages/ItemsNewPage';
import ItemsNewOperationsPage from './pages/ItemsNewOperationsPage';
import ItemsNewChangesPage from './pages/ItemsNewChangesPage';
import ItemDetailPage from './pages/ItemDetailPage';
import VendorItemsUploadPage from './pages/VendorItemsUploadPage';
import VendorItemsTestUploadPage from './pages/VendorItemsTestUploadPage';
import DataTeamUploadPage from './pages/DataTeamUploadPage';
import UPCListPage from './pages/UPCListPage';
import ProductMeasurementsPage from './pages/ProductMeasurementsPage';
import MeasurementMismatchesPage from './pages/MeasurementMismatchesPage';
import UserManagement from './pages/users/UserManagement';
import UserList from './pages/users/UserList';
import RoleManagement from './pages/users/RoleManagement';
import DashboardPage from './pages/DashboardPage';
import NewDashboardPage from './pages/NewDashboardPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { authService } from './services/authService';
import './App.css';

const { Header, Sider, Content } = Layout;

interface AppLayoutProps {
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ isDarkMode, setIsDarkMode }) => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const user = authService.getUser();
    console.log('App.tsx - User data:', user);

    const handleLogout = () => {
        authService.logout();
    };

    // Helper function to check if user has access to a path
    const hasAccess = (path: string): boolean => {
        if (!user) return false;

        // Admin users have access to all pages
        if (user.role === 'admin') return true;

        // For non-admin users, check permissions
        if (!user.permissions) return false;

        // Normalize paths for comparison
        const normalizedPath = path.replace(/^\//, '');
        return user.permissions.some((perm: string) => {
            const normalizedPerm = perm.replace(/^\//, '');
            return normalizedPath === normalizedPerm || normalizedPath.startsWith(normalizedPerm + '/');
        });
    };

    const userMenuItems = [
        {
            key: 'profile',
            label: 'Profile',
            icon: <UserOutlined />,
        },
        {
            key: 'settings',
            label: 'Settings',
            icon: <SettingOutlined />,
        },
        {
            type: 'divider' as const,
        },
        {
            key: 'logout',
            label: 'Logout',
            icon: <LogoutOutlined />,
            onClick: handleLogout,
        },
    ];

    // Define all available menu items
    const allMenuItems = [
        {
            key: '/',
            path: '/dashboard', // Home redirects to dashboard, check dashboard permission
            icon: <HomeOutlined />,
            label: <Link to="/">Home</Link>,
        },
        {
            key: '/items-management',
            icon: <UploadOutlined />,
            label: 'Data Management',
            children: [
                {
                    key: '/items-new-operations',
                    path: '/items-new-operations',
                    icon: <SettingOutlined />,
                    label: <Link to="/items-new-operations">Operations</Link>,
                },
                {
                    key: '/items-new-changes',
                    path: '/items-new-changes',
                    icon: <FileTextOutlined />,
                    label: <Link to="/items-new-changes">View Pending Changes</Link>,
                },
                {
                    key: '/items-new',
                    path: '/items-new',
                    icon: <TableOutlined />,
                    label: <Link to="/items-new">Item View</Link>,
                },
            ],
        },
        {
            key: '/item-information-menu',
            icon: <InfoCircleOutlined />,
            label: 'Item Information',
            children: [
                {
                    key: '/upc-list',
                    path: '/upc-list',
                    icon: <BarcodeOutlined />,
                    label: <Link to="/upc-list">UPC List</Link>,
                },
                {
                    key: '/product-measurements',
                    path: '/product-measurements',
                    icon: <ExpandOutlined />,
                    label: <Link to="/product-measurements">Product Measurements</Link>,
                },
                {
                    key: '/measurement-mismatches',
                    path: '/measurement-mismatches',
                    icon: <WarningOutlined />,
                    label: <Link to="/measurement-mismatches">Measurement Mismatches</Link>,
                },
            ],
        },
        {
            key: '/users-menu',
            icon: <TeamOutlined />,
            label: 'User Management',
            children: [
                {
                    key: '/users',
                    path: '/users',
                    icon: <UserOutlined />,
                    label: <Link to="/users">Manage Users</Link>,
                },
                {
                    key: '/users/roles',
                    path: '/users/roles',
                    icon: <KeyOutlined />,
                    label: <Link to="/users/roles">Role Permissions</Link>,
                },
            ],
        },
        {
            key: '/other-menu',
            icon: <SettingOutlined />,
            label: 'Other',
            children: [
                {
                    key: '/barry-dashboard',
                    path: '/barry-dashboard',
                    icon: <BarChartOutlined />,
                    label: <Link to="/barry-dashboard">Barry Quality Dashboard</Link>,
                },
                {
                    key: '/items',
                    path: '/items',
                    icon: <TableOutlined />,
                    label: <Link to="/items">Items</Link>,
                },
                {
                    key: '/vendor-items-upload',
                    path: '/upload',
                    icon: <UploadOutlined />,
                    label: <Link to="/vendor-items-upload">Vendor Items Upload</Link>,
                },
                {
                    key: '/vendor-items-test-upload',
                    path: '/upload-data-team',
                    icon: <UploadOutlined />,
                    label: <Link to="/vendor-items-test-upload">Vendor Items Test Upload</Link>,
                },
                {
                    key: '/reports',
                    path: '/reports',
                    icon: <FileTextOutlined />,
                    label: <Link to="/reports">Reports</Link>,
                },
            ],
        },
        {
            key: '/settings',
            path: '/settings',
            icon: <SettingOutlined />,
            label: <Link to="/settings">Settings</Link>,
        },
    ];

    // Filter menu items based on user permissions
    const menuItems = allMenuItems
        .filter(item => {
            // If item has children, filter children first
            if (item.children) {
                const filteredChildren = item.children.filter(child => hasAccess(child.path));
                if (filteredChildren.length === 0) return false;
                item.children = filteredChildren;
                // If parent has children, show it even without a path
                return true;
            }
            // Check if user has access to this item's path
            return item.path && hasAccess(item.path);
        })
        .map(({ path, ...item }) => item); // Remove path property before rendering

    // Check authentication status for root route
    const isAuthenticated = authService.isAuthenticated();

    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            {/* Root path - redirect based on authentication */}
            <Route path="/" element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            } />
            <Route path="/*" element={
                <ProtectedRoute>
                    <Layout style={{ minHeight: '100vh' }}>
                        <Sider
                            trigger={null}
                            collapsible
                            collapsed={collapsed}
                            theme="light"
                            style={{
                                overflow: 'auto',
                                height: '100vh',
                                position: 'fixed',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
                                background: '#ffffff'
                            }}
                        >
                            <div className="logo" style={{
                                height: 48,
                                margin: 16,
                                background: '#043168',
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: 16
                            }}>
                                {collapsed ? 'ID' : 'Item Dimensions'}
                            </div>

                            <Menu
                                theme="light"
                                mode="inline"
                                selectedKeys={[location.pathname]}
                                items={menuItems}
                                style={{
                                    borderRight: 0,
                                    flex: 1,
                                    background: '#ffffff'
                                }}
                            />

                            {/* User info at the bottom of sidebar */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                width: '100%',
                                padding: collapsed ? '16px 8px' : '16px',
                                borderTop: '1px solid #c5c5c7',
                                background: '#043168'
                            }}>
                                <Dropdown
                                    menu={{ items: userMenuItems }}
                                    placement="topRight"
                                    arrow
                                >
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        color: '#fff'
                                    }}>
                                        <Avatar
                                            size={collapsed ? 'small' : 'default'}
                                            icon={<UserOutlined />}
                                            style={{ backgroundColor: '#043168' }}
                                        >
                                            {user?.username?.charAt(0).toUpperCase()}
                                        </Avatar>
                                        {!collapsed && (
                                            <div style={{ marginLeft: 8, overflow: 'hidden' }}>
                                                <div style={{
                                                    fontSize: 14,
                                                    fontWeight: 500,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {user?.username || 'User'}
                                                </div>
                                                <div style={{
                                                    fontSize: 12,
                                                    opacity: 0.65,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {user?.role || 'Role'}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Dropdown>
                            </div>
                        </Sider>

                        <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
                            <Header style={{
                                padding: 0,
                                background: isDarkMode ? '#001529' : '#fff',
                                position: 'sticky',
                                top: 0,
                                zIndex: 1,
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                boxShadow: '0 1px 4px rgba(0,21,41,.08)'
                            }}>
                                <Button
                                    type="text"
                                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                                    onClick={() => setCollapsed(!collapsed)}
                                    style={{
                                        fontSize: '16px',
                                        width: 64,
                                        height: 64,
                                    }}
                                />

                                <div style={{ paddingRight: 24 }}>
                                    <Space>
                                        <span style={{
                                            color: '#043168',
                                            fontWeight: 600
                                        }}>
                                            Welcome, {user?.username}
                                        </span>
                                        <Button
                                            type="text"
                                            icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
                                            onClick={() => setIsDarkMode(!isDarkMode)}
                                        />
                                        <Button
                                            type="primary"
                                            icon={<LogoutOutlined />}
                                            onClick={handleLogout}
                                            className="logout-button"
                                        >
                                            Logout
                                        </Button>
                                    </Space>
                                </div>
                            </Header>

                            <Content style={{
                                margin: '24px 16px',
                                padding: 0,
                                minHeight: 280,
                                background: isDarkMode ? '#0A0E27' : '#DFDFE1',
                                borderRadius: 0,
                            }}>
                                <Routes>
                                    <Route path="/dashboard" element={<NewDashboardPage />} />
                                    <Route path="/barry-dashboard" element={<DashboardPage />} />
                                    <Route path="/items" element={<ItemsPage />} />
                                    <Route path="/items-new" element={<ItemsNewPage />} />
                                    <Route path="/items-new-operations" element={<ItemsNewOperationsPage />} />
                                    <Route path="/items-new-changes" element={<ItemsNewChangesPage />} />
                                    <Route path="/item-detail/:itemId" element={<ItemDetailPage />} />
                                    <Route path="/vendor-items-upload" element={<VendorItemsUploadPage />} />
                                    <Route path="/vendor-items-test-upload" element={<VendorItemsTestUploadPage />} />
                                    <Route path="/data-team-upload" element={<DataTeamUploadPage />} />
                                    <Route path="/upc-list" element={<UPCListPage />} />
                                    <Route path="/product-measurements" element={<ProductMeasurementsPage />} />
                                    <Route path="/measurement-mismatches" element={<MeasurementMismatchesPage />} />
                                    <Route path="/users" element={
                                        <ProtectedRoute requireAdmin={true}>
                                            <UserManagement />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/users/list" element={
                                        <ProtectedRoute requireAdmin={true}>
                                            <UserList />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/users/roles" element={
                                        <ProtectedRoute requireAdmin={true}>
                                            <RoleManagement />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/reports" element={<ReportsPage />} />
                                    <Route path="/settings" element={<SettingsPage />} />
                                </Routes>
                            </Content>
                        </Layout>
                    </Layout>
                </ProtectedRoute>
            } />
        </Routes>
    );
};

function App() {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Setup axios interceptor on app load
        authService.setupAxiosInterceptor();
    }, []);

    const darkThemeConfig = {
        algorithm: theme.darkAlgorithm,
        token: {
            colorPrimary: '#043168',
            colorInfo: '#043168',
            colorSuccess: '#28a745',
            colorWarning: '#ffc107',
            colorError: '#dc3545',
            fontSize: 14,
            borderRadius: 8,
            fontFamily: "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
    };

    const lightThemeConfig = {
        algorithm: theme.defaultAlgorithm,
        token: {
            colorPrimary: '#043168',
            colorInfo: '#043168',
            colorSuccess: '#28a745',
            colorWarning: '#ffc107',
            colorError: '#dc3545',
            colorTextBase: '#043168',
            colorText: '#20252a',
            colorBgContainer: '#ffffff',
            colorBgLayout: '#DFDFE1',
            colorBorder: '#c5c5c7',
            fontSize: 14,
            borderRadius: 8,
            fontFamily: "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
    };

    return (
        <ConfigProvider theme={isDarkMode ? darkThemeConfig : lightThemeConfig}>
            <AntdApp>
                <Router>
                    <AppLayout isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
                </Router>
            </AntdApp>
        </ConfigProvider>
    );
}

export default App;
