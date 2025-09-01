// src/pages/ItemsNewPage.tsx
import React, { useEffect, useState } from 'react';
import { Card, Button, message, Spin, Space } from 'antd';
import { UploadOutlined, ReloadOutlined, FilterOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { EnhancedTable, enhancedTableStyles, renderFunctions } from '../config/enhancedTableConfig';

import { API_CONFIG } from '../config/api.config';

interface ItemRecord {
    ID: number;
    'Item #': string;
    'Vendor Name': string;
    'Brand Name': string;
    'Description1': string;
    'FOB Cost': number;
    'Current Duty': number;
    'Current Tariff': number;
    'Last PO Date': string;
    [key: string]: any;
}

const ItemsNewPage: React.FC = () => {
    const [data, setData] = useState<ItemRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const navigate = useNavigate();

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_CONFIG.BASE_URL}/items`);
            if (response.data.success) {
                console.log('Fetched items:', response.data.data.length);
                setData(response.data.data);
            } else {
                message.error('Failed to load items');
            }
        } catch (error) {
            console.error('Error fetching items:', error);
            message.error('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    // Define columns
    const columns: ColumnsType<ItemRecord> = [
        {
            title: 'ID',
            dataIndex: 'ID',
            key: 'ID',
            width: 80,
            fixed: 'left',
            sorter: (a, b) => a.ID - b.ID,
        },
        {
            title: 'Item #',
            dataIndex: 'Item #',
            key: 'Item #',
            width: 120,
            render: renderFunctions.text,
            sorter: (a, b) => (a['Item #'] || '').localeCompare(b['Item #'] || ''),
        },
        {
            title: 'Vendor',
            dataIndex: 'Vendor Name',
            key: 'Vendor Name',
            width: 150,
            ellipsis: true,
            render: renderFunctions.text,
            sorter: (a, b) => (a['Vendor Name'] || '').localeCompare(b['Vendor Name'] || ''),
        },
        {
            title: 'Brand',
            dataIndex: 'Brand Name',
            key: 'Brand Name',
            width: 120,
            render: renderFunctions.text,
            sorter: (a, b) => (a['Brand Name'] || '').localeCompare(b['Brand Name'] || ''),
        },
        {
            title: 'Description',
            dataIndex: 'Description1',
            key: 'Description1',
            width: 300,
            ellipsis: true,
            render: renderFunctions.text,
        },
        {
            title: 'FOB Cost',
            dataIndex: 'FOB Cost',
            key: 'FOB Cost',
            width: 120,
            align: 'right',
            className: 'numeric-column',
            render: renderFunctions.currency,
            sorter: (a, b) => (a['FOB Cost'] || 0) - (b['FOB Cost'] || 0),
        },
        {
            title: 'Duty',
            dataIndex: 'Current Duty',
            key: 'Current Duty',
            width: 100,
            align: 'right',
            className: 'numeric-column',
            render: renderFunctions.percentage,
            sorter: (a, b) => (a['Current Duty'] || 0) - (b['Current Duty'] || 0),
        },
        {
            title: 'Tariff',
            dataIndex: 'Current Tariff',
            key: 'Current Tariff',
            width: 100,
            align: 'right',
            className: 'numeric-column',
            render: renderFunctions.percentage,
            sorter: (a, b) => (a['Current Tariff'] || 0) - (b['Current Tariff'] || 0),
        },
        {
            title: 'Last PO',
            dataIndex: 'Last PO Date',
            key: 'Last PO Date',
            width: 120,
            render: renderFunctions.date,
            sorter: (a, b) => {
                const dateA = a['Last PO Date'] ? new Date(a['Last PO Date']).getTime() : 0;
                const dateB = b['Last PO Date'] ? new Date(b['Last PO Date']).getTime() : 0;
                return dateA - dateB;
            },
        },
    ];

    // Filter configuration
    const filterConfig = {
        'ID': { type: 'number' as const },
        'Item #': { type: 'text' as const },
        'Vendor Name': { type: 'text' as const },
        'Brand Name': { type: 'text' as const },
        'Description1': { type: 'text' as const },
        'FOB Cost': { type: 'number' as const },
        'Current Duty': { type: 'number' as const },
        'Current Tariff': { type: 'number' as const },
        'Last PO Date': { type: 'date' as const },
    };

    // Count active filters
    const activeFilterCount = Object.values(activeFilters).filter(
        value => value && (Array.isArray(value) ? value.some(v => v) : true)
    ).length;

    return (
        <div className="page-container" style={{ padding: 24 }}>
            <Card
                title={
                    <Space>
                        <span>Enhanced Items Table</span>
                        {activeFilterCount > 0 && (
                            <span style={{
                                color: '#1890ff',
                                fontSize: 14,
                                fontWeight: 'normal'
                            }}>
                                <FilterOutlined /> {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                            </span>
                        )}
                    </Space>
                }
                extra={
                    <Space>
                        <Button
                            onClick={() => navigate('/items')}
                        >
                            View Original Table
                        </Button>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchItems}
                            loading={loading}
                        >
                            Refresh
                        </Button>
                        <Button
                            type="primary"
                            icon={<UploadOutlined />}
                            onClick={() => navigate('/upload')}
                        >
                            Upload New Data
                        </Button>
                    </Space>
                }
                style={{ marginBottom: 0 }}
            >
                <div style={{ marginBottom: 16 }}>
                    <p style={{ color: '#666', margin: 0 }}>
                        This table features inline filters below each column header with AND/OR logic support.
                    </p>
                    <ul style={{ color: '#666', marginTop: 8, paddingLeft: 20 }}>
                        <li>Use the filter mode selector to switch between AND (all filters) or OR (any filter)</li>
                        <li>In text fields, use pipe (|) for OR search: "ABC | XYZ" finds rows containing either term</li>
                        <li>Number and date filters can use single values (min OR max)</li>
                    </ul>
                </div>

                <Spin spinning={loading}>
                    {data.length > 0 ? (
                        <EnhancedTable
                            {...enhancedTableStyles.default}
                            columns={columns}
                            dataSource={data}
                            rowKey="ID"
                            scroll={{ x: 1300 }}
                            filterConfig={filterConfig}
                            onFiltersChange={(filters) => {
                                setActiveFilters(filters);
                                // Debug logging
                                console.log('Active filters:', filters);
                                console.log('Filter mode:', 'AND'); // You'll need to track this if using the mode
                            }}
                        />
                    ) : (
                        !loading && (
                            <div style={{ textAlign: 'center', padding: 40 }}>
                                <p style={{ fontSize: 16, marginBottom: 20, color: '#8c8c8c' }}>
                                    No items found in the database.
                                </p>
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<UploadOutlined />}
                                    onClick={() => navigate('/upload')}
                                >
                                    Upload Excel File
                                </Button>
                            </div>
                        )
                    )}
                </Spin>
            </Card>
        </div>
    );
};

export default ItemsNewPage;