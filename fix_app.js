const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'client', 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// Fix the broken Sider section - replace from Sider start to the closing tag
const brokenSiderSection = /<Sider[\s\S]*?<\/Sider>/;

const fixedSiderSection = `<Sider
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
                                background: '#00acac',
                                borderRadius: 6,
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
                                borderTop: '1px solid #dee2e6',
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
                                            style={{ backgroundColor: '#00acac' }}
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
                        </Sider>`;

content = content.replace(brokenSiderSection, fixedSiderSection);

fs.writeFileSync(appPath, content, 'utf8');
console.log('Fixed App.tsx!');
