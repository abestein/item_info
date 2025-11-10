import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  Space,
  Tag,
  Switch,
  Row,
  Col,
  Tooltip,
  App,
  Alert,
  Checkbox,
  Divider,
  Typography
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  KeyOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { userService } from '../../services/userService';
import type { User, UserCreateDTO, UserUpdateDTO, UserListParams } from '../../types/user.types';
import UserPermissions from './UserPermissions';

const { Option } = Select;
const { Search } = Input;
const { Text } = Typography;

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [permissionsModalVisible, setPermissionsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<User | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState<UserListParams>({});

  // Permission configuration for new users
  const [useRolePermissions, setUseRolePermissions] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [availablePages] = useState<string[]>([
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
  ]);

  const fetchUsers = async (params?: UserListParams) => {
    try {
      setLoading(true);
      const queryParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
        ...params,
      };
      
      const response = await userService.getUsers(queryParams);
      setUsers(response.users);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        current: response.page,
        pageSize: response.pageSize,
      }));
    } catch (error: any) {
      message.error(error.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.current, pagination.pageSize, filters]);

  const handleAdd = () => {
    setEditingUser(null);
    setUseRolePermissions(true);
    setSelectedPermissions([]);
    setModalVisible(true);
    // Use setTimeout to ensure modal is rendered before setting default values
    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue({
        isActive: true // Set default active status
      });
    }, 0);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setModalVisible(true);
    // Use setTimeout to ensure modal is rendered before setting values
    setTimeout(() => {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        password: '', // Don't populate password field
      });
    }, 0);
  };

  const handleManagePermissions = (user: User) => {
    setSelectedUserForPermissions(user);
    setPermissionsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await userService.deleteUser(id);
      message.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      message.error(error.message || 'Failed to delete user');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      console.log('Form values:', values);
      
      // Remove empty password field for updates
      if (editingUser && !values.password) {
        delete values.password;
      }

      if (editingUser) {
        console.log('Updating user:', editingUser.id, values);
        await userService.updateUser(editingUser.id, values as UserUpdateDTO);
        message.success('User updated successfully');
      } else {
        console.log('Creating user:', values);
        const createdUser = await userService.createUser(values as UserCreateDTO);

        // Set initial permissions if custom permissions were selected
        if (!useRolePermissions && createdUser.id) {
          try {
            const permissionsToSave = selectedPermissions.length > 0 ? selectedPermissions : null;
            await userService.updateUserPermissions(createdUser.id, permissionsToSave);
            message.success('User created successfully with custom permissions');
          } catch (permError: any) {
            message.warning(`User created but failed to set permissions: ${permError.message}`);
          }
        } else {
          message.success('User created successfully');
        }
      }
      setModalVisible(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Modal save error:', error);
      message.error(error.message || 'Failed to save user');
    }
  };

  const handleTableChange = (newPagination: any) => {
    setPagination(prev => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    }));
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, searchTerm: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleRoleFilter = (value: string) => {
    setFilters(prev => ({ ...prev, role: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setFilters(prev => ({ ...prev, isActive: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const columns: ColumnsType<User> = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: (text: string) => (
        <Space>
          <UserOutlined />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const roleText = role && typeof role === 'string' ? role.toUpperCase() : 'UNKNOWN';
        const roleColorMap: { [key: string]: string } = {
          'admin': '#dc3545',
          'manager': '#ffc107',
          'editor': '#043168',
          'user': '#28a745',
          'readonly': '#6c757d'
        };
        const roleColor = roleColorMap[role] || '#043168';
        return (
          <Tag
            style={{
              background: `${roleColor}15`,
              border: `1px solid ${roleColor}`,
              color: roleColor,
              fontWeight: 600,
              fontSize: '12px',
              padding: '2px 8px'
            }}
          >
            {roleText}
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => {
        const color = isActive ? '#28a745' : '#6c757d';
        return (
          <Tag
            style={{
              background: `${color}15`,
              border: `1px solid ${color}`,
              color: color,
              fontWeight: 500,
              fontSize: '12px',
              padding: '2px 8px'
            }}
          >
            {isActive ? 'Active' : 'Inactive'}
          </Tag>
        );
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
      width: 120,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: User) => (
        <Space size="small">
          <Tooltip title="Edit User">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          </Tooltip>
          <Tooltip title="Manage Permissions">
            <Button
              size="small"
              icon={<KeyOutlined />}
              onClick={() => handleManagePermissions(record)}
              style={{
                borderRadius: '6px',
                borderColor: '#043168',
                color: '#043168',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete User"
            description="Are you sure you want to delete this user? This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete User">
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                style={{
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card
        title="User Management"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchUsers()}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Add User
            </Button>
          </Space>
        }
      >
        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Search
              placeholder="Search users..."
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} sm={4}>
            <Select
              placeholder="Role"
              allowClear
              onChange={handleRoleFilter}
              style={{ width: '100%' }}
            >
              <Option value="">All Roles</Option>
              <Option value="admin">Admin</Option>
              <Option value="manager">Manager</Option>
              <Option value="editor">Editor</Option>
              <Option value="user">User</Option>
              <Option value="readonly">Readonly</Option>
            </Select>
          </Col>
          <Col xs={12} sm={4}>
            <Select
              placeholder="Status"
              allowClear
              onChange={handleStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="">All Status</Option>
              <Option value="true">Active</Option>
              <Option value="false">Inactive</Option>
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={users}
          rowKey={(record) => record.id ? record.id.toString() : `temp-${Math.random()}`}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} users`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
          size="middle"
        />
      </Card>

      <Modal
        title={editingUser ? 'Edit User' : 'Create New User'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={600}
        destroyOnClose
        forceRender
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
        >
          {/* Role Information Alert */}
          <Alert
            message="Role-Based Permissions"
            description="Each role has default page access permissions. You can customize individual permissions after creating the user."
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 16 }}
            closable
          />
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="Username"
                rules={[
                  { required: true, message: 'Username is required' },
                  { min: 3, message: 'Username must be at least 3 characters' },
                  { pattern: /^[a-zA-Z0-9_]+$/, message: 'Username can only contain letters, numbers, and underscores' }
                ]}
              >
                <Input placeholder="Enter username" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Please enter a valid email address' }
                ]}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="password"
            label={editingUser ? "New Password (leave blank to keep current)" : "Password"}
            rules={editingUser ? [] : [
              { required: true, message: 'Password is required' },
              { min: 8, message: 'Password must be at least 8 characters' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
                message: 'Password must contain uppercase, lowercase, number, and special character'
              }
            ]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please select a role' }]}
                tooltip="Choose the user's role. This determines their default page access permissions."
              >
                <Select placeholder="Select role" style={{ width: '100%' }}>
                  <Option value="admin">
                    <Space>
                      <Tag style={{ background: 'rgba(220, 53, 69, 0.1)', border: '1px solid #dc3545', color: '#dc3545', fontWeight: 600, fontSize: '11px', padding: '2px 8px' }}>ADMIN</Tag>
                      <span>Full system access</span>
                    </Space>
                  </Option>
                  <Option value="manager">
                    <Space>
                      <Tag style={{ background: 'rgba(255, 193, 7, 0.1)', border: '1px solid #ffc107', color: '#ffc107', fontWeight: 600, fontSize: '11px', padding: '2px 8px' }}>MANAGER</Tag>
                      <span>Management access + uploads</span>
                    </Space>
                  </Option>
                  <Option value="editor">
                    <Space>
                      <Tag style={{ background: 'rgba(4, 49, 104, 0.1)', border: '1px solid #043168', color: '#043168', fontWeight: 600, fontSize: '11px', padding: '2px 8px' }}>EDITOR</Tag>
                      <span>Can edit items and reports</span>
                    </Space>
                  </Option>
                  <Option value="user">
                    <Space>
                      <Tag style={{ background: 'rgba(40, 167, 69, 0.1)', border: '1px solid #28a745', color: '#28a745', fontWeight: 600, fontSize: '11px', padding: '2px 8px' }}>USER</Tag>
                      <span>Standard user access</span>
                    </Space>
                  </Option>
                  <Option value="readonly">
                    <Space>
                      <Tag style={{ background: 'rgba(108, 117, 125, 0.1)', border: '1px solid #6c757d', color: '#6c757d', fontWeight: 600, fontSize: '11px', padding: '2px 8px' }}>READONLY</Tag>
                      <span>View-only access</span>
                    </Space>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isActive"
                label="Status"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch
                  checkedChildren="Active"
                  unCheckedChildren="Inactive"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Permission Configuration (only for new users) */}
          {!editingUser && (
            <>
              <Divider>Initial Permissions</Divider>
              <Alert
                message="Permission Mode"
                description="Choose whether this user should use role-based permissions or have custom page access."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={24}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>Permission Type:</Text>
                    <Switch
                      checked={useRolePermissions}
                      onChange={setUseRolePermissions}
                      checkedChildren="Role-Based"
                      unCheckedChildren="Custom"
                      style={{ width: 120 }}
                    />
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      {useRolePermissions
                        ? 'User will inherit permissions from their role'
                        : 'Select specific pages this user can access'
                      }
                    </Text>
                  </Space>
                </Col>
              </Row>

              {!useRolePermissions && (
                <Row gutter={16}>
                  <Col span={24}>
                    <Card size="small" title="Select Accessible Pages" style={{ marginBottom: 16 }}>
                      <Checkbox.Group
                        value={selectedPermissions}
                        onChange={(values) => setSelectedPermissions(values as string[])}
                        style={{ width: '100%' }}
                      >
                        <Row gutter={[8, 8]}>
                          {availablePages.map(page => (
                            <Col span={12} key={page}>
                              <Checkbox value={page}>
                                <Space>
                                  <span>{page === '/dashboard' ? '📊' :
                                         page === '/users' ? '👥' :
                                         page === '/items' ? '📦' :
                                         page === '/reports' ? '📈' :
                                         page === '/settings' ? '⚙️' :
                                         page === '/upload' ? '📤' : '📄'}</span>
                                  <Text>{page.replace('/', '').replace(/-/g, ' ').toUpperCase() || 'Home'}</Text>
                                </Space>
                              </Checkbox>
                            </Col>
                          ))}
                        </Row>
                      </Checkbox.Group>
                      {selectedPermissions.length === 0 && (
                        <Alert
                          message="No pages selected"
                          description="This user will have no access to any pages. Select at least one page or switch to Role-Based mode."
                          type="warning"
                          showIcon
                          style={{ marginTop: 12 }}
                        />
                      )}
                    </Card>
                  </Col>
                </Row>
              )}
            </>
          )}
        </Form>
      </Modal>

      {/* User Permissions Modal */}
      <Modal
        title="Manage User Permissions"
        open={permissionsModalVisible}
        onCancel={() => setPermissionsModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        {selectedUserForPermissions && (
          <UserPermissions
            user={selectedUserForPermissions}
            onClose={() => setPermissionsModalVisible(false)}
            onSave={() => {
              setPermissionsModalVisible(false);
              message.success('Permissions updated successfully');
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
