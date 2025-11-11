// src/pages/MeasurementMismatchesPage.tsx
import React, { useEffect, useState } from 'react';
import { Card, Button, Spin, Space, App, Tag, Alert } from 'antd';
import { ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { EnhancedTable, enhancedTableStyles, renderFunctions } from '../config/enhancedTableConfig';
import { API_CONFIG } from '../config/api.config';

interface MismatchRecord {
    item_code: string;
    upc: string;
    measurement_level: number;
    upc_list_level_number: number;
    mismatch_type: string;
    weight: number;
    height: number;
    length: number;
    width: number;
    calculated_volume: number;
    confirmed: string;
}

const MeasurementMismatchesPage: React.FC = () => {
    const { message } = App.useApp();
    const [data, setData] = useState<MismatchRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    useEffect(() => {
        fetchMismatches();
    }, []);

    const fetchMismatches = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_CONFIG.BASE_URL}/measurement-mismatches`);
            if (response.data.success) {
                console.log('Fetched Measurement Mismatches:', response.data.data.length);
                setData(response.data.data);
            } else {
                message.error('Failed to load measurement mismatches');
            }
        } catch (error) {
            console.error('Error fetching measurement mismatches:', error);
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
    const columns: ColumnsType<MismatchRecord> = [
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
            title: 'Measurement Level',
            dataIndex: 'measurement_level',
            key: 'measurement_level',
            width: 140,
            align: 'center',
            sorter: (a, b) => a.measurement_level - b.measurement_level,
        },
        {
            title: 'UPC List Level',
            dataIndex: 'upc_list_level_number',
            key: 'upc_list_level_number',
            width: 130,
            align: 'center',
            sorter: (a, b) => a.upc_list_level_number - b.upc_list_level_number,
        },
        {
            title: 'Mismatch Type',
            dataIndex: 'mismatch_type',
            key: 'mismatch_type',
            width: 200,
            render: (value: string) => <Tag color="orange">{value}</Tag>,
            sorter: (a, b) => (a.mismatch_type || '').localeCompare(b.mismatch_type || ''),
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
    ];

    // Apply active filters
    const filteredData = data.filter((record) => {
        return Object.entries(activeFilters).every(([key, filterValue]) => {
            if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) {
                return true;
            }
            const recordValue = record[key as keyof MismatchRecord];
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
                        <WarningOutlined style={{ color: '#faad14', fontSize: 20 }} />
                        <span style={{ fontSize: 20, fontWeight: 600, color: '#faad14' }}>Product Measurement Mismatches</span>
                        <span style={{ fontSize: 14, color: '#666', fontWeight: 'normal' }}>
                            ({filteredData.length} records)
                        </span>
                    </Space>
                }
                extra={
                    <Space>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchMismatches}
                        >
                            Refresh
                        </Button>
                    </Space>
                }
            >
                {data.length > 0 && (
                    <Alert
                        message={`Found ${filteredData.length} Mismatch${filteredData.length !== 1 ? 'es' : ''}`}
                        description="These records show discrepancies between measurement data and UPC list data."
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-xxl) 0' }}>
                        <Spin size="large" />
                    </div>
                ) : data.length === 0 ? (
                    <Alert
                        message="No Mismatches Found"
                        description="All measurement data matches the UPC list data."
                        type="success"
                        showIcon
                    />
                ) : (
                    <EnhancedTable
                        columns={columns}
                        dataSource={filteredData}
                        rowKey={(record, index) => `${record.item_code}-${record.upc}-${index}`}
                        loading={loading}
                        onFiltersChange={(filters) => {
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
                        scroll={{ x: 1500 }}
                    />
                )}
            </Card>
        </div>
    );
};

export default MeasurementMismatchesPage;
