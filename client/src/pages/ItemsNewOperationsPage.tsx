// src/pages/ItemsNewOperationsPage.tsx
import React, { useState } from 'react';
import { Card, Button, Space, App, Modal, Table, Tag, Tooltip } from 'antd';
import { UploadOutlined, DeleteOutlined, DiffOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';

import { API_CONFIG } from '../config/api.config';

interface ComparisonRecord {
    change_type: string;
    id: number;
    item_code: string;
    brand_name: string;
    description1: string;
    field_name: string;
    current_value: string;
    new_value: string;
}

const ItemsNewOperationsPage: React.FC = () => {
    const { modal, message } = App.useApp();
    const [differencesModalVisible, setDifferencesModalVisible] = useState(false);
    const [differences, setDifferences] = useState<ComparisonRecord[]>([]);
    const [loadingDifferences, setLoadingDifferences] = useState(false);
    const [selectedChanges, setSelectedChanges] = useState<string[]>([]);
    const [modalCurrentPage, setModalCurrentPage] = useState(1);
    const [modalPageSize, setModalPageSize] = useState(20);
    const navigate = useNavigate();

    const clearTempTable = async () => {
        modal.confirm({
            title: 'Clear Temp Table?',
            content: 'This will delete all data from the temporary table. This action cannot be undone.',
            okText: 'Yes, Clear Table',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    const response = await axios.post(`${API_CONFIG.BASE_URL}/clear-data-team-temp`);
                    if (response.data.success) {
                        message.success('Temp table cleared successfully');
                        // Close differences modal if open
                        if (differencesModalVisible) {
                            setDifferencesModalVisible(false);
                            setDifferences([]);
                            setSelectedChanges([]);
                        }
                    } else {
                        message.error('Failed to clear temp table');
                    }
                } catch (error: any) {
                    console.error('Error clearing temp table:', error);
                    message.error(error.response?.data?.error || 'Failed to clear temp table');
                }
            }
        });
    };

    const refreshUPCList = async () => {
        modal.confirm({
            title: 'Refresh UPC List?',
            content: 'This will refresh the UPC List table by extracting all UPC data from the main data table.',
            okText: 'Yes, Refresh',
            okType: 'primary',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    message.loading({ content: 'Refreshing UPC List...', key: 'refresh-upc' });
                    const response = await axios.post(`${API_CONFIG.BASE_URL}/refresh-upc-list`);
                    if (response.data.success) {
                        message.success({
                            content: `UPC List refreshed successfully! ${response.data.rowsInserted} records inserted.`,
                            key: 'refresh-upc',
                            duration: 3
                        });
                    } else {
                        message.error({ content: 'Failed to refresh UPC list', key: 'refresh-upc' });
                    }
                } catch (error: any) {
                    console.error('Error refreshing UPC list:', error);
                    message.error({
                        content: error.response?.data?.error || 'Failed to refresh UPC list',
                        key: 'refresh-upc'
                    });
                }
            }
        });
    };

    const viewDifferences = async () => {
        setLoadingDifferences(true);
        setDifferencesModalVisible(true);
        try {
            const response = await axios.get(`${API_CONFIG.BASE_URL}/compare-data-team`);
            if (response.data.success) {
                setDifferences(response.data.differences);
                if (response.data.differences.length === 0) {
                    message.info('No differences found between temp and main tables');
                } else {
                    message.success(`Found ${response.data.differences.length} differences`);
                }
            } else {
                message.error('Failed to fetch comparison data');
            }
        } catch (error: any) {
            console.error('Comparison error:', error);
            message.error(error.response?.data?.error || 'Failed to compare data');
        } finally {
            setLoadingDifferences(false);
        }
    };

    const applyChanges = async (applyAll: boolean = false) => {
        const changesToApply = applyAll
            ? differences.map(record => `${record.change_type}|||${record.item_code}|||${record.field_name}`)
            : selectedChanges;

        if (changesToApply.length === 0) {
            message.warning('Please select changes to apply');
            return;
        }

        // Show confirmation
        modal.confirm({
            title: applyAll ? 'Apply All Changes?' : 'Apply Selected Changes?',
            content: `This will apply ${changesToApply.length} change(s) to the main table. Are you sure you want to proceed?`,
            okText: 'Yes, Apply',
            okType: 'primary',
            cancelText: 'Cancel',
            onOk: async () => {
                await performApplyChanges(changesToApply);
            }
        });
    };

    const performApplyChanges = async (changeIds: string[]) => {
        setLoadingDifferences(true);
        try {
            const response = await axios.post(
                `${API_CONFIG.BASE_URL}/apply-data-team-changes`,
                { changeIds }
            );

            if (response.data.success) {
                message.success(`Successfully applied ${response.data.appliedCount} changes`);
                setSelectedChanges([]);
                setDifferencesModalVisible(false);
                setDifferences([]);
            } else {
                message.error('Failed to apply changes');
            }
        } catch (error: any) {
            console.error('Apply changes error:', error);
            message.error(error.response?.data?.error || 'Failed to apply changes');
        } finally {
            setLoadingDifferences(false);
        }
    };

    // Comparison columns for differences modal
    const comparisonColumns = [
        {
            title: 'Change Type',
            dataIndex: 'change_type',
            key: 'change_type',
            width: 120,
            fixed: 'left' as const,
            render: (type: string) => {
                const colorMap = {
                    'NEW': '#28a745',
                    'MODIFIED': '#043168',
                    'DELETED': '#dc3545'
                };
                const color = colorMap[type as keyof typeof colorMap] || '#043168';
                return <Tag color={color}>{type}</Tag>;
            },
        },
        {
            title: 'Item Code',
            dataIndex: 'item_code',
            key: 'item_code',
            width: 120,
            fixed: 'left' as const,
        },
        {
            title: 'Brand',
            dataIndex: 'brand_name',
            key: 'brand_name',
            width: 150,
            ellipsis: {
                showTitle: false,
            },
            render: (text: string) => (
                <Tooltip placement="topLeft" title={text}>
                    {text}
                </Tooltip>
            ),
        },
        {
            title: 'Field',
            dataIndex: 'field_name',
            key: 'field_name',
            width: 150,
        },
        {
            title: 'Current Value',
            dataIndex: 'current_value',
            key: 'current_value',
            width: 300,
            ellipsis: {
                showTitle: false,
            },
            render: (text: string) => (
                <Tooltip placement="topLeft" title={text} overlayStyle={{ maxWidth: '500px' }}>
                    <div style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxHeight: '100px',
                        overflow: 'auto'
                    }}>
                        {text}
                    </div>
                </Tooltip>
            ),
        },
        {
            title: 'New Value',
            dataIndex: 'new_value',
            key: 'new_value',
            width: 300,
            ellipsis: {
                showTitle: false,
            },
            render: (text: string) => (
                <Tooltip placement="topLeft" title={text} overlayStyle={{ maxWidth: '500px' }}>
                    <div style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxHeight: '100px',
                        overflow: 'auto'
                    }}>
                        {text}
                    </div>
                </Tooltip>
            ),
        },
    ];

    const newRecordsCount = differences.filter(d => d.change_type === 'NEW').length;
    const modifiedRecordsCount = differences.filter(d => d.change_type === 'MODIFIED').length;
    const deletedRecordsCount = differences.filter(d => d.change_type === 'DELETED').length;

    return (
        <div className="page-container">
            <Card
                title="Data Management Operations"
            >
                <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 16, marginBottom: 16 }}>
                        Manage data team active items operations:
                    </p>
                </div>

                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Card type="inner" size="small" title="Upload New Data">
                        <p style={{ marginBottom: 8, fontSize: 14 }}>
                            Upload a new Excel file to the temporary table for review and comparison.
                        </p>
                        <Button
                            type="primary"
                            size="large"
                            icon={<UploadOutlined />}
                            onClick={() => navigate('/data-team-upload')}
                        >
                            Upload New Data
                        </Button>
                    </Card>

                    <Card type="inner" size="small" title="View Pending Changes">
                        <p style={{ marginBottom: 8, fontSize: 14 }}>
                            Review and apply changes from the temporary table to the main table.
                        </p>
                        <Button
                            size="large"
                            icon={<DiffOutlined />}
                            onClick={() => navigate('/items-new-changes')}
                        >
                            View Pending Changes
                        </Button>
                    </Card>

                    <Card type="inner" size="small" title="Clear Temporary Data">
                        <p style={{ marginBottom: 8, fontSize: 14 }}>
                            Clear all data from the temporary table. This action cannot be undone.
                        </p>
                        <Button
                            danger
                            size="large"
                            icon={<DeleteOutlined />}
                            onClick={clearTempTable}
                        >
                            Clear Temp Table
                        </Button>
                    </Card>

                    <Card type="inner" size="small" title="Refresh UPC List">
                        <p style={{ marginBottom: 8, fontSize: 14 }}>
                            Refresh the UPC List table by extracting UPC data from the main data table.
                        </p>
                        <Button
                            type="primary"
                            size="large"
                            icon={<ReloadOutlined />}
                            onClick={refreshUPCList}
                        >
                            Refresh UPC List
                        </Button>
                    </Card>
                </Space>
            </Card>

            {/* Differences Modal */}
            <Modal
                title="Pending Changes"
                open={differencesModalVisible}
                onCancel={() => {
                    setDifferencesModalVisible(false);
                    setSelectedChanges([]);
                    setModalCurrentPage(1);
                    setModalPageSize(20);
                }}
                width={1400}
                footer={null}
                centered
            >
                {differences.length > 0 ? (
                    <>
                        <Space style={{ marginBottom: 16 }}>
                            <Tag color="green">New: {newRecordsCount}</Tag>
                            <Tag color="blue">Modified: {modifiedRecordsCount}</Tag>
                            <Tag color="red">Deleted: {deletedRecordsCount}</Tag>
                        </Space>

                        <Table
                            columns={comparisonColumns}
                            dataSource={differences}
                            rowKey={(record) => `${record.change_type}|||${record.item_code}|||${record.field_name}`}
                            pagination={{
                                current: modalCurrentPage,
                                pageSize: modalPageSize,
                                showSizeChanger: true,
                                showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} of ${total} changes`,
                                pageSizeOptions: ['10', '20', '50', '100'],
                                showQuickJumper: true,
                                onChange: (page: number, newPageSize: number) => {
                                    setModalCurrentPage(page);
                                    if (newPageSize !== modalPageSize) {
                                        setModalPageSize(newPageSize);
                                        setModalCurrentPage(1);
                                    }
                                },
                                onShowSizeChange: (current: number, size: number) => {
                                    setModalPageSize(size);
                                    setModalCurrentPage(1);
                                },
                            }}
                            scroll={{ x: 1400, y: 400 }}
                            rowSelection={{
                                selectedRowKeys: selectedChanges,
                                onChange: (keys) => setSelectedChanges(keys as string[]),
                            }}
                            loading={loadingDifferences}
                        />

                        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Button onClick={() => {
                                setDifferencesModalVisible(false);
                                setSelectedChanges([]);
                                setModalCurrentPage(1);
                                setModalPageSize(20);
                            }}>Close</Button>
                            <Space>
                                <Button
                                    type="default"
                                    onClick={() => applyChanges(true)}
                                    loading={loadingDifferences}
                                    disabled={differences.length === 0}
                                >
                                    Apply All Changes ({differences.length})
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={() => applyChanges(false)}
                                    loading={loadingDifferences}
                                    disabled={selectedChanges.length === 0}
                                >
                                    Apply Selected Changes ({selectedChanges.length})
                                </Button>
                            </Space>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <p style={{ fontSize: 16, color: '#8c8c8c' }}>
                            {loadingDifferences ? 'Loading differences...' : 'No differences found between temp and main tables.'}
                        </p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ItemsNewOperationsPage;
