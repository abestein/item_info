import React, { useState } from 'react';
import { Form, Input, Button, Card, Tabs, App } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { message } = App.useApp();

    const handleLogin = async (values: any) => {
        setLoading(true);
        const result = await authService.login(values);

        if (result.success) {
            message.success('Login successful!');
            navigate('/');
        } else {
            message.error(result.error || 'Login failed');
        }
        setLoading(false);
    };

    const handleRegister = async (values: any) => {
        setLoading(true);
        const result = await authService.register(values);

        if (result.success) {
            message.success('Registration successful!');
            navigate('/');
        } else {
            message.error(result.error || 'Registration failed');
        }
        setLoading(false);
    };

    const tabItems = [
        {
            key: 'login',
            label: 'Login',
            children: (
                <Form
                    name="login"
                    onFinish={handleLogin}
                    layout="vertical"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Please enter username!' }]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="Username or Email"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please enter password!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Password"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            size="large"
                        >
                            Log in
                        </Button>
                    </Form.Item>
                </Form>
            )
        },
        {
            key: 'register',
            label: 'Register',
            children: (
                <Form
                    name="register"
                    onFinish={handleRegister}
                    layout="vertical"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Please enter username!' }]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="Username"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Please enter email!' },
                            { type: 'email', message: 'Invalid email format!' }
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined />}
                            placeholder="Email"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: 'Please enter password!' },
                            { min: 6, message: 'Password must be at least 6 characters!' }
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Password"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            size="large"
                        >
                            Register
                        </Button>
                    </Form.Item>
                </Form>
            )
        }
    ];

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: '#f0f2f5'
        }}>
            <Card style={{ width: 400 }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <h1>Item Dimensions</h1>
                    <p style={{ color: '#666' }}>Please login to continue</p>
                </div>
                <Tabs defaultActiveKey="login" centered items={tabItems} />
            </Card>
        </div>
    );
};

export default LoginPage;
