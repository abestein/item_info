import React from 'react';
import { Card, Empty, Button, Space, Row, Col, Statistic } from 'antd';
import {
    FileTextOutlined,
    BarChartOutlined,
    LineChartOutlined,
    PieChartOutlined,
    DownloadOutlined,
    CalendarOutlined
} from '@ant-design/icons';

const ReportsPage: React.FC = () => {
    // Placeholder for future report types
    const reportTypes = [
        {
            title: 'Inventory Summary',
            icon: <BarChartOutlined style={{ fontSize: 48, color: '#043168' }} />,
            description: 'Overview of current inventory levels and values',
            available: false,
        },
        {
            title: 'Cost Analysis',
            icon: <LineChartOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
            description: 'FOB costs, duties, and tariff trends over time',
            available: false,
        },
        {
            title: 'Vendor Performance',
            icon: <PieChartOutlined style={{ fontSize: 48, color: '#fa8c16' }} />,
            description: 'Analysis of vendor pricing and delivery metrics',
            available: false,
        },
        {
            title: 'Purchase History',
            icon: <CalendarOutlined style={{ fontSize: 48, color: '#722ed1' }} />,
            description: 'Historical purchase orders and trends',
            available: false,
        },
    ];

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card
                title="Reports"
                variant="borderless"
                style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
                <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="Total Items"
                                value={0}
                                prefix={<FileTextOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="Active Vendors"
                                value={0}
                                prefix={<BarChartOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="Reports Available"
                                value={0}
                                prefix={<PieChartOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    {reportTypes.map((report, index) => (
                        <Col span={12} key={index}>
                            <Card
                                hoverable
                                style={{
                                    height: '100%',
                                    opacity: report.available ? 1 : 0.6,
                                    cursor: report.available ? 'pointer' : 'not-allowed'
                                }}
                            >
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    {report.icon}
                                    <h3 style={{ marginTop: 16, marginBottom: 8 }}>{report.title}</h3>
                                    <p style={{ color: '#666', marginBottom: 16 }}>{report.description}</p>
                                    <Button
                                        type="primary"
                                        icon={<DownloadOutlined />}
                                        disabled={!report.available}
                                    >
                                        {report.available ? 'Generate Report' : 'Coming Soon'}
                                    </Button>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Card>

            <Card
                variant="borderless"
                style={{
                    borderRadius: 8,
                    backgroundColor: '#f0f8ff',
                    borderLeft: '4px solid #043168'
                }}
            >
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <span>
                            Reports functionality is coming soon. You'll be able to:
                            <ul style={{ textAlign: 'left', marginTop: 16 }}>
                                <li>Generate inventory summaries</li>
                                <li>Analyze cost trends and patterns</li>
                                <li>Track vendor performance metrics</li>
                                <li>Export reports in Excel and PDF formats</li>
                            </ul>
                        </span>
                    }
                />
            </Card>
        </Space>
    );
};

export default ReportsPage;