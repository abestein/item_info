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
  SettingOutlined
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

  const handleSelectAll = (category: string, permissions: PagePermission[]) => {
    const categoryPermissions = permissions.map(p => p.page);
    const otherPermissions = selectedPermissions.filter(p => 
      !permissions.some(perm => perm.page === p)
    );
    setSelectedPermissions([...otherPermissions, ...categoryPermissions]);
    setHasChanges(true);
  };

  const handleDeselectAll = (category: string, permissions: PagePermission[]) => {
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
      'Core': 'blue',
      'Management': 'orange',
      'Data': 'green',
      'System': 'purple',
      'Reports': 'cyan'
    };
    return colors[category] || 'default';
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
              <Tag color={user.role === 'admin' ? 'red' : user.role === 'manager' ? 'orange' : 'blue'}>
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
          <Col>
            <Space direction="vertical" size="small">
              <Text strong>Permission Mode</Text>
              <Switch
                checked={useRolePermissions}
                onChange={handleUseRolePermissionsChange}
                checkedChildren="Role-based"
                unCheckedChildren="Custom"
              />
            </Space>
          </Col>
          <Col>
            <Text type="secondary">
              {useRolePermissions 
                ? `Using permissions from ${user.role} role`
                : 'Using custom page permissions'
              }
            </Text>
          </Col>
        </Row>
        
        {useRolePermissions && (
          <Alert
            message="Role-based Permissions Active"
            description={`This user will inherit all permissions from the "${user.role}" role. Any custom permissions will be ignored.`}
            type="info"
            showIcon
            style={{ marginTop: 12 }}
          />
        )}
      </Card>

      {/* Permissions by Category */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {Object.entries(groupedPermissions).map(([category, permissions]) => {
          const allSelected = permissions.every(p => selectedPermissions.includes(p.page));
          const someSelected = permissions.some(p => selectedPermissions.includes(p.page));
          
          return (
            <Card
              key={category}
              size="small"
              style={{ marginBottom: 12 }}
              title={
                <Space>
                  <Tag color={getCategoryColor(category)}>{category}</Tag>
                  <Text strong>{category} Permissions</Text>
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
              <Row gutter={[16, 8]}>
                {permissions.map((permission) => (
                  <Col xs={24} sm={12} key={permission.page}>
                    <Checkbox
                      checked={selectedPermissions.includes(permission.page)}
                      onChange={(e) => handlePermissionChange(permission.page, e.target.checked)}
                      disabled={useRolePermissions}
                    >
                      <Space direction="vertical" size={0}>
                        <Text strong>{permission.name}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {permission.description}
                        </Text>
                      </Space>
                    </Checkbox>
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
      {!useRolePermissions && (
        <Card
          size="small"
          style={{ marginTop: 16 }}
          title="Current Custom Permissions"
        >
          <Space wrap>
            {selectedPermissions.length > 0 ? (
              selectedPermissions.map(permission => {
                const permData = permissionsData.availablePages.find(p => p.page === permission);
                return (
                  <Tag key={permission} color="blue">
                    {permData?.name || permission}
                  </Tag>
                );
              })
            ) : (
              <Text key="no-permissions" type="secondary">No permissions selected</Text>
            )}
          </Space>
        </Card>
      )}
    </div>
  );
};

export default UserPermissions;
