const fs = require('fs');
const path = require('path');

// Update UserPermissions.tsx
const permissionsPath = path.join(__dirname, 'client', 'src', 'pages', 'users', 'UserPermissions.tsx');
let permissionsContent = fs.readFileSync(permissionsPath, 'utf8');

// 1. Add new icon imports at the top
const oldImports = `import {
  UserOutlined,
  SaveOutlined,
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons';`;

const newImports = `import {
  UserOutlined,
  SaveOutlined,
  ReloadOutlined,
  SettingOutlined,
  DashboardOutlined,
  TeamOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  InboxOutlined,
  TableOutlined,
  ToolOutlined,
  DiffOutlined,
  SafetyCertificateOutlined,
  CloudUploadOutlined,
  ExperimentOutlined,
  FileAddOutlined,
  UploadOutlined,
  SwapOutlined,
  HomeOutlined,
  FileTextOutlined,
  BulbOutlined
} from '@ant-design/icons';`;

permissionsContent = permissionsContent.replace(oldImports, newImports);

// 2. Replace getPageIcon function with modern icons
const oldGetPageIcon = `  const getPageIcon = (page: string) => {
    if (page.includes('dashboard')) return '📊';
    if (page.includes('users')) return '👥';
    if (page.includes('items')) return '📦';
    if (page.includes('reports')) return '📈';
    if (page.includes('settings')) return '⚙️';
    if (page.includes('upload')) return '📤';
    return '📄';
  };`;

const newGetPageIcon = `  const getPageIcon = (page: string) => {
    // Specific route matches first
    if (page === '/dashboard') return <DashboardOutlined style={{ fontSize: 18, color: '#00acac' }} />;
    if (page === '/users') return <UserOutlined style={{ fontSize: 18, color: '#00acac' }} />;
    if (page === '/users/roles') return <SafetyCertificateOutlined style={{ fontSize: 18, color: '#00acac' }} />;
    if (page === '/items') return <InboxOutlined style={{ fontSize: 18, color: '#00acac' }} />;
    if (page === '/items-new') return <TableOutlined style={{ fontSize: 18, color: '#00acac' }} />;
    if (page === '/items-new-operations') return <ToolOutlined style={{ fontSize: 18, color: '#00acac' }} />;
    if (page === '/items-new-changes') return <DiffOutlined style={{ fontSize: 18, color: '#00acac' }} />;
    if (page === '/reports') return <BarChartOutlined style={{ fontSize: 18, color: '#00acac' }} />;
    if (page === '/settings') return <SettingOutlined style={{ fontSize: 18, color: '#00acac' }} />;
    if (page === '/vendor-items-upload') return <CloudUploadOutlined style={{ fontSize: 18, color: '#00acac' }} />;
    if (page === '/vendor-items-test-upload') return <ExperimentOutlined style={{ fontSize: 18, color: '#00acac' }} />;
    if (page === '/data-team-upload') return <FileAddOutlined style={{ fontSize: 18, color: '#00acac' }} />;
    if (page === '/upload') return <UploadOutlined style={{ fontSize: 18, color: '#00acac' }} />;
    if (page === '/compare-data-team') return <SwapOutlined style={{ fontSize: 18, color: '#00acac' }} />;
    if (page === '/upload-data-team') return <FileAddOutlined style={{ fontSize: 18, color: '#00acac' }} />;

    // Fallback
    return <FileTextOutlined style={{ fontSize: 18, color: '#00acac' }} />;
  };

  const getCategoryIcon = (category: string) => {
    if (category === 'Core') return <HomeOutlined style={{ fontSize: 18, color: '#ffffff' }} />;
    if (category === 'General') return <HomeOutlined style={{ fontSize: 18, color: '#ffffff' }} />;
    if (category === 'Management') return <TeamOutlined style={{ fontSize: 18, color: '#ffffff' }} />;
    if (category === 'Data') return <DatabaseOutlined style={{ fontSize: 18, color: '#ffffff' }} />;
    if (category === 'System') return <SettingOutlined style={{ fontSize: 18, color: '#ffffff' }} />;
    if (category === 'Reports') return <BarChartOutlined style={{ fontSize: 18, color: '#ffffff' }} />;
    return <FileTextOutlined style={{ fontSize: 18, color: '#ffffff' }} />;
  };`;

permissionsContent = permissionsContent.replace(oldGetPageIcon, newGetPageIcon);

// 3. Update category header rendering with modern icon avatars
const oldCategoryHeader = `              title={
                <Space>
                  <span style={{ fontSize: '18px' }}>
                    {category === 'General' ? '🏠' :
                     category === 'Management' ? '👨‍💼' :
                     category === 'Data' ? '📊' :
                     category === 'System' ? '⚙️' :
                     category === 'Reports' ? '📈' : '📁'}
                  </span>
                  <Tag color={getCategoryColor(category)}>{category}</Tag>
                  <Text strong>{category} Pages</Text>
                </Space>
              }`;

