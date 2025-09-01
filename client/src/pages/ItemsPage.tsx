// src/pages/ItemsPage.tsx
import React, { useEffect, useState } from 'react';
import { Card, Table, Button, message, Spin, Space } from 'antd';
import { UploadOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { tableStyles, enhanceColumns, renderFunctions } from '../config/tableConfig';

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

const ItemsPage: React.FC = () => {
    const [data, setData] = useState<ItemRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_CONFIG.BASE_URL}/items`);

            if (response.data.success) {
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

    // Define base columns
    const baseColumns: ColumnsType<ItemRecord> = [
        {
            title: 'ID',
            dataIndex: 'ID',
            key: 'ID',
            width: 80,
            fixed: 'left',
        },
        {
            title: 'Item #',
            dataIndex: 'Item #',
            key: 'Item #',
            width: 120,
            render: renderFunctions.text,
        },
        {
            title: 'Vendor',
            dataIndex: 'Vendor Name',
            key: 'Vendor Name',
            width: 150,
            ellipsis: true,
            render: renderFunctions.text,
        },
        {
            title: 'Brand',
            dataIndex: 'Brand Name',
            key: 'Brand Name',
            width: 120,
            render: renderFunctions.text,
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
        },
        {
            title: 'Duty',
            dataIndex: 'Current Duty',
            key: 'Current Duty',
            width: 100,
            align: 'right',
            className: 'numeric-column',
            render: renderFunctions.percentage,
        },
        {
            title: 'Tariff',
            dataIndex: 'Current Tariff',
            key: 'Current Tariff',
            width: 100,
            align: 'right',
            className: 'numeric-column',
            render: renderFunctions.percentage,
        },
        {
            title: 'Last PO',
            dataIndex: 'Last PO Date',
            key: 'Last PO Date',
            width: 120,
            render: renderFunctions.date,
        },
    ];

    // Enhance columns with filters and sorting
    const columns = enhanceColumns<ItemRecord>(baseColumns, {
        'Item #': { type: 'text', sortable: true },
        'Vendor Name': { type: 'text', sortable: true },
        'Brand Name': { type: 'text', sortable: true },
        'Description1': { type: 'text', sortable: true },
        'FOB Cost': { type: 'number', sortable: true },
        'Current Duty': { type: 'number', sortable: true },
        'Current Tariff': { type: 'number', sortable: true },
        'Last PO Date': { type: 'date', sortable: true },
    });

    return (
        <div className="page-container" style={{ padding: 24 }}>
            <Card
                title="Item Details - Recent Entries"
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
                            icon={<UploadOutlined />}
                            onClick={() => navigate('/upload')}
                        >
                            Upload New Data
                        </Button>
                    </Space>
                }
            >
                <Spin spinning={loading}>
                    {data.length > 0 ? (
                        <Table
                            {...tableStyles.default}
                            columns={columns}
                            dataSource={data}
                            rowKey="ID"
                            scroll={{ x: 1300 }}
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

export default ItemsPage;