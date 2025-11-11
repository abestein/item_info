// src/pages/ProductMeasurementsPage.tsx
import React, { useEffect, useState } from 'react';
import { Card, Button, Spin, Space, App, Tag } from 'antd';
import { ReloadOutlined, ExpandOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { EnhancedTable, enhancedTableStyles, renderFunctions } from '../config/enhancedTableConfig';
import { API_CONFIG } from '../config/api.config';

interface MeasurementRecord {
    item_code: string;
    upc: string;
    measurement_level: number;
    weight: number;
    height: number;
    length: number;
    width: number;
    calculated_volume: number;
    confirmed: string;
    upc_list_level_name: string;
    IsSellable: boolean;
}

const ProductMeasurementsPage: React.FC = () => {
    const { message } = App.useApp();
    const [data, setData] = useState<MeasurementRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    useEffect(() => {
        fetchMeasurements();
    }, []);

    const fetchMeasurements = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_CONFIG.BASE_URL}/product-measurements`);
            if (response.data.success) {
                console.log('Fetched Product Measurements:', response.data.data.length);
                setData(response.data.data);
            } else {
                message.error('Failed to load product measurements');
            }
        } catch (error) {
            console.error('Error fetching product measurements:', error);
            message.error('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    const formatYesNo = (value: any) => {
        const strValue = String(value).toLowerCase();
        if (strValue === 'yes' || strValue === 'y' || strValue === 'true' || strValue === '1') {
            return <Tag color="#28a745">Yes</Tag>;
        }
        if (strValue === 'no' || strValue === 'n' || strValue === 'false' || strValue === '0') {
            return <Tag color="#dc3545">No</Tag>;
        }
        return <Tag color="#6c757d">N/A</Tag>;
    };

    const formatUPC = (value: any) => {
        if (!value) return <span style={{ color: '#999' }}>N/A</span>;
        return <span style={{ fontFamily: 'Courier New, monospace', fontWeight: 600 }}>{value}</span>;
    };

    const formatDecimal = (value: any) => {
        if (value === null || value === undefined) return <span style={{ color: '#999' }}>N/A</span>;
        return value.toFixed(2);
    };

    // Define columns
    const columns: ColumnsType<MeasurementRecord> = [
        {
            title: 'Item Code',
            dataIndex: 'item_code',
            key: 'item_code',
            width: 150,
            fixed: 'left',
            render: renderFunctions.text,
            sorter: (a, b) => (a.item_code || '').localeCompare(b.item_code || ''),
        },
        {
            title: 'UPC',
            dataIndex: 'upc',
            key: 'upc',
            width: 150,
            render: formatUPC,
            sorter: (a, b) => (a.upc || '').localeCompare(b.upc || ''),
        },
        {
            title: 'Level',
            dataIndex: 'measurement_level',
            key: 'measurement_level',
            width: 100,
            align: 'center',
            sorter: (a, b) => a.measurement_level - b.measurement_level,
        },
        {
            title: 'Weight (lbs)',
            dataIndex: 'weight',
            key: 'weight',
            width: 120,
            align: 'right',
            render: formatDecimal,
            sorter: (a, b) => (a.weight || 0) - (b.weight || 0),
        },
        {
            title: 'Height (in)',
            dataIndex: 'height',
            key: 'height',
            width: 120,
            align: 'right',
            render: formatDecimal,
            sorter: (a, b) => (a.height || 0) - (b.height || 0),
        },
        {
            title: 'Length (in)',
            dataIndex: 'length',
            key: 'length',
            width: 120,
            align: 'right',
            render: formatDecimal,
            sorter: (a, b) => (a.length || 0) - (b.length || 0),
        },
        {
            title: 'Width (in)',
            dataIndex: 'width',
            key: 'width',
            width: 120,
            align: 'right',
            render: formatDecimal,
            sorter: (a, b) => (a.width || 0) - (b.width || 0),
        },
        {
            title: 'Volume (cu in)',
            dataIndex: 'calculated_volume',
            key: 'calculated_volume',
            width: 130,
            align: 'right',
            render: formatDecimal,
            sorter: (a, b) => (a.calculated_volume || 0) - (b.calculated_volume || 0),
        },
        {
            title: 'Confirmed',
            dataIndex: 'confirmed',
            key: 'confirmed',
            width: 120,
            align: 'center',
            render: formatYesNo,
            sorter: (a, b) => (a.confirmed || '').localeCompare(b.confirmed || ''),
        },
        {
            title: 'UPC List Level',
            dataIndex: 'upc_list_level_name',
            key: 'upc_list_level_name',
            width: 150,
            render: renderFunctions.text,
            sorter: (a, b) => (a.upc_list_level_name || '').localeCompare(b.upc_list_level_name || ''),
        },
        {
            title: 'Is Sellable',
            dataIndex: 'IsSellable',
            key: 'IsSellable',
            width: 120,
            align: 'center',
            render: (isSellable: boolean) => (
                isSellable ?
                    <Tag color="#28a745">Yes</Tag> :
                    <Tag color="#6c757d">No</Tag>
            ),
            sorter: (a, b) => (a.IsSellable ? 1 : 0) - (b.IsSellable ? 1 : 0),
        },
    ];

    // Apply active filters
    const filteredData = data.filter((record) => {
        return Object.entries(activeFilters).every(([key, filterValue]) => {
            if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) {
                return true;
            }
            const recordValue = record[key as keyof MeasurementRecord];
            if (Array.isArray(filterValue)) {
                return filterValue.includes(recordValue);
            }
            return String(recordValue).toLowerCase().includes(String(filterValue).toLowerCase());
        });
    });

    return (
        <div className="page-container">
            <Card
                title={
                    <Space>
                        <ExpandOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                        <span style={{ fontSize: 20, fontWeight: 600 }}>Product Measurements with UPC Data</span>
                        <span style={{ fontSize: 14, color: '#666', fontWeight: 'normal' }}>
                            ({filteredData.length} records)
                        </span>
                    </Space>
                }
                extra={
                    <Space>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchMeasurements}
                        >
                            Refresh
                        </Button>
                    </Space>
                }
            >
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-xxl) 0' }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <EnhancedTable
                        columns={columns}
                        dataSource={filteredData}
                        rowKey={(record, index) => `${record.item_code}-${record.upc}-${index}`}
                        loading={loading}
                        onFilterChange={(filters) => {
                            console.log('Filters changed:', filters);
                            setActiveFilters(filters);
                        }}
                        pagination={{
                            current: currentPage,
                            pageSize: pageSize,
                            total: filteredData.length,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                            onChange: (page, newPageSize) => {
                                setCurrentPage(page);
                                if (newPageSize) setPageSize(newPageSize);
                            },
                        }}
                        scroll={{ x: 1400 }}
                    />
                )}
            </Card>
        </div>
    );
};

export default ProductMeasurementsPage;
