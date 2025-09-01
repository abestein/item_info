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
    TeamOutlined
} from '@ant-design/icons';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ItemsPage from './pages/ItemsPage';
import ItemsNewPage from './pages/ItemsNewPage';
import UserManagement from './pages/users/UserManagement';
import DashboardPage from './pages/DashboardPage';
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
    const navigate = useNavigate();
    const location = useLocation();
    const user = authService.getUser();

    const handleLogout = () => {
        authService.logout();
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
            type: 'divider',
        },
        {
            key: 'logout',
            label: 'Logout',
            icon: <LogoutOutlined />,
            onClick: handleLogout,
        },
    ];

    const menuItems = [
        {
            key: '/',
            icon: <HomeOutlined />,
            label: <Link to="/">Home</Link>,
        },
        {
            key: '/dashboard',
            icon: <BarChartOutlined />,
            label: <Link to="/dashboard">Dashboard</Link>,
        },
        {
            key: '/items',
            icon: <TableOutlined />,
            label: <Link to="/items">Items</Link>,
        },
        {
            key: '/items-new',
            icon: <UploadOutlined />,
            label: <Link to="/items-new">Items Management</Link>,
        },
        {
            key: '/users',
            icon: <TeamOutlined />,
            label: <Link to="/users">User Management</Link>,
        },
    ];

    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={
                <ProtectedRoute>
                    <Layout style={{ minHeight: '100vh' }}>
                        <Sider
                            trigger={null}
                            collapsible
                            collapsed={collapsed}
                            style={{
                                overflow: 'auto',
                                height: '100vh',
                                position: 'fixed',
                                left: 0,
                                top: 0,
                                bottom: 0,
                            }}
                        >
                            <div className="logo" style={{
                                height: 32,
                                margin: 16,
                                background: 'rgba(255, 255, 255, 0.3)',
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: 'bold'
                            }}>
                                {collapsed ? 'ID' : 'Item Dimensions'}
                            </div>

                            <Menu
                                theme="dark"
                                mode="inline"
                                selectedKeys={[location.pathname]}
                                items={menuItems}
                                style={{ borderRight: 0, flex: 1 }}
                            />

                            {/* User info at the bottom of sidebar */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                width: '100%',
                                padding: collapsed ? '16px 8px' : '16px',
                                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                                background: 'rgba(255, 255, 255, 0.04)'
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
                                            style={{ backgroundColor: '#1890ff' }}
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
                                        <span>Welcome, {user?.username}</span>
                                        <Button
                                            type="text"
                                            icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
                                            onClick={() => setIsDarkMode(!isDarkMode)}
                                        />
                                        <Button
                                            type="primary"
                                            icon={<LogoutOutlined />}
                                            onClick={handleLogout}
                                        >
                                            Logout
                                        </Button>
                                    </Space>
                                </div>
                            </Header>

                            <Content style={{
                                margin: '24px 16px',
                                padding: 24,
                                minHeight: 280,
                                background: isDarkMode ? '#141414' : '#fff',
                                borderRadius: 8,
                            }}>
                                <Routes>
                                    <Route path="/" element={<HomePage />} />
                                    <Route path="/dashboard" element={<DashboardPage />} />
                                    <Route path="/items" element={<ItemsPage />} />
                                    <Route path="/items-new" element={<ItemsNewPage />} />
                                    <Route path="/users" element={<UserManagement />} />
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
            colorPrimary: '#1890ff',
        },
    };

    const lightThemeConfig = {
        algorithm: theme.defaultAlgorithm,
        token: {
            colorPrimary: '#1890ff',
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
