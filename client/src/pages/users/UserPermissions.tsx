import React, { useState, useEffect } from 'react';
import {
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
} from 'antd';
import {
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
  HomeOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { userService } from '../../services/userService';
import type { User, UserPermissionsResponse, PagePermission } from '../../types/user.types';

const { Title, Text } = Typography;

interface UserPermissionsProps {
  user: User;
  onClose: () => void;
  onSave: () => void;
}

interface GroupedPermissions {
  [category: string]: PagePermission[];
}

const UserPermissions: React.FC<UserPermissionsProps> = ({ user, onClose, onSave }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionsData, setPermissionsData] = useState<UserPermissionsResponse | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [useRolePermissions, setUseRolePermissions] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const data = await userService.getUserPermissions(user.id);
      setPermissionsData(data);
      setSelectedPermissions(data.permissions || []);
      setUseRolePermissions(data.useRolePermissions);
      setHasChanges(false);
    } catch (error: any) {
      message.error(error.message || 'Failed to fetch user permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [user.id]);

  const handlePermissionChange = (permission: string, checked: boolean) => {
    const newPermissions = checked
      ? [...selectedPermissions, permission]
      : selectedPermissions.filter(p => p !== permission);
    
    setSelectedPermissions(newPermissions);
    setHasChanges(true);
  };

  const handleUseRolePermissionsChange = (checked: boolean) => {
    setUseRolePermissions(checked);
    setHasChanges(true);
    
    if (checked && permissionsData) {
      // When switching to role permissions, show what they would get
      setSelectedPermissions(permissionsData.roleBasedPermissions);
    }
  };

  const handleSelectAll = (_category: string, permissions: PagePermission[]) => {
    const categoryPermissions = permissions.map(p => p.page);
    const otherPermissions = selectedPermissions.filter(p =>
      !permissions.some(perm => perm.page === p)
    );
    setSelectedPermissions([...otherPermissions, ...categoryPermissions]);
    setHasChanges(true);
  };

  const handleDeselectAll = (_category: string, permissions: PagePermission[]) => {
    const categoryPermissions = permissions.map(p => p.page);
    const newPermissions = selectedPermissions.filter(p =>
      !categoryPermissions.includes(p)
    );
    setSelectedPermissions(newPermissions);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const permissionsToSave = useRolePermissions ? null : selectedPermissions;
      await userService.updateUserPermissions(user.id, permissionsToSave);
      setHasChanges(false);
      onSave();
    } catch (error: any) {
      message.error(error.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading permissions...</div>
      </div>
    );
  }

  if (!permissionsData) {
    return (
      <Alert
        message="Error"
        description="Failed to load permissions data"
        type="error"
        showIcon
      />
    );
  }

  // Group permissions by category
  const groupedPermissions: GroupedPermissions = permissionsData.availablePages.reduce(
    (acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    },
    {} as GroupedPermissions
  );

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'General': '#043168',
      'Management': '#ffc107',
      'Data': '#28a745',
      'System': '#6c757d',
      'Reports': '#043168',
      'Core': '#043168'
    };
    return colors[category] || '#043168';
  };

  const getPageIcon = (page: string) => {
    if (page === '/dashboard') return <DashboardOutlined style={{ fontSize: 18, color: '#043168' }} />;
    if (page === '/users') return <UserOutlined style={{ fontSize: 18, color: '#043168' }} />;
    if (page === '/users/roles') return <SafetyCertificateOutlined style={{ fontSize: 18, color: '#043168' }} />;
    if (page === '/items') return <InboxOutlined style={{ fontSize: 18, color: '#043168' }} />;
    if (page === '/items-new') return <TableOutlined style={{ fontSize: 18, color: '#043168' }} />;
    if (page === '/items-new-operations') return <ToolOutlined style={{ fontSize: 18, color: '#043168' }} />;
    if (page === '/items-new-changes') return <DiffOutlined style={{ fontSize: 18, color: '#043168' }} />;
    if (page === '/reports') return <BarChartOutlined style={{ fontSize: 18, color: '#043168' }} />;
    if (page === '/settings') return <SettingOutlined style={{ fontSize: 18, color: '#043168' }} />;
    if (page === '/vendor-items-upload') return <CloudUploadOutlined style={{ fontSize: 18, color: '#043168' }} />;
    if (page === '/vendor-items-test-upload') return <ExperimentOutlined style={{ fontSize: 18, color: '#043168' }} />;
    if (page === '/data-team-upload') return <FileAddOutlined style={{ fontSize: 18, color: '#043168' }} />;
    if (page === '/upload') return <UploadOutlined style={{ fontSize: 18, color: '#043168' }} />;
    if (page === '/upload-data-team') return <FileAddOutlined style={{ fontSize: 18, color: '#043168' }} />;
    return <FileTextOutlined style={{ fontSize: 18, color: '#043168' }} />;
  };

  const getCategoryIcon = (category: string) => {
    if (category === 'Core') return <HomeOutlined style={{ fontSize: 18, color: '#ffffff' }} />;
    if (category === 'General') return <HomeOutlined style={{ fontSize: 18, color: '#ffffff' }} />;
    if (category === 'Management') return <TeamOutlined style={{ fontSize: 18, color: '#ffffff' }} />;
    if (category === 'Data') return <DatabaseOutlined style={{ fontSize: 18, color: '#ffffff' }} />;
    if (category === 'System') return <SettingOutlined style={{ fontSize: 18, color: '#ffffff' }} />;
    if (category === 'Reports') return <BarChartOutlined style={{ fontSize: 18, color: '#ffffff' }} />;
    return <FileTextOutlined style={{ fontSize: 18, color: '#ffffff' }} />;
  };

  return (
    <div>
      {/* User Info Header */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space>
              <UserOutlined style={{ fontSize: 16 }} />
              <div>
                <Title level={5} style={{ margin: 0 }}>
                  {user.username}
                </Title>
                <Text type="secondary">{user.email}</Text>
              </div>
              <Tag
                style={{
                  background: user.role === 'admin' ? 'rgba(220, 53, 69, 0.1)' :
                              user.role === 'manager' ? 'rgba(255, 193, 7, 0.1)' :
                              user.role === 'editor' ? 'rgba(4, 49, 104, 0.1)' :
                              user.role === 'user' ? 'rgba(40, 167, 69, 0.1)' :
                              user.role === 'readonly' ? 'rgba(108, 117, 125, 0.1)' : 'rgba(4, 49, 104, 0.1)',
                  border: `1px solid ${
                    user.role === 'admin' ? '#dc3545' :
                    user.role === 'manager' ? '#ffc107' :
                    user.role === 'editor' ? '#043168' :
                    user.role === 'user' ? '#28a745' :
                    user.role === 'readonly' ? '#6c757d' : '#043168'
                  }`,
                  color: user.role === 'admin' ? '#dc3545' :
                         user.role === 'manager' ? '#ffc107' :
                         user.role === 'editor' ? '#043168' :
                         user.role === 'user' ? '#28a745' :
                         user.role === 'readonly' ? '#6c757d' : '#043168',
                  fontWeight: 600,
                  fontSize: '12px',
                  padding: '2px 8px'
                }}
              >
                {user.role.toUpperCase()}
              </Tag>
            </Space>
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchPermissions}
              loading={loading}
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Permission Mode Toggle */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row align="middle" justify="space-between">
          <Col span={16}>
            <Space direction="vertical" size="small">
              <Space align="center">
                <SettingOutlined />
                <Text strong style={{ fontSize: '16px' }}>Permission Mode</Text>
              </Space>
              <Switch
                checked={useRolePermissions}
                onChange={handleUseRolePermissionsChange}
                checkedChildren="Role-based"
                unCheckedChildren="Custom"
                size="default"
              />
              <Text type="secondary" style={{ fontSize: '13px' }}>
                {useRolePermissions
                  ? `Using default permissions for ${user.role.toUpperCase()} role`
                  : 'Using custom page-by-page permissions'
                }
              </Text>
            </Space>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'right' }}>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Current Access</Text>
              <Tag
                style={{
                  background: useRolePermissions ? 'rgba(4, 49, 104, 0.1)' : 'rgba(255, 193, 7, 0.1)',
                  border: useRolePermissions ? '1px solid #043168' : '1px solid #ffc107',
                  color: useRolePermissions ? '#043168' : '#ffc107',
                  fontWeight: 500,
                  fontSize: '12px',
                  padding: '4px 8px'
                }}
              >
                {useRolePermissions ? 'Role-Based' : 'Custom'}
              </Tag>
            </div>
          </Col>
        </Row>

        {useRolePermissions && (
          <Alert
            message="Role-based Permissions Active"
            description={`This user inherits all permissions from the "${user.role.toUpperCase()}" role. Individual page settings are ignored when role-based mode is active.`}
            type="info"
            showIcon
            style={{ marginTop: 12 }}
          />
        )}

        {!useRolePermissions && (
          <Alert
            message="Custom Permissions Active"
            description="You can select specific pages this user can access. This overrides the default role permissions."
            type="warning"
            showIcon
            style={{ marginTop: 12 }}
          />
        )}
      </Card>

      {/* Permissions by Category */}
      <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
        {Object.entries(groupedPermissions).map(([category, permissions]) => {
          const allSelected = permissions.every(p => selectedPermissions.includes(p.page));
          const someSelected = permissions.some(p => selectedPermissions.includes(p.page));
          
          return (
            <Card
              key={category}
              size="small"
              style={{ marginBottom: 12 }}
              title={
                <Space align="center" size={8}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #043168 0%, #032649 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {getCategoryIcon(category)}
                  </div>
                  <Text strong style={{ fontSize: 15, color: '#043168' }}>{category} Pages</Text>
                  <Tag
                    style={{
                      background: `${getCategoryColor(category)}15`,
                      border: `1px solid ${getCategoryColor(category)}`,
                      color: getCategoryColor(category),
                      fontWeight: 500,
                      fontSize: '12px',
                      padding: '2px 8px'
                    }}
                  >
                    {category}
                  </Tag>
                </Space>
              }
              extra={
                <Space>
                  <Button
                    size="small"
                    type="link"
                    onClick={() => handleSelectAll(category, permissions)}
                    disabled={useRolePermissions || allSelected}
                  >
                    Select All
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    onClick={() => handleDeselectAll(category, permissions)}
                    disabled={useRolePermissions || !someSelected}
                  >
                    Deselect All
                  </Button>
                </Space>
              }
            >
              <Row gutter={[12, 12]}>
                {permissions.map((permission) => (
                  <Col xs={24} sm={12} lg={8} key={permission.page}>
                    <Card
                      size="small"
                      className={`permission-card ${
                        selectedPermissions.includes(permission.page) ? 'selected' : ''
                      } ${
                        useRolePermissions ? 'disabled' : ''
                      }`}
                      style={{
                        cursor: useRolePermissions ? 'not-allowed' : 'pointer',
                        border: selectedPermissions.includes(permission.page)
                          ? '2px solid #043168'
                          : '1px solid #c5c5c7',
                        backgroundColor: selectedPermissions.includes(permission.page)
                          ? 'rgba(4, 49, 104, 0.08)'
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
                            <span style={{ fontSize: '16px', display: 'inline-flex', alignItems: 'center' }}>
                              {React.cloneElement(getPageIcon(permission.page), { style: { fontSize: 16, color: '#043168' } })}
                            </span>
                            <Text strong>{permission.name}</Text>
                          </Space>
                          <div>
                            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                              {permission.description}
                            </Text>
                            <Tag
                              style={{
                                marginTop: 4,
                                background: 'rgba(108, 117, 125, 0.1)',
                                border: '1px solid #6c757d',
                                color: '#6c757d',
                                fontWeight: 500,
                                fontSize: '11px',
                                padding: '2px 6px'
                              }}
                            >
                              {permission.page}
                            </Tag>
                          </div>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          );
        })}
      </div>

      <Divider />

      {/* Action Buttons */}
      <Row justify="end">
        <Space>
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Popconfirm
            title="Save Permission Changes"
            description={
              useRolePermissions
                ? `This will clear custom permissions and use role-based permissions for ${user.username}.`
                : `This will save custom permissions for ${user.username}.`
            }
            onConfirm={handleSave}
            okText="Save Changes"
            cancelText="Cancel"
            disabled={!hasChanges}
          >
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              disabled={!hasChanges}
            >
              Save Changes
            </Button>
          </Popconfirm>
        </Space>
      </Row>

      {/* Current Permissions Summary */}
      <Card
        size="small"
        style={{ marginTop: 16 }}
        title={(
          <Space>
            <span>📋</span>
            <Text strong>
              {useRolePermissions ? `${user.role.toUpperCase()} Role Permissions` : 'Custom Permissions'}
            </Text>
          </Space>
        )}
      >
        <Space wrap>
          {(useRolePermissions ? permissionsData.roleBasedPermissions : selectedPermissions).length > 0 ? (
            (useRolePermissions ? permissionsData.roleBasedPermissions : selectedPermissions).map(permission => {
              const permData = permissionsData.availablePages.find(p => p.page === permission);
              return (
                <Tag
                  key={permission}
                  style={{
                    background: useRolePermissions ? 'rgba(4, 49, 104, 0.1)' : 'rgba(255, 193, 7, 0.1)',
                    border: useRolePermissions ? '1px solid #043168' : '1px solid #ffc107',
                    color: useRolePermissions ? '#043168' : '#ffc107',
                    padding: '4px 8px',
                    fontSize: '13px'
                  }}
                >
                  <Space size={6} align="center">
                    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '14px' }}>
                      {React.cloneElement(getPageIcon(permission), {
                        style: { fontSize: 14, color: useRolePermissions ? '#043168' : '#ffc107' }
                      })}
                    </span>
                    <span style={{ fontWeight: 500 }}>{permData?.name || permission}</span>
                  </Space>
                </Tag>
              );
            })
          ) : (
            <Text key="no-permissions" type="secondary">
              {useRolePermissions ? 'No role permissions found' : 'No custom permissions selected'}
            </Text>
          )}
        </Space>

        {!useRolePermissions && (
          <div style={{ marginTop: 12, padding: '8px 0', borderTop: '1px solid #f0f0f0' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              💡 Click on page cards above to toggle permissions, or use "Select All" / "Deselect All" buttons
            </Text>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UserPermissions;
