import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Space,
  Tag,
  Switch,
  Row,
  Col,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  KeyOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { userService } from '../../services/userService';
import type { User, UserCreateDTO, UserUpdateDTO, UserListParams } from '../../types/user.types';
import UserPermissions from './UserPermissions';

const { Option } = Select;
const { Search } = Input;

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [permissionsModalVisible, setPermissionsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState<UserListParams>({});

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
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      ...user,
      password: '', // Don't populate password field
    });
    setModalVisible(true);
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
        await userService.createUser(values as UserCreateDTO);
        message.success('User created successfully');
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
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : role === 'manager' ? 'orange' : 'blue'}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
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
            />
          </Tooltip>
          <Tooltip title="Manage Permissions">
            <Button
              size="small"
              icon={<KeyOutlined />}
              onClick={() => handleManagePermissions(record)}
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
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container" style={{ padding: 24 }}>
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
              <Option value="user">User</Option>
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
          rowKey={(record) => record.id.toString()}
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
        onCancel={() => setModalVisible(false)}
        width={600}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
        >
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
              >
                <Select placeholder="Select role">
                  <Option value="admin">Admin</Option>
                  <Option value="manager">Manager</Option>
                  <Option value="user">User</Option>
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
        </Form>
      </Modal>

      {/* User Permissions Modal */}
      <Modal
        title="Manage User Permissions"
        open={permissionsModalVisible}
        onCancel={() => setPermissionsModalVisible(false)}
        footer={null}
        width={800}
        destroyOnHidden
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
