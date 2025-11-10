// src/pages/ItemsNewPage.tsx
import React, { useEffect, useState } from 'react';
import { Card, Button, Spin, Space, App } from 'antd';
import { ReloadOutlined, FilterOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { EnhancedTable, enhancedTableStyles, renderFunctions } from '../config/enhancedTableConfig';

import { API_CONFIG } from '../config/api.config';

interface ItemRecord {
    id: number;
    brand_name: string;
    item: string;
    description1: string;
    description2: string;
    description3: string;
    upc_inner_2: number;
    upc_inner_1: number;
    upc_sellable: number;
    hcpc_code: string;
    product_type: string;
    sterile: string;
    exp_date: string;
    created_date: string;
    [key: string]: any;
}

const ItemsNewPage: React.FC = () => {
    const { message } = App.useApp();
    const [data, setData] = useState<ItemRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const navigate = useNavigate();

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_CONFIG.BASE_URL}/data-team-items`);
            if (response.data.success) {
                console.log('Fetched data team items:', response.data.data.length);
                setData(response.data.data);
            } else {
                message.error('Failed to load data team items');
            }
        } catch (error) {
            console.error('Error fetching data team items:', error);
            message.error('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    // Define columns
    const columns: ColumnsType<ItemRecord> = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            fixed: 'left',
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: 'Item #',
            dataIndex: 'item',
            key: 'item',
            width: 120,
            render: (text: string, record: ItemRecord) => (
                <a
                    onClick={() => navigate(`/item-detail/${record.id}`)}
                    style={{ color: '#043168', cursor: 'pointer' }}
                >
                    {text || 'N/A'}
                </a>
            ),
            sorter: (a, b) => (a.item || '').localeCompare(b.item || ''),
        },
        {
            title: 'Brand',
            dataIndex: 'brand_name',
            key: 'brand_name',
            width: 150,
            ellipsis: true,
            render: renderFunctions.text,
            sorter: (a, b) => (a.brand_name || '').localeCompare(b.brand_name || ''),
        },
        {
            title: 'Description',
            dataIndex: 'description1',
            key: 'description1',
            width: 250,
            ellipsis: true,
            render: renderFunctions.text,
        },
        {
            title: 'Description 2',
            dataIndex: 'description2',
            key: 'description2',
            width: 200,
            ellipsis: true,
            render: renderFunctions.text,
        },
        {
            title: 'UPC Inner-2',
            dataIndex: 'upc_inner_2',
            key: 'upc_inner_2',
            width: 130,
            render: renderFunctions.text,
            sorter: (a, b) => (a.upc_inner_2 || 0) - (b.upc_inner_2 || 0),
        },
        {
            title: 'UPC Inner-1',
            dataIndex: 'upc_inner_1',
            key: 'upc_inner_1',
            width: 130,
            render: renderFunctions.text,
            sorter: (a, b) => (a.upc_inner_1 || 0) - (b.upc_inner_1 || 0),
        },
        {
            title: 'UPC Sellable',
            dataIndex: 'upc_sellable',
            key: 'upc_sellable',
            width: 130,
            render: renderFunctions.text,
            sorter: (a, b) => (a.upc_sellable || 0) - (b.upc_sellable || 0),
        },
        {
            title: 'HCPC Code',
            dataIndex: 'hcpc_code',
            key: 'hcpc_code',
            width: 120,
            render: renderFunctions.text,
        },
        {
            title: 'Product Type',
            dataIndex: 'product_type',
            key: 'product_type',
            width: 120,
            render: renderFunctions.text,
        },
        {
            title: 'Sterile',
            dataIndex: 'sterile',
            key: 'sterile',
            width: 100,
            render: renderFunctions.text,
        },
        {
            title: 'Created Date',
            dataIndex: 'created_date',
            key: 'created_date',
            width: 120,
            render: renderFunctions.date,
            sorter: (a, b) => {
                const dateA = a.created_date ? new Date(a.created_date).getTime() : 0;
                const dateB = b.created_date ? new Date(b.created_date).getTime() : 0;
                return dateA - dateB;
            },
        },
    ];

    // Filter configuration
    const filterConfig = {
        'id': { type: 'number' as const },
        'item': { type: 'text' as const },
        'brand_name': { type: 'text' as const },
        'description1': { type: 'text' as const },
        'description2': { type: 'text' as const },
        'upc_inner_2': { type: 'number' as const },
        'upc_inner_1': { type: 'number' as const },
        'upc_sellable': { type: 'number' as const },
        'hcpc_code': { type: 'text' as const },
        'product_type': { type: 'text' as const },
        'sterile': { type: 'text' as const },
        'created_date': { type: 'date' as const },
    };

    // Count active filters
    const activeFilterCount = Object.values(activeFilters).filter(
        value => value && (Array.isArray(value) ? value.some(v => v) : true)
    ).length;

    return (
        <div className="page-container">
            <Card
                title={
                    <Space>
                        <span>Data Team Active Items</span>
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
                            icon={<ReloadOutlined />}
                            onClick={fetchItems}
                            loading={loading}
                        >
                            Refresh
                        </Button>
                        <Button
                            type="primary"
                            icon={<SettingOutlined />}
                            onClick={() => navigate('/items-new-operations')}
                        >
                            Manage Operations
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
                            bordered={true}
                            size="middle"
                            columns={columns}
                            dataSource={data}
                            rowKey="id"
                            scroll={{ x: 1800 }}
                            filterConfig={filterConfig}
                            pagination={{
                                current: currentPage,
                                pageSize: pageSize,
                                showSizeChanger: true,
                                showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} of ${total} items`,
                                pageSizeOptions: ['10', '20', '50', '100'],
                                showQuickJumper: true,
                                onChange: (page: number, newPageSize: number) => {
                                    console.log('Page changed:', page, 'PageSize:', newPageSize);
                                    setCurrentPage(page);
                                    if (newPageSize !== pageSize) {
                                        setPageSize(newPageSize);
                                        setCurrentPage(1); // Reset to first page when page size changes
                                    }
                                },
                                onShowSizeChange: (current: number, size: number) => {
                                    console.log('Size changed:', size);
                                    setPageSize(size);
                                    setCurrentPage(1);
                                },
                            }}
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
                            </div>
                        )
                    )}
                </Spin>
            </Card>
        </div>
    );
};

export default ItemsNewPage;
