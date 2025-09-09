import React, { useState, useEffect } from 'react';
import { Card, Form, Upload, Input, Checkbox, Button, Progress, Alert, Space, List, Table, App } from 'antd';
import { UploadOutlined, InboxOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import axios from 'axios';
import { authService } from '../services/authService';

const API_URL = import.meta.env.VITE_API_URL_LOCAL || 'http://localhost:3000/api';

interface VendorUploadResult {
    success: boolean;
    totalRows: number;
    validRows: number;
    skippedRows: number;
    skippedRowIndices?: number[];
    successfulRows: number;
    failedRows: number;
    errors?: Array<{ batch: string; error: string }>;
    preview?: Array<any>;
}

const VendorItemsUploadPage: React.FC = () => {
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');
    const [progressRows, setProgressRows] = useState({ current: 0, total: 0 });
    const [result, setResult] = useState<VendorUploadResult | null>(null);
    const [fileList, setFileList] = useState<any[]>([]);

    useEffect(() => {
        let eventSource: EventSource | null = null;

        if (uploading) {
            const token = authService.getToken();
            eventSource = new EventSource(`${API_URL}/vendor-upload-progress?token=${token}`);

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.current && data.total) {
                    const percent = Math.round((data.current / data.total) * 100);
                    setProgress(percent);
                    setProgressRows({ current: data.current, total: data.total });
                }

                if (data.message) {
                    setProgressMessage(data.message);
                }
            };

            eventSource.onerror = () => {
                eventSource?.close();
            };
        }

        return () => {
            eventSource?.close();
        };
    }, [uploading]);

    const handleUpload = async (values: any) => {
        if (fileList.length === 0) {
            message.error('Please select a file to upload');
            return;
        }

        const formData = new FormData();
        formData.append('excelFile', fileList[0]);
        formData.append('sheetName', values.sheetName || '');
        formData.append('clearTable', values.clearTable ? 'true' : 'false');

        setUploading(true);
        setProgress(0);
        setResult(null);
        setProgressMessage('Initializing...');

        try {
            const token = authService.getToken();
            const response = await axios.post(`${API_URL}/upload-vendor-items-temp`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                setResult(response.data);
                message.success('Upload completed successfully!');
            } else {
                throw new Error(response.data.error || 'Upload failed');
            }
        } catch (error: any) {
            message.error(error.message || 'Failed to upload file');
            setResult({
                success: false,
                totalRows: 0,
                validRows: 0,
                skippedRows: 0,
                successfulRows: 0,
                failedRows: 0,
                errors: [{ batch: 'Upload', error: error.message }],
            });
        } finally {
            setUploading(false);
            setFileList([]);
            form.resetFields();
        }
    };

    const uploadProps: UploadProps = {
        accept: '.xlsx,.xls',
        maxCount: 1,
        beforeUpload: (file) => {
            setFileList([file]);
            return false; // Prevent automatic upload
        },
        onRemove: () => {
            setFileList([]);
        },
        fileList,
    };

    const previewColumns = [
        { title: 'ID', dataIndex: 'ID', key: 'ID', width: 80 },
        { title: 'Vendor Item', dataIndex: 'vendor_item', key: 'vendor_item', ellipsis: true },
        { title: 'Vendor Name', dataIndex: 'vendor_name', key: 'vendor_name', ellipsis: true },
        { title: 'Brand Name', dataIndex: 'brand_name', key: 'brand_name', ellipsis: true },
        { title: 'Dynarex Item', dataIndex: 'dynrex_item', key: 'dynrex_item', ellipsis: true },
        { title: 'Description', dataIndex: 'description1', key: 'description1', ellipsis: true },
    ];

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card
                title="Upload Excel File to vendor_items_temp"
                variant="borderless"
                style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpload}
                    disabled={uploading}
                >
                    <Form.Item
                        label="Select Excel File (.xlsx, .xls)"
                        rules={[{ required: true, message: 'Please select a file' }]}
                    >
                        <Upload.Dragger {...uploadProps}>
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                            </p>
                            <p className="ant-upload-text">Click or drag file to this area to upload</p>
                            <p className="ant-upload-hint">
                                Excel data will be saved by column position. Rows missing data in the 4th column will be skipped.
                            </p>
                        </Upload.Dragger>
                    </Form.Item>

                    <Form.Item
                        name="sheetName"
                        label="Sheet Name (leave empty for first sheet)"
                    >
                        <Input placeholder="Optional: Specific sheet name" />
                    </Form.Item>

                    <Form.Item name="clearTable" valuePropName="checked">
                        <Checkbox>Clear existing data before upload</Checkbox>
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<UploadOutlined />}
                            loading={uploading}
                            size="large"
                            block
                        >
                            Upload to vendor_items_temp
                        </Button>
                    </Form.Item>
                </Form>

                {uploading && (
                    <div style={{ marginTop: 24 }}>
                        <Progress
                            percent={progress}
                            status="active"
                            strokeColor={{
                                '0%': '#108ee9',
                                '100%': '#87d068',
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                            <span>{progressMessage}</span>
                            {progressRows.total > 0 && (
                                <span>{progressRows.current} / {progressRows.total} rows</span>
                            )}
                        </div>
                    </div>
                )}

                {result && (
                    <div style={{ marginTop: 24 }}>
                        <h3>Upload Results</h3>
                        {result.success ? (
                            <Alert
                                message="Success!"
                                description={
                                    <div>
                                        <p>Total rows found: {result.totalRows}</p>
                                        <p><CheckCircleOutlined style={{ color: '#52c41a' }} /> {result.validRows} valid rows (with data in 4th column)</p>
                                        <p><CheckCircleOutlined style={{ color: '#52c41a' }} /> {result.successfulRows} rows imported successfully</p>
                                        {result.skippedRows > 0 && (
                                            <p style={{ color: '#faad14' }}>⚠️ {result.skippedRows} rows skipped (missing 4th column)</p>
                                        )}
                                        {result.failedRows > 0 && (
                                            <p><CloseCircleOutlined style={{ color: '#f5222d' }} /> {result.failedRows} rows failed</p>
                                        )}
                                    </div>
                                }
                                type="success"
                                showIcon
                            />
                        ) : (
                            <Alert
                                message="Upload Failed"
                                type="error"
                                showIcon
                            />
                        )}

                        {result.skippedRowIndices && result.skippedRowIndices.length > 0 && (
                            <Alert
                                message="Skipped Row Numbers:"
                                description={
                                    <div>
                                        <p>The following Excel rows were skipped because they had no data in the 4th column:</p>
                                        <p>{result.skippedRowIndices.join(', ')}{result.skippedRows > 10 ? ' ...' : ''}</p>
                                        {result.skippedRows > 10 && (
                                            <p><em>({result.skippedRows - 10} more rows skipped)</em></p>
                                        )}
                                    </div>
                                }
                                type="info"
                                style={{ marginTop: 16 }}
                            />
                        )}

                        {result.errors && result.errors.length > 0 && (
                            <Alert
                                message="Errors encountered:"
                                description={
                                    <List
                                        size="small"
                                        dataSource={result.errors}
                                        renderItem={(error) => (
                                            <List.Item>
                                                <span style={{ color: '#f5222d' }}>
                                                    {error.batch}: {error.error}
                                                </span>
                                            </List.Item>
                                        )}
                                    />
                                }
                                type="warning"
                                style={{ marginTop: 16 }}
                            />
                        )}

                        {result.preview && result.preview.length > 0 && (
                            <Card
                                title="Last 5 imported rows"
                                size="small"
                                style={{ marginTop: 16 }}
                            >
                                <Table
                                    columns={previewColumns}
                                    dataSource={result.preview}
                                    rowKey="ID"
                                    pagination={false}
                                    size="small"
                                    scroll={{ x: 800 }}
                                />
                            </Card>
                        )}
                    </div>
                )}
            </Card>

            <Card
                title="Processing Rules"
                variant="borderless"
                style={{
                    borderRadius: 8,
                    borderLeft: '4px solid #52c41a',
                    backgroundColor: '#f6ffed'
                }}
            >
                <List
                    size="small"
                    dataSource={[
                        'Data is mapped by column position: Column A → column1, Column B → column2, etc.',
                        'Rows that have no data in the 4th column (Column D) will be skipped entirely',
                        'Empty cells are saved as NULL in the database',
                        'All data is stored as text (NVARCHAR) in columns column1 through column26',
                        'Table vendor_items_temp will be created automatically if it doesn\'t exist'
                    ]}
                    renderItem={(item) => (
                        <List.Item>
                            <span style={{ color: '#555' }}>• {item}</span>
                        </List.Item>
                    )}
                />
            </Card>
        </Space>
    );
};

export default VendorItemsUploadPage;