import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Tag,
  Row,
  Col,
  Typography,
  Alert,
  Checkbox,
  Divider,
  App,
  Tabs
} from 'antd';
import {
  SettingOutlined,
  EditOutlined,
  SaveOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  UserOutlined,
  KeyOutlined,
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
  FileTextOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { userService } from '../../services/userService';

const { Text } = Typography;
const { TabPane } = Tabs;

interface RolePermission {
  role: string;
  description: string;
  permissions: string[];
  userCount: number;
}

interface PagePermission {
  page: string;
  name: string;
  description: string;
  category: string;
}

const RoleManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<RolePermission[]>([]);
  const [availablePages, setAvailablePages] = useState<PagePermission[]>([]);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();


  useEffect(() => {
    fetchRoles();
    fetchAvailablePages();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await userService.getRoles();
      setRoles(data);
    } catch (error: any) {
      message.error(error.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePages = async () => {
    try {
      const data = await userService.getAvailablePages();
      setAvailablePages(data.map(page => ({
        page: page.PagePath || page.page,
        name: page.PageName || page.name,
        description: page.Description || page.description,
        category: page.Category || page.category
      })));
    } catch (error: any) {
      message.error('Failed to fetch available pages');
    }
  };

  const handleEditRole = (role: RolePermission) => {
    setEditingRole(role.role);
    form.setFieldsValue({
      role: role.role,
      description: role.description,
      permissions: role.permissions
    });
    setModalVisible(true);
  };

  const handleSaveRole = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();

      if (editingRole) {
        await userService.updateRolePermissions(editingRole, values.permissions);

        // Update local state
        setRoles(prev => prev.map(r =>
          r.role === editingRole
            ? { ...r, description: values.description, permissions: values.permissions }
            : r
        ));

        message.success('Role permissions updated successfully');
        setModalVisible(false);
        setEditingRole(null);
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to update role permissions');
    } finally {
      setSaving(false);
    }
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

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'General': '#043168',
      'Management': '#ffc107',
      'Data': '#28a745',
      'System': '#6c757d',
      'Reports': '#043168'
    };
    return colors[category] || '#043168';
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'admin': '#dc3545',
      'manager': '#ffc107',
      'editor': '#043168',
      'user': '#28a745',
      'readonly': '#6c757d'
    };
    return colors[role] || '#043168';
  };

  const groupedPages = availablePages.reduce((acc, page) => {
    if (!acc[page.category]) {
      acc[page.category] = [];
    }
    acc[page.category].push(page);
    return acc;
  }, {} as { [category: string]: PagePermission[] });

  const columns: ColumnsType<RolePermission> = [
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => {
        const roleColorMap: { [key: string]: string } = {
          'admin': '#dc3545',
          'manager': '#ffc107',
          'editor': '#043168',
          'user': '#28a745',
          'readonly': '#6c757d'
        };
        const color = roleColorMap[role] || '#043168';

        return (
          <Space>
            <UserOutlined style={{ color: color, fontSize: 16 }} />
            <Tag
              style={{
                background: `${color}15`,
                border: `1px solid ${color}`,
                color: color,
                minWidth: '80px',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '13px',
                padding: '4px 12px'
              }}
            >
              {role.toUpperCase()}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Page Access',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) => (
        <Space wrap size={[4, 4]}>
          {permissions.slice(0, 3).map(permission => {
            const page = availablePages.find(p => p.page === permission);
            return (
              <Tag
                key={permission}
                style={{
                  background: 'rgba(4, 49, 104, 0.1)',
                  border: '1px solid #043168',
                  color: '#043168',
                  padding: '4px 8px',
                  fontSize: '13px'
                }}
              >
                <Space size={6} align="center">
                  <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '14px' }}>
                    {React.cloneElement(getPageIcon(permission), { style: { fontSize: 14, color: '#043168' } })}
                  </span>
                  <span style={{ fontWeight: 500 }}>{page?.name || permission}</span>
                </Space>
              </Tag>
            );
          })}
          {permissions.length > 3 && (
            <Tag
              style={{
                background: 'rgba(108, 117, 125, 0.1)',
                border: '1px solid #6c757d',
                color: '#6c757d',
                fontWeight: 500,
                fontSize: '13px',
                padding: '4px 8px'
              }}
            >
              +{permissions.length - 3} more
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Users',
      dataIndex: 'userCount',
      key: 'userCount',
      width: 80,
      render: (count: number) => {
        const color = count > 0 ? '#28a745' : '#6c757d';
        return (
          <Tag
            style={{
              background: `${color}15`,
              border: `1px solid ${color}`,
              color: color,
              fontWeight: 500,
              fontSize: '13px',
              padding: '4px 8px'
            }}
          >
            {count} user{count !== 1 ? 's' : ''}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: RolePermission) => (
        <Button
          type="primary"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEditRole(record)}
          style={{
            borderRadius: '6px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card
        title={
          <Space>
            <SettingOutlined />
            <span>Role Management</span>
          </Space>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchRoles}
            loading={loading}
          >
            Refresh
          </Button>
        }
      >
        <Alert
          message="Role-Based Permissions"
          description="Configure which pages each role can access. Users assigned to these roles will inherit these permissions unless they have custom permissions set."
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={columns}
          dataSource={roles}
          rowKey="role"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </Card>

      {/* Edit Role Permissions Modal */}
      <Modal
        title={
          <Space>
            <KeyOutlined />
            <span>Edit Role Permissions: {editingRole?.toUpperCase()}</span>
          </Space>
        }
        open={modalVisible}
        onOk={handleSaveRole}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText="Save Changes"
        confirmLoading={saving}
        okButtonProps={{ icon: <SaveOutlined /> }}
      >
        {editingRole && (
          <Form
            form={form}
            layout="vertical"
            
          >
            <Form.Item
              name="role"
              label="Role"
            >
              <Input disabled />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Description is required' }]}
            >
              <Input.TextArea
                rows={2}
                placeholder="Describe what this role can do..."
              />
            </Form.Item>

            <Divider>Page Permissions</Divider>

            <Form.Item
              name="permissions"
              label="Select pages this role can access"
            >
              <Checkbox.Group style={{ width: '100%' }}>
                <Tabs defaultActiveKey="all" size="small">
                  <TabPane tab="All Pages" key="all">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {Object.entries(groupedPages).map(([category, pages]) => (
                        <Card key={category} size="small" title={
                          <Space align="center" size={8}>
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              background: 'linear-gradient(135deg, #043168 0%, #032649 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {getCategoryIcon(category)}
                            </div>
                            <Text strong style={{ fontSize: 15, color: '#043168' }}>{category}</Text>
                          </Space>
                        }>
                          <Row gutter={[16, 8]}>
                            {pages.map(page => (
                              <Col xs={24} sm={12} key={page.page}>
                                <Checkbox value={page.page}>
                                  <Space direction="vertical" size={0}>
                                    <Space>
                                      <span style={{ fontSize: '18px', display: 'inline-flex', alignItems: 'center' }}>
                                        {React.cloneElement(getPageIcon(page.page), { style: { fontSize: 18, color: '#043168' } })}
                                      </span>
                                      <Text strong>{page.name}</Text>
                                    </Space>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                      {page.description}
                                    </Text>
                                  </Space>
                                </Checkbox>
                              </Col>
                            ))}
                          </Row>
                        </Card>
                      ))}
                    </Space>
                  </TabPane>

                  {Object.entries(groupedPages).map(([category, pages]) => (
                    <TabPane tab={category} key={category}>
                      <Row gutter={[16, 8]}>
                        {pages.map(page => (
                          <Col xs={24} sm={12} key={page.page}>
                            <Card size="small" style={{ height: '100%' }}>
                              <Checkbox value={page.page}>
                                <Space direction="vertical" size={0}>
                                  <Space>
                                    <span style={{ fontSize: '18px', display: 'inline-flex', alignItems: 'center' }}>
                                      {React.cloneElement(getPageIcon(page.page), { style: { fontSize: 18, color: '#043168' } })}
                                    </span>
                                    <Text strong>{page.name}</Text>
                                  </Space>
                                  <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                                    {page.description}
                                  </Text>
                                  <Tag
                                    style={{
                                      background: `${getCategoryColor(category)}15`,
                                      border: `1px solid ${getCategoryColor(category)}`,
                                      color: getCategoryColor(category),
                                      fontWeight: 500,
                                      fontSize: '11px',
                                      padding: '2px 6px',
                                      marginTop: 4
                                    }}
                                  >
                                    {page.page}
                                  </Tag>
                                </Space>
                              </Checkbox>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </TabPane>
                  ))}
                </Tabs>
              </Checkbox.Group>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default RoleManagement;