const newCategoryHeader = `              title={
                <Space align="center" size={12}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #00acac 0%, #008181 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {getCategoryIcon(category)}
                  </div>
                  <div>
                    <Space>
                      <Text strong style={{ fontSize: 16, color: '#043168' }}>{category} Pages</Text>
                      <Tag color={getCategoryColor(category)}>{permissions.length}</Tag>
                    </Space>
                  </div>
                </Space>
              }`;

permissionsContent = permissionsContent.replace(oldCategoryHeader, newCategoryHeader);

// 4. Improve permission card styling
const oldPermissionCard = `                    <Card
                      size="small"
                      className={`permission-card ${
                        selectedPermissions.includes(permission.page) ? 'selected' : ''
                      } ${
                        useRolePermissions ? 'disabled' : ''
                      }`}
                      style={{
                        cursor: useRolePermissions ? 'not-allowed' : 'pointer',
                        border: selectedPermissions.includes(permission.page)
                          ? '2px solid #1890ff'
                          : '1px solid #d9d9d9',
                        backgroundColor: selectedPermissions.includes(permission.page)
                          ? '#f6ffed'
                          : 'white',
                        opacity: useRolePermissions ? 0.6 : 1,
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => !useRolePermissions && handlePermissionChange(permission.page, !selectedPermissions.includes(permission.page))}
                      hoverable={!useRolePermissions}
                    >
                      <Space align="start" style={{ width: '100%' }}>
                        <Checkbox
                          checked={selectedPermissions.includes(permission.page)}
                          onChange={(e) => handlePermissionChange(permission.page, e.target.checked)}
                          disabled={useRolePermissions}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div style={{ flex: 1 }}>
                          <Space>
                            <span style={{ fontSize: '16px' }}>{getPageIcon(permission.page)}</span>
                            <Text strong>{permission.name}</Text>
                          </Space>
                          <div>
                            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                              {permission.description}
                            </Text>
                            <Tag style={{ marginTop: 4 }} color="default">
                              {permission.page}
                            </Tag>
                          </div>
                        </div>
                      </Space>
                    </Card>`;

const newPermissionCard = `                    <Card
                      size="small"
                      className={`permission-card ${
                        selectedPermissions.includes(permission.page) ? 'selected' : ''
                      } ${
                        useRolePermissions ? 'disabled' : ''
                      }`}
                      style={{
                        cursor: useRolePermissions ? 'not-allowed' : 'pointer',
                        border: selectedPermissions.includes(permission.page)
                          ? '2px solid #00acac'
                          : '1px solid #dee2e6',
                        backgroundColor: selectedPermissions.includes(permission.page)
                          ? '#f0fffe'
                          : '#ffffff',
                        opacity: useRolePermissions ? 0.6 : 1,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        borderRadius: 8,
                        boxShadow: selectedPermissions.includes(permission.page)
                          ? '0 2px 8px rgba(0, 172, 172, 0.15)'
                          : 'none'
                      }}
                      onClick={() => !useRolePermissions && handlePermissionChange(permission.page, !selectedPermissions.includes(permission.page))}
                      hoverable={!useRolePermissions}
                    >
                      <Space align="start" style={{ width: '100%' }} size={12}>
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          background: selectedPermissions.includes(permission.page)
                            ? '#e6f7f7'
                            : '#f2f3f4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease'
                        }}>
                          {getPageIcon(permission.page)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <Text strong style={{ fontSize: 14, color: '#043168', display: 'block', marginBottom: 4 }}>
                            {permission.name}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                            {permission.description}
                          </Text>
                          <Tag style={{ fontSize: 11, padding: '0 6px' }} color="default">
                            {permission.page}
                          </Tag>
                        </div>
                        <Checkbox
                          checked={selectedPermissions.includes(permission.page)}
                          onChange={(e) => handlePermissionChange(permission.page, e.target.checked)}
                          disabled={useRolePermissions}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Space>
                    </Card>`;

permissionsContent = permissionsContent.replace(oldPermissionCard, newPermissionCard);

// 5. Update summary section to remove emoji
const oldSummaryTitle = `        title={(
          <Space>
            <span>📋</span>
            <Text strong>
              {useRolePermissions ? \`\${user.role.toUpperCase()} Role Permissions\` : 'Custom Permissions'}
            </Text>
          </Space>
        )}`;

