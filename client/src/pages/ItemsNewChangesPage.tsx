// src/pages/ItemsNewChangesPage.tsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Space, App, Table, Tag, Tooltip, Spin, Radio, Collapse, Alert, Badge } from 'antd';
import { ReloadOutlined, CheckOutlined, CloseOutlined, AppstoreOutlined, UnorderedListOutlined, DownloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';

import { API_CONFIG } from '../config/api.config';

const { Panel } = Collapse;

// Helper function to detect whitespace issues
const detectWhitespaceIssue = (text: string): { hasLeading: boolean; hasTrailing: boolean; length: number; trimmedLength: number } => {
    if (!text) return { hasLeading: false, hasTrailing: false, length: 0, trimmedLength: 0 };
    return {
        hasLeading: text.length > 0 && text[0] === ' ',
        hasTrailing: text.length > 0 && text[text.length - 1] === ' ',
        length: text.length,
        trimmedLength: text.trim().length
    };
};

// Helper function to visualize whitespace
const visualizeWhitespace = (text: string): string => {
    if (!text) return text;
    return text
        .replace(/^ +/, (match) => `⎵`.repeat(match.length)) // Leading spaces
        .replace(/ +$/, (match) => `⎵`.repeat(match.length)) // Trailing spaces
        .replace(/\t/g, '→'); // Tabs
};

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

type ViewMode = 'change-type' | 'item';

const ItemsNewChangesPage: React.FC = () => {
    const { modal, message } = App.useApp();
    const [differences, setDifferences] = useState<ComparisonRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedChanges, setSelectedChanges] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [viewMode, setViewMode] = useState<ViewMode>('change-type');
    const navigate = useNavigate();

    useEffect(() => {
        fetchDifferences();
    }, []);

    const fetchDifferences = async (showMessage: boolean = false) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_CONFIG.BASE_URL}/compare-data-team`);
            if (response.data.success) {
                setDifferences(response.data.differences);
                if (showMessage) {
                    if (response.data.differences.length === 0) {
                        message.info('No pending changes found');
                    } else {
                        message.success(`Found ${response.data.differences.length} pending changes`);
                    }
                }
            } else {
                message.error('Failed to fetch comparison data');
            }
        } catch (error: any) {
            console.error('Comparison error:', error);
            message.error(error.response?.data?.error || 'Failed to compare data');
        } finally {
            setLoading(false);
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
        setLoading(true);
        try {
            const response = await axios.post(
                `${API_CONFIG.BASE_URL}/apply-data-team-changes`,
                { changeIds }
            );

            if (response.data.success) {
                message.success(`Successfully applied ${response.data.appliedCount} changes`);
                setSelectedChanges([]);
                setLoading(false);

                // Ask if user wants to delete the temp table
                modal.confirm({
                    title: 'Delete Temp Table?',
                    content: 'You have successfully applied the changes. Are you done with all changes and ready to delete the temp table?',
                    okText: 'Yes, Delete Temp Table',
                    okType: 'danger',
                    cancelText: 'No, Keep Temp Table',
                    onOk: async () => {
                        await deleteTempTable();
                    },
                    onCancel: async () => {
                        // Refresh to show remaining differences
                        await fetchDifferences();
                    }
                });
            } else {
                message.error('Failed to apply changes');
                setLoading(false);
            }
        } catch (error: any) {
            console.error('Apply changes error:', error);
            message.error(error.response?.data?.error || 'Failed to apply changes');
            setLoading(false);
        }
    };

    const deleteTempTable = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_CONFIG.BASE_URL}/delete-temp-table`);

            if (response.data.success) {
                message.success('Temp table deleted successfully');
                // Refresh to show empty state
                await fetchDifferences();
            } else {
                message.error('Failed to delete temp table');
            }
        } catch (error: any) {
            console.error('Delete temp table error:', error);
            message.error(error.response?.data?.error || 'Failed to delete temp table');
        } finally {
            setLoading(false);
        }
    };

    // Export to Excel function
    const exportToExcel = (data: ComparisonRecord[], filename: string) => {
        if (data.length === 0) {
            message.warning('No data to export');
            return;
        }

        // Prepare data for Excel
        const exportData = data.map(record => ({
            'Change Type': record.change_type,
            'Item Code': record.item_code,
            'Brand Name': record.brand_name,
            'Description': record.description1,
            'Field Name': record.field_name,
            'Current Value': record.current_value || '',
            'New Value': record.new_value || ''
        }));

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // Set column widths
        const columnWidths = [
            { wch: 15 }, // Change Type
            { wch: 15 }, // Item Code
            { wch: 20 }, // Brand Name
            { wch: 30 }, // Description
            { wch: 20 }, // Field Name
            { wch: 30 }, // Current Value
            { wch: 30 }  // New Value
        ];
        worksheet['!cols'] = columnWidths;

        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Changes');

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const fullFilename = `${filename}_${timestamp}.xlsx`;

        // Save file
        XLSX.writeFile(workbook, fullFilename);
        message.success(`Exported ${data.length} records to ${fullFilename}`);
    };

    // Comparison columns
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
            filters: [
                { text: 'NEW', value: 'NEW' },
                { text: 'MODIFIED', value: 'MODIFIED' },
                { text: 'DELETED', value: 'DELETED' },
            ],
            onFilter: (value: any, record: ComparisonRecord) => record.change_type === value,
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
            width: 350,
            ellipsis: {
                showTitle: false,
            },
            render: (text: string, record: ComparisonRecord) => {
                const wsInfo = detectWhitespaceIssue(text);
                const hasWhitespaceIssue = wsInfo.hasLeading || wsInfo.hasTrailing;
                const visualizedText = hasWhitespaceIssue ? visualizeWhitespace(text) : text;

                return (
                    <div>
                        <Tooltip
                            placement="topLeft"
                            title={
                                <div>
                                    <div>Original: {text}</div>
                                    {hasWhitespaceIssue && (
                                        <>
                                            <div>Length: {wsInfo.length} chars</div>
                                            <div>Trimmed: {wsInfo.trimmedLength} chars</div>
                                            {wsInfo.hasLeading && <div style={{ color: '#faad14' }}>⚠ Has leading spaces</div>}
                                            {wsInfo.hasTrailing && <div style={{ color: '#faad14' }}>⚠ Has trailing spaces</div>}
                                        </>
                                    )}
                                </div>
                            }
                            overlayStyle={{ maxWidth: '500px' }}
                        >
                            <div style={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                maxHeight: '100px',
                                overflow: 'auto',
                                position: 'relative'
                            }}>
                                {hasWhitespaceIssue && (
                                    <InfoCircleOutlined
                                        style={{
                                            color: '#faad14',
                                            marginRight: 4,
                                            fontSize: '12px'
                                        }}
                                    />
                                )}
                                <span style={{ fontFamily: hasWhitespaceIssue ? 'monospace' : 'inherit' }}>
                                    {visualizedText}
                                </span>
                                {hasWhitespaceIssue && (
                                    <Badge
                                        count={wsInfo.length}
                                        style={{
                                            backgroundColor: '#faad14',
                                            marginLeft: 8,
                                            fontSize: '10px'
                                        }}
                                        title="Character count with whitespace"
                                    />
                                )}
                            </div>
                        </Tooltip>
                    </div>
                );
            },
        },
        {
            title: 'New Value',
            dataIndex: 'new_value',
            key: 'new_value',
            width: 350,
            ellipsis: {
                showTitle: false,
            },
            render: (text: string, record: ComparisonRecord) => {
                const wsInfo = detectWhitespaceIssue(text);
                const hasWhitespaceIssue = wsInfo.hasLeading || wsInfo.hasTrailing;
                const visualizedText = hasWhitespaceIssue ? visualizeWhitespace(text) : text;

                return (
                    <div>
                        <Tooltip
                            placement="topLeft"
                            title={
                                <div>
                                    <div>New value: {text}</div>
                                    {hasWhitespaceIssue && (
                                        <>
                                            <div>Length: {wsInfo.length} chars</div>
                                            <div>Trimmed: {wsInfo.trimmedLength} chars</div>
                                            {wsInfo.hasLeading && <div style={{ color: '#faad14' }}>⚠ Has leading spaces</div>}
                                            {wsInfo.hasTrailing && <div style={{ color: '#faad14' }}>⚠ Has trailing spaces</div>}
                                        </>
                                    )}
                                </div>
                            }
                            overlayStyle={{ maxWidth: '500px' }}
                        >
                            <div style={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                maxHeight: '100px',
                                overflow: 'auto',
                                backgroundColor: record.change_type === 'MODIFIED' ? 'rgba(4, 49, 104, 0.08)' : 'transparent',
                                padding: hasWhitespaceIssue ? '4px' : '0'
                            }}>
                                {hasWhitespaceIssue && (
                                    <InfoCircleOutlined
                                        style={{
                                            color: '#faad14',
                                            marginRight: 4,
                                            fontSize: '12px'
                                        }}
                                    />
                                )}
                                <span style={{ fontFamily: hasWhitespaceIssue ? 'monospace' : 'inherit' }}>
                                    {visualizedText}
                                </span>
                                {hasWhitespaceIssue && (
                                    <Badge
                                        count={wsInfo.length}
                                        style={{
                                            backgroundColor: '#faad14',
                                            marginLeft: 8,
                                            fontSize: '10px'
                                        }}
                                        title="Character count with whitespace"
                                    />
                                )}
                            </div>
                        </Tooltip>
                    </div>
                );
            },
        },
    ];

    const newRecordsCount = differences.filter(d => d.change_type === 'NEW').length;
    const modifiedRecordsCount = differences.filter(d => d.change_type === 'MODIFIED').length;
    const deletedRecordsCount = differences.filter(d => d.change_type === 'DELETED').length;

    // Group data by change type
    const groupedByChangeType = {
        NEW: differences.filter(d => d.change_type === 'NEW'),
        MODIFIED: differences.filter(d => d.change_type === 'MODIFIED'),
        DELETED: differences.filter(d => d.change_type === 'DELETED'),
    };

    // For MODIFIED, group by field name
    const modifiedByField = groupedByChangeType.MODIFIED.reduce((acc, record) => {
        const fieldName = record.field_name;
        if (!acc[fieldName]) {
            acc[fieldName] = [];
        }
        acc[fieldName].push(record);
        return acc;
    }, {} as Record<string, ComparisonRecord[]>);

    // Group data by item code
    const groupedByItem = differences.reduce((acc, record) => {
        const itemCode = record.item_code;
        if (!acc[itemCode]) {
            acc[itemCode] = [];
        }
        acc[itemCode].push(record);
        return acc;
    }, {} as Record<string, ComparisonRecord[]>);

    // Render Change Type View
    const renderChangeTypeView = () => {
        return (
            <Collapse style={{ marginTop: 16 }}>
                {/* NEW Records */}
                {groupedByChangeType.NEW.length > 0 && (
                    <Panel
                        header={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <Space>
                                    <Tag color="#28a745">NEW</Tag>
                                    <span>{groupedByChangeType.NEW.length} new items</span>
                                </Space>
                                <Button
                                    icon={<DownloadOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        exportToExcel(groupedByChangeType.NEW, 'new_items');
                                    }}
                                >
                                    Export to Excel
                                </Button>
                            </div>
                        }
                        key="NEW"
                    >
                        <Table
                            columns={comparisonColumns}
                            dataSource={groupedByChangeType.NEW}
                            rowKey={(record) => `${record.change_type}|||${record.item_code}|||${record.field_name}`}
                            pagination={false}
                            scroll={{ x: 1400 }}
                            rowSelection={{
                                selectedRowKeys: selectedChanges,
                                onChange: (keys) => setSelectedChanges(keys as string[]),
                            }}
                            size="middle"
                        />
                    </Panel>
                )}

                {/* MODIFIED Records - Grouped by Field */}
                {groupedByChangeType.MODIFIED.length > 0 && (
                    <Panel
                        header={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <Space>
                                    <Tag color="#043168">MODIFIED</Tag>
                                    <span>{groupedByChangeType.MODIFIED.length} modifications</span>
                                </Space>
                                <Button
                                    icon={<DownloadOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        exportToExcel(groupedByChangeType.MODIFIED, 'modified_items');
                                    }}
                                >
                                    Export to Excel
                                </Button>
                            </div>
                        }
                        key="MODIFIED"
                    >
                        <Collapse>
                            {Object.entries(modifiedByField).map(([fieldName, records]) => (
                                <Panel
                                    header={
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                            <Space>
                                                <span style={{ fontWeight: 500 }}>{fieldName}</span>
                                                <Tag color="#043168">{records.length} changes</Tag>
                                            </Space>
                                            <Button
                                                icon={<DownloadOutlined />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    exportToExcel(records, `modified_${fieldName.toLowerCase().replace(/\s+/g, '_')}`);
                                                }}
                                            >
                                                Export
                                            </Button>
                                        </div>
                                    }
                                    key={fieldName}
                                >
                                    <Table
                                        columns={comparisonColumns}
                                        dataSource={records}
                                        rowKey={(record) => `${record.change_type}|||${record.item_code}|||${record.field_name}`}
                                        pagination={false}
                                        scroll={{ x: 1400 }}
                                        rowSelection={{
                                            selectedRowKeys: selectedChanges,
                                            onChange: (keys) => setSelectedChanges(keys as string[]),
                                        }}
                                        size="middle"
                                    />
                                </Panel>
                            ))}
                        </Collapse>
                    </Panel>
                )}

                {/* DELETED Records */}
                {groupedByChangeType.DELETED.length > 0 && (
                    <Panel
                        header={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <Space>
                                    <Tag color="#dc3545">DELETED</Tag>
                                    <span>{groupedByChangeType.DELETED.length} items to be deleted</span>
                                </Space>
                                <Button
                                    icon={<DownloadOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        exportToExcel(groupedByChangeType.DELETED, 'deleted_items');
                                    }}
                                >
                                    Export to Excel
                                </Button>
                            </div>
                        }
                        key="DELETED"
                    >
                        <Table
                            columns={comparisonColumns}
                            dataSource={groupedByChangeType.DELETED}
                            rowKey={(record) => `${record.change_type}|||${record.item_code}|||${record.field_name}`}
                            pagination={false}
                            scroll={{ x: 1400 }}
                            rowSelection={{
                                selectedRowKeys: selectedChanges,
                                onChange: (keys) => setSelectedChanges(keys as string[]),
                            }}
                            size="middle"
                        />
                    </Panel>
                )}
            </Collapse>
        );
    };

    // Render Item View
    const renderItemView = () => {
        const sortedItems = Object.entries(groupedByItem).sort(([a], [b]) => a.localeCompare(b));

        return (
            <Collapse style={{ marginTop: 16 }}>
                {sortedItems.map(([itemCode, records]) => {
                    const changeTypes = [...new Set(records.map(r => r.change_type))];
                    const brandName = records[0]?.brand_name || 'N/A';

                    return (
                        <Panel
                            header={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <Space>
                                        <span style={{ fontWeight: 500 }}>{itemCode}</span>
                                        <span style={{ color: '#666' }}>({brandName})</span>
                                        {changeTypes.map(type => {
                                            const colorMap = {
                                                'NEW': '#28a745',
                                                'MODIFIED': '#043168',
                                                'DELETED': '#dc3545'
                                            };
                                            const color = colorMap[type as keyof typeof colorMap] || '#043168';
                                            const count = records.filter(r => r.change_type === type).length;
                                            return <Tag key={type} color={color}>{type} ({count})</Tag>;
                                        })}
                                    </Space>
                                    <Button
                                        icon={<DownloadOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            exportToExcel(records, `item_${itemCode}`);
                                        }}
                                    >
                                        Export
                                    </Button>
                                </div>
                            }
                            key={itemCode}
                        >
                            <Table
                                columns={comparisonColumns}
                                dataSource={records}
                                rowKey={(record) => `${record.change_type}|||${record.item_code}|||${record.field_name}`}
                                pagination={false}
                                scroll={{ x: 1400 }}
                                rowSelection={{
                                    selectedRowKeys: selectedChanges,
                                    onChange: (keys) => setSelectedChanges(keys as string[]),
                                }}
                                size="middle"
                            />
                        </Panel>
                    );
                })}
            </Collapse>
        );
    };

    return (
        <div className="page-container">
            <Card
                title="View Pending Changes"
                extra={
                    <Space>
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={() => exportToExcel(differences, 'all_pending_changes')}
                            disabled={differences.length === 0}
                        >
                            Export All
                        </Button>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => fetchDifferences(true)}
                            loading={loading}
                        >
                            Refresh
                        </Button>
                    </Space>
                }
            >
                <Alert
                    message={
                        <Space>
                            <InfoCircleOutlined />
                            <span>Whitespace Detection</span>
                        </Space>
                    }
                    description={
                        <div>
                            <p style={{ marginBottom: 8 }}>When values contain leading or trailing spaces, they will be highlighted with:</p>
                            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                                <li><strong>⎵</strong> symbol - Represents spaces that would otherwise be invisible</li>
                                <li><InfoCircleOutlined style={{ color: '#faad14' }} /> Warning icon - Indicates whitespace detected</li>
                                <li><Badge count={35} style={{ backgroundColor: '#faad14' }} /> Character count - Shows total length including whitespace</li>
                                <li>Hover over values to see detailed whitespace information</li>
                            </ul>
                        </div>
                    }
                    type="warning"
                    showIcon
                    closable
                    style={{ marginBottom: 16 }}
                />

                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                        <Tag color="#28a745">New: {newRecordsCount}</Tag>
                        <Tag color="#043168">Modified: {modifiedRecordsCount}</Tag>
                        <Tag color="#dc3545">Deleted: {deletedRecordsCount}</Tag>
                        <Tag color="#043168" style={{ background: '#ffffff', borderColor: '#043168', color: '#043168' }}>Total: {differences.length}</Tag>
                    </Space>

                    <Radio.Group
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                        buttonStyle="solid"
                    >
                        <Radio.Button value="change-type">
                            <AppstoreOutlined /> Group by Change Type
                        </Radio.Button>
                        <Radio.Button value="item">
                            <UnorderedListOutlined /> Group by Item
                        </Radio.Button>
                    </Radio.Group>
                </div>

                <Spin spinning={loading}>
                    {differences.length > 0 ? (
                        <>
                            {viewMode === 'change-type' ? renderChangeTypeView() : renderItemView()}

                            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <Space>
                                    <Button
                                        type="default"
                                        size="large"
                                        onClick={() => applyChanges(true)}
                                        loading={loading}
                                        disabled={differences.length === 0}
                                        icon={<CheckOutlined />}
                                    >
                                        Apply All Changes ({differences.length})
                                    </Button>
                                    <Button
                                        type="primary"
                                        size="large"
                                        onClick={() => applyChanges(false)}
                                        loading={loading}
                                        disabled={selectedChanges.length === 0}
                                        icon={<CheckOutlined />}
                                    >
                                        Apply Selected Changes ({selectedChanges.length})
                                    </Button>
                                </Space>
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 60 }}>
                            <CloseOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                            <p style={{ fontSize: 16, color: '#8c8c8c' }}>
                                No pending changes found between temp and main tables.
                            </p>
                            <p style={{ fontSize: 14, color: '#bfbfbf', marginTop: 8 }}>
                                Upload new data to see pending changes here.
                            </p>
                            <Button
                                type="primary"
                                style={{ marginTop: 16 }}
                                onClick={() => navigate('/items-new-operations')}
                            >
                                Go to Operations
                            </Button>
                        </div>
                    )}
                </Spin>
            </Card>
        </div>
    );
};

export default ItemsNewChangesPage;
