import React, { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    Statistic,
    Tabs,
    Space,
    Spin,
    Typography,
    message,
    App
} from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    WarningOutlined,
    DatabaseOutlined
} from '@ant-design/icons';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LabelList
} from 'recharts';
import DashboardSummaryCards from '../components/Dashboard/DashboardSummaryCards';
import IssuesTable from '../components/Dashboard/IssuesTable';
import { dashboardService } from '../services/dashboardService';
import { ChartErrorBoundary } from '../components/ErrorBoundary';
import './DashboardPage.css';

const { Title } = Typography;

interface DashboardData {
    summary: {
        totalItems: number;
        approvedItems: number;
        approvalPercentage: number;
        excludedItems: number;
        itemsWithIssues: number;
    };
    barryIssues: any[];
    systemSummary: any;
    excludedBreakdown: any[];
}

// Dynarex color palette for charts
const COLORS = ['#043168', '#28a745', '#348fe2', '#ffc107', '#dc3545', '#00acac'];

const DashboardPage: React.FC = () => {
    const { message: messageApi } = App.useApp();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [activeTab, setActiveTab] = useState('1');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const data = await dashboardService.getDashboardSummary();
            setDashboardData(data);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            messageApi.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    // Custom label for pie chart
    const renderCustomizedLabel = ({
        cx,
        cy,
        midAngle,
        innerRadius,
        outerRadius,
        percent,
        index,
        value,
        name
    }: any) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="black"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                fontSize="12"
            >
                {`${name}: ${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    const tabItems = [
        {
            key: '1',
            label: 'Barry List Issues',
            children: <IssuesTable type="barry" />,
        },
        {
            key: '2',
            label: 'Excluded Items',
            children: <IssuesTable type="excluded" />,
        },
        {
            key: '3',
            label: 'System Conflicts',
            children: <IssuesTable type="conflicts" />,
        },
    ];

    if (loading) {
        return (
            <div className="page-container" style={{ textAlign: 'center', padding: '100px' }}>
                <Spin size="large" />
            </div>
        );
    }

    // Prepare data for pie chart
    const pieData = dashboardData?.barryIssues?.map(item => ({
        name: item.issue_type,
        value: item.count
    })) || [];

    // Prepare data for bar chart
    const barData = dashboardData?.excludedBreakdown?.map(item => ({
        name: item.Exclusion_Reason,
        value: item.ItemCount
    })) || [];

    return (
        <div className="page-container dashboard-container">
            <Title level={2} style={{ marginBottom: 24 }}>Barry List Quality Dashboard</Title>

            {/* Summary Cards */}
            <DashboardSummaryCards data={dashboardData?.summary} />

            {/* Charts Section */}
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} lg={12}>
                    <Card title="Barry List Issues Distribution" className="dashboard-card">
                        <ChartErrorBoundary>
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={renderCustomizedLabel}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{
                                    height: 300,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#999'
                                }}>
                                    No issue data available
                                </div>
                            )}
                        </ChartErrorBoundary>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Exclusion Reasons" className="dashboard-card">
                        <ChartErrorBoundary>
                            {barData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={barData}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 11 }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                            interval={0}
                                            tickFormatter={(value) => {
                                                // Truncate long text
                                                return value.length > 15 ? value.substring(0, 15) + '...' : value;
                                            }}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(value) => value.toLocaleString()}
                                        />
                                        <Tooltip
                                            formatter={(value: any) => value.toLocaleString()}
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Bar
                                            dataKey="value"
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={60}
                                        >
                                            <LabelList
                                                dataKey="value"
                                                position="top"
                                                formatter={(value: any) => value.toLocaleString()}
                                                style={{ fontSize: 11, fill: '#666' }}
                                            />
                                            {barData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{
                                    height: 300,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#999'
                                }}>
                                    No exclusion data available
                                </div>
                            )}
                        </ChartErrorBoundary>
                    </Card>
                </Col>
            </Row>

            {/* Detailed Tables */}
            <Card style={{ marginTop: 24 }} className="dashboard-card">
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
            </Card>
        </div>
    );
};

export default DashboardPage;