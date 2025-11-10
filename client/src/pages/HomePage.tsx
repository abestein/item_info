import React, { useEffect, useState } from 'react';
import { Card, Table, message, Spin, Input, Button, Space, Modal, Descriptions, Tag } from 'antd';
import { SearchOutlined, EyeOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { ColumnsType, FilterDropdownProps } from 'antd/es/table';
import type { Key } from 'antd/es/table/interface';
import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
const API_URL = API_CONFIG.BASE_URL;

interface DataRecord {
    [key: string]: any;
}

const HomePage: React.FC = () => {
    const [data, setData] = useState<DataRecord[]>([]);
    const [columns, setColumns] = useState<ColumnsType<DataRecord>>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState<DataRecord | null>(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            console.log('Fetching data from:', `${API_URL}/products`);
            const response = await axios.get(`${API_URL}/products`);

            if (response.data.success && response.data.data.length > 0) {
                const records = response.data.data;
                console.log('Received records:', records.length);

                // Generate columns from the first record with filtering and sorting
                const columnKeys = Object.keys(records[0]);
                const generatedColumns: ColumnsType<DataRecord> = [
                    // Action column for viewing details
                    {
                        title: 'Actions',
                        key: 'actions',
                        width: 80,
                        fixed: 'left',
                        render: (_, record: DataRecord) => (
                            <Button
                                type="primary"
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => showRecordDetails(record)}
                                title="View Details"
                            />
                        ),
                    },
                    ...columnKeys.map(key => ({
                        title: key.replace(/_/g, ' ').toUpperCase(),
                        dataIndex: key,
                        key: key,
                        ellipsis: true,
                        width: key === 'id' ? 60 :
                            key === 'upc' ? 130 :
                                key === 'item_code' ? 100 :
                                    key === 'weight' || key === 'height' || key === 'length' || key === 'width' ? 80 :
                                        key === 'confirmed' ? 90 :
                                            120,

                        // Add sorting for all columns
                        sorter: (a: DataRecord, b: DataRecord) => {
                            const aVal = a[key];
                            const bVal = b[key];

                            // Handle null/undefined values
                            if (aVal === null || aVal === undefined) return 1;
                            if (bVal === null || bVal === undefined) return -1;

                            // Sort numbers
                            if (typeof aVal === 'number' && typeof bVal === 'number') {
                                return aVal - bVal;
                            }

                            // Sort dates
                            if (typeof aVal === 'string' && aVal.match(/^\d{4}-\d{2}-\d{2}T/)) {
                                return new Date(aVal).getTime() - new Date(bVal).getTime();
                            }

                            // Sort strings
                            return String(aVal).localeCompare(String(bVal));
                        },

                        // Add filtering for text and number columns
                        filterDropdown: key === 'confirmed' ? undefined : ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
                            <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
                                <Input
                                    placeholder={`Search ${key}`}
                                    value={selectedKeys[0]}
                                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                                    onPressEnter={() => confirm()}
                                    style={{ marginBottom: 8, display: 'block' }}
                                />
                                <Space>
                                    <Button
                                        type="primary"
                                        onClick={() => confirm()}
                                        icon={<SearchOutlined />}
                                        size="small"
                                        style={{ width: 90 }}
                                    >
                                        Search
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            clearFilters && clearFilters();
                                            confirm();
                                        }}
                                        size="small"
                                        style={{ width: 90 }}
                                    >
                                        Reset
                                    </Button>
                                </Space>
                            </div>
                        ),

                        // Filter icon
                        filterIcon: (filtered: boolean) => (
                            <SearchOutlined style={{ color: filtered ? '#043168' : undefined }} />
                        ),

                        // Filter function
                        onFilter: (value: string | number | boolean | Key, record: DataRecord) => {
                            const recordValue = record[key];
                            if (recordValue === null || recordValue === undefined) return false;
                            return String(recordValue).toLowerCase().includes(String(value).toLowerCase());
                        },

                        // Special handling for confirmed column (boolean filter)
                        ...(key === 'confirmed' && {
                            filters: [
                                { text: 'Confirmed', value: true },
                                { text: 'Not Confirmed', value: false },
                            ],
                            onFilter: (value: string | number | boolean | Key, record: DataRecord) => record[key] === value,
                        }),

                        render: (value: any) => {
                            // Handle null/undefined values
                            if (value === null || value === undefined) {
                                return <span style={{ color: '#999' }}>-</span>;
                            }

                            // Format dates
                            if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
                                return new Date(value).toLocaleDateString();
                            }

                            // Format numbers
                            if (typeof value === 'number') {
                                return value.toLocaleString();
                            }

                            // Format boolean (confirmed column)
                            if (typeof value === 'boolean') {
                                return (
                                    <Tag color={value ? 'success' : 'error'}>
                                        {value ? '? Confirmed' : '? Pending'}
                                    </Tag>
                                );
                            }

                            return value.toString();
                        }
                    }))
                ];

                setColumns(generatedColumns);
                setData(records);
                console.log('Columns generated:', generatedColumns.length);
                console.log('Data set with records:', records.length);
            } else {
                setData([]);
                message.info('No data available');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            console.error('Error details:', error.response?.data || error.message);
            message.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const showRecordDetails = (record: DataRecord) => {
        setSelectedRecord(record);
        setDetailModalVisible(true);
    };

    const formatDetailValue = (key: string, value: any) => {
        // Handle null/undefined values
        if (value === null || value === undefined) {
            return <span style={{ color: '#999', fontStyle: 'italic' }}>No data</span>;
        }

        // Format dates
        if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
            const date = new Date(value);
            return (
                <span>
                    {date.toLocaleDateString()} <br />
                    <small style={{ color: '#666' }}>{date.toLocaleTimeString()}</small>
                </span>
            );
        }

        // Format numbers with units for dimensions
        if (typeof value === 'number') {
            const dimensionFields = ['weight', 'height', 'length', 'width'];
            if (dimensionFields.includes(key)) {
                const unit = key === 'weight' ? 'lbs' : 'in';
                return <strong>{value.toLocaleString()} {unit}</strong>;
            }
            return <strong>{value.toLocaleString()}</strong>;
        }

        // Format boolean
        if (typeof value === 'boolean') {
            return (
                <Tag color={value ? 'success' : 'warning'} style={{ fontSize: '14px' }}>
                    {value ? '? Confirmed' : '? Pending Confirmation'}
                </Tag>
            );
        }

        return <span style={{ fontFamily: 'monospace' }}>{value.toString()}</span>;
    };

    const getRecordTitle = (record: DataRecord) => {
        return `Item Details - ${record.item_code || record.id || 'Unknown'}`;
    };

    return (
        <>
            <Card
                title="Data Overview"
                variant="borderless"
                style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                extra={
                    <Space>
                        <InfoCircleOutlined style={{ color: '#043168' }} />
                        <span style={{ fontSize: '14px', color: '#666' }}>
                            Click ?? to view details � Click headers to sort � Use ?? to filter
                        </span>
                    </Space>
                }
            >
                <Spin spinning={loading}>
                    <Table
                        columns={columns}
                        dataSource={data}
                        rowKey={(record) => record.ID || record.id || Math.random()}
                        scroll={{ x: 'max-content' }}
                        pagination={{
                            pageSize: 20,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} of ${total} items`,
                            pageSizeOptions: ['10', '20', '50', '100'],
                        }}
                        size="middle"
                        bordered
                        style={{ backgroundColor: '#fff' }}
                        onRow={(record) => ({
                            style: { cursor: 'pointer' },
                            onDoubleClick: () => showRecordDetails(record),
                        })}
                    />
                </Spin>
            </Card>

            {/* Detail Modal */}
            <Modal
                title={selectedRecord ? getRecordTitle(selectedRecord) : 'Item Details'}
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailModalVisible(false)}>
                        Close
                    </Button>
                ]}
                width={800}
                styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
            >
                {selectedRecord && (
                    <Descriptions
                        bordered
                        column={2}
                        size="middle"
                        labelStyle={{
                            backgroundColor: '#fafafa',
                            fontWeight: 600,
                            width: '25%'
                        }}
                        contentStyle={{
                            backgroundColor: '#fff',
                            padding: '12px'
                        }}
                    >
                        {Object.entries(selectedRecord).map(([key, value]) => (
                            <Descriptions.Item
                                key={key}
                                label={key.replace(/_/g, ' ').toUpperCase()}
                                span={key === 'upc' || key === 'item_code' ? 2 : 1}
                            >
                                {formatDetailValue(key, value)}
                            </Descriptions.Item>
                        ))}
                    </Descriptions>
                )}

                {selectedRecord && (
                    <Card
                        size="small"
                        title="Quick Summary"
                        style={{ marginTop: 16, backgroundColor: '#f9f9f9' }}
                    >
                        <Space direction="vertical" size="small">
                            <div><strong>Item:</strong> {selectedRecord.item_code || 'N/A'}</div>
                            <div><strong>UPC:</strong> {selectedRecord.upc || 'N/A'}</div>
                            <div><strong>Status:</strong> {formatDetailValue('confirmed', selectedRecord.confirmed)}</div>
                            {selectedRecord.weight && (
                                <div><strong>Dimensions:</strong> {selectedRecord.length}�{selectedRecord.width}�{selectedRecord.height} in, {selectedRecord.weight} lbs</div>
                            )}
                        </Space>
                    </Card>
                )}
            </Modal>
        </>
    );
};

export default HomePage;
