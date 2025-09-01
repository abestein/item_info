import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    WarningOutlined,
    DatabaseOutlined
} from '@ant-design/icons';

interface SummaryData {
    totalItems: number;
    approvedItems: number;
    approvalPercentage: number;
    excludedItems: number;
    itemsWithIssues: number;
}

interface DashboardSummaryCardsProps {
    data?: SummaryData;
}

const DashboardSummaryCards: React.FC<DashboardSummaryCardsProps> = ({ data }) => {
    if (!data) return null;

    const cards = [
        {
            title: 'Total Items',
            value: data.totalItems,
            icon: <DatabaseOutlined />,
            color: '#1890ff',
        },
        {
            title: 'Approved',
            value: data.approvedItems,
            suffix: `(${data.approvalPercentage}%)`,
            icon: <CheckCircleOutlined />,
            color: '#52c41a',
        },
        {
            title: 'Excluded',
            value: data.excludedItems,
            suffix: `(${((data.excludedItems / data.totalItems) * 100).toFixed(1)}%)`,
            icon: <CloseCircleOutlined />,
            color: '#ff4d4f',
        },
        {
            title: 'With Issues',
            value: data.itemsWithIssues,
            suffix: `(${((data.itemsWithIssues / data.totalItems) * 100).toFixed(1)}%)`,
            icon: <WarningOutlined />,
            color: '#faad14',
        },
    ];

    return (
        <Row gutter={[16, 16]}>
            {cards.map((card, index) => (
                <Col xs={24} sm={12} lg={6} key={index}>
                    <Card hoverable className="summary-card">
                        <Statistic
                            title={card.title}
                            value={card.value}
                            suffix={card.suffix}
                            prefix={<span style={{ color: card.color }}>{card.icon}</span>}
                            valueStyle={{ color: card.color }}
                        />
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default DashboardSummaryCards;