// src/pages/UPCListPage.tsx
import React, { useEffect, useState } from 'react';
import { Card, Button, Spin, Space, App, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { EnhancedTable, enhancedTableStyles, renderFunctions } from '../config/enhancedTableConfig';

import { API_CONFIG } from '../config/api.config';

interface UPCRecord {
    ID: number;
    ItemCode: string;
    Level: string;
    UPC: string;
    LevelNumber: number;
    IsSellable: boolean;
}

const UPCListPage: React.FC = () => {
    const { message } = App.useApp();
    const [data, setData] = useState<UPCRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    useEffect(() => {
        fetchUPCList();
    }, []);

    const fetchUPCList = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_CONFIG.BASE_URL}/upc-list`);
            if (response.data.success) {
                console.log('Fetched UPC List:', response.data.data.length);
                setData(response.data.data);
            } else {
                message.error('Failed to load UPC List');
            }
        } catch (error) {
            console.error('Error fetching UPC List:', error);
            message.error('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    // Define columns
    const columns: ColumnsType<UPCRecord> = [
        {
            title: 'ID',
            dataIndex: 'ID',
            key: 'ID',
            width: 80,
            fixed: 'left',
            sorter: (a, b) => a.ID - b.ID,
        },
        {
            title: 'Item Code',
            dataIndex: 'ItemCode',
            key: 'ItemCode',
            width: 150,
            fixed: 'left',
            render: renderFunctions.text,
            sorter: (a, b) => (a.ItemCode || '').localeCompare(b.ItemCode || ''),
        },
        {
            title: 'Level',
            dataIndex: 'Level',
            key: 'Level',
            width: 120,
            render: (level: string) => {
                const colorMap: Record<string, string> = {
                    'Ship-2': '#6c757d',
                    'Ship-1': '#043168',
                    'Sellable': '#28a745',
                    'Inner-1': '#ffc107',
                    'Inner-2': '#dc3545'
                };
                return <Tag color={colorMap[level] || '#043168'}>{level}</Tag>;
            },
            sorter: (a, b) => (a.Level || '').localeCompare(b.Level || ''),
        },
        {
            title: 'UPC',
            dataIndex: 'UPC',
            key: 'UPC',
            width: 150,
            render: renderFunctions.text,
            sorter: (a, b) => (a.UPC || '').localeCompare(b.UPC || ''),
        },
        {
            title: 'Level Number',
            dataIndex: 'LevelNumber',
            key: 'LevelNumber',
            width: 120,
            align: 'center',
            sorter: (a, b) => a.LevelNumber - b.LevelNumber,
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
            const recordValue = record[key as keyof UPCRecord];
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
                        <span style={{ fontSize: 20, fontWeight: 600 }}>UPC List</span>
                        <span style={{ fontSize: 14, color: '#666', fontWeight: 'normal' }}>
                            ({filteredData.length} records)
                        </span>
                    </Space>
                }
                extra={
                    <Space>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchUPCList}
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
                        rowKey="ID"
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
                        scroll={{ x: 1000 }}
                    />
                )}
            </Card>
        </div>
    );
};

export default UPCListPage;
