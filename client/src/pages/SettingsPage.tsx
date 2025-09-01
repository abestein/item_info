import React, { useState } from 'react';
import { Card, Form, Input, Button, Switch, Select, Space, Tabs, message, Divider, Alert } from 'antd';
import {
    SaveOutlined,
    DatabaseOutlined,
    SettingOutlined,
    UserOutlined,
    BellOutlined,
    SecurityScanOutlined
} from '@ant-design/icons';

const { Option } = Select;

const SettingsPage: React.FC = () => {
    const [generalForm] = Form.useForm();
    const [databaseForm] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleGeneralSave = async (values: any) => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            message.success('General settings saved successfully');
            console.log('General settings:', values);
        } catch (error) {
            message.error('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const handleDatabaseTest = async () => {
        setLoading(true);
        try {
            // In real app, this would test the database connection
            await new Promise(resolve => setTimeout(resolve, 1500));
            message.success('Database connection successful');
        } catch (error) {
            message.error('Database connection failed');
        } finally {
            setLoading(false);
        }
    };

    const tabItems = [
        {
            key: 'general',
            label: (
                <span>
                    <SettingOutlined />
                    General
                </span>
            ),
            children: (
                <Form
                    form={generalForm}
                    layout="vertical"
                    onFinish={handleGeneralSave}
                    initialValues={{
                        companyName: 'My Company',
                        itemsPerPage: 20,
                        autoRefresh: false,
                        refreshInterval: 30,
                        theme: 'light',
                    }}
                >
                    <Form.Item
                        name="companyName"
                        label="Company Name"
                        rules={[{ required: true, message: 'Please enter company name' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Enter company name" />
                    </Form.Item>

                    <Form.Item
                        name="itemsPerPage"
                        label="Items Per Page"
                        rules={[{ required: true, message: 'Please select items per page' }]}
                    >
                        <Select>
                            <Option value={10}>10</Option>
                            <Option value={20}>20</Option>
                            <Option value={50}>50</Option>
                            <Option value={100}>100</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="autoRefresh"
                        label="Auto Refresh Data"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.autoRefresh !== currentValues.autoRefresh}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('autoRefresh') ? (
                                <Form.Item
                                    name="refreshInterval"
                                    label="Refresh Interval (seconds)"
                                    rules={[{ required: true, message: 'Please enter refresh interval' }]}
                                >
                                    <Input type="number" min={10} max={300} />
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>

                    <Form.Item
                        name="theme"
                        label="Theme"
                    >
                        <Select>
                            <Option value="light">Light (High Contrast)</Option>
                            <Option value="dark" disabled>Dark (Coming Soon)</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                            Save General Settings
                        </Button>
                    </Form.Item>
                </Form>
            )
        },
        {
            key: 'database',
            label: (
                <span>
                    <DatabaseOutlined />
                    Database
                </span>
            ),
            children: (
                <>
                    <Alert
                        message="Database Configuration"
                        description="These settings are read from the .env file on the server. Contact your system administrator to modify database connections."
                        type="info"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />

                    <Form
                        form={databaseForm}
                        layout="vertical"
                        initialValues={{
                            server: '10.40.1.4',
                            database: 'Item_Dimensions',
                            port: 1433,
                        }}
                        disabled
                    >
                        <Form.Item
                            name="server"
                            label="Server"
                        >
                            <Input prefix={<DatabaseOutlined />} />
                        </Form.Item>

                        <Form.Item
                            name="database"
                            label="Database Name"
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="port"
                            label="Port"
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item>
                            <Space>
                                <Button
                                    type="primary"
                                    icon={<SecurityScanOutlined />}
                                    onClick={handleDatabaseTest}
                                    loading={loading}
                                >
                                    Test Connection
                                </Button>
                                <Button disabled>
                                    View Connection String
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>

                    <Divider />

                    <h4>Database Tables</h4>
                    <ul>
                        <li>products_measurement</li>
                        <li>ItemVendorDetails</li>
                        <li>Dimensioner_ItemList_NoDiscr_BP2</li>
                    </ul>
                </>
            )
        },
        {
            key: 'notifications',
            label: (
                <span>
                    <BellOutlined />
                    Notifications
                </span>
            ),
            children: (
                <Form layout="vertical">
                    <Form.Item label="Email Notifications" valuePropName="checked">
                        <Switch disabled />
                    </Form.Item>

                    <Form.Item label="Upload Success Notifications" valuePropName="checked">
                        <Switch disabled />
                    </Form.Item>

                    <Form.Item label="Error Alerts" valuePropName="checked">
                        <Switch disabled />
                    </Form.Item>

                    <Alert
                        message="Coming Soon"
                        description="Notification settings will be available in a future update."
                        type="info"
                        showIcon
                        style={{ marginTop: 24 }}
                    />
                </Form>
            )
        }
    ];

    return (
        <Card
            title="Settings"
            variant="borderless"
            style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        >
            <Tabs defaultActiveKey="general" items={tabItems} />
        </Card>
    );
};

export default SettingsPage;