import React, { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    Statistic,
    Space,
    Spin,
    Typography,
    Button,
    Alert,
    Tag,
    Divider
} from 'antd';
import {
    DatabaseOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    FileTextOutlined,
    InboxOutlined,
    RightOutlined,
    SettingOutlined,
    TableOutlined,
    PlusCircleOutlined,
    EditOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import './NewDashboardPage.css';

const { Title, Text } = Typography;

interface DashboardData {
    mainTable: {
        totalItems: number;
        itemsWithUPC: number;
        newBrandItems: number;
        itemsWithoutUPC: number;
        latestId: number;
    };
    tempTable: {
        hasData: boolean;
        count: number;
        differences: {
            new: number;
            modified: number;
            deleted: number;
            total: number;
        };
    };
}

const NewDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_CONFIG.BASE_URL}/new-dashboard-summary`);
            if (response.data.success) {
                setDashboardData(response.data);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page-container" style={{ textAlign: 'center', padding: '100px' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Section 1: Main Table Statistics */}
            <Card className="section-card"
                title={
                    <Space>
                        <DatabaseOutlined style={{ color: 'var(--color-navy)', fontSize: '20px' }} />
                        <span>Main Table Statistics</span>
                    </Space>
                }
            >
                <Row gutter={[24, 24]}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="stat-card-total" bordered={false}>
                            <Statistic
                                title="Total Items"
                                value={dashboardData?.mainTable.totalItems}
                                prefix={<DatabaseOutlined style={{ fontSize: '28px' }} />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="stat-card-success" bordered={false}>
                            <Statistic
                                title="Items with UPC"
                                value={dashboardData?.mainTable.itemsWithUPC}
                                prefix={<CheckCircleOutlined style={{ fontSize: '28px' }} />}
                                suffix={
                                    <Text type="secondary" style={{ fontSize: 14 }}>
                                        / {dashboardData?.mainTable.totalItems}
                                    </Text>
                                }
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="stat-card-warning" bordered={false}>
                            <Statistic
                                title="NEW Brand Items"
                                value={dashboardData?.mainTable.newBrandItems}
                                prefix={<PlusCircleOutlined style={{ fontSize: '28px' }} />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="stat-card-error" bordered={false}>
                            <Statistic
                                title="Items without UPC"
                                value={dashboardData?.mainTable.itemsWithoutUPC}
                                prefix={<WarningOutlined style={{ fontSize: '28px' }} />}
                            />
                        </Card>
                    </Col>
                </Row>
            </Card>

            {/* Section 2: Temp Table Information */}
            <Card className="section-card"
                title={
                    <Space>
                        <InboxOutlined style={{ color: 'var(--color-navy)', fontSize: '20px' }} />
                        <span>Temporary Table Status</span>
                    </Space>
                }
            >
                {dashboardData?.tempTable.hasData ? (
                    <>
                        <Alert
                            message="Pending Changes Detected"
                            description={`The temporary table contains ${dashboardData.tempTable.count} items with ${dashboardData.tempTable.differences.total} differences to review.`}
                            type="warning"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                        <Row gutter={[24, 24]}>
                            <Col xs={24} sm={8}>
                                <Card className="pending-card" bordered={false}>
                                    <Statistic
                                        title="New Items"
                                        value={dashboardData.tempTable.differences.new}
                                        prefix={<PlusCircleOutlined style={{ fontSize: '24px' }} />}
                                        valueStyle={{ color: '#52c41a', fontWeight: 700 }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={8}>
                                <Card className="pending-card" bordered={false}>
                                    <Statistic
                                        title="Modified Items"
                                        value={dashboardData.tempTable.differences.modified}
                                        prefix={<EditOutlined style={{ fontSize: '24px' }} />}
                                        valueStyle={{ color: '#1890ff', fontWeight: 700 }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={8}>
                                <Card className="pending-card" bordered={false}>
                                    <Statistic
                                        title="Deleted Items"
                                        value={dashboardData.tempTable.differences.deleted}
                                        prefix={<DeleteOutlined style={{ fontSize: '24px' }} />}
                                        valueStyle={{ color: '#cf1322', fontWeight: 700 }}
                                    />
                                </Card>
                            </Col>
                        </Row>
                        <Divider />
                        <div style={{ textAlign: 'center' }}>
                            <Button
                                type="primary"
                                size="large"
                                icon={<FileTextOutlined />}
                                onClick={() => navigate('/items-new-changes')}
                            >
                                View Pending Changes
                            </Button>
                        </div>
                    </>
                ) : (
                    <Alert
                        message="No Pending Data"
                        description="The temporary table is empty. Upload new data to start processing changes."
                        type="info"
                        showIcon
                        action={
                            <Button
                                size="small"
                                type="primary"
                                onClick={() => navigate('/items-new-operations')}
                            >
                                Upload Data
                            </Button>
                        }
                    />
                )}
            </Card>

            {/* Section 3 & 4: Quick Actions */}
            <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                    <Card
                        className="action-card"
                        onClick={() => navigate('/items-new-operations')}
                        bordered={false}
                    >
                        <div className="action-icon">
                            <SettingOutlined />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <Title level={4} className="action-card-title">Operations</Title>
                            <Text className="action-card-description">
                                Upload Excel files, validate data, and manage the temporary table
                            </Text>
                            <div style={{ marginTop: 16 }}>
                                <Button
                                    type="primary"
                                    icon={<RightOutlined />}
                                >
                                    Go to Operations
                                </Button>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card
                        className="action-card"
                        onClick={() => navigate('/items-new')}
                        bordered={false}
                    >
                        <div className="action-icon">
                            <TableOutlined />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <Title level={4} className="action-card-title">Item View</Title>
                            <Text className="action-card-description">
                                Browse and search all items in the main table
                            </Text>
                            <div style={{ marginTop: 16 }}>
                                <Button
                                    type="primary"
                                    icon={<RightOutlined />}
                                >
                                    Go to Item View
                                </Button>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default NewDashboardPage;
