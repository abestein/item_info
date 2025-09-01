import React, { useState, useEffect } from 'react';
import {
    Table,
    Input,
    Select,
    Space,
    Button,
    Tag,
    Tooltip,
    Modal,
    Descriptions,
    Spin,
    App
} from 'antd';
import {
    SearchOutlined,
    DownloadOutlined,
    EyeOutlined,
    ClearOutlined
} from '@ant-design/icons';
import { dashboardService } from '../../services/dashboardService';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

interface IssuesTableProps {
    type: 'barry' | 'excluded' | 'conflicts';
}

interface FilterState {
    searchTerm: string;
    issueType: string;
    exclusionReason: string;
    system: string;
}

const IssuesTable: React.FC<IssuesTableProps> = ({ type }) => {
    const { message } = App.useApp();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 25,
        total: 0,
    });
    const [filters, setFilters] = useState<FilterState>({
        searchTerm: '',
        issueType: '',
        exclusionReason: '',
        system: '',
    });
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);

    useEffect(() => {
        loadData();
    }, [type, pagination.current, pagination.pageSize, filters]);

    const loadData = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.current,
                pageSize: pagination.pageSize,
                ...filters,
            };

            let result;
            switch (type) {
                case 'barry':
                    result = await dashboardService.getBarryListIssues(params);
                    break;
                case 'excluded':
                    result = await dashboardService.getExcludedItems(params);
                    break;
                case 'conflicts':
                    result = await dashboardService.getSystemConflicts(params);
                    break;
            }

            setData(result.data || []);
            setPagination(prev => ({
                ...prev,
                total: result.totalCount || 0,
            }));
        } catch (error) {
            console.error('Error loading table data:', error);
            message.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleTableChange = (newPagination: any) => {
        setPagination(newPagination);
    };

    const handleFilterChange = (field: keyof FilterState, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const handleClearFilters = () => {
        setFilters({
            searchTerm: '',
            issueType: '',
            exclusionReason: '',
            system: '',
        });
    };

    const handleExport = async () => {
        try {
            const blob = await dashboardService.exportTableData(type, filters);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}-issues-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            message.success('Export successful');
        } catch (error) {
            console.error('Export failed:', error);
            message.error('Export failed');
        }
    };

    const showDetail = (record: any) => {
        setSelectedItem(record);
        setDetailModalVisible(true);
    };

    const getIssueTag = (record: any) => {
        const tags = [];

        if (type === 'barry') {
            if (record.duplicate_type_1) {
                tags.push(<Tag color="error" key="dup1">Duplicate (Same Item)</Tag>);
            }
            if (record.duplicate_type_2) {
                tags.push(<Tag color="error" key="dup2">Duplicate (Cross Items)</Tag>);
            }
            if (record.length_issue) {
                tags.push(<Tag color="warning" key="length">UPC {record.length_issue}</Tag>);
            }
            if (record.sellable_issue) {
                tags.push(<Tag color="warning" key="sellable">No Sellable</Tag>);
            }
        }

        return <Space size="small">{tags}</Space>;
    };

    const barryColumns: ColumnsType<any> = [
        {
            title: 'Item Code',
            dataIndex: 'ItemCode',
            key: 'ItemCode',
            width: 120,
        },
        {
            title: 'Level',
            dataIndex: 'Level',
            key: 'Level',
            width: 80,
        },
        {
            title: 'UPC',
            dataIndex: 'UPC',
            key: 'UPC',
            width: 150,
            render: (text, record) => (
                <Space direction="vertical" size="small">
                    <code>{text}</code>
                    {record.upc_length && (
                        <span style={{ color: '#ff4d4f', fontSize: '12px' }}>
                            {record.upc_length} digits
                        </span>
                    )}
                </Space>
            ),
        },
        {
            title: 'Issues',
            key: 'issues',
            width: 300,
            render: (_, record) => getIssueTag(record),
        },
        {
            title: 'Sellable',
            dataIndex: 'IsSellable',
            key: 'IsSellable',
            width: 90,
            render: (value) => (
                <Tag color={value ? 'success' : 'default'}>
                    {value ? 'Yes' : 'No'}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 80,
            align: 'center',
            render: (_, record) => (
                <Tooltip title="View Details">
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => showDetail(record)}
                    />
                </Tooltip>
            ),
        },
    ];

    const excludedColumns: ColumnsType<any> = [
        {
            title: 'SKU',
            dataIndex: 'SKU',
            key: 'SKU',
            width: 120,
        },
        {
            title: 'Level',
            dataIndex: 'Level',
            key: 'Level',
            width: 80,
        },
        {
            title: 'UPC',
            dataIndex: 'UPC',
            key: 'UPC',
            width: 150,
            render: (text) => <code>{text}</code>,
        },
        {
            title: 'Exclusion Reason',
            dataIndex: 'Exclusion_Reason',
            key: 'Exclusion_Reason',
            width: 250,
            ellipsis: true,
        },
        {
            title: 'Match Count',
            dataIndex: 'Match_Count',
            key: 'Match_Count',
            width: 100,
            align: 'center',
            render: (value) => (
                <Tag color={value >= 2 ? 'success' : 'warning'}>
                    {value}
                </Tag>
            ),
        },
        {
            title: 'Unmatched Systems',
            key: 'unmatchedSystems',
            width: 200,
            render: (_, record) => (
                <Space size="small" wrap>
                    {record.Has_Unmatched_Mantis_UPCs === 'Yes' && <Tag color="error">Mantis</Tag>}
                    {record.Has_Unmatched_NPD_UPCs === 'Yes' && <Tag color="error">NPD</Tag>}
                    {record.Has_Unmatched_X3_UPCs === 'Yes' && <Tag color="error">X3</Tag>}
                    {record.Has_Unmatched_Salsify_UPCs === 'Yes' && <Tag color="error">Salsify</Tag>}
                    {record.Has_Unmatched_Joannss_UPCs === 'Yes' && <Tag color="error">Joannss</Tag>}
                </Space>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 80,
            align: 'center',
            render: (_, record) => (
                <Tooltip title="View Details">
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => showDetail(record)}
                    />
                </Tooltip>
            ),
        },
    ];

    const columns = type === 'barry' ? barryColumns : excludedColumns;

    // Generate a unique key for each record without using the index
    const generateRowKey = (record: any) => {
        // Create a unique key by combining multiple fields
        const itemIdentifier = record.ItemCode || record.SKU || '';
        const level = record.Level || '';
        const upc = record.UPC || '';

        // If we have a timestamp or unique ID in the record, use it
        if (record.id) return record.id;
        if (record._id) return record._id;
        if (record.uuid) return record.uuid;

        // Add additional fields to ensure uniqueness
        const levelNumber = record.LevelNumber || '';
        const isSellable = record.IsSellable !== undefined ? record.IsSellable.toString() : '';
        const matchCount = record.Match_Count || '';

        // Create a more unique composite key including timestamp
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);

        // Combine all available fields for uniqueness
        const baseKey = `${itemIdentifier}-${level}-${levelNumber}-${upc}-${isSellable}-${matchCount}`;

        // Return a unique key with timestamp and random component
        return `${baseKey}-${timestamp}-${random}`;
    };

    return (
        <>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {/* Filters */}
                <Space wrap>
                    <Input
                        placeholder="Search Item Code or UPC"
                        prefix={<SearchOutlined />}
                        value={filters.searchTerm}
                        onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                        style={{ width: 250 }}
                    />

                    {type === 'barry' && (
                        <Select
                            placeholder="Issue Type"
                            value={filters.issueType}
                            onChange={(value) => handleFilterChange('issueType', value)}
                            style={{ width: 200 }}
                            allowClear
                        >
                            <Option value="">All</Option>
                            <Option value="duplicate_same">Duplicate (Same Item)</Option>
                            <Option value="duplicate_cross">Duplicate (Cross Items)</Option>
                            <Option value="length_short">UPC Too Short</Option>
                            <Option value="length_long">UPC Too Long</Option>
                            <Option value="missing_sellable">Missing Sellable</Option>
                        </Select>
                    )}

                    {type === 'excluded' && (
                        <>
                            <Select
                                placeholder="Exclusion Reason"
                                value={filters.exclusionReason}
                                onChange={(value) => handleFilterChange('exclusionReason', value)}
                                style={{ width: 200 }}
                                allowClear
                            >
                                <Option value="">All</Option>
                                <Option value="insufficient">Insufficient Matches</Option>
                                <Option value="conflicts">UPC Conflicts</Option>
                            </Select>

                            <Select
                                placeholder="System"
                                value={filters.system}
                                onChange={(value) => handleFilterChange('system', value)}
                                style={{ width: 150 }}
                                allowClear
                            >
                                <Option value="">All</Option>
                                <Option value="Mantis">Mantis</Option>
                                <Option value="NPD">NPD</Option>
                                <Option value="X3">X3</Option>
                                <Option value="Salsify">Salsify</Option>
                                <Option value="Joannss">Joannss</Option>
                            </Select>
                        </>
                    )}

                    <Button icon={<ClearOutlined />} onClick={handleClearFilters}>
                        Clear
                    </Button>

                    <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
                        Export
                    </Button>
                </Space>

                {/* Table */}
                <Table
                    columns={columns}
                    dataSource={data}
                    loading={loading}
                    pagination={pagination}
                    onChange={handleTableChange}
                    rowKey={generateRowKey}
                    scroll={{ x: 1200 }}
                    size="small"
                />
            </Space>

            {/* Detail Modal */}
            <Modal
                title={`Details - ${selectedItem?.ItemCode || selectedItem?.SKU}`}
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailModalVisible(false)}>
                        Close
                    </Button>,
                ]}
                width={600}
            >
                {selectedItem && (
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Item Code">
                            {selectedItem.ItemCode || selectedItem.SKU}
                        </Descriptions.Item>
                        <Descriptions.Item label="Level">
                            {selectedItem.Level}
                        </Descriptions.Item>
                        <Descriptions.Item label="UPC">
                            <code>{selectedItem.UPC}</code>
                        </Descriptions.Item>
                        {type === 'barry' && (
                            <>
                                <Descriptions.Item label="Level Number">
                                    {selectedItem.LevelNumber}
                                </Descriptions.Item>
                                <Descriptions.Item label="Is Sellable">
                                    {selectedItem.IsSellable ? 'Yes' : 'No'}
                                </Descriptions.Item>
                                {selectedItem.cross_duplicate_items && (
                                    <Descriptions.Item label="Duplicate With">
                                        {selectedItem.cross_duplicate_items}
                                    </Descriptions.Item>
                                )}
                                {selectedItem.upc_length && (
                                    <Descriptions.Item label="UPC Length">
                                        {selectedItem.upc_length} digits
                                    </Descriptions.Item>
                                )}
                            </>
                        )}
                        {type === 'excluded' && (
                            <>
                                <Descriptions.Item label="Exclusion Reason">
                                    {selectedItem.Exclusion_Reason}
                                </Descriptions.Item>
                                <Descriptions.Item label="Match Count">
                                    {selectedItem.Match_Count}
                                </Descriptions.Item>
                            </>
                        )}
                    </Descriptions>
                )}
            </Modal>
        </>
    );
};

export default IssuesTable;