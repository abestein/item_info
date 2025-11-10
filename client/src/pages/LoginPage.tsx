import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, App } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './LoginPage.css';

const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { message } = App.useApp();

    const handleLogin = async (values: any) => {
        setLoading(true);
        const result = await authService.login(values);

        if (result.success) {
            message.success('Login successful! Redirecting...');
            setTimeout(() => {
                navigate('/');
            }, 800);
        } else {
            message.error(result.error || 'Invalid username or password');
        }
        setLoading(false);
    };

    return (
        <div className="split-login-container">
            {/* Logo spanning both sections */}
            <div className="logo-container">
                <img src="/logo-new.png" alt="Dynarex" className="logo-spanning" />
            </div>

            {/* Triangle Logo Watermark - Bottom Right */}
            <div className="triangle-watermark">
                <img src="/triangle-logo.png" alt="" />
            </div>

            {/* Left Side - Dark Blue */}
            <div className="left-section">
                <div className="left-content">
                </div>
            </div>

            {/* Right Side - Light Gray with Login Form */}
            <div className="right-section">
                <div className="right-content">

                    {/* Login Form Title */}
                    <h2 className="form-title">Sign In</h2>
                    <p className="form-subtitle">Enter your credentials to continue</p>

                    {/* Login Form */}
                    <Form
                        name="login"
                        onFinish={handleLogin}
                        layout="vertical"
                        className="split-login-form"
                        requiredMark={false}
                    >
                        {/* Username Field */}
                        <Form.Item
                            name="username"
                            rules={[{ required: true, message: 'Please enter your username' }]}
                        >
                            <Input
                                prefix={<UserOutlined style={{ color: '#043168' }} />}
                                placeholder="Username or Email"
                                size="large"
                                className="split-form-input"
                            />
                        </Form.Item>

                        {/* Password Field */}
                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: 'Please enter your password' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#043168' }} />}
                                placeholder="Password"
                                size="large"
                                className="split-form-input"
                                iconRender={(visible) =>
                                    visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                                }
                            />
                        </Form.Item>

                        {/* Remember Me & Forgot Password */}
                        <div className="split-form-options">
                            <Form.Item name="remember" valuePropName="checked" noStyle>
                                <Checkbox className="split-remember">
                                    Remember me
                                </Checkbox>
                            </Form.Item>
                            <a
                                href="#"
                                className="split-forgot-link"
                                onClick={(e) => {
                                    e.preventDefault();
                                    message.info('Please contact your administrator');
                                }}
                            >
                                Forgot password?
                            </a>
                        </div>

                        {/* Submit Button */}
                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                block
                                size="large"
                                className="split-login-button"
                            >
                                Sign In
                            </Button>
                        </Form.Item>
                    </Form>

                    {/* Footer */}
                    <div className="split-footer">
                        <p>© 2025 Dynarex Corporation</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