const newSummaryTitle = `        title={(
          <Space>
            <FileTextOutlined style={{ fontSize: 16, color: '#00acac' }} />
            <Text strong>
              {useRolePermissions ? \`\${user.role.toUpperCase()} Role Permissions\` : 'Custom Permissions'}
            </Text>
          </Space>
        )}`;

permissionsContent = permissionsContent.replace(oldSummaryTitle, newSummaryTitle);

// 6. Update the summary tags to use icons instead of emoji
const oldSummaryTag = `                <Tag key={permission} color={useRolePermissions ? "blue" : "orange"}>
                  <Space size={4}>
                    <span>{getPageIcon(permission)}</span>
                    <span>{permData?.name || permission}</span>
                  </Space>
                </Tag>`;

const newSummaryTag = `                <Tag key={permission} color={useRolePermissions ? "blue" : "orange"} style={{ fontSize: 12 }}>
                  <Space size={6}>
                    {getPageIcon(permission)}
                    <span>{permData?.name || permission}</span>
                  </Space>
                </Tag>`;

permissionsContent = permissionsContent.replace(oldSummaryTag, newSummaryTag);

// 7. Update hint text at bottom to remove emoji
const oldHintText = `            <Text type="secondary" style={{ fontSize: '12px' }}>
              💡 Click on page cards above to toggle permissions, or use "Select All" / "Deselect All" buttons
            </Text>`;

const newHintText = `            <Space size={8}>
              <BulbOutlined style={{ fontSize: 14, color: '#faad14' }} />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Click on page cards above to toggle permissions, or use "Select All" / "Deselect All" buttons
              </Text>
            </Space>`;

permissionsContent = permissionsContent.replace(oldHintText, newHintText);

// 8. Also need to import Avatar for the category icons
const antdImports = `import {
  Card,
  Checkbox,
  Button,
  Space,
  Typography,
  Divider,
  Alert,
  Spin,
  Row,
  Col,
  Tag,
  Switch,
  message,
  Popconfirm
} from 'antd';`;

const newAntdImports = `import {
  Card,
  Checkbox,
  Button,
  Space,
  Typography,
  Divider,
  Alert,
  Spin,
  Row,
  Col,
  Tag,
  Switch,
  message,
  Popconfirm,
  Avatar
} from 'antd';`;

permissionsContent = permissionsContent.replace(antdImports, newAntdImports);

fs.writeFileSync(permissionsPath, permissionsContent, 'utf8');
console.log('✓ Updated UserPermissions.tsx with modern icons and styling');

// Update UserManagement.tsx
const managementPath = path.join(__dirname, 'client', 'src', 'pages', 'users', 'UserManagement.tsx');
let managementContent = fs.readFileSync(managementPath, 'utf8');

// 1. Update availablePages array with all missing routes
const oldAvailablePages = `  const [availablePages] = useState<string[]>([
    '/dashboard',
    '/users',
    '/items',
    '/reports',
    '/settings',
    '/upload',
    '/upload-data-team',
    '/compare-data-team'
  ]);`;

const newAvailablePages = `  const [availablePages] = useState<string[]>([
    '/dashboard',
    '/users',
    '/users/roles',
    '/items',
    '/items-new',
    '/items-new-operations',
    '/items-new-changes',
    '/reports',
    '/settings',
    '/vendor-items-upload',
    '/vendor-items-test-upload',
    '/data-team-upload',
    '/upload',
    '/upload-data-team',
    '/compare-data-team'
  ]);`;

managementContent = managementContent.replace(oldAvailablePages, newAvailablePages);

// 2. Update the page icon rendering function in the checkbox section
const oldCheckboxIcon = `                                <Space>
                                  <span>{page === '/dashboard' ? '📊' :
                                         page === '/users' ? '👥' :
                                         page === '/items' ? '📦' :
                                         page === '/reports' ? '📈' :
                                         page === '/settings' ? '⚙️' :
                                         page === '/upload' ? '📤' : '📄'}</span>
                                  <Text>{page.replace('/', '').replace(/-/g, ' ').toUpperCase() || 'Home'}</Text>
                                </Space>`;

const newCheckboxIcon = `                                {page}`;

managementContent = managementContent.replace(oldCheckboxIcon, newCheckboxIcon);

fs.writeFileSync(managementPath, managementContent, 'utf8');
console.log('✓ Updated UserManagement.tsx with complete route list');

console.log('\\n✅ User permissions modernization complete!');
console.log('Changes applied:');
console.log('  • Replaced all emoji icons with Ant Design icons');
console.log('  • Added 7 missing routes (items-new, items-new-operations, items-new-changes, users/roles, vendor uploads)');
console.log('  • Modernized permission cards with corporate styling');
console.log('  • Enhanced category headers with gradient icon avatars');
console.log('  • Updated summary section with proper icons');
console.log('  • Applied teal accent color (#00acac) throughout');
